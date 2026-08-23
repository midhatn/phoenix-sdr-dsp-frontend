import React from 'react';
import {
  CheckCircle2,
  Radio,
  Grid,
  Activity,
  Shield,
  Sliders,
  Cpu,
} from 'lucide-react';

export type TabId = 'matrix' | 'pipeline' | 'constellation' | 'spectrum' | 'pqc' | 'dsplab' | 'arch';

interface NavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  passedCount: number;
  totalCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  passedCount,
  totalCount,
}) => {
  const tabs = [
    {
      id: 'matrix' as TabId,
      label: 'Silicon Regression Matrix',
      icon: CheckCircle2,
      badge: `${passedCount}/${totalCount}`,
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    {
      id: 'pipeline' as TabId,
      label: 'Live SDR Pipeline',
      icon: Radio,
    },
    {
      id: 'constellation' as TabId,
      label: 'Constellation & Demod',
      icon: Grid,
    },
    {
      id: 'spectrum' as TabId,
      label: 'Spectrum & Waterfall',
      icon: Activity,
    },
    {
      id: 'pqc' as TabId,
      label: 'PQC Studio (FIPS 203 & 204)',
      icon: Shield,
      badge: 'Quantum-Safe',
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    },
    {
      id: 'dsplab' as TabId,
      label: 'DSP Filter & Channelizer Lab',
      icon: Sliders,
    },
    {
      id: 'arch' as TabId,
      label: 'NPU Architecture & Specs',
      icon: Cpu,
    },
  ];

  return (
    <nav className="border-b border-slate-800 bg-slate-900/40 backdrop-blur-sm sticky top-[65px] z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 overflow-x-auto py-2 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-semibold border ${
                      tab.badgeColor || 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
