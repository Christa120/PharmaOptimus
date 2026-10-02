-- supabase/seed/001_app_config.sql
-- Valeurs initiales de configuration de l'application
-- Exécuter après les migrations sur une base vide

insert into app_config (key, value) values
  ('current_run_id',   'null'::jsonb),
  ('country',          '"Bénin"'::jsonb),
  ('currency',         '"XOF"'::jsonb),
  ('timezone',         '"Africa/Porto-Novo"'::jsonb),
  ('stock_health_thresholds', '{"good": 75, "warning": 50, "critical": 0}'::jsonb),
  ('stockout_alert_threshold', '0.50'::jsonb),
  ('safety_stock_days', '21'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();
