import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import type { DeliveryRoute } from '@/lib/supabase'

const META_BASE = { is_simulated: true as const }

export async function GET() {
  const supabase = createServerClient()

  if (!supabase) {
    return NextResponse.json({
      data: [],
      meta: { ...META_BASE, run_id: null, model_version: null, data_cutoff_week: null },
      warning: 'Supabase non configuré',
    })
  }

  const { data: configData } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', 'current_run_id')
    .single()

  const currentRunId: string | null = configData?.value ?? null

  if (!currentRunId) {
    return NextResponse.json({
      data: [],
      meta: { ...META_BASE, run_id: null, model_version: null, data_cutoff_week: null },
    })
  }

  const [routesResult, facilitiesResult, metricsResult, runResult] = await Promise.all([
    supabase
      .from('delivery_routes')
      .select('*')
      .eq('run_id', currentRunId)
      .order('vehicle_id')
      .order('stop_order'),
    supabase.from('facilities').select('id, name'),
    supabase
      .from('model_metrics')
      .select('model_version')
      .order('generated_at', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('pipeline_runs')
      .select('cutoff_week')
      .eq('run_id', currentRunId)
      .single(),
  ])

  if (routesResult.error) {
    return NextResponse.json(
      {
        data: null,
        error: { code: 'database_error', message_fr: routesResult.error.message },
        meta: META_BASE,
      },
      { status: 500 }
    )
  }

  const facilityMap = new Map<string, string>(
    (facilitiesResult.data ?? []).map((f: { id: string; name: string }) => [f.id, f.name])
  )

  const routes: (DeliveryRoute & { facility_name: string | null })[] = (
    routesResult.data ?? []
  ).map((r: DeliveryRoute) => ({
    ...r,
    facility_name: facilityMap.get(r.facility_id) ?? null,
  }))

  return NextResponse.json({
    data: routes,
    meta: {
      ...META_BASE,
      run_id: currentRunId,
      model_version: metricsResult.data?.model_version ?? null,
      data_cutoff_week: runResult.data?.cutoff_week ?? null,
    },
  })
}
