-- Uzavření čtení pro nepřihlášené (anon klíč).
--
-- Spusť v Supabase SQL editoru AŽ POTÉ, co je na Vercelu nastavená proměnná
-- SUPABASE_SERVICE_ROLE_KEY a projekt je znovu nasazený. Bez ní by se
-- účastníkům přestaly načítat slidy.
--
-- Proč: s veřejným anon klíčem šel z prohlížeče stáhnout obsah tabulky slides
-- včetně příznaku správné odpovědi, a taky seznam prezentací a přezdívek.
-- Nově je čtení těchto tabulek jen pro vlastníka prezentace; účastníkům data
-- podává server, který z kvízu správnou odpověď odstraní.

alter table public.presentations enable row level security;
alter table public.slides enable row level security;
alter table public.sessions enable row level security;
alter table public.participants enable row level security;

-- 1) Prezentace: jen vlastník.
drop policy if exists "presentations_select_own" on public.presentations;
create policy "presentations_select_own"
  on public.presentations for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "presentations_insert_own" on public.presentations;
create policy "presentations_insert_own"
  on public.presentations for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "presentations_update_own" on public.presentations;
create policy "presentations_update_own"
  on public.presentations for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "presentations_delete_own" on public.presentations;
create policy "presentations_delete_own"
  on public.presentations for delete
  to authenticated
  using (user_id = auth.uid());

-- 2) Slidy: jen vlastník nadřazené prezentace. Tohle je ta klíčová změna —
-- správné odpovědi se tím přestanou dát přečíst z prohlížeče.
drop policy if exists "slides_select_own" on public.slides;
create policy "slides_select_own"
  on public.slides for select
  to authenticated
  using (
    exists (
      select 1 from public.presentations p
      where p.id = slides.presentation_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "slides_insert_own" on public.slides;
create policy "slides_insert_own"
  on public.slides for insert
  to authenticated
  with check (
    exists (
      select 1 from public.presentations p
      where p.id = slides.presentation_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "slides_update_own" on public.slides;
create policy "slides_update_own"
  on public.slides for update
  to authenticated
  using (
    exists (
      select 1 from public.presentations p
      where p.id = slides.presentation_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.presentations p
      where p.id = slides.presentation_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "slides_delete_own" on public.slides;
create policy "slides_delete_own"
  on public.slides for delete
  to authenticated
  using (
    exists (
      select 1 from public.presentations p
      where p.id = slides.presentation_id and p.user_id = auth.uid()
    )
  );

-- 3) Účastníci: seznam přezdívek vidí jen vlastník (lobby). Připojit se smí
-- kdokoli, kdo zná id běžící relace.
drop policy if exists "participants_select_any" on public.participants;
drop policy if exists "participants_select_owner" on public.participants;
create policy "participants_select_owner"
  on public.participants for select
  to authenticated
  using (
    exists (
      select 1
      from public.sessions s
      join public.presentations p on p.id = s.presentation_id
      where s.id = participants.session_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "participants_insert_any" on public.participants;
create policy "participants_insert_any"
  on public.participants for insert
  with check (
    exists (
      select 1 from public.sessions s
      where s.id = participants.session_id and s.is_active
    )
  );

-- 4) Relace: účastník na ně musí vidět, jinak mu nechodí realtime (odběr
-- postgres_changes kontroluje právo na čtení řádku) a nešlo by se připojit
-- kódem. Nově aspoň jen ty běžící — skončené relace a jejich kódy zmizí.
drop policy if exists "sessions_select_all" on public.sessions;
drop policy if exists "sessions_select_active" on public.sessions;
create policy "sessions_select_active"
  on public.sessions for select
  using (is_active or exists (
    select 1 from public.presentations p
    where p.id = sessions.presentation_id and p.user_id = auth.uid()
  ));

-- Zápis do relace zůstává vlastníkovi (beze změny oproti policies.sql).
drop policy if exists "sessions_insert_own" on public.sessions;
create policy "sessions_insert_own"
  on public.sessions for insert
  to authenticated
  with check (
    exists (
      select 1 from public.presentations p
      where p.id = sessions.presentation_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "sessions_update_own" on public.sessions;
create policy "sessions_update_own"
  on public.sessions for update
  to authenticated
  using (
    exists (
      select 1 from public.presentations p
      where p.id = sessions.presentation_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.presentations p
      where p.id = sessions.presentation_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "sessions_delete_own" on public.sessions;
create policy "sessions_delete_own"
  on public.sessions for delete
  to authenticated
  using (
    exists (
      select 1 from public.presentations p
      where p.id = sessions.presentation_id and p.user_id = auth.uid()
    )
  );

-- 5) Kontrola: tohle musí vypsat rowsecurity = true u všech tabulek.
-- select tablename, rowsecurity from pg_tables
-- where schemaname = 'public'
--   and tablename in ('presentations','slides','sessions','participants',
--                     'answers','words');
