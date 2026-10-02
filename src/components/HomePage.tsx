import React from 'react';
import { 
  Map, 
  TrendingUp, 
  ArrowLeftRight, 
  Truck, 
  SlidersHorizontal, 
  ShieldCheck, 
  Activity, 
  Snowflake, 
  MapPin, 
  CheckCircle2, 
  ArrowRight,
  Database,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import hubImage from '../assets/images/pharma_logistics_hub_benin_1790864719531.jpg';

interface HomePageProps {
  onNavigateTab: (tab: 'map' | 'forecast' | 'transfers' | 'routes' | 'scenarios') => void;
  onOpenMethodology: () => void;
  simulationWeek: number;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigateTab,
  onOpenMethodology,
  simulationWeek,
}) => {
  return (
    <div className="space-y-16 py-2">
      
      {/* SECTION 1 : HÉROS PRINCIPAL & PRÉSENTATION STRATÉGIQUE */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-b from-slate-900/90 via-slate-950/80 to-[#070b14] p-6 sm:p-10 lg:p-12 shadow-2xl">
        {/* Lueur d'ambiance subtile */}
        <div className="absolute top-0 right-1/4 -z-10 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -z-10 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          <div className="lg:col-span-7 space-y-6">
            {/* Kicker déontologique */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3.5 py-1 text-xs text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold">Aide à la Décision Pharmaceutique</span>
              <span className="text-emerald-500/50">·</span>
              <span className="font-mono text-[11px] text-slate-300">Contexte Bénin</span>
            </div>

            {/* Titre d'impact */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.12]">
              Optimisation Intelligente de la Chaîne Logistique de Santé au <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">Bénin</span>
            </h1>

            {/* Prose explicative de fond */}
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl font-normal">
              De Cotonou jusqu'à Malanville sur plus de 740 kilomètres, la plateforme <strong>PharmaOptimus</strong> transforme les signaux de dispensation, de pluviométrie historique et de transport en décisions proactives. Elle anticipe les ruptures critiques de médicaments traceurs, régule les stocks par transferts horizontaux d'urgence et séquence les convois de distribution frigorifiques depuis le Dépôt Central National.
            </p>

            {/* Actions principales d'entrée */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onNavigateTab('map')}
                className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
              >
                <Map className="h-4 w-4" />
                <span>Explorer la Carte & le Réseau Bénin</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                onClick={() => onNavigateTab('scenarios')}
                className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-semibold text-xs sm:text-sm rounded-xl border border-slate-700/80 transition flex items-center gap-2 cursor-pointer"
              >
                <SlidersHorizontal className="h-4 w-4 text-indigo-400" />
                <span>Tester une Crise "Et Si ?"</span>
              </button>
            </div>

            {/* Métriques clés en pied de héro */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800/80 text-xs">
              <div>
                <span className="block font-mono text-xl sm:text-2xl font-bold text-white">12</span>
                <span className="text-slate-400 text-[11px]">Départements couverts</span>
              </div>
              <div>
                <span className="block font-mono text-xl sm:text-2xl font-bold text-emerald-400">54</span>
                <span className="text-slate-400 text-[11px]">Structures dans le réseau</span>
              </div>
              <div>
                <span className="block font-mono text-xl sm:text-2xl font-bold text-cyan-400">15</span>
                <span className="text-slate-400 text-[11px]">Médicaments traceurs vitaux</span>
              </div>
            </div>
          </div>

          {/* Vignette Illustration Haute Fidélité */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-2xl group aspect-[4/3]">
              <img
                src={hubImage}
                alt="Hub logistique pharmaceutique et chaîne du froid au Bénin"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent pointer-events-none" />
              
              <div className="absolute bottom-4 left-4 right-4 p-3 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-white">
                  <span>Dépôt Central National · Akpakpa Portuaire</span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    Cotonou
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Plateforme logistique centrale assurant le départ des tournées régionales Sud, Centre et Grand Nord.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 2 : LE DÉFI SANITAIRE DU BÉNIN & LA RÉPONSE TECHNOLOGIQUE */}
      <section className="space-y-6">
        <div className="max-w-2xl space-y-2">
          <span className="text-xs uppercase font-mono tracking-wider text-emerald-400 font-semibold">
            Problématique & Enjeux Stratégiques
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Pourquoi une Gestion Intelligente pour le Bénin ?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            La chaîne logistique médicale du pays doit conjuguer des gradients géographiques et climatiques extrêmes avec des contraintes matérielles sévères.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-2.5 hover:border-slate-700 transition">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Activity className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Gradient Palustre & Pluies</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Le Sud connaît deux saisons des pluies tandis que le Nord n'en a qu'une seule. Les pics de paludisme surviennent avec un décalage systématique de 3 à 6 semaines après les précipitations CHIRPS, nécessitant une anticipation fine des CTA.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-2.5 hover:border-slate-700 transition">
            <div className="h-9 w-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Snowflake className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Inviolabilité Chaîne du Froid</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              L'ocytocine (vitale pour prévenir l'hémorragie du post-partum), l'insuline et les vaccins du PEV exigent une conservation stricte entre +2°C et +8°C. Le modèle interdit formellement tout transfert vers des sites dépourvus d'équipements frigorifiques.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-2.5 hover:border-slate-700 transition">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Truck className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Corridors & Pistes Difficiles</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Si la RNIE 2 relie Cotonou à Malanville de manière fluide, certaines localités comme Boukoumbé dans l'Atacora ou Karimama dans l'Alibori sont reliées par des pistes latéritiques vulnérables aux inondations et coupures saisonnières.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-2.5 hover:border-slate-700 transition">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Régulation Horizontale Rapide</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Plutôt que d'attendre un convoi central long et coûteux depuis Cotonou, les formations sanitaires en surplus de proximité peuvent transférer une partie de leur stock excédentaire vers un centre de santé voisin en rupture imminente.
            </p>
          </div>

        </div>
      </section>

      {/* SECTION 3 : LES 3 COUCHES DE DONNÉES & LA DÉONTOLOGIE DU MODÈLE */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-emerald-400" />
              <span>Transparence et Déontologie des Données</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Règle d'or : aucune donnée simulée n'est présentée comme réelle. Tout enregistrement synthétique porte le label technique <code className="text-emerald-400">is_simulated = true</code>.
            </p>
          </div>

          <button
            onClick={onOpenMethodology}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <span>Consulter la Fiche Méthodologique Complète</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          
          <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
              <span>1. Couche Réelle (Sourcée)</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Limites administratives officielles des 12 départements (geoBoundaries / OCHA HDX), géolocalisation des hôpitaux et pharmacies (OpenStreetMap), séries historiques de pluie et température (CHIRPS / Open-Meteo), et catalogue OMS des médicaments essentiels.
            </p>
          </div>

          <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span>2. Couche Calibrée (Littérature)</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Ordres de grandeur épidémiologiques tirés des programmes publics béninois : surconsommation respiratoire liée aux poussières de l'Harmattan (décembre-février), et délais moyens d'importation maritime au Port Autonome de Cotonou (4 à 8 semaines).
            </p>
          </div>

          <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-400" />
              <span>3. Couche Simulée (Contrôlée)</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Séries de stocks, dispensations journalières, réceptions et dates d'expiration générées sous loi binomiale négative pour reproduire l'asymétrie et la sur-dispersion observées en santé publique, avec conservation stricte de l'équation de stock.
            </p>
          </div>

        </div>
      </section>

      {/* SECTION 4 : LES MODULES OPÉRATIONNELS DE LA PLATEFORME */}
      <section className="space-y-6">
        <div className="space-y-2">
          <span className="text-xs uppercase font-mono tracking-wider text-emerald-400 font-semibold">
            Suite Décisionnelle Complète
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Cinq Modules Opérationnels Intégrés
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Accédez directement aux interfaces d'analyse, d'optimisation et d'action de la plateforme.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          
          {/* Module 1 */}
          <div 
            onClick={() => onNavigateTab('map')}
            className="group bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-6 rounded-2xl transition cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <Map className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                Carte Spatiale & Zoom Urbain
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Visualisation interactive des 12 départements, corridors RNIE et 54 structures sanitaires avec zoom dédié sur Cotonou et Calavi.
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 pt-2">
              <span>Ouvrir la Carte</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>

          {/* Module 2 */}
          <div 
            onClick={() => onNavigateTab('forecast')}
            className="group bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-6 rounded-2xl transition cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                Laboratoire Prévisionnel Quantile
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Modèle LightGBM Tweedie et calibration conforme produisant les quantiles [q10, q50, q90] sur 8 semaines avec signaux météo.
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 pt-2">
              <span>Analyser les Prévisions</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>

          {/* Module 3 */}
          <div 
            onClick={() => onNavigateTab('transfers')}
            className="group bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-6 rounded-2xl transition cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <ArrowLeftRight className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                Transferts Horizontaux (PLNE)
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Régulation d'urgence entre surplus et déficits locaux avec solveur linéaire, respect de la chaîne du froid et validation motivée.
              </p>
            </div>
            <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 pt-2">
              <span>Gérer les Transferts</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>

          {/* Module 4 */}
          <div 
            onClick={() => onNavigateTab('routes')}
            className="group bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 p-6 rounded-2xl transition cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                <Truck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                Tournées de Flotte VRP
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Optimisation des itinéraires de camions frigorifiques et fret sec depuis Cotonou vers le Sud, le Centre et le Grand Nord.
              </p>
            </div>
            <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5 pt-2">
              <span>Voir les Itinéraires</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>

          {/* Module 5 */}
          <div 
            onClick={() => onNavigateTab('scenarios')}
            className="group bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 p-6 rounded-2xl transition cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                <SlidersHorizontal className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                Simulateur de Crise "Et Si ?"
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Test en direct de 5 chocs majeurs (flambée de paludisme, panne isotherme, retard portuaire) avec comparaison Monte Carlo 95%.
              </p>
            </div>
            <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5 pt-2">
              <span>Lancer une Simulation</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>

        </div>
      </section>

      {/* SECTION 5 : APPEL À L'ACTION & TRANSITION DIRECTE */}
      <section className="rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 p-8 sm:p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 max-w-xl">
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Prêt à Explorer le Réseau Pharmaceutique National ?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Consultez les niveaux de couverture en temps réel, examinez les scores de priorité des hôpitaux départementaux et validez les transferts d'urgence.
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('map')}
          className="px-6 py-3.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-sm rounded-xl transition shadow-lg shrink-0 cursor-pointer flex items-center gap-2"
        >
          <span>Accéder au Tableau de Bord</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </section>

    </div>
  );
};
