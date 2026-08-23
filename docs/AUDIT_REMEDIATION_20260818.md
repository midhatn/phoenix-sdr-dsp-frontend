# Repository audit and host-safe remediation — 2026-08-18

## Scope and evidence

This remediation integrates the 2026-08-18 documentation audit, engineering
audit, and source-validation matrix against repository revision
`4ced500ccd139b734bab3bb5fc2306268092df29`. It makes only corrections
verifiable from tracked source, host-safe tests, or the cited primary sources.
No NPU, XRT, Peano, Windows, download, or silicon regression execution was
performed. `run_all_silicon_tests.py` was intentionally not modified.

Normative and provenance sources used for the corrections:

- NIST, [FIPS 202 — SHA-3 Standard](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.202.pdf).
- NIST, [FIPS 203 — ML-KEM](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.203.pdf),
  especially Algorithms 9–10, 13–18, and 19–21.
- NIST, [FIPS 204 — ML-DSA](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.204.pdf),
  including its internal-interface boundary.
- Linux kernel, [AMD NPU / amdxdna documentation](https://docs.kernel.org/accel/amdxdna/amdnpu.html)
  for the Phoenix 4×5 topology wording.
- NIST, [ACVP-Server Gen/Vals repository](https://github.com/usnistgov/ACVP-Server)
  for the recorded vector provenance boundary.
- SPDX, [handling license information](https://spdx.dev/learn/handling-license-info/)
  and the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).
- GitHub Docs, [Writing mathematical expressions](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/writing-mathematical-expressions)
  for supported Markdown math delimiters.

## Implemented corrections

| Area | Change | Evidence / boundary |
|---|---|---|
| Public modular arithmetic | Removed signed-overflow and implementation-defined negative-shift behavior from `montgomery_reduce_scalar`; made canonical reduction explicit for the full `int32_t` domain with `int64_t` intermediates; added a 10,010-case host property test compiled with UBSan. | The previous signed arithmetic overflowed inside the helper. The new test includes `INT32_MIN`, `INT32_MAX`, `2147483638`, near-boundary values, and deterministic full-domain samples against an independent `int64_t` reference. This changes a host-testable header only; no AIE dispatch was run. |
| Public header verification | `verify_m4_headers.py` now checks `modular_arithmetic.hpp`, reports all missing headers, and exits nonzero on failure. | The former tool only printed missing files and always reported success. |
| CI, without hardware | Added a host-only job for public-header inventory, M33/runner contract tests, installer self-test, and the UBSan modular-header test; pinned `actions/checkout` 7.0.1, `actions/setup-python` 7.0.0, and markdown-link-check 1.0.17 to supplied immutable SHAs with version comments; pinned validated CI packages (`ruff==0.16.3`, `cffconvert==2.0.0`, `PyYAML==6.0.3`, `numpy==2.5.2`). | No job calls the protected silicon runner or an AIE/XRT dispatch. `ml_dtypes`, the onboarding `llvm-aie` path, and transitive dependency hashes remain deferred. |
| Bootstrap guidance | Replaced rolling `mlir-aie`/nightly `llvm-aie` repair logic with a PowerShell compatibility wrapper that delegates to hash-checked `install.py`; current contribution guidance now names `install.py` as the supported path. | The old path contradicted the pinned MLIR-AIE checkout and wheel documented in `toolchain.yaml`. |
| Counts and scope | Updated current-facing 12/12, 16/16, and 33/33 guidance to the documented 34-invocation mixed-backend boundary; marked the `toolchain.yaml` 16/16 result as historical. | The protected runner contains 34 entries. This does not assert a new hardware result. |
| ML-KEM claims | Narrowed M32e current-facing language to ML-KEM-512 internal deterministic interfaces (FIPS 203 Algorithms 16–18); removed public Algorithms 19–21 and all-parameter-set claims from current ledgers. | Tracked test code calls `mlkem_*_internal` and filters ML-KEM-512 vectors. FIPS 203 distinguishes Algorithms 16–18 from 19–21. |
| Security boundary | Added an explicit research-only / non-production PQC warning to `SECURITY.md`, including no constant-time, side-channel, secure-key-storage, public-API, or certification claim. | This narrows the project claim; it does not claim a security property. |
| DSP/math terminology | Corrected the M19 causal reference pseudocode and bfloat16 wording; M20 tap-product count; M21 LO sign convention; M22 inverse wording; M23 DFT/bfloat16 wording; M24 causal correlation identity, delay, and Barker 13:1 / 22.28 dB ratio; M27 channel/FFT-order/noise/EVM documentation. | Corrections follow the tracked source/test shape or direct arithmetic. M26 LLR notation remains deferred because it needs a source/test-owner reconciliation. |
| M33 host boundary | Corrected M33d/e pseudocode comments so SHAKE/sampling are described as the current host path rather than M32c dispatch. | Tracked composer documentation and source describe M32c as not dispatched by the M33 composer. |
| Links and historical records | Repaired M27’s M17-v3 links, removed the missing master-prompt link as a current dependency, moved the citation audit and M33 handoff into `docs/history/`, and added historical banners/indexing. | Historical text is preserved instead of rewritten as current validation evidence. |
| Markdown math rendering | Normalized maintained prose math from `\(...\)` / `\[...\]` to GitHub-supported `$...$` / `$$...$$`, while excluding fenced and inline code; no mathematical content changed. | GitHub’s [mathematical-expression syntax](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/writing-mathematical-expressions) documents `$...$`, `$$...$$`, and fenced math. |
| Release dependency hardening | Pinned `pytest==9.1.1` in the installer/toolchain document and pinned supplied CI package versions (`ruff`, `cffconvert`, `PyYAML`, `numpy`) without claiming hash locking. | The full transitive dependency closure remains unhashed; `ml_dtypes` is explicitly deferred pending a validated version. |
| Licensing/provenance | Added `THIRD_PARTY_NOTICES.md` and the Apache 2.0 license text for the attributed FFT source. | The distributed FFT file already declares `Apache-2.0 WITH LLVM-exception`; the inventory preserves that file-level notice and identifies remaining provenance gaps. |

## Deletion and archival ledger

| Action | Path | Basis |
|---|---|---|
| Deleted | `scripts/activate_ironenv.ps1` | No tracked reference and its hard-coded XRT paths conflicted with the checkout-local runner/installer model. No supported workflow required it. |
| Deleted | `tests/m10_modular/modular_arithmetic.hpp` | Unreferenced divergent duplicate. The M10 kernel includes the public header; useful scalar-header context was retained and improved in `include/sdr_dsp/modular_arithmetic.hpp`. |
| Moved, content retained | `docs/CITATION_AUDIT.md` → `docs/history/CITATION_AUDIT_20260815.md` | Dated audit said a local laptop was the source of truth; it is historical evidence, not current guidance. |
| Moved, content retained | `M33_SILICON_HANDOFF_20260817.md` → `docs/history/M33_SILICON_HANDOFF_20260817.md` | Dated handoff contains pre-current-main operational context. |

No hardware kernels, test vectors, canonical runner entries, or source
validation artifacts were deleted.

## Host-safe validation performed

| Check | Result |
|---|---|
| `python -m py_compile` over tracked Python | Passed. |
| `ruff check .` | Passed. |
| `python include/sdr_dsp/verify_m4_headers.py` | Passed; all five expected public headers present. |
| M33 and runner host contracts | 19/19 `unittest` cases passed. |
| `python install.py --self-test` | Passed using temporary local files only. |
| Public modular-header property test | Passed 10,010 full-domain cases under signed-integer-overflow UBSan. |
| Existing M33 Montgomery host verifier | Passed 256/256 cases. |
| M12 NTT and M16 FFT CPU references | Passed. |
| All tracked JSON/YAML parsing and `cffconvert --validate` | Passed. |
| CI action and direct dependency pin static check | Passed: supplied immutable GitHub Action SHAs and direct package pins are present in the workflow/installer/toolchain docs. |
| Local Markdown-link validation | Passed: 46 Markdown files, 213 inline local links, zero broken local links. |
| Markdown math delimiter check | Passed: no maintained-prose `\(...\)` or `\[...\]` delimiters remain outside code; GitHub-supported `$...$` and `$$...$$` are used. |
| `git diff --check` and canonical-runner guard | Passed; `run_all_silicon_tests.py` has no diff. |
| `ruff format --check .` | Still reports 55 files requiring formatting. This pre-existing advisory gate was not mass-formatted in a remediation pass, especially not for protected/high-risk files. |

## Deferred items and remaining blockers

1. **Hardware validation remains required.** This pass did not run the
   protected 34-entry runner and did not modify its behavior, timeouts, output
   parsing, or validation claims.
2. **M26 LLR mapping is not corrected here.** Its bit-label, LLR sign,
   normalization, and decoder convention require an authoritative mapping plus
   exhaustive source/test vectors before any equation is changed.
3. **M27 source behavior is unchanged.** The documentation now accurately
   limits the post-equalizer AWGN diagnostic. A true noisy-channel/RX test and
   an EVM acceptance definition require a new validated test design.
4. **Full package reproducibility is not solved.** Direct `pytest` and
   validated CI package versions are pinned, and the supplied GitHub Action
   SHAs are immutable, but the transitive Python dependency closure remains
   unhashed. `ml_dtypes` and the onboarding `llvm-aie` acquisition path still
   need validated pins/hashes.
5. **Validation provenance remains incomplete.** The recorded 34/34 result
   lacks a committed clean-source manifest, exact package/vector hashes, and a
   retained raw transcript. No such evidence was fabricated.
6. **License provenance is improved, not complete.** The FFT Apache notice is
   inventoried locally, but the exact upstream revision and LLVM-exception
   notice provenance, plus ACVP vector tree hash, still need release-engineering
   review.
7. **Historical notebooks remain intentionally available.** They have banners
   or archival placement; publication work should continue separating a concise
   current specification from exploratory evidence.
