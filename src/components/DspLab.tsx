import React, { useState, useMemo } from 'react';
import { Sliders, Activity, Layers, Zap, Cpu } from 'lucide-react';
import { designKaiserLpf, KAISER_16_TAPS } from '../dsp/fir';
import { computeSpectrum } from '../dsp/complex';
import { Complex } from '../types';

export const DspLab: React.FC = () => {
  const [numTaps, setNumTaps] = useState<number>(16);
  const [cutoffNorm, setCutoffNorm] = useState<number>(0.25);
  const [windowBeta, setWindowBeta] = useState<number>(5.653);
  const [polyphaseBranches, setPolyphaseBranches] = useState<number>(4);

  // Design FIR Filter coefficients
  const filterTaps = useMemo(() => {
    return Array.from(designKaiserLpf(numTaps, cutoffNorm, windowBeta));
  }, [numTaps, cutoffNorm, windowBeta]);

  // Compute Frequency Response |H(f)| using FFT
  const freqResponse = useMemo(() => {
    const fftLen = 256;
    const impulseInput: Complex[] = new Array(fftLen);
    for (let i = 0; i < fftLen; i++) {
      impulseInput[i] = {
        re: i < filterTaps.length ? filterTaps[i] : 0,
        im: 0,
      };
    }
    const spectrum = computeSpectrum(impulseInput, 1000000, fftLen, 'rectangular');
    return spectrum.slice(fftLen / 2); // Positive frequencies 0 .. fs/2
  }, [filterTaps]);

  // Polyphase decomposed sub-filters
  const subFilters = useMemo(() => {
    const branches: number[][] = Array.from({ length: polyphaseBranches }, () => []);
    filterTaps.forEach((h, idx) => {
      branches[idx % polyphaseBranches].push(h);
    });
    return branches;
  }, [filterTaps, polyphaseBranches]);

  return (
    <div className="space-y-6">
      {/* Designer Config */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-cyan-400" />
              DSP Filter & Polyphase Channelizer Laboratory (M5, M8, M9, M22)
            </h2>
            <p className="text-xs text-slate-400">
              Interactive Kaiser FIR filter synthesis, magnitude response |H(f)|, and AIE2 vector polyphase decomposition
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-mono">Taps (N):</span>
            {[8, 16, 32, 64].map((n) => (
              <button
                key={n}
                onClick={() => setNumTaps(n)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                  numTaps === n
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                N={n}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1.5">
              <span>Normalized Cutoff (fc / fs)</span>
              <span className="font-mono text-cyan-400 font-bold">{cutoffNorm.toFixed(2)} fs</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.45"
              step="0.01"
              value={cutoffNorm}
              onChange={(e) => setCutoffNorm(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>0.05 (Narrowband)</span>
              <span>0.45 (Wideband)</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1.5">
              <span>Kaiser Beta Parameter (β)</span>
              <span className="font-mono text-cyan-400 font-bold">{windowBeta.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="10.0"
              step="0.1"
              value={windowBeta}
              onChange={(e) => setWindowBeta(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>β=1.0 (Low Stopband)</span>
              <span>β=8.0 (High Atten)</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1.5">
              <span>Polyphase Branches (M)</span>
              <span className="font-mono text-cyan-400 font-bold">M = {polyphaseBranches}</span>
            </div>
            <div className="flex space-x-2">
              {[2, 4, 8].map((m) => (
                <button
                  key={m}
                  onClick={() => setPolyphaseBranches(m)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold ${
                    polyphaseBranches === m
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  M={m}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Plots: Frequency Response + Impulse Response */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Magnitude Response Plot */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Magnitude Frequency Response $|H(f)|$
            </h3>
            <span className="text-xs text-slate-400 font-mono">0 dB down to -80 dB</span>
          </div>

          <div className="h-56 w-full bg-slate-950 rounded-lg p-2 relative overflow-hidden border border-slate-800">
            {[-10, -30, -50, -70].map((db) => {
              const yPercent = ((-db) / 80) * 100;
              return (
                <div
                  key={db}
                  className="absolute inset-x-0 border-t border-slate-800/80 flex items-center justify-end pr-2 text-[10px] text-slate-600 font-mono"
                  style={{ top: `${yPercent}%` }}
                >
                  {db} dB
                </div>
              );
            })}

            <svg className="w-full h-full" viewBox={`0 0 ${freqResponse.length} 100`} preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="#22d3ee"
                strokeWidth="2"
                points={freqResponse
                  .map((b, idx) => {
                    const dbClamped = Math.max(-80, Math.min(0, b.powerDb));
                    const y = ((-dbClamped) / 80) * 95 + 2;
                    return `${idx},${y}`;
                  })
                  .join(' ')}
              />
            </svg>
          </div>

          <div className="flex justify-between text-[11px] text-slate-500 font-mono mt-2">
            <span>0 Hz (DC)</span>
            <span>0.25 fs</span>
            <span>0.5 fs (Nyquist)</span>
          </div>
        </div>

        {/* Impulse Response Taps $h[n]$ */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              Impulse Response $h[n]$ ({numTaps} Taps)
            </h3>
            <span className="text-xs text-slate-400 font-mono">Symmetric Sinc</span>
          </div>

          <div className="h-56 w-full bg-slate-950 rounded-lg p-2 relative overflow-hidden border border-slate-800">
            <div className="absolute inset-x-0 top-1/2 border-t border-slate-800 border-dashed" />

            <svg className="w-full h-full" viewBox={`0 0 ${filterTaps.length} 100`} preserveAspectRatio="none">
              {filterTaps.map((h, idx) => {
                const yVal = 50 - h * 70;
                return (
                  <g key={idx}>
                    <line
                      x1={idx + 0.5}
                      y1={50}
                      x2={idx + 0.5}
                      y2={yVal}
                      stroke="#c084fc"
                      strokeWidth="0.8"
                    />
                    <circle cx={idx + 0.5} cy={yVal} r="0.6" fill="#c084fc" />
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex justify-between text-[11px] text-slate-500 font-mono mt-2">
            <span>n = 0</span>
            <span>n = {Math.floor(numTaps / 2)}</span>
            <span>n = {numTaps - 1}</span>
          </div>
        </div>
      </div>

      {/* Polyphase Decomposition Visualizer */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
          <Cpu className="w-4 h-4 text-cyan-400" />
          AIE2 Polyphase Decomposition Matrix (M = {polyphaseBranches} Branches)
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Each polyphase sub-filter E_k(z) is mapped to an independent vector SIMD lane on the Ryzen AI NPU:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {subFilters.map((branch, idx) => (
            <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold font-mono text-cyan-400">
                  Branch E{idx}(z)
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {branch.length} Taps
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-300 space-y-0.5">
                {branch.slice(0, 4).map((tap, tIdx) => (
                  <div key={tIdx} className="flex justify-between">
                    <span className="text-slate-500">e[{tIdx}]:</span>
                    <span className="text-cyan-300">{tap.toFixed(4)}</span>
                  </div>
                ))}
                {branch.length > 4 && (
                  <div className="text-slate-600 text-center">...</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
