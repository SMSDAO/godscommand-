import React, { useState } from 'react';
import { Users, Phone, Mail, MapPin, Plus, Sparkles, CheckCircle, ArrowUpRight } from 'lucide-react';
import { Lead } from '../types';

interface LeadsViewProps {
  leads: Lead[];
  onAddLead: (leadData: any) => void;
  onNavigate: (tab: string) => void;
}

export const LeadsView: React.FC<LeadsViewProps> = ({ leads, onAddLead, onNavigate }) => {
  const [showNewModal, setShowNewModal] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phone: '',
    serviceAddress: '',
    category: 'HVAC Repair',
    urgency: 'NORMAL',
    problemDescription: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddLead(formData);
    setShowNewModal(false);
    setFormData({
      customerName: '',
      email: '',
      phone: '',
      serviceAddress: '',
      category: 'HVAC Repair',
      urgency: 'NORMAL',
      problemDescription: ''
    });
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="glass-panel p-6 rounded-3xl border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Customer Relationship & Lead Management</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">AI Lead Qualification Pipeline</h1>
          <p className="text-xs text-slate-400">Incoming inquiries are instantly analyzed, classified, and scored by AI.</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:opacity-90 text-white text-xs font-semibold shadow-lg shadow-blue-500/30 flex items-center space-x-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Customer Inquiry</span>
        </button>
      </div>

      {/* Leads Grid */}
      <div className="grid grid-cols-1 gap-4">
        {leads.map((lead) => (
          <div key={lead.id} className="glass-panel p-5 rounded-3xl border border-blue-500/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-cyan-300 font-bold">
                  {lead.customerName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-white">{lead.customerName}</h3>
                    <span className="px-2 py-0.5 text-[10px] bg-blue-500/20 text-cyan-300 rounded font-bold border border-blue-400/30">
                      {lead.category}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-slate-400 mt-0.5">
                    <span className="flex items-center space-x-1"><Phone className="w-3 h-3 text-cyan-400" /><span>{lead.phone}</span></span>
                    <span className="flex items-center space-x-1"><Mail className="w-3 h-3 text-violet-400" /><span>{lead.email}</span></span>
                    <span className="hidden md:flex items-center space-x-1"><MapPin className="w-3 h-3 text-emerald-400" /><span>{lead.serviceAddress}</span></span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                  lead.urgency === 'HIGH' || lead.urgency === 'EMERGENCY'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}>
                  {lead.urgency} URGENCY
                </span>
                <span className="px-3 py-1 text-xs font-bold bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                  {lead.status}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
              <strong className="text-white block mb-1">Customer Problem Description:</strong>
              "{lead.problemDescription}"
            </div>

            {/* AI Qualification Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/50 to-violet-950/50 border border-blue-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-cyan-300 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  <span>AI Lead Qualification (Confidence: {(lead.aiQualification.confidence * 100).toFixed(0)}%)</span>
                </div>
                <p className="text-xs text-slate-300">{lead.aiQualification.summary}</p>
                <p className="text-[11px] text-cyan-400 italic">Recommended: "{lead.aiQualification.recommendedAction}"</p>
              </div>
              <button
                onClick={() => onNavigate('estimates')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 shrink-0 hover:opacity-90 flex items-center space-x-1.5"
              >
                <span>Create Proposal</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* New Lead Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg p-6 rounded-3xl border border-blue-500/40 space-y-4">
            <h3 className="text-lg font-bold text-white">Capture New Customer Inquiry</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-blue-500/30 text-white text-xs focus:outline-none focus:border-cyan-400"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-blue-500/30 text-white text-xs focus:outline-none"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-blue-500/30 text-white text-xs focus:outline-none"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-1">Service Address</label>
                <input
                  type="text"
                  required
                  value={formData.serviceAddress}
                  onChange={(e) => setFormData({ ...formData, serviceAddress: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-blue-500/30 text-white text-xs focus:outline-none"
                  placeholder="123 Main St, City, ST"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Service Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-blue-500/30 text-white text-xs focus:outline-none"
                  >
                    <option value="HVAC Repair">HVAC Repair</option>
                    <option value="Plumbing Service">Plumbing Service</option>
                    <option value="Electrical Repair">Electrical Repair</option>
                    <option value="Commercial Maintenance">Commercial Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Urgency</label>
                  <select
                    value={formData.urgency}
                    onChange={(e) => setFormData({ ...formData, urgency: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-blue-500/30 text-white text-xs focus:outline-none"
                  >
                    <option value="LOW">LOW</option>
                    <option value="NORMAL">NORMAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="EMERGENCY">EMERGENCY</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-1">Problem Description</label>
                <textarea
                  rows={3}
                  required
                  value={formData.problemDescription}
                  onChange={(e) => setFormData({ ...formData, problemDescription: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-blue-500/30 text-white text-xs focus:outline-none"
                  placeholder="Describe the issue in detail..."
                />
              </div>
              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs font-semibold shadow-lg shadow-blue-500/30 hover:opacity-90"
                >
                  Save & Qualify with AI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
