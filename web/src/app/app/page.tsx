import Link from 'next/link'
import { AlertTriangle, TrendingUp, ArrowLeftRight, Truck, Map } from 'lucide-react'
import { createServerClient } from '@/lib/supabase'
import { fr } from '@/lib/fr'
import type { RiskScore, Alert, TransferRecommendation, PipelineRun } from '@/lib/supabase'

// Mock data — clearly labelled
const MOCK = {
  criticalFacilities:    8,
  predictedStockouts14d: 14,
  expiryValueAtRisk:     'XOF 2 400 000',
  pendingRecommendations: 6,
  unservedFacilities:    3,
}

function countCritical(s: RiskScore[])               { return s.filter((x) => x.priority_score > 0.7).length }
function countStockouts(s: RiskScore[])               { return s.filter((x) => x.p_stockout_14d > 0.5).length }
function countPending(r: TransferRecommendation[])    { return r.filter((x) => x.status === 'pending').length }

export default async function DashboardPage() {
  const { dashboard, disclaimers } = fr
  const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === 'true'

  let overview = MOCK
  let modelVersion: string | undefined
  let lastRunDate: string | undefined
  let recentAlerts: Alert[] = []
  let recentRecs: TransferRecommendation[] = []
  let supabaseAvailable = false

  const supabase = createServerClient()
  if (supabase && !useMocks) {
    const { data: cfg } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', 'current_run_id')
      .single()
    const runId = cfg?.value
    if (runId) {
      const [scores, recs, alerts, metrics, run] = await Promise.all([
        supabase.from('risk_scores').select('priority_score,p_stockout_14d').eq('run_id', runId),
        supabase.from('transfer_recommendations').select('*').eq('run_id', runId),
        supabase
          .from('alerts')
          .select('*')
          .eq('run_id', runId)
          .eq('acknowledged', false)
          .order('severity')
          .limit(3),
        supabase
          .from('model_metrics')
          .select('model_version')
          .order('generated_at', { ascending: false })
          .limit(1)
          .single(),
        supabase.from('pipeline_runs').select('*').eq('run_id', runId).single(),
      ])
      const s = scores.data ?? []
      const r = recs.data ?? []
      overview = {
        criticalFacilities:    countCritical(s as RiskScore[]),
        predictedStockouts14d: countStockouts(s as RiskScore[]),
        expiryValueAtRisk:     '—',
        pendingRecommendations: countPending(r as TransferRecommendation[]),
        unservedFacilities:    0,
      }
      recentAlerts = (alerts.data ?? []) as Alert[]
      recentRecs   = (r as TransferRecommendation[]).filter((x) => x.status === 'pending').slice(0, 3)
      modelVersion = metrics.data?.model_version
      const runData = run.data as PipelineRun | null
      if (runData?.finished_at) {
        lastRunDate = new Date(runData.finished_at).toLocaleString('fr-FR')
      }
      supabaseAvailable = true
    }
  } else {
    modelVersion = 'v1-simulé'
    lastRunDate  = 'Données de démonstration'
  }

  const KPIs = [
    { label: dashboard.criticalFacilities,     value: overview.criticalFacilities,     icon: AlertTriangle, critical: overview.criticalFacilities > 0,     href: '/app/alertes'          },
    { label: dashboard.predictedStockouts14d,  value: overview.predictedStockouts14d,  icon: TrendingUp,    critical: overview.predictedStockouts14d > 0,  href: '/app/alertes'          },
    { label: dashboard.expiryValueAtRisk,      value: overview.expiryValueAtRisk,      icon: AlertTriangle, critical: false,                                href: null                    },
    { label: dashboard.pendingRecommendations, value: overview.pendingRecommendations, icon: ArrowLeftRight, critical: false,                               href: '/app/recommandations'  },
    { label: dashboard.unservedFacilities,     value: overview.unservedFacilities,     icon: Truck,         critical: overview.unservedFacilities > 0,    href: '/app/tournees'         },
  ]

  const QUICK_LINKS = [
    { title: 'Alertes actives',       desc: 'Ruptures imminentes et péremptions à traiter', href: '/app/alertes',         icon: AlertTriangle,  accent: 'border-signal/30 bg-signal/3 hover:border-signal/50'  },
    { title: 'Recommandations',       desc: 'Transferts inter-établissements à valider',    href: '/app/recommandations', icon: ArrowLeftRight, accent: 'border-soleil/30 bg-soleil/3 hover:border-soleil/50'  },
    { title: 'Tournées de livraison', desc: 'Itinéraires planifiés depuis le dépôt',        href: '/app/tournees',        icon: Truck,          accent: 'border-palme/30 bg-palme/3 hover:border-palme/50'    },
    { title: 'Carte du réseau',       desc: 'Vue géographique des 54 établissements',       href: '/app/carte',           icon: Map,            accent: 'border-lagune/20 bg-lagune/3 hover:border-lagune/40'  },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-kaolin" id="main-content">

      {/* Top bar — fixed height, not sticky (per spec: pas de sticky sur /app/*) */}
      <div className="bg-lagune text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link
              href="/"
              className="font-display font-bold text-white hover:text-brume transition-colors text-sm shrink-0"
            >
              PharmaOptimus
            </Link>
            <span className="text-white/20 hidden sm:block" aria-hidden="true">|</span>
            <h1 className="hidden sm:block font-semibold text-white/70 text-sm">
              Tableau de bord
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-white/35 text-xs hidden md:block truncate">
              {modelVersion ?? '—'} · {lastRunDate ?? '—'}
            </span>
            {(useMocks || !supabaseAvailable) && (
              <span className="bg-soleil/20 text-soleil text-xs font-bold px-2 py-0.5 rounded-full border border-soleil/30">
                MAQUETTE
              </span>
            )}
            <nav className="flex gap-1" aria-label="Navigation tableau de bord">
              {[
                { label: 'Alertes',    href: '/app/alertes'         },
                { label: 'Transferts', href: '/app/recommandations' },
                { label: 'Tournées',   href: '/app/tournees'        },
                { label: 'Carte',      href: '/app/carte'           },
              ].map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="hidden md:block text-brume hover:text-white text-xs px-3 py-1 rounded-lg hover:bg-white/8 transition-all"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 w-full">

        {/* Mock banner */}
        {(useMocks || !supabaseAvailable) && (
          <div
            className="flex items-center gap-3 bg-soleil/8 border border-soleil/30 rounded-xl px-4 py-3 text-sm text-lagune"
            role="status"
          >
            <AlertTriangle className="w-4 h-4 text-soleil shrink-0" aria-hidden="true" />
            <span>
              <strong>MAQUETTE</strong> —{' '}
              {disclaimers.simulatedData}. Configurez Supabase pour voir les données réelles.
            </span>
          </div>
        )}

        {/* KPI grid */}
        <section aria-labelledby="kpi-heading">
          <h2 id="kpi-heading" className="sr-only">Indicateurs clés</h2>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {KPIs.map((kpi) => {
              const Icon = kpi.icon
              const cardClass = kpi.critical
                ? 'bg-white border border-signal/25 shadow-sm shadow-signal/5'
                : 'bg-white border border-brume/60 shadow-sm'
              const card = (
                <div
                  className={`${cardClass} rounded-2xl p-4 flex flex-col gap-2 transition-all hover:shadow-md`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-xs text-lagune/50 leading-snug">{kpi.label}</span>
                    <Icon
                      className={`w-4 h-4 shrink-0 ${kpi.critical ? 'text-signal' : 'text-lagune/30'}`}
                      aria-hidden="true"
                    />
                  </div>
                  <span
                    className={`font-display text-3xl font-bold leading-none ${
                      kpi.critical ? 'text-signal' : 'text-lagune'
                    }`}
                  >
                    {kpi.value}
                  </span>
                </div>
              )
              return kpi.href ? (
                <Link key={kpi.label} href={kpi.href} className="group">
                  {card}
                </Link>
              ) : (
                <div key={kpi.label}>{card}</div>
              )
            })}
          </div>
        </section>

        {/* Recent alerts + pending recs */}
        {(recentAlerts.length > 0 || recentRecs.length > 0) && (
          <div className="grid md:grid-cols-2 gap-6">
            {recentAlerts.length > 0 && (
              <section
                aria-labelledby="recent-alerts-h"
                className="bg-white rounded-2xl border border-brume/60 overflow-hidden"
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-brume/40">
                  <h2 id="recent-alerts-h" className="font-display font-semibold text-lagune text-sm">
                    Alertes récentes
                  </h2>
                  <Link href="/app/alertes" className="text-xs text-palme hover:underline">
                    Voir toutes →
                  </Link>
                </div>
                <ul className="divide-y divide-brume/30">
                  {recentAlerts.map((a) => (
                    <li key={a.id} className="px-5 py-3 flex items-center gap-3">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          a.severity === 'critical'
                            ? 'bg-signal'
                            : a.severity === 'high'
                            ? 'bg-alerte'
                            : 'bg-soleil'
                        }`}
                        aria-label={`Gravité : ${a.severity}`}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-lagune truncate">{a.facility_id}</p>
                        <p className="text-xs text-lagune/50 truncate">
                          {a.alert_type.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {recentRecs.length > 0 && (
              <section
                aria-labelledby="recent-recs-h"
                className="bg-white rounded-2xl border border-brume/60 overflow-hidden"
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-brume/40">
                  <h2 id="recent-recs-h" className="font-display font-semibold text-lagune text-sm">
                    Transferts en attente
                  </h2>
                  <Link href="/app/recommandations" className="text-xs text-palme hover:underline">
                    Voir tous →
                  </Link>
                </div>
                <ul className="divide-y divide-brume/30">
                  {recentRecs.map((r) => (
                    <li key={r.id} className="px-5 py-3 flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-palme/60 shrink-0" aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-lagune truncate">
                          {r.from_facility_id} → {r.to_facility_id}
                        </p>
                        <p className="text-xs text-lagune/50">
                          {r.product_id} · {r.qty_recommended} unités
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        {/* Quick links */}
        <section aria-labelledby="modules-h">
          <h2 id="modules-h" className="font-display font-semibold text-lagune text-sm mb-4">
            Modules
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {QUICK_LINKS.map((ql) => {
              const Icon = ql.icon
              return (
                <Link
                  key={ql.href}
                  href={ql.href}
                  className={`group flex flex-col gap-3 bg-white rounded-2xl border-2 p-5
                             transition-all hover:-translate-y-0.5 hover:shadow-md ${ql.accent}`}
                >
                  <Icon
                    className="w-6 h-6 text-lagune/50 group-hover:text-lagune transition-colors"
                    aria-hidden="true"
                  />
                  <div>
                    <h3 className="font-display font-semibold text-lagune text-sm mb-1">
                      {ql.title}
                    </h3>
                    <p className="text-xs text-lagune/55 leading-snug">{ql.desc}</p>
                  </div>
                  <span className="text-xs font-semibold text-palme flex items-center gap-1 mt-auto">
                    Accéder{' '}
                    <svg
                      className="w-3 h-3 group-hover:translate-x-0.5 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </Link>
              )
            })}
          </div>
        </section>

      </main>

      {/* Dashboard footer — single info line */}
      <footer className="bg-lagune text-white/25 text-xs text-center py-3 px-4">
        PharmaOptimus · {modelVersion ?? '—'} · {lastRunDate ?? '—'} · Données simulées
      </footer>

    </div>
  )
}
