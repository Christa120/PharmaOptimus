import React, { useState } from 'react';
import { 
  Map, TrendingUp, ArrowLeftRight, Truck, SlidersHorizontal, 
  CalendarClock, Info, Menu, X, ShieldCheck, ChevronRight, 
  Sparkles, Printer, Database, Wifi
} from 'lucide-react';
import { isSupabaseConfigured } from '../services/supabaseDataService';

interface NavbarProps {
  currentTab: 'home' | 'map' | 'forecast' | 'transfers' | 'routes' | 'scenarios';
  onSelectTab: (tab: 'home' | 'map' | 'forecast' | 'transfers' | 'routes' | 'scenarios') => void;
  simulationWeek: number;
  onAdvanceWeek: () => void;
  onOpenMethodology: () => void;
  onOpenReport: () => void;
  isSimulatingWeek: boolean;
  isLiveMode: boolean;
  onToggleLiveMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab, onSelectTab, simulationWeek, onAdvanceWeek,
  onOpenMethodology, onOpenReport, isSimulatingWeek,
  isLiveMode, onToggleLiveMode,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'home',      label: 'Accueil / Projet',       icon: Sparkles },
    { id: 'map',       label: 'Carte & Réseau Bénin',   icon: Map },
    { id: 'forecast',  label: 'Prévisions & Stocks',    icon: TrendingUp },
    { id: 'transfers', label: 'Transferts Inter-Sites', icon: ArrowLeftRight },
    { id: 'routes',    label: 'Tournées VRP',           icon: Truck },
    { id: 'scenarios', label: 'Simulateur "Et Si ?"',   icon: SlidersHorizontal },
  ] as const;

  const handleNavClick = (tab: 'home' | 'map' | 'forecast' | 'transfers' | 'routes' | 'scenarios') => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Zone 1: Logo */}
        <div className="flex items-center gap-3">
          <button onClick={() => handleNavClick('map')} className="text-left group cursor-pointer focus:outline-none">
            <span className="text-lg sm:text-xl font-bold tracking-tight text-white transition group-hover:text-emerald-400">
              PharmaOptimus
            </span>
          </button>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-400 border-l border-slate-800 pl-3">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px] text-slate-300">Données calibrées & simulées</span>
          </span>
        </div>

        <div className="flex-1" />

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">

          {/* Bouton Mode Live / Mode Démo */}
          {isSupabaseConfigured && (
            <button
              onClick={onToggleLiveMode}
              title={isLiveMode ? "Passer en mode démonstration (données locales)" : "Passer en mode live (données Supabase réelles)"}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition border cursor-pointer ${
                isLiveMode
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/30'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {isLiveMode ? (
                <>
                  <Wifi className="h-3.5 w-3.5 animate-pulse" />
                  <span className="hidden sm:inline">Live Supabase</span>
                </>
              ) : (
                <>
                  <Database className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Mode démo</span>
                </>
              )}
            </button>
          )}

          {/* Rapport PDF */}
          <button onClick={onOpenReport}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition cursor-pointer">
            <Printer className="h-3.5 w-3.5 text-emerald-400" />
            <span>Rapport</span>
          </button>

          {/* Avancer d'une semaine */}
          <button onClick={onAdvanceWeek} disabled={isSimulatingWeek}
            className="flex items-center gap-1.5 px-2 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 rounded-lg transition cursor-pointer disabled:opacity-50">
            <CalendarClock className={`h-4 w-4 ${isSimulatingWeek ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Avancer d'1 sem.</span>
            <span className="bg-emerald-500/30 text-emerald-950 text-[10px] px-1.5 py-0.5 rounded font-mono">S{simulationWeek}</span>
          </button>

          {/* Méthode */}
          <button onClick={onOpenMethodology}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition cursor-pointer">
            <Info className="h-4 w-4 text-slate-400" />
            <span className="hidden xl:inline">Méthode</span>
          </button>

          {/* Menu burger */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg focus:outline-none">
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {mobileMenuOpen && (
        <div className="absolute top-16 right-0 w-full md:w-80 border-b md:border-l border-slate-800 bg-slate-950/95 backdrop-blur-md px-4 py-3 space-y-1 shadow-2xl z-50">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 text-xs text-slate-400">
            <span>Navigation</span>
            <span className="font-mono text-[11px] text-emerald-400">S{simulationWeek}</span>
          </div>
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button key={item.id} onClick={() => handleNavClick(item.id)}
                className={`flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition ${
                  isActive ? 'bg-slate-800 text-emerald-400' : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}>
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-500" />
              </button>
            );
          })}
          <div className="pt-2 border-t border-slate-800/80 space-y-1">
            {isSupabaseConfigured && (
              <button onClick={() => { onToggleLiveMode(); setMobileMenuOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-slate-200">
                <Wifi className={`h-4 w-4 ${isLiveMode ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{isLiveMode ? 'Passer en mode démo' : 'Passer en mode Live Supabase'}</span>
              </button>
            )}
            <button onClick={() => { onOpenReport(); setMobileMenuOpen(false); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-slate-200">
              <Printer className="h-4 w-4 text-emerald-400" />
              <span>Rapport & Bordereaux</span>
            </button>
            <button onClick={() => { onOpenMethodology(); setMobileMenuOpen(false); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-slate-200">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Transparence des données</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
