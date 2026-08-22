-- Odkrytí správné odpovědi u kvízu.
--
-- Spusť v Supabase SQL editoru. Je to idempotentní (dá se pustit vícekrát).
--
-- Přednášející v /present přepne odkrytí, uloží se do session a účastníci na
-- /play ho dostanou stávajícím realtime odběrem na tabulce sessions — proto to
-- musí být sloupec v databázi, ne jen stav v prohlížeči.

alter table public.sessions
  add column if not exists reveal_answer boolean not null default false;
