"use client";

import { defaultColor } from "@/components/slide/SlideView";
import type {
  SlideAlign,
  SlideConfig,
  SlideElement,
} from "@/lib/presentations";

const TEXT_COLORS = [
  "#241d1a",
  "#4b423d",
  "#dc5b5b",
  "#c24747",
  "#5f8794",
  "#7da4b2",
  "#d97706",
  "#16a34a",
  "#ffffff",
];

const SLIDE_BACKGROUNDS = [
  "#ffffff",
  "#fbf6f2",
  "#f6efea",
  "#fdf1ef",
  "#f1f7f9",
  "#241d1a",
  "#dc5b5b",
  "#5f8794",
];

const ALIGNS: { value: SlideAlign; label: string; glyph: string }[] = [
  { value: "left", label: "Vlevo", glyph: "≡" },
  { value: "center", label: "Na střed", glyph: "≡" },
  { value: "right", label: "Vpravo", glyph: "≡" },
];

function Swatches({
  colors,
  value,
  onPick,
  label,
}: {
  colors: string[];
  value: string;
  onPick: (color: string) => void;
  label: string;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold tracking-wide text-muted uppercase">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {colors.map((color) => {
          const active = color.toLowerCase() === value.toLowerCase();
          return (
            <button
              key={color}
              type="button"
              onClick={() => onPick(color)}
              aria-label={color}
              aria-pressed={active}
              style={{ background: color }}
              className={`h-7 w-7 rounded-lg border transition-transform duration-150 motion-safe:hover:scale-110 ${
                active
                  ? "border-brand ring-2 ring-brand/40"
                  : "border-border/80"
              }`}
            />
          );
        })}
        <label
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-border/80 text-[0.625rem] font-bold text-muted transition-transform duration-150 motion-safe:hover:scale-110"
          title="Vlastní barva"
        >
          +
          <input
            type="color"
            value={value}
            onChange={(e) => onPick(e.target.value)}
            className="sr-only"
          />
        </label>
      </div>
    </div>
  );
}

/**
 * Right-hand settings rail (Kahoot style). Shows the selected element's
 * styling, or slide-level settings when nothing is selected.
 */
export default function SlideSettingsPanel({
  config,
  selected,
  onPatchElement,
  onPatchConfig,
  onDeleteElement,
}: {
  config: SlideConfig;
  selected: SlideElement | null;
  onPatchElement: (patch: Partial<SlideElement>) => void;
  onPatchConfig: (patch: Partial<SlideConfig>) => void;
  onDeleteElement: () => void;
}) {
  return (
    <aside className="flex w-full shrink-0 flex-col gap-5 overflow-y-auto border-t border-border bg-surface p-4 lg:w-72 lg:border-t-0 lg:border-l">
      {selected ? (
        <>
          <div>
            <p className="eyebrow">
              {selected.kind === "heading" ? "Nadpis" : "Hlavní text"}
            </p>
            <h2 className="mt-1 text-lg font-extrabold text-ink">
              Nastavení textu
            </h2>
          </div>

          <Swatches
            label="Barva textu"
            colors={TEXT_COLORS}
            value={selected.color ?? defaultColor(selected.kind)}
            onPick={(color) => onPatchElement({ color })}
          />

          <div>
            <p className="mb-2 text-xs font-bold tracking-wide text-muted uppercase">
              Zarovnání
            </p>
            <div className="flex gap-1.5">
              {ALIGNS.map((a) => {
                const active = (selected.textAlign ?? "left") === a.value;
                return (
                  <button
                    key={a.value}
                    type="button"
                    onClick={() => onPatchElement({ textAlign: a.value })}
                    title={a.label}
                    aria-pressed={active}
                    className={`flex-1 rounded-xl border py-2 text-sm transition-colors duration-150 ${
                      active
                        ? "border-brand bg-brand-50 text-brand"
                        : "border-border text-muted hover:border-brand/40"
                    }`}
                  >
                    <span
                      className={
                        a.value === "left"
                          ? "block text-left"
                          : a.value === "center"
                            ? "block text-center"
                            : "block text-right"
                      }
                    >
                      {a.glyph}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold tracking-wide text-muted uppercase">
              Řez
            </p>
            <button
              type="button"
              onClick={() => onPatchElement({ bold: !selected.bold })}
              aria-pressed={!!selected.bold}
              className={`w-full rounded-xl border py-2 text-sm font-extrabold transition-colors duration-150 ${
                selected.bold
                  ? "border-brand bg-brand-50 text-brand"
                  : "border-border text-muted hover:border-brand/40"
              }`}
            >
              Tučně
            </button>
          </div>

          <p className="text-xs leading-relaxed text-muted">
            Velikost změníš tažením za roh vybraného textu.
          </p>

          <button
            type="button"
            onClick={onDeleteElement}
            className="btn btn-secondary btn-sm mt-auto hover:border-red-300 hover:text-danger"
          >
            Odebrat prvek
          </button>
        </>
      ) : (
        <>
          <div>
            <p className="eyebrow">Slide</p>
            <h2 className="mt-1 text-lg font-extrabold text-ink">
              Nastavení slidu
            </h2>
          </div>

          <Swatches
            label="Barva pozadí"
            colors={SLIDE_BACKGROUNDS}
            value={config.background ?? "#ffffff"}
            onPick={(background) => onPatchConfig({ background })}
          />

          <p className="text-xs leading-relaxed text-muted">
            Klikni na text na slidu a nastavíš tady jeho barvu, zarovnání a řez.
          </p>
        </>
      )}
    </aside>
  );
}
