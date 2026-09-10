import type {
  QuizAnswer,
  SlideConfig,
  SlideElement,
  SlideQa,
  SlideQuiz,
  SlideScale,
  SlideWordCloud,
} from "@/lib/presentations";

/** Character limits so authored text stays within the slide frame. */
export const HEADING_MAX = 120;
export const BODY_MAX = 800;
export const QUESTION_MAX = 200;
export const ANSWER_MAX = 80;
export const QUIZ_MAX_ANSWERS = 6;
export const QUIZ_MIN_ANSWERS = 2;

/** Colour and shape of each answer slot, shared by the editor and the view. */
export const QUIZ_ANSWER_STYLES = [
  { color: "#dc5b5b", glyph: "▲" },
  { color: "#5f8794", glyph: "◆" },
  { color: "#d9913d", glyph: "●" },
  { color: "#4f8f60", glyph: "■" },
  { color: "#7a5ea8", glyph: "★" },
  { color: "#b5546f", glyph: "✚" },
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

/** Slovo v cloudu i s tím, kolikrát ho publikum poslalo. */
export interface CloudWord {
  text: string;
  count: number;
}

/** Kolik slov se na slide vejde, než začne být nečitelný. */
export const CLOUD_MAX_WORDS = 40;
export const WORD_MAX = 40;
export const WORDS_PER_PARTICIPANT = 3;

/** Otázky od publika: delší text a míň kusů na obrazovku. */
export const QA_TEXT_MAX = 200;
export const QA_PER_PARTICIPANT = 3;
/** Do jednoho sloupce se vejde šest otázek, ve dvou dvanáct. */
export function qaPageSize(total: number): number {
  return total > 6 ? 12 : 6;
}
export function qaPageCount(total: number): number {
  return Math.max(1, Math.ceil(total / qaPageSize(total)));
}

/** Barvy slov pro světlé a pro tmavé pozadí. */
const CLOUD_COLORS_ON_LIGHT = [
  "#c24747",
  "#4a6f7c",
  "#b7752a",
  "#3d7a4c",
  "#241d1a",
];
const CLOUD_COLORS_ON_DARK = [
  "#f6c9c4",
  "#bcd7e0",
  "#f0c98a",
  "#a9d6b5",
  "#ffffff",
];

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) {
    return null;
  }
  const value = parseInt(match[1], 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

/** Relativní jas podle WCAG; slouží k porovnání kontrastu. */
function luminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    // Neznámý zápis (např. gradient) bereme jako světlý.
    return 1;
  }
  const channels = [rgb.r, rgb.g, rgb.b].map((raw) => {
    const c = raw / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(a: string, b: string): number {
  const first = luminance(a);
  const second = luminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

/** Tmavý nebo bílý text — podle toho, co je na daném pozadí čitelnější. */
export function inkOn(background: string): string {
  return contrast("#241d1a", background) >= 4.5 ? "#241d1a" : "#ffffff";
}

/**
 * Barvy slov vybrané k pozadí. Odstíny, které by na něm splynuly, vypadnou;
 * kdyby nezbyla žádná, použije se prostě čitelná barva textu.
 */
function cloudPalette(background: string): string[] {
  const base =
    luminance(background) > 0.45 ? CLOUD_COLORS_ON_LIGHT : CLOUD_COLORS_ON_DARK;
  const usable = base.filter((color) => contrast(color, background) >= 3);
  return usable.length > 0 ? usable : [inkOn(background)];
}

/**
 * Word cloud: zadání nahoře, pod ním slova od publika. Čím častější slovo,
 * tím větší — velikost se počítá vůči nejčastějšímu, ať cloud vypadá stejně
 * u pěti i u sta odpovědí.
 */
function WordCloudLayer({
  cloud,
  words,
  background,
}: {
  cloud: SlideWordCloud;
  words?: CloudWord[];
  background: string;
}) {
  const shown = (words ?? []).slice(0, CLOUD_MAX_WORDS);
  const max = shown.reduce((top, word) => Math.max(top, word.count), 0);
  const palette = cloudPalette(background);
  const ink = inkOn(background);
  return (
    <div
      className="absolute inset-0 flex flex-col"
      style={{ padding: cqw(36), gap: cqh(18) }}
    >
      <p
        className="line-clamp-2 text-center font-bold break-words"
        style={{ fontSize: cqw(38), lineHeight: 1.15, color: ink }}
      >
        {cloud.question || "Zadání"}
      </p>
      <div
        className="flex flex-1 flex-wrap content-center items-center justify-center overflow-hidden"
        style={{ gap: `${cqh(6)} ${cqw(18)}` }}
      >
        {shown.length === 0 ? (
          <span style={{ fontSize: cqw(24), color: ink, opacity: 0.55 }}>
            Slova se objeví, jak je publikum pošle.
          </span>
        ) : (
          shown.map((word, index) => (
            <span
              key={word.text}
              className="font-extrabold"
              style={{
                fontSize: cqw(24 + (word.count / Math.max(max, 1)) * 48),
                color: palette[index % palette.length],
              }}
            >
              {word.text}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

/** Hodnoty škály, tedy min..max včetně krajů. */
export function scaleValues(scale: SlideScale): number[] {
  const from = Math.round(scale.min);
  const to = Math.round(scale.max);
  const count = Math.max(2, Math.min(to - from + 1, 11));
  return Array.from({ length: count }, (_, index) => from + index);
}

/** Průměr voleb na škále, nebo null když ještě nikdo nehlasoval. */
export function scaleAverage(
  scale: SlideScale,
  counts?: Record<string, number>,
): number | null {
  if (!counts) {
    return null;
  }
  let sum = 0;
  let total = 0;
  for (const value of scaleValues(scale)) {
    const votes = counts[String(value)] ?? 0;
    sum += value * votes;
    total += votes;
  }
  return total > 0 ? sum / total : null;
}

/**
 * Škála: tvrzení nahoře, pod ním stupnice. Přednášejícímu navíc vyrostou
 * sloupce podle počtu voleb a dopíše se průměr.
 */
function ScaleLayer({
  scale,
  answerCounts,
  background,
}: {
  scale: SlideScale;
  answerCounts?: Record<string, number>;
  background: string;
}) {
  const values = scaleValues(scale);
  const top = values.reduce(
    (best, value) => Math.max(best, answerCounts?.[String(value)] ?? 0),
    0,
  );
  const average = scaleAverage(scale, answerCounts);
  const ink = inkOn(background);

  return (
    <div
      className="absolute inset-0 flex flex-col"
      style={{ padding: cqw(36), gap: cqh(18) }}
    >
      <div
        className="flex flex-1 items-center justify-center rounded-2xl bg-white/95 text-center font-bold text-[#241d1a] shadow-sm"
        style={{ padding: cqw(20), fontSize: cqw(40), lineHeight: 1.15 }}
      >
        <span className="line-clamp-3 break-words">
          {scale.question || "Tvrzení"}
        </span>
      </div>

      <div style={{ height: cqh(190) }} className="flex flex-col">
        <div className="flex flex-1 items-end" style={{ gap: cqw(10) }}>
          {values.map((value, index) => {
            const votes = answerCounts?.[String(value)] ?? 0;
            const style = QUIZ_ANSWER_STYLES[index % QUIZ_ANSWER_STYLES.length];
            return (
              <div
                key={value}
                className="flex flex-1 flex-col items-center justify-end"
                style={{ gap: cqh(6) }}
              >
                {answerCounts && (
                  <span style={{ fontSize: cqw(20), color: ink }}>
                    {votes > 0 ? votes : ""}
                  </span>
                )}
                <div
                  className="w-full rounded-lg"
                  style={{
                    background: style.color,
                    // Bez hlasů je z dlaždice aspoň podstavec se číslem.
                    height: answerCounts
                      ? cqh(28 + (top > 0 ? (votes / top) * 84 : 0))
                      : cqh(56),
                  }}
                />
                <span
                  className="font-extrabold"
                  style={{ fontSize: cqw(26), color: ink }}
                >
                  {value}
                </span>
              </div>
            );
          })}
        </div>

        <div
          className="flex items-center justify-between"
          style={{ marginTop: cqh(6) }}
        >
          <span style={{ fontSize: cqw(20), color: ink, opacity: 0.6 }}>
            {scale.minLabel ?? ""}
          </span>
          {average !== null && (
            <span
              className="font-bold"
              style={{ fontSize: cqw(22), color: ink }}
            >
              Průměr {average.toFixed(1).replace(".", ",")}
            </span>
          )}
          <span style={{ fontSize: cqw(20), color: ink, opacity: 0.6 }}>
            {scale.maxLabel ?? ""}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Otázky a odpovědi: zadání nahoře, pod ním otázky od publika. Vejde se jich
 * jen pár, takže se ukazují ty nejnovější a zbytek se jen spočítá.
 */
function QaLayer({
  qa,
  questions,
  page,
  background,
}: {
  qa: SlideQa;
  questions?: string[];
  /** Která stránka otázek se ukazuje; přednášející jimi listuje. */
  page: number;
  background: string;
}) {
  const all = questions ?? [];
  const size = qaPageSize(all.length);
  const pages = qaPageCount(all.length);
  const current = ((page % pages) + pages) % pages;
  const shown = all.slice(current * size, current * size + size);
  const twoColumns = size > 6;
  const ink = inkOn(background);
  const onDark = ink === "#ffffff";
  return (
    <div
      className="absolute inset-0 flex flex-col"
      style={{ padding: cqw(36), gap: cqh(14) }}
    >
      <p
        className="line-clamp-2 text-center font-bold break-words"
        style={{ fontSize: cqw(34), lineHeight: 1.15, color: ink }}
      >
        {qa.question || "Na co se chcete zeptat?"}
      </p>

      {shown.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <span style={{ fontSize: cqw(24), color: ink, opacity: 0.55 }}>
            Otázky se objeví, jak je publikum pošle.
          </span>
        </div>
      ) : (
        <div
          className="grid flex-1 content-start overflow-hidden"
          style={{
            gap: `${cqh(7)} ${cqw(14)}`,
            gridTemplateColumns: twoColumns ? "1fr 1fr" : "1fr",
          }}
        >
          {shown.map((text, index) => (
            <p
              key={`${current}-${index}-${text}`}
              className="line-clamp-2 rounded-xl break-words"
              style={{
                padding: `${cqh(7)} ${cqw(14)}`,
                fontSize: cqw(twoColumns ? 19 : 24),
                lineHeight: 1.25,
                color: ink,
                background: onDark
                  ? "rgb(255 255 255 / 0.12)"
                  : "rgb(36 29 26 / 0.06)",
              }}
            >
              {text}
            </p>
          ))}
        </div>
      )}

      {pages > 1 && (
        <p
          className="text-center"
          style={{ fontSize: cqw(18), color: ink, opacity: 0.55 }}
        >
          Strana {current + 1} z {pages}
        </p>
      )}
    </div>
  );
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
            gridTemplateRows: `repeat(${Math.ceil(answers.length / 2)}, 1fr)`,
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
  words,
  questions,
  questionPage = 0,
}: {
  config: SlideConfig;
  /** Reveal which quiz answer is correct. Off everywhere but the editor. */
  showCorrect?: boolean;
  /** Počty hlasů podle id odpovědi. Ukazuje je jen přednášející. */
  answerCounts?: Record<string, number>;
  /** Slova do word cloudu, seřazená od nejčastějšího. */
  words?: CloudWord[];
  /** Otázky od publika, od nejnovější. */
  questions?: string[];
  /** Stránka otázek, kterou přednášející právě ukazuje. */
  questionPage?: number;
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
      {config.wordcloud && (
        <WordCloudLayer
          cloud={config.wordcloud}
          words={words}
          background={config.background ?? "#ffffff"}
        />
      )}
      {config.scale && (
        <ScaleLayer
          scale={config.scale}
          answerCounts={answerCounts}
          background={config.background ?? "#ffffff"}
        />
      )}
      {config.qa && (
        <QaLayer
          qa={config.qa}
          questions={questions}
          page={questionPage}
          background={config.background ?? "#ffffff"}
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
      {!interaction &&
        !config.wordcloud &&
        !config.qa &&
        !config.scale &&
        elements.length === 0 &&
        !config.image?.src && (
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
