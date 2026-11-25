import React from 'react';
import { CheckCircle2, Clock, AlertCircle, Circle } from 'lucide-react';
import { Estimate, Invoice, Job, Lead } from '../types';

interface WorkflowTimelineProps {
  leads: Lead[];
  estimates: Estimate[];
  jobs: Job[];
  invoices: Invoice[];
  onNavigate: (tab: string) => void;
}

type StepStatus = 'COMPLETED' | 'IN_PROGRESS' | 'AWAITING_APPROVAL' | 'PENDING';

interface TimelineStage {
  key: string;
  label: string;
  status: StepStatus;
  detail: string;
  tab: string;
}

export const WorkflowTimeline: React.FC<WorkflowTimelineProps> = ({
  leads,
  estimates,
  jobs,
  invoices,
  onNavigate,
}) => {
  const hasLeads = leads.length > 0;
  const qualifiedLeads = leads.filter((l) => l.status === 'QUALIFIED' || l.status === 'ESTIMATE_SENT');
  const hasEstimates = estimates.length > 0;
  const approvedEstimates = estimates.filter((e) => e.status !== 'DRAFT');
  const sentEstimates = estimates.filter((e) => e.status === 'SENT' || e.status === 'ACCEPTED');
  const acceptedEstimates = estimates.filter((e) => e.status === 'ACCEPTED');
  const hasJobs = jobs.length > 0;
  const completedJobs = jobs.filter((j) => j.status === 'COMPLETED');
  const hasInvoices = invoices.length > 0;
  const paidInvoices = invoices.filter((i) => i.status === 'PAID');

  const stages: TimelineStage[] = [
    {
      key: 'inquiry',
      label: 'Inquiry Received',
      status: hasLeads ? 'COMPLETED' : 'PENDING',
      detail: `${leads.length} lead records`,
      tab: 'leads',
    },
    {
      key: 'qualified',
      label: 'AI Qualified',
      status: qualifiedLeads.length > 0 ? 'COMPLETED' : hasLeads ? 'IN_PROGRESS' : 'PENDING',
      detail: `${qualifiedLeads.length} qualified`,
      tab: 'leads',
    },
    {
      key: 'drafted',
      label: 'Estimate Drafted',
      status: hasEstimates ? 'COMPLETED' : 'PENDING',
      detail: `${estimates.length} proposals`,
      tab: 'estimates',
    },
    {
      key: 'approved',
      label: 'Owner Approved',
      status: approvedEstimates.length > 0 ? 'COMPLETED' : hasEstimates ? 'AWAITING_APPROVAL' : 'PENDING',
      detail: `${approvedEstimates.length} approved`,
      tab: 'estimates',
    },
    {
      key: 'sent',
      label: 'Estimate Sent',
      status: sentEstimates.length > 0 ? 'COMPLETED' : approvedEstimates.length > 0 ? 'IN_PROGRESS' : 'PENDING',
      detail: `${sentEstimates.length} delivered`,
      tab: 'estimates',
    },
    {
      key: 'accepted',
      label: 'Customer Accepted',
      status: acceptedEstimates.length > 0 ? 'COMPLETED' : sentEstimates.length > 0 ? 'AWAITING_APPROVAL' : 'PENDING',
      detail: `${acceptedEstimates.length} accepted`,
      tab: 'estimates',
    },
    {
      key: 'job_created',
      label: 'Job Created',
      status: hasJobs ? 'COMPLETED' : 'PENDING',
      detail: `${jobs.length} jobs`,
      tab: 'jobs',
    },
    {
      key: 'job_completed',
      label: 'Work Completed',
      status: completedJobs.length > 0 ? 'COMPLETED' : hasJobs ? 'IN_PROGRESS' : 'PENDING',
      detail: `${completedJobs.length} completed`,
      tab: 'jobs',
    },
    {
      key: 'invoiced',
      label: 'Invoice Issued',
      status: hasInvoices ? 'COMPLETED' : 'PENDING',
      detail: `${invoices.length} invoices`,
      tab: 'invoices',
    },
    {
      key: 'paid',
      label: 'Payment Verified',
      status: paidInvoices.length > 0 ? 'COMPLETED' : hasInvoices ? 'AWAITING_APPROVAL' : 'PENDING',
      detail: `${paidInvoices.length} Stripe paid`,
      tab: 'invoices',
    },
  ];

  const getBadgeStyle = (status: StepStatus) => {
    switch (status) {
      case 'COMPLETED':
        return {
          icon: CheckCircle2,
          pill: 'bg-[#00F5A0]/15 text-[#00F5A0] border-[#00F5A0]/35',
          iconColor: 'text-[#00F5A0]',
        };
      case 'IN_PROGRESS':
        return {
          icon: Clock,
          pill: 'bg-[#00E5FF]/15 text-[#00E5FF] border-[#00E5FF]/35',
          iconColor: 'text-[#00E5FF]',
        };
      case 'AWAITING_APPROVAL':
        return {
          icon: AlertCircle,
          pill: 'bg-[#FFC857]/15 text-[#FFC857] border-[#FFC857]/35',
          iconColor: 'text-[#FFC857]',
        };
      default:
        return {
          icon: Circle,
          pill: 'bg-slate-800/60 text-[#A7B3CC] border-slate-700',
          iconColor: 'text-slate-500',
        };
    }
  };

  return (
    <section className="glass-level-2 rounded-3xl p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-[#F5F7FF]">
            Lead-to-Cash End-to-End Lifecycle Tracker
          </h3>
          <p className="text-[11px] text-[#A7B3CC]">
            Real-time pipeline state across inquiries, owner approvals, field execution, and Stripe settlement
          </p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#8B5CFF]/20 text-[#B34DFF] border border-[#8B5CFF]/35">
          10-Stage Audit Pipeline
        </span>
      </div>

      <div className="flex gap-2.5 overflow-x-auto pb-2 snap-x snap-mandatory no-scrollbar">
        {stages.map((stage, idx) => {
          const style = getBadgeStyle(stage.status);
          const Icon = style.icon;
          return (
            <button
              key={stage.key}
              onClick={() => onNavigate(stage.tab)}
              className="snap-start shrink-0 w-40 p-3 rounded-2xl bg-[#050711]/80 border border-[#168BFF]/20 hover:border-[#00E5FF]/50 text-left transition-all active:scale-95 flex flex-col justify-between min-h-[92px]"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] font-mono text-[#A7B3CC]">0{idx + 1}</span>
                <Icon className={`w-4 h-4 ${style.iconColor}`} />
              </div>
              <div className="mt-2">
                <div className="text-xs font-bold text-[#F5F7FF] leading-tight">{stage.label}</div>
                <div className="text-[10px] text-[#A7B3CC] mt-0.5">{stage.detail}</div>
              </div>
              <span className={`mt-2 inline-block px-2 py-0.5 text-[9px] font-bold rounded-full border w-fit ${style.pill}`}>
                {stage.status}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
