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
