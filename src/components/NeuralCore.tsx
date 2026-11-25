import React from 'react';
import { Cpu, PhoneCall, Users, Wrench, Receipt, Repeat, TrendingUp, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import { Metrics } from '../types';

export type NeuralCoreState = 'IDLE' | 'PROCESSING' | 'THINKING' | 'SUCCESS' | 'WARNING' | 'ERROR';

interface NeuralCoreProps {
  state: NeuralCoreState;
  metrics: Metrics;
  pendingEstimatesValue: number;
  unapprovedCallsCount: number;
  onNavigate: (tab: string) => void;
}

const STATE_CONFIG: Record<
  NeuralCoreState,
  {
    label: string;
    ringColor: string;
    glowClass: string;
    badgeClass: string;
    coreAccent: string;
  }
> = {
  IDLE: {
    label: 'SYSTEM NOMINAL',
    ringColor: '#168BFF',
    glowClass: 'shadow-[0_0_50px_rgba(22,139,255,0.45)]',
    badgeClass: 'bg-[#168BFF]/20 text-[#00E5FF] border-[#168BFF]/40',
    coreAccent: 'from-[#168BFF] to-[#00E5FF]',
  },
  PROCESSING: {
    label: 'LIVE SYNCING',
    ringColor: '#00E5FF',
    glowClass: 'shadow-[0_0_60px_rgba(0,229,255,0.55)]',
    badgeClass: 'bg-[#00E5FF]/20 text-[#00E5FF] border-[#00E5FF]/50',
    coreAccent: 'from-[#00E5FF] to-[#168BFF]',
  },
  THINKING: {
    label: 'NEURAL REASONING',
    ringColor: '#8B5CFF',
    glowClass: 'shadow-[0_0_60px_rgba(139,92,255,0.55)]',
    badgeClass: 'bg-[#8B5CFF]/20 text-[#B34DFF] border-[#8B5CFF]/50',
    coreAccent: 'from-[#8B5CFF] to-[#B34DFF]',
  },
  SUCCESS: {
    label: 'ACTION VERIFIED',
    ringColor: '#00F5A0',
    glowClass: 'shadow-[0_0_55px_rgba(0,245,160,0.45)]',
    badgeClass: 'bg-[#00F5A0]/20 text-[#00F5A0] border-[#00F5A0]/45',
    coreAccent: 'from-[#00F5A0] to-[#00E5FF]',
  },
  WARNING: {
    label: 'ATTENTION REQUIRED',
    ringColor: '#FFC857',
    glowClass: 'shadow-[0_0_55px_rgba(255,200,87,0.45)]',
    badgeClass: 'bg-[#FFC857]/20 text-[#FFC857] border-[#FFC857]/45',
    coreAccent: 'from-[#FFC857] to-[#FF8C00]',
  },
  ERROR: {
    label: 'SYSTEM ALERT',
    ringColor: '#FF315B',
    glowClass: 'shadow-[0_0_55px_rgba(255,49,91,0.5)]',
    badgeClass: 'bg-[#FF315B]/20 text-[#FF315B] border-[#FF315B]/45',
    coreAccent: 'from-[#FF315B] to-[#8B5CFF]',
  },
};

export const NeuralCore: React.FC<NeuralCoreProps> = ({
  state,
  metrics,
  pendingEstimatesValue,
  unapprovedCallsCount,
  onNavigate,
}) => {
  const cfg = STATE_CONFIG[state];

  const dataStreams = [
    {
      label: 'Lead Pipeline',
      value: `${metrics.pendingLeads} Active`,
      icon: Users,
      color: 'text-[#00E5FF]',
      tab: 'leads',
    },
    {
      label: 'Missed-Call Queue',
      value: `${unapprovedCallsCount} Awaiting Approval`,
      icon: PhoneCall,
      color: unapprovedCallsCount > 0 ? 'text-[#FFC857]' : 'text-[#00F5A0]',
      tab: 'missed-calls',
    },
    {
      label: 'Field Operations',
      value: `${metrics.activeJobs} Active Jobs`,
      icon: Wrench,
      color: 'text-[#8B5CFF]',
      tab: 'jobs',
    },
    {
      label: 'Maintenance Club',
      value: `${metrics.maintenanceContractsActive} Contracts`,
      icon: Repeat,
      color: 'text-[#168BFF]',
      tab: 'maintenance',
    },
  ];

  const aiOutputs = [
    {
      label: 'Verified Revenue',
      value: `$${metrics.totalRevenue.toLocaleString()}`,
      sub: `${metrics.profitMargin}% Gross Margin`,
      color: 'text-[#00F5A0]',
      tab: 'invoices',
    },
    {
      label: 'Open Pipeline Forecast',
      value: `$${pendingEstimatesValue.toLocaleString()}`,
      sub: 'Pending Customer Acceptance',
      color: 'text-[#FFC857]',
      tab: 'estimates',
    },
    {
      label: 'Receivables Due',
      value: `$${metrics.unpaidInvoicesAmount.toLocaleString()}`,
      sub: `${metrics.unpaidInvoicesCount} Unpaid Invoices`,
      color: 'text-[#00E5FF]',
      tab: 'invoices',
    },
  ];

  return (
    <section
      aria-label="GODS AI Neural Core"
      className="glass-level-3 energy-flash-line rounded-3xl p-4 sm:p-6 relative overflow-hidden"
    >
      {/* Ambient volumetric background glows */}
      <div
        className="pointer-events-none absolute -left-20 top-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl opacity-30"
        style={{ background: 'radial-gradient(circle, #168BFF 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute -right-20 top-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl opacity-25"
        style={{ background: 'radial-gradient(circle, #FFC857 0%, #8B5CFF 45%, transparent 75%)' }}
      />

      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 relative z-10">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-[#168BFF]/20 border border-[#00E5FF]/40 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-[#00E5FF]" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold tracking-wide text-[#F5F7FF]">
              GODS AI NEURAL CORE
            </h2>
            <p className="text-[11px] text-[#A7B3CC]">
              Live Lead-to-Cash &amp; Revenue Recovery Telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider border flex items-center gap-1.5 ${cfg.badgeClass}`}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: cfg.ringColor }}
            />
            {cfg.label}
          </span>
          <button
            onClick={() => onNavigate('ai-command')}
            className="min-h-[36px] px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#168BFF] to-[#8B5CFF] hover:opacity-95 active:scale-95 text-white text-xs font-semibold shadow-lg shadow-[#168BFF]/25 transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Open AI Command</span>
          </button>
        </div>
      </div>

      {/* 3-Column Holographic Neural Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center relative z-10">
        {/* Left: Data Streams */}
        <div className="lg:col-span-4 space-y-2.5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#00E5FF] px-1 flex items-center gap-1.5">
            <Zap className="w-3 h-3" />
            <span>Authorized Data Streams</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
            {dataStreams.map((stream) => {
              const Icon = stream.icon;
              return (
                <button
                  key={stream.label}
                  onClick={() => onNavigate(stream.tab)}
                  className="w-full text-left p-3 rounded-2xl glass-panel glass-panel-hover flex items-center justify-between gap-2 min-h-[48px]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-[#080D1D] border border-[#168BFF]/25 flex items-center justify-center shrink-0">
                      <Icon className={`w-4 h-4 ${stream.color}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] text-[#A7B3CC] truncate">{stream.label}</div>
                      <div className="text-xs font-bold text-[#F5F7FF] truncate">{stream.value}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center: Signature AI Processor Orb + SVG Energy Streams */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center py-4 relative">
          {/* Desktop energy fiber SVG connectors */}
          <svg
            aria-hidden="true"
            viewBox="0 0 320 200"
            className="hidden lg:block absolute inset-0 w-full h-full pointer-events-none opacity-80"
          >
            <defs>
              <linearGradient id="leftStream" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#168BFF" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#00E5FF" stopOpacity="0.95" />
              </linearGradient>
              <linearGradient id="rightStream" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#8B5CFF" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#FFC857" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            <path d="M 0 35 C 70 35, 90 100, 140 100" stroke="url(#leftStream)" strokeWidth="2" fill="none" />
            <path d="M 0 80 C 65 80, 95 100, 140 100" stroke="url(#leftStream)" strokeWidth="2" fill="none" />
            <path d="M 0 125 C 65 125, 95 100, 140 100" stroke="url(#leftStream)" strokeWidth="2" fill="none" />
            <path d="M 0 165 C 70 165, 90 100, 140 100" stroke="url(#leftStream)" strokeWidth="2" fill="none" />

            <path d="M 180 100 C 230 100, 250 40, 320 40" stroke="url(#rightStream)" strokeWidth="2" fill="none" />
            <path d="M 180 100 C 235 100, 250 100, 320 100" stroke="url(#rightStream)" strokeWidth="2" fill="none" />
            <path d="M 180 100 C 230 100, 250 160, 320 160" stroke="url(#rightStream)" strokeWidth="2" fill="none" />
          </svg>

          <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center">
            {/* Outer rotating holographic ring */}
            <div
              className="absolute inset-0 rounded-full border border-dashed ring-spin-slow opacity-60"
              style={{ borderColor: cfg.ringColor }}
            />
            {/* Inner counter-rotating energy ring */}
            <div
              className="absolute inset-3 rounded-full border-2 border-t-[#00E5FF] border-r-[#8B5CFF]/50 border-b-[#168BFF]/30 border-l-transparent ring-spin-reverse"
            />
            {/* Volumetric core container */}
            <div
              className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-[#080D1D] border border-[#00E5FF]/50 flex flex-col items-center justify-center neural-pulse ${cfg.glowClass}`}
            >
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cfg.coreAccent} p-0.5 shadow-lg`}
              >
                <div className="w-full h-full rounded-[14px] bg-[#050711] flex items-center justify-center">
                  <Cpu className="w-6 h-6 text-[#00E5FF]" />
                </div>
              </div>
              <span className="mt-1.5 text-[10px] font-extrabold tracking-widest text-[#F5F7FF]">
                GODS AI
              </span>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#A7B3CC]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00F5A0]" />
            <span>Tenant Isolated • Human Approval Enforced</span>
          </div>
        </div>

        {/* Right: AI Processing Output */}
        <div className="lg:col-span-4 space-y-2.5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#FFC857] px-1 flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3" />
            <span>Financial &amp; Recovery Output</span>
          </div>
          <div className="space-y-2">
            {aiOutputs.map((out) => (
              <button
                key={out.label}
                onClick={() => onNavigate(out.tab)}
                className="w-full text-left p-3 rounded-2xl glass-panel glass-panel-hover flex items-center justify-between gap-3 min-h-[52px]"
              >
                <div>
                  <div className="text-[11px] text-[#A7B3CC]">{out.label}</div>
                  <div className="text-[10px] text-[#A7B3CC]/75">{out.sub}</div>
                </div>
                <div className={`text-base sm:text-lg font-extrabold font-mono ${out.color}`}>
                  {out.value}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
