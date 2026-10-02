import { createServerClient } from '@/lib/supabase'
import { fr } from '@/lib/fr'
import type { DeliveryRoute, Facility } from '@/lib/supabase'
import { Truck } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'

interface RouteStop extends DeliveryRoute {
  facility_name?: string
}

interface VehicleGroup {
  vehicle_id: string
  stops: RouteStop[]
  total_distance: number
}

export default async function TourneesPage() {
  const { routes } = fr

  let vehicles: VehicleGroup[] = []
  let unservedFacilities: string[] = []
  let runId: string | undefined

  const supabase = createServerClient()
  if (supabase) {
    const { data: configData } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', 'current_run_id')
      .single()

    runId = configData?.value

    if (runId) {
      const { data: routeData } = await supabase
        .from('delivery_routes')
        .select('*')
        .eq('run_id', runId)
        .order('vehicle_id')
        .order('stop_order')

      const { data: facilitiesData } = await supabase
        .from('facilities')
        .select('id, name')

      const facilityMap = new Map<string, string>(
        (facilitiesData ?? []).map((f: { id: string; name: string }) => [f.id, f.name])
      )

      const stops: RouteStop[] = (routeData ?? []).map((r: DeliveryRoute) => ({
        ...r,
        facility_name: facilityMap.get(r.facility_id),
      }))

      // Group by vehicle
      const vehicleMap = new Map<string, RouteStop[]>()
      stops.forEach((stop) => {
        if (!vehicleMap.has(stop.vehicle_id)) vehicleMap.set(stop.vehicle_id, [])
        vehicleMap.get(stop.vehicle_id)!.push(stop)
      })

      vehicles = Array.from(vehicleMap.entries()).map(([vehicle_id, vehicleStops]) => ({
        vehicle_id,
        stops: vehicleStops,
        total_distance: vehicleStops.reduce((sum, s) => sum + (s.distance_km ?? 0), 0),
      }))

      // Unserved = all facilities not in any stop
      const servedIds = new Set(stops.map((s) => s.facility_id))
      unservedFacilities = (facilitiesData ?? [])
        .filter((f: { id: string; name: string }) => !servedIds.has(f.id))
        .map((f: { id: string; name: string }) => f.name)
    }
  }

  return (
    <main className="flex flex-col min-h-screen bg-kaolin">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-display text-3xl font-bold text-lagune mb-6">
          {routes.title}
        </h1>

        {vehicles.length === 0 ? (
          <EmptyState
            message={fr.empty.noRoutes}
            icon={<Truck className="w-10 h-10 text-brume" aria-hidden="true" />}
          />
        ) : (
          <div className="space-y-8">
            {vehicles.map((v) => (
              <section
                key={v.vehicle_id}
                aria-labelledby={`vehicle-${v.vehicle_id}`}
                className="bg-white rounded-2xl border border-brume overflow-hidden"
              >
                {/* Vehicle header */}
                <div className="flex flex-wrap items-center gap-4 px-6 py-4 bg-lagune/5 border-b border-brume">
                  <div className="flex items-center gap-3">
                    <Truck className="w-5 h-5 text-lagune" aria-hidden="true" />
                    <h2 id={`vehicle-${v.vehicle_id}`} className="font-display font-semibold text-lagune">
                      {routes.vehicle} {v.vehicle_id}
                    </h2>
                  </div>
                  <dl className="flex gap-6 text-sm ml-auto">
                    <div>
                      <dt className="text-lagune/50 inline">{routes.stops} : </dt>
                      <dd className="font-semibold text-lagune inline">{v.stops.length}</dd>
                    </div>
                    <div>
                      <dt className="text-lagune/50 inline">{routes.distance} : </dt>
                      <dd className="font-semibold text-lagune inline">{v.total_distance.toFixed(1)} km</dd>
                    </div>
                  </dl>
                </div>

                {/* Stops table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-lagune/3">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left font-semibold text-lagune w-12">
                          {routes.stopOrder}
                        </th>
                        <th scope="col" className="px-4 py-3 text-left font-semibold text-lagune">
                          Établissement
                        </th>
                        <th scope="col" className="px-4 py-3 text-left font-semibold text-lagune">
                          {routes.arrivalTime}
                        </th>
                        <th scope="col" className="px-4 py-3 text-left font-semibold text-lagune">
                          {routes.distance}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brume">
                      {v.stops.map((stop) => (
                        <tr key={stop.id} className="hover:bg-kaolin/40 transition-colors">
                          <td className="px-4 py-3 font-mono text-lagune/60 text-center">
                            {stop.stop_order}
                          </td>
                          <td className="px-4 py-3 font-medium text-lagune">
                            {stop.facility_name ?? stop.facility_id}
                          </td>
                          <td className="px-4 py-3 text-lagune/70">
                            {stop.arrival_time
                              ? new Date(stop.arrival_time).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '—'}
                          </td>
                          <td className="px-4 py-3 text-lagune/70">
                            {stop.distance_km != null ? `${stop.distance_km.toFixed(1)} km` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}

            {/* Unserved facilities */}
            {unservedFacilities.length > 0 && (
              <section aria-labelledby="unserved-heading" className="bg-soleil/5 border border-soleil/30 rounded-2xl p-6">
                <h2 id="unserved-heading" className="font-display font-semibold text-lagune mb-3">
                  {routes.unserved} ({unservedFacilities.length})
                </h2>
                <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-lagune/80" role="list">
                  {unservedFacilities.map((name) => (
                    <li key={name} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-soleil shrink-0" aria-hidden="true" />
                      {name}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

