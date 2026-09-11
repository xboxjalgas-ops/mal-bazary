-- Мал Базары production platform: moderation, structured locations and cleanup.
-- Safe to run once; repeated schema statements are idempotent.
alter table listings add column if not exists moderation_status text not null default 'approved';
alter table products add column if not exists moderation_status text not null default 'approved';
alter table users add column if not exists blocked boolean not null default false;
alter table listings add column if not exists region text not null default '';
alter table listings add column if not exists district text not null default '';
alter table listings add column if not exists village text not null default '';
alter table products add column if not exists region text not null default '';
alter table products add column if not exists district text not null default '';
alter table products add column if not exists village text not null default '';
do $$ begin
  if not exists(select 1 from pg_constraint where conname='listings_moderation_status_check') then alter table listings add constraint listings_moderation_status_check check(moderation_status in('pending','approved','rejected')); end if;
  if not exists(select 1 from pg_constraint where conname='products_moderation_status_check') then alter table products add constraint products_moderation_status_check check(moderation_status in('pending','approved','rejected')); end if;
end $$;
create index if not exists listings_moderation_created_idx on listings(moderation_status,created_at desc);
create index if not exists products_moderation_created_idx on products(moderation_status,created_at desc);
create index if not exists listings_region_district_idx on listings(region,district);
-- Remove old seed/demo records. Real authenticated listings remain.
delete from listings where seller_auth_id is null;
delete from products where seller_auth_id is null;
update users set role='admin' where lower(email)='xboxjalgas@gmail.com';
