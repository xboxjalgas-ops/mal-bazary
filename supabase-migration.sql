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

-- Admin role and product images.
alter table users add column if not exists role text not null default 'user';
update users set role='admin' where lower(email)='xboxjalgas@gmail.com';
alter table products add column if not exists images jsonb not null default '[]'::jsonb;

-- Internal support center.
create table if not exists support_tickets (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  user_name text not null,
  user_email text,
  category text not null,
  subject text not null check (char_length(subject) between 5 and 120),
  message text not null check (char_length(message) between 10 and 2000),
  status text not null default 'new' check (status in ('new','in_progress','answered','closed')),
  admin_reply text not null default '' check (char_length(admin_reply) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table support_tickets enable row level security;
create index if not exists support_tickets_user_created_idx on support_tickets (auth_user_id, created_at desc);
create index if not exists support_tickets_status_created_idx on support_tickets (status, created_at desc);
