# Phoenix SDR-DSP

<div align="center">

![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)
![Target: AMD Phoenix NPU1](https://img.shields.io/badge/Target-AMD%20Ryzen%20AI%20NPU1%20(AIE2)-blue)
![Host: Windows 11 Pro](https://img.shields.io/badge/Host-Windows%2011%20Pro%2025H2-0078D6)
![Validation: 34/34 mixed-backend PASS](https://img.shields.io/badge/Validation-34%2F34%20mixed--backend%20PASS-brightgreen)
![Release: v1.0.0](https://img.shields.io/badge/Release-v1.0.0-brightgreen)
![Post-Quantum Cryptography](https://img.shields.io/badge/Post--Quantum%20Cryptography-FIPS%20203%20%2B%20FIPS%20204-8a2be2)
![Xilinx XRT](https://img.shields.io/badge/Xilinx-XRT-e01f27)
![Xilinx MLIR-AIE](https://img.shields.io/badge/Xilinx-MLIR--AIE%20%2F%20IRON-e01f27)
![Compiler: LLVM Peano](https://img.shields.io/badge/Compiler-LLVM%20Peano%20AIE2-purple)
![I/Q: 7.46 Msps](https://img.shields.io/badge/I%2FQ-7.46%20Msps%20%C2%B7%2010%20TOPS%20NPU-ff6b00)
[![CI](https://github.com/midhatn/phoenix-sdr-dsp/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/midhatn/phoenix-sdr-dsp/actions/workflows/ci.yml)

**Windows-native SDR/DSP and finite-field engineering corpus for AMD Ryzen AI Phoenix silicon (XDNA1 / AIE2)**

**Built on [Xilinx XRT](https://github.com/Xilinx/XRT), [Xilinx MLIR-AIE](https://github.com/Xilinx/mlir-aie) / [IRON](https://xilinx.github.io/mlir-aie/1.4.1/buildHostWinNative/), and [LLVM Peano](https://github.com/Xilinx/llvm-aie).**

Third-party source and test-vector provenance is recorded in
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

**7.46 Msps of real I/Q on a 10 TOPS AMD laptop NPU.** 29.8 MB/s in · 59.7 MB/s in+out · ~92% NPU. No discrete GPU. No FPGA.

The 34-entry regression matrix completed **34/34 PASS** on 2026-08-17 in 126.29 seconds. Its accurate backend accounting is **29 direct-hardware entries**, four host/NPU composer entries (M32e, M33d, M33e Sign, and M33e Verify), and one intentional CPU reference entry (M12). M33a and M33b are native, fail-closed silicon gates; the higher-level composers dispatch those primitives from Python and are not fully device-resident. See the [`M33 validation record`](docs/M33_SILICON_VALIDATION_20260817.md), [`v1.0.0 validation errata`](docs/V1_0_0_VALIDATION_ERRATA.md), and [`PQC status summary`](docs/PQC_COMPLETE_V1.md). New-user path: clone the repository, then run `py .\install`; a successful install automatically invokes the canonical regression runner.

[Web App Quickstart](#-running-the-interactive-web-application) • [Native Silicon Install](#-running-on-native-amd-ryzen-ai-silicon) • [Architecture](#1-system--hardware-architecture) • [Directory Structure](#2-repository-structure) • [Validation Matrix](#3-validation-matrix) • [I/Q Throughput](#iq-throughput) • [Web Application vs Silicon Corpus](#-architecture-enhancements-web-studio-vs-original-silicon-corpus) • [Engineering Issues & Fixes](#4-engineering-challenges--technical-solutions) • [Quickstart](#5-quickstart--silicon-verification) • [References & Repositories](#6-references-upstream-projects--third-party-repositories) • [Citation](#8-citation) • [Credits](#7-credits--acknowledgments) • [Documentation](docs/README.md) • [Publication readiness](docs/PUBLICATION_READINESS.md)

</div>

---

## 🚀 Running the Interactive Web Application

The project includes an interactive, browser-based DSP & Silicon Visualization Studio featuring real-time signal processing, 3GPP TS 38.104 EVM constellation slicing, Radix-4 Stockham FFT spectrum analyzer, NIST FIPS 203/204 PQC cryptography engine, and the 34-gate silicon regression test runner.

### Prerequisites for Web App
- **Node.js**: `v18.0.0` or higher
- **npm** / **yarn** / **pnpm** / **bun**

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
The interactive application will be available at `http://localhost:3000`.

### 3. Production Build & Linting
```bash
# Type check and lint codebase
npm run lint

# Build production bundle (outputs to /dist)
npm run build

# Preview production build locally
npm run preview
```

### Studio Features & Modules
| View / Tab | Capabilities |
| :--- | :--- |
| **Silicon Regression Runner** | Interactive 34-gate test execution harness mirroring the hardware validation suite (29 AIE2 kernels, 4 PQC composers, 1 CPU reference) with pass/fail telemetry, execution duration, and Markdown/JSON export. |
| **SDR Signal Pipeline** | Live multi-stage heterodyne receiver (Mixer $\to$ Kaiser LPF DDC $\to$ Barker-13 Matched Filter $\to$ Costas Loop) with real-time waveform inspection, tone synthesis, AWGN noise, and Doppler offset. |
| **Constellation & EVM Analyzer** | Real-time I/Q constellation analyzer for BPSK, QPSK, 16-QAM, and 64-QAM with Gardner TED, Costas carrier phase recovery, Gray code slicing, SNR injection, phase jitter, and 3GPP TS 38.104 EVM metrics. |
| **Spectrum & Waterfall Analyzer** | Radix-4 Stockham FFT power spectral density (PSD) with selectable windowing (Kaiser $\beta=5.65$, Hamming, Hann, Blackman) and a continuous scrolling 2D waterfall spectrogram. |
| **Post-Quantum Cryptography** | NIST FIPS 203 ML-KEM-768 key encapsulation and NIST FIPS 204 ML-DSA-65 digital signature creation, polynomial hint verification, and tamper detection gating. |
| **FIR Filter & Polyphase Lab** | Kaiser-windowed low-pass FIR filter design with frequency response $|H(f)|$, impulse response $h[n]$, and SIMD polyphase sub-filter commutator matrix mapping. |
| **AIE2 Architecture Explorer** | Visual 4-column $\times$ 5-row tile matrix inspector showing memory allocation, vector SIMD registers, DMA channels, and ObjectFIFO dataflow topologies. |

---

## ⚡ Running on Native AMD Ryzen AI Silicon

A new Windows 11 machine with a Phoenix / Hawk Point NPU only needs a clone of this repository. The extensionless, stdlib-only `install` launcher wraps the official Xilinx / AMD native-Windows stack:

| Component | Pin | Upstream |
| :--- | :--- | :--- |
| [Xilinx XRT](https://github.com/Xilinx/XRT) (Xilinx Runtime) | Windows SDK [2.21.75](https://github.com/Xilinx/XRT/releases/tag/2.21.75) | host DMA / `pyxrt` |
| [Xilinx MLIR-AIE](https://github.com/Xilinx/mlir-aie) + [IRON](https://xilinx.github.io/mlir-aie/1.4.1/buildHostWinNative/) | wheel [v1.4.1](https://github.com/Xilinx/mlir-aie/releases/tag/v1.4.1) + source [`3ca0193`](https://github.com/Xilinx/mlir-aie/commit/3ca0193cea9e2c39ec670a65f93e1dd43c969f22) | AIE dialect, `iron.Runtime`, `aiecc` |
| [LLVM Peano](https://github.com/Xilinx/llvm-aie) (`llvm-aie`) | `21.0.0.2026080301+c9c5ecb7` | AIE2 `clang++` |
| AMD NPU driver / `xrt-smi` | ≥ `32.0.20102.3930` | already on the laptop |

Do not install `mlir_aie` from the rolling [`latest-wheels-4`](https://github.com/Xilinx/mlir-aie/releases/expanded_assets/latest-wheels-4) channel. An untagged checkout of pin `3ca0193` would otherwise resolve to an older series (observed: 1.3.4). The installer downloads the published v1.4.1 `cp313` wheel into a local wheelhouse and passes `--wheelhouse` to official [`iron_setup.py`](https://github.com/Xilinx/mlir-aie/blob/3ca0193/utils/iron_setup.py).

### New-user steps

Clone the repository, open PowerShell in that clone, and run the one setup
command:

```powershell
py .\install
```

The launcher uses its internal installer implementation, installs the pinned
XRT / MLIR-AIE / IRON stack and PQC reference packages, then invokes the canonical
`run_all_silicon_tests.py` after a successful full installation. `py` is the
[Windows Python launcher](https://docs.python.org/3/using/windows.html#python-launcher-for-windows)
and binds to system CPython. The runner re-execs
`third_party\mlir-aie\ironenv\Scripts\python.exe` (where Xilinx IRON installed
numpy / `mlir_aie` / `pyxrt`) and sets `PEANO_INSTALL_DIR` from that same
checkout. Do not activate `ironenv` or manually run `pip install` for the
normal one-command setup flow.

To run an individual example or test after installation, activate the
checkout-local environment from the repository root:

```powershell
.\scripts\activate_ironenv.ps1
```

The activation helper is drive-independent. It selects this clone's
`third_party\mlir-aie\ironenv`, sets `PEANO_INSTALL_DIR` to this clone's Peano
installation, and relies on the installer-validated checkout-local XRT Python
binding. A new PowerShell window must activate the environment again before
using generic `python` commands. The whole-suite command does not require
manual activation because its runner performs the same interpreter and Peano
selection automatically.

For non-install maintenance, the launcher forwards `--check-only`,
`--download-only`, and `--self-test` without invoking the canonical regression
or dispatching kernels. `--check-only` and `--download-only` can call
`xrt-smi examine` as a prerequisite probe; `--self-test` uses only local
temporary files:

```powershell
py .\install --check-only
```

### Prerequisites

- AMD Ryzen 7040 / 8040 APU (Ryzen 9 7940HS or similar Phoenix/Hawk Point silicon).
- Windows 11 Pro 22H2 / 23H2 / 25H2 with the AMD NPU driver enabled.
- CPython 3.13, Git, CMake, and Visual Studio 2022/18 with the C++ and Clang/LLVM workloads (`llvm-objcopy` is required for the Peano wheel fixup). Official path: [mlir-aie 1.4.1 `buildHostWinNative`](https://xilinx.github.io/mlir-aie/1.4.1/buildHostWinNative/).

### Verified clean clone

On 2026-08-15 a wipe-and-clone of `main` on a second Windows volume ran the two commands above and reported **16/16 PASS** in **95.91 s** (cold xclbin compile) on a Ryzen 9 7940HS Phoenix NPU1. A cached re-run on the development tree was **17.46 s**. After native M33 runner integration, the 34-entry development tree completed **34/34 PASS** in **126.29 s** on 2026-08-17. That is a mixed-backend regression result, not 34 fully device-resident workloads: 29 entries dispatch directly to hardware, four are host/NPU composers, and M12 is an intentional CPU reference. The current boundary is documented in [`docs/M33_SILICON_VALIDATION_20260817.md`](docs/M33_SILICON_VALIDATION_20260817.md).

Longer Windows walkthrough: [`docs/SETUP_WINDOWS.md`](docs/SETUP_WINDOWS.md). Pin rationale: [`docs/M2_TOOLCHAIN_PIN.md`](docs/M2_TOOLCHAIN_PIN.md). v1.0.0 PQC summary: [`docs/PQC_COMPLETE_V1.md`](docs/PQC_COMPLETE_V1.md).

## 1. System & Hardware Architecture

The **Phoenix SDR-DSP** project provides a native Windows 11 execution and validation path for SDR processing and finite-field lattice-cryptography experiments on AMD Ryzen 7040/8040 series processors.

- **Target APU:** AMD Ryzen 9 7940HS (8 Cores / 16 Threads @ 4.0–5.2 GHz)
- **NPU Silicon:** AMD XDNA1 / 1st Gen Ryzen AI (`npu1`), [up to 10 TOPS](https://www.amd.com/en/products/processors/laptop/ryzen/7000-series/amd-ryzen-9-7940hs.html) ([INT8 on Phoenix 7040](https://www.tomshardware.com/pc-components/cpus/the-refresh-that-wasnt-amd-announces-hawk-point-ryzen-8040-series-with-zen-4-rdna3-and-xdna-teases-strix-point))
  - **Tile Array:** 20-tile 4×5 AI Engine 2 (AIE2) array; row/column
    orientation follows the platform documentation and is not inferred here
  - **Vector Architecture:** 512-bit SIMD registers supporting 64-lane `bfloat16`, 32-lane `int16`, and 16-lane `cint16`
  - **Local Memory:** 64 KB local data memory per tile (four 16 KB banks)
- **Host Operating System:** Windows 11 Pro 25H2
- **Compilation Toolchain:** [LLVM Peano](https://github.com/Xilinx/llvm-aie) `clang++` (`--target=aie2-none-unknown-elf`)
- **Runtime Environment:** [Xilinx MLIR-AIE](https://github.com/Xilinx/mlir-aie) / [IRON](https://xilinx.github.io/mlir-aie/1.4.1/buildHostWinNative/) Python eDSL JIT + native Windows [Xilinx XRT](https://github.com/Xilinx/XRT) (`xrt_core.dll` / `CachedXRTHostRuntime`)

---

## 2. Repository Structure

```text
phoenix-sdr-dsp/
├── include/
│   └── sdr_dsp/
│       ├── sdr_dsp_common.hpp      # Vector types, lane constants, Q15 definitions
│       ├── fir_filter.hpp           # 64-lane vectorized FIR filtering
│       ├── complex_mixer.hpp        # Complex NCO & I/Q frequency shifter
│       ├── power_detector.hpp       # I^2 + Q^2 energy / RSSI detector
│       ├── modular_arithmetic.hpp   # Barrett & Montgomery modular reduction mod q=3329
│       └── ntt_butterfly.hpp        # Cooley-Tukey & Gentleman-Sande butterflies
├── kernels/
│   └── fft_stockham_f32.cc          # Radix-4 Stockham FFT (adapted from AMD FFT_R4_AIE, Apache-2.0)
├── tests/
│   ├── m3_saxpy/                    # Milestone 3:  Single-Core SAXPY Vector Operation (bfloat16)
│   ├── m5_fir/                      # Milestone 5:  8-Tap Vectorized Low-Pass FIR Filter
│   ├── m6_mixer/                    # Milestone 6:  Complex Mixer / NCO Frequency Downconverter
│   ├── m7_power/                    # Milestone 7:  Power / RSSI Energy Detector
│   ├── m8_pipeline/                 # Milestone 8:  Streaming Multi-Stage Fused Demodulator Pipeline
│   ├── m9_parallel/                 # Milestone 9:  4-Column Parallel FIR Filter (Hardware Scaling)
│   ├── m9b_parallel_pipeline/       # Milestone 9b: 4-Column Parallel Multi-Stage Demodulator Pipeline
│   ├── m10_modular/                 # Milestone 10: Modular Arithmetic & Barrett Reduction
│   ├── m11_butterfly/               # Milestone 11: Radix-2 NTT Butterfly Kernel
│   ├── m12_ntt_ref/                 # Milestone 12: CPU NTT/INTT Reference & Constant Generator
│   ├── m13_ntt16/                   # Milestone 13: 16-Point Vectorized NPU NTT (64 Batches)
│   ├── m14_ntt256/                  # Milestone 14: 256-Point Vectorized NPU NTT (4 Batches)
│   ├── m15_polymul/                 # Milestone 15: NPU INTT & Cyclic Polynomial Multiplication
│   ├── m15b_negacyclic/             # Milestone 15b: Negacyclic Polynomial Multiplication (Kyber / ML-KEM ring)
│   ├── m32_mlkem/                   # Milestone 32: FIPS 203 ML-KEM (planned; not in the 16-suite)
│   ├── m16_fft_ref/                 # Milestone 16: CPU DFT/FFT Reference (three implementations, CI)
│   ├── m17_radix2_fft/              # Milestone 17: 64-Point NPU Radix-4 Stockham FFT + IFFT
│   ├── m17p_fft_parallel/           # Milestone 17p: 4-Column Parallel FFT Channelizer
│   └── npu_visible/                 # Demo: 4-column I/Q throughput (not in the 16-suite)
├── scripts/                         # Windows environment audit, bootstrap, and activation scripts
├── docs/                            # Milestones, mathematics, ROADMAP, Windows setup, toolchain pin
├── requirements/                    # Pinned toolchain versions
├── toolchain.yaml                   # Machine-readable pinned stack (silicon-verified components)
├── install                          # Windows clean-clone launcher: py .\install
├── install.py                       # Internal implementation used by install
├── run_all_silicon_tests.py         # Automated Master Regression Suite
├── CITATION.cff                     # Citation metadata (validated with cffconvert)
├── LICENSE                          # Apache License 2.0
├── CONTRIBUTING.md                  # Contribution Guidelines
└── README.md                        # Master Project Documentation
```

---

## 3. Validation Matrix

Hardware-backed rows below execute on physical Phoenix NPU silicon (`npu1`) and compare against an independent mathematical reference. CPU and reference-only rows are labeled explicitly.

### Release-maintenance validation

For a clean-drive, host-safe audit that never accesses the NPU, run PowerShell
7 as a normal user:

```powershell
pwsh -File .\scripts\validate_clean_clone.ps1 `
    -InstallHostDependencies
```

The explicit switch installs and verifies pinned `numpy==2.5.2`, then writes
one timestamped report beneath ignored `release-evidence/`. Without it, a
missing or mismatched NumPy version causes an actionable refusal. The separate
`-RunSilicon` switch runs the unchanged canonical runner only after the host
checks pass and must be used only on an approved Phoenix test host.
Publication scope, evidence limits, and retention requirements are in
[Publication readiness](docs/PUBLICATION_READINESS.md) and the
[journal reproducibility checklist](docs/JOURNAL_REPRODUCIBILITY_CHECKLIST.md).

| Milestone | Component / DSP Primitive | Target Array | Workload / Dimensions | Silicon Status | Verification Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **M3** | Single-Core SAXPY Vector Operation | Tile `(0,2)` | 4096 `bfloat16` elements | **PASS** | Bit-Exact ($0.0$ error) |
| **M5** | 8-Tap Vectorized Low-Pass FIR | Tile `(0,2)` | 4096 elements | **PASS** | $L_\infty \le 0.007812$ |
| **M6** | Complex Mixer / NCO Downconverter | Tile `(0,2)` | 2048 I/Q pairs | **PASS** | $L_\infty \le 0.007812$ |
| **M7** | Power / RSSI Energy Detector | Tile `(0,2)` | 2048 I/Q $\to$ 2048 P | **PASS** | $L_\infty \le 0.015625$ |
| **M8** | Multi-Stage Fused Demodulator | Tile `(0,2)` | RF I/Q $\to$ Mix $\to$ FIR $\to$ Pwr | **PASS** | Zero stack allocation |
| **M9** | 4-Column Parallel FIR Scaling | 4 Columns `(0..3,2)` | 4096 samples (1024/core) | **PASS** | 4-Core Parallel Lockstep |
| **M9b** | 4-Column Parallel Multi-Stage Pipeline | 4 Columns `(0..3,2)` | 2048 I/Q burst / column | **PASS** | 2400.71 µs / burst, 0.85 MSamples/sec |
| **M10** | Modular Arithmetic & Barrett Reduction | Tile `(0,2)` | 1024 pairs mod $q=3329$ | **PASS** | Bit-Exact Match |
| **M11** | Radix-2 NTT Butterfly Kernel | Tile `(0,2)` | 1024 CT butterflies mod $q$ | **PASS** | Bit-Exact Match |
| **M12** | NTT Constant & Reference Engine | CPU Reference | $N=16, 256$, $\omega^N \equiv 1$ | **PASS** | Bit-Exact Match |
| **M13** | 16-Point Vectorized NPU NTT | Tile `(0,2)` | 64 parallel frames (1024 elems) | **PASS** | Bit-Exact Match |
| **M14** | 256-Point Vectorized NPU NTT | Tile `(0,2)` | 4 parallel frames (1024 elems) | **PASS** | Bit-Exact Match |
| **M15** | NPU INTT & Cyclic Polynomial Multiplication | Tile `(0,2)` | $C(x) = A(x) \times B(x) \pmod{x^{256}-1}$ | **PASS** | Bit-Exact Match |
| **M15b** | Negacyclic Polynomial Multiplication ([Kyber](https://pq-crystals.org/kyber/data/kyber-specification-round3-20210804.pdf) / [FIPS 203](https://nvlpubs.nist.gov/nistpubs/fips/nist.fips.203.pdf) ring) | Tile `(0,2)` | $C(x) = A(x) \times B(x) \pmod{x^{256}+1}$ | **PASS** | Bit-Exact Match |
| **M16** | CPU DFT/FFT Reference (three implementations) | CPU Reference (CI) | $N \in \{8..1024\}$ | **PASS** | $\le 10^{-13}$ vs NumPy `fft.fft` |
| **M17** | 64-Point NPU Radix-4 Stockham FFT + IFFT | Tile `(0,2)` | 64-point complex `bfloat16` | **PASS** | FFT SNR **138.79 dB**, IFFT round-trip **135.11 dB** |
| **M17p** | 4-Column Parallel FFT Channelizer | 4 Columns `(0..3,2)` | 64 parallel 64-point frames | **PASS** | 1,993 FFTs/sec, 0.51 MB/s I/Q |
| **M19** | 8-Tap Complex FIR (complex taps × complex I/Q) | Tile `(0,2)` | 4096 complex samples | **PASS** | Bit-Exact vs CPU reference |
| **M20** | Fused Polyphase Decimator (M=4) + Interpolator (L=4) | Tile `(0,2)` | 4096 complex samples | **PASS** | Bit-Exact vs CPU reference |
| **M21** | Fused Digital Down-Converter (DDC) | Tile `(0,2)` | Complex NCO at −f_s/8 + Kaiser LPF + decim-by-4 | **PASS** | Bit-Exact vs CPU reference |
| **M22** | Fused Digital Up-Converter (DUC) | Tile `(0,2)` | Interp-L=4 + Kaiser×L LPF + complex NCO at +f_s/8 | **PASS** | Bit-Exact vs CPU reference |
| **M23** | Fused Polyphase Channelizer (M-path) | Tile `(0,2)` | M=8 commutator + M-path FIR + 8-point matmul-DFT | **PASS** | Bit-Exact vs CPU reference |
| **M24** | Fused [Barker-13](https://en.wikipedia.org/wiki/Barker_code) Matched-Filter Correlator | Tile `(0,2)` | Reversed-tap FIR pair on I and Q, L=13 | **PASS** | Bit-Exact vs CPU reference |
| **M25** | Fused BPSK / QPSK Receiver | Tile `(0,2)` | Gardner TED + linear interp + NCO derotate + Costas | **PASS** | Receiver-theoretic gates (‹π/8 residual) |
| **M26** | Fused QAM-16 Receiver + Soft-Decision Demapping | Tile `(0,2)` | M25 core + Gray slicer + DD phase detector + max-log LLR | **PASS** | LLR consistency ≥ 0.75 (LSBs) / ≥ 0.85 (MSBs) |
| **M27** | Fused OFDM Loopback | Tile `(0,2)` | FFT + CP + pilots + LS pilot estimates + linear interpolation + zero-forcing equalization | **HARDWARE PASS** | Reuses M17 radix-4 Stockham FFT |
| **M32b** | Post-Quantum Cryptography — [FIPS 203](https://nvlpubs.nist.gov/nistpubs/fips/nist.fips.203.pdf) ML-KEM NTT | Tile `(0,2)` | Algorithms 9–12, `Z_3329`, pq-crystals ζ-table | **PASS** | Bit-Exact vs [`kyber-py` 1.0.1](https://github.com/GiacomoPope/kyber-py) |
| **M32c** | Post-Quantum Cryptography — [FIPS 202](https://nvlpubs.nist.gov/nistpubs/fips/nist.fips.202.pdf) Keccak / SHA-3 / SHAKE + samplers | Tile `(0,2)` | Keccak-f[1600] permutation, 5 dispatch modes | **PASS** | Bit-Exact vs [FIPS 202](https://nvlpubs.nist.gov/nistpubs/fips/nist.fips.202.pdf) test vectors |
| **M32d** | Post-Quantum Cryptography — [FIPS 203](https://nvlpubs.nist.gov/nistpubs/fips/nist.fips.203.pdf) K-PKE Component | Tile `(0,2)` | Algorithms 13–15 (K-PKE.KeyGen / Encrypt / Decrypt) | **PASS** | Bit-Exact vs kyber-py K-PKE |
| **M32e** | Post-Quantum Cryptography — [FIPS 203](https://nvlpubs.nist.gov/nistpubs/fips/nist.fips.203.pdf) ML-KEM internal-interface composer | Host + tile | Algorithms 16–18, ML-KEM-512 | **HARDWARE SMOKE PASS** | 60 host KATs plus 3 silicon vectors per operation |
| **M33a** | Post-Quantum Cryptography — [FIPS 204](https://nvlpubs.nist.gov/nistpubs/fips/nist.fips.204.pdf) ML-DSA NTT | Tile `(0,2)` | NTT / INTT / basemul / reduce, `Z_8380417` | **SILICON PASS** | 420 / 420; `m33a:silicon` |
| **M33b** | Post-Quantum Cryptography — [FIPS 204](https://nvlpubs.nist.gov/nistpubs/fips/nist.fips.204.pdf) Rounding & Hint | Tile `(0,2)` | Power2Round / Decompose / MakeHint / UseHint / CheckNorm | **SILICON PASS** | 700 / 700; `m33b:silicon` |
| **M33d** | Post-Quantum Cryptography — [FIPS 204](https://nvlpubs.nist.gov/nistpubs/fips/nist.fips.204.pdf) ML-DSA.KeyGen composer | Host + tile | Algorithm 6, ML-DSA-{44, 65, 87} | **HYBRID PASS** | 75 / 75; native M33a/M33b primitives |
| **M33e** | Post-Quantum Cryptography — [FIPS 204](https://nvlpubs.nist.gov/nistpubs/fips/nist.fips.204.pdf) ML-DSA.{Sign_internal, Verify_internal} composer | Host + tile | Algorithms 7 and 8, ML-DSA-{44, 65, 87} | **HYBRID PASS** | 180 / 180; native M33a/M33b primitives |

### Post-Quantum Cryptography track (M32 + M33, v1.0.0)

The v1.0.0 tree contains FIPS-aligned ML-KEM and ML-DSA experiments with different validation boundaries:

- **[FIPS 203](https://nvlpubs.nist.gov/nistpubs/fips/nist.fips.203.pdf) ML-KEM** — M32b, M32c, and M32d dispatch directly to the NPU. M32e exercises the ML-KEM-512 internal deterministic interfaces (Algorithms 16–18) in a host/NPU composition with 60 host KATs and a nine-vector silicon smoke gate; it does not establish public Algorithms 19–21 coverage. Reference oracle: [`kyber-py` 1.0.1](https://github.com/GiacomoPope/kyber-py).
- **[FIPS 204](https://nvlpubs.nist.gov/nistpubs/fips/nist.fips.204.pdf) ML-DSA** — M33a and M33b are native, fail-closed silicon gates. M33d/e are host-orchestrated composers that dispatch those polynomial primitives to the NPU while SHAKE, sampling, packing, accumulation, and control remain host-side. The recorded gates are M33a 420/420, M33b 700/700, M33d 75/75, M33e Sign 90/90, and M33e Verify 90/90. Reference oracle: [`dilithium-py` 1.4.0](https://github.com/GiacomoPope/dilithium-py).

Full v1.0.0 release summary: [`docs/PQC_COMPLETE_V1.md`](docs/PQC_COMPLETE_V1.md). Per-milestone design notes live at [`docs/M32b_DESIGN.md`](docs/M32b_DESIGN.md), [`docs/M32c_DESIGN.md`](docs/M32c_DESIGN.md), [`docs/M32d_DESIGN.md`](docs/M32d_DESIGN.md), [`docs/M32e_DESIGN.md`](docs/M32e_DESIGN.md), [`docs/M33a_DESIGN.md`](docs/M33a_DESIGN.md), [`docs/M33b_DESIGN.md`](docs/M33b_DESIGN.md), [`docs/M33d_DESIGN.md`](docs/M33d_DESIGN.md), [`docs/M33e_DESIGN.md`](docs/M33e_DESIGN.md). `kyber-py` and `dilithium-py` are version-pinned; `pytest` is required but not yet locked, so the installation is not fully dependency-reproducible. All SHAKE / SHA-3 primitives come from the CPython [`hashlib`](https://docs.python.org/3/library/hashlib.html) standard library, so no separate SHAKE / Keccak wheel is required.

<a id="iq-throughput"></a>

### I/Q throughput demo (not in the 34-invocation suite)

Host-visible 4-column streamed complex mixer in `tests/npu_visible/`. Measured 2026-08-15 on a Ryzen 9 7940HS Phoenix NPU1 ([10 TOPS](https://www.amd.com/en/products/processors/laptop/ryzen/7000-series/amd-ryzen-9-7940hs.html)). First buffer matches the M6 complex-multiply reference ($L_\infty = 0.007812$). Kernel vectorization is deferred.

| Metric | 1-column 8 KB loop | 4-column stream |
| :--- | ---: | ---: |
| IQ in | 3.85 MB/s | **29.84 MB/s** |
| IQ out | 3.85 MB/s | **29.84 MB/s** |
| IQ in+out | 7.70 MB/s | **59.68 MB/s** |
| Complex rate | 0.963 Msps | **7.459 Msps** |
| Task Manager NPU | ~53% | **~92%** |

```powershell
python tests\npu_visible\test_iq_throughput.py
```

---

## 4. Engineering Challenges & Technical Solutions

During development on native Windows 11 with the AMD IRON/AIE2 toolchain, several architecture-specific hurdles were identified and resolved:

### 1. `XRTTensor` Host Buffer Alignment & Type Constraints
- **Issue:** Passing 16-bit integers directly to `XRTTensor` failed with `TypeError: Cannot cast array data from dtype('int16') to dtype('uint32') according to the rule 'same_kind'`.
- **Root Cause:** AMD XRT DMA host buffers enforce 32-bit word alignment.
- **Solution:** Packed adjacent 16-bit operands ($I/Q$ sample pairs or modular $(A, B)$ polynomials) into native `uint32` arrays on the host, unpacking them into SIMD vector registers inside the AIE2 kernel.

### 2. AIE2 Tile Local Data Memory Overflow (64 KB Bank Budget)
- **Issue:** Kernel compilation aborted with `[aiecc] error: 'aie.tile' op allocated buffers exceeded available memory`.
- **Root Cause:** AIE2 tile data memory is strictly 64 KB (divided into four 16 KB banks). Allocating 16 KB double-buffered ping-pong ObjectFIFOs for both input and output exceeded available SRAM.
- **Solution:** Right-sized burst buffer lengths to 1024 elements (4 KB per buffer), allowing input/output ping-pong buffering ($16\text{ KB}$ total) while reserving remaining banks for kernel stack and precomputed twiddle LUTs.

### 3. Peano Header Resolution Across Cache Directories
- **Issue:** Peano failed with `fatal error: 'sdr_dsp/...' file not found` during JIT compilation.
- **Root Cause:** IRON generates temporary compilation units in user cache directories (`%USERPROFILE%\.npu\cache\...`), breaking relative C++ include paths.
- **Solution:** Implemented self-contained kernels or programmatically forwarded absolute include paths via `include_dirs=[cxx_header_path(), str(include_sdr_dir)]`.

### 4. Decimation-in-Time NTT Twiddle Table Stride Indexing
- **Issue:** 16-Point and 256-Point NTT stage-2/stage-3 butterflies exhibited non-trivial bin mismatches against direct $O(N^2)$ DFT.
- **Root Cause:** Radix-2 Decimation-in-Time (DIT) butterflies require twiddle powers $\omega^{j \cdot (N / 2^s)}$ at stage $s$. Using flat twiddle indexing introduced phase errors.
- **Solution:** Derived programmatic stage stride step indexing (`W[j * (N >> stage)]`), achieving bit-exact match ($0$ error) across all transform sizes.

### 5. M17 FFT Stage-1 Butterfly Inversion
- **Issue:** The initial radix-2 M17 FFT produced valid magnitude but wrong bin ordering. Every stage after the first had a systematic butterfly-index inversion, yielding SNR $< 12$ dB against `numpy.fft.fft`.
- **Root Cause:** The Stockham auto-sort schedule pairs indices $(k, k + m/2)$ where $m$ is the *current* subtransform size. The initial kernel applied the twiddle to the wrong lane of each pair.
- **Solution:** Rewrote as radix-4 Stockham (twiddle applied per quadruplet, autonomous permutation between stages), reaching **138.79 dB forward SNR** vs NumPy — better than double-precision floor for a 64-point transform.

### 6. IFFT Without Separate Device Code
- **Issue:** Shipping a full inverse-FFT kernel would double the memory + build footprint of M17.
- **Solution:** Applied the identity `IFFT(Y) = conj(FFT(conj(Y))) / N` in the host driver. The M17 forward kernel is reused as-is; only conjugate-and-scale runs on the host. Silicon result: **135.11 dB round-trip SNR** on random complex vectors.

### 7. Upstream mlir-aie v1.4.1 iron.Runtime API Break
- **Issue:** After moving to upstream mlir-aie v1.4.1 (pin commit `3ca0193`, 2026-08-14), the full silicon sweep failed 14/16 milestones with `Runtime.__init__() missing 1 required positional argument: 'seq_fn'`.
- **Root Cause:** Upstream deprecated the `Runtime()` context-manager pattern in favor of `Runtime(seq_fn, fn_args=[...])`, and moved worker enrollment and task-group management out of the `Runtime` object into `Program(..., workers=[...])` and per-sequence `TaskGroup` objects.
- **Solution:** Migrated all 12 iron-based tests in one sweep. Single-worker kernels use the new `Runtime(seq_fn, [...])` signature; multi-worker channelizers use `TaskGroup()` inside the sequence body with `tg.finish()` at the end and endpoint-native `prod_ep.fill(buf, tap=tap, group=tg)` for per-column DMA. Full detail in `docs/ROADMAP.md`.

### 8. AIE2 Program-Memory Overflow on Unrolled ObjectFifo Loops
- **Issue:** A 64-iteration `for` around acquire/mix/release in the I/Q throughput worker failed `aiecc` at CDO load with `_XAie_LoadProgMemSection(): Overflow of program memory` / `XAie_LoadElf failed`.
- **Root Cause:** AIE2 core program memory is 16 KB. Static ObjectFifo lowering unrolled the frame loop into the ELF `.text` section.
- **Solution:** One acquire/release per worker, `Worker(while_true=True, dynamic_objfifo_lowering=True)`, and a 64-frame host TAP. IRON streams the tokens; the core binary stays compact.

---

## 5. Quickstart & Silicon Verification

### Running the Full Master Regression Suite (34 Gates)

The [Installation](#-running-on-native-amd-ryzen-ai-silicon) command already runs the canonical regression after a successful install. To rerun the full 34-test regression sweep anytime from PowerShell:

```powershell
py .\run_all_silicon_tests.py
```

### Running Individual Milestones

You can test individual DSP kernels, channelizers, and cryptographic modules directly:

```powershell
# Activate local iron environment (first time in a shell session)
.\scripts\activate_ironenv.ps1

# Milestone 3: Single-Core SAXPY Vector Operation
python tests\m3_saxpy\test_saxpy.py

# Milestone 6: Complex Mixer / NCO Downconverter
python tests\m6_mixer\test_mixer.py

# Milestone 17: 64-Point Radix-4 Stockham FFT + IFFT
python tests\m17_radix2_fft\test_fft.py

# Milestone 17p: 4-Column Parallel FFT Channelizer
python tests\m17p_fft_parallel\test_fft_parallel.py

# Milestone 21: Fused Digital Down-Converter (DDC)
python tests\m21_ddc\test_ddc.py

# Milestone 24: Barker-13 Matched-Filter Correlator
python tests\m24_barker13\test_barker13.py

# Milestone 25: Fused BPSK / QPSK Receiver & Costas Loop
python tests\m25_costas\test_costas.py

# Milestone 32: NIST FIPS 203 ML-KEM-512 / ML-KEM-768 Suite
python tests\m32_mlkem\test_m32e_composer.py

# Milestone 33: NIST FIPS 204 ML-DSA-44 / ML-DSA-65 / ML-DSA-87 Suite
python tests\m33_mldsa\test_m33a_ntt.py
python tests\m33_mldsa\test_m33b_rounding.py
python tests\m33_mldsa\test_m33d_keygen.py
python tests\m33_mldsa\test_m33e_sign.py
python tests\m33_mldsa\test_m33e_verify.py
```

Expected output for full master regression suite (mlir-aie v1.4.1 pin `3ca0193`, cached xclbin):
```text
======================================================================
                     REGRESSION EXECUTION SUMMARY
======================================================================
 [ PASS ] Milestone 3: Single-Core SAXPY Vector Operation                        (1.11s)
 [ PASS ] Milestone 5: 8-Tap Vectorized Low-Pass FIR Filter                      (1.16s)
 [ PASS ] Milestone 6: Complex Mixer / NCO Frequency Downconverter               (1.03s)
 [ PASS ] Milestone 7: Vectorized Power / RSSI Energy Detector                   (1.07s)
 [ PASS ] Milestone 8: Streaming Multi-Stage Fused Demodulator Pipeline          (1.08s)
 [ PASS ] Milestone 9: 4-Column Parallel FIR Filter (Hardware Scaling)           (1.04s)
 [ PASS ] Milestone 9b: 4-Column Parallel Multi-Stage Demodulator Pipeline       (1.18s)
 [ PASS ] Milestone 10: Modular Arithmetic & Barrett Reduction (mod 3329)        (1.08s)
 [ PASS ] Milestone 11: Radix-2 NTT Butterfly Kernel (mod 3329)                  (1.03s)
 [ PASS ] Milestone 12: CPU NTT/INTT Reference & Constant Generator              (0.28s)
 [ PASS ] Milestone 13: 16-Point Vectorized NPU NTT (64 Batches)                 (0.62s)
 [ PASS ] Milestone 14: 256-Point Vectorized NPU NTT (4 Batches)                 (1.22s)
 [ PASS ] Milestone 15: NPU INTT & Cyclic Polynomial Multiplication              (1.18s)
 [ PASS ] Milestone 15b: NPU Negacyclic Polynomial Multiplication (Kyber ring)   (0.63s)
 [ PASS ] Milestone 17: 64-Point Radix-4 Stockham FFT + IFFT (NPU1)              (1.07s)
 [ PASS ] Milestone 17p: 4-Column Parallel 64-Point FFT Channelizer              (2.68s)
----------------------------------------------------------------------
 Total Tests Run: 16 | Passed: 16 | Failed: 0
 Total Elapsed Time: 17.46 seconds
```

### Optional: I/Q throughput

Not part of `run_all_silicon_tests.py`. After the suite, or instead of it:

```powershell
python tests\npu_visible\test_iq_throughput.py
```

Expected on Phoenix NPU1: first-buffer $L_\infty = 0.007812$, then ~7.5 Msps / ~30 MB/s I/Q in over a 5 s window. See [I/Q Throughput](#iq-throughput).

---

## 🔬 Architecture Enhancements: Web Studio vs Original Silicon Corpus

This repository integrates the original [midhatn/phoenix-sdr-dsp](https://github.com/midhatn/phoenix-sdr-dsp) native silicon and MLIR-AIE corpus with a browser-accessible, real-time engineering studio:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                             PHOENIX SDR-DSP ARCHITECTURE ECOSYSTEM                          │
├─────────────────────────────────────────────────────────┬───────────────────────────────────┤
│    Original Native Corpus (midhatn/phoenix-sdr-dsp)     │   Web Studio & Visual Workbench   │
├─────────────────────────────────────────────────────────┼───────────────────────────────────┤
│ • Native C++ AIE2 Vector Kernels (kernels/*.cc)        │ • TypeScript / React 18 UI        │
│ • MLIR-AIE / IRON Dataflow Graphs & ObjectFIFOs         │ • In-Browser DSP & FFT Pipeline   │
│ • Windows 11 XRT & pyxrt Driver Interface               │ • 34/34 Test Regression Simulator │
│ • LLVM Peano AIE2 Vector Assembler                      │ • Real-Time Constellation / EVM   │
│ • 34-Gate Python Silicon Regression Suite               │ • FIPS 203/204 PQC Simulator      │
│ • Pinned Toolchains (XRT 2.21, MLIR-AIE 1.4.1)          │ • 2D Waterfall & Spectrum Analyzer│
└─────────────────────────────────────────────────────────┴───────────────────────────────────┘
```

### Key Enhancements & Differences:

1. **Interactive Web Simulation & Live Visualization**:
   - **Original Repo**: Command-line based (`run_all_silicon_tests.py` and PowerShell scripts) requiring physical AMD Phoenix / Hawk Point APU hardware (Ryzen 9 7940HS / 8040 series) running Windows 11 with XRT drivers.
   - **Enhanced Web Studio**: Implements a high-precision TypeScript mirror of the DSP algorithms and NTT/PQC mathematical primitives in the browser. Developers without physical AMD silicon can interactively inspect, benchmark, and visualize every stage of the pipeline on any OS (Linux, macOS, Windows).

2. **Real-Time Instrumentation & Visual Workbenches**:
   - **SDR Pipeline Inspector**: Live visual inspection of heterodyne mixer downconversion, Kaiser-windowed DDC filtering, Barker-13 matched filter correlation, and Costas carrier demodulation.
   - **3GPP TS 38.104 Constellation & EVM Analyzer**: Dynamic constellation visualizer for BPSK, QPSK, 16-QAM, and 64-QAM with simulated RF impairments (SNR, phase error $\Delta\theta$, amplitude imbalance) and real-time RMS/Peak EVM calculation.
   - **Radix-4 Stockham Spectrum & Waterfall**: Live Power Spectral Density (PSD) display with real-time scrolling 2D spectrogram history and peak carrier frequency tracking.
   - **NIST FIPS 203 (ML-KEM-768) & FIPS 204 (ML-DSA-65) PQC Studio**: Interactive keypair generation, encapsulation/decapsulation, digital signature generation, verification, and tamper detection with byte-level payload inspections.
   - **Kaiser FIR & Polyphase Matrix Lab**: Interactive FIR filter designer with live frequency response $|H(f)|$, impulse response $h[n]$, and 4-column AIE2 polyphase SIMD mapping visualizer.
   - **AIE2 4×5 Tile Topology Explorer**: Visual mapping of the Phoenix NPU architecture (Memory Tiles, Vector Compute Tiles, DMA channels, and ObjectFIFO interconnects).

3. **Multi-Format Telemetry & Reporting**:
   - Web regression runner supports single-click test execution with real-time progress bars, per-kernel timing, and instant export to GitHub-ready Markdown or JSON test reports.

---

## 6. References, Upstream Projects & Third-Party Repositories

### Core Toolchains & Silicon Infrastructure
- **[Xilinx/mlir-aie](https://github.com/Xilinx/mlir-aie)**: AI Engine MLIR dialect, IRON Python API, and `aiecc` compiler (pinned at commit [`3ca0193`](https://github.com/Xilinx/mlir-aie/commit/3ca0193cea9e2c39ec670a65f93e1dd43c969f22), [v1.4.1](https://github.com/Xilinx/mlir-aie/releases/tag/v1.4.1) + 13 commits, [PR #3545](https://github.com/Xilinx/mlir-aie/pull/3545)).
- **[Xilinx/llvm-aie (Peano)](https://github.com/Xilinx/llvm-aie)**: AMD Clang/LLVM compiler targeting AIE/AIE2 vector processors (`21.0.0.2026080301+c9c5ecb7`).
- **[Xilinx/XRT](https://github.com/Xilinx/XRT)**: Xilinx Runtime userspace libraries, `pyxrt` Python bindings, and `xrt-smi` hardware management CLI (Windows SDK [2.21.75](https://github.com/Xilinx/XRT/releases/tag/2.21.75)).
- **[amd/xdna-driver](https://github.com/amd/xdna-driver)**: Linux and Windows kernel driver for AMD XDNA architecture.
- **[Xilinx/aie-rt](https://github.com/Xilinx/aie-rt)**: AI Engine runtime library and `aie_api` header templates (`fft_dit_r2_stage`, `mmul`, `filter_even/odd`).

### Algorithmic References & Kernels
- **[diacccc/FFT_R4_AIE](https://github.com/diacccc/FFT_R4_AIE)**: AMD reference radix-4 Stockham FFT kernel for AIE-ML (Apache-2.0). `kernels/fft_stockham_f32.cc` is adapted from this source.
- **[hal-lab-u-tokyo/ntt-aie](https://github.com/hal-lab-u-tokyo/ntt-aie)**: NTT implementation and vectorization research on AMD AI Engine architectures.
- **[GiacomoPope/kyber-py](https://github.com/GiacomoPope/kyber-py)** (v1.0.1): Clean Python reference implementation of CRYSTALS-Kyber / FIPS 203.
- **[GiacomoPope/dilithium-py](https://github.com/GiacomoPope/dilithium-py)** (v1.4.0): Clean Python reference implementation of CRYSTALS-Dilithium / FIPS 204.
- **[pq-crystals reference implementations](https://github.com/pq-crystals)**: Official C reference implementations of Kyber and Dilithium.
- **[usnistgov/ACVP-Server](https://github.com/usnistgov/ACVP-Server)**: Official NIST Automated Cryptographic Validation Protocol test vectors (vendored in `tests/m32_mlkem/vectors/` and `tests/m33_mldsa/vectors/`).

### Standards & Academic Publications
- **[NIST FIPS 203](https://nvlpubs.nist.gov/nistpubs/fips/nist.fips.203.pdf)** ([DOI: 10.6028/NIST.FIPS.203](https://doi.org/10.6028/NIST.FIPS.203)): Module-Lattice-Based Key-Encapsulation Mechanism Standard (ML-KEM).
- **[NIST FIPS 204](https://nvlpubs.nist.gov/nistpubs/fips/nist.fips.204.pdf)** ([DOI: 10.6028/NIST.FIPS.204](https://doi.org/10.6028/NIST.FIPS.204)): Module-Lattice-Based Digital Signature Standard (ML-DSA).
- **[NIST FIPS 202](https://nvlpubs.nist.gov/nistpubs/fips/nist.fips.202.pdf)**: SHA-3 Standard: Permutation-Based Hash and Extendable-Output Functions (SHAKE128 / SHAKE256).
- **[Cooley & Tukey (1965)](https://garfield.library.upenn.edu/classics1993/A1993MJ84400001.pdf)**: *"An algorithm for the machine calculation of complex Fourier series"*, Math. Comp. 19, 297-301.
- **[Barrett (1986)](https://link.springer.com/chapter/10.1007/3-540-47721-7_24)**: *"Implementing the Rivest Shamir and Adleman Public Key Encryption Algorithm on a Standard Digital Signal Processor"*, Advances in Cryptology — CRYPTO '86.
- **[Stockham (1966)](https://dl.acm.org/doi/10.1145/1464182.1464209)**: *"High-speed convolution and correlation"*, AFIPS Spring Joint Computer Conf.
- **[Gentleman & Sande (1966)](https://dl.acm.org/doi/10.1145/1464291.1464352)**: *"Fast Fourier transforms: for fun and profit"*, AFIPS Fall Joint Computer Conf.
- **[Ozaki et al. (2012)](https://doi.org/10.1007/s11075-011-9478-1)**: *"Error-free transformation of matrix multiplication"*, Numerical Algorithms 59, 95–118.
- **[Higham (2002)](https://doi.org/10.1137/1.9780898718027)**: *Accuracy and Stability of Numerical Algorithms*, 2nd ed., SIAM.
- **[3GPP TS 38.104](https://www.3gpp.org/ftp/Specs/archive/38_series/38.104/)**: Base Station (BS) radio transmission and reception (EVM specifications for BPSK, QPSK, 16-QAM, 64-QAM).

---

## 7. Credits & Acknowledgments

- **Lead Architect & Maintainer:** Midhat Nashar ([@midhatn](https://github.com/midhatn)) — [GitHub Repository: midhatn/phoenix-sdr-dsp](https://github.com/midhatn/phoenix-sdr-dsp)
- **AI Architecture & Engineering Partner:** Perplexity AI (Senior AMD XDNA / AIE & DSP Copilot)
- **Upstream toolchain (Advanced Micro Devices, Inc. — formerly Xilinx):** [`mlir-aie`](https://github.com/Xilinx/mlir-aie), [`llvm-aie` (Peano)](https://github.com/Xilinx/llvm-aie), [`XRT`](https://github.com/Xilinx/XRT), [`xdna-driver`](https://github.com/amd/xdna-driver), and the [`FFT_R4_AIE`](https://github.com/diacccc/FFT_R4_AIE) radix-4 Stockham FFT reference (Apache-2.0).
- **Academic foundations:** J. W. Cooley & J. W. Tukey (1965) for the radix-2 FFT; P. Barrett (1986) for modular Barrett reduction.
- **Community references:** [`hal-lab-u-tokyo/ntt-aie`](https://github.com/hal-lab-u-tokyo/ntt-aie), [`GiacomoPope/kyber-py`](https://github.com/GiacomoPope/kyber-py), and [`GiacomoPope/dilithium-py`](https://github.com/GiacomoPope/dilithium-py).
- **License:** Apache License 2.0. See [LICENSE](LICENSE), [LICENSE_HISTORY.md](LICENSE_HISTORY.md), [NOTICE](NOTICE), [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md), and [THIRD_PARTY_PROVENANCE.md](THIRD_PARTY_PROVENANCE.md).

---

## 8. Citation

If you use this work, benchmarks, or software in your research or applications, please cite:

```bibtex
@software{nashar_phoenix_sdr_dsp_2026,
  author       = {Nashar, Midhat},
  title        = {{Phoenix SDR-DSP: Windows-Native DSP, SDR, and PQC Experiments for AMD Phoenix XDNA1}},
  year         = {2026},
  version      = {1.0.1},
  publisher    = {GitHub},
  journal      = {GitHub repository},
  url          = {https://github.com/midhatn/phoenix-sdr-dsp}
}
```

Or using [CITATION.cff](CITATION.cff) format:
```yaml
cff-version: 1.2.0
title: "Phoenix SDR-DSP: Windows-Native DSP, SDR, and PQC Experiments for AMD Phoenix XDNA1"
authors:
  - family-names: "Nashar"
    given-names: "Midhat"
    alias: "midhatn"
repository-code: "https://github.com/midhatn/phoenix-sdr-dsp"
version: "1.0.1"
date-released: "2026-08-18"
license: "Apache-2.0"
```
