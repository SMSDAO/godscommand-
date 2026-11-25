import React from 'react';
import { Wrench, CheckCircle, Calendar, User, DollarSign, ArrowUpRight } from 'lucide-react';
import { Job } from '../types';

interface JobsViewProps {
  jobs: Job[];
  onCompleteJob: (id: string) => void;
  onNavigate: (tab: string) => void;
  onNotify?: (msg: string) => void;
}

export const JobsView: React.FC<JobsViewProps> = ({ jobs, onCompleteJob, onNavigate, onNotify }) => {
  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="glass-panel p-6 rounded-3xl border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-violet-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Wrench className="w-4 h-4" />
            <span>AI Lead-to-Cash Stage Five, Six & Seven</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Field Jobs, Scheduling & Dispatch</h1>
          <p className="text-xs text-slate-400">Manage technician assignments, track labor and material costs, and complete jobs to auto-generate invoices.</p>
        </div>
        <button
          onClick={() => onNotify?.("Dispatch schedule synchronized with live technician availability.")}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:opacity-90 text-white text-xs font-semibold shadow-lg shadow-violet-500/30 flex items-center space-x-2 shrink-0"
        >
          <Calendar className="w-4 h-4" />
          <span>Dispatch Calendar</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {jobs.map((job) => (
          <div key={job.id} className="glass-panel p-6 rounded-3xl border border-blue-500/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-extrabold text-cyan-300">{job.jobNumber}</span>
                  <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                    job.status === 'COMPLETED'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                  }`}>
                    {job.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">{job.customerName}</h3>
                <p className="text-xs text-slate-400">{job.serviceAddress} • Phone: {job.phone}</p>
              </div>

              <div className="text-right">
                <div className="text-xl font-extrabold text-emerald-400">${job.contractAmount.toLocaleString()}</div>
                <div className="text-[10px] text-slate-400">Gross Profit: ${job.grossProfit.toLocaleString()}</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Job Scope & Technician Notes</span>
              <p className="text-xs text-slate-200">{job.scope}</p>
              <p className="text-xs text-slate-400 italic">Notes: "{job.notes}"</p>
              
              <div className="flex items-center space-x-4 pt-2 text-xs text-cyan-300 font-medium">
                <span className="flex items-center space-x-1"><User className="w-3.5 h-3.5" /><span>Tech: {job.assignedTechnician}</span></span>
                <span className="flex items-center space-x-1"><Calendar className="w-3.5 h-3.5" /><span>Scheduled: {new Date(job.scheduledTime).toLocaleString()}</span></span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-blue-500/20">
              <div className="text-xs text-slate-400">
                Labor Cost: <strong className="text-white">${job.actualLaborCost}</strong> | Material Cost: <strong className="text-white">${job.actualMaterialCost}</strong>
              </div>

              <div className="flex items-center space-x-2">
                {job.status !== 'COMPLETED' ? (
                  <button
                    onClick={() => onCompleteJob(job.id)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 flex items-center space-x-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Complete Job & Generate Invoice</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onNavigate('invoices')}
                    className="px-4 py-2 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-cyan-300 text-xs font-semibold border border-blue-400/30 flex items-center space-x-1.5"
                  >
                    <span>View Invoices & Payments</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
