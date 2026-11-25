import React from 'react';
import { Settings, Building, Phone, Mail, MapPin, CheckCircle, Save } from 'lucide-react';
import { Organization } from '../types';

interface SettingsViewProps {
  organization: Organization;
  onNotify?: (msg: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ organization, onNotify }) => {
  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="glass-panel p-6 rounded-3xl border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Settings className="w-4 h-4" />
            <span>Business Profile & Integrations Config</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Settings & Preferences</h1>
          <p className="text-xs text-slate-400">Configure your contracting business profile, Twilio telephony, Stripe billing, and AI credentials.</p>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-3xl border border-blue-500/30 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <Building className="w-4 h-4 text-cyan-400" />
          <span>Business Profile</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-300 block mb-1">Business Name</label>
            <input
              type="text"
              defaultValue={organization.name}
              className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-blue-500/30 text-white text-xs focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-slate-300 block mb-1">Industry</label>
            <input
              type="text"
              defaultValue={organization.industry}
              className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-blue-500/30 text-white text-xs focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-slate-300 block mb-1">Owner / Primary Contact</label>
            <input
              type="text"
              defaultValue={organization.owner}
              className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-blue-500/30 text-white text-xs focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-slate-300 block mb-1">Business Phone</label>
            <input
              type="text"
              defaultValue={organization.phone}
              className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-blue-500/30 text-white text-xs focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-3 flex justify-end">
          <button
            onClick={() => onNotify?.("Business settings saved successfully.")}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs font-semibold shadow-lg shadow-blue-500/30 flex items-center space-x-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-3xl border border-blue-500/30 space-y-4">
        <h3 className="text-base font-bold text-white">External Integrations Status</h3>

        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/20 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">S</div>
              <div>
                <h4 className="text-xs font-bold text-white">Stripe Payment Gateway</h4>
                <p className="text-[11px] text-slate-400">Webhook signature verification and secure checkout</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full">
              Connected
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/20 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">T</div>
              <div>
                <h4 className="text-xs font-bold text-white">Twilio Voice & SMS Telephony</h4>
                <p className="text-[11px] text-slate-400">Missed-call recovery and automated follow-ups</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full">
              Connected
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/20 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center font-bold">G</div>
              <div>
                <h4 className="text-xs font-bold text-white">Google Gemini AI Neural Engine</h4>
                <p className="text-[11px] text-slate-400">Lead qualification and conversational command center</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full">
              Connected
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
