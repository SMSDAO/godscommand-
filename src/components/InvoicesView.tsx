import React from 'react';
import { Receipt, CheckCircle, CreditCard, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { Invoice } from '../types';

interface InvoicesViewProps {
  invoices: Invoice[];
  onPayStripe: (id: string) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({ invoices, onPayStripe }) => {
  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="glass-panel p-6 rounded-3xl border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Receipt className="w-4 h-4" />
            <span>AI Lead-to-Cash Stage Eight & Nine</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Invoices & Stripe Payment Collection</h1>
          <p className="text-xs text-slate-400">Verified payment reconciliation, Stripe webhook signatures, and instant cash flow accounting.</p>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
          Stripe API: Connected & Secure
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {invoices.map((inv) => (
          <div key={inv.id} className="glass-panel p-5 rounded-3xl border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-cyan-300">{inv.invoiceNumber}</span>
                <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                  inv.status === 'PAID'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                }`}>
                  {inv.status}
                </span>
              </div>
              <h3 className="text-base font-bold text-white">{inv.customerName}</h3>
              <p className="text-xs text-slate-400">Due Date: {inv.dueDate} • Created: {new Date(inv.createdAt).toLocaleDateString()}</p>
              {inv.paymentMethod && (
                <p className="text-[11px] text-emerald-400 font-medium">Method: {inv.paymentMethod}</p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="text-right">
                <div className="text-xl font-extrabold text-white">${inv.amount.toLocaleString()}</div>
                <div className="text-[10px] text-slate-400">Verified Currency (USD)</div>
              </div>

              {inv.status !== 'PAID' ? (
                <button
                  onClick={() => onPayStripe(inv.id)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 hover:opacity-90 text-white text-xs font-semibold shadow-lg shadow-blue-500/30 flex items-center space-x-1.5 shrink-0"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Pay via Stripe Secure Checkout</span>
                </button>
              ) : (
                <span className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center space-x-1 shrink-0">
                  <CheckCircle className="w-4 h-4" />
                  <span>Paid & Reconciled</span>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
