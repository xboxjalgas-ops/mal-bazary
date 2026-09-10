-- Мал Базары: жаңа Supabase жобасына арналған қайталап орындауға болатын схема.
create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  email text,
  phone text unique not null check (phone ~ '^\\+7[0-9]{10}$'),
  name text not null check (char_length(name) between 2 and 80),
  avatar_url text,
  role text not null default 'user' check (role in ('user','admin')),
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
  images jsonb not null default '[]'::jsonb,
  status text not null default 'active' check (status in ('active','sold')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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
  images jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

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

alter table users enable row level security;
alter table support_tickets enable row level security;
alter table listings enable row level security;
alter table products enable row level security;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true), ('listing-images', 'listing-images', true)
on conflict (id) do update set public = excluded.public;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Public read avatars') then
    create policy "Public read avatars" on storage.objects for select using (bucket_id = 'avatars');
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Public read listing images') then
    create policy "Public read listing images" on storage.objects for select using (bucket_id = 'listing-images');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='listings' and policyname='Public read listings') then
    create policy "Public read listings" on listings for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='products' and policyname='Public read products') then
    create policy "Public read products" on products for select using (true);
  end if;
end $$;

create index if not exists support_tickets_user_created_idx on support_tickets (auth_user_id, created_at desc);
create index if not exists support_tickets_status_created_idx on support_tickets (status, created_at desc);
create index if not exists users_auth_user_id_idx on users (auth_user_id);
create index if not exists users_email_idx on users (email);
create index if not exists listings_created_at_idx on listings (created_at desc);
create index if not exists listings_type_created_at_idx on listings (type, created_at desc);
create index if not exists listings_seller_phone_idx on listings (seller_phone);
create index if not exists products_created_at_idx on products (created_at desc);
create index if not exists products_category_created_at_idx on products (category, created_at desc);
create index if not exists products_seller_phone_idx on products (seller_phone);
-- Мал Базары: чат, ұсыныс, дүкен, рейтинг, құжат және бронь модулі
-- Қауіпсіз, қайталап орындауға болады.
create extension if not exists pgcrypto;

alter table users add column if not exists shop_name text not null default '';
alter table users add column if not exists bio text not null default '';
alter table users add column if not exists verified boolean not null default false;
alter table listings add column if not exists seller_auth_id uuid references auth.users(id) on delete set null;
alter table listings add column if not exists animal_details jsonb not null default '{}'::jsonb;
alter table products add column if not exists seller_auth_id uuid references auth.users(id) on delete set null;

update listings l set seller_auth_id=u.auth_user_id from users u where l.seller_auth_id is null and l.seller_phone=u.phone;
update products p set seller_auth_id=u.auth_user_id from users u where p.seller_auth_id is null and p.seller_phone=u.phone;

create table if not exists conversations (
 id uuid primary key default gen_random_uuid(), listing_id uuid not null references listings(id) on delete cascade,
 listing_title text not null, buyer_id uuid not null references auth.users(id) on delete cascade,
 buyer_name text not null, seller_id uuid not null references auth.users(id) on delete cascade,
 seller_name text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(listing_id,buyer_id,seller_id), check (buyer_id<>seller_id)
);
create table if not exists messages (
 id uuid primary key default gen_random_uuid(), conversation_id uuid not null references conversations(id) on delete cascade,
 sender_id uuid not null references auth.users(id) on delete cascade, sender_name text not null,
 body text not null check(char_length(body) between 1 and 1500), read_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists offers (
 id uuid primary key default gen_random_uuid(), listing_id uuid not null references listings(id) on delete cascade,
 listing_title text not null, buyer_id uuid not null references auth.users(id) on delete cascade, buyer_name text not null,
 seller_id uuid not null references auth.users(id) on delete cascade, amount numeric not null check(amount>0 and amount<=1000000000),
 status text not null default 'pending' check(status in('pending','accepted','rejected','cancelled')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(listing_id,buyer_id)
);
create table if not exists reservations (
 id uuid primary key default gen_random_uuid(), listing_id uuid not null references listings(id) on delete cascade,
 listing_title text not null, buyer_id uuid not null references auth.users(id) on delete cascade, buyer_name text not null,
 seller_id uuid not null references auth.users(id) on delete cascade,
 status text not null default 'pending' check(status in('pending','accepted','rejected','cancelled','completed')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(listing_id,buyer_id)
);
create table if not exists reviews (
 id uuid primary key default gen_random_uuid(), listing_id uuid not null references listings(id) on delete cascade,
 listing_title text not null, reviewer_id uuid not null references auth.users(id) on delete cascade, reviewer_name text not null,
 seller_id uuid not null references auth.users(id) on delete cascade, rating smallint not null check(rating between 1 and 5),
 comment text not null default '' check(char_length(comment)<=600), created_at timestamptz not null default now(), unique(listing_id,reviewer_id)
);

alter table conversations enable row level security; alter table messages enable row level security;
alter table offers enable row level security; alter table reservations enable row level security; alter table reviews enable row level security;
create index if not exists conversations_buyer_idx on conversations(buyer_id,updated_at desc);
create index if not exists conversations_seller_idx on conversations(seller_id,updated_at desc);
create index if not exists messages_conversation_idx on messages(conversation_id,created_at);
create index if not exists offers_seller_idx on offers(seller_id,created_at desc);
create index if not exists reservations_seller_idx on reservations(seller_id,created_at desc);
create index if not exists reviews_seller_idx on reviews(seller_id,created_at desc);
create index if not exists listings_seller_auth_idx on listings(seller_auth_id,created_at desc);

-- Қоғамдық бетте тек пікірлерді оқу. Жазу/өзгерту тек сервер API арқылы.
do $$ begin
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='reviews' and policyname='Public read reviews') then
  create policy "Public read reviews" on reviews for select using(true);
 end if;
end $$;
