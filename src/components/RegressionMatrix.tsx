import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  RotateCcw,
  Download,
  Filter,
  Search,
  Cpu,
  Layers,
  ChevronDown,
  ChevronUp,
  FileText,
  Copy,
  Check,
} from 'lucide-react';
import { MilestoneTest, MilestoneCategory } from '../types';

interface RegressionMatrixProps {
  milestones: MilestoneTest[];
  onRunTest: (testId: string) => void;
  onRunAll: () => void;
  running: boolean;
}

export const RegressionMatrix: React.FC<RegressionMatrixProps> = ({
  milestones,
  onRunTest,
  onRunAll,
  running,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedReport, setCopiedReport] = useState(false);

  const categories: { id: string; label: string }[] = [
    { id: 'ALL', label: 'All Milestones (34)' },
    { id: 'DSP_BASIC', label: 'DSP Basics (M3, M6, M7, M17)' },
    { id: 'DSP_FILTERING', label: 'Filtering & Resampling (M5, M8, M9, M19-M23)' },
    { id: 'DSP_MODULATION', label: 'Modulation & Sync (M24-M27)' },
    { id: 'FINITE_FIELD', label: 'Finite Field & NTT (M10-M15b)' },
    { id: 'PQC_KEM', label: 'ML-KEM FIPS 203 (M32b-e)' },
    { id: 'PQC_DSA', label: 'ML-DSA FIPS 204 (M33a-e)' },
  ];

  const filteredMilestones = milestones.filter((m) => {
    const matchesCat =
      selectedCategory === 'ALL' || m.category === (selectedCategory as MilestoneCategory);
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.citation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const passedCount = milestones.filter((m) => m.status === 'passed').length;
  const failedCount = milestones.filter((m) => m.status === 'failed').length;
  const totalDuration = milestones.reduce((sum, m) => sum + (m.durationMs || 0), 0);

  const generateReport = (): string => {
    const dateStr = new Date().toISOString();
    let text = `# Phoenix SDR-DSP Silicon Regression Report\n`;
    text += `Target: AMD Ryzen AI NPU1 (XDNA1 / AIE2 - 4-Column Array)\n`;
    text += `Host: Windows 11 Pro 25H2\n`;
    text += `Timestamp: ${dateStr}\n`;
    text += `Summary: ${passedCount}/${milestones.length} PASS (${failedCount} Failures) in ${totalDuration.toFixed(1)} ms\n\n`;
    text += `| Milestone | Name | Backend | Tolerance | Status | Time (ms) |\n`;
    text += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
    milestones.forEach((m) => {
      text += `| ${m.number} | ${m.name} | ${m.hardwareBackend} | ${m.tolerance} | ${m.status.toUpperCase()} | ${(m.durationMs || 0).toFixed(1)} |\n`;
    });
    return text;
  };

  const handleCopyReport = () => {
    navigator.clipboard.writeText(generateReport());
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4.5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Regression Status</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-white">
              {passedCount} / {milestones.length}
            </span>
            <span className="text-xs font-semibold text-emerald-400">
              {passedCount === milestones.length ? '100% PASS' : `${Math.round((passedCount / milestones.length) * 100)}%`}
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${(passedCount / milestones.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4.5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Direct Silicon Hardware Gates</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">29 / 34</div>
          <p className="text-xs text-slate-400 mt-2">
            Directly compiled and dispatched to AIE2 vector tiles
          </p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4.5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Host / NPU Composers</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">4 / 34</div>
          <p className="text-xs text-slate-400 mt-2">
            M32e, M33d, M33e-Sign, M33e-Verify dispatching native kernels
          </p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4.5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Total Suite Execution Time</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {totalDuration.toFixed(1)} ms
          </div>
          <p className="text-xs text-slate-400 mt-2">
            1 CPU gold reference (M12) + 33 native accelerated gates
          </p>
        </div>
      </div>

      {/* Action and Filter Bar */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === cat.id
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm shadow-cyan-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search & Export Buttons */}
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search milestone or RFC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg pl-9 pr-3 py-2 w-48 sm:w-60 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <button
            onClick={handleCopyReport}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
            title="Copy Markdown Report"
          >
            {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedReport ? 'Copied!' : 'Export Report'}</span>
          </button>
        </div>
      </div>

      {/* Milestones Grid / List */}
      <div className="grid grid-cols-1 gap-3">
        {filteredMilestones.map((m) => {
          const isExpanded = expandedId === m.id;
          return (
            <div
              key={m.id}
              className={`border rounded-xl transition-all ${
                m.status === 'passed'
                  ? 'bg-slate-900/60 border-slate-800/90 hover:border-slate-700'
                  : m.status === 'failed'
                  ? 'bg-red-950/20 border-red-900/50'
                  : m.status === 'running'
                  ? 'bg-cyan-950/20 border-cyan-500/50 ring-1 ring-cyan-500/20'
                  : 'bg-slate-900/40 border-slate-800/60'
              }`}
            >
              <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Milestone Info */}
                <div className="flex items-start space-x-3.5">
                  <div
                    className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                      m.status === 'passed'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : m.status === 'failed'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                        : m.status === 'running'
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 animate-pulse'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {m.number}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-white tracking-wide">{m.name}</h3>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${
                          m.hardwareBackend.includes('Direct Silicon')
                            ? 'bg-cyan-950 text-cyan-400 border-cyan-800'
                            : m.hardwareBackend.includes('Composer')
                            ? 'bg-purple-950 text-purple-400 border-purple-800'
                            : 'bg-amber-950 text-amber-400 border-amber-800'
                        }`}
                      >
                        {m.hardwareBackend}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Gate: {m.tolerance}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{m.description}</p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5 italic">
                      Ref: {m.citation}
                    </p>
                  </div>
                </div>

                {/* Status & Controls */}
                <div className="flex items-center space-x-3 self-end sm:self-center shrink-0">
                  {m.durationMs !== undefined && (
                    <span className="text-xs font-mono text-slate-400">
                      {m.durationMs.toFixed(1)} ms
                    </span>
                  )}

                  <div className="flex items-center space-x-1.5">
                    {m.status === 'passed' && (
                      <span className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>PASS</span>
                      </span>
                    )}
                    {m.status === 'failed' && (
                      <span className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-semibold">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>FAIL</span>
                      </span>
                    )}
                    {m.status === 'running' && (
                      <span className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-semibold">
                        <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                        <span>RUN</span>
                      </span>
                    )}
                    {m.status === 'idle' && (
                      <span className="px-2 py-1 rounded-md bg-slate-800 text-slate-400 text-xs font-medium">
                        READY
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onRunTest(m.id)}
                    disabled={running}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-600 hover:text-slate-950 text-slate-300 transition-colors"
                    title={`Re-run ${m.number}`}
                  >
                    <Play className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setExpandedId(isExpanded ? null : m.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors"
                    title="View execution logs & metrics"
                  >
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Expandable Execution Details */}
              {isExpanded && (
                <div className="border-t border-slate-800/80 bg-slate-950/60 p-4 space-y-3 text-xs">
                  {m.metrics && Object.keys(m.metrics).length > 0 && (
                    <div>
                      <h4 className="font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-cyan-400" />
                        Validation Metrics & Silicon Gates
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {Object.entries(m.metrics).map(([k, v]) => (
                          <div key={k} className="p-2 rounded bg-slate-900 border border-slate-800">
                            <span className="text-[11px] text-slate-400 block">{k}</span>
                            <span className="font-mono font-medium text-slate-200">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {m.logs && m.logs.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-slate-300 mb-1">Execution Telemetry Log</h4>
                      <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 font-mono text-[11px] text-cyan-300/90 space-y-0.5 max-h-40 overflow-y-auto">
                        {m.logs.map((log, idx) => (
                          <div key={idx}>{log}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
