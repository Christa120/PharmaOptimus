import React from 'react';
import { X, ShieldCheck, Database, Cpu, Compass, BookOpen, ExternalLink } from 'lucide-react';

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-200">
        
        {/* En-tête */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                Transparence des Données, Méthode & Cadre Scientifique
              </h2>
              <span className="text-[11px] font-mono text-emerald-400">Règle d'or : is_simulated = true</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Corps défilant */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300 leading-relaxed">
          
          {/* Avertissement fondamental d'honnêteté */}
          <div className="bg-slate-950 p-4 rounded-xl border border-emerald-800/60 space-y-2">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <span>Engagement de Déontologie Scientifique</span>
            </span>
            <p className="text-slate-300">
              Les historiques de stock et de dispensation d'un dépôt central pharmaceutique national ne sont pas
              publics. La plateforme repose ainsi sur une architecture rigoureuse à trois couches distinctes.
              Les performances présentées prouvent la viabilité mathématique et opérationnelle de la chaîne dans
              un environnement contrôlé ; elles préfigurent la validation sur données réelles avec les autorités sanitaires.
            </p>
          </div>

          {/* Les Trois Couches de Données */}
          <div className="space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Database className="h-4 w-4 text-cyan-400" />
              <span>1. Les Trois Couches de Données</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1">
                <span className="text-xs font-bold text-white block">Couche Réelle (Sourcée)</span>
                <p className="text-[11px] text-slate-400">
                  Limites des 12 départements et 77 communes (geoBoundaries), réseau routier et géolocalisation
                  des établissements de santé (OpenStreetMap), pluviométrie historique (CHIRPS / Open-Meteo),
                  liste modèle des médicaments essentiels (OMS).
                </p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1">
                <span className="text-xs font-bold text-white block">Couche Calibrée</span>
                <p className="text-[11px] text-slate-400">
                  Paramètres épidémiologiques tirés de la littérature publique : saisonnalité bimodale au Sud et
                  unimodale au Nord pour le paludisme, pics d'infections respiratoires durant l'Harmattan, délais portuaires.
                </p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1">
                <span className="text-xs font-bold text-white block">Couche Simulée (<code className="text-emerald-400">is_simulated</code>)</span>
                <p className="text-[11px] text-slate-400">
                  Séries de stocks, consommations hebdomadaires, commandes, lots et délais d'expiration générées
                  par simulation stochastique (loi binomiale négative pour la sur-dispersion).
                </p>
              </div>
            </div>
          </div>

          {/* Modèles Prévisionnels & IA */}
          <div className="space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Cpu className="h-4 w-4 text-emerald-400" />
              <span>2. Modélisation Prévisionnelle & Quantiles Fiables</span>
            </h3>

            <p>
              Les prévisions hebdomadaires sont structurées selon une stratégie d'apprentissage global multi-séries :
            </p>

            <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
              <li>
                <strong className="text-slate-200">LightGBM avec objectif Tweedie :</strong> Traitement adapté des demandes
                intermittentes comportant des zéros structurels et une asymétrie positive.
              </li>
              <li>
                <strong className="text-slate-200">Calibration Conforme (CQR) :</strong> Production d'intervalles quantiles
                [q10, q90] garantissant une couverture empirique cible de 80% sans fuite d'information temporelle.
              </li>
              <li>
                <strong className="text-slate-200">Correction de Censure :</strong> Intégration de la variable{' '}
                <code className="text-slate-300 font-mono">stockout_days</code> pour éviter que les périodes de rupture ne soient
                interprétées par le modèle comme une absence de demande des patients.
              </li>
            </ul>
          </div>

          {/* Optimisation Mathématique */}
          <div className="space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Compass className="h-4 w-4 text-amber-400" />
              <span>3. Optimisation Mathématique des Flux</span>
            </h3>

            <div className="space-y-2">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <strong className="text-white text-xs block mb-1">
                  Transferts Inter-Sites (Programmation Linéaire en Nombres Entiers - PLNE)
                </strong>
                <p className="text-slate-400 text-[11px]">
                  Minimisation du coût de transport et pénalités de manque, sous contraintes de conservation résiduelle,
                  volumes de réception et contrainte absolue d'inviolabilité de la chaîne du froid.
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <strong className="text-white text-xs block mb-1">
                  Tournées VRP (Vehicle Routing Problem - OR-Tools)
                </strong>
                <p className="text-slate-400 text-[11px]">
                  Calcul heuristique guidé (Guided Local Search) depuis le Dépôt Central de Cotonou vers les 54 structures,
                  intégrant les pénalités de priorité clinique, la capacité volumétrique des camions et l'autonomie horaire.
                </p>
              </div>
            </div>
          </div>

          {/* Sources et Attributions */}
          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
            <span className="font-semibold text-slate-300 block">Sources & Licences Officielles :</span>
            <p>
              • Données cartographiques & sanitaires : © contributeurs OpenStreetMap (Licence ODbL) et healthsites.io.
            </p>
            <p>
              • Limites administratives : geoBoundaries (Runfola et al., 2020) & OCHA HDX (Licence CC BY 4.0).
            </p>
            <p>
              • Séries climatiques : CHIRPS (Climate Hazards Group InfraRed Precipitation with Station data) et Open-Meteo Archive.
            </p>
            <p>
              • Médicaments traceurs : Organisation Mondiale de la Santé (Liste modèle OMS des médicaments essentiels).
            </p>
          </div>

        </div>

        {/* Pied de modal */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition cursor-pointer"
          >
            Fermer la Fenêtre
          </button>
        </div>

      </div>
    </div>
  );
};
