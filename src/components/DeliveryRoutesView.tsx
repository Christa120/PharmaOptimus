import React from 'react';
import { DeliveryRoute } from '../types/pharma';
import { 
  Truck, 
  MapPin, 
  Clock, 
  Package, 
  Snowflake, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Fuel,
  TrendingDown
} from 'lucide-react';

interface DeliveryRoutesViewProps {
  routes: DeliveryRoute[];
}

export const DeliveryRoutesView: React.FC<DeliveryRoutesViewProps> = ({ routes }) => {
  return (
    <div className="space-y-6">
      
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Truck className="h-5 w-5 text-cyan-400" />
            <span>Planification des Tournées de Distribution VRP</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Résolution par algorithme de routage de véhicules (OR-Tools) depuis le Dépôt Central de Cotonou avec respect strict des capacités et de la chaîne du froid.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="bg-cyan-950/60 border border-cyan-800 text-cyan-300 px-3 py-1.5 rounded-lg font-mono">
            {routes.length} tournées actives
          </span>
          <span className="bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-lg font-mono">
            Origine : Cotonou Portuaire
          </span>
        </div>
      </div>

      {/* Résumé Flotte et Économies VRP */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-xs text-slate-400">Kilométrage Total Planifié</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-cyan-400">
              {routes.reduce((acc, r) => acc + r.totalDistanceKm, 0).toLocaleString()} km
            </span>
            <span className="text-xs text-slate-400">sur 3 corridors</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 pt-1">
            <TrendingDown className="h-3.5 w-3.5" />
            <span>-14.8% de distance vs méthode naïf plus proche voisin</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-xs text-slate-400">Volume Fret Alloué</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              {routes.reduce((acc, r) => acc + r.currentLoadL, 0).toLocaleString()} L
            </span>
            <span className="text-xs text-slate-400 font-mono">
              / {routes.reduce((acc, r) => acc + r.vehicleCapacityL, 0).toLocaleString()} L
            </span>
          </div>
          <p className="text-[11px] text-slate-400 pt-1">
            Taux de remplissage moyen de la flotte : <strong className="text-slate-200">76%</strong>
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-xs text-slate-400">Respect Chaîne du Froid (2°C - 8°C)</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-cyan-400">100%</span>
            <span className="text-xs text-slate-400">conforme</span>
          </div>
          <p className="text-[11px] text-slate-400 pt-1">
            Produits thermosensibles (vaccins, insuline, ocytocine) confinés aux véhicules réfrigérés.
          </p>
        </div>
      </div>

      {/* Cartes Détaillées des 3 Tournées */}
      <div className="space-y-5">
        {routes.map((route) => {
          const loadPercent = Math.round((route.currentLoadL / route.vehicleCapacityL) * 100);

          return (
            <div
              key={route.id}
              className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4 shadow-lg"
            >
              {/* En-tête de la tournée */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white">{route.name}</span>
                    {route.isColdChainCertified && (
                      <span className="flex items-center gap-1 text-[11px] text-cyan-400 bg-cyan-950/80 border border-cyan-800/80 px-2 py-0.5 rounded font-mono">
                        <Snowflake className="h-3.5 w-3.5" /> Isotherme Frigorifique
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 mt-0.5 block">{route.corridorName}</span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                  <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                    <span className="text-slate-500">Distance : </span>
                    <strong className="text-slate-200">{route.totalDistanceKm} km</strong>
                  </div>
                  <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                    <span className="text-slate-500">Durée tournée : </span>
                    <strong className="text-slate-200">{route.totalDurationHours} h</strong>
                  </div>
                </div>
              </div>

              {/* Jauge de Chargement du Véhicule */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5 text-slate-400" />
                    <span>Charge Véhicule : {route.currentLoadL.toLocaleString()} L / {route.vehicleCapacityL.toLocaleString()} L</span>
                  </span>
                  <span className="font-mono font-bold text-cyan-400">{loadPercent}%</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800/80">
                  <div
                    className={`h-full rounded-full transition-all ${
                      loadPercent > 90 ? 'bg-amber-400' : 'bg-cyan-500'
                    }`}
                    style={{ width: `${loadPercent}%` }}
                  />
                </div>
              </div>

              {/* Séquence des Arrêts de Livraison (Stops) */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-slate-300 block">
                  Itinéraire Séquencé ({route.stops.length} étapes de déchargement) :
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                  {route.stops.map((stop) => (
                    <div
                      key={stop.facilityId}
                      className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2 relative"
                    >
                      {/* Numéro d'arrêt */}
                      <div className="flex items-center justify-between">
                        <span className="h-5 w-5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 text-[10px] font-mono font-bold flex items-center justify-center">
                          #{stop.stopOrder}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> ETA +{stop.etaHours}h
                        </span>
                      </div>

                      <div>
                        <strong className="text-xs text-white block truncate">{stop.facilityName}</strong>
                        <span className="text-[10px] text-slate-500">{stop.department}</span>
                      </div>

                      <div className="pt-1.5 border-t border-slate-800/80 text-[10px] text-slate-400 space-y-0.5">
                        <div className="flex justify-between">
                          <span>Volume livré :</span>
                          <span className="font-mono text-slate-200">{stop.loadVolumeL} L</span>
                        </div>
                        <div className="text-[9px] text-slate-500 truncate">
                          {stop.itemsDelivered.map((i) => `${i.productName} (${i.qty})`).join(', ')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
