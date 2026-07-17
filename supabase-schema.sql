-- ============================================================
-- Мал Базары — Supabase SQL схемасы
-- Мұны Supabase жобаңда: SQL Editor → New query дегенге қойып,
-- "Run" басыңыз (бір рет қана орындалады).
-- ============================================================

create extension if not exists pgcrypto;

-- Мал/хабарландыру кестесі
create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text not null,
  description text default '',
  price numeric not null,
  location text not null,
  seller_name text not null,
  seller_phone text not null,
  created_at timestamptz not null default now()
);

-- Мал шаруашылығы өнімдері (қолданушылар қосқан)
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  name text not null,
  description text default '',
  price text not null,
  location text not null,
  seller_name text not null,
  seller_phone text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ҚОРҒАНЫС: Row Level Security (RLS) — хакерлерден қорғау
-- ============================================================
-- RLS қосылған соң, ешкім (тіпті сайттың құпия емес "ашық" кілтімен
-- де) кестелерге ЖАЗА алмайды, тек ОҚИ алады. Жазу тек Netlify
-- функциялары арқылы (құпия service_role кілтімен, тек серверде)
-- жүзеге асады — сол кілт браузерде ешқашан көрінбейді.

alter table listings enable row level security;
alter table products enable row level security;

-- Кез келген адам хабарландыруларды КӨРЕ алады:
create policy "Public read listings" on listings
  for select using (true);

create policy "Public read products" on products
  for select using (true);

-- Назар аударыңыз: INSERT/UPDATE/DELETE үшін ешбір policy
-- жасалмады — демек, RLS оларды әдепкі бойынша ТОЛЫҚ ТЫЙАДЫ.
-- Тек Netlify функциялары (service_role кілтімен, RLS-ті айналып
-- өтетін) жаза алады.

-- ============================================================
-- (Міндетті емес) Бастапқы демо деректер — қаласаңыз орындаңыз
-- ============================================================
insert into listings (type, title, description, price, location, seller_name, seller_phone) values
  ('Сиыр', 'Қазақы сиыр, 3 жаста, сауын', 'Күніне 12л сүт береді, сау, вакцинасы толық.', 520000, 'Сарыағаш ауданы', 'Асхат Н.', '+7 701 234 56 78'),
  ('Қой', 'Едильбай қошақан, 8 айлық', 'Салмағы 45кг, семіз, отбасылық шаруашылықтан.', 95000, 'Түркістан қаласы', 'Гүлмира А.', '+7 702 345 67 89'),
  ('Жылқы', 'Жылқы, 4 жаста, биесі', 'Құлын әкелген, момын мінезді, жеккіш емес.', 650000, 'Ордабасы ауданы', 'Дархан Т.', '+7 705 111 22 33'),
  ('Тауық', 'Тауық (20 бас), жұмыртқалы тұқым', 'Ломан браун, айына 25-27 жұмыртқа береді.', 3500, 'Шардара ауданы', 'Айгүл С.', '+7 707 888 99 00'),
  ('Қаз', 'Қаз, ересек жұп (аталық+аналық)', 'Таза холмогор тұқымы, жасы 1.5 жыл.', 60000, 'Сарыағаш ауданы', 'Нұрлан Қ.', '+7 700 555 44 33'),
  ('Қоян', 'Қоян балалары, 2 айлық (10 бас)', 'Калифорния тұқымы, тез өседі, сау.', 8000, 'Түркістан қаласы', 'Бекзат М.', '+7 747 222 11 00');
