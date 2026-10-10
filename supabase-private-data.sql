-- Additive hardening for the existing server-only API architecture.
-- Run in a transaction on the verified project after reviewing existing grants.
-- Does not delete data, tables or policies. Does not run older cleanup migrations.
begin;
do $$
declare
  table_name text;
  column_names text;
begin
  foreach table_name in array array[
    'users','listings','products','support_tickets','conversations','messages',
    'offers','reservations','reviews','favorites','user_friendships','profile_photos'
  ] loop
    if to_regclass(format('public.%I', table_name)) is not null then
      execute format('alter table public.%I enable row level security', table_name);
      execute format('revoke all privileges on table public.%I from public, anon, authenticated', table_name);
      -- Table-level REVOKE alone does not remove older column-level privileges.
      select string_agg(quote_ident(attname), ', ') into column_names
        from pg_attribute where attrelid = to_regclass(format('public.%I', table_name))
        and attnum > 0 and not attisdropped;
      execute format('revoke select (%s), insert (%s), update (%s), references (%s) on table public.%I from public, anon, authenticated',
        column_names, column_names, column_names, column_names, table_name);
      execute format('grant select, insert, update, delete on table public.%I to service_role', table_name);
    end if;
  end loop;
end $$;

-- The existing authenticated API signs profile-gallery URLs for permitted viewers only.
update storage.buckets set public = false where id = 'profile-gallery';
-- Public listing photographs remain public by design; never put private documents there.
commit;

-- Verification (read only): review grants and RLS after applying.
select c.relname as table_name, c.relrowsecurity as rls_enabled,
  has_table_privilege('anon', c.oid, 'SELECT') as anonymous_select,
  has_table_privilege('authenticated', c.oid, 'SELECT') as direct_user_select,
  has_any_column_privilege('anon', c.oid, 'SELECT') as anonymous_column_select,
  has_any_column_privilege('authenticated', c.oid, 'SELECT') as user_column_select,
  has_table_privilege('service_role', c.oid, 'SELECT,INSERT,UPDATE,DELETE') as server_access
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in
  ('users','listings','products','support_tickets','conversations','messages',
   'offers','reservations','reviews','favorites','user_friendships','profile_photos');
