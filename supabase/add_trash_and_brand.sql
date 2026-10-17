-- Koš u prezentací a nastavení značky.
--
-- Spusť v Supabase SQL editoru. Je to idempotentní (dá se pustit vícekrát).
--
-- 1) Koš: smazaná prezentace se jen označí datem. Dashboard ji přestane
--    ukazovat, ale dá se vrátit — i s relacemi a výsledky, které by při
--    skutečném smazání spadly s ní.
-- 2) Značka: barvy a logo, které si uživatel nastaví jednou a pak je má
--    po ruce v každém slidu.

alter table public.presentations
  add column if not exists deleted_at timestamptz;

create index if not exists presentations_deleted_idx
  on public.presentations(user_id, deleted_at);

create table if not exists public.brand_kits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  colors jsonb not null default '[]',
  logo_url text,
  updated_at timestamptz not null default now()
);

alter table public.brand_kits enable row level security;

-- Supabase nové tabulce práva obvykle přidělí samo, ale explicitně je to
-- jistota — bez toho skončí čtení na "permission denied", ne na pravidlech.
grant select, insert, update, delete on public.brand_kits to authenticated;

drop policy if exists "brand_select_own" on public.brand_kits;
create policy "brand_select_own"
  on public.brand_kits for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "brand_insert_own" on public.brand_kits;
create policy "brand_insert_own"
  on public.brand_kits for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "brand_update_own" on public.brand_kits;
create policy "brand_update_own"
  on public.brand_kits for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "brand_delete_own" on public.brand_kits;
create policy "brand_delete_own"
  on public.brand_kits for delete
  to authenticated
  using (user_id = auth.uid());
