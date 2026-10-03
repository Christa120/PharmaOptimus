/**
 * src/services/supabaseDataService.ts
 * Service qui charge les donnees reelles depuis Supabase.
 * Utilisé quand l'utilisateur active le "Mode Live" via le bouton toggle.
 */

import { Facility, TransferRecommendation, DeliveryRoute } from '../types/pharma';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const isSupabaseConfigured = !!SUPABASE_URL && !!SUPABASE_ANON_KEY;

async function supabaseFetch(path: string): Promise<unknown[]> {
  if (!isSupabaseConfigured) return [];
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) return [];
  return res.json();
}

// Charge le current_run_id depuis app_config
export async function fetchCurrentRunId(): Promise<string | null> {
  const rows = await supabaseFetch('app_config?select=value&key=eq.current_run_id') as { value: string }[];
  if (!rows.length) return null;
  const raw = rows[0].value;
  // La valeur est stockee comme JSON string : "\"uuid\""
  try { return JSON.parse(raw); } catch { return raw; }
}

// ── Statistiques tableau de bord ──────────────────────────────────────────────

export interface LiveStats {
  criticalCount: number;
  stockoutRisk14d: number;
  alertCount: number;
  transferCount: number;
  routeCount: number;
  runId: string | null;
}

export async function fetchLiveStats(): Promise<LiveStats> {
  const runId = await fetchCurrentRunId();
  if (!runId) return { criticalCount: 0, stockoutRisk14d: 0, alertCount: 0, transferCount: 0, routeCount: 0, runId: null };

  const [scores, alerts, transfers, routes] = await Promise.all([
    supabaseFetch(`risk_scores?select=priority_score&run_id=eq.${runId}`) as Promise<{ priority_score: number }[]>,
    supabaseFetch(`alerts?select=id&run_id=eq.${runId}&acknowledged=eq.false`) as Promise<{ id: string }[]>,
    supabaseFetch(`transfer_recommendations?select=id&run_id=eq.${runId}&status=eq.pending`) as Promise<{ id: string }[]>,
    supabaseFetch(`delivery_routes?select=id&run_id=eq.${runId}`) as Promise<{ id: string }[]>,
  ]);

  const criticalCount = (scores as { priority_score: number }[]).filter(s => s.priority_score > 0.6).length;
  const stockoutRisk14d = Math.round(criticalCount * 0.3);

  return {
    criticalCount,
    stockoutRisk14d,
    alertCount: (alerts as { id: string }[]).length,
    transferCount: (transfers as { id: string }[]).length,
    routeCount: (routes as { id: string }[]).length,
    runId,
  };
}

// ── Etablissements avec scores ────────────────────────────────────────────────

export async function fetchFacilitiesWithScores(): Promise<{
  id: string; name: string; department: string; type: string;
  lat: number; lon: number; priorityScore: number; daysOfCover: number;
}[]> {
  const runId = await fetchCurrentRunId();
  const [facilities, scores] = await Promise.all([
    supabaseFetch('facilities?select=id,name,department,type,lat,lon') as Promise<{
      id: string; name: string; department: string; type: string; lat: number; lon: number;
    }[]>,
    runId
      ? supabaseFetch(`risk_scores?select=facility_id,priority_score,days_coverage&run_id=eq.${runId}`) as Promise<{
          facility_id: string; priority_score: number; days_coverage: number;
        }[]>
      : Promise.resolve([]),
  ]);

  const scoreMap = new Map<string, { priority_score: number; days_coverage: number }>();
  (scores as { facility_id: string; priority_score: number; days_coverage: number }[])
    .forEach(s => scoreMap.set(s.facility_id, s));

  return (facilities as { id: string; name: string; department: string; type: string; lat: number; lon: number }[])
    .map(f => {
      const s = scoreMap.get(f.id);
      return {
        ...f,
        priorityScore: s?.priority_score ?? 0,
        daysOfCover: s?.days_coverage ?? 0,
      };
    });
}

// ── Transferts en attente ────────────────────────────────────────────────────

export async function fetchPendingTransfers(): Promise<{
  id: string; fromFacilityId: string; toFacilityId: string;
  quantity: number; status: string; reason: string;
}[]> {
  const runId = await fetchCurrentRunId();
  if (!runId) return [];
  const rows = await supabaseFetch(
    `transfer_recommendations?select=id,from_facility_id,to_facility_id,quantity,status,reason&run_id=eq.${runId}&status=eq.pending`
  ) as { id: string; from_facility_id: string; to_facility_id: string; quantity: number; status: string; reason: string }[];

  return rows.map(r => ({
    id: r.id,
    fromFacilityId: r.from_facility_id,
    toFacilityId: r.to_facility_id,
    quantity: r.quantity,
    status: r.status,
    reason: r.reason,
  }));
}

// ── Alertes actives ───────────────────────────────────────────────────────────

export async function fetchActiveAlerts(): Promise<{
  id: string; facilityId: string; productId: string;
  alertType: string; severity: string; messageFr: string;
}[]> {
  const runId = await fetchCurrentRunId();
  if (!runId) return [];
  const rows = await supabaseFetch(
    `alerts?select=id,facility_id,product_id,alert_type,severity,message_fr&run_id=eq.${runId}&acknowledged=eq.false&order=severity`
  ) as { id: string; facility_id: string; product_id: string; alert_type: string; severity: string; message_fr: string }[];

  return rows.map(r => ({
    id: r.id,
    facilityId: r.facility_id,
    productId: r.product_id,
    alertType: r.alert_type,
    severity: r.severity,
    messageFr: r.message_fr,
  }));
}
