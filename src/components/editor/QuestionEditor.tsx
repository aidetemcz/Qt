"use client";

import SlideSettingsPanel from "@/components/editor/SlideSettingsPanel";
import {
  ANSWER_MAX,
  cqh,
  cqw,
  emptyQuiz,
  getQuizAnswers,
  type InteractionKind,
  QUESTION_MAX,
  QUIZ_ANSWER_STYLES,
  QUIZ_MAX_ANSWERS,
  QUIZ_MIN_ANSWERS,
} from "@/components/slide/SlideView";
import type { QuizAnswer, SlideConfig, SlideQuiz } from "@/lib/presentations";

/**
 * Editor otázky — kvízu i ankety. Rám kopíruje výsledné vykreslení jedna ku
 * jedné (stejné barvy, tvary i velikosti), takže co se tu napíše, to místnost
 * uvidí. Prázdné sloty jsou při editaci vidět. Anketa je totéž bez označování
 * správné odpovědi.
 */
export default function QuestionEditor({
  kind,
  lockedAnswers = false,
  config,
  onChange,
}: {
  kind: InteractionKind;
  /** Pravda/Lež: možnosti jsou dané, mění se jen ta správná. */
  lockedAnswers?: boolean;
  config: SlideConfig;
  onChange: (config: SlideConfig) => void;
}) {
  const isQuiz = kind === "quiz";
  const quiz = (isQuiz ? config.quiz : config.poll) ?? emptyQuiz();
  const answers = lockedAnswers ? (quiz.answers ?? []) : getQuizAnswers(quiz);
  const canAdd = !lockedAnswers && answers.length < QUIZ_MAX_ANSWERS;
  const canRemove = !lockedAnswers && answers.length > QUIZ_MIN_ANSWERS;

  function patchQuiz(patch: Partial<SlideQuiz>) {
    const next = { ...quiz, ...patch };
    onChange(isQuiz ? { ...config, quiz: next } : { ...config, poll: next });
  }
  function patchAnswer(id: string, patch: Partial<QuizAnswer>) {
    patchQuiz({
      answers: answers.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    });
  }
  function addAnswer() {
    if (!canAdd) {
      return;
    }
    // Id se drží abecedy, ať zůstanou krátká a stabilní.
    const used = new Set(answers.map((a) => a.id));
    const next = "abcdef".split("").find((letter) => !used.has(letter));
    if (next) {
      patchQuiz({ answers: [...answers, { id: next, text: "" }] });
    }
  }
  function removeAnswer(id: string) {
    if (canRemove) {
      patchQuiz({ answers: answers.filter((a) => a.id !== id) });
    }
  }
  function toggleCorrect(id: string) {
    // U Pravda/Lež platí právě jedna možnost, jinde jich může být víc.
    if (lockedAnswers) {
      patchQuiz({
        answers: answers.map((a) => ({ ...a, correct: a.id === id })),
      });
      return;
    }
    patchAnswer(id, { correct: !answers.find((a) => a.id === id)?.correct });
  }

  const filled = answers.filter((a) => a.text.trim());
  const hasCorrect = filled.some((a) => a.correct);
  const warning =
    !lockedAnswers && filled.length < 2
      ? "Vyplň aspoň dvě možnosti — prázdné se v prezentaci nezobrazí."
      : isQuiz && !hasCorrect
        ? lockedAnswers
          ? "Označ kolečkem, jestli tvrzení platí."
          : "Označ kolečkem, která odpověď je správná."
        : null;

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col lg:flex-row">
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-4 md:p-8">
        <div className="card mx-auto flex w-full max-w-4xl flex-wrap items-center gap-2 p-3">
          {!isQuiz && !lockedAnswers && (
            <button
              type="button"
              onClick={() => patchQuiz({ multi: !quiz.multi })}
              aria-pressed={!!quiz.multi}
              className={`btn btn-sm ${quiz.multi ? "btn-primary" : "btn-secondary"}`}
            >
              {quiz.multi ? "Víc odpovědí" : "Jedna odpověď"}
            </button>
          )}
          {canAdd && (
            <button
              type="button"
              onClick={addAnswer}
              className="btn btn-secondary btn-sm"
            >
              + Možnost
            </button>
          )}
          <span className="text-xs text-muted">
            {lockedAnswers
              ? "Napiš tvrzení a kolečkem označ, jestli platí."
              : isQuiz
                ? "Napiš otázku a odpovědi. Správnou označ kolečkem vpravo."
                : quiz.multi
                  ? "Publikum smí vybrat víc možností."
                  : "Publikum vybere jednu možnost."}
          </span>
        </div>

        <div
          className="relative mx-auto aspect-video w-full max-w-4xl overflow-hidden rounded-card shadow-card ring-1 ring-border"
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

          <div
            className="absolute inset-0 flex flex-col"
            style={{ padding: cqw(36), gap: cqh(24) }}
          >
            <textarea
              value={quiz.question}
              maxLength={QUESTION_MAX}
              onChange={(e) => patchQuiz({ question: e.target.value })}
              placeholder={lockedAnswers ? "Napiš tvrzení" : "Napiš otázku"}
              aria-label={lockedAnswers ? "Tvrzení" : "Otázka"}
              className="flex-1 resize-none rounded-2xl bg-white/95 text-center font-bold text-[#241d1a] shadow-sm outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-brand/40"
              style={{
                padding: cqw(24),
                fontSize: cqw(46),
                lineHeight: 1.15,
              }}
            />

            <div
              className="grid grid-cols-2"
              style={{
                gap: cqw(14),
                height: cqh(210),
                gridTemplateRows: `repeat(${Math.ceil(answers.length / 2)}, 1fr)`,
              }}
            >
              {answers.map((answer, index) => {
                const style =
                  QUIZ_ANSWER_STYLES[index % QUIZ_ANSWER_STYLES.length];
                return (
                  <div
                    key={answer.id}
                    className="flex items-center overflow-hidden rounded-xl"
                    style={{
                      background: style.color,
                      gap: cqw(10),
                      padding: cqw(14),
                    }}
                  >
                    <span
                      aria-hidden
                      className="shrink-0 text-white"
                      style={{ fontSize: cqw(22) }}
                    >
                      {style.glyph}
                    </span>
                    {lockedAnswers ? (
                      <span
                        className="min-w-0 flex-1 font-semibold text-white"
                        style={{ fontSize: cqw(26) }}
                      >
                        {answer.text}
                      </span>
                    ) : (
                      <input
                        type="text"
                        value={answer.text}
                        maxLength={ANSWER_MAX}
                        onChange={(e) =>
                          patchAnswer(answer.id, { text: e.target.value })
                        }
                        placeholder={`${isQuiz ? "Odpověď" : "Možnost"} ${index + 1}`}
                        aria-label={`${isQuiz ? "Odpověď" : "Možnost"} ${index + 1}`}
                        className="min-w-0 flex-1 bg-transparent font-semibold text-white outline-none placeholder:text-white/55"
                        style={{ fontSize: cqw(26) }}
                      />
                    )}
                    {canRemove && (
                      <button
                        type="button"
                        onClick={() => removeAnswer(answer.id)}
                        title="Odebrat možnost"
                        aria-label={`Odebrat možnost ${index + 1}`}
                        className="flex shrink-0 items-center justify-center rounded-full text-white/70 transition-colors duration-150 hover:bg-black/20 hover:text-white"
                        style={{
                          width: cqw(30),
                          height: cqw(30),
                          fontSize: cqw(20),
                        }}
                      >
                        ×
                      </button>
                    )}
                    {isQuiz && (
                      <button
                        type="button"
                        onClick={() => toggleCorrect(answer.id)}
                        aria-pressed={!!answer.correct}
                        title={
                          answer.correct
                            ? "Správná odpověď"
                            : "Označit jako správnou"
                        }
                        className={`flex shrink-0 items-center justify-center rounded-full border-2 font-bold transition-colors duration-150 ${
                          answer.correct
                            ? "border-white bg-white text-[#241d1a]"
                            : "border-white/50 text-transparent hover:border-white hover:text-white/60"
                        }`}
                        style={{
                          width: cqw(36),
                          height: cqw(36),
                          fontSize: cqw(20),
                        }}
                      >
                        ✓
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {warning && (
          <p className="mx-auto w-full max-w-4xl text-xs text-muted">
            {warning}
          </p>
        )}
      </div>

      <SlideSettingsPanel
        config={config}
        selected={null}
        onPatchElement={() => {}}
        onPatchConfig={(patch) => onChange({ ...config, ...patch })}
        onDeleteElement={() => {}}
      />
    </div>
  );
}
