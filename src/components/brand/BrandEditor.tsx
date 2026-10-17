"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BRAND_COLOR_MAX,
  brandKitFromRow,
  EMPTY_BRAND,
  type BrandKit,
} from "@/lib/brand";
import { createClient } from "@/lib/supabase/client";
import { uploadSlideImage } from "@/lib/uploadImage";

type SaveState = "idle" | "saving" | "saved" | "error";

const SAVE_LABELS: Record<SaveState, string> = {
  idle: "",
  saving: "Ukládám…",
  saved: "Uloženo",
  error: "Uložení se nepovedlo",
};

/**
 * Nastavení značky: barvy a logo. Ukládá se rovnou při změně, stejně jako
 * editor slidů — formulář s tlačítkem Uložit by tu jen překážel.
 */
export default function BrandEditor({ userId }: { userId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [kit, setKit] = useState<BrandKit>(EMPTY_BRAND);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("#dc5b5b");
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("brand_kits")
      .select("colors, logo_url")
      .maybeSingle<{ colors: unknown; logo_url: string | null }>()
      .then(({ data, error: loadError }) => {
        if (cancelled) {
          return;
        }
        setLoading(false);
        if (loadError) {
          setError(
            `Nastavení značky se nepodařilo načíst: ${loadError.message}. Je v Supabase spuštěné supabase/add_trash_and_brand.sql?`,
          );
          return;
        }
        setKit(brandKitFromRow(data));
      });
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function save(next: BrandKit) {
    setKit(next);
    setState("saving");
    setError(null);
    const { error: saveError } = await supabase.from("brand_kits").upsert(
      {
        user_id: userId,
        colors: next.colors,
        logo_url: next.logoUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (saveError) {
      setState("error");
      setError(saveError.message);
      return;
    }
    setState("saved");
  }

  async function uploadLogo(file: File) {
    setState("saving");
    const result = await uploadSlideImage(file);
    if ("error" in result) {
      setState("error");
      setError(result.error);
      return;
    }
    await save({ ...kit, logoUrl: result.url });
  }

  const canAdd = kit.colors.length < BRAND_COLOR_MAX;

  return (
    <div className="mt-8 flex flex-col gap-8">
      <section className="card p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-base font-bold text-ink">Barvy</h2>
          <span className="text-xs text-muted" aria-live="polite">
            {SAVE_LABELS[state]}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted">
          Barvy značky se v editoru nabídnou jako první — u textu i u pozadí
          slidu.
        </p>

        {loading ? (
          <p className="mt-4 text-sm text-muted">Načítám…</p>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {kit.colors.map((color) => (
                <span
                  key={color}
                  className="group relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border/80 shadow-sm"
                  style={{ background: color }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      save({
                        ...kit,
                        colors: kit.colors.filter((c) => c !== color),
                      })
                    }
                    title={`Odebrat ${color}`}
                    aria-label={`Odebrat barvu ${color}`}
                    className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-surface text-xs font-bold text-muted opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus:opacity-100 hover:text-danger"
                  >
                    ×
                  </button>
                </span>
              ))}
              {kit.colors.length === 0 && (
                <p className="text-sm text-muted">Zatím žádná barva.</p>
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-muted">
                <input
                  type="color"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  aria-label="Nová barva"
                  className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-surface p-1"
                />
                {draft}
              </label>
              <button
                type="button"
                disabled={!canAdd || kit.colors.includes(draft)}
                onClick={() => save({ ...kit, colors: [...kit.colors, draft] })}
                className="btn btn-primary btn-sm"
              >
                Přidat barvu
              </button>
              {!canAdd && (
                <span className="text-xs text-muted">
                  Víc než {BRAND_COLOR_MAX} barev už se v panelu špatně hledá.
                </span>
              )}
            </div>
          </>
        )}
      </section>

      <section className="card p-5">
        <h2 className="text-base font-bold text-ink">Logo</h2>
        <p className="mt-1 text-sm text-muted">
          Logo se dá vložit na slide jedním tlačítkem v editoru.
        </p>

        {kit.logoUrl && (
          <div className="mt-4 inline-flex items-center justify-center rounded-xl border border-border bg-sunken p-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary user URLs */}
            <img src={kit.logoUrl} alt="Logo značky" className="h-16 w-auto" />
          </div>
        )}

        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadLogo(file);
            e.target.value = "";
          }}
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={state === "saving"}
            className="btn btn-primary btn-sm"
          >
            {kit.logoUrl ? "Nahradit logo" : "Nahrát logo"}
          </button>
          {kit.logoUrl && (
            <button
              type="button"
              onClick={() => save({ ...kit, logoUrl: null })}
              className="btn btn-secondary btn-sm hover:border-red-300 hover:text-danger"
            >
              Odebrat logo
            </button>
          )}
        </div>
      </section>

      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
