-- Změna hlasu: řeší ji server, v databázi není potřeba nic povolovat navíc.
--
-- Spusť v Supabase SQL editoru. Je to idempotentní (dá se pustit vícekrát).
--
-- Historie: dřív tu bylo pravidlo, které účastníkovi dovolovalo svůj hlas
-- přepsat. Nefungovalo — Postgres u "insert ... on conflict" vyžaduje, aby
-- role směla tabulku i číst, a to účastník nesmí (jinak by si v prohlížeči
-- přečetl, kdo jak hlasoval). Důsledek byl, že neprošel žádný hlas.
--
-- Nově hlas zapisuje /api/vote servisním klíčem: ověří, že relace běží, že
-- slide do ní patří a že volba na něm existuje. Pravidlo pro účastníka tedy
-- zmizí a čtení hlasů zůstává jen vlastníkovi prezentace.

drop policy if exists "answers_update_active" on public.answers;
drop policy if exists "answers_select_own" on public.answers;
