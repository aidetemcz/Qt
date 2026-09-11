"use client";

import { useRef, useState } from "react";
import { defaultColor } from "@/components/slide/SlideView";
import type {
  SlideAlign,
  SlideConfig,
  SlideElement,
  SlideImageFit,
} from "@/lib/presentations";
import { uploadSlideImage } from "@/lib/uploadImage";

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

function ImageSettings({
  config,
  onPatchConfig,
}: {
  config: SlideConfig;
  onPatchConfig: (patch: Partial<SlideConfig>) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState("");

  const image = config.image;
  const fit: SlideImageFit = image?.fit ?? "cover";

  async function upload(file: File) {
    setError(null);
    setUploading(true);
    const result = await uploadSlideImage(file);
    setUploading(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onPatchConfig({ image: { src: result.url, fit } });
  }

  return (
    <div>
      <p className="mb-2 text-xs font-bold tracking-wide text-muted uppercase">
        Obrázek na pozadí
      </p>

      {image?.src && (
        <div className="mb-3 overflow-hidden rounded-xl border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary user URLs */}
          <img
            src={image.src}
            alt=""
            className="aspect-video w-full object-cover"
          />
        </div>
      )}

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        disabled={uploading}
        className="btn btn-primary btn-sm w-full"
      >
        {uploading
          ? "Nahrávám…"
          : image?.src
            ? "Nahradit obrázek"
            : "Nahrát obrázek"}
      </button>

      <div className="mt-2 flex gap-1.5">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="…nebo vlož URL"
          className="input px-3 py-2 text-xs"
        />
        <button
          type="button"
          disabled={!url.trim()}
          onClick={() => {
            onPatchConfig({ image: { src: url.trim(), fit } });
            setUrl("");
          }}
          className="btn btn-secondary btn-sm shrink-0"
        >
          Použít
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-danger">{error}</p>}

      {image?.src && (
        <>
          <div className="mt-3 flex gap-1.5">
            {(["cover", "contain"] as SlideImageFit[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() =>
                  onPatchConfig({ image: { ...image, fit: value } })
                }
                aria-pressed={fit === value}
                className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition-colors duration-150 ${
                  fit === value
                    ? "border-brand bg-brand-50 text-brand"
                    : "border-border text-muted hover:border-brand/40"
                }`}
              >
                {value === "cover" ? "Vyplnit" : "Vejít se"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onPatchConfig({ image: undefined })}
            className="btn btn-secondary btn-sm mt-2 w-full hover:border-red-300 hover:text-danger"
          >
            Odebrat obrázek
          </button>
        </>
      )}
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
      {selected?.kind === "image" ? (
        <>
          <div>
            <p className="eyebrow">Obrázek</p>
            <h2 className="mt-1 text-lg font-extrabold text-ink">
              Nastavení obrázku
            </h2>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold tracking-wide text-muted uppercase">
              Výplň rámu
            </p>
            <div className="flex gap-1.5">
              {(["contain", "cover"] as SlideImageFit[]).map((value) => {
                const active = (selected.fit ?? "contain") === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onPatchElement({ fit: value })}
                    aria-pressed={active}
                    className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition-colors duration-150 ${
                      active
                        ? "border-brand bg-brand-50 text-brand"
                        : "border-border text-muted hover:border-brand/40"
                    }`}
                  >
                    {value === "contain" ? "Vejít se" : "Vyplnit"}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-xs leading-relaxed text-muted">
            Obrázkem hýbeš tažením, velikost měníš za pravý dolní roh.
          </p>

          <button
            type="button"
            onClick={onDeleteElement}
            className="btn btn-secondary btn-sm mt-auto hover:border-red-300 hover:text-danger"
          >
            Odebrat obrázek
          </button>
        </>
      ) : selected ? (
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
            Písmo zvětšíš tažením za pravý dolní roh, šířku rámu (a tím zalomení
            řádků) za úchyt vpravo.
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

          <ImageSettings config={config} onPatchConfig={onPatchConfig} />

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
