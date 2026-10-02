-- supabase/migrations/0003_results.sql
-- Tables de résultats du pipeline : scores de risque, alertes, métriques du modèle
-- CDC §6.3 — tables requises non créées dans 0001/0002

-- ── risk_scores ────────────────────────────────────────────────────────────────
create table risk_scores (
  id                         uuid primary key default gen_random_uuid(),
  run_id                     uuid not null,
  facility_id                uuid not null references facilities(id),
  product_id                 uuid not null references products(id),
  days_coverage              numeric(8,2),
  days_coverage_conservative numeric(8,2),
  p_stockout_7d              numeric(6,4) check (p_stockout_7d between 0 and 1),
  p_stockout_14d             numeric(6,4) check (p_stockout_14d between 0 and 1),
  p_stockout_30d             numeric(6,4) check (p_stockout_30d between 0 and 1),
  expiry_loss_units          integer,
  priority_score             numeric(6,4) check (priority_score between 0 and 1),
  priority_r                 numeric(6,4),  -- composante risque rupture
  priority_c                 numeric(6,4),  -- composante criticité clinique
  priority_p                 numeric(6,4),  -- composante population
  priority_t                 numeric(6,4),  -- composante temps sans livraison
  model_version              text not null,
  created_at                 timestamptz not null default now(),
  unique (run_id, facility_id, product_id)
);

-- ── alerts ─────────────────────────────────────────────────────────────────────
create table alerts (
  id              uuid primary key default gen_random_uuid(),
  run_id          uuid not null,
  facility_id     uuid not null references facilities(id),
  product_id      uuid not null references products(id),
  alert_type      text not null check (alert_type in (
                    'stockout_critical', 'stockout_risk',
                    'expiry_risk', 'excess_stock', 'cold_chain_break'
                  )),
  severity        text not null check (severity in ('critical', 'high', 'medium', 'low'))
                  default 'medium',
  message_fr      text not null,
  acknowledged    boolean not null default false,
  acknowledged_at timestamptz,
  acknowledged_by uuid references auth.users(id),
  created_at      timestamptz not null default now()
);

-- ── model_metrics ──────────────────────────────────────────────────────────────
-- Alimentée UNIQUEMENT par le chargement de metrics.json généré par ml/evaluate.py
-- Jamais écrite à la main (CDC §9.1 règle 2)
create table model_metrics (
  id                    uuid primary key default gen_random_uuid(),
  model_version         text not null,
  generated_at          timestamptz not null,
  split                 text not null check (split in ('test', 'val')),
  git_hash              text,
  data_hash             text,
  -- Métriques globales
  wape                  numeric(10,6),
  wape_naive            numeric(10,6),
  test_wape             numeric(10,6),
  mase                  numeric(10,6),
  rmsse                 numeric(10,6),
  bias                  numeric(10,6),
  coverage_q10_q90      numeric(10,6),
  oracle_wape           numeric(10,6),
  efficiency            numeric(10,6),
  -- Métriques détaillées (stockées en JSONB pour flexibilité)
  by_facility_type      jsonb,
  by_department         jsonb,
  by_product_family     jsonb,
  -- Calibration conforme
  empirical_coverage_cqr numeric(10,6),
  status                text not null default 'validated_on_simulated_data',
  source_file_hash      text   -- SHA-256 du fichier metrics.json
);

-- ── orders ─────────────────────────────────────────────────────────────────────
create table orders (
  id             uuid primary key default gen_random_uuid(),
  facility_id    uuid not null references facilities(id),
  product_id     uuid not null references products(id),
  ordered_on     date not null,
  qty_requested  integer not null check (qty_requested > 0),
  qty_delivered  integer check (qty_delivered >= 0),
  delivered_on   date,
  is_simulated   boolean not null default true
);

-- ── vehicles ───────────────────────────────────────────────────────────────────
create table vehicles (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  capacity_l          integer not null check (capacity_l > 0),
  has_cold_chain      boolean not null default false,
  cost_per_km_xof     numeric(10,2),
  max_shift_minutes   integer not null default 480
);

-- ── travel_matrix ──────────────────────────────────────────────────────────────
create table travel_matrix (
  from_facility_id  uuid not null references facilities(id),
  to_facility_id    uuid not null references facilities(id),
  distance_m        integer not null check (distance_m >= 0),
  duration_s        integer not null check (duration_s >= 0),
  method            text not null check (method in ('osrm', 'ors', 'osmnx', 'haversine_x1.4')),
  primary key (from_facility_id, to_facility_id)
);

-- ── weather_weekly ─────────────────────────────────────────────────────────────
create table weather_weekly (
  area_id       bigint not null references geo_areas(id),
  week_start    date not null,
  rain_mm       numeric(8,2),
  temp_mean_c   numeric(6,2),
  source        text not null,
  primary key (area_id, week_start)
);

-- ── scenarios ──────────────────────────────────────────────────────────────────
create table scenarios (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  params      jsonb not null,
  results     jsonb,
  created_at  timestamptz not null default now()
);

-- ── unserved_stops ─────────────────────────────────────────────────────────────
create table unserved_stops (
  run_id       uuid not null,
  facility_id  uuid not null references facilities(id),
  reason       text,
  primary key (run_id, facility_id)
);

-- ── route_stops ────────────────────────────────────────────────────────────────
create table route_stops (
  route_id     uuid not null references delivery_routes(id),
  stop_order   smallint not null,
  facility_id  uuid not null references facilities(id),
  eta_s        integer,   -- secondes depuis le départ du dépôt
  primary key (route_id, stop_order)
);

-- ── Corriger profiles pour référencer auth.users (CDC §6.3) ───────────────────
-- (Ne pas recréer si déjà en ordre ; cette migration est rejoutable)
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'profiles_user_id_fkey'
    and table_name = 'profiles'
  ) then
    alter table profiles
      add constraint profiles_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end $$;

-- ── RLS sur toutes les nouvelles tables ───────────────────────────────────────
alter table risk_scores    enable row level security;
alter table alerts         enable row level security;
alter table model_metrics  enable row level security;
alter table orders         enable row level security;
alter table vehicles       enable row level security;
alter table travel_matrix  enable row level security;
alter table weather_weekly enable row level security;
alter table scenarios      enable row level security;
alter table unserved_stops enable row level security;
alter table route_stops    enable row level security;

-- Lecture publique pour le mode démonstration (données simulées)
create policy "lecture_publique_risk_scores"    on risk_scores    for select using (true);
create policy "lecture_publique_alerts"         on alerts         for select using (true);
create policy "lecture_publique_model_metrics"  on model_metrics  for select using (true);
create policy "lecture_publique_vehicles"       on vehicles       for select using (true);
create policy "lecture_publique_scenarios"      on scenarios      for select using (true);
create policy "lecture_publique_unserved_stops" on unserved_stops for select using (true);
create policy "lecture_publique_route_stops"    on route_stops    for select using (true);

-- Écriture : uniquement via clé de service (run_pipeline.py, load_to_supabase.py)
-- Aucune politique d'écriture publique n'est créée ici.
-- L'écriture passe par SUPABASE_SERVICE_ROLE_KEY qui contourne RLS.

-- ── Index de performance ──────────────────────────────────────────────────────
create index idx_risk_scores_run   on risk_scores  (run_id);
create index idx_alerts_run        on alerts       (run_id);
create index idx_alerts_fac_prod   on alerts       (facility_id, product_id);
create index idx_orders_facility   on orders       (facility_id, product_id, ordered_on);
create index idx_route_stops_route on route_stops  (route_id);
