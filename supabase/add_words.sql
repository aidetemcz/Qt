-- Slova od publika pro word cloud.
--
-- Spusť v Supabase SQL editoru. Je to idempotentní (dá se pustit vícekrát).
--
-- Oproti kvízu a anketě tu účastník neposílá jednu volbu, ale několik slov,
-- takže to nejde do tabulky answers (ta má jeden hlas na slide). Zápis musí
-- projít i anonymně, čtení má jen vlastník prezentace — cloud se ukazuje na
-- plátně, ne v telefonech.

create table if not exists public.words (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  slide_id uuid not null references public.slides(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

create index if not exists words_session_slide_idx
  on public.words(session_id, slide_id);

alter table public.words enable row level security;

drop policy if exists "words_insert_any" on public.words;
create policy "words_insert_any"
  on public.words for insert
  with check (true);

drop policy if exists "words_select_owner" on public.words;
create policy "words_select_owner"
  on public.words for select
  to authenticated
  using (
    exists (
      select 1
      from public.sessions s
      join public.presentations p on p.id = s.presentation_id
      where s.id = words.session_id
        and p.user_id = auth.uid()
    )
  );

-- Realtime: cloud na plátně roste, jak slova přicházejí.
do $$
begin
  alter publication supabase_realtime add table public.words;
exception
  when duplicate_object then null;
end $$;
