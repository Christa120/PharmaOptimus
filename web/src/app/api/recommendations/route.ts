import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { z } from 'zod'

const META_BASE = { is_simulated: true as const }

const patchSchema = z
  .object({
    id: z.string().uuid('id must be a UUID'),
    status: z.enum(['accepted', 'rejected']),
    rejection_reason: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === 'rejected' && !data.rejection_reason?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'rejection_reason est obligatoire lorsque status est "rejected"',
        path: ['rejection_reason'],
      })
    }
  })

export async function GET(_request: NextRequest) {
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

  const [recsResult, metricsResult, runResult] = await Promise.all([
    supabase
      .from('transfer_recommendations')
      .select('*')
      .eq('run_id', currentRunId)
      .order('created_at', { ascending: false }),
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

  if (recsResult.error) {
    return NextResponse.json(
      {
        data: null,
        error: { code: 'database_error', message_fr: recsResult.error.message },
        meta: META_BASE,
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    data: recsResult.data ?? [],
    meta: {
      ...META_BASE,
      run_id: currentRunId,
      model_version: metricsResult.data?.model_version ?? null,
      data_cutoff_week: runResult.data?.cutoff_week ?? null,
    },
  })
}

export async function PATCH(request: NextRequest) {
  const supabase = createServerClient()

  if (!supabase) {
    return NextResponse.json(
      { error: { code: 'service_unavailable', message_fr: 'Supabase non configuré.' } },
      { status: 503 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: { code: 'invalid_request', message_fr: 'Corps de requête JSON invalide.' } },
      { status: 400 }
    )
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: { code: 'validation_error', message_fr: 'Validation échouée.' },
        details: parsed.error.flatten(),
      },
      { status: 400 }
    )
  }

  const { id, status, rejection_reason } = parsed.data

  const updatePayload: Record<string, unknown> = { status }
  if (status === 'rejected') {
    updatePayload.rejection_reason = rejection_reason!.trim()
  }

  const { data, error } = await supabase
    .from('transfer_recommendations')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { error: { code: 'database_error', message_fr: error.message } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data, meta: META_BASE })
}
