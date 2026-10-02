'use client'

import { useEffect, useRef, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import type { Facility, RiskScore } from '@/lib/supabase'
import { fr } from '@/lib/fr'

interface FacilityRow extends Facility {
  priority_score?: number
}

export default function CartePage() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [facilities, setFacilities] = useState<FacilityRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [sortField, setSortField] = useState<'name' | 'department' | 'priority_score'>('priority_score')
  const [sortAsc, setSortAsc] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/map')
        if (!res.ok) throw new Error(`API /api/map: ${res.status}`)
        const json = await res.json()

        const facilitiesWithScores: FacilityRow[] = (json.data?.facilities ?? []).map(
          (f: FacilityRow) => f
        )
        setFacilities(facilitiesWithScores)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Dynamically import MapLibre to avoid SSR issues
  useEffect(() => {
    if (!mapContainerRef.current || loading) return

    let map: import('maplibre-gl').Map | null = null

    async function initMap() {
      const maplibre = await import('maplibre-gl')
      await import('maplibre-gl/dist/maplibre-gl.css' as string)

      if (!mapContainerRef.current) return

      map = new maplibre.Map({
        container: mapContainerRef.current,
        style: {
          version: 8,
          sources: {
            osm: {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors (ODbL)',
            },
          },
          layers: [{ id: 'osm-tiles', type: 'raster', source: 'osm' }],
        },
        center: [2.3158, 9.3077], // Bénin centre
        zoom: 6,
      })

      map.on('load', async () => {
        // Load GeoJSON departments
        try {
          const res = await fetch('/api/map')
          const json = await res.json()
          const geojson = json.data?.geojson

          if (geojson && map) {
            map.addSource('departments', { type: 'geojson', data: geojson })
            map.addLayer({
              id: 'departments-fill',
              type: 'fill',
              source: 'departments',
              paint: {
                'fill-color': '#1F7A4D',
                'fill-opacity': 0.15,
              },
            })
            map.addLayer({
              id: 'departments-outline',
              type: 'line',
              source: 'departments',
              paint: {
                'line-color': '#0B2E33',
                'line-width': 1.5,
              },
            })
          }
        } catch {
          // GeoJSON load failure is non-fatal; map still shows OSM tiles
        }

        // Add facility markers
        facilities.forEach((facility) => {
          if (!map) return
          const score = facility.priority_score ?? 0
          const color = score > 0.7 ? '#C8372D' : score > 0.4 ? '#E3A92B' : '#1F7A4D'

          const el = document.createElement('div')
          el.style.cssText = `
            width: 14px; height: 14px; border-radius: 50%;
            background-color: ${color}; border: 2px solid white;
            cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,0.3);
          `
          el.setAttribute('role', 'button')
          el.setAttribute('aria-label', `${facility.name} — ${facility.department}`)
          el.setAttribute('tabindex', '0')

          new maplibre.Marker({ element: el })
            .setLngLat([facility.lon, facility.lat])
            .setPopup(
              new maplibre.Popup({ offset: 12 }).setHTML(
                `<strong>${facility.name}</strong><br/>
                 <span>${facility.department} — ${facility.commune}</span><br/>
                 ${score > 0 ? `<span>Score priorité : ${score.toFixed(2)}</span>` : ''}`
              )
            )
            .addTo(map)
        })

        setMapReady(true)
      })
    }

    initMap().catch(console.error)

    return () => {
      map?.remove()
    }
  }, [loading, facilities])

  function sortedFacilities() {
    return [...facilities].sort((a, b) => {
      let aVal: string | number = sortField === 'priority_score' ? (a.priority_score ?? 0) : a[sortField]
      let bVal: string | number = sortField === 'priority_score' ? (b.priority_score ?? 0) : b[sortField]
      if (typeof aVal === 'string') aVal = aVal.toLowerCase()
      if (typeof bVal === 'string') bVal = bVal.toLowerCase()
      if (aVal < bVal) return sortAsc ? -1 : 1
      if (aVal > bVal) return sortAsc ? 1 : -1
      return 0
    })
  }

  function handleSort(field: typeof sortField) {
    if (sortField === field) setSortAsc(!sortAsc)
    else { setSortField(field); setSortAsc(true) }
  }

  return (
    <main className="flex flex-col min-h-screen bg-kaolin">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-display text-3xl font-bold text-lagune mb-6">Carte du réseau</h1>

        {/* Map container */}
        <div className="mb-8">
          {loading ? (
            <div className="h-96 rounded-xl border border-brume bg-white flex items-center justify-center">
              <p className="text-lagune/50 text-sm" role="status" aria-live="polite">
                Chargement de la carte…
              </p>
            </div>
          ) : error ? (
            <div className="h-96 rounded-xl border border-signal/30 bg-signal/5 flex items-center justify-center px-6 text-center">
              <div>
                <p className="text-signal font-semibold mb-2">Impossible de charger la carte</p>
                <p className="text-lagune/60 text-sm">{error}</p>
              </div>
            </div>
          ) : (
            <div
              ref={mapContainerRef}
              className="h-96 rounded-xl overflow-hidden border border-brume"
              role="application"
              aria-label="Carte interactive des établissements de santé du Bénin"
            />
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-6 mb-6 text-xs text-lagune/70">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-signal border-2 border-white shadow inline-block" aria-hidden="true" />
            Score &gt; 0.7 — critique
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-soleil border-2 border-white shadow inline-block" aria-hidden="true" />
            Score 0.4–0.7 — modéré
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-palme border-2 border-white shadow inline-block" aria-hidden="true" />
            Score &lt; 0.4 — normal
          </span>
        </div>

        {/* Accessible fallback table */}
        <section aria-label="Table des établissements (alternative textuelle à la carte)">
          <h2 className="font-display text-xl font-bold text-lagune mb-4">
            Établissements ({facilities.length})
          </h2>

          {loading ? (
            <p className="text-lagune/50 text-sm" role="status">Chargement…</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-brume bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-lagune/5">
                  <tr>
                    <SortHeader field="name" label="Nom" sortField={sortField} sortAsc={sortAsc} onSort={handleSort} />
                    <SortHeader field="department" label="Département" sortField={sortField} sortAsc={sortAsc} onSort={handleSort} />
                    <th scope="col" className="px-4 py-3 text-left font-semibold text-lagune">Type</th>
                    <SortHeader field="priority_score" label="Score priorité" sortField={sortField} sortAsc={sortAsc} onSort={handleSort} />
                  </tr>
                </thead>
                <tbody className="divide-y divide-brume">
                  {sortedFacilities().map((f) => (
                    <tr key={f.id} className="hover:bg-kaolin/40 transition-colors">
                      <td className="px-4 py-3 font-medium text-lagune">{f.name}</td>
                      <td className="px-4 py-3 text-lagune/70">{f.department}</td>
                      <td className="px-4 py-3 text-lagune/70">{f.type}</td>
                      <td className="px-4 py-3">
                        {f.priority_score != null ? (
                          <span
                            className={`font-mono text-xs font-semibold ${
                              f.priority_score > 0.7
                                ? 'text-signal'
                                : f.priority_score > 0.4
                                ? 'text-alerte'
                                : 'text-palme'
                            }`}
                          >
                            {f.priority_score.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-lagune/30">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

function SortHeader({
  field,
  label,
  sortField,
  sortAsc,
  onSort,
}: {
  field: 'name' | 'department' | 'priority_score'
  label: string
  sortField: string
  sortAsc: boolean
  onSort: (f: 'name' | 'department' | 'priority_score') => void
}) {
  const active = sortField === field
  return (
    <th scope="col" className="px-4 py-3 text-left font-semibold text-lagune">
      <button
        onClick={() => onSort(field)}
        className="inline-flex items-center gap-1 hover:text-palme transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-palme rounded"
        aria-sort={active ? (sortAsc ? 'ascending' : 'descending') : 'none'}
      >
        {label}
        <span aria-hidden="true" className="text-lagune/40">
          {active ? (sortAsc ? '↑' : '↓') : '↕'}
        </span>
      </button>
    </th>
  )
}

