import React from 'react';
import { Cpu, Bell, Settings, Wifi } from 'lucide-react';
import { Organization } from '../types';
import { NeuralCoreState } from './NeuralCore';

interface HeaderProps {
  organization: Organization;
  activeTab: string;
  neuralState: NeuralCoreState;
  onNavigate: (tab: string) => void;
  onNotify?: (msg: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  organization,
  activeTab,
  neuralState,
  onNavigate,
  onNotify,
}) => {
  const statusColor =
    neuralState === 'ERROR'
      ? 'text-[#FF315B] border-[#FF315B]/35 bg-[#FF315B]/15'
      : neuralState === 'WARNING'
      ? 'text-[#FFC857] border-[#FFC857]/35 bg-[#FFC857]/15'
      : 'text-[#00F5A0] border-[#00F5A0]/30 bg-[#00F5A0]/10';

  return (
    <header className="glass-level-1 sticky top-0 z-40 border-b border-[#168BFF]/25 px-3 sm:px-5 py-2.5 flex items-center justify-between gap-2">
      <button
        onClick={() => onNavigate('dashboard')}
        className="flex items-center space-x-2.5 sm:space-x-3 text-left min-w-0 min-h-[44px]"
      >
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#168BFF] to-[#8B5CFF] shadow-lg shadow-[#168BFF]/30 neon-border-blue shrink-0">
          <Cpu className="w-5 h-5 text-[#00E5FF]" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-sm sm:text-lg tracking-wider bg-gradient-to-r from-[#168BFF] via-[#00E5FF] to-[#8B5CFF] bg-clip-text text-transparent truncate">
              GODS COMMAND AI
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold bg-[#168BFF]/20 text-[#00E5FF] rounded-full border border-[#168BFF]/35 shrink-0">
              OS V2.0
            </span>
          </div>
          <p className="text-[11px] text-[#A7B3CC] flex items-center space-x-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00F5A0] inline-block shrink-0" />
            <span className="font-medium text-[#F5F7FF] truncate">{organization.name}</span>
          </p>
        </div>
      </button>

      <div className="flex items-center space-x-2 shrink-0">
        <div
          className={`hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${statusColor}`}
        >
          <Wifi className="w-3.5 h-3.5" />
          <span>{neuralState === 'IDLE' ? 'System Nominal' : neuralState}</span>
        </div>

        <button
          onClick={() => onNavigate('ai-command')}
          className={`hidden sm:flex min-h-[44px] px-3.5 py-2 rounded-xl text-white text-xs font-semibold shadow-lg transition-all items-center space-x-1.5 active:scale-95 ${
            activeTab === 'ai-command'
              ? 'bg-gradient-to-r from-[#8B5CFF] to-[#B34DFF] shadow-[#8B5CFF]/35 border border-[#00E5FF]/40'
              : 'bg-gradient-to-r from-[#168BFF]/80 to-[#8B5CFF]/80 hover:from-[#168BFF] hover:to-[#8B5CFF] shadow-[#168BFF]/20'
          }`}
        >
          <Cpu className="w-4 h-4 text-[#00E5FF]" />
          <span>AI Core</span>
        </button>

        <button
          onClick={() =>
            onNotify?.('No unread alerts. All Lead-to-Cash & Revenue Recovery systems nominal.')
          }
          aria-label="Notifications"
          className="min-w-[44px] min-h-[44px] p-2 rounded-xl glass-panel hover:border-[#00E5FF]/45 text-[#A7B3CC] hover:text-[#00E5FF] transition-all relative flex items-center justify-center active:scale-95"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#00E5FF] rounded-full" />
        </button>

        <button
          onClick={() => onNavigate('settings')}
          aria-label="Settings"
          className={`min-w-[44px] min-h-[44px] p-2 rounded-xl glass-panel transition-all flex items-center justify-center active:scale-95 ${
            activeTab === 'settings'
              ? 'border-[#00E5FF]/60 text-[#00E5FF]'
              : 'text-[#A7B3CC] hover:border-[#00E5FF]/45 hover:text-[#00E5FF]'
          }`}
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
