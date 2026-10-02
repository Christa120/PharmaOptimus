import React, { useState } from 'react';
import { TransferRecommendation } from '../types/pharma';
import { 
  ArrowLeftRight, 
  Check, 
  X, 
  Clock, 
  Snowflake, 
  MapPin, 
  AlertCircle, 
  CheckCircle2, 
  Filter,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';

interface TransfersViewProps {
  transfers: TransferRecommendation[];
  onAcceptTransfer: (transferId: string) => void;
  onRejectTransfer: (transferId: string, reason: string) => void;
}

export const TransfersView: React.FC<TransfersViewProps> = ({
  transfers,
  onAcceptTransfer,
  onRejectTransfer,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [rejectingTransferId, setRejectingTransferId] = useState<string | null>(null);
  const [rejectionReasonText, setRejectionReasonText] = useState<string>('');

  const filteredTransfers = transfers.filter((t) => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    return true;
  });

  const pendingCount = transfers.filter((t) => t.status === 'pending').length;
  const acceptedCount = transfers.filter((t) => t.status === 'accepted').length;
  const rejectedCount = transfers.filter((t) => t.status === 'rejected').length;

  const handleConfirmReject = () => {
    if (!rejectingTransferId) return;
    onRejectTransfer(rejectingTransferId, rejectionReasonText.trim() || 'Refus opérationnel du pharmacien gestionnaire');
    setRejectingTransferId(null);
    setRejectionReasonText('');
  };

  return (
    <div className="space-y-6">
      
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-amber-400" />
            <span>Moteur d'Optimisation des Transferts Inter-Établissements</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Programmation linéaire en nombres entiers pour rééquilibrer les stocks sans créer de rupture ailleurs.
          </p>
        </div>

        {/* Compteurs de Statut */}
        <div className="flex items-center gap-2 text-xs">
          <span className="bg-amber-950/60 border border-amber-800 text-amber-300 px-2.5 py-1 rounded-lg font-mono">
            {pendingCount} en attente
          </span>
          <span className="bg-emerald-950/60 border border-emerald-800 text-emerald-300 px-2.5 py-1 rounded-lg font-mono">
            {acceptedCount} validés
          </span>
          <span className="bg-slate-900 border border-slate-800 text-slate-400 px-2.5 py-1 rounded-lg font-mono">
            {rejectedCount} rejetés
          </span>
        </div>
      </div>

      {/* Barre de Filtrage */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 mr-1">Filtrer par état :</span>
          {(['all', 'pending', 'accepted', 'rejected'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                filterStatus === st
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-950'
              }`}
            >
              {st === 'all'
                ? 'Tous'
                : st === 'pending'
                ? 'En attente'
                : st === 'accepted'
                ? 'Validés'
                : 'Rejetés'}
            </button>
          ))}
        </div>

        <span className="text-[11px] text-slate-500 font-mono">
          Affichage de {filteredTransfers.length} recommandations
        </span>
      </div>

      {/* Liste des Transferts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTransfers.map((tr) => (
          <div
            key={tr.id}
            className={`p-4 rounded-xl border transition space-y-3 bg-slate-900/90 ${
              tr.status === 'accepted'
                ? 'border-emerald-800/80 bg-emerald-950/20'
                : tr.status === 'rejected'
                ? 'border-slate-800 bg-slate-950/50 opacity-60'
                : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            {/* Titre & Produit */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>{tr.productName}</span>
                  {tr.requiresColdChain && (
                    <span title="Chaîne du froid 2-8°C">
                      <Snowflake className="h-3.5 w-3.5 text-cyan-400" />
                    </span>
                  )}
                </span>
                <span className="text-[11px] font-mono text-emerald-400 font-bold block mt-0.5">
                  Quantité : {tr.quantity.toLocaleString()} unités ({tr.volumeL} Litres)
                </span>
              </div>

              {/* Badge d'état */}
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                  tr.status === 'accepted'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    : tr.status === 'rejected'
                    ? 'bg-red-950 text-red-300 border-red-800'
                    : 'bg-amber-950 text-amber-300 border-amber-800'
                }`}
              >
                {tr.status === 'accepted'
                  ? 'Transfert Validé'
                  : tr.status === 'rejected'
                  ? 'Transfert Refusé'
                  : 'Recommandation En Attente'}
              </span>
            </div>

            {/* Trajet Expéditeur -> Destinataire */}
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-500">Expéditeur (Surplus) :</span>
                <strong className="text-slate-200 text-right truncate max-w-[220px]">
                  {tr.fromFacilityName}
                </strong>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-500">Bénéficiaire (Rupture) :</span>
                <strong className="text-amber-300 text-right truncate max-w-[220px]">
                  {tr.toFacilityName}
                </strong>
              </div>
            </div>

            {/* Justification Mathématique & Clinique */}
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
              {tr.reasonFr}
            </p>

            {/* Métriques Logistiques */}
            <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
              <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                <span className="text-slate-500 block">Distance Routière</span>
                <span className="text-slate-300 font-bold">{tr.distanceKm} km</span>
              </div>
              <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                <span className="text-slate-500 block">Transit Estimé</span>
                <span className="text-slate-300 font-bold">{tr.estimatedTransitHours} h</span>
              </div>
              <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                <span className="text-slate-500 block">Jours Couverts</span>
                <span className="text-emerald-400 font-bold">+{tr.potentialStockoutDaysPrevented} j</span>
              </div>
            </div>

            {/* Motif de rejet si rejeté */}
            {tr.status === 'rejected' && tr.rejectionReason && (
              <div className="text-[11px] text-red-300 bg-red-950/40 border border-red-900/60 p-2 rounded">
                <strong>Motif de refus :</strong> {tr.rejectionReason}
              </div>
            )}

            {/* Actions de Validation / Rejet */}
            {tr.status === 'pending' && (
              <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                <button
                  onClick={() => onAcceptTransfer(tr.id)}
                  className="flex-1 py-1.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-lg text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  <span>Valider le Transfert</span>
                </button>
                <button
                  onClick={() => setRejectingTransferId(tr.id)}
                  className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs transition flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                  <span>Refuser</span>
                </button>
              </div>
            )}

          </div>
        ))}
      </div>

      {/* Modal de Saisie du Motif de Refus (Requis par le cahier des charges) */}
      {rejectingTransferId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 max-w-md w-full space-y-4 shadow-2xl">
            <div>
              <h3 className="text-sm font-bold text-white">Motif de Refus du Transfert</h3>
              <p className="text-xs text-slate-400 mt-1">
                Conformément aux règles de traçabilité, tout refus de recommandation par un gestionnaire doit être motivé.
              </p>
            </div>

            <textarea
              rows={3}
              value={rejectionReasonText}
              onChange={(e) => setRejectionReasonText(e.target.value)}
              placeholder="Ex : Réserve de sécurité nécessaire pour la semaine prochaine, contrainte de transport local, etc."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />

            <div className="flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => setRejectingTransferId(null)}
                className="px-3 py-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg cursor-pointer"
              >
                Confirmer le Refus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
