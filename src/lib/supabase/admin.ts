import { createClient } from "@supabase/supabase-js";

/**
 * Klient se servisním klíčem, který obchází RLS. Používá se jen tam, kde server
 * musí přečíst data za nepřihlášeného účastníka — a vždycky vrátí jen to, co
 * účastník smí vidět (např. kvíz bez příznaku správné odpovědi).
 *
 * Klíč nesmí nikdy do prohlížeče, proto ta pojistka níž: modul se dá načíst
 * jen na serveru.
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("Servisní klíč se nesmí použít v prohlížeči.");
  }

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    // Dokud klíč není nastavený, volající si poradí anonymním klientem.
    return null;
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
