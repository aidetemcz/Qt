import type {
  QuizAnswer,
  SlideConfig,
  SlideElement,
  SlideQuiz,
} from "@/lib/presentations";

/** Character limits so authored text stays within the slide frame. */
export const HEADING_MAX = 120;
export const BODY_MAX = 800;
export const QUESTION_MAX = 200;
export const ANSWER_MAX = 80;
export const QUIZ_MAX_ANSWERS = 4;

/** Colour and shape of each answer slot, shared by the editor and the view. */
export const QUIZ_ANSWER_STYLES = [
  { color: "#dc5b5b", glyph: "▲" },
  { color: "#5f8794", glyph: "◆" },
  { color: "#d9913d", glyph: "●" },
  { color: "#4f8f60", glyph: "■" },
];

/** An empty quiz, used when a quiz slide has no content yet. */
export function emptyQuiz(): SlideQuiz {
  return {
    question: "",
    answers: ["a", "b", "c", "d"].map((id) => ({ id, text: "" })),
  };
}

/** The answer slots of a quiz, capped at the number of styled slots. */
export function getQuizAnswers(quiz: SlideQuiz): QuizAnswer[] {
  return (quiz.answers ?? []).slice(0, QUIZ_MAX_ANSWERS);
}

/** Kvíz i anketa: stejná otázka a dlaždice, liší se jen správnou odpovědí. */
export type InteractionKind = "quiz" | "poll";
export interface SlideInteraction extends SlideQuiz {
  kind: InteractionKind;
}

/** Otázka slidu, ať už je to kvíz nebo anketa. */
export function getInteraction(config: SlideConfig): SlideInteraction | null {
  if (config.quiz) {
    return { kind: "quiz", ...config.quiz };
  }
  if (config.poll) {
    return { kind: "poll", ...config.poll };
  }
  return null;
}

/** Font size bounds, in px on the 960×540 slide base. */
export const MIN_SIZE = 10;
export const MAX_SIZE = 300;
export const DEFAULT_HEADING_SIZE = 60;
export const DEFAULT_BODY_SIZE = 32;

export const SLIDE_W = 960;
export const SLIDE_H = 540;

/** px on the slide base → container-query width units. */
export function cqw(px: number): string {
  return `${((px * 100) / SLIDE_W).toFixed(4)}cqw`;
}
/** px on the slide base → container-query height units. */
export function cqh(px: number): string {
  return `${((px * 100) / SLIDE_H).toFixed(4)}cqh`;
}

/** Resolve a slide's text boxes, migrating the legacy heading/body fields. */
export function getElements(config: SlideConfig): SlideElement[] {
  // Once the elements model is in use, trust it even when empty — otherwise
  // clearing a slide would fall back to the legacy heading/body and "reset".
  if (Array.isArray(config.elements)) {
    return config.elements;
  }
  const elements: SlideElement[] = [];
  let y = 64;
  if (config.heading) {
    const fontSize = config.headingSize ?? DEFAULT_HEADING_SIZE;
    elements.push({
      id: "legacy-heading",
      kind: "heading",
      text: config.heading,
      x: 64,
      y,
      w: SLIDE_W - 128,
      fontSize,
    });
    y += fontSize + 28;
  }
  if (config.body) {
    elements.push({
      id: "legacy-body",
      kind: "body",
      text: config.body,
      x: 64,
      y,
      w: SLIDE_W - 128,
      fontSize: config.bodySize ?? DEFAULT_BODY_SIZE,
    });
  }
  return elements;
}

export function elementClass(kind: SlideElement["kind"]): string {
  return kind === "heading" ? "font-bold leading-tight" : "leading-snug";
}

/** Default text colour when an element has none set. */
export function defaultColor(kind: SlideElement["kind"]): string {
  return kind === "heading" ? "#241d1a" : "#4b423d";
}

/** Inline styles shared by the read-only view and the editor canvas. */
export function elementStyle(el: SlideElement): React.CSSProperties {
  return {
    color: el.color ?? defaultColor(el.kind),
    fontWeight: el.bold ? 800 : el.kind === "heading" ? 700 : 400,
    textAlign: el.textAlign ?? "left",
  };
}

/**
 * Read-only rendering of a quiz: the question on a card, the answers in a grid
 * of coloured tiles. Empty answer slots are left out, so a two-option question
 * shows two tiles. Which answer is correct stays hidden unless `showCorrect`.
 */
