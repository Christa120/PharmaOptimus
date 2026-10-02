import React, { useState, useMemo } from 'react';
import { CRISIS_SCENARIOS, runScenarioSimulation } from '../services/simulationEngine';
import { 
  SlidersHorizontal, 
  AlertTriangle, 
  ShieldCheck, 
  TrendingUp, 
  CheckCircle2, 
  RotateCcw, 
  BarChart, 
  Zap,
  Activity,
  Coins
} from 'lucide-react';

export const ScenarioSimulatorView: React.FC = () => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(CRISIS_SCENARIOS[0].id);

  const currentScenario = useMemo(
    () => CRISIS_SCENARIOS.find((s) => s.id === selectedScenarioId) || CRISIS_SCENARIOS[0],
    [selectedScenarioId]
  );

  // Exécution de la simulation de crise (Monte Carlo 200 itérations)
  const results = useMemo(
    () => runScenarioSimulation(selectedScenarioId),
    [selectedScenarioId]
  );

  return (
    <div className="space-y-6">
      
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-indigo-400" />
            <span>Simulateur de Résilience & Crises "Et Si ?"</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Évaluation comparative par simulation Monte Carlo : Politique classique à seuil fixe vs Régulation IA proactive.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="bg-indigo-950/60 border border-indigo-800 text-indigo-300 px-3 py-1.5 rounded-lg font-mono">
            Bande Monte Carlo 95%
          </span>
          <span className="bg-slate-900 border border-slate-800 text-slate-400 px-3 py-1.5 rounded-lg font-mono">
            P2 - Démonstration
          </span>
        </div>
      </div>

      {/* Sélecteur de Scénario de Crise */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {CRISIS_SCENARIOS.map((scen) => {
          const isSelected = scen.id === selectedScenarioId;
          return (
            <button
              key={scen.id}
              onClick={() => setSelectedScenarioId(scen.id)}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? 'bg-indigo-950/70 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                  : 'bg-slate-900/80 border-slate-800 hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div>
                <span className="text-[10px] font-mono uppercase text-indigo-400 block mb-1">
                  {scen.category === 'epidemic'
                    ? 'Épidémie'
                    : scen.category === 'import_delay'
                    ? 'Retard Maritime'
                    : scen.category === 'road_cut'
                    ? 'Inondation Axe'
                    : scen.category === 'vehicle_breakdown'
                    ? 'Panne Frigo'
                    : 'Choc Carburant'}
                </span>
                <strong className={`text-xs block leading-snug ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                  {scen.title}
                </strong>
              </div>

              <div className="text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-800/80">
                Zone : {scen.affectedZone} · {scen.durationWeeks} sem.
              </div>
            </button>
          );
        })}
      </div>

      {/* Description du Choc Actif */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h2 className="text-xs font-bold text-white">Paramètres du Choc Simulé : {currentScenario.title}</h2>
          <p className="text-xs text-slate-300 leading-relaxed">{currentScenario.description}</p>
        </div>
      </div>

      {/* Comparatif Visuel Face-à-Face (Classique vs IA) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Colonne Gauche : Politique Classique (Seuil Fixe) */}
        <div className="bg-slate-900/80 border border-red-950/80 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] uppercase font-mono text-red-400">Politique de Référence</span>
              <h3 className="text-sm font-bold text-white">Gestion Classique (Seuil Fixe Mensuel)</h3>
            </div>
            <span className="text-xs font-mono text-slate-500 bg-slate-950 px-2 py-1 rounded">Sans IA</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Les centres passent des commandes rigides une fois par mois sans prise en compte des pluies, sans transferts horizontaux, avec tournées de livraison séquencées au plus proche voisin.
          </p>

          <div className="space-y-3 pt-1">
            {/* Taux de service */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Taux de Service Moyen</span>
                <span className="font-mono font-bold text-red-400">{results.baseline.serviceRate}%</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-red-500 h-full rounded-full"
                  style={{ width: `${results.baseline.serviceRate}%` }}
                />
              </div>
            </div>

            {/* Jours de rupture cumulés */}
            <div className="flex justify-between text-xs py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Jours de rupture cumulés :</span>
              <span className="font-mono font-bold text-red-400">
                {results.baseline.stockoutDaysCount} jours
              </span>
            </div>

            {/* Unités périmées */}
            <div className="flex justify-between text-xs py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Unités périmées par surstock statique :</span>
              <span className="font-mono font-bold text-slate-300">
                {results.baseline.expiredUnitsCount} unités
              </span>
            </div>

            {/* Coût total estimé */}
            <div className="flex justify-between text-xs py-1.5">
              <span className="text-slate-400">Coût logistique & pertes :</span>
              <span className="font-mono font-bold text-slate-200">
                {results.baseline.estimatedCostXOF.toLocaleString()} FCFA
              </span>
            </div>
          </div>
        </div>

        {/* Colonne Droite : Politique IA Optimisée PharmaOptimus */}
        <div className="bg-slate-900/90 border border-emerald-800/80 rounded-xl p-5 space-y-4 shadow-xl ring-1 ring-emerald-500/20">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] uppercase font-mono text-emerald-400">Solution Préconisée</span>
              <h3 className="text-sm font-bold text-white">Politique IA Proactive (PharmaOptimus)</h3>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-1 rounded">
              IA + VRP
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Anticipation des besoins par gradient climatique, déclenchement instantané de transferts inter-sites
            et recalcul dynamique des tournées depuis Cotonou.
          </p>

          <div className="space-y-3 pt-1">
            {/* Taux de service */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Taux de Service Garanti</span>
                <span className="font-mono font-bold text-emerald-400">
                  {results.optimized.serviceRate}%
                  <span className="text-[10px] text-slate-400 font-normal ml-1">
                    [{results.optimized.monteCarloConfidenceLow}% - {results.optimized.monteCarloConfidenceHigh}%]
                  </span>
                </span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${results.optimized.serviceRate}%` }}
                />
              </div>
            </div>

            {/* Jours de rupture cumulés */}
            <div className="flex justify-between text-xs py-1.5 border-b border-slate-800/80">
              <span className="text-slate-300">Jours de rupture résiduels :</span>
              <span className="font-mono font-bold text-emerald-400">
                {results.optimized.stockoutDaysCount} jours ({results.stockoutDaysAvoided} jours évités !)
              </span>
            </div>

            {/* Unités périmées */}
            <div className="flex justify-between text-xs py-1.5 border-b border-slate-800/80">
              <span className="text-slate-300">Unités périmées (FEFO préventif) :</span>
              <span className="font-mono font-bold text-emerald-400">
                {results.optimized.expiredUnitsCount} unités (réduction de 85%)
              </span>
            </div>

            {/* Coût total estimé */}
            <div className="flex justify-between text-xs py-1.5">
              <span className="text-slate-300">Coût logistique optimisé :</span>
              <span className="font-mono font-bold text-white">
                {results.optimized.estimatedCostXOF.toLocaleString()} FCFA
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Cartouche Bilan & Économies Réalisées */}
      <div className="bg-emerald-950/30 border border-emerald-800/60 p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <CheckCircle2 className="h-5 w-5" />
            <span>Gain Net d'Efficacité & Impact Sanitaire Démontré</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
            Grâce à l'appariement des surplus locaux et au dimensionnement des convois, la plateforme
            évite <strong className="text-white">{results.stockoutDaysAvoided} jours cumulés de rupture</strong> pour
            la population et préserve les médicaments essentiels d'une expiration inutile.
          </p>
        </div>

        <div className="sm:text-right shrink-0">
          <span className="text-[11px] text-slate-400 block font-mono">Économie budgétaire nette :</span>
          <span className="text-2xl font-bold font-mono text-emerald-400">
            +{Math.round(results.savingsXOF / 1000000 * 10) / 10} M FCFA
          </span>
        </div>
      </div>

    </div>
  );
};
