# Security Policy

## Research and cryptography boundary

Phoenix SDR-DSP is a research and validation corpus, **not a production
cryptographic library**. The M32 ML-KEM and M33 ML-DSA work exercises selected
internal deterministic interfaces and host/NPU compositions; it does not claim
deployment-ready public API coverage, constant-time behavior, side-channel
resistance, fault resistance, secure key storage, or certification.

Do not use this repository to protect production traffic, signatures, keys, or
other secrets. In particular, its known-answer-vector checks are not a
substitute for ACVP/CAVP/CMVP validation. FIPS 203 defines ML-KEM internal
interfaces separately from application-facing algorithms, and FIPS 204 states
that ML-DSA internal interfaces are for validation testing rather than
applications: https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.203.pdf and
https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.204.pdf.

## Reporting a Vulnerability

If you discover a security vulnerability in Phoenix SDR-DSP, please **do not**
open a public GitHub issue. Instead, report it privately so it can be
investigated and disclosed responsibly.

### How to report

Preferred: use GitHub's **Private Vulnerability Reporting**
(Security tab → "Report a vulnerability"). Process: [GitHub Docs — privately reporting a security vulnerability](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability).

Alternative: email **medhat.nashar@gmail.com** with the subject line
`[phoenix-sdr-dsp SECURITY]`.

Please include, if possible:

- A description of the vulnerability and its potential impact
- Steps to reproduce (host OS/build, NPU driver + firmware version, XRT
  version, milestone / test file, sample inputs)
- Any proof-of-concept code, kernel dump, or `xrt-smi` capture
- Your name/handle for acknowledgment (or "anonymous" if preferred)

You should receive an initial response within **7 days**. If the issue is
confirmed, we will work on a fix and coordinate a disclosure timeline with you.

## Scope

**In scope:**

- Kernel logic bugs in `include/sdr_dsp/*.hpp` and `tests/m*/` (incorrect
  modular arithmetic, NTT twiddle stride errors, off-by-one indexing, buffer
  overruns in AIE tile local memory).
- Host-side XRT dispatch logic in test drivers (`test_*_m*.py`) that could
  crash the NPU, corrupt DMA buffers, or hang XRT.
- Numerical correctness regressions that break bit-exact verification against
  reference implementations.
- Reproducibility issues in the pinned toolchain record (`toolchain.yaml`, the
  `install` launcher and its internal implementation, or the compatibility
  bootstrap wrapper).

**Out of scope (report upstream):**

- Bugs in the AMD XDNA driver → https://github.com/amd/xdna-driver
- Bugs in MLIR-AIE / IRON → https://github.com/Xilinx/mlir-aie
- Bugs in LLVM Peano → https://github.com/Xilinx/llvm-aie
- Bugs in XRT itself → https://github.com/Xilinx/XRT

## Supported Versions

Only the latest `main` branch receives security fixes. Once tagged releases
exist, this table will list supported versions.

| Version | Supported          |
| ------- | ------------------ |
| main    | :white_check_mark: |

## Safe Harbor

Good-faith security research conducted according to this policy will not
result in legal action from the maintainer. We consider "good faith" to include:

- Avoiding privacy violations, destruction of data, and disruption to others.
- Only interacting with test accounts and hardware you own or have explicit
  permission to test.
- Giving reasonable time to remediate before public disclosure.
