import React, { useState, useEffect } from 'react';
import { 
  PhoneCall, 
  FileText, 
  Repeat, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  Send, 
  Sparkles, 
  DollarSign, 
  ShieldCheck, 
  ArrowUpRight 
} from 'lucide-react';
import { MissedCall, MaintenanceContract } from '../types';

interface RevenueEngineViewProps {
  missedCalls: MissedCall[];
  maintenanceContracts: MaintenanceContract[];
  onApproveMissedCall: (id: string) => void;
  onNotify?: (msg: string) => void;
  initialSection?: 'missed-calls' | 'followups' | 'maintenance' | 'attribution';
}

export const RevenueEngineView: React.FC<RevenueEngineViewProps> = ({
  missedCalls,
  maintenanceContracts,
  onApproveMissedCall,
  onNotify,
  initialSection = 'missed-calls',
}) => {
  const [activeTab, setActiveTab] = useState<'missed-calls' | 'followups' | 'maintenance' | 'attribution'>(initialSection);

  useEffect(() => {
    setActiveTab(initialSection);
  }, [initialSection]);

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl border border-blue-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4 text-cyan-300" />
              <span>GODS REVENUE ENGINE V1.2.0</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">Missed-Call Recovery & Retention Hub</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Turn missed opportunities into verified revenue with AI-powered telephony recovery and maintenance subscriptions.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center space-x-1.5">
              <CheckCircle className="w-4 h-4" />
              <span>Attributed Revenue: $48,200</span>
            </div>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center space-x-2 mt-6 overflow-x-auto pb-1">
          {[
            { id: 'missed-calls', label: 'Missed-Call Recovery', icon: PhoneCall },
            { id: 'followups', label: 'Estimate Follow-ups', icon: FileText },
            { id: 'maintenance', label: 'Maintenance Contracts', icon: Repeat },
            { id: 'attribution', label: 'Revenue Attribution', icon: TrendingUp },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all shrink-0 ${
                  isSelected
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30 border border-cyan-400/30'
                    : 'bg-blue-950/30 text-slate-400 hover:text-white border border-blue-500/20'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Missed-Call Recovery */}
      {activeTab === 'missed-calls' && (
        <div className="space-y-4">
          <div className="glass-panel p-4 rounded-2xl border border-blue-500/25 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300">
                <PhoneCall className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Twilio Telephony Webhook Active</h3>
                <p className="text-xs text-slate-400">Incoming unanswered calls automatically trigger AI lead identification & response drafting.</p>
              </div>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full">
                Live Integration
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {missedCalls.map((call) => (
              <div key={call.id} className="glass-panel p-5 rounded-3xl border border-blue-500/30 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-white">{call.callerName}</h4>
                    <p className="text-xs font-mono text-cyan-400">{call.callerPhone} • {call.duration}</p>
                  </div>
                  <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                    call.approvalStatus === 'SENT' 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                  }`}>
                    {call.approvalStatus}
                  </span>
                </div>

                <div className="mb-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">AI Drafted SMS Recovery</span>
                  <p className="text-xs text-slate-200 bg-slate-900/60 p-3 rounded-xl border border-slate-800 mt-1 italic">
                    "{call.aiDraftedResponse}"
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-blue-500/20">
                  <span className="text-[11px] text-slate-400">Timestamp: {new Date(call.timestamp).toLocaleTimeString()}</span>
                  {call.approvalStatus !== 'SENT' ? (
                    <button
                      onClick={() => onApproveMissedCall(call.id)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:opacity-90 text-white text-xs font-semibold shadow-lg shadow-blue-500/30 flex items-center space-x-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Approve & Send SMS</span>
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center space-x-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Sent Successfully</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Estimate Follow-ups */}
      {activeTab === 'followups' && (
        <div className="glass-panel p-6 rounded-3xl border border-blue-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Intelligent Estimate Follow-up Automation</h3>
              <p className="text-xs text-slate-400">Configurable multi-touch follow-up sequences for pending proposals.</p>
            </div>
            <span className="px-3 py-1 bg-blue-500/20 text-cyan-300 text-xs font-bold rounded-lg">
              Sequence Active: 24h / 3d / 7d
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/25 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-white">EST-2026-089: Elena Rostova</span>
                  <span className="px-2 py-0.5 text-[10px] bg-violet-500/20 text-violet-300 rounded font-bold">$8,551.75</span>
                </div>
                <p className="text-xs text-slate-300 mt-1">Next Follow-up Step 2 scheduled for today at 2:00 PM via SMS.</p>
              </div>
              <button 
                onClick={() => onNotify?.("Follow-up sequence advanced and approved for immediate dispatch.")}
                className="px-3 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-cyan-300 text-xs font-semibold border border-blue-400/30"
              >
                Send Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Maintenance Contracts */}
      {activeTab === 'maintenance' && (
        <div className="space-y-4">
          <div className="glass-panel p-6 rounded-3xl border border-blue-500/30 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Recurring Maintenance Contracts & Service Club</h3>
              <p className="text-xs text-slate-400">Turn one-time repairs into predictable recurring monthly subscription revenue.</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-emerald-400">89 Active Members</div>
              <div className="text-xs text-slate-400">$3,420 / mo recurring</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {maintenanceContracts.map((mc) => (
              <div key={mc.id} className="glass-panel p-5 rounded-3xl border border-blue-500/25 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">{mc.planName}</h4>
                  <span className="px-2 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-300 rounded font-bold">
                    {mc.status}
                  </span>
                </div>
                <p className="text-xs text-slate-300">Customer: <strong className="text-white">{mc.customerName}</strong></p>
                <p className="text-[11px] text-slate-400">{mc.serviceAddress}</p>
                <div className="flex items-center justify-between pt-3 border-t border-blue-500/20 text-xs">
                  <span className="text-cyan-400">Next Service: {new Date(mc.nextServiceDate).toLocaleDateString()}</span>
                  <span className="font-bold text-white">${mc.price} / {mc.billingInterval}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Attribution */}
      {activeTab === 'attribution' && (
        <div className="glass-panel p-6 rounded-3xl border border-blue-500/30 space-y-4">
          <h3 className="text-base font-bold text-white">Revenue Attribution & Conversion Intelligence</h3>
          <p className="text-xs text-slate-400">Trace every dollar of collected cash back to its original lead acquisition source.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/20">
              <div className="text-xs text-slate-400 mb-1">Missed-Call Recovery</div>
              <div className="text-xl font-bold text-cyan-300">$18,400</div>
              <div className="text-[11px] text-emerald-400 mt-1">14 Converted Jobs</div>
            </div>
            <div className="p-4 rounded-2xl bg-violet-950/40 border border-violet-500/20">
              <div className="text-xs text-slate-400 mb-1">Estimate Follow-up</div>
              <div className="text-xl font-bold text-violet-300">$21,800</div>
              <div className="text-[11px] text-violet-400 mt-1">9 Accepted Proposals</div>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/20">
              <div className="text-xs text-slate-400 mb-1">Maintenance Renewals</div>
              <div className="text-xl font-bold text-emerald-300">$8,000</div>
              <div className="text-[11px] text-emerald-400 mt-1">Recurring Cash Flow</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
