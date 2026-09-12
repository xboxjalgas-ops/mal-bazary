-- Мал Базары: аккаунтпен синхрондалатын таңдаулылар.
-- Supabase SQL Editor-де бір рет орындаңыз; қайталап орындау қауіпсіз.
create table if not exists favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

alter table favorites enable row level security;
create index if not exists favorites_user_created_idx on favorites(user_id, created_at desc);

-- Қолданба деректерді тек қорғалған server API арқылы өзгертеді.
-- Service role RLS-ті айналып өтеді; public/authenticated рөлдеріне саясат берілмейді.