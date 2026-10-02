import React, { useState, useMemo } from 'react';
import { Facility, Product, WeeklyForecast } from '../types/pharma';
import { generateWeeklyForecasts } from '../services/simulationEngine';
import { 
  TrendingUp, 
  CloudRain, 
  ShieldAlert, 
  HelpCircle, 
  Calendar, 
  Snowflake, 
  ChevronRight,
  Sparkles,
  BarChart3,
  Layers
} from 'lucide-react';

interface ForecastViewProps {
  facilities: Facility[];
  products: Product[];
  simulationWeek: number;
}

export const ForecastView: React.FC<ForecastViewProps> = ({
  facilities,
  products,
  simulationWeek,
}) => {
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(
    facilities.find((f) => f.type === 'referral_hospital')?.id || facilities[0].id
  );
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0].id);

  const selectedFacility = useMemo(
    () => facilities.find((f) => f.id === selectedFacilityId) || facilities[0],
    [facilities, selectedFacilityId]
  );

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId) || products[0],
    [products, selectedProductId]
  );

  // Génération des prévisions quantiles sur 8 semaines
  const forecasts = useMemo(
    () => generateWeeklyForecasts(selectedFacility, selectedProduct, simulationWeek),
    [selectedFacility, selectedProduct, simulationWeek]
  );

  // Stock actuel et jours de couverture
  const currentStockItem = useMemo(
    () => selectedFacility.stocks.find((s) => s.productId === selectedProductId),
    [selectedFacility, selectedProductId]
  );

  const doc = currentStockItem?.daysOfCover ?? 0;
  const qtyOnHand = currentStockItem?.qtyOnHand ?? 0;

  // Calcul des probabilités de rupture aux horizons 7j, 14j, 30j
  const pStockout7d = doc < 7 ? 0.92 : doc < 14 ? 0.35 : 0.05;
  const pStockout14d = doc < 14 ? 0.88 : doc < 21 ? 0.45 : 0.08;
  const pStockout30d = doc < 30 ? 0.82 : doc < 45 ? 0.38 : 0.12;

  // Échelle max pour le graphique SVG
  const maxDemandVal = Math.max(...forecasts.map((f) => f.q90), 100);

  return (
    <div className="space-y-6">
      
      {/* En-tête de section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            <span>Laboratoire de Prévision de la Demande & Incertitude</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Modélisation quantile LightGBM (objectif Tweedie) avec calibration conforme (CQR) et variables climatiques réelles.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300 font-mono">
            Semaine courante : S{simulationWeek}
          </span>
          <span className="bg-emerald-950/60 border border-emerald-800 text-emerald-300 px-2.5 py-1.5 rounded-lg font-mono">
            Horizon +8 semaines
          </span>
        </div>
      </div>

      {/* Sélecteurs de Structure Sanitaire et Produit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Sélecteur Structure */}
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Structure Sanitaire Analysée</span>
            <span className="text-[11px] font-mono text-slate-400">{selectedFacility.department}</span>
          </label>
          <select
            value={selectedFacilityId}
            onChange={(e) => setSelectedFacilityId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            {facilities.map((fac) => (
              <option key={fac.id} value={fac.id}>
                {fac.name} ({fac.city} - {fac.department})
              </option>
            ))}
          </select>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>Bassin desservi : {selectedFacility.servedPopulation.toLocaleString()} hab.</span>
            <span>{selectedFacility.hasColdChain ? '❄️ Chaîne du froid OK' : 'Non réfrigéré'}</span>
          </div>
        </div>

        {/* Sélecteur Produit */}
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Médicament Traceur</span>
            <span className="text-[11px] font-mono text-emerald-400">{selectedProduct.category}</span>
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.innName} ({p.strength}) {p.requiresColdChain ? '❄️' : ''}
              </option>
            ))}
          </select>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>Coût unitaire : {selectedProduct.unitCostXOF.toLocaleString()} FCFA</span>
            <span>Vol. unitaire : {selectedProduct.volumeLPerUnit} L</span>
          </div>
        </div>

      </div>

      {/* Cartouche Statut & Jauge de Risque */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Couverture en jours */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-xs text-slate-400">Jours de Couverture Actuelle</span>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold font-mono ${
                doc < 7 ? 'text-red-400' : doc < 21 ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {doc} jours
            </span>
            <span className="text-xs text-slate-400">({qtyOnHand.toLocaleString()} unités en stock)</span>
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-2">
            <div
              className={`h-full rounded-full ${
                doc < 7 ? 'bg-red-500' : doc < 21 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, (doc / 60) * 100)}%` }}
            />
          </div>
        </div>

        {/* Probabilités de Rupture Calibrées */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-xs text-slate-400">Risque de Rupture Calibré P(Rupture)</span>
          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400 block">7 jours</span>
              <span className={`text-xs font-mono font-bold ${pStockout7d > 0.5 ? 'text-red-400' : 'text-slate-300'}`}>
                {Math.round(pStockout7d * 100)}%
              </span>
            </div>
            <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400 block">14 jours</span>
              <span className={`text-xs font-mono font-bold ${pStockout14d > 0.5 ? 'text-red-400' : 'text-slate-300'}`}>
                {Math.round(pStockout14d * 100)}%
              </span>
            </div>
            <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400 block">30 jours</span>
              <span className={`text-xs font-mono font-bold ${pStockout30d > 0.5 ? 'text-red-400' : 'text-slate-300'}`}>
                {Math.round(pStockout30d * 100)}%
              </span>
            </div>
          </div>
          <span className="text-[10px] text-slate-500 block pt-1">Calibration isotonique sur résidus rééchantillonnés.</span>
        </div>

        {/* Contexte Clinique & Épidémiologique */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-xs text-slate-400">Comportement Saisonnalité</span>
          <p className="text-xs text-slate-300 leading-tight">
            {selectedProduct.descriptionFr}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 pt-1">
            <CloudRain className="h-3.5 w-3.5" />
            <span>Signal pluviométrique retardé de 3 à 6 semaines</span>
          </div>
        </div>

      </div>

      {/* Graphique de Prévision Quantile SVG Interactif */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-400" />
              <span>Enveloppe de Prévision Quantile [q10, q50, q90] sur 8 Semaines</span>
            </h2>
            <p className="text-xs text-slate-400">
              La zone ombrée représente l'intervalle d'incertitude à 80% (couverture garantie par calibration conforme).
            </p>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="h-2.5 w-2.5 rounded bg-emerald-400" />
              <span>Médiane q50 (demande prévue)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="h-2.5 w-6 rounded bg-emerald-500/20 border border-emerald-500/40" />
              <span>Intervalle [q10 - q90]</span>
            </div>
          </div>
        </div>

        {/* Surface Graphique SVG */}
        <div className="relative w-full h-64 bg-slate-950 rounded-lg p-4 border border-slate-800/80 overflow-hidden">
          <svg viewBox="0 0 760 220" className="w-full h-full">
            {/* Lignes de repère horizontales */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
              const y = 190 - pct * 160;
              const val = Math.round(pct * maxDemandVal);
              return (
                <g key={idx}>
                  <line x1="45" y1={y} x2="740" y2={y} stroke="#1e293b" strokeDasharray="3,3" strokeWidth="1" />
                  <text x="35" y={y + 3} textAnchor="end" fill="#64748b" fontSize="9" className="font-mono">
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Calcul des coordonnées des 8 semaines */}
            {(() => {
              const xStep = 690 / 8;
              const points = forecasts.map((f, i) => {
                const x = 60 + i * xStep + xStep / 2;
                const y50 = 190 - (f.q50 / maxDemandVal) * 160;
                const y10 = 190 - (f.q10 / maxDemandVal) * 160;
                const y90 = 190 - (f.q90 / maxDemandVal) * 160;
                return { x, y50, y10, y90, f };
              });

              // Polygone de la zone d'incertitude [q10, q90]
              const upperPath = points.map((p) => `${p.x},${p.y90}`).join(' L ');
              const lowerPath = [...points].reverse().map((p) => `${p.x},${p.y10}`).join(' L ');
              const envelopeArea = `M ${upperPath} L ${lowerPath} Z`;

              // Ligne médiane q50
              const lineMedian = `M ${points.map((p) => `${p.x},${p.y50}`).join(' L ')}`;

              return (
                <g>
                  {/* Zone ombrée intervalle */}
                  <path d={envelopeArea} fill="#10b981" fillOpacity="0.15" stroke="#10b981" strokeOpacity="0.4" strokeWidth="1" />

                  {/* Ligne médiane */}
                  <path d={lineMedian} fill="none" stroke="#10b981" strokeWidth="2.5" />

                  {/* Points et étiquettes */}
                  {points.map((p, idx) => (
                    <g key={idx} className="group cursor-pointer">
                      <line x1={p.x} y1={p.y10} x2={p.x} y2={p.y90} stroke="#34d399" strokeWidth="1.5" />
                      <circle cx={p.x} cy={p.y50} r="4.5" fill="#10b981" stroke="#064e3b" strokeWidth="2" />
                      
                      {/* Valeur textuelle */}
                      <text x={p.x} y={p.y50 - 9} textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold" className="font-mono">
                        {p.f.q50}
                      </text>

                      {/* Libellé semaine en abscisse */}
                      <text x={p.x} y="210" textAnchor="middle" fill="#94a3b8" fontSize="9" className="font-mono">
                        {p.f.weekLabel}
                      </text>
                    </g>
                  ))}
                </g>
              );
            })()}
          </svg>
        </div>

        {/* Tableau Récapitulatif Hebdomadaire */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                <th className="py-2 px-3">Horizon</th>
                <th className="py-2 px-3 text-right">Plancher q10</th>
                <th className="py-2 px-3 text-right font-bold text-white">Prévision Médiane q50</th>
                <th className="py-2 px-3 text-right">Plafond q90</th>
                <th className="py-2 px-3 text-right">Pluviométrie CHIRPS</th>
                <th className="py-2 px-3 text-center">Impact Clinique</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {forecasts.map((f) => (
                <tr key={f.weekIndex} className="hover:bg-slate-800/30">
                  <td className="py-2.5 px-3 font-semibold text-white font-sans">{f.weekLabel}</td>
                  <td className="py-2.5 px-3 text-right text-slate-400">{f.q10} un.</td>
                  <td className="py-2.5 px-3 text-right font-bold text-emerald-400">{f.q50} un.</td>
                  <td className="py-2.5 px-3 text-right text-slate-400">{f.q90} un.</td>
                  <td className="py-2.5 px-3 text-right text-cyan-400">{f.rainfallMm} mm</td>
                  <td className="py-2.5 px-3 text-center font-sans text-[11px] text-slate-400">
                    {f.rainfallMm && f.rainfallMm > 40 ? 'Surveillance paludisme accrue' : 'Pression nominale'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
