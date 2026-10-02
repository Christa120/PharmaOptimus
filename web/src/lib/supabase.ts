import { createClient, SupabaseClient } from '@supabase/supabase-js'

// ─── Table type definitions ──────────────────────────────────────────────────

export interface Facility {
  id: string
  name: string
  type: string
  department: string
  commune: string
  lat: number
  lon: number
  served_population: number
  storage_capacity_l: number
  has_cold_chain: boolean
  is_hard_to_reach: boolean
}

export interface Product {
  id: string
  name_fr: string
  therapeutic_family: string
  criticality: number
  requires_cold_chain: boolean
}

export interface RiskScore {
  id: string
  run_id: string
  facility_id: string
  product_id: string
  days_coverage: number
  days_coverage_conservative: number
  p_stockout_7d: number
  p_stockout_14d: number
  p_stockout_30d: number
  priority_score: number
  created_at: string
}

export interface Alert {
  id: string
  run_id: string
  facility_id: string
  product_id: string
  alert_type: string
  severity: string
  acknowledged: boolean
  acknowledged_at: string | null
  created_at: string
}

export interface TransferRecommendation {
  id: string
  run_id: string
  from_facility_id: string
  to_facility_id: string
  product_id: string
  qty_recommended: number
  status: string
  rejection_reason: string | null
  created_at: string
}

export interface DeliveryRoute {
  id: string
  run_id: string
  vehicle_id: string
  stop_order: number
  facility_id: string
  arrival_time: string
  distance_km: number
  created_at: string
}

export interface Forecast {
  id: string
  run_id: string
  facility_id: string
  product_id: string
  week_start: string
  horizon_weeks: number
  q10: number
  q50: number
  q90: number
  model_version: string
  created_at: string
}

export interface ModelMetrics {
  id: string
  model_version: string
  status: string
  wape: number | null
  mase: number | null
  coverage_q10_q90: number | null
  test_wape: number | null
  generated_at: string
}

export interface PipelineRun {
  run_id: string
  started_at: string
  finished_at: string | null
  status: string
  model_version: string
  cutoff_week: string
  rows_written: number | null
}

export interface AppConfig {
  key: string
  value: string
  updated_at: string
}

export interface Scenario {
  id: string
  name: string
  params: Record<string, unknown>
  results: Record<string, unknown>
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      facilities: { Row: Facility }
      products: { Row: Product }
      risk_scores: { Row: RiskScore }
      alerts: { Row: Alert }
      transfer_recommendations: { Row: TransferRecommendation }
      delivery_routes: { Row: DeliveryRoute }
      forecasts: { Row: Forecast }
      model_metrics: { Row: ModelMetrics }
      pipeline_runs: { Row: PipelineRun }
      app_config: { Row: AppConfig }
      scenarios: { Row: Scenario }
    }
  }
}

// ─── Client factories ─────────────────────────────────────────────────────────

/**
 * Browser client — uses the public anon key.
 * Safe to use in Client Components.
 * Returns null if environment variables are not set (e.g. during local dev
 * without a .env file), so the app degrades gracefully instead of crashing.
 */
export function createBrowserClient(): SupabaseClient<Database> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.warn(
      '[supabase] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. ' +
        'Supabase features will be unavailable.'
    )
    return null
  }

  return createClient<Database>(url, key)
}

/**
 * Server client — uses the service role key when available.
 * Only call this from Route Handlers or Server Actions, never in Client Components.
 * Returns null when neither key is available; callers must handle that.
 *
 * WARNING: if SUPABASE_SERVICE_ROLE_KEY is absent, falls back to the public anon key.
 * In that case, write operations (INSERT/UPDATE/DELETE) governed by RLS will fail.
 * This is NOT equivalent to the service role — it is a degraded read-only fallback.
 */
export function createServerClient(): SupabaseClient<Database> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url) {
    console.warn('[supabase] NEXT_PUBLIC_SUPABASE_URL non défini.')
    return null
  }
  if (!serviceKey && !anonKey) {
    console.warn('[supabase] Aucune clé Supabase définie.')
    return null
  }
  if (!serviceKey) {
    console.warn(
      '[supabase] SUPABASE_SERVICE_ROLE_KEY absent — utilisation de la clé publique. ' +
        'Les écritures échoueront.'
    )
  }

  return createClient<Database>(url, serviceKey ?? anonKey!, {
    auth: { persistSession: false },
  })
}

