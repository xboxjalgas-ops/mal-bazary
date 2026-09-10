-- Google/Supabase Auth migration. Safe to run more than once.
alter table users add column if not exists auth_user_id uuid references auth.users(id) on delete cascade;
alter table users add column if not exists email text;
create unique index if not exists users_auth_user_id_idx on users (auth_user_id) where auth_user_id is not null;
create index if not exists users_email_idx on users (email);
-- Existing production database: safe, repeatable performance migration.
create index if not exists listings_created_at_idx on listings (created_at desc);
create index if not exists listings_type_created_at_idx on listings (type, created_at desc);
create index if not exists listings_seller_phone_idx on listings (seller_phone);
create index if not exists products_created_at_idx on products (created_at desc);
create index if not exists products_category_created_at_idx on products (category, created_at desc);
create index if not exists products_seller_phone_idx on products (seller_phone);

-- Listing photos, editing and sold status.
alter table listings add column if not exists images jsonb not null default '[]'::jsonb;
alter table listings add column if not exists status text not null default 'active';
alter table listings add column if not exists updated_at timestamptz not null default now();
create index if not exists listings_status_created_at_idx on listings (status, created_at desc);

insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do update set public = excluded.public;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Public read listing images') then
    create policy "Public read listing images" on storage.objects for select using (bucket_id = 'listing-images');
  end if;
end $$;
