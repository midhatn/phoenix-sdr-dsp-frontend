# Documentation

Project documentation is organized separately from the repository landing page.

## Milestones and Mathematics

Read [M0–M33 Milestones and Mathematics](MILESTONES_AND_MATHEMATICS.md) for the native Windows platform overview, milestone map, DSP equations, finite-field and NTT mathematics, validated parameters, regression coverage, and correctness checklist. This covers the full v1.0.0 milestone set:

- **M0 – M15** — SDR pipeline (FIR, mixer, power, demod, 4-column parallel) and NTT lattice cryptography ([Barrett 1986](https://link.springer.com/chapter/10.1007/3-540-47721-7_24), radix-2 NTT butterflies, 16/256-point NTT/INTT, cyclic polynomial multiplication mod `q = 3329` per [FIPS 203](https://nvlpubs.nist.gov/nistpubs/fips/nist.fips.203.pdf)).
- **M15b** — negacyclic polynomial multiplication in the Kyber / ML-KEM ring `Z_3329[x]/(x^256+1)` ([Kyber spec](https://pq-crystals.org/kyber/data/kyber-specification-round3-20210804.pdf); [Isabelle/AFP](https://isa-afp.org/browser_info/current/AFP/CRYSTALS-Kyber/outline.pdf); silicon-validated, bit-exact).
- **M16** — CPU FFT/IFFT reference ([Cooley–Tukey 1965](https://garfield.library.upenn.edu/classics1993/A1993MJ84400001.pdf); [NumPy `fft`](https://numpy.org/doc/stable/reference/generated/numpy.fft.fft.html)).
- **M17** — Radix-4 [Stockham](https://dl.acm.org/doi/10.1145/1464182.1464209) FFT kernel on Phoenix NPU silicon, adapted from [FFT_R4_AIE](https://github.com/diacccc/FFT_R4_AIE).
- **M17-parallel (M17p)** — 4-column parallel FFT scaling of M17 ([Phoenix 4×5 XDNA1](https://docs.kernel.org/accel/amdxdna/amdnpu.html)) using the same ObjectFifo/`iron.Runtime` pattern as M9/M9b.
- **M19 – M23** — filtering track: 8-tap complex FIR, fused polyphase decimator + interpolator, fused DDC, fused DUC, and M-path polyphase channelizer. Silicon-validated, bit-exact.
- **M24 – M27** — modulation and synchronization track: fused [Barker-13](https://en.wikipedia.org/wiki/Barker_code) matched-filter correlator, BPSK/QPSK receiver (Gardner TED + Costas), QAM-16 receiver with soft-decision LLR demapping, and OFDM loopback ([3GPP TS 38.211](https://www.3gpp.org/ftp/Specs/archive/38_series/38.211/38211-i50.zip), [IEEE 802.11-2020](https://ieeexplore.ieee.org/document/9363693), [Van de Beek 1995](https://ieeexplore.ieee.org/document/456405), [Edfors 1998](https://ieeexplore.ieee.org/document/725572)).
- **M32 (v1.0.0)** — Post-Quantum Cryptography, [FIPS 203](https://nvlpubs.nist.gov/nistpubs/fips/nist.fips.203.pdf) ML-KEM. M32b/c/d are hardware-backed; M32e covers the ML-KEM-512 internal deterministic interfaces (Algorithms 16–18) with 60 host KATs and three silicon vectors for each internal KeyGen, Encaps, and Decaps path. It does not establish public Algorithms 19–21 coverage. Reference oracle: [`kyber-py` 1.0.1](https://github.com/GiacomoPope/kyber-py).
- **M33 (native primitives plus hybrid composers)** — Post-Quantum Cryptography, [FIPS 204](https://nvlpubs.nist.gov/nistpubs/fips/nist.fips.204.pdf) ML-DSA. M33a/b are native silicon primitive gates; M33d/e are host/NPU KeyGen, Sign, and Verify composers using those backends. Reference oracle: [`dilithium-py` 1.4.0](https://github.com/GiacomoPope/dilithium-py). Full boundary: [PQC_COMPLETE_V1.md](PQC_COMPLETE_V1.md).
- **I/Q throughput demo** — `tests/npu_visible/` (not in the 34-invocation suite). Measured 7.459 Msps / 29.84 MB/s I/Q in on a [10 TOPS](https://www.amd.com/en/products/processors/laptop/ryzen/7000-series/amd-ryzen-9-7940hs.html) Phoenix NPU1.

## Related documents

- [ROADMAP.md](ROADMAP.md) — current status, milestone table, next-step planning, and toolchain events.
- [PQC_COMPLETE_V1.md](PQC_COMPLETE_V1.md) — v1.0.0 Post-Quantum Cryptography release summary (M32 ML-KEM + M33 ML-DSA closure).
- [M32_FIPS203_MLKEM.md](M32_FIPS203_MLKEM.md) — historical FIPS 203 ML-KEM planning note; current M32 boundary is summarized above and in [PQC_COMPLETE_V1.md](PQC_COMPLETE_V1.md).
- [history/README.md](history/README.md) — dated design, handoff, and audit
  records retained as historical evidence rather than current specifications.
- [AUDIT_REMEDIATION_20260818.md](AUDIT_REMEDIATION_20260818.md) — integrated
  audit findings, host-safe fixes, deletion ledger, validation, and deferred
  release/hardware work.
- Root [Installation](../README.md#installation) — new-user path: clone, then `py .\install`; it installs the pinned stack and automatically runs the canonical regression.
- [SETUP_WINDOWS.md](SETUP_WINDOWS.md) — longer native Windows walkthrough (XRT, mlir-aie, Peano, ironenv).
- [M2_TOOLCHAIN_PIN.md](M2_TOOLCHAIN_PIN.md) — reason for pinning mlir-aie at commit `3ca0193` (v1.4.1 + 13 commits, includes upstream PR #3545 `run_chain` fix required by parallel-DMA milestones).

## Validation boundary

The documentation distinguishes direct physical-NPU validation, host/NPU composition, and host/reference work. The runner contains **34 invocations**: 29 direct-hardware entries, four host/NPU composer entries, and one intentional CPU reference entry (M12). The corrected matrix completed **34/34 PASS** on 2026-08-17, but this mixed-backend result is not a claim that all 34 workloads are fully device-resident. `kyber-py`, `dilithium-py`, and `pytest` are version-pinned; the full transitive dependency closure remains unhashed, so the bootstrap is not yet fully dependency-reproducible. SHAKE / SHA-3 host operations use CPython [`hashlib`](https://docs.python.org/3/library/hashlib.html). See [`M33_SILICON_VALIDATION_20260817.md`](M33_SILICON_VALIDATION_20260817.md).

## Release and publication materials

- [Publication readiness](PUBLICATION_READINESS.md) — claim/evidence matrix,
  current validation boundaries, retention, blockers, and release policy.
- [Journal reproducibility checklist](JOURNAL_REPRODUCIBILITY_CHECKLIST.md) —
  manuscript-ready source, environment, evidence, statistical, and citation
  checklist.
- [`../scripts/validate_clean_clone.ps1`](../scripts/validate_clean_clone.ps1)
  — normal-user PowerShell 7 clean-clone audit. Its default path is host-safe;
  `-RunSilicon` is a separate, explicit NPU-dispatch action.
- `tests/test_release_materials_contract.py` — host-safe release-material
  contracts, including a maintained-Markdown math-rendering guard. Archived
  evidence under `history/` is intentionally excluded from that current-source
  check.
