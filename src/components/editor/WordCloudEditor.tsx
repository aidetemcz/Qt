"use client";

import SlideSettingsPanel from "@/components/editor/SlideSettingsPanel";
import SlideView, { QUESTION_MAX } from "@/components/slide/SlideView";
import type { SlideConfig } from "@/lib/presentations";

/**
 * Editor word cloudu. Autor zadává jenom otázku — slova přijdou od publika
 * až v prezentaci, takže plocha ukazuje slide tak, jak bude vypadat prázdný.
 */
export default function WordCloudEditor({
  config,
  onChange,
}: {
  config: SlideConfig;
  onChange: (config: SlideConfig) => void;
}) {
  const cloud = config.wordcloud ?? { question: "" };

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
              value={cloud.question}
              maxLength={QUESTION_MAX}
              onChange={(e) =>
                onChange({
                  ...config,
                  wordcloud: { ...cloud, question: e.target.value },
                })
              }
              placeholder="Např. Jedním slovem: jak se dnes cítíš?"
              className="input"
            />
          </label>
        </div>

        <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-card shadow-card ring-1 ring-border">
          <SlideView config={config} />
        </div>

        <p className="mx-auto w-full max-w-4xl text-xs text-muted">
          Slova napíše publikum na svých zařízeních. Každý může poslat několik,
          nejčastější budou v oblaku největší.
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
