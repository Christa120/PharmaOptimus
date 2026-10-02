import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

const META_BASE = { is_simulated: true as const }

export async function GET() {
  const supabase = createServerClient()

  if (!supabase) {
    return NextResponse.json({
      data: { metrics: [], pipeline_runs: [] },
      meta: { ...META_BASE, run_id: null, model_version: null, data_cutoff_week: null },
      warning: 'Supabase non configuré — exécuter ml/train_and_export_model.py puis ml/run_pipeline.py',
    })
  }

  const [metricsResult, runsResult] = await Promise.all([
    supabase
      .from('model_metrics')
      .select('*')
      .order('generated_at', { ascending: false })
      .limit(10),
    supabase
      .from('pipeline_runs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(20),
  ])

  if (metricsResult.error) {
    return NextResponse.json(
      {
        data: null,
        error: { code: 'database_error', message_fr: metricsResult.error.message },
        meta: META_BASE,
      },
      { status: 500 }
    )
  }

  const latestMetrics = metricsResult.data?.[0] ?? null

  return NextResponse.json({
    data: {
      metrics: metricsResult.data ?? [],
      pipeline_runs: runsResult.data ?? [],
    },
    meta: {
      ...META_BASE,
      run_id: runsResult.data?.[0]?.id ?? null,
      model_version: latestMetrics?.model_version ?? null,
      data_cutoff_week: runsResult.data?.[0]?.cutoff_week ?? null,
    },
  })
}
