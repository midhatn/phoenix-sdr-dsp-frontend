import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Activity, Sliders, Eye, RefreshCw, Zap } from 'lucide-react';
import { Complex, FftBin } from '../types';
import { computeSpectrum } from '../dsp/complex';

export const SpectrumWaterfall: React.FC = () => {
  const [fftSize, setFftSize] = useState<number>(256);
  const [windowType, setWindowType] = useState<'kaiser' | 'hamming' | 'hann' | 'blackman' | 'rectangular'>('kaiser');
  const [tone1FreqKhz, setTone1FreqKhz] = useState<number>(75);
  const [tone2FreqKhz, setTone2FreqKhz] = useState<number>(-125);
  const [noiseLevelDb, setNoiseLevelDb] = useState<number>(-45);
  const [enableTone2, setEnableTone2] = useState<boolean>(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const waterfallHistory = useRef<number[][]>([]);

  const sampleRate = 1000000; // 1 Msps

  // Compute FFT spectrum
  const { bins, peakBin } = useMemo(() => {
    const samples: Complex[] = new Array(fftSize);
    const noiseStd = Math.pow(10, noiseLevelDb / 20);

    for (let n = 0; n < fftSize; n++) {
      let re = 0;
      let im = 0;

      // Tone 1
      const phase1 = (2 * Math.PI * (tone1FreqKhz * 1000) * n) / sampleRate;
      re += Math.cos(phase1);
      im += Math.sin(phase1);

      // Tone 2
      if (enableTone2) {
        const phase2 = (2 * Math.PI * (tone2FreqKhz * 1000) * n) / sampleRate;
        re += 0.7 * Math.cos(phase2);
        im += 0.7 * Math.sin(phase2);
      }

      // Add Noise
      re += (Math.random() - 0.5) * 2 * noiseStd;
      im += (Math.random() - 0.5) * 2 * noiseStd;

      samples[n] = { re, im };
    }

    const spectrumBins = computeSpectrum(samples, sampleRate, fftSize, windowType);
    let maxBin = spectrumBins[0];
    for (const b of spectrumBins) {
      if (b.powerDb > maxBin.powerDb) maxBin = b;
    }

    return { bins: spectrumBins, peakBin: maxBin };
  }, [fftSize, windowType, tone1FreqKhz, tone2FreqKhz, noiseLevelDb, enableTone2]);

  // Update waterfall canvas animation
  useEffect(() => {
    const powerRow = bins.map((b) => Math.max(-80, Math.min(0, b.powerDb)));
    waterfallHistory.current.unshift(powerRow);
    if (waterfallHistory.current.length > 80) {
      waterfallHistory.current.pop();
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const history = waterfallHistory.current;
    const rowHeight = height / 80;

    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, width, height);

    for (let r = 0; r < history.length; r++) {
      const row = history[r];
      const colWidth = width / row.length;

      for (let c = 0; c < row.length; c++) {
        const val = row[c]; // -80 to 0
        const norm = (val + 80) / 80; // 0.0 to 1.0

        // Jet / Cyberpunk Colormap
        let red = 0;
        let green = 0;
        let blue = 0;

        if (norm < 0.25) {
          blue = Math.floor(norm * 4 * 255);
        } else if (norm < 0.5) {
          blue = 255;
          green = Math.floor((norm - 0.25) * 4 * 255);
        } else if (norm < 0.75) {
          green = 255;
          blue = Math.floor((1 - (norm - 0.5) * 4) * 255);
          red = Math.floor((norm - 0.5) * 4 * 255);
        } else {
          red = 255;
          green = Math.floor((1 - (norm - 0.75) * 4) * 255);
        }

        ctx.fillStyle = `rgb(${red},${green},${blue})`;
        ctx.fillRect(c * colWidth, r * rowHeight, colWidth + 1, rowHeight + 1);
      }
    }
  }, [bins]);

  return (
    <div className="space-y-6">
      {/* Controls Header */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              Real-Time Spectrum Analyzer & Spectrogram Waterfall (M17)
            </h2>
            <p className="text-xs text-slate-400">
              Radix-4 Stockham FFT processor with Kaiser/Hamming windowing and peak frequency tracking
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs">
              <span className="text-slate-400">FFT Size:</span>
              {[64, 128, 256].map((size) => (
                <button
                  key={size}
                  onClick={() => setFftSize(size)}
                  className={`px-2 py-0.5 rounded font-mono text-xs ${
                    fftSize === size
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs">
              <span className="text-slate-400">Window:</span>
              {(['kaiser', 'hamming', 'hann', 'blackman'] as const).map((win) => (
                <button
                  key={win}
                  onClick={() => setWindowType(win)}
                  className={`px-2 py-0.5 rounded text-xs capitalize ${
                    windowType === win
                      ? 'bg-purple-500 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {win}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1.5">
              <span>Tone 1 Frequency (f1)</span>
              <span className="font-mono text-cyan-400 font-bold">{tone1FreqKhz} kHz</span>
            </div>
            <input
              type="range"
              min="-400"
              max="400"
              step="5"
              value={tone1FreqKhz}
              onChange={(e) => setTone1FreqKhz(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1.5">
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableTone2}
                  onChange={(e) => setEnableTone2(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-cyan-500"
                />
                <span>Tone 2 Frequency (f2)</span>
              </label>
              <span className="font-mono text-purple-400 font-bold">{tone2FreqKhz} kHz</span>
            </div>
            <input
              type="range"
              min="-400"
              max="400"
              step="5"
              disabled={!enableTone2}
              value={tone2FreqKhz}
              onChange={(e) => setTone2FreqKhz(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400 disabled:opacity-40"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1.5">
              <span>Noise Floor (dBm)</span>
              <span className="font-mono text-slate-400 font-bold">{noiseLevelDb} dB</span>
            </div>
            <input
              type="range"
              min="-70"
              max="-10"
              step="1"
              value={noiseLevelDb}
              onChange={(e) => setNoiseLevelDb(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Spectrum Graph (SVG based) */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Power Spectral Density (PSD)</span>
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
              Peak: {(peakBin.freq / 1000).toFixed(1)} kHz @ {peakBin.powerDb.toFixed(1)} dBFS
            </span>
          </h3>
          <div className="text-xs text-slate-400 font-mono">Span: -500 kHz to +500 kHz</div>
        </div>

        {/* Spectrum SVG Line Graph */}
        <div className="h-56 w-full bg-slate-950 rounded-lg p-2 relative overflow-hidden border border-slate-800">
          {/* Grid lines: 0 dB, -20 dB, -40 dB, -60 dB */}
          {[-10, -30, -50, -70].map((db) => {
            const yPercent = ((-db - 0) / 80) * 100;
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
          <div className="absolute inset-y-0 left-1/2 border-l border-slate-800 border-dashed" />

          <svg className="w-full h-full" viewBox={`0 0 ${bins.length} 100`} preserveAspectRatio="none">
            <polyline
              fill="rgba(6, 182, 212, 0.15)"
              stroke="#22d3ee"
              strokeWidth="1.5"
              points={`0,100 ${bins
                .map((b, idx) => {
                  const dbClamped = Math.max(-80, Math.min(0, b.powerDb));
                  const y = ((-dbClamped) / 80) * 95 + 2;
                  return `${idx},${y}`;
                })
                .join(' ')} ${bins.length - 1},100`}
            />
          </svg>
        </div>

        <div className="flex justify-between text-[11px] text-slate-500 font-mono mt-2">
          <span>-500 kHz (-fs/2)</span>
          <span>-250 kHz</span>
          <span>0 kHz (DC)</span>
          <span>+250 kHz</span>
          <span>+500 kHz (+fs/2)</span>
        </div>
      </div>

      {/* Waterfall Spectrogram Canvas */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white">Waterfall Spectrogram Time History</h3>
          <span className="text-xs text-slate-400 font-mono">Scrolling Display</span>
        </div>

        <canvas
          ref={canvasRef}
          width={512}
          height={160}
          className="w-full h-40 rounded-lg border border-slate-800 block"
        />

        <div className="flex justify-between text-[11px] text-slate-500 font-mono mt-2">
          <span>-500 kHz</span>
          <span>Time: Latest (top) → Past (bottom)</span>
          <span>+500 kHz</span>
        </div>
      </div>
    </div>
  );
};
