import React from 'react';
import { Cpu, Layers, ShieldCheck, Terminal, HardDrive, Zap, CheckCircle2 } from 'lucide-react';

export const NpuArchitecture: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              AMD Ryzen AI Phoenix Silicon Architecture (XDNA1 / AIE2)
            </h2>
            <p className="text-xs text-slate-400">
              Hardware specifications, compilation pipeline, and 4-column vector tile topology
            </p>
          </div>
        </div>
      </div>

      {/* Hardware Specs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4.5 space-y-2">
          <span className="text-xs text-slate-400 block font-medium">Silicon Target</span>
          <div className="text-lg font-bold font-mono text-white">Ryzen 7040/8040</div>
          <p className="text-xs text-slate-400 leading-relaxed">
            AMD Phoenix APU with integrated XDNA1 NPU (AIE2 spatial array)
          </p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4.5 space-y-2">
          <span className="text-xs text-slate-400 block font-medium">Tile Array Topology</span>
          <div className="text-lg font-bold font-mono text-cyan-400">4 Columns x 4 Rows</div>
          <p className="text-xs text-slate-400 leading-relaxed">
            16 AIE2 Vector Compute Tiles + 4 Memory/Shim DMA Interface Tiles
          </p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4.5 space-y-2">
          <span className="text-xs text-slate-400 block font-medium">Vector Register SIMD</span>
          <div className="text-lg font-bold font-mono text-purple-400">512-bit SIMD</div>
          <p className="text-xs text-slate-400 leading-relaxed">
            32x 16-bit MACs/cycle (int16/bfloat16) or 8x 32-bit float MACs/cycle
          </p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4.5 space-y-2">
          <span className="text-xs text-slate-400 block font-medium">Throughput & Bandwidth</span>
          <div className="text-lg font-bold font-mono text-emerald-400">7.46 Msps · 59.7 MB/s</div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Sustained continuous streaming I/Q through Shim DMA channels
          </p>
        </div>
      </div>

      {/* Toolchain & Compilation Pipeline */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          Silicon Toolchain & Compilation Toolchain Pin
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
            <span className="text-xs font-bold text-cyan-400 block">Xilinx Runtime (XRT)</span>
            <div className="font-mono text-xs text-slate-200">Version 2.21.75</div>
            <p className="text-[11px] text-slate-400">
              Kernel driver, BO memory allocator, and hardware execution context manager on Windows 11.
            </p>
          </div>

          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
            <span className="text-xs font-bold text-purple-400 block">MLIR-AIE (IRON)</span>
            <div className="font-mono text-xs text-slate-200">Version 1.4.1</div>
            <p className="text-[11px] text-slate-400">
              Generates spatial dataflow graphs, Shim DMA descriptors, and routing switchboxes.
            </p>
          </div>

          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
            <span className="text-xs font-bold text-emerald-400 block">LLVM Peano Compiler</span>
            <div className="font-mono text-xs text-slate-200">Version 21.0.0</div>
            <p className="text-[11px] text-slate-400">
              AIE2 C++ vector intrinsic compiler generating direct AIE-ELF machine binaries.
            </p>
          </div>
        </div>
      </div>

      {/* Tile Matrix Layout Diagram */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            XDNA1 Spatial 4-Column Array Floorplan
          </h3>
          <span className="text-xs text-slate-400 font-mono">Row 0 (Shim DMA) to Row 4 (Vector Core)</span>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((col) => (
            <div key={col} className="space-y-2">
              <div className="p-2 text-center text-xs font-bold font-mono text-cyan-400 bg-slate-950 rounded border border-slate-800">
                Column #{col}
              </div>

              {[4, 3, 2, 1].map((row) => (
                <div
                  key={row}
                  className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 hover:border-cyan-500/50 transition-colors text-center space-y-1"
                >
                  <span className="text-[10px] text-slate-500 font-mono block">Tile({col}, {row})</span>
                  <span className="text-xs font-semibold text-slate-200 block">AIE2 Vector Core</span>
                  <span className="text-[10px] text-cyan-400 font-mono block">32KB DM / 16KB PM</span>
                </div>
              ))}

              <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-800/60 text-center space-y-1">
                <span className="text-[10px] text-purple-400 font-mono block">Shim({col}, 0)</span>
                <span className="text-xs font-semibold text-purple-200 block">Shim DMA & NOC</span>
                <span className="text-[10px] text-slate-400 font-mono block">PCIe / Host Interface</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Regression & Audit Checklist */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Reproducibility & Verification Standards
        </h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300">
          <li className="flex items-center space-x-2 p-2 rounded bg-slate-950 border border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>NIST FIPS 203 (ML-KEM-768) Known Answer Test (KAT) Bit-Exact</span>
          </li>
          <li className="flex items-center space-x-2 p-2 rounded bg-slate-950 border border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>NIST FIPS 204 (ML-DSA-65) Power2Round and Hint Verification</span>
          </li>
          <li className="flex items-center space-x-2 p-2 rounded bg-slate-950 border border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>3GPP TS 38.104 Release 18 EVM and Costas Loop Gate Compliance</span>
          </li>
          <li className="flex items-center space-x-2 p-2 rounded bg-slate-950 border border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Kaiser Polyphase Decimator / Interpolator Linear Phase Preservation</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
