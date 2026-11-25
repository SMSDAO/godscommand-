import React, { useState } from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Wrench,
  Cpu,
  Grid,
  FileText,
  PhoneCall,
  Repeat,
  Receipt,
  ShieldCheck,
  Settings,
  X,
} from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  drawerOpen: boolean;
  onToggleDrawer: (open: boolean) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  onNavigate,
  drawerOpen,
  onToggleDrawer,
}) => {
  const primaryTabs = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'revenue', label: 'Revenue', icon: TrendingUp },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'jobs', label: 'Jobs', icon: Wrench },
    { id: 'ai-command', label: 'AI', icon: Cpu },
  ];

  const secondaryModules = [
    { id: 'estimates', label: 'Estimates & Proposals', icon: FileText, color: 'text-[#8B5CFF]' },
    { id: 'missed-calls', label: 'Missed-Call Recovery', icon: PhoneCall, color: 'text-[#00E5FF]' },
    { id: 'maintenance', label: 'Maintenance Plans', icon: Repeat, color: 'text-[#168BFF]' },
    { id: 'invoices', label: 'Invoices & Stripe', icon: Receipt, color: 'text-[#00F5A0]' },
    { id: 'admin', label: 'Super Admin Console', icon: ShieldCheck, color: 'text-[#FF315B]' },
    { id: 'settings', label: 'Settings & Config', icon: Settings, color: 'text-[#FFC857]' },
  ];

  const handleSelectSecondary = (id: string) => {
    onNavigate(id);
    onToggleDrawer(false);
  };

  return (
    <>
      {/* Glassmorphism Bottom Sheet for Secondary Modules */}
      {drawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex items-end bg-black/75 backdrop-blur-sm"
          onClick={() => onToggleDrawer(false)}
        >
          <div
            className="w-full glass-level-3 rounded-t-3xl border-t border-[#00E5FF]/35 p-5 pb-safe space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#00E5FF]">
                  GODS COMMAND OS
                </span>
                <h3 className="text-base font-extrabold text-[#F5F7FF]">All Operational Modules</h3>
              </div>
              <button
                onClick={() => onToggleDrawer(false)}
                aria-label="Close modules menu"
                className="min-w-[44px] min-h-[44px] rounded-xl glass-panel flex items-center justify-center text-[#A7B3CC] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pb-4">
              {secondaryModules.map((mod) => {
                const Icon = mod.icon;
                const isSelected = activeTab === mod.id;
                return (
                  <button
                    key={mod.id}
                    onClick={() => handleSelectSecondary(mod.id)}
                    className={`min-h-[56px] p-3.5 rounded-2xl text-left flex items-center gap-3 transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#168BFF]/35 to-[#8B5CFF]/35 border border-[#00E5FF]/50 text-white'
                        : 'glass-panel text-[#F5F7FF] hover:border-[#168BFF]/40'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#050711] border border-white/10 flex items-center justify-center shrink-0">
                      <Icon className={`w-4 h-4 ${mod.color}`} />
                    </div>
                    <span className="text-xs font-bold leading-tight">{mod.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Primary Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Primary Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass-level-1 border-t border-[#168BFF]/30 px-2 pt-1.5 pb-safe flex items-center justify-around"
      >
        {primaryTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`min-w-[52px] min-h-[46px] flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all active:scale-95 relative ${
                isActive
                  ? 'text-[#00E5FF] bg-[#168BFF]/25 border border-[#00E5FF]/40 shadow-[0_0_20px_rgba(0,229,255,0.2)]'
                  : 'text-[#A7B3CC] hover:text-white border border-transparent'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-semibold">{tab.label}</span>
            </button>
          );
        })}

        <button
          onClick={() => onToggleDrawer(true)}
          aria-label="Open all modules"
          className={`min-w-[52px] min-h-[46px] flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all active:scale-95 ${
            ['estimates', 'missed-calls', 'maintenance', 'invoices', 'admin', 'settings'].includes(activeTab)
              ? 'text-[#B34DFF] bg-[#8B5CFF]/25 border border-[#8B5CFF]/40'
              : 'text-[#A7B3CC] hover:text-white border border-transparent'
          }`}
        >
          <Grid className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-semibold">More</span>
        </button>
      </nav>
    </>
  );
};
