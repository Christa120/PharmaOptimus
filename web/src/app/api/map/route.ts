import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { readFile } from 'fs/promises'
import { join } from 'path'
import type { Facility, RiskScore } from '@/lib/supabase'

export async function GET() {
  // Load GeoJSON from filesystem — path relative to project root (not web/)
  let geojson: unknown = null
  try {
    const geojsonPath = join(process.cwd(), '..', 'data', 'raw', 'geoboundaries_benin_adm1.geojson')
    const raw = await readFile(geojsonPath, 'utf-8')
    geojson = JSON.parse(raw)
  } catch {
    // Non-fatal — map will render without department polygons
    console.warn('[api/map] Could not load geoboundaries GeoJSON:')
  }

  const supabase = createServerClient()

  if (!supabase) {
    return NextResponse.json({
      data: { geojson, facilities: [], scores: [] },
      meta: {
        is_simulated: true,
        run_id: null,
        model_version: null,
        data_cutoff_week: null,
        warning: 'Supabase non configuré',
      },
    })
  }

  // Resolve current run
  const { data: configData } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', 'current_run_id')
    .single()

  const currentRunId: string | null = configData?.value ?? null

  const [facilitiesResult, scoresResult, metricsResult, runResult] = await Promise.all([
    supabase.from('facilities').select('*'),
    currentRunId
      ? supabase
          .from('risk_scores')
          .select('facility_id, priority_score, p_stockout_14d, p_stockout_7d')
          .eq('run_id', currentRunId)
      : Promise.resolve({ data: [] as Partial<RiskScore>[], error: null }),
    supabase
      .from('model_metrics')
      .select('model_version')
      .order('generated_at', { ascending: false })
      .limit(1)
      .single(),
    currentRunId
      ? supabase
          .from('pipeline_runs')
          .select('cutoff_week')
          .eq('run_id', currentRunId)
          .single()
      : Promise.resolve({ data: null, error: null }),
  ])

  const facilities: Facility[] = facilitiesResult.data ?? []
  const scores: Partial<RiskScore>[] = scoresResult.data ?? []

  // Merge priority score into facility objects
  const scoreMap = new Map(scores.map((s) => [s.facility_id, s]))
  const facilitiesWithScores = facilities.map((f) => {
    const score = scoreMap.get(f.id)
    return {
      ...f,
      priority_score: score?.priority_score ?? null,
      p_stockout_14d: score?.p_stockout_14d ?? null,
    }
  })

  return NextResponse.json({
    data: { geojson, facilities: facilitiesWithScores },
    meta: {
      is_simulated: true,
      run_id: currentRunId,
      model_version: metricsResult.data?.model_version ?? null,
      data_cutoff_week: runResult.data?.cutoff_week ?? null,
    },
  })
}
