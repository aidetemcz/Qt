"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** Barvy a logo, které si uživatel nastaví jednou a má je v každém slidu. */
export interface BrandKit {
  colors: string[];
  logoUrl: string | null;
}

export const EMPTY_BRAND: BrandKit = { colors: [], logoUrl: null };

/** Kolik barev má smysl mít po ruce; víc už se v panelu hledá hůř. */
export const BRAND_COLOR_MAX = 8;

type Row = { colors: unknown; logo_url: string | null };

function toKit(row: Row | null): BrandKit {
  const colors = Array.isArray(row?.colors)
    ? row.colors.filter((value): value is string => typeof value === "string")
    : [];
  return {
    colors: colors.slice(0, BRAND_COLOR_MAX),
    logoUrl: row?.logo_url ?? null,
  };
}

/**
 * Načte nastavení značky přihlášeného uživatele. Když tabulka ještě není
 * (neproběhla migrace) nebo je prázdná, vrátí prázdnou značku — editor pak
 * jen nenabídne nic navíc a dál funguje.
 */
export function useBrandKit(): BrandKit {
  const [kit, setKit] = useState<BrandKit>(EMPTY_BRAND);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("brand_kits")
      .select("colors, logo_url")
      .maybeSingle<Row>()
      .then(({ data }) => {
        if (!cancelled) {
          setKit(toKit(data));
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return kit;
}

export { toKit as brandKitFromRow };
