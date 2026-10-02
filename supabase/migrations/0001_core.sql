-- supabase/migrations/0001_core.sql
-- Schéma de base pour la plateforme pharmaceutique Bénin

create table geo_areas (
  id            bigint generated always as identity primary key,
  level         text not null check (level in ('department','commune','arrondissement','neighbourhood')),
  name          text not null,
  parent_id     bigint references geo_areas(id),
  population    integer,
  centroid_lat  double precision,
  centroid_lon  double precision,
  source        text not null,
  source_url    text
);

create table facilities (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  type               text not null check (type in ('central_depot','referral_hospital','health_center','pharmacy')),
  area_id            bigint references geo_areas(id),
  lat                double precision not null,
  lon                double precision not null,
  served_population  integer,
  storage_capacity_l integer,
  has_cold_chain     boolean not null default false,
  osm_id             text,
  source             text not null,
  source_url         text,
  is_simulated       boolean not null default false
);

create table products (
  id                    uuid primary key default gen_random_uuid(),
  code                  text unique not null,
  inn_name              text not null,
  form                  text,
  strength              text,
  pack_size             integer not null,
  unit_cost_xof         numeric(12,2),
  volume_l_per_unit     numeric(8,4) not null,
  requires_cold_chain   boolean not null default false,
  shelf_life_days       integer not null,
  is_tracer             boolean not null default true,
  substitute_group      text
);

create table consumption_weekly (
  week_start     date not null,
  facility_id    uuid not null references facilities(id),
  product_id     uuid not null references products(id),
  qty_dispensed  integer not null check (qty_dispensed >= 0),
  stockout_days  smallint not null default 0 check (stockout_days between 0 and 7),
  is_simulated   boolean not null default true,
  primary key (week_start, facility_id, product_id)
);

create table forecasts (
  run_id         uuid not null,
  facility_id    uuid not null references facilities(id),
  product_id     uuid not null references products(id),
  week_start     date not null,
  horizon_weeks  smallint not null,
  q10            numeric,
  q50            numeric,
  q90            numeric,
  model_version  text not null,
  created_at     timestamptz not null default now(),
  primary key (run_id, facility_id, product_id, week_start)
);

create table profiles (
  user_id      uuid primary key,
  role         text not null check (role in ('admin','depot_manager','facility_pharmacist','decision_maker','demo')),
  facility_id  uuid references facilities(id)
);

-- Activation impérative de la sécurité au niveau des lignes (RLS)
alter table geo_areas enable row level security;
alter table facilities enable row level security;
alter table products enable row level security;
alter table consumption_weekly enable row level security;
alter table forecasts enable row level security;

-- Politiques de lecture publique pour le mode démonstration
create policy "lecture_publique_geo" on geo_areas for select using (true);
create policy "lecture_publique_facilities" on facilities for select using (true);
create policy "lecture_publique_products" on products for select using (true);
create policy "lecture_publique_forecasts" on forecasts for select using (true);
