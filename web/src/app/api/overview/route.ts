import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import type { RiskScore, TransferRecommendation } from '@/lib/supabase'

const META_BASE = {
  is_simulated: true as const,
}

export async function GET() {
  const supabase = createServerClient()

  if (!supabase) {
    // Return mock data labelled as simulated
    return NextResponse.json({
      data: {
        criticalFacilities: 0,
        predictedStockouts14d: 0,
        expiryValueAtRisk: null,
        pendingRecommendations: 0,
        unservedFacilities: 0,
      },
      meta: {
        ...META_BASE,
        run_id: null,
        model_version: null,
        data_cutoff_week: null,
        warning: 'Supabase non configuré — données non disponibles',
      },
    })
  }

  // Resolve current_run_id
  const { data: configData, error: configError } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', 'current_run_id')
    .single()

  const currentRunId: string | null = configData?.value ?? null

  if (!currentRunId) {
    return NextResponse.json(
      {
        data: null,
        meta: { ...META_BASE, run_id: null, model_version: null, data_cutoff_week: null },
        error: {
          code: 'not_found',
          message_fr: 'Aucun calcul disponible (current_run_id absent de app_config).',
        },
      },
      { status: 404 }
    )
  }

  const [scoresResult, recsResult, runResult, metricsResult, routesResult, facilitiesResult] =
    await Promise.all([
      supabase.from('risk_scores').select('priority_score, p_stockout_14d').eq('run_id', currentRunId),
      supabase
        .from('transfer_recommendations')
        .select('status')
        .eq('run_id', currentRunId)
        .eq('status', 'pending'),
      supabase
        .from('pipeline_runs')
        .select('model_version, cutoff_week, finished_at')
        .eq('run_id', currentRunId)
        .single(),
      supabase
        .from('model_metrics')
        .select('model_version')
        .order('generated_at', { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from('delivery_routes')
        .select('facility_id')
        .eq('run_id', currentRunId),
      supabase.from('facilities').select('id'),
    ])

  const scores: Pick<RiskScore, 'priority_score' | 'p_stockout_14d'>[] = scoresResult.data ?? []
  const recs: Pick<TransferRecommendation, 'status'>[] = recsResult.data ?? []
  const run = runResult.data
  const metrics = metricsResult.data
  const servedIds = new Set((routesResult.data ?? []).map((r: { facility_id: string }) => r.facility_id))
  const allFacilityIds = (facilitiesResult.data ?? []).map((f: { id: string }) => f.id)

  const criticalFacilities = scores.filter((s) => s.priority_score > 0.7).length
  const predictedStockouts14d = scores.filter((s) => s.p_stockout_14d > 0.5).length
  const unservedFacilities = allFacilityIds.filter((id: string) => !servedIds.has(id)).length

  return NextResponse.json({
    data: {
      criticalFacilities,
      predictedStockouts14d,
      expiryValueAtRisk: null, // computed by pipeline when available
      pendingRecommendations: recs.length,
      unservedFacilities,
    },
    meta: {
      ...META_BASE,
      run_id: currentRunId,
      model_version: metrics?.model_version ?? run?.model_version ?? null,
      data_cutoff_week: run?.cutoff_week ?? null,
    },
  })
}
