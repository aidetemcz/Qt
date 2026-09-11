-- Účastník smí svůj hlas změnit, když se uklikl.
--
-- Spusť v Supabase SQL editoru. Je to idempotentní (dá se pustit vícekrát).
--
-- Hlas se ukládá jako jeden řádek na dvojici (slide, účastník). Aby šla volba
-- přepsat, musí projít UPDATE — dosud bylo povolené jen vložení, takže druhé
-- odeslání naráželo na unikátní index. Přepsat jde jen hlas v běžící relaci;
-- po ukončení prezentace jsou výsledky uzavřené.
--
-- Čtení zůstává jen vlastníkovi prezentace (viz add_answers.sql): publikum se
-- dál nemá jak podívat, kdo jak hlasoval.

alter table public.answers enable row level security;

drop policy if exists "answers_update_active" on public.answers;
create policy "answers_update_active"
  on public.answers for update
  using (
    exists (
      select 1 from public.sessions s
      where s.id = answers.session_id and s.is_active
    )
  )
  with check (
    exists (
      select 1 from public.sessions s
      where s.id = answers.session_id and s.is_active
    )
  );
