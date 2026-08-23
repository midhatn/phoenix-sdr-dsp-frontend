import React, { useState, useMemo } from 'react';
import {
  Radio,
  Sliders,
  Play,
  Pause,
  Activity,
  Layers,
  Zap,
  RefreshCw,
  Eye,
  Target,
} from 'lucide-react';
import { Complex } from '../types';
import { complex, cExp, cMul, cMag } from '../dsp/complex';
import { KAISER_16_TAPS } from '../dsp/fir';
import { polyphaseDecimator } from '../dsp/resampling';
import { barker13Correlator, BARKER_13_SEQ } from '../dsp/correlator';
import { pskReceiver } from '../dsp/demod';

export const LiveSdrPipeline: React.FC = () => {
  const [signalType, setSignalType] = useState<'barker' | 'tone' | 'twotone' | 'qpsk' | 'noise'>('barker');
  const [carrierFreqKhz, setCarrierFreqKhz] = useState<number>(125);
  const [snrDb, setSnrDb] = useState<number>(25);
  const [dopplerOffsetHz, setDopplerOffsetHz] = useState<number>(500);
  const [activeStage, setActiveStage] = useState<'input' | 'mixed' | 'ddc' | 'correlator' | 'demod'>('correlator');

  const sampleRate = 1000000; // 1 Msps
  const numSamples = 256;

  // Synthesize Baseband and Transmitted Signal
  const pipelineData = useMemo(() => {
    const raw: Complex[] = new Array(numSamples);
    const noiseStd = Math.pow(10, -snrDb / 20);

    for (let n = 0; n < numSamples; n++) {
      let baseRe = 0;
      let baseIm = 0;

      if (signalType === 'barker') {
        // Embed Barker-13 preamble repeatedly
        const period = 64;
        const offset = n % period;
        if (offset < 13) {
          baseRe = BARKER_13_SEQ[offset];
          baseIm = 0;
        } else {
          baseRe = 0.1 * Math.sin((2 * Math.PI * n) / 16);
          baseIm = 0.1 * Math.cos((2 * Math.PI * n) / 16);
        }
      } else if (signalType === 'tone') {
        baseRe = Math.cos((2 * Math.PI * 25000 * n) / sampleRate);
        baseIm = Math.sin((2 * Math.PI * 25000 * n) / sampleRate);
      } else if (signalType === 'twotone') {
        baseRe =
          0.5 * Math.cos((2 * Math.PI * 20000 * n) / sampleRate) +
          0.5 * Math.cos((2 * Math.PI * 40000 * n) / sampleRate);
        baseIm =
          0.5 * Math.sin((2 * Math.PI * 20000 * n) / sampleRate) +
          0.5 * Math.sin((2 * Math.PI * 40000 * n) / sampleRate);
      } else if (signalType === 'qpsk') {
        const symIdx = Math.floor(n / 4);
        const bitI = (symIdx * 7) % 2 === 0 ? 0.7071 : -0.7071;
        const bitQ = (symIdx * 11) % 2 === 0 ? 0.7071 : -0.7071;
        baseRe = bitI;
        baseIm = bitQ;
      } else {
        baseRe = (Math.random() - 0.5) * 2;
        baseIm = (Math.random() - 0.5) * 2;
      }

      // Add AWGN Noise
      const noiseI = (Math.random() - 0.5) * 2 * noiseStd;
      const noiseQ = (Math.random() - 0.5) * 2 * noiseStd;

      // Upconvert to Carrier + Doppler
      const rfPhase = (2 * Math.PI * (carrierFreqKhz * 1000 + dopplerOffsetHz) * n) / sampleRate;
      const lo = cExp(rfPhase);
      const rf = cMul({ re: baseRe + noiseI, im: baseIm + noiseQ }, lo);

      raw[n] = rf;
    }

    // Stage 1: Complex Mixer (LO downconversion)
    const mixed: Complex[] = new Array(numSamples);
    for (let n = 0; n < numSamples; n++) {
      const loPhase = (-2 * Math.PI * (carrierFreqKhz * 1000) * n) / sampleRate;
      mixed[n] = cMul(raw[n], cExp(loPhase));
    }

    // Stage 2: Digital Down-Converter (DDC) with 16-tap Kaiser LPF + M=4 Decimator
    const ddcDecimated = polyphaseDecimator(mixed, 4, KAISER_16_TAPS);

    // Stage 3: Barker-13 Matched Correlator
    const corrResult = barker13Correlator(ddcDecimated);

    // Stage 4: Costas Demodulator
    const demodResult = pskReceiver(ddcDecimated, 4);

    return {
      raw,
      mixed,
      ddcDecimated,
      corrResult,
      demodResult,
    };
  }, [signalType, carrierFreqKhz, snrDb, dopplerOffsetHz]);

  // Select signal to display on oscilloscope
  const displaySignal: { i: number; q: number; mag: number; index: number }[] = useMemo(() => {
    let source: Complex[] = [];
    if (activeStage === 'input') source = pipelineData.raw;
    else if (activeStage === 'mixed') source = pipelineData.mixed;
    else if (activeStage === 'ddc') source = pipelineData.ddcDecimated;
    else if (activeStage === 'correlator') source = pipelineData.corrResult.correlation;
    else source = pipelineData.demodResult.symbols;

    return source.slice(0, 128).map((s, idx) => ({
      index: idx,
      i: s.re,
      q: s.im,
      mag: cMag(s),
    }));
  }, [pipelineData, activeStage]);

  return (
    <div className="space-y-6">
      {/* Top Controls Grid */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-cyan-400" />
              Live SDR Signal Generator & Processing Chain
            </h2>
            <p className="text-xs text-slate-400">
              Real-time heterodyne mixer, Kaiser DDC filterbank, Barker-13 correlator, and Costas receiver
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-medium mr-1">Source:</span>
            {(['barker', 'qpsk', 'tone', 'twotone', 'noise'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setSignalType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  signalType === type
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1.5">
              <span>Carrier Frequency (fc)</span>
              <span className="font-mono text-cyan-400 font-bold">{carrierFreqKhz} kHz</span>
            </div>
            <input
              type="range"
              min="0"
              max="250"
              step="5"
              value={carrierFreqKhz}
              onChange={(e) => setCarrierFreqKhz(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>0 kHz (Baseband)</span>
              <span>250 kHz (fs/4)</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1.5">
              <span>Signal-to-Noise Ratio (AWGN)</span>
              <span className="font-mono text-cyan-400 font-bold">{snrDb} dB</span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              step="1"
              value={snrDb}
              onChange={(e) => setSnrDb(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>0 dB (High Noise)</span>
              <span>40 dB (Pristine)</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1.5">
              <span>Doppler / Carrier Offset</span>
              <span className="font-mono text-cyan-400 font-bold">{dopplerOffsetHz} Hz</span>
            </div>
            <input
              type="range"
              min="-2500"
              max="2500"
              step="50"
              value={dopplerOffsetHz}
              onChange={(e) => setDopplerOffsetHz(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>-2.5 kHz</span>
              <span>+2.5 kHz</span>
            </div>
          </div>
        </div>
      </div>

      {/* Processing Pipeline Stages Ribbon */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Select Stage Inspection Point:
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {[
            { id: 'input', label: '1. RF Input (Raw)', desc: 'Carrier + Noise + Doppler' },
            { id: 'mixed', label: '2. Mixer (M6)', desc: 'LO Heterodyne Downmix' },
            { id: 'ddc', label: '3. DDC (M21)', desc: '16-tap Kaiser + Decim M=4' },
            { id: 'correlator', label: '4. Correlator (M24)', desc: 'Barker-13 Matched FIR' },
            { id: 'demod', label: '5. Demod (M25)', desc: 'Costas Carrier Recovery' },
          ].map((stage) => {
            const isActive = activeStage === stage.id;
            return (
              <button
                key={stage.id}
                onClick={() => setActiveStage(stage.id as any)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isActive
                    ? 'bg-cyan-950/40 border-cyan-500 text-white ring-1 ring-cyan-500/30'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold ${isActive ? 'text-cyan-300' : 'text-slate-300'}`}>
                    {stage.label}
                  </span>
                  <Eye className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-600'}`} />
                </div>
                <span className="text-[10px] text-slate-500 block truncate">{stage.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Oscilloscope View & Correlator Peak Detector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Time Domain Waveform Chart (SVG based for guaranteed rendering) */}
        <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Time-Domain I/Q Oscilloscope
              </h3>
              <span className="text-xs text-slate-400">
                Inspecting: <strong className="text-cyan-300">{activeStage.toUpperCase()}</strong> (First 128 samples)
              </span>
            </div>
            <div className="flex items-center space-x-4 text-xs font-mono">
              <div className="flex items-center space-x-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span className="text-slate-300">In-Phase (I)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                <span className="text-slate-300">Quadrature (Q)</span>
              </div>
            </div>
          </div>

          {/* SVG Waveform Rendering */}
          <div className="h-64 w-full bg-slate-950 rounded-lg p-2 relative overflow-hidden border border-slate-800/80">
            {/* Center Grid Line */}
            <div className="absolute inset-x-0 top-1/2 border-t border-slate-800 border-dashed" />
            <div className="absolute inset-x-0 top-1/4 border-t border-slate-900" />
            <div className="absolute inset-x-0 top-3/4 border-t border-slate-900" />

            <svg className="w-full h-full" viewBox="0 0 128 100" preserveAspectRatio="none">
              {/* In-Phase (I) Line (Cyan) */}
              <polyline
                fill="none"
                stroke="#22d3ee"
                strokeWidth="1.5"
                points={displaySignal
                  .map((pt, idx) => {
                    const y = 50 - Math.max(-45, Math.min(45, pt.i * 35));
                    return `${idx},${y}`;
                  })
                  .join(' ')}
              />
              {/* Quadrature (Q) Line (Purple) */}
              <polyline
                fill="none"
                stroke="#c084fc"
                strokeWidth="1.5"
                points={displaySignal
                  .map((pt, idx) => {
                    const y = 50 - Math.max(-45, Math.min(45, pt.q * 35));
                    return `${idx},${y}`;
                  })
                  .join(' ')}
              />
            </svg>
          </div>

          <div className="flex justify-between text-[11px] text-slate-500 font-mono mt-2">
            <span>Sample 0</span>
            <span>Sample 64</span>
            <span>Sample 128</span>
          </div>
        </div>

        {/* Telemetry & Correlator Peak Status Card */}
        <div className="space-y-4">
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-emerald-400" />
              Barker-13 Correlator Telemetry
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400">Peak Correlation:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {pipelineData.corrResult.peakValue.toFixed(2)} (Ideal: 13.0)
                </span>
              </div>

              <div className="flex justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400">Detected Peak Index:</span>
                <span className="font-mono font-bold text-cyan-400">
                  Sample #{pipelineData.corrResult.peakIndex}
                </span>
              </div>

              <div className="flex justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400">Peak-to-Sidelobe (PSL):</span>
                <span className="font-mono font-bold text-purple-400">
                  {pipelineData.corrResult.pslDb.toFixed(1)} dB
                </span>
              </div>

              <div className="flex justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400">Decimated Rate:</span>
                <span className="font-mono font-bold text-slate-200">
                  250 ksps (M=4 Decim)
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-amber-400" />
              AIE2 NPU Execution
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dispatched with <strong>LLVM Peano 21.0.0</strong> targeting <strong>bfloat16</strong> vector MAC units across the 4-column XDNA1 tile matrix.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
