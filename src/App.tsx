import React, { useState, useEffect } from 'react';
import { MotionConfig, motion, AnimatePresence } from 'motion/react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { DashboardView } from './components/DashboardView';
import { RevenueEngineView } from './components/RevenueEngineView';
import { LeadsView } from './components/LeadsView';
import { EstimatesView } from './components/EstimatesView';
import { JobsView } from './components/JobsView';
import { InvoicesView } from './components/InvoicesView';
import { AiCommandView } from './components/AiCommandView';
import { AdminView } from './components/AdminView';
import { SettingsView } from './components/SettingsView';
import { NeuralCoreState } from './components/NeuralCore';
import {
  Organization,
  Metrics,
  Lead,
  Estimate,
  Job,
  Invoice,
  MissedCall,
  MaintenanceContract,
} from './types';
import { Cpu, RefreshCw, CheckCircle, AlertCircle, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [neuralState, setNeuralState] = useState<NeuralCoreState>('PROCESSING');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setNeuralState(type === 'error' ? 'ERROR' : 'SUCCESS');
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
    setTimeout(() => {
      setNeuralState('IDLE');
    }, 2500);
  };

  const [organization, setOrganization] = useState<Organization>({
    name: 'Apex Elite Mechanical & HVAC',
    industry: 'HVAC & Mechanical Services',
    tier: 'Professional',
    owner: 'Marcus Vance',
    email: 'marcus@apexelitehvac.com',
    phone: '+1 (555) 890-1234',
    address: '742 Industrial Pkwy, Austin, TX 78701',
    currency: 'USD',
    stripeConnected: true,
  });

  const [metrics, setMetrics] = useState<Metrics>({
    totalRevenue: 248000,
    grossProfit: 164000,
    netProfit: 82000,
    profitMargin: 33.2,
    activeJobs: 14,
    pendingLeads: 28,
    unpaidInvoicesCount: 6,
    unpaidInvoicesAmount: 34200,
    missedCallsToday: 4,
    maintenanceContractsActive: 89,
  });

  const [leads, setLeads] = useState<Lead[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [missedCalls, setMissedCalls] = useState<MissedCall[]>([]);
  const [maintenanceContracts, setMaintenanceContracts] = useState<MaintenanceContract[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      setNeuralState('PROCESSING');
      const [dashRes, leadsRes, estRes, jobsRes, invRes, callsRes, mcRes] = await Promise.all([
        fetch('/api/dashboard').then((r) => r.json()),
        fetch('/api/leads').then((r) => r.json()),
        fetch('/api/estimates').then((r) => r.json()),
        fetch('/api/jobs').then((r) => r.json()),
        fetch('/api/invoices').then((r) => r.json()),
        fetch('/api/missed-calls').then((r) => r.json()),
        fetch('/api/maintenance').then((r) => r.json()),
      ]);

      if (dashRes.organization) setOrganization(dashRes.organization);
      if (dashRes.metrics) setMetrics(dashRes.metrics);
      setLeads(leadsRes);
      setEstimates(estRes);
      setJobs(jobsRes);
      setInvoices(invRes);
      setMissedCalls(callsRes);
      setMaintenanceContracts(mcRes);
      setError(null);

      const unapprovedCalls = Array.isArray(callsRes)
        ? callsRes.filter((c: MissedCall) => c.approvalStatus !== 'SENT').length
        : 0;
      setNeuralState(unapprovedCalls > 0 ? 'WARNING' : 'IDLE');
    } catch (err: any) {
      console.error('Failed to load backend data:', err);
      setError('Unable to connect to GODS COMMAND AI backend server.');
      setNeuralState('ERROR');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddLead = async (leadData: any) => {
    try {
      setNeuralState('THINKING');
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData),
      });
      const newLead = await res.json();
      setLeads((prev) => [newLead, ...prev]);
      setMetrics((prev) => ({ ...prev, pendingLeads: prev.pendingLeads + 1 }));
      showToast('Lead captured and qualified successfully by AI.');
    } catch (err) {
      showToast('Failed to save lead.', 'error');
    }
  };

  const handleApproveEstimate = async (id: string) => {
    try {
      setNeuralState('PROCESSING');
      const res = await fetch(`/api/estimates/${id}/approve`, { method: 'POST' });
      const updated = await res.json();
      setEstimates((prev) => prev.map((e) => (e.id === id ? updated : e)));
      showToast('Estimate approved successfully.');
    } catch (err) {
      showToast('Failed to approve estimate.', 'error');
    }
  };

  const handleSendEstimate = async (id: string) => {
    try {
      setNeuralState('PROCESSING');
      const res = await fetch(`/api/estimates/${id}/send`, { method: 'POST' });
      const updated = await res.json();
      setEstimates((prev) => prev.map((e) => (e.id === id ? updated : e)));
      showToast('Secure customer estimate link sent successfully.');
    } catch (err) {
      showToast('Failed to send estimate.', 'error');
    }
  };

  const handleAcceptEstimate = async (id: string) => {
    try {
      setNeuralState('PROCESSING');
      const res = await fetch(`/api/estimates/${id}/accept`, { method: 'POST' });
      const data = await res.json();
      setEstimates((prev) => prev.map((e) => (e.id === id ? data.estimate : e)));
      setJobs((prev) => [data.createdJob, ...prev]);
      setMetrics((prev) => ({ ...prev, activeJobs: prev.activeJobs + 1 }));
      showToast('Customer acceptance verified! Job created automatically.');
    } catch (err) {
      showToast('Failed to process customer acceptance.', 'error');
    }
  };

  const handleCompleteJob = async (id: string) => {
    try {
      setNeuralState('PROCESSING');
      const res = await fetch(`/api/jobs/${id}/complete`, { method: 'POST' });
      const data = await res.json();
      setJobs((prev) => prev.map((j) => (j.id === id ? data.job : j)));
      setInvoices((prev) => [data.invoice, ...prev]);
      setMetrics((prev) => ({
        ...prev,
        activeJobs: Math.max(0, prev.activeJobs - 1),
        unpaidInvoicesCount: prev.unpaidInvoicesCount + 1,
        unpaidInvoicesAmount: prev.unpaidInvoicesAmount + data.invoice.amount,
      }));
      showToast('Job marked completed. Invoice generated successfully.');
    } catch (err) {
      showToast('Failed to complete job.', 'error');
    }
  };

  const handlePayStripe = async (id: string) => {
    try {
      setNeuralState('PROCESSING');
      const res = await fetch(`/api/invoices/${id}/pay-stripe`, { method: 'POST' });
      const data = await res.json();
      setInvoices((prev) => prev.map((i) => (i.id === id ? data.invoice : i)));
      await loadData();
      showToast('Stripe secure payment webhook verified and reconciled successfully!');
    } catch (err) {
      showToast('Payment collection failed.', 'error');
    }
  };

  const handleApproveMissedCall = async (id: string) => {
    try {
      setNeuralState('PROCESSING');
      const res = await fetch(`/api/missed-calls/${id}/approve-and-send`, { method: 'POST' });
      const data = await res.json();
      setMissedCalls((prev) => prev.map((c) => (c.id === id ? data.call : c)));
      showToast(data.message);
    } catch (err) {
      showToast('Failed to send SMS recovery message.', 'error');
    }
  };

  const unapprovedCallsCount = missedCalls.filter((c) => c.approvalStatus !== 'SENT').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050711] text-[#F5F7FF] flex flex-col items-center justify-center space-y-4 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#168BFF] to-[#8B5CFF] flex items-center justify-center neon-border-blue neural-pulse">
          <Cpu className="w-8 h-8 text-[#00E5FF]" />
        </div>
        <h2 className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-[#168BFF] via-[#00E5FF] to-[#8B5CFF] bg-clip-text text-transparent">
          GODS COMMAND AI — OS V2.0
        </h2>
        <p className="text-xs text-[#A7B3CC] flex items-center space-x-2">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#00E5FF]" />
          <span>Initializing Neural Core &amp; Lead-to-Cash Ledger...</span>
        </p>
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[#050711] text-[#F5F7FF] flex flex-col selection:bg-[#168BFF] selection:text-white">
        <Header
          organization={organization}
          activeTab={activeTab}
          neuralState={neuralState}
          onNavigate={setActiveTab}
          onNotify={showToast}
        />

        {toast && (
          <div
            role="status"
            className={`fixed top-20 right-4 z-50 glass-level-3 px-4 py-3 rounded-2xl border flex items-center space-x-3 shadow-2xl max-w-sm ${
              toast.type === 'error'
                ? 'border-[#FF315B]/60 text-[#F5F7FF]'
                : 'border-[#00F5A0]/60 text-[#F5F7FF]'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-[#FF315B] shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 text-[#00F5A0] shrink-0" />
            )}
            <span className="text-xs font-medium">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              aria-label="Dismiss notification"
              className="text-[#A7B3CC] hover:text-white min-w-[28px] min-h-[28px] flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
          <Sidebar
            activeTab={activeTab}
            missedCallsCount={unapprovedCallsCount}
            onNavigate={setActiveTab}
          />

          <main className="flex-1 p-3.5 sm:p-6 lg:p-8 overflow-x-hidden">
            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-[#FF315B]/15 border border-[#FF315B]/40 text-[#FF315B] text-xs flex items-center justify-between">
                <span>{error}</span>
                <button
                  onClick={loadData}
                  className="px-3 py-1.5 bg-[#FF315B]/25 rounded-lg font-bold min-h-[36px]"
                >
                  Retry
                </button>
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                {activeTab === 'dashboard' && (
                  <DashboardView
                    metrics={metrics}
                    leads={leads}
                    estimates={estimates}
                    jobs={jobs}
                    invoices={invoices}
                    missedCalls={missedCalls}
                    maintenanceContracts={maintenanceContracts}
                    neuralState={neuralState}
                    onNavigate={setActiveTab}
                  />
                )}

                {(activeTab === 'revenue' ||
                  activeTab === 'missed-calls' ||
                  activeTab === 'maintenance') && (
                  <RevenueEngineView
                    missedCalls={missedCalls}
                    maintenanceContracts={maintenanceContracts}
                    onApproveMissedCall={handleApproveMissedCall}
                    onNotify={showToast}
                    initialSection={activeTab === 'maintenance' ? 'maintenance' : 'missed-calls'}
                  />
                )}

                {activeTab === 'leads' && (
                  <LeadsView
                    leads={leads}
                    onAddLead={handleAddLead}
                    onNavigate={setActiveTab}
                  />
                )}

                {activeTab === 'estimates' && (
                  <EstimatesView
                    estimates={estimates}
                    onApproveEstimate={handleApproveEstimate}
                    onSendEstimate={handleSendEstimate}
                    onAcceptEstimate={handleAcceptEstimate}
                    onNotify={showToast}
                  />
                )}

                {activeTab === 'jobs' && (
                  <JobsView
                    jobs={jobs}
                    onCompleteJob={handleCompleteJob}
                    onNavigate={setActiveTab}
                    onNotify={showToast}
                  />
                )}

                {activeTab === 'invoices' && (
                  <InvoicesView invoices={invoices} onPayStripe={handlePayStripe} />
                )}

                {activeTab === 'ai-command' && <AiCommandView />}

                {activeTab === 'admin' && <AdminView organization={organization} />}

                {activeTab === 'settings' && (
                  <SettingsView organization={organization} onNotify={showToast} />
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        <MobileNav
          activeTab={activeTab}
          onNavigate={setActiveTab}
          drawerOpen={drawerOpen}
          onToggleDrawer={setDrawerOpen}
        />
      </div>
    </MotionConfig>
  );
}
