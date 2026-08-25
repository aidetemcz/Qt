"use client";

import SlideSettingsPanel from "@/components/editor/SlideSettingsPanel";
import SlideView, { QUESTION_MAX } from "@/components/slide/SlideView";
import type { SlideConfig } from "@/lib/presentations";

/**
 * Editor slidu, kde autor zadává jen otázku a obsah přijde od publika —
 * word cloud a otázky a odpovědi. Plocha ukazuje slide tak, jak bude vypadat,
 * než něco dorazí.
 */
export default function PromptEditor({
  kind,
  config,
  onChange,
}: {
  kind: "wordcloud" | "qa";
  config: SlideConfig;
  onChange: (config: SlideConfig) => void;
}) {
  const isCloud = kind === "wordcloud";
  const prompt = (isCloud ? config.wordcloud : config.qa) ?? { question: "" };

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col lg:flex-row">
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-4 md:p-8">
        <div className="card mx-auto flex w-full max-w-4xl flex-wrap items-center gap-2 p-3">
          <label className="flex w-full flex-col gap-1.5">
            <span className="text-xs font-bold tracking-wide text-muted uppercase">
              Zadání
            </span>
            <input
              type="text"
              value={prompt.question}
              maxLength={QUESTION_MAX}
              onChange={(e) => {
                const next = { ...prompt, question: e.target.value };
                onChange(
                  isCloud
                    ? { ...config, wordcloud: next }
                    : { ...config, qa: next },
                );
              }}
              placeholder={
                isCloud
                  ? "Např. Jedním slovem: jak se dnes cítíš?"
                  : "Např. Na co se chcete zeptat?"
              }
              className="input"
            />
          </label>
        </div>

        <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-card shadow-card ring-1 ring-border">
          <SlideView config={config} />
        </div>

        <p className="mx-auto w-full max-w-4xl text-xs text-muted">
          {isCloud
            ? "Slova napíše publikum na svých zařízeních. Každý může poslat několik, nejčastější budou v oblaku největší."
            : "Otázky napíše publikum na svých zařízeních. Na plátně se ukazují od nejnovější."}
        </p>
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
