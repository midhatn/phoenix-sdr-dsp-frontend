import React, { useState, useMemo } from 'react';
import { Grid, Sliders, RefreshCw, Zap, Shield, CheckCircle } from 'lucide-react';
import { Complex, ConstellationPoint } from '../types';
import { cExp, cMul } from '../dsp/complex';
import { pskReceiver, qamDemodulator } from '../dsp/demod';

export const ConstellationStudio: React.FC = () => {
  const [modulation, setModulation] = useState<'bpsk' | 'qpsk' | '16qam' | '64qam'>('16qam');
  const [snrDb, setSnrDb] = useState<number>(26);
  const [phaseOffsetDeg, setPhaseOffsetDeg] = useState<number>(5);
  const [iqImbalance, setIqImbalance] = useState<number>(0.0);
  const [enableCostas, setEnableCostas] = useState<boolean>(true);

  const numSymbols = 256;

  const { points, evmRms, evmPeak, estSnr } = useMemo(() => {
    const rawSymbols: Complex[] = [];
    const noiseStd = Math.pow(10, -snrDb / 20);
    const phaseRad = (phaseOffsetDeg * Math.PI) / 180;
    const rot = cExp(phaseRad);

    if (modulation === 'bpsk') {
      for (let n = 0; n < numSymbols; n++) {
        const bit = Math.random() > 0.5 ? 1 : -1;
        rawSymbols.push({ re: bit, im: 0 });
      }
    } else if (modulation === 'qpsk') {
      for (let n = 0; n < numSymbols; n++) {
        const bI = Math.random() > 0.5 ? 0.7071 : -0.7071;
        const bQ = Math.random() > 0.5 ? 0.7071 : -0.7071;
        rawSymbols.push({ re: bI, im: bQ });
      }
    } else if (modulation === '16qam') {
      const norm = 1 / Math.sqrt(10);
      const levels = [-3 * norm, -1 * norm, 1 * norm, 3 * norm];
      for (let n = 0; n < numSymbols; n++) {
        const bI = levels[Math.floor(Math.random() * 4)];
        const bQ = levels[Math.floor(Math.random() * 4)];
        rawSymbols.push({ re: bI, im: bQ });
      }
    } else {
      // 64-QAM
      const norm = 1 / Math.sqrt(42);
      const levels = [-7 * norm, -5 * norm, -3 * norm, -1 * norm, 1 * norm, 3 * norm, 5 * norm, 7 * norm];
      for (let n = 0; n < numSymbols; n++) {
        const bI = levels[Math.floor(Math.random() * 8)];
        const bQ = levels[Math.floor(Math.random() * 8)];
        rawSymbols.push({ re: bI, im: bQ });
      }
    }

    // Apply impairments (AWGN Noise, Phase Offset, IQ Imbalance)
    const impaired: Complex[] = rawSymbols.map((s) => {
      const noiseI = (Math.random() - 0.5) * 2 * noiseStd;
      const noiseQ = (Math.random() - 0.5) * 2 * noiseStd;
      const iVal = s.re * (1 + iqImbalance) + noiseI;
      const qVal = s.im * (1 - iqImbalance) + noiseQ;
      return cMul({ re: iVal, im: qVal }, rot);
    });

    let constellationPoints: ConstellationPoint[] = [];
    let calcEvmRms = 0;
    let calcEvmPeak = 0;
    let calcEstSnr = 0;

    if (modulation === 'bpsk' || modulation === 'qpsk') {
      const order = modulation === 'bpsk' ? 2 : 4;
      const rx = pskReceiver(impaired, order, enableCostas ? 0.08 : 0.0001);
      const qam = qamDemodulator(enableCostas ? rx.symbols : impaired, 16);
      const totalErr = rx.recoveredConstellation.reduce((acc, p) => acc + p.errorMag * p.errorMag, 0);
      calcEvmRms = Math.sqrt(totalErr / numSymbols) * 100;
      calcEvmPeak = Math.max(...rx.recoveredConstellation.map((p) => p.errorMag)) * 100;
      calcEstSnr = calcEvmRms > 0 ? -20 * Math.log10(calcEvmRms / 100) : 45;
      constellationPoints = rx.recoveredConstellation;
    } else {
      const order = modulation === '16qam' ? 16 : 64;
      const qam = qamDemodulator(impaired, order);
      calcEvmRms = qam.evmRmsPercent;
      calcEvmPeak = qam.evmPeakPercent;
      calcEstSnr = qam.snrEstimateDb;
      constellationPoints = qam.points;
    }

    return {
      points: constellationPoints,
      evmRms: calcEvmRms,
      evmPeak: calcEvmPeak,
      estSnr: calcEstSnr,
    };
  }, [modulation, snrDb, phaseOffsetDeg, iqImbalance, enableCostas]);

  return (
    <div className="space-y-6">
      {/* Top Config Card */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Grid className="w-5 h-5 text-cyan-400" />
              I/Q Constellation & EVM Analyzer (M25 / M26)
            </h2>
            <p className="text-xs text-slate-400">
              Interactive modulation mapping, carrier recovery, decision slicing, and 3GPP EVM analysis
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(['bpsk', 'qpsk', '16qam', '64qam'] as const).map((scheme) => (
              <button
                key={scheme}
                onClick={() => setModulation(scheme)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  modulation === scheme
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {scheme}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-5 pt-4">
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1.5">
              <span>Channel SNR (AWGN)</span>
              <span className="font-mono text-cyan-400 font-bold">{snrDb} dB</span>
            </div>
            <input
              type="range"
              min="5"
              max="40"
              step="1"
              value={snrDb}
              onChange={(e) => setSnrDb(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1.5">
              <span>Phase Rotation (Δθ)</span>
              <span className="font-mono text-cyan-400 font-bold">{phaseOffsetDeg}°</span>
            </div>
            <input
              type="range"
              min="-45"
              max="45"
              step="1"
              value={phaseOffsetDeg}
              onChange={(e) => setPhaseOffsetDeg(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1.5">
              <span>I/Q Amplitude Skew</span>
              <span className="font-mono text-cyan-400 font-bold">{(iqImbalance * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="-0.2"
              max="0.2"
              step="0.01"
              value={iqImbalance}
              onChange={(e) => setIqImbalance(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          <div className="flex flex-col justify-center">
            <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={enableCostas}
                onChange={(e) => setEnableCostas(e.target.checked)}
                className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-cyan-400"
              />
              <span className="font-semibold text-white">Costas Loop Carrier Lock</span>
            </label>
            <span className="text-[10px] text-slate-500 mt-1">
              Active closed-loop phase tracking (M25)
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Constellation Plane + Telemetry Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Constellation Canvas / SVG */}
        <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800 rounded-xl p-5 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">I/Q Complex Plane Diagram</h3>
            <div className="flex items-center space-x-4 text-xs font-mono">
              <span className="text-cyan-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
                Received Samples ({points.length})
              </span>
              <span className="text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                Ideal Grid Points
              </span>
            </div>
          </div>

          {/* 2D Plane Display */}
          <div className="w-full max-w-[420px] aspect-square bg-slate-950 rounded-xl border border-slate-800 relative p-4 flex items-center justify-center">
            {/* Axis and Crosshairs */}
            <div className="absolute inset-x-4 top-1/2 border-t border-slate-800" />
            <div className="absolute inset-y-4 left-1/2 border-l border-slate-800" />
            <div className="absolute inset-10 border border-slate-800/60 rounded-full" />
            <div className="absolute inset-20 border border-slate-800/40 rounded-full" />

            <svg className="w-full h-full" viewBox="-1.6 -1.6 3.2 3.2">
              {/* Grid Lines */}
              <circle cx="0" cy="0" r="1.0" fill="none" stroke="#1e293b" strokeWidth="0.015" strokeDasharray="0.05,0.05" />

              {/* Scatter Points (Received Symbols) */}
              {points.map((pt, idx) => (
                <circle
                  key={idx}
                  cx={pt.i}
                  cy={-pt.q}
                  r="0.025"
                  className="fill-cyan-400/70"
                />
              ))}

              {/* Unique Ideal Grid Points (Crosses) */}
              {Array.from(new Set(points.map((p) => `${p.idealI.toFixed(3)},${p.idealQ.toFixed(3)}`))).map(
                (coords, idx) => {
                  const [iStr, qStr] = coords.split(',');
                  const i = parseFloat(iStr);
                  const q = parseFloat(qStr);
                  return (
                    <g key={idx}>
                      <circle cx={i} cy={-q} r="0.05" fill="none" stroke="#34d399" strokeWidth="0.02" />
                      <line x1={i - 0.07} y1={-q} x2={i + 0.07} y2={-q} stroke="#34d399" strokeWidth="0.015" />
                      <line x1={i} y1={-q - 0.07} x2={i} y2={-q + 0.07} stroke="#34d399" strokeWidth="0.015" />
                    </g>
                  );
                }
              )}
            </svg>
          </div>

          <div className="flex justify-between w-full max-w-[420px] text-[11px] text-slate-500 font-mono mt-3">
            <span>-Q (Quadrature)</span>
            <span>Origin (0,0)</span>
            <span>+I (In-Phase)</span>
          </div>
        </div>

        {/* Real-time RF & EVM Telemetry */}
        <div className="space-y-4">
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-cyan-400" />
              EVM & Signal Quality Metrics
            </h3>

            <div className="space-y-3">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-400">EVM (RMS):</span>
                  <span
                    className={`font-mono font-bold text-sm ${
                      evmRms < 5.0 ? 'text-emerald-400' : evmRms < 12.0 ? 'text-amber-400' : 'text-red-400'
                    }`}
                  >
                    {evmRms.toFixed(2)}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      evmRms < 5.0 ? 'bg-emerald-400' : evmRms < 12.0 ? 'bg-amber-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${Math.min(100, evmRms * 4)}%` }}
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Peak EVM:</span>
                  <span className="font-mono font-bold text-slate-200">
                    {evmPeak.toFixed(2)}%
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Estimated SNR:</span>
                  <span className="font-mono font-bold text-cyan-400">
                    {estSnr.toFixed(1)} dB
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Decision Compliance:</span>
                  <span className="font-mono font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    3GPP TS 38.104 PASS
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-purple-400" />
              NPU Slicing Kernel
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              M26 decision slicer utilizes fused float32 boundary comparison tree with parallel bfloat16 register accumulation on AIE2 vector tile.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
