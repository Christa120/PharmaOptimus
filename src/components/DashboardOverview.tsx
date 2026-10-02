import React from 'react';
import { Facility, Product, TransferRecommendation, DeliveryRoute } from '../types/pharma';
import { 
  ShieldAlert, 
  CheckCircle2, 
  TrendingUp, 
  ArrowLeftRight, 
  Truck, 
  Snowflake, 
  Package, 
  AlertCircle,
  Clock,
  ExternalLink,
  MapPin
} from 'lucide-react';
import hubImage from '../assets/images/pharma_logistics_hub_benin_1790864719531.jpg';

interface DashboardOverviewProps {
  facilities: Facility[];
  products: Product[];
  transfers: TransferRecommendation[];
  routes: DeliveryRoute[];
  onSelectFacility: (facility: Facility) => void;
  onNavigateTab: (tab: 'map' | 'forecast' | 'transfers' | 'routes' | 'scenarios') => void;
  simulationWeek: number;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  facilities,
  products,
  transfers,
  routes,
  onSelectFacility,
  onNavigateTab,
  simulationWeek,
}) => {
  // Calcul des statistiques agrégées nationales
  const totalFacilities = facilities.filter((f) => f.type !== 'central_depot').length;
  
  // Structures ayant au moins un produit en rupture critique (< 7j)
  const facilitiesAtCriticalRisk = facilities.filter(
    (f) => f.type !== 'central_depot' && f.stocks.some((s) => s.daysOfCover < 7)
  );

  // Structures ayant un risque de péremption sous 90j
  const totalExpiringUnits90d = facilities.reduce(
    (acc, f) => acc + f.stocks.reduce((sum, s) => sum + s.qtyExpiring90d, 0),
    0
  );

  // Valeur financière des transferts d'urgence recommandés
  const transferSavingsEstimateXOF = transfers.reduce((acc, t) => {
    const prod = products.find((p) => p.id === t.productId);
    return acc + (prod ? t.quantity * prod.unitCostXOF : 0);
  }, 0);

  // Structures triées par score de priorité décroissant (top urgences)
  const topPriorityFacilities = [...facilities]
    .filter((f) => f.type !== 'central_depot')
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 6);

  return (
    <div className="space-y-6">
      
      {/* Carte Héros & Synthèse Opérationnelle avec Image Générée */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 p-6 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          <div className="lg:col-span-7 space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono px-2 py-0.5 rounded">
                Semaine de Simulation : S{simulationWeek}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-300 font-medium">Bénin National</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-400 font-mono text-[11px]">is_simulated = true</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Gestion Intelligente & Résilience Logistique Pharmaceutique
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Supervision unifiée des flux de santé au Bénin : anticipation des ruptures par apprentissage
              automatique (LightGBM/statsforecast), régulation par transferts inter-établissements et
              optimisation des tournées frigorifiques depuis le dépôt central national.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onNavigateTab('map')}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-lg transition shadow cursor-pointer"
              >
                Explorer la Carte Complète du Bénin
              </button>
              <button
                onClick={() => onNavigateTab('transfers')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-lg border border-slate-700 transition cursor-pointer"
              >
                Gérer les Transferts ({transfers.filter((t) => t.status === 'pending').length} en attente)
              </button>
            </div>
          </div>

          {/* Vignette Illustration / Hub Logistique Généré */}
          <div className="lg:col-span-5 relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner group aspect-video">
            <img
              src={hubImage}
              alt="Hub logistique pharmaceutique et chaîne du froid au Bénin"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                // Fallback styled container if image fails to load
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none" />
            <div className="absolute bottom-2.5 left-3 right-3 text-[11px] text-slate-300 font-medium">
              Plateforme Logistique Centrale · Hub Isotherme Cotonou
            </div>
          </div>

        </div>
      </div>

      {/* Cartes Métriques Nationales (4 colonnes responsives) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Métrique 1: Risque de Rupture */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Rupture Imminente (&lt; 7j)</span>
            <ShieldAlert className="h-4 w-4 text-red-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-red-400">
              {facilitiesAtCriticalRisk.length}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              / {totalFacilities} sites ({Math.round((facilitiesAtCriticalRisk.length / totalFacilities) * 100)}%)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Structures nécessitant un réapprovisionnement ou transfert prioritaire cette semaine.
          </p>
        </div>

        {/* Métrique 2: Transferts Proposés */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Transferts Inter-Sites</span>
            <ArrowLeftRight className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-400">
              {transfers.length}
            </span>
            <span className="text-xs text-slate-400 font-mono">recommandations</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Volume de régulation directe : <strong className="text-slate-200">{Math.round(transferSavingsEstimateXOF / 1000000 * 10) / 10} M FCFA</strong> rééquilibrés.
          </p>
        </div>

        {/* Métrique 3: Péremption à 90 jours */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Lots Proches Péremption (90j)</span>
            <AlertCircle className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-indigo-400">
              {totalExpiringUnits90d.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-mono">unités</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Application de la règle FEFO (First Expired, First Out) pour redistribuer vers sites à forte rotation.
          </p>
        </div>

        {/* Métrique 4: Flotte VRP en Rotation */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Tournées VRP Planifiées</span>
            <Truck className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-cyan-400">
              {routes.length}
            </span>
            <span className="text-xs text-slate-400 font-mono">corridors</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Couverture Sud, Centre et Grand Nord depuis Cotonou avec respect strict de la chaîne du froid.
          </p>
        </div>

      </div>

      {/* Tableau des Structures Sanitaires les Plus Critiques (Priorité Nationale) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-red-400" />
              <span>Priorité d'Intervention d'Urgence (Top Structures Critiques)</span>
            </h2>
            <p className="text-xs text-slate-400">
              Classement multi-critères auditable (Risque rupture 40% + Criticité clinique 25% + Population 20% + Délai 15%).
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('map')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 cursor-pointer"
          >
            <span>Voir l'ensemble des 54 structures</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Tableau Responsive */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Structure Sanitaire</th>
                <th className="py-2.5 px-3">Département</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3 text-right">Population</th>
                <th className="py-2.5 px-3 text-center">Chaîne du Froid</th>
                <th className="py-2.5 px-3 text-center">Produits en Rupture (&lt;7j)</th>
                <th className="py-2.5 px-3 text-right">Score Priorité</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {topPriorityFacilities.map((fac) => {
                const criticalCount = fac.stocks.filter((s) => s.daysOfCover < 7).length;
                return (
                  <tr
                    key={fac.id}
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => onSelectFacility(fac)}
                  >
                    <td className="py-3 px-3 font-semibold text-white group-hover:text-emerald-400 flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span className="truncate max-w-[200px] sm:max-w-xs">{fac.name}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{fac.department}</td>
                    <td className="py-3 px-3 text-slate-400">
                      {fac.type === 'referral_hospital'
                        ? 'Hôpital Réf.'
                        : fac.type === 'health_center'
                        ? 'Centre Santé'
                        : 'Pharmacie'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-300">
                      {fac.servedPopulation.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {fac.hasColdChain ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-cyan-400 font-mono">
                          <Snowflake className="h-3 w-3" /> Oui
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">Non</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {criticalCount > 0 ? (
                        <span className="inline-block bg-red-950/80 text-red-300 border border-red-800 px-2 py-0.5 rounded font-mono font-bold text-[11px]">
                          {criticalCount} en rupture
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-mono text-[11px]">0</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="font-mono font-bold text-sm text-emerald-400">
                        {fac.priorityScore}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono"> / 100</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectFacility(fac);
                        }}
                        className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition cursor-pointer"
                      >
                        Inspecter
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
