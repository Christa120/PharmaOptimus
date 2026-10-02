import React from 'react';
import { Facility, Product, TransferRecommendation } from '../types/pharma';
import { 
  X, 
  MapPin, 
  Building2, 
  Users, 
  Snowflake, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ArrowLeftRight, 
  HelpCircle,
  ExternalLink
} from 'lucide-react';

interface FacilityDetailDrawerProps {
  facility: Facility | null;
  onClose: () => void;
  products: Product[];
  transfers: TransferRecommendation[];
  onTriggerTransferForProduct?: (productId: string) => void;
}

export const FacilityDetailDrawer: React.FC<FacilityDetailDrawerProps> = ({
  facility,
  onClose,
  products,
  transfers,
}) => {
  if (!facility) return null;

  // Filtrer les transferts qui impliquent cette structure
  const relevantTransfers = transfers.filter(
    (t) => t.fromFacilityId === facility.id || t.toFacilityId === facility.id
  );

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] bg-slate-900/98 border-l border-slate-800 shadow-2xl backdrop-blur-xl flex flex-col transition-transform duration-300 ease-in-out">
      
      {/* En-tête du volet */}
      <div className="p-4 border-b border-slate-800 flex items-start justify-between bg-slate-950/60">
        <div className="space-y-1 pr-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded">
              {facility.type === 'central_depot'
                ? 'Dépôt Central'
                : facility.type === 'referral_hospital'
                ? 'Hôpital de Référence'
                : facility.type === 'health_center'
                ? 'Centre de Santé'
                : 'Pharmacie d’Officine'}
            </span>
            {facility.isHardToReach && (
              <span className="text-[10px] text-amber-300 bg-amber-950/80 border border-amber-800/80 px-1.5 py-0.5 rounded">
                Zone d'accès difficile (Pistes)
              </span>
            )}
          </div>
          <h2 className="text-base font-bold text-white leading-snug">{facility.name}</h2>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <MapPin className="h-3.5 w-3.5 text-slate-500" />
            <span>{facility.commune}, {facility.department}</span>
            {facility.neighbourhood && <span>· {facility.neighbourhood}</span>}
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          aria-label="Fermer le volet"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Contenu Défilant */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs text-slate-300">
        
        {/* Grille des Métriques Clés */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">Score de Priorité National</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-emerald-400">
                {facility.priorityScore}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">/ 100</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Délai depuis livr. : {facility.lastDeliveryDaysAgo} jours
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">Bassin de Population</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-white">
                {facility.servedPopulation.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-500">hab.</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
              <Snowflake className={`h-3 w-3 ${facility.hasColdChain ? 'text-cyan-400' : 'text-slate-600'}`} />
              {facility.hasColdChain ? 'Chaîne du froid certifiée' : 'Sans chaîne du froid'}
            </span>
          </div>
        </div>

        {/* Décomposition Transparente du Score de Priorité */}
        {facility.type !== 'central_depot' && (
          <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-200">
              <span className="flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                <span>Justification Mathématique du Score</span>
              </span>
              <span className="font-mono text-emerald-400">{facility.priorityScore} pts</span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Formule normalisée : <code className="text-slate-300 font-mono">100 × (0.40·R + 0.25·C + 0.20·P + 0.15·T)</code>
            </p>

            <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
              <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block">Risque Rupture (40%)</span>
                <span className="font-mono font-bold text-red-400">
                  {Math.round(facility.priorityBreakdown.stockoutRisk * 40)} / 40 pts
                </span>
              </div>
              <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block">Criticité Clinique (25%)</span>
                <span className="font-mono font-bold text-amber-400">
                  {Math.round(facility.priorityBreakdown.clinicalCriticality * 25)} / 25 pts
                </span>
              </div>
              <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block">Population Desservie (20%)</span>
                <span className="font-mono font-bold text-slate-200">
                  {Math.round(facility.priorityBreakdown.populationScore * 20)} / 20 pts
                </span>
              </div>
              <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block">Délai Logistique (15%)</span>
                <span className="font-mono font-bold text-slate-200">
                  {Math.round(facility.priorityBreakdown.timeSinceDelivery * 15)} / 15 pts
                </span>
              </div>
            </div>
          </div>
        )}

        {/* État des Stocks des Médicaments Traceurs */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white text-xs">Stocks des Médicaments Traceurs</h3>
            <span className="text-[10px] font-mono text-slate-400">15 produits essentiels</span>
          </div>

          <div className="space-y-2">
            {facility.stocks.map((stock) => {
              const product = products.find((p) => p.id === stock.productId);
              if (!product) return null;

              const isCritical = stock.daysOfCover < 7;
              const isWarning = stock.daysOfCover >= 7 && stock.daysOfCover < 21;
              const isOverstock = stock.daysOfCover > 60;

              return (
                <div
                  key={stock.productId}
                  className={`p-2.5 rounded-lg border transition ${
                    isCritical
                      ? 'bg-red-950/40 border-red-800/60'
                      : isWarning
                      ? 'bg-amber-950/30 border-amber-800/50'
                      : isOverstock
                      ? 'bg-indigo-950/30 border-indigo-800/50'
                      : 'bg-slate-950/80 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <div className="flex items-center gap-1.5 font-semibold text-white">
                        <span>{product.innName}</span>
                        {product.requiresColdChain && (
                          <span title="Chaîne du froid obligatoire">
                            <Snowflake className="h-3 w-3 text-cyan-400" />
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">{product.strength} · {product.form}</span>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-xs font-mono font-bold ${
                          isCritical
                            ? 'text-red-400'
                            : isWarning
                            ? 'text-amber-400'
                            : isOverstock
                            ? 'text-indigo-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {stock.daysOfCover} jours
                      </span>
                      <span className="text-[10px] text-slate-500 block">de couverture</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400 border-t border-slate-800/60 mt-1">
                    <span>Stock dispo : <strong className="text-slate-200 font-mono">{stock.qtyOnHand.toLocaleString()}</strong> unités</span>
                    <span>Conso hebdo : <strong className="text-slate-200 font-mono">{stock.weeklyConsumptionAvg}</strong></span>
                  </div>

                  {stock.qtyExpiring90d > 0 && (
                    <div className="mt-1 text-[10px] text-amber-300 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-amber-400" />
                      <span>{stock.qtyExpiring90d} unités périment sous 90j</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Transferts Recommandés Rattachés */}
        {relevantTransfers.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <h3 className="font-semibold text-white text-xs flex items-center gap-1.5">
              <ArrowLeftRight className="h-3.5 w-3.5 text-amber-400" />
              <span>Transferts Actifs Recommandés</span>
            </h3>
            <div className="space-y-2">
              {relevantTransfers.map((tr) => (
                <div key={tr.id} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] space-y-1">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-amber-300">{tr.productName}</span>
                    <span className="font-mono text-white">{tr.quantity} unités</span>
                  </div>
                  <p className="text-slate-400 text-[10px]">
                    {tr.fromFacilityId === facility.id ? `Vers : ${tr.toFacilityName}` : `Depuis : ${tr.fromFacilityName}`}
                  </p>
                  <p className="text-slate-500 text-[10px]">{tr.reasonFr}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Métadonnées & Provenance OSM */}
        <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 space-y-1">
          <div className="flex items-center justify-between">
            <span>Source géospatiale :</span>
            <span className="text-slate-400">{facility.source}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Identifiant OSM :</span>
            <span className="font-mono text-slate-400">{facility.osmId || 'N/A'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Statut des données :</span>
            <span className="text-emerald-400 font-mono">is_simulated = true</span>
          </div>
        </div>

      </div>
    </div>
  );
};
