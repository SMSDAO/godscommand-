import React from 'react';
import {
  DollarSign,
  TrendingUp,
  Users,
  Wrench,
  PhoneCall,
  ArrowUpRight,
} from 'lucide-react';
import { Metrics, Lead, Job, MissedCall, Estimate, Invoice, MaintenanceContract } from '../types';
import { NeuralCore, NeuralCoreState } from './NeuralCore';
import { FinancialCharts } from './FinancialCharts';
import { WorkflowTimeline } from './WorkflowTimeline';

interface DashboardViewProps {
  metrics: Metrics;
  leads: Lead[];
  estimates: Estimate[];
  jobs: Job[];
  invoices: Invoice[];
  missedCalls: MissedCall[];
  maintenanceContracts: MaintenanceContract[];
  neuralState: NeuralCoreState;
  onNavigate: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  leads,
  estimates,
  jobs,
  invoices,
  missedCalls,
  maintenanceContracts,
  neuralState,
  onNavigate,
}) => {
  const pendingEstimatesValue = estimates
    .filter((e) => e.status !== 'ACCEPTED')
    .reduce((sum, e) => sum + e.total, 0);

  const unapprovedCallsCount = missedCalls.filter(
    (c) => c.approvalStatus !== 'SENT'
  ).length;

  return (
    <div className="space-y-6 pb-24 lg:pb-6">
      {/* KPI Cards — Swipeable Carousel on iPhone, 4-Col Grid on Desktop */}
      <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto snap-x snap-mandatory pb-2 sm:pb-0 no-scrollbar">
        <button
          onClick={() => onNavigate('invoices')}
          className="snap-start shrink-0 w-[78vw] sm:w-auto text-left glass-level-2 glass-panel-hover p-5 rounded-3xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-[#168BFF]/15 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#A7B3CC] uppercase tracking-wider">
              Total Revenue
            </span>
            <div className="p-2 rounded-xl bg-[#168BFF]/20 text-[#00E5FF] border border-[#168BFF]/30">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-[#F5F7FF] font-mono mb-1">
            ${metrics.totalRevenue.toLocaleString()}
          </div>
          <div className="flex items-center space-x-1.5 text-xs text-[#00F5A0] font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{invoices.filter((i) => i.status === 'PAID').length} verified payments</span>
          </div>
        </button>

        <button
          onClick={() => onNavigate('jobs')}
          className="snap-start shrink-0 w-[78vw] sm:w-auto text-left glass-level-2 glass-panel-hover p-5 rounded-3xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-[#00F5A0]/15 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#A7B3CC] uppercase tracking-wider">
              Gross Profit
            </span>
            <div className="p-2 rounded-xl bg-[#00F5A0]/20 text-[#00F5A0] border border-[#00F5A0]/30">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-[#F5F7FF] font-mono mb-1">
            ${metrics.grossProfit.toLocaleString()}
          </div>
          <div className="flex items-center space-x-1.5 text-xs text-[#00F5A0] font-semibold">
            <span>Margin: {metrics.profitMargin}% (Ledger Verified)</span>
          </div>
        </button>

        <button
          onClick={() => onNavigate('jobs')}
          className="snap-start shrink-0 w-[78vw] sm:w-auto text-left glass-level-2 glass-panel-hover p-5 rounded-3xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-[#8B5CFF]/15 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#A7B3CC] uppercase tracking-wider">
              Active Jobs
            </span>
            <div className="p-2 rounded-xl bg-[#8B5CFF]/20 text-[#B34DFF] border border-[#8B5CFF]/30">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-[#F5F7FF] font-mono mb-1">
            {metrics.activeJobs}
          </div>
          <div className="text-xs text-[#A7B3CC]">
            {metrics.maintenanceContractsActive} active maintenance plans
          </div>
        </button>

        <button
          onClick={() => onNavigate('missed-calls')}
          className="snap-start shrink-0 w-[78vw] sm:w-auto text-left glass-level-2 glass-panel-hover p-5 rounded-3xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-[#FFC857]/15 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#A7B3CC] uppercase tracking-wider">
              Pending Leads
            </span>
            <div className="p-2 rounded-xl bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/30">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-[#F5F7FF] font-mono mb-1">
            {metrics.pendingLeads}
          </div>
          <div className="text-xs text-[#FFC857] font-semibold flex items-center space-x-1">
            <PhoneCall className="w-3 h-3" />
            <span>{unapprovedCallsCount} missed calls awaiting approval</span>
          </div>
        </button>
      </div>

      {/* Signature GODS AI Neural Core */}
      <NeuralCore
        state={neuralState}
        metrics={metrics}
        pendingEstimatesValue={pendingEstimatesValue}
        unapprovedCallsCount={unapprovedCallsCount}
        onNavigate={onNavigate}
      />

      {/* Visual Lead-to-Cash Lifecycle Tracker */}
      <WorkflowTimeline
        leads={leads}
        estimates={estimates}
        jobs={jobs}
        invoices={invoices}
        onNavigate={onNavigate}
      />

      {/* Luminous Financial Charts */}
      <FinancialCharts
        metrics={metrics}
        jobs={jobs}
        invoices={invoices}
        estimates={estimates}
        maintenanceContracts={maintenanceContracts}
      />

      {/* Missed-Call Recovery + Recent Leads + Active Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Urgent Missed Calls / Recovery Feed */}
        <div className="glass-level-2 p-5 sm:p-6 rounded-3xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <PhoneCall className="w-4 h-4 text-[#00E5FF]" />
              <h3 className="text-sm font-bold text-[#F5F7FF]">Missed-Call Recovery</h3>
            </div>
            <span className="px-2.5 py-0.5 bg-[#168BFF]/20 text-[#00E5FF] text-[10px] font-bold rounded-full border border-[#168BFF]/30">
              {missedCalls.length} Events
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[280px]">
            {missedCalls.map((call) => (
              <div
                key={call.id}
                className="p-3.5 rounded-2xl bg-[#050711]/75 border border-[#168BFF]/20 hover:border-[#00E5FF]/40 transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#F5F7FF] truncate">{call.callerName}</span>
                  <span className="text-[10px] text-[#00E5FF] font-mono shrink-0">{call.callerPhone}</span>
                </div>
                <p className="text-[11px] text-[#A7B3CC] italic mb-2 bg-[#080D1D] p-2.5 rounded-xl border border-white/5">
                  "{call.aiDraftedResponse}"
                </p>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                      call.approvalStatus === 'SENT'
                        ? 'bg-[#00F5A0]/15 text-[#00F5A0] border-[#00F5A0]/30'
                        : 'bg-[#FFC857]/15 text-[#FFC857] border-[#FFC857]/30'
                    }`}
                  >
                    {call.approvalStatus}
                  </span>
                  <button
                    onClick={() => onNavigate('missed-calls')}
                    className="min-h-[36px] px-2 text-xs text-[#00E5FF] hover:text-white font-semibold flex items-center space-x-1"
                  >
                    <span>Review</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => onNavigate('missed-calls')}
            className="w-full mt-4 min-h-[44px] py-2 rounded-xl bg-[#168BFF]/15 hover:bg-[#168BFF]/25 text-[#00E5FF] text-xs font-semibold border border-[#168BFF]/30 transition-all"
          >
            Open Recovery Queue
          </button>
        </div>

        {/* Recent Leads */}
        <div className="glass-level-2 p-5 sm:p-6 rounded-3xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#F5F7FF] flex items-center space-x-2">
              <Users className="w-4 h-4 text-[#168BFF]" />
              <span>AI Qualified Leads</span>
            </h3>
            <button
              onClick={() => onNavigate('leads')}
              className="text-xs text-[#00E5FF] hover:underline font-semibold min-h-[36px] flex items-center"
            >
              View CRM →
            </button>
          </div>

          <div className="space-y-3 flex-1">
            {leads.slice(0, 3).map((lead) => (
              <div
                key={lead.id}
                className="p-3.5 rounded-2xl bg-[#050711]/75 border border-[#168BFF]/20 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-[#F5F7FF] truncate">{lead.customerName}</span>
                    <span className="px-1.5 py-0.5 text-[9px] bg-[#00E5FF]/15 text-[#00E5FF] rounded font-bold shrink-0">
                      {lead.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#A7B3CC] mt-1 line-clamp-1">{lead.problemDescription}</p>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className={`px-2 py-1 text-[10px] font-bold rounded-full border ${
                      lead.urgency === 'HIGH' || lead.urgency === 'EMERGENCY'
                        ? 'bg-[#FF315B]/15 text-[#FF315B] border-[#FF315B]/35'
                        : 'bg-[#168BFF]/15 text-[#00E5FF] border-[#168BFF]/35'
                    }`}
                  >
                    {lead.urgency}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Field Jobs */}
        <div className="glass-level-2 p-5 sm:p-6 rounded-3xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#F5F7FF] flex items-center space-x-2">
              <Wrench className="w-4 h-4 text-[#8B5CFF]" />
              <span>Field Jobs &amp; Profit</span>
            </h3>
            <button
              onClick={() => onNavigate('jobs')}
              className="text-xs text-[#B34DFF] hover:underline font-semibold min-h-[36px] flex items-center"
            >
              View Jobs →
            </button>
          </div>

          <div className="space-y-3 flex-1">
            {jobs.slice(0, 3).map((job) => (
              <div
                key={job.id}
                className="p-3.5 rounded-2xl bg-[#050711]/75 border border-[#8B5CFF]/25 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-[#F5F7FF] truncate">
                      {job.jobNumber}: {job.customerName}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#A7B3CC] mt-0.5 truncate">Tech: {job.assignedTechnician}</p>
                  <span className="inline-block mt-1 px-1.5 py-0.5 text-[9px] bg-[#8B5CFF]/20 text-[#B34DFF] rounded font-bold">
                    {job.status}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold font-mono text-[#00F5A0]">
                    ${job.contractAmount.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-[#A7B3CC] font-mono">
                    Profit: ${job.grossProfit.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
