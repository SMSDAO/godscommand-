import React from 'react';
import { FileText, CheckCircle, Send, Plus, ArrowRight, ShieldCheck } from 'lucide-react';
import { Estimate } from '../types';

interface EstimatesViewProps {
  estimates: Estimate[];
  onApproveEstimate: (id: string) => void;
  onSendEstimate: (id: string) => void;
  onAcceptEstimate: (id: string) => void;
  onNotify?: (msg: string) => void;
}

export const EstimatesView: React.FC<EstimatesViewProps> = ({
  estimates,
  onApproveEstimate,
  onSendEstimate,
  onAcceptEstimate,
  onNotify
}) => {
  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="glass-panel p-6 rounded-3xl border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-violet-400 text-xs font-bold uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>AI Lead-to-Cash Stage Three & Four</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Estimates, Proposals & Customer Portal</h1>
          <p className="text-xs text-slate-400">Review AI-drafted estimates, approve pricing, send secure customer links, and convert acceptances into jobs.</p>
        </div>
        <button
          onClick={() => onNotify?.("Estimate builder ready. Select an approved lead from CRM or edit an active proposal below.")}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:opacity-90 text-white text-xs font-semibold shadow-lg shadow-violet-500/30 flex items-center space-x-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Estimate</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {estimates.map((est) => (
          <div key={est.id} className="glass-panel p-6 rounded-3xl border border-blue-500/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-extrabold text-cyan-300">{est.estimateNumber}</span>
                  <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                    est.status === 'ACCEPTED'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : est.status === 'SENT'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                  }`}>
                    {est.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">{est.customerName}</h3>
                <p className="text-xs text-slate-400">{est.serviceAddress} • Expires: {new Date(est.expiresAt).toLocaleDateString()}</p>
              </div>

              <div className="text-right">
                <div className="text-xl font-extrabold text-emerald-400">${est.total.toLocaleString()}</div>
                <div className="text-[10px] text-slate-400">Subtotal: ${est.subtotal.toLocaleString()} + Tax</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Scope of Work & Line Items</span>
              <p className="text-xs text-slate-200">{est.scope}</p>
              
              <div className="mt-3 pt-3 border-t border-slate-800 space-y-1.5">
                {est.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs text-slate-300">
                    <span>{item.qty}x {item.description}</span>
                    <span className="font-mono text-cyan-300">${item.total.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-blue-500/20">
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Decimal-safe arithmetic & owner approval enforced</span>
              </div>

              <div className="flex items-center space-x-2">
                {est.status === 'DRAFT' || est.status === 'APPROVED_PENDING_SEND' ? (
                  <button
                    onClick={() => onApproveEstimate(est.id)}
                    className="px-3.5 py-2 rounded-xl bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 text-xs font-semibold border border-violet-500/30 flex items-center space-x-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Approve Estimate</span>
                  </button>
                ) : null}

                {est.status === 'APPROVED_PENDING_SEND' || est.status === 'DRAFT' ? (
                  <button
                    onClick={() => onSendEstimate(est.id)}
                    className="px-3.5 py-2 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-cyan-300 text-xs font-semibold border border-blue-400/30 flex items-center space-x-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Customer Link</span>
                  </button>
                ) : null}

                {est.status === 'SENT' && (
                  <button
                    onClick={() => onAcceptEstimate(est.id)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 flex items-center space-x-1.5"
                  >
                    <span>Simulate Customer Acceptance</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {est.status === 'ACCEPTED' && (
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center space-x-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Accepted & Converted to Job</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
