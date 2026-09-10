"use client";

import { useState } from "react";
import SlideSettingsPanel from "@/components/editor/SlideSettingsPanel";
import {
  cqh,
  cqw,
  inkOn,
  QUESTION_MAX,
  QUIZ_ANSWER_STYLES,
  scaleValues,
} from "@/components/slide/SlideView";
import type { SlideConfig, SlideScale } from "@/lib/presentations";

const LABEL_MAX = 24;
const RANGES = [3, 4, 5, 7, 10];

/**
 * Editor škály. Tvrzení a popisky krajů se píšou rovnou do slidu (dvojklik),
 * rozsah se vybírá nad plochou. Sloupce se v prezentaci narovnají podle hlasů,
 * tady stojí v základní výšce.
 */
export default function ScaleEditor({
  config,
  onChange,
}: {
  config: SlideConfig;
  onChange: (config: SlideConfig) => void;
}) {
  const scale: SlideScale = config.scale ?? { question: "", min: 1, max: 5 };
  const [editing, setEditing] = useState(false);

  const background = config.background ?? "#ffffff";
  const ink = inkOn(background);
  const values = scaleValues(scale);

  function patch(next: Partial<SlideScale>) {
    onChange({ ...config, scale: { ...scale, ...next } });
  }

  const labelClass =
    "min-w-0 rounded-md bg-transparent outline-none placeholder:opacity-50 focus:ring-2 focus:ring-brand/40";

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col lg:flex-row">
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-4 md:p-8">
        <div className="card mx-auto flex w-full max-w-4xl flex-wrap items-center gap-2 p-3">
          <span className="text-xs font-bold tracking-wide text-muted uppercase">
            Rozsah
          </span>
          {RANGES.map((max) => (
            <button
              key={max}
              type="button"
              onClick={() => patch({ min: 1, max })}
              aria-pressed={scale.max === max}
              className={`btn btn-sm ${
                scale.max === max ? "btn-primary" : "btn-secondary"
              }`}
            >
              1–{max}
            </button>
          ))}
          <span className="ml-auto text-xs text-muted">
            Dvojklik na tvrzení ho upraví, popisky krajů se píšou pod stupnicí.
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
            style={{ padding: cqw(36), gap: cqh(18) }}
          >
            {editing ? (
              <textarea
                autoFocus
                value={scale.question}
                maxLength={QUESTION_MAX}
                onChange={(e) => patch({ question: e.target.value })}
                onBlur={() => setEditing(false)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.currentTarget.blur();
                  }
                }}
                aria-label="Tvrzení"
                className="flex-1 resize-none rounded-2xl bg-white/95 text-center font-bold text-[#241d1a] shadow-sm outline-none focus:ring-2 focus:ring-brand/40"
                style={{
                  padding: cqw(20),
                  fontSize: cqw(40),
                  lineHeight: 1.15,
                }}
              />
            ) : (
              <div
                onDoubleClick={() => setEditing(true)}
                title="Dvojklik pro úpravu"
                className="flex flex-1 cursor-text items-center justify-center rounded-2xl bg-white/95 text-center font-bold text-[#241d1a] shadow-sm"
                style={{
                  padding: cqw(20),
                  fontSize: cqw(40),
                  lineHeight: 1.15,
                }}
              >
                <span
                  className="line-clamp-3 break-words"
                  style={{ opacity: scale.question ? 1 : 0.4 }}
                >
                  {scale.question || "Napiš tvrzení"}
                </span>
              </div>
            )}

            <div style={{ height: cqh(190) }} className="flex flex-col">
              <div className="flex flex-1 items-end" style={{ gap: cqw(10) }}>
                {values.map((value, index) => {
                  const style =
                    QUIZ_ANSWER_STYLES[index % QUIZ_ANSWER_STYLES.length];
                  return (
                    <div
                      key={value}
                      className="flex flex-1 flex-col items-center justify-end"
                      style={{ gap: cqh(6) }}
                    >
                      <div
                        className="w-full rounded-lg"
                        style={{ background: style.color, height: cqh(56) }}
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
                style={{ marginTop: cqh(6), gap: cqw(12) }}
              >
                <input
                  type="text"
                  value={scale.minLabel ?? ""}
                  maxLength={LABEL_MAX}
                  onChange={(e) => patch({ minLabel: e.target.value })}
                  placeholder="Popisek vlevo"
                  aria-label="Popisek u nejnižší hodnoty"
                  className={labelClass}
                  style={{ fontSize: cqw(20), color: ink, width: "40%" }}
                />
                <input
                  type="text"
                  value={scale.maxLabel ?? ""}
                  maxLength={LABEL_MAX}
                  onChange={(e) => patch({ maxLabel: e.target.value })}
                  placeholder="Popisek vpravo"
                  aria-label="Popisek u nejvyšší hodnoty"
                  className={`${labelClass} text-right`}
                  style={{ fontSize: cqw(20), color: ink, width: "40%" }}
                />
              </div>
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
