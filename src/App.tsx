import React, { useState, useMemo } from 'react';
import { Facility, Product, TransferRecommendation, DeliveryRoute } from './types/pharma';
import { INITIAL_FACILITIES } from './data/facilities';
import { TRACER_MEDICINES } from './data/medicines';
import { 
  generateTransferRecommendations, 
  generateDeliveryRoutes 
} from './services/simulationEngine';
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
  // Navigation active : page d'accueil explicative par défaut
  const [currentTab, setCurrentTab] = useState<'home' | 'map' | 'forecast' | 'transfers' | 'routes' | 'scenarios'>('home');
  
  // Semaine de simulation temporelle (Avancement pas-à-pas)
  const [simulationWeek, setSimulationWeek] = useState<number>(1);
  const [isSimulatingWeek, setIsSimulatingWeek] = useState<boolean>(false);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

  // État des données
  const [facilities, setFacilities] = useState<Facility[]>(INITIAL_FACILITIES);
  const [products] = useState<Product[]>(TRACER_MEDICINES);
  const [selectedProductId, setSelectedProductId] = useState<string>(TRACER_MEDICINES[0].id);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);

  // Modals
  const [isMethodologyOpen, setIsMethodologyOpen] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);

  // Transferts et Tournées VRP dérivés de l'état actuel des stocks
  const initialTransfers = useMemo(() => generateTransferRecommendations(facilities), [facilities]);
  const [transfers, setTransfers] = useState<TransferRecommendation[]>(initialTransfers);

  const routes = useMemo(() => generateDeliveryRoutes(facilities), [facilities]);

  // Handler: Validation d'un transfert inter-établissements
  const handleAcceptTransfer = (transferId: string) => {
    setTransfers((prev) =>
      prev.map((t) => (t.id === transferId ? { ...t, status: 'accepted' as const } : t))
    );
    const target = transfers.find((t) => t.id === transferId);
    if (target) {
      // Déclencher une notification
      setNotificationMessage(`Transfert validé : ${target.quantity} unités de ${target.productName} en route.`);
      setTimeout(() => setNotificationMessage(null), 4000);
    }
  };

  // Handler: Rejet motivé d'un transfert inter-établissements
  const handleRejectTransfer = (transferId: string, reason: string) => {
    setTransfers((prev) =>
      prev.map((t) =>
        t.id === transferId ? { ...t, status: 'rejected' as const, rejectionReason: reason } : t
      )
    );
    setNotificationMessage(`Transfert refusé. Motif consigné : "${reason}".`);
    setTimeout(() => setNotificationMessage(null), 4000);
  };

  // Handler: Avancement temporel d'une semaine (Simulation dynamique demandée dans le cahier des charges)
  const handleAdvanceWeek = () => {
    setIsSimulatingWeek(true);

    setTimeout(() => {
      const nextWeek = simulationWeek + 1;
      setSimulationWeek(nextWeek);

      // Simulation de la consommation et vieillissement des stocks
      setFacilities((prevFacilities) =>
        prevFacilities.map((fac, idx) => {
          if (fac.type === 'central_depot') {
            return {
              ...fac,
              lastDeliveryDaysAgo: (fac.lastDeliveryDaysAgo + 7) % 28,
            };
          }

          const updatedStocks = fac.stocks.map((stock, sIdx) => {
            // Variation stochastique de la consommation
            const noise = 0.85 + 0.3 * Math.random();
            const consumed = Math.round(stock.weeklyConsumptionAvg * noise);
            
            // Réapprovisionnement occasionnel si la tournée a lieu
            const isReplenished = fac.lastDeliveryDaysAgo >= 14 && Math.random() > 0.4;
            const replenishedQty = isReplenished ? stock.weeklyConsumptionAvg * 4 : 0;

            const newQty = Math.max(0, stock.qtyOnHand - consumed + replenishedQty);
            const newDoc = stock.weeklyConsumptionAvg > 0
              ? Math.round((newQty / (stock.weeklyConsumptionAvg / 7)) * 10) / 10
              : 0;

            let status: Facility['stocks'][0]['status'] = 'balanced';
            if (newDoc < 7) status = 'critical_stockout';
            else if (newDoc < 21) status = 'low_stock';
            else if (newDoc > 60 && stock.qtyExpiring90d > 0) status = 'overstock_expiry';

            return {
              ...stock,
              qtyOnHand: newQty,
              daysOfCover: newDoc,
              status,
            };
          });

          // Recalcul du score de priorité
          const stockoutItems = updatedStocks.filter((s) => s.daysOfCover < 7);
          const stockoutRisk = Math.min(1.0, stockoutItems.length / 3);
          const vitalItemsInDanger = updatedStocks.filter((s) => {
            const p = TRACER_MEDICINES.find((m) => m.id === s.productId);
            return p?.criticality === 'vital' && s.daysOfCover < 14;
          });
          const clinicalCriticality = Math.min(1.0, vitalItemsInDanger.length / 2);
          const minLog = Math.log(20000);
          const maxLog = Math.log(1000000);
          const popClamped = Math.min(1000000, Math.max(20000, fac.servedPopulation));
          const populationScore = Math.min(1.0, Math.max(0, (Math.log(popClamped) - minLog) / (maxLog - minLog)));
          const updatedDaysAgo = (fac.lastDeliveryDaysAgo + 7) % 35;
          const timeSinceDelivery = Math.min(1.0, updatedDaysAgo / 35);

          const totalScore = Math.round(
            100 * (0.40 * stockoutRisk + 0.25 * clinicalCriticality + 0.20 * populationScore + 0.15 * timeSinceDelivery)
          );

          return {
            ...fac,
            stocks: updatedStocks,
            lastDeliveryDaysAgo: updatedDaysAgo,
            priorityScore: totalScore,
            priorityBreakdown: {
              stockoutRisk: Math.round(stockoutRisk * 100) / 100,
              clinicalCriticality: Math.round(clinicalCriticality * 100) / 100,
              populationScore: Math.round(populationScore * 100) / 100,
              timeSinceDelivery: Math.round(timeSinceDelivery * 100) / 100,
            },
          };
        })
      );

      setIsSimulatingWeek(false);
      setNotificationMessage(`Simulation avancée à la Semaine S${nextWeek}. Stocks et alertes recalculés.`);
      setTimeout(() => setNotificationMessage(null), 4000);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Barre de navigation standard 3 zones */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        simulationWeek={simulationWeek}
        onAdvanceWeek={handleAdvanceWeek}
        onOpenMethodology={() => setIsMethodologyOpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
        isSimulatingWeek={isSimulatingWeek}
      />

      {/* Notification Toast Flottant */}
      {notificationMessage && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-500 text-slate-950 px-4 py-2.5 rounded-xl shadow-2xl font-semibold text-xs flex items-center gap-2 animate-in slide-in-from-top-4 duration-300">
          <span className="h-2 w-2 rounded-full bg-slate-950 animate-ping" />
          <span>{notificationMessage}</span>
        </div>
      )}

      {/* Corps Principal Responsive */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Onglet 0 : Page d'Accueil & Présentation Stratégique du Projet */}
        {currentTab === 'home' && (
          <HomePage
            onNavigateTab={(tab) => setCurrentTab(tab)}
            onOpenMethodology={() => setIsMethodologyOpen(true)}
            simulationWeek={simulationWeek}
          />
        )}

        {/* Onglet 1 : Vue Nationale & Carte Interactive du Bénin */}
        {currentTab === 'map' && (
          <div className="space-y-6">
            <BeninMap
              facilities={facilities}
              selectedFacility={selectedFacility}
              onSelectFacility={setSelectedFacility}
              products={products}
              selectedProductId={selectedProductId}
              onSelectProduct={setSelectedProductId}
              transfers={transfers}
              routes={routes}
            />

            <DashboardOverview
              facilities={facilities}
              products={products}
              transfers={transfers}
              routes={routes}
              onSelectFacility={(fac) => setSelectedFacility(fac)}
              onNavigateTab={(tab) => setCurrentTab(tab)}
              simulationWeek={simulationWeek}
            />
          </div>
        )}

        {/* Onglet 2 : Prévisions & Stocks */}
        {currentTab === 'forecast' && (
          <ForecastView
            facilities={facilities}
            products={products}
            simulationWeek={simulationWeek}
          />
        )}

        {/* Onglet 3 : Transferts Inter-Sites Recommandés */}
        {currentTab === 'transfers' && (
          <TransfersView
            transfers={transfers}
            onAcceptTransfer={handleAcceptTransfer}
            onRejectTransfer={handleRejectTransfer}
          />
        )}

        {/* Onglet 4 : Tournées VRP depuis Cotonou */}
        {currentTab === 'routes' && (
          <DeliveryRoutesView routes={routes} />
        )}

        {/* Onglet 5 : Simulateur "Et Si ?" de Crise */}
        {currentTab === 'scenarios' && (
          <ScenarioSimulatorView />
        )}

      </main>

      {/* Volet Latéral / Bottom Sheet d'Inspection d'Établissement */}
      <FacilityDetailDrawer
        facility={selectedFacility}
        onClose={() => setSelectedFacility(null)}
        products={products}
        transfers={transfers}
      />

      {/* Modal Déontologie & Méthode Scientifique */}
      <MethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
      />

      {/* Bordereau d'Expédition & Rapport PDF Imprimable (P2) */}
      <ReportExportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        facilities={facilities}
        products={products}
        transfers={transfers}
        routes={routes}
        simulationWeek={simulationWeek}
      />

      {/* Pied de Page */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-4 text-center text-xs text-slate-500">
        <span>PharmaOptimus · Aide à la décision pharmaceutique · Démonstration sur données simulées</span>
      </footer>


    </div>
  );
}
