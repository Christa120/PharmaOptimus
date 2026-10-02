import React, { useState } from 'react';
import { 
  Map, 
  TrendingUp, 
  ArrowLeftRight, 
  Truck, 
  SlidersHorizontal, 
  CalendarClock, 
  Info, 
  Menu, 
  X,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Bot,
  Printer
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'home' | 'map' | 'forecast' | 'transfers' | 'routes' | 'scenarios';
  onSelectTab: (tab: 'home' | 'map' | 'forecast' | 'transfers' | 'routes' | 'scenarios') => void;
  simulationWeek: number;
  onAdvanceWeek: () => void;
  onOpenMethodology: () => void;
  onOpenReport: () => void;
  isSimulatingWeek: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  simulationWeek,
  onAdvanceWeek,
  onOpenMethodology,
  onOpenReport,
  isSimulatingWeek,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Accueil / Projet', icon: Sparkles },
    { id: 'map', label: 'Carte & Réseau Bénin', icon: Map },
    { id: 'forecast', label: 'Prévisions & Stocks', icon: TrendingUp },
    { id: 'transfers', label: 'Transferts Inter-Sites', icon: ArrowLeftRight },
    { id: 'routes', label: 'Tournées VRP', icon: Truck },
    { id: 'scenarios', label: 'Simulateur "Et Si ?"', icon: SlidersHorizontal },
  ] as const;

  const handleNavClick = (tab: 'home' | 'map' | 'forecast' | 'transfers' | 'routes' | 'scenarios') => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      {/* 3-Zone Contract: [Brand Wordmark] — [Nav Links] — [Primary Actions] */}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleNavClick('map')}
            className="text-left group cursor-pointer focus:outline-none shrink overflow-hidden"
          >
            <span className="text-lg sm:text-xl font-bold tracking-tight text-white transition group-hover:text-emerald-400 truncate block">
              PharmaOptimus
            </span>
          </button>

          {/* Micro tag honnêteté scientifique */}
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-400 border-l border-slate-800 pl-3">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px] text-slate-300">Données calibrées & simulées</span>
          </span>
        </div>

        {/* Zone 2: Navigation Links (Moved to Dropdown Menu to prevent overflow) */}
        <div className="flex-1"></div>

        {/* Zone 3: Primary action buttons */}
        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          {/* Action Rapport National & Export PDF (Hidden on small mobile to save space) */}
          <button
            onClick={onOpenReport}
            title="Générer Rapport National & Bordereaux d'Expédition"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition shadow-sm cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5 text-emerald-400" />
            <span>Rapport & Bordereaux</span>
          </button>

          {/* Action "Avancer d'une semaine" (Démarche interactive demandée par le cahier des charges) */}
          <button
            onClick={onAdvanceWeek}
            disabled={isSimulatingWeek}
            title="Simule l'écoulement d'une semaine de consommation et de réapprovisionnement"
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 rounded-lg transition shadow-sm whitespace-nowrap cursor-pointer disabled:opacity-50"
          >
            <CalendarClock className={`h-4 w-4 sm:h-3.5 sm:w-3.5 ${isSimulatingWeek ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Avancer d’1 sem.</span>
            <span className="bg-emerald-500/30 text-emerald-950 text-[10px] px-1 sm:px-1.5 py-0.5 rounded font-mono">
              S{simulationWeek}
            </span>
          </button>

          {/* Bouton Méthode & Sources */}
          <button
            onClick={onOpenMethodology}
            title="Consulter la transparence des données et l'architecture mathématique"
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 sm:py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition cursor-pointer"
          >
            <Info className="h-4 w-4 text-slate-400" />
            <span className="hidden xl:inline">Méthode</span>
          </button>

          {/* Bouton Menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg focus:outline-none shrink-0"
            aria-label="Ouvrir le menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Menu Déroulant (Accessible on all sizes now) */}
      {mobileMenuOpen && (
        <div className="absolute top-16 right-0 w-full md:w-80 border-b md:border-l md:border-b-0 border-slate-800 bg-slate-950/95 backdrop-blur-md px-4 py-3 space-y-1 shadow-2xl z-50 h-[calc(100vh-64px)] md:h-auto md:rounded-bl-xl">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 text-xs text-slate-400">
            <span>Navigation Principale</span>
            <span className="font-mono text-[11px] text-emerald-400">Semaine actuelle : S{simulationWeek}</span>
          </div>
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition ${
                  isActive
                    ? 'bg-slate-800 text-emerald-400'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-500" />
              </button>
            );
          })}
          <div className="pt-2 border-t border-slate-800/80">
            <button
              onClick={() => {
                onOpenReport();
                setMobileMenuOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-slate-200"
            >
              <Printer className="h-4 w-4 text-emerald-400" />
              <span>Générer Rapport & Bordereaux</span>
            </button>
            <button
              onClick={() => {
                onOpenMethodology();
                setMobileMenuOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-slate-200"
            >
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Transparence des données & Traçabilité is_simulated</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
