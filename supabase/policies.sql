-- Row Level Security for Qt
--
-- Run this in the Supabase SQL editor. It is idempotent (safe to re-run):
-- existing policies are dropped and recreated.
--
-- Model: a user may only read and modify their own presentations, and the
-- slides that belong to those presentations. `presentations.user_id` defaults
-- to auth.uid() (added in an earlier migration), so inserts need no explicit
-- user_id from the app.

-- 1) Turn RLS on. With RLS enabled and no matching policy, access is denied.
alter table public.presentations enable row level security;
alter table public.slides enable row level security;

-- 2) Presentations: the owner has full access to their own rows.
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

-- 3) Slides: access is governed by the parent presentation's owner.
drop policy if exists "slides_select_own" on public.slides;
create policy "slides_select_own"
  on public.slides for select
  to authenticated
  using (
    exists (
      select 1 from public.presentations p
      where p.id = slides.presentation_id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists "slides_insert_own" on public.slides;
create policy "slides_insert_own"
  on public.slides for insert
  to authenticated
  with check (
    exists (
      select 1 from public.presentations p
      where p.id = slides.presentation_id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists "slides_update_own" on public.slides;
create policy "slides_update_own"
  on public.slides for update
  to authenticated
  using (
    exists (
      select 1 from public.presentations p
      where p.id = slides.presentation_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.presentations p
      where p.id = slides.presentation_id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists "slides_delete_own" on public.slides;
create policy "slides_delete_own"
  on public.slides for delete
  to authenticated
  using (
    exists (
      select 1 from public.presentations p
      where p.id = slides.presentation_id
        and p.user_id = auth.uid()
    )
  );

-- 4) Sessions: anyone (incl. anonymous audience) may read; only the owner of
-- the parent presentation may create or modify them.
alter table public.sessions enable row level security;

drop policy if exists "sessions_select_all" on public.sessions;
create policy "sessions_select_all"
  on public.sessions for select
  using (true);

drop policy if exists "sessions_insert_own" on public.sessions;
create policy "sessions_insert_own"
  on public.sessions for insert
  to authenticated
  with check (
    exists (
      select 1 from public.presentations p
      where p.id = sessions.presentation_id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists "sessions_update_own" on public.sessions;
create policy "sessions_update_own"
  on public.sessions for update
  to authenticated
  using (
    exists (
      select 1 from public.presentations p
      where p.id = sessions.presentation_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.presentations p
      where p.id = sessions.presentation_id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists "sessions_delete_own" on public.sessions;
create policy "sessions_delete_own"
  on public.sessions for delete
  to authenticated
  using (
    exists (
      select 1 from public.presentations p
      where p.id = sessions.presentation_id
        and p.user_id = auth.uid()
    )
  );
