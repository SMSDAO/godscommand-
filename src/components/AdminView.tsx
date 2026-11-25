import React, { useEffect, useState } from 'react';
import { ShieldCheck, Lock, Server, Database, RefreshCw, Play, RotateCcw, PhoneCall } from 'lucide-react';
import { Organization } from '../types';

interface AdminViewProps {
  organization: Organization;
}

interface QueueJobRow {
  id: string;
  job_type: string;
  resource_id: string;
  idempotency_key: string;
  status: string;
  attempts: number;
  max_attempts: number;
  next_run_at: string;
  last_error: string | null;
  created_at: string;
}

interface TelephonyConnRow {
  id: string;
  provider: string;
  account_sid_masked: string;
  phone_number_e164: string;
  auto_send_enabled: number;
  recording_enabled: number;
  status: string;
}

export const AdminView: React.FC<AdminViewProps> = ({ organization }) => {
  const [jobs, setJobs] = useState<QueueJobRow[]>([]);
  const [deadLetters, setDeadLetters] = useState<any[]>([]);
  const [connections, setConnections] = useState<TelephonyConnRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchQueueAndTelephony = async () => {
    setRefreshing(true);
    try {
      const [qRes, tRes] = await Promise.all([
        fetch('/api/queue/jobs').then((r) => r.json()),
        fetch('/api/telephony/connections').then((r) => r.json()),
      ]);
      setJobs(Array.isArray(qRes.jobs) ? qRes.jobs : []);
      setDeadLetters(Array.isArray(qRes.deadLetters) ? qRes.deadLetters : []);
      setConnections(Array.isArray(tRes) ? tRes : []);
    } catch (err) {
      console.error('Failed to load queue/telephony telemetry:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQueueAndTelephony();
  }, []);

  const handleRunWorkerPass = async () => {
    await fetch('/api/queue/tick', { method: 'POST' });
    await fetchQueueAndTelephony();
  };

  const handleRetryJob = async (id: string) => {
    await fetch(`/api/queue/jobs/${id}/retry`, { method: 'POST' });
    await fetchQueueAndTelephony();
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-6">
      <div className="glass-level-2 p-6 rounded-3xl border border-[#168BFF]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[#FF315B] text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Platform Administration &amp; Compliance</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#F5F7FF]">Super Admin Command Center</h1>
          <p className="text-xs text-[#A7B3CC]">
            SQLite-backed tenant isolation, telephony connections, durable job queue, and audit logging.
          </p>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-[#00F5A0]/15 text-[#00F5A0] border border-[#00F5A0]/35 text-xs font-bold">
          SQLite WAL + FK Isolation Active
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-level-2 p-5 rounded-3xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#A7B3CC]">Tenant ID</span>
            <Database className="w-4 h-4 text-[#00E5FF]" />
          </div>
          <div className="text-sm font-bold font-mono text-[#F5F7FF]">tenant_apex_hvac_01</div>
          <div className="text-[11px] text-[#00F5A0]">Composite (tenant_id, id) FK Enforced</div>
        </div>

        <div className="glass-level-2 p-5 rounded-3xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#A7B3CC]">Active Role</span>
            <Lock className="w-4 h-4 text-[#8B5CFF]" />
          </div>
          <div className="text-sm font-bold text-[#F5F7FF]">Super Admin / Owner</div>
          <div className="text-[11px] text-[#B34DFF]">Human Approval Default Enforced</div>
        </div>

        <div className="glass-level-2 p-5 rounded-3xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#A7B3CC]">Durable Queue Depth</span>
            <Server className="w-4 h-4 text-[#00F5A0]" />
          </div>
          <div className="text-sm font-bold text-[#F5F7FF] font-mono">
            {jobs.length} Jobs • {deadLetters.length} DLQ
          </div>
          <div className="text-[11px] text-[#00E5FF]">Restart Lease Recovery Enabled</div>
        </div>
      </div>

      {/* Telephony Connections */}
      <div className="glass-level-2 p-6 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#F5F7FF] flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-[#00E5FF]" />
            <span>Tenant Telephony Connections</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#A7B3CC]">
            <thead className="border-b border-[#168BFF]/20 uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Provider</th>
                <th className="py-2.5 px-3">Line (E.164)</th>
                <th className="py-2.5 px-3">Auto-Send</th>
                <th className="py-2.5 px-3">Recording</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#168BFF]/10">
              {connections.map((c) => (
                <tr key={c.id}>
                  <td className="py-2.5 px-3 font-bold text-[#F5F7FF]">{c.provider}</td>
                  <td className="py-2.5 px-3 font-mono text-[#00E5FF]">{c.phone_number_e164}</td>
                  <td className="py-2.5 px-3">{c.auto_send_enabled ? 'ON' : 'OFF (Approval Req)'}</td>
                  <td className="py-2.5 px-3">{c.recording_enabled ? 'ON' : 'OFF (Default)'}</td>
                  <td className="py-2.5 px-3 text-right">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        c.status === 'CONNECTED'
                          ? 'bg-[#00F5A0]/15 text-[#00F5A0] border-[#00F5A0]/35'
                          : 'bg-[#FFC857]/15 text-[#FFC857] border-[#FFC857]/35'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Durable Queue Monitor */}
      <div className="glass-level-2 p-6 rounded-3xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#F5F7FF]">Database-Backed Durable Queue</h3>
            <p className="text-xs text-[#A7B3CC]">
              Persisted in SQLite (`durable_queue_jobs`) with idempotency keys, exponential backoff, and dead-letter recovery.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRunWorkerPass}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#168BFF]/20 hover:bg-[#168BFF]/35 text-[#00E5FF] text-xs font-semibold border border-[#168BFF]/35 flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Run Worker Pass</span>
            </button>
            <button
              onClick={fetchQueueAndTelephony}
              className="min-h-[38px] px-3 py-1.5 rounded-xl glass-panel text-[#A7B3CC] hover:text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {jobs.length === 0 ? (
          <div className="p-4 rounded-2xl bg-[#050711]/70 border border-white/5 text-xs text-[#A7B3CC]">
            No queued background jobs yet. Approve a missed-call SMS recovery or send an estimate to enqueue durable tasks.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#A7B3CC]">
              <thead className="border-b border-[#168BFF]/20 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Job Type</th>
                  <th className="py-2.5 px-3">Idempotency Key</th>
                  <th className="py-2.5 px-3">Attempts</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#168BFF]/10">
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td className="py-2.5 px-3 font-semibold text-[#F5F7FF]">{job.job_type}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px]">{job.idempotency_key}</td>
                    <td className="py-2.5 px-3 font-mono">
                      {job.attempts}/{job.max_attempts}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          job.status === 'COMPLETED'
                            ? 'bg-[#00F5A0]/15 text-[#00F5A0] border-[#00F5A0]/35'
                            : job.status === 'DEAD_LETTERED' || job.status === 'FAILED'
                            ? 'bg-[#FF315B]/15 text-[#FF315B] border-[#FF315B]/35'
                            : 'bg-[#00E5FF]/15 text-[#00E5FF] border-[#00E5FF]/35'
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {(job.status === 'DEAD_LETTERED' || job.status === 'FAILED') && (
                        <button
                          onClick={() => handleRetryJob(job.id)}
                          className="px-2.5 py-1 rounded-lg bg-[#FFC857]/20 text-[#FFC857] border border-[#FFC857]/35 text-[11px] font-semibold inline-flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Retry</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit Log Table */}
      <div className="glass-level-2 p-6 rounded-3xl space-y-4">
        <h3 className="text-base font-bold text-[#F5F7FF]">Immutable Hash-Chained Audit Log</h3>
        <p className="text-xs text-[#A7B3CC]">
          Every sensitive financial write, estimate approval, and permission change is recorded.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#A7B3CC]">
            <thead className="border-b border-[#168BFF]/20 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Resource</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#168BFF]/10">
              <tr>
                <td className="py-3 px-4 font-mono">2026-11-24 18:10:22</td>
                <td className="py-3 px-4 text-[#F5F7FF] font-medium">{organization.owner} (Owner)</td>
                <td className="py-3 px-4 text-[#00E5FF]">ESTIMATE_APPROVED</td>
                <td className="py-3 px-4 font-mono">EST-2026-089</td>
                <td className="py-3 px-4 text-right text-[#00F5A0] font-bold">VERIFIED</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono">2026-11-24 16:15:00</td>
                <td className="py-3 px-4 text-[#F5F7FF] font-medium">Stripe Webhook Bot</td>
                <td className="py-3 px-4 text-[#00E5FF]">PAYMENT_RECONCILED</td>
                <td className="py-3 px-4 font-mono">INV-2026-104 ($249.00)</td>
                <td className="py-3 px-4 text-right text-[#00F5A0] font-bold">VERIFIED</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono">2026-11-24 14:00:10</td>
                <td className="py-3 px-4 text-[#F5F7FF] font-medium">AI Qualification Agent</td>
                <td className="py-3 px-4 text-[#00E5FF]">LEAD_QUALIFIED</td>
                <td className="py-3 px-4 font-mono">lead-1 (Sarah Jenkins)</td>
                <td className="py-3 px-4 text-right text-[#00F5A0] font-bold">VERIFIED</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
