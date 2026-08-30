"use client";

import { useState } from "react";
import SlideSettingsPanel from "@/components/editor/SlideSettingsPanel";
import { cqh, cqw, inkOn, QUESTION_MAX } from "@/components/slide/SlideView";
import type { SlideConfig } from "@/lib/presentations";

/**
 * Editor slidu, kde autor zadává jen zadání a obsah přijde od publika —
 * word cloud a otázky a odpovědi. Zadání se píše rovnou do slidu (dvojklik),
 * stejně jako text na textovém slidu, takže plocha odpovídá prezentaci.
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
  const [editing, setEditing] = useState(false);

  const background = config.background ?? "#ffffff";
  const ink = inkOn(background);
  // Stejná velikost jako ve výsledném vykreslení, ať se text po uložení nehne.
  const fontSize = cqw(isCloud ? 38 : 34);
  const placeholder = isCloud
    ? "Např. Jedním slovem: jak se dnes cítíš?"
    : "Např. Na co se chcete zeptat?";

  function setQuestion(question: string) {
    const next = { ...prompt, question };
    onChange(
      isCloud ? { ...config, wordcloud: next } : { ...config, qa: next },
    );
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col lg:flex-row">
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-4 md:p-8">
        <div className="card mx-auto flex w-full max-w-4xl flex-wrap items-center gap-2 p-3">
          <span className="text-xs text-muted">
            Dvojklik na zadání ho upraví.{" "}
            {isCloud
              ? "Slova napíše publikum na svých zařízeních; nejčastější budou v oblaku největší."
              : "Otázky napíše publikum na svých zařízeních, na plátně se ukazují od nejnovější."}
          </span>
        </div>

        <div
          className="relative mx-auto aspect-video w-full max-w-4xl overflow-hidden rounded-card shadow-card ring-1 ring-border"
          style={{ containerType: "size", background }}
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
            style={{ padding: cqw(36), gap: cqh(16) }}
          >
            {editing ? (
              <textarea
                autoFocus
                value={prompt.question}
                maxLength={QUESTION_MAX}
                rows={2}
                onChange={(e) => setQuestion(e.target.value)}
                onBlur={() => setEditing(false)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.currentTarget.blur();
                  }
                }}
                aria-label="Zadání"
                className="w-full resize-none rounded-lg bg-transparent text-center font-bold outline-2 outline-offset-2 outline-brand"
                style={{ fontSize, lineHeight: 1.15, color: ink }}
              />
            ) : (
              <p
                onDoubleClick={() => setEditing(true)}
                title="Dvojklik pro úpravu"
                className="line-clamp-2 cursor-text rounded-lg text-center font-bold break-words"
                style={{
                  fontSize,
                  lineHeight: 1.15,
                  color: ink,
                  opacity: prompt.question ? 1 : 0.45,
                }}
              >
                {prompt.question || placeholder}
              </p>
            )}

            <div className="flex flex-1 items-center justify-center">
              <span
                className="text-center"
                style={{ fontSize: cqw(24), color: ink, opacity: 0.55 }}
              >
                {isCloud
                  ? "Slova se objeví, jak je publikum pošle."
                  : "Otázky se objeví, jak je publikum pošle."}
              </span>
            </div>
          </div>
        </div>
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
