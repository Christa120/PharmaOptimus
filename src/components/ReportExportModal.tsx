import React from 'react';
import { Facility, Product, TransferRecommendation, DeliveryRoute } from '../types/pharma';
import { 
  X, 
  Printer, 
  Download, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Truck, 
  MapPin, 
  Snowflake,
  ShieldCheck,
  ArrowLeftRight
} from 'lucide-react';

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  facilities: Facility[];
  products: Product[];
  transfers: TransferRecommendation[];
  routes: DeliveryRoute[];
  simulationWeek: number;
}

export const ReportExportModal: React.FC<ReportExportModalProps> = ({
  isOpen,
  onClose,
  facilities,
  products,
  transfers,
  routes,
  simulationWeek,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const criticalSites = facilities.filter(f => f.stocks.some(s => s.daysOfCover < 7) && f.type !== 'central_depot');
  const acceptedTransfers = transfers.filter(t => t.status === 'accepted');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-200">
        
        {/* En-tête modal */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/90 print:hidden">
          <div className="flex items-center gap-2.5">
            <FileText className="h-5 w-5 text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold text-white">Rapport National de Situation & Bordereaux d'Expédition</h2>
              <span className="text-[11px] text-slate-400">Génération automatique officielle (Semaine S{simulationWeek})</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-lg transition cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Imprimer / Exporter PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Document Imprimable (Stylé papier médical officiel) */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-8 bg-slate-950 text-slate-200 text-xs font-sans print:p-0 print:bg-white print:text-black">
          
          {/* En-tête Officiel Bénin */}
          <div className="border-b border-slate-800 pb-5 space-y-2 text-center print:border-black">
            <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 print:text-gray-600 block">
              RÉPUBLIQUE DU BÉNIN · MINISTÈRE DE LA SANTÉ
            </span>
            <h1 className="text-lg sm:text-xl font-bold text-white print:text-black uppercase">
              Bordereau National de Régulation Pharmaceutique & Tournées VRP
            </h1>
            <div className="flex justify-center items-center gap-4 text-[11px] text-slate-400 print:text-gray-600 font-mono">
              <span>Date d'émission : 1er octobre 2026</span>
              <span>·</span>
              <span>Semaine Opérationnelle : S{simulationWeek}</span>
              <span>·</span>
              <span>Statut : is_simulated = true</span>
            </div>
          </div>

          {/* Synthèse Nationale */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-white print:text-black border-b border-slate-800 pb-1 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400 print:text-black" />
              <span>1. Synthèse Nationale des Risques</span>
            </h3>
            <div className="grid grid-cols-3 gap-3 font-mono">
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 print:border-gray-300 print:bg-gray-100">
                <span className="text-slate-400 text-[10px] block print:text-gray-600">Sites en Rupture Critique (&lt; 7j)</span>
                <span className="text-lg font-bold text-red-400 print:text-red-700">{criticalSites.length} structures</span>
              </div>
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 print:border-gray-300 print:bg-gray-100">
                <span className="text-slate-400 text-[10px] block print:text-gray-600">Transferts Validés</span>
                <span className="text-lg font-bold text-amber-400 print:text-black">{acceptedTransfers.length} ordres</span>
              </div>
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 print:border-gray-300 print:bg-gray-100">
                <span className="text-slate-400 text-[10px] block print:text-gray-600">Tournées VRP Séquencées</span>
                <span className="text-lg font-bold text-cyan-400 print:text-black">{routes.length} convois</span>
              </div>
            </div>
          </div>

          {/* Bordereau des Transferts Inter-Sites */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-white print:text-black border-b border-slate-800 pb-1 flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4 text-amber-400 print:text-black" />
              <span>2. Ordres de Transferts Inter-Établissements Recommandés</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-mono print:border-black print:text-gray-600">
                    <th className="py-2 px-2">Médicament</th>
                    <th className="py-2 px-2">Expéditeur (Surplus)</th>
                    <th className="py-2 px-2">Destinataire (Besoin)</th>
                    <th className="py-2 px-2 text-right">Quantité</th>
                    <th className="py-2 px-2 text-center">Froid</th>
                    <th className="py-2 px-2 text-center">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-gray-300">
                  {transfers.slice(0, 6).map((t) => (
                    <tr key={t.id} className="text-[11px]">
                      <td className="py-2 px-2 font-semibold text-white print:text-black">{t.productName}</td>
                      <td className="py-2 px-2 text-slate-300 print:text-black">{t.fromFacilityName}</td>
                      <td className="py-2 px-2 text-amber-300 print:text-black font-semibold">{t.toFacilityName}</td>
                      <td className="py-2 px-2 text-right font-mono font-bold">{t.quantity} un.</td>
                      <td className="py-2 px-2 text-center">{t.requiresColdChain ? '❄️ 2-8°C' : 'Fret Sec'}</td>
                      <td className="py-2 px-2 text-center font-mono uppercase text-[10px]">
                        {t.status === 'accepted' ? 'Validé' : t.status === 'rejected' ? 'Rejeté' : 'En Attente'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Manifeste des Tournées VRP pour les Équipes de Livraison */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-white print:text-black border-b border-slate-800 pb-1 flex items-center gap-2">
              <Truck className="h-4 w-4 text-cyan-400 print:text-black" />
              <span>3. Feuille de Route Chauffeurs & Convois Frigorifiques</span>
            </h3>

            <div className="space-y-3">
              {routes.map((r) => (
                <div key={r.id} className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 print:border-gray-300 print:bg-white space-y-2">
                  <div className="flex items-center justify-between font-bold text-white print:text-black">
                    <span>{r.name} ({r.corridorName})</span>
                    <span className="font-mono text-cyan-400 print:text-black text-[11px]">
                      {r.totalDistanceKm} km · {r.totalDurationHours} h · Charge : {r.currentLoadL} L / {r.vehicleCapacityL} L
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 print:text-gray-700 font-mono">
                    Étapes : {r.stops.map(s => `#${s.stopOrder} ${s.facilityName} (+${s.etaHours}h)`).join(' ➔ ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visa & Signatures Officielles */}
          <div className="pt-6 border-t border-slate-800 print:border-black grid grid-cols-2 gap-8 text-[11px]">
            <div>
              <span className="font-semibold block mb-8">Pour la Direction de la Pharmacie et du Médicament :</span>
              <div className="border-b border-slate-700 print:border-black w-48" />
              <span className="text-[10px] text-slate-500 print:text-gray-500 mt-1 block">Visa et Signature</span>
            </div>
            <div className="text-right">
              <span className="font-semibold block mb-8">Pour le Dépôt Central Pharmaceutique National :</span>
              <div className="border-b border-slate-700 print:border-black w-48 ml-auto" />
              <span className="text-[10px] text-slate-500 print:text-gray-500 mt-1 block">Bordereau certifié conforme</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
