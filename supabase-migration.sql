-- Existing production database: safe, repeatable performance migration.
create index if not exists listings_created_at_idx on listings (created_at desc);
create index if not exists listings_type_created_at_idx on listings (type, created_at desc);
create index if not exists listings_seller_phone_idx on listings (seller_phone);
create index if not exists products_created_at_idx on products (created_at desc);
create index if not exists products_category_created_at_idx on products (category, created_at desc);
create index if not exists products_seller_phone_idx on products (seller_phone);
