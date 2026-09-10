-- Мал Базары: жаңа Supabase жобасына арналған қайталап орындауға болатын схема.
create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  email text,
  phone text unique not null check (phone ~ '^\\+7[0-9]{10}$'),
  name text not null check (char_length(name) between 2 and 80),
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('Сиыр','Қой','Жылқы','Тауық','Қаз','Үйрек','Қоян')),
  title text not null check (char_length(title) between 3 and 120),
  description text not null default '' check (char_length(description) <= 1500),
  price numeric not null check (price > 0 and price <= 1000000000),
  location text not null check (char_length(location) between 2 and 120),
  seller_name text not null,
  seller_phone text not null check (seller_phone ~ '^\\+7[0-9]{10}$'),
  seller_avatar text,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('tag-good','tag-budget','tag-med','tag-coop')),
  name text not null check (char_length(name) between 3 and 120),
  description text not null default '' check (char_length(description) <= 1500),
  price text not null check (char_length(price) between 1 and 60),
  location text not null check (char_length(location) between 2 and 120),
  seller_name text not null,
  seller_phone text not null check (seller_phone ~ '^\\+7[0-9]{10}$'),
  seller_avatar text,
  created_at timestamptz not null default now()
);

alter table users enable row level security;
alter table listings enable row level security;
alter table products enable row level security;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Public read avatars') then
    create policy "Public read avatars" on storage.objects for select using (bucket_id = 'avatars');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='listings' and policyname='Public read listings') then
    create policy "Public read listings" on listings for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='products' and policyname='Public read products') then
    create policy "Public read products" on products for select using (true);
  end if;
end $$;

create index if not exists users_auth_user_id_idx on users (auth_user_id);
create index if not exists users_email_idx on users (email);
create index if not exists listings_created_at_idx on listings (created_at desc);
create index if not exists listings_type_created_at_idx on listings (type, created_at desc);
create index if not exists listings_seller_phone_idx on listings (seller_phone);
create index if not exists products_created_at_idx on products (created_at desc);
create index if not exists products_category_created_at_idx on products (category, created_at desc);
create index if not exists products_seller_phone_idx on products (seller_phone);
