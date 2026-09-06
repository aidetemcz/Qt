-- Diagnostika: co teď na tabulkách doopravdy platí.
-- Spusť v Supabase SQL editoru a pošli výsledky, když něco nesedí.

-- 1) Je vůbec zapnuté RLS? Všude musí být rowsecurity = true.
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'presentations', 'slides', 'sessions', 'participants', 'answers', 'words'
  )
order by tablename;

-- 2) Jaká pravidla existují. U slides, presentations a participants nesmí
-- zůstat žádné pro roli anon a žádné s podmínkou "true".
select tablename, policyname, cmd, roles, qual
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 3) Nemá anon práva mimo RLS? Tady by u těchto tabulek nemělo být SELECT.
select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
  and table_name in (
    'presentations', 'slides', 'sessions', 'participants'
  )
order by table_name, grantee, privilege_type;
