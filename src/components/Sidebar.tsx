import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  PhoneCall,
  FileText,
  Wrench,
  Receipt,
  Cpu,
  ShieldCheck,
  Settings,
  Users,
  Repeat,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  missedCallsCount: number;
  onNavigate: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  missedCallsCount,
  onNavigate,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'GODS Home', icon: LayoutDashboard },
    { id: 'revenue', label: 'Revenue Engine', icon: TrendingUp, badge: 'V1.2' },
    {
      id: 'missed-calls',
      label: 'Missed Calls',
      icon: PhoneCall,
      badge: missedCallsCount > 0 ? String(missedCallsCount) : undefined,
    },
    { id: 'leads', label: 'AI Lead CRM', icon: Users },
    { id: 'estimates', label: 'Estimates & Portal', icon: FileText },
    { id: 'jobs', label: 'Jobs & Dispatch', icon: Wrench },
    { id: 'maintenance', label: 'Maintenance Plans', icon: Repeat },
    { id: 'invoices', label: 'Invoices & Stripe', icon: Receipt },
    { id: 'ai-command', label: 'AI Neural Core', icon: Cpu, highlight: true },
    { id: 'admin', label: 'Super Admin', icon: ShieldCheck },
    { id: 'settings', label: 'Settings & Config', icon: Settings },
  ];

  return (
    <aside className="w-64 hidden lg:flex flex-col glass-level-1 border-r border-[#168BFF]/25 p-4 shrink-0 min-h-[calc(100vh-65px)]">
      <div className="mb-3 px-2">
        <span className="text-[10px] font-bold tracking-widest text-[#00E5FF] uppercase">
          Enterprise Operating System
        </span>
      </div>

      <nav className="space-y-1.5 flex-1" aria-label="Desktop Navigation">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full min-h-[44px] flex items-center justify-between px-3 py-2.5 rounded-2xl text-sm font-medium transition-all active:scale-[0.98] ${
                isActive
                  ? 'bg-gradient-to-r from-[#168BFF]/35 to-[#8B5CFF]/35 text-[#F5F7FF] border border-[#00E5FF]/45 shadow-[0_0_24px_rgba(22,139,255,0.2)]'
                  : item.highlight
                  ? 'bg-[#8B5CFF]/15 text-[#B34DFF] border border-[#8B5CFF]/30 hover:bg-[#8B5CFF]/25'
                  : 'text-[#A7B3CC] hover:bg-[#168BFF]/10 hover:text-[#F5F7FF] border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-[#00E5FF]' : item.highlight ? 'text-[#B34DFF]' : 'text-[#A7B3CC]'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-[#168BFF]/25 text-[#00E5FF] rounded-full border border-[#168BFF]/35">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-[#168BFF]/20">
        <div className="p-3.5 rounded-2xl glass-level-2 border border-[#168BFF]/30 text-xs">
          <div className="flex items-center space-x-2 text-[#00E5FF] font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#FFC857]" />
            <span>Design System V2.0</span>
          </div>
          <p className="text-[#A7B3CC] text-[11px] leading-relaxed">
            Neon Glassmorphism OS • Lead-to-Cash &amp; Revenue Recovery active.
          </p>
        </div>
      </div>
    </aside>
  );
};
