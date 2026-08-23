-- Účastníci a jejich odpovědi na kvízové otázky.
--
-- Spusť v Supabase SQL editoru. Je to idempotentní (dá se pustit vícekrát).
--
-- Účastníci se nepřihlašují, takže se identifikují jen přezdívkou a id, které
-- si drží v prohlížeči. Zápis proto musí projít i anonymně; průběžné výsledky
-- naopak čte jen vlastník prezentace, ať publikum nevidí, jak kdo hlasuje.

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  nickname text not null,
  created_at timestamptz not null default now()
);

create index if not exists participants_session_idx
  on public.participants(session_id);

create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  slide_id uuid not null references public.slides(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  -- id odpovědi z config.quiz.answers (a, b, c, d)
  answer_id text not null,
  created_at timestamptz not null default now(),
  -- každý hlasuje na slide jen jednou
  unique (slide_id, participant_id)
);

create index if not exists answers_session_slide_idx
  on public.answers(session_id, slide_id);

alter table public.participants enable row level security;
alter table public.answers enable row level security;

drop policy if exists "participants_insert_any" on public.participants;
create policy "participants_insert_any"
  on public.participants for insert
  with check (true);

drop policy if exists "participants_select_any" on public.participants;
create policy "participants_select_any"
  on public.participants for select
  using (true);

drop policy if exists "answers_insert_any" on public.answers;
create policy "answers_insert_any"
  on public.answers for insert
  with check (true);

drop policy if exists "answers_select_owner" on public.answers;
create policy "answers_select_owner"
  on public.answers for select
  to authenticated
  using (
    exists (
      select 1
      from public.sessions s
      join public.presentations p on p.id = s.presentation_id
      where s.id = answers.session_id
        and p.user_id = auth.uid()
    )
  );

-- Realtime: přednášející vidí přibývat účastníky i odpovědi.
-- Přidání do publikace hlásí chybu, když tam tabulka už je, proto to odchytáme.
do $$
begin
  alter publication supabase_realtime add table public.participants;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.answers;
exception
  when duplicate_object then null;
end $$;
