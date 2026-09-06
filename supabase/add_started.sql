-- Lobby před spuštěním prezentace.
--
-- Spusť v Supabase SQL editoru. Je to idempotentní (dá se pustit vícekrát).
--
-- Nová session začíná nespuštěná: přednášející vidí lobby s kódem, účastníci
-- čekací obrazovku. Přednášející to přepne tlačítkem a účastníkům to doručí
-- stávající realtime odběr tabulky sessions — proto sloupec v databázi.

alter table public.sessions
  add column if not exists started boolean not null default false;
