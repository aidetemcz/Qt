"use client";

import SlideSettingsPanel from "@/components/editor/SlideSettingsPanel";
import {
  ANSWER_MAX,
  cqh,
  cqw,
  emptyQuiz,
  getQuizAnswers,
  QUESTION_MAX,
  QUIZ_ANSWER_STYLES,
} from "@/components/slide/SlideView";
import type { QuizAnswer, SlideConfig, SlideQuiz } from "@/lib/presentations";

/**
 * Editor for a quiz slide. The frame mirrors the read-only rendering one to one
 * — same colours, shapes and container-query sizes — so what is authored here
 * is what the room sees. Empty slots stay visible while editing.
 */
export default function QuizEditor({
  config,
  onChange,
}: {
  config: SlideConfig;
  onChange: (config: SlideConfig) => void;
}) {
  const quiz = config.quiz ?? emptyQuiz();
  const answers = getQuizAnswers(quiz);

  function patchQuiz(patch: Partial<SlideQuiz>) {
    onChange({ ...config, quiz: { ...quiz, ...patch } });
  }
  function patchAnswer(id: string, patch: Partial<QuizAnswer>) {
    patchQuiz({
      answers: answers.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    });
  }

  const filled = answers.filter((a) => a.text.trim());
  const hasCorrect = filled.some((a) => a.correct);
  const warning =
    filled.length < 2
      ? "Vyplň aspoň dvě odpovědi — prázdné se v prezentaci nezobrazí."
      : !hasCorrect
        ? "Označ kolečkem, která odpověď je správná."
        : null;

  return (
    <div className="flex w-full flex-1 flex-col lg:flex-row">
      <div className="flex flex-1 flex-col gap-3 overflow-auto p-4 md:p-8">
        <div className="card mx-auto flex w-full max-w-4xl flex-wrap items-center gap-2 p-3">
          <span className="text-xs text-muted">
            Napiš otázku a odpovědi. Správnou označ kolečkem vpravo.
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
              placeholder="Napiš otázku"
              aria-label="Otázka"
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
                gridTemplateRows: "1fr 1fr",
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
                    <input
                      type="text"
                      value={answer.text}
                      maxLength={ANSWER_MAX}
                      onChange={(e) =>
                        patchAnswer(answer.id, { text: e.target.value })
                      }
                      placeholder={`Odpověď ${index + 1}`}
                      aria-label={`Odpověď ${index + 1}`}
                      className="min-w-0 flex-1 bg-transparent font-semibold text-white outline-none placeholder:text-white/55"
                      style={{ fontSize: cqw(26) }}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        patchAnswer(answer.id, { correct: !answer.correct })
                      }
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
