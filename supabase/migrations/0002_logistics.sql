-- supabase/migrations/0002_logistics.sql
-- Tables de logistique, transferts, tournées VRP et traçabilité des runs

-- pipeline_runs doit être créé avant delivery_routes (référence FK)
create table if not exists pipeline_runs (
  run_id            uuid primary key,
  started_at        timestamptz not null,
  finished_at       timestamptz,
  model_version     text not null,
  data_cutoff_week  date,
  status            text not null check (status in ('running', 'success', 'failed')),
  rows_written      integer,
  notes             text
);

-- Migration conditionnelle pour les bases déjà existantes
alter table pipeline_runs add column if not exists rows_written integer;

create table if not exists stock_weekly (
  week_start        date not null,
  facility_id       uuid not null references facilities(id),
  product_id        uuid not null references products(id),
  qty_on_hand       integer not null check (qty_on_hand >= 0),
  qty_expiring_30d  integer not null default 0,
  qty_expiring_90d  integer not null default 0,
  primary key (week_start, facility_id, product_id)
);

create table if not exists lots (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references products(id),
  facility_id  uuid not null references facilities(id),
  lot_code     text not null,
  quantity     integer not null check (quantity >= 0),
  expiry_date  date not null,
  received_on  date not null
);

create table if not exists transfer_recommendations (
  id                uuid primary key default gen_random_uuid(),
  run_id            uuid not null,
  from_facility_id  uuid not null references facilities(id),
  to_facility_id    uuid not null references facilities(id),
  product_id        uuid not null references products(id),
  quantity          integer not null check (quantity > 0),
  reason            text not null,
  status            text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  rejection_reason  text,
  created_at        timestamptz not null default now()
);

-- delivery_routes : schéma compatible avec DeliveryRoute TypeScript et /app/tournees
-- La table ancienne (incompatible) est supprimée et recréée
drop table if exists delivery_routes;
create table delivery_routes (
  id           uuid primary key default gen_random_uuid(),
  run_id       uuid not null references pipeline_runs(run_id),
  vehicle_id   text not null,
  stop_order   smallint not null,
  facility_id  uuid not null references facilities(id),
  arrival_time timestamptz,
  distance_km  numeric(10,2),
  created_at   timestamptz not null default now()
);

create table if not exists app_config (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- RLS
alter table stock_weekly enable row level security;
alter table lots enable row level security;
alter table transfer_recommendations enable row level security;
alter table delivery_routes enable row level security;
alter table pipeline_runs enable row level security;
alter table app_config enable row level security;

create policy "lecture_publique_stocks"    on stock_weekly            for select using (true);
create policy "lecture_publique_transfers" on transfer_recommendations for select using (true);
create policy "lecture_publique_routes"    on delivery_routes          for select using (true);
create policy "lecture_publique_config"    on app_config               for select using (true);

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'pipeline_runs'
      and policyname = 'lecture_publique_pipeline_runs'
  ) then
    execute 'create policy "lecture_publique_pipeline_runs" on pipeline_runs for select using (true)';
  end if;
end $$;