function QuizLayer({
  quiz,
  showCorrect,
  answerCounts,
}: {
  quiz: SlideQuiz;
  showCorrect: boolean;
  answerCounts?: Record<string, number>;
}) {
  const answers = getQuizAnswers(quiz).filter((a) => a.text.trim());
  return (
    <div
      className="absolute inset-0 flex flex-col"
      style={{ padding: cqw(36), gap: cqh(24) }}
    >
      <div
        className="flex flex-1 items-center justify-center rounded-2xl bg-white/95 text-center font-bold text-[#241d1a] shadow-sm"
        style={{ padding: cqw(24), fontSize: cqw(46), lineHeight: 1.15 }}
      >
        <span className="line-clamp-3 break-words">
          {quiz.question || "Otázka"}
        </span>
      </div>

      {answers.length > 0 && (
        <div
          className="grid grid-cols-2"
          style={{
            gap: cqw(14),
            height: cqh(210),
            gridTemplateRows: answers.length > 2 ? "1fr 1fr" : "1fr",
          }}
        >
          {answers.map((answer, index) => {
            const style = QUIZ_ANSWER_STYLES[index % QUIZ_ANSWER_STYLES.length];
            return (
              <div
                key={answer.id}
                className="flex items-center overflow-hidden rounded-xl font-semibold text-white"
                style={{
                  background: style.color,
                  gap: cqw(12),
                  padding: cqw(14),
                  fontSize: cqw(26),
                  // Once revealed, the wrong options step back.
                  opacity: showCorrect && !answer.correct ? 0.4 : 1,
                }}
              >
                <span style={{ fontSize: cqw(22) }}>{style.glyph}</span>
                <span className="min-w-0 break-words">{answer.text}</span>
                <span
                  className="ml-auto flex shrink-0 items-center"
                  style={{ gap: cqw(8) }}
                >
                  {answerCounts && (
                    <span
                      className="rounded-full bg-black/25 font-bold"
                      style={{
                        padding: `${cqh(4)} ${cqw(12)}`,
                        fontSize: cqw(22),
                      }}
                    >
                      {answerCounts[answer.id] ?? 0}
                    </span>
                  )}
                  {showCorrect && answer.correct && (
                    <span style={{ fontSize: cqw(26) }}>✓</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Canonical read-only rendering of a slide. Each text box is absolutely
 * positioned in a 16:9 query container, with position, width and font size in
 * container-query units so the slide scales identically wherever it is shown.
 * Long words wrap and overflow is clipped, so text can never escape the frame.
 */
export default function SlideView({
  config,
  showCorrect = false,
  answerCounts,
}: {
  config: SlideConfig;
  /** Reveal which quiz answer is correct. Off everywhere but the editor. */
  showCorrect?: boolean;
  /** Počty hlasů podle id odpovědi. Ukazuje je jen přednášející. */
  answerCounts?: Record<string, number>;
}) {
  const elements = getElements(config);
  const interaction = getInteraction(config);
  return (
    <div
      className="relative aspect-video w-full overflow-hidden rounded-xl shadow-sm"
      style={{
        containerType: "size",
        background: config.background ?? "#ffffff",
      }}
    >
      {config.image?.src && (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary user URLs
        <img
          src={config.image.src}
          alt=""
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full select-none"
          style={{ objectFit: config.image.fit ?? "cover" }}
        />
      )}
      {interaction && (
        <QuizLayer
          quiz={interaction}
          // Anketa žádnou správnou odpověď nemá, není co odkrývat.
          showCorrect={showCorrect && interaction.kind === "quiz"}
          answerCounts={answerCounts}
        />
      )}
      {!interaction && elements.length === 0 && !config.image?.src && (
        <div
          className="absolute inset-0 flex items-center justify-center text-neutral-400"
          style={{ fontSize: cqw(28) }}
        >
          Prázdný slide
        </div>
      )}
      {elements.map((el) => (
        <div
          key={el.id}
          className={`absolute whitespace-pre-wrap break-words ${elementClass(el.kind)}`}
          style={{
            left: cqw(el.x),
            top: cqh(el.y),
            maxWidth: cqw(SLIDE_W - el.x),
            fontSize: cqw(el.fontSize),
            ...elementStyle(el),
          }}
        >
          {el.text}
        </div>
      ))}
    </div>
  );
}
