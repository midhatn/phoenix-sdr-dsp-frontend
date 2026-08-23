import React from 'react';
import { Cpu, Zap, ShieldCheck, Activity, Terminal, ExternalLink } from 'lucide-react';
import { SiliconRunStats } from '../types';

interface HeaderProps {
  stats: SiliconRunStats;
  onRunAll: () => void;
}

export const Header: React.FC<HeaderProps> = ({ stats, onRunAll }) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Brand & Target Info */}
          <div className="flex items-center space-x-3.5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/30">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  Phoenix SDR-DSP
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                    v1.0.0
                  </span>
                </h1>
                <span className="hidden sm:inline-block text-slate-500">•</span>
                <span className="hidden sm:inline-block text-xs text-slate-400 font-mono">
                  AMD Ryzen AI NPU1 (XDNA1 / AIE2)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                SDR/DSP, Finite-Field & Post-Quantum Cryptography (FIPS 203 + 204) Silicon Suite
              </p>
            </div>
          </div>

          {/* Quick Hardware Badges & Master Run Action */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
              <Activity className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>I/Q: <strong className="text-white font-mono">7.46 Msps</strong></span>
              <span className="text-slate-600">|</span>
              <span>BW: <strong className="text-cyan-400 font-mono">59.7 MB/s</strong></span>
            </div>

            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-300">Matrix:</span>
              <span className="font-mono font-semibold text-emerald-400">
                {stats.passed}/{stats.total} PASS
              </span>
            </div>

            <button
              onClick={onRunAll}
              disabled={stats.running}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all shadow-md ${
                stats.running
                  ? 'bg-cyan-950 text-cyan-400 border border-cyan-800 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold shadow-cyan-500/25 active:scale-95'
              }`}
            >
              {stats.running ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <span>DISPATCHING SILICON...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>RUN ALL 34 SILICON TESTS</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
