import React, { useState, useMemo, useEffect } from 'react';
import { Facility, Product, TransferRecommendation, DeliveryRoute } from './types/pharma';
import { INITIAL_FACILITIES } from './data/facilities';
import { TRACER_MEDICINES } from './data/medicines';
import { generateTransferRecommendations, generateDeliveryRoutes } from './services/simulationEngine';
import { fetchLiveStats, fetchFacilitiesWithScores, isSupabaseConfigured } from './services/supabaseDataService';
import { Navbar } from './components/Navbar';
import { BeninMap } from './components/BeninMap';
import { DashboardOverview } from './components/DashboardOverview';
import { FacilityDetailDrawer } from './components/FacilityDetailDrawer';
import { ForecastView } from './components/ForecastView';
import { TransfersView } from './components/TransfersView';
import { DeliveryRoutesView } from './components/DeliveryRoutesView';
import { ScenarioSimulatorView } from './components/ScenarioSimulatorView';
import { HomePage } from './components/HomePage';
import { MethodologyModal } from './components/MethodologyModal';
import { ReportExportModal } from './components/ReportExportModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'home' | 'map' | 'forecast' | 'transfers' | 'routes' | 'scenarios'>('home');
  const [simulationWeek, setSimulationWeek] = useState<number>(1);
  const [isSimulatingWeek, setIsSimulatingWeek] = useState<boolean>(false);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>(INITIAL_FACILITIES);
  const [products] = useState<Product[]>(TRACER_MEDICINES);
  const [selectedProductId, setSelectedProductId] = useState<string>(TRACER_MEDICINES[0].id);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);

  // ── Mode Live : bascule entre données locales et Supabase ──────────────────
  const [isLiveMode, setIsLiveMode] = useState<boolean>(false);
  const [liveStats, setLiveStats] = useState<{ criticalCount: number; alertCount: number; transferCount: number; runId: string | null } | null>(null);
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(false);

  const handleToggleLiveMode = async () => {
    if (!isLiveMode && isSupabaseConfigured) {
      setIsLoadingLive(true);
      try {
        const stats = await fetchLiveStats();
        setLiveStats(stats);
        setIsLiveMode(true);
        setNotificationMessage(`Mode Live activé — run_id: ${stats.runId?.slice(0, 8)}… | ${stats.criticalCount} sites critiques | ${stats.alertCount} alertes`);
      } catch {
        setNotificationMessage('Erreur de connexion à Supabase. Vérifiez vos variables d\'environnement.');
      } finally {
        setIsLoadingLive(false);
      }
    } else {
      setIsLiveMode(false);
      setLiveStats(null);
      setNotificationMessage('Mode démonstration activé — données simulées locales.');
    }
    setTimeout(() => setNotificationMessage(null), 5000);
  };

  const initialTransfers = useMemo(() => generateTransferRecommendations(facilities), [facilities]);
  const [transfers, setTransfers] = useState<TransferRecommendation[]>(initialTransfers);
  const routes = useMemo(() => generateDeliveryRoutes(facilities), [facilities]);

  const handleAcceptTransfer = (transferId: string) => {
    setTransfers((prev) => prev.map((t) => (t.id === transferId ? { ...t, status: 'accepted' as const } : t)));
    const target = transfers.find((t) => t.id === transferId);
    if (target) {
      setNotificationMessage(`Transfert validé : ${target.quantity} unités de ${target.productName} en route.`);
      setTimeout(() => setNotificationMessage(null), 4000);
    }
  };

  const handleRejectTransfer = (transferId: string, reason: string) => {
    setTransfers((prev) => prev.map((t) => t.id === transferId ? { ...t, status: 'rejected' as const, rejectionReason: reason } : t));
    setNotificationMessage(`Transfert refusé. Motif consigné : "${reason}".`);
    setTimeout(() => setNotificationMessage(null), 4000);
  };

  const handleAdvanceWeek = () => {
    setIsSimulatingWeek(true);
    setTimeout(() => {
      const nextWeek = simulationWeek + 1;
      setSimulationWeek(nextWeek);
      setFacilities((prev) => prev.map((fac) => {
        if (fac.type === 'central_depot') return { ...fac, lastDeliveryDaysAgo: (fac.lastDeliveryDaysAgo + 7) % 28 };
        const updatedStocks = fac.stocks.map((stock) => {
          const noise = 0.85 + 0.3 * Math.random();
          const consumed = Math.round(stock.weeklyConsumptionAvg * noise);
          const isReplenished = fac.lastDeliveryDaysAgo >= 14 && Math.random() > 0.4;
          const replenishedQty = isReplenished ? stock.weeklyConsumptionAvg * 4 : 0;
          const newQty = Math.max(0, stock.qtyOnHand - consumed + replenishedQty);
          const newDoc = stock.weeklyConsumptionAvg > 0 ? Math.round((newQty / (stock.weeklyConsumptionAvg / 7)) * 10) / 10 : 0;
          let status: typeof stock.status = 'balanced';
          if (newDoc < 7) status = 'critical_stockout';
          else if (newDoc < 21) status = 'low_stock';
          else if (newDoc > 60 && stock.qtyExpiring90d > 0) status = 'overstock_expiry';
          return { ...stock, qtyOnHand: newQty, daysOfCover: newDoc, status };
        });
        const stockoutRisk = Math.min(1.0, updatedStocks.filter(s => s.daysOfCover < 7).length / 3);
        const vitalDanger = Math.min(1.0, updatedStocks.filter(s => { const p = TRACER_MEDICINES.find(m => m.id === s.productId); return p?.criticality === 'vital' && s.daysOfCover < 14; }).length / 2);
        const minLog = Math.log(20000); const maxLog = Math.log(1000000);
        const popScore = Math.min(1.0, Math.max(0, (Math.log(Math.min(1000000, Math.max(20000, fac.servedPopulation))) - minLog) / (maxLog - minLog)));
        const updatedDays = (fac.lastDeliveryDaysAgo + 7) % 35;
        const timeScore = Math.min(1.0, updatedDays / 35);
        return { ...fac, stocks: updatedStocks, lastDeliveryDaysAgo: updatedDays, priorityScore: Math.round(100 * (0.40 * stockoutRisk + 0.25 * vitalDanger + 0.20 * popScore + 0.15 * timeScore)), priorityBreakdown: { stockoutRisk: Math.round(stockoutRisk*100)/100, clinicalCriticality: Math.round(vitalDanger*100)/100, populationScore: Math.round(popScore*100)/100, timeSinceDelivery: Math.round(timeScore*100)/100 } };
      }));
      setIsSimulatingWeek(false);
      setNotificationMessage(`Simulation avancée à S${nextWeek}. Stocks recalculés.`);
      setTimeout(() => setNotificationMessage(null), 4000);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        simulationWeek={simulationWeek}
        onAdvanceWeek={handleAdvanceWeek}
        onOpenMethodology={() => setIsMethodologyOpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
        isSimulatingWeek={isSimulatingWeek}
        isLiveMode={isLiveMode}
        onToggleLiveMode={handleToggleLiveMode}
      />

      {/* Bandeau Live Mode */}
      {isLiveMode && liveStats && (
        <div className="bg-cyan-950/80 border-b border-cyan-800/60 px-4 py-1.5 flex items-center justify-center gap-4 text-xs text-cyan-300">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Données Supabase live — run_id: {liveStats.runId?.slice(0, 8)}…
          </span>
          <span>|</span>
          <span>{liveStats.criticalCount} sites critiques</span>
          <span>|</span>
          <span>{liveStats.alertCount} alertes actives</span>
          <span>|</span>
          <span>{liveStats.transferCount} transferts en attente</span>
        </div>
      )}

      {notificationMessage && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-500 text-slate-950 px-4 py-2.5 rounded-xl shadow-2xl font-semibold text-xs flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-slate-950 animate-ping" />
          <span>{notificationMessage}</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {currentTab === 'home' && <HomePage onNavigateTab={(tab) => setCurrentTab(tab)} onOpenMethodology={() => setIsMethodologyOpen(true)} simulationWeek={simulationWeek} />}
        {currentTab === 'map' && (
          <div className="space-y-6">
            <BeninMap facilities={facilities} selectedFacility={selectedFacility} onSelectFacility={setSelectedFacility} products={products} selectedProductId={selectedProductId} onSelectProduct={setSelectedProductId} transfers={transfers} routes={routes} />
            <DashboardOverview facilities={facilities} products={products} transfers={transfers} routes={routes} onSelectFacility={(fac) => setSelectedFacility(fac)} onNavigateTab={(tab) => setCurrentTab(tab)} simulationWeek={simulationWeek} />
          </div>
        )}
        {currentTab === 'forecast' && <ForecastView facilities={facilities} products={products} simulationWeek={simulationWeek} />}
        {currentTab === 'transfers' && <TransfersView transfers={transfers} onAcceptTransfer={handleAcceptTransfer} onRejectTransfer={handleRejectTransfer} />}
        {currentTab === 'routes' && <DeliveryRoutesView routes={routes} />}
        {currentTab === 'scenarios' && <ScenarioSimulatorView />}
      </main>

      <FacilityDetailDrawer facility={selectedFacility} onClose={() => setSelectedFacility(null)} products={products} transfers={transfers} />
      <MethodologyModal isOpen={isMethodologyOpen} onClose={() => setIsMethodologyOpen(false)} />
      <ReportExportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} facilities={facilities} products={products} transfers={transfers} routes={routes} simulationWeek={simulationWeek} />

      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-4 text-center text-xs text-slate-500">
        PharmaOptimus · Aide à la décision pharmaceutique · Démonstration sur données simulées
        {isLiveMode && <span className="ml-2 text-cyan-400">· Mode Live Supabase activé</span>}
      </footer>
    </div>
  );
}
