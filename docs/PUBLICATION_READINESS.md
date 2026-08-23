# Publication Readiness

## Purpose and source identity

This maintained release note separates what the repository can demonstrate
from what requires a new controlled physical run. It applies to the public
Phoenix SDR-DSP repository and must be read with the dated
[M33 validation record](M33_SILICON_VALIDATION_20260817.md), the
[v1.0.0 validation errata](V1_0_0_VALIDATION_ERRATA.md), and
[toolchain record](../toolchain.yaml). It does not create an archive DOI or
claim that an immutable third-party archive exists.

The mathematical and standards context is the already cited [NIST FIPS 202
SHA-3 standard](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.202.pdf),
[NIST FIPS 203 ML-KEM standard](https://nvlpubs.nist.gov/nistpubs/fips/nist.fips.203.pdf),
and [NIST FIPS 204 ML-DSA standard](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.204.pdf).
For example, the ML-KEM ring notation used by the project is
$R_q = \mathbb{Z}_{3329}[x]/(x^{256}+1)$; the release materials do not
extend the algorithmic claims beyond the tracked tests and records.

## Claim and evidence matrix

| Proposed claim | Supporting tracked evidence | Validated boundary | Not established |
| --- | --- | --- | --- |
| Host source is syntactically valid and its public-header and runner policies can be checked without an NPU. | `scripts/validate_clean_clone.ps1`, `include/sdr_dsp/verify_m4_headers.py`, `tests/test_m33_native_runner_contract.py`, and `tests/test_regression_validation.py`. | A current host-safe audit of the checked-out source and selected contracts. | Native compilation, XRT behavior, performance, or physical execution. |
| The canonical silicon runner is the historically audited file. | SHA-256 `742591321ac5dc3069a51ded4e198905367f8dc6261df8c3ebae20b5e333fbad` checked by the clean-clone script. | File identity only. | That a run was performed on the current checkout or a particular machine. |
| The dated 2026-08-17 regression record reports 34/34 mixed-backend passes. | [M33 validation record](M33_SILICON_VALIDATION_20260817.md) and [validation errata](V1_0_0_VALIDATION_ERRATA.md). | Historical result: 29 direct-hardware entries, four host/NPU composers, and one intentional CPU-reference entry. | A present-day physical result, 34 fully device-resident workloads, or a general performance claim. |
| M32b/c/d and M33a/b have their documented native boundaries; M32e and M33d/e have host/NPU composition boundaries. | [PQC release boundary](PQC_COMPLETE_V1.md), per-milestone designs, and the validation records. | Only the exact primitive or composer scope recorded there. | Complete ML-KEM public-interface coverage, complete device residency, FIPS conformance, certification, constant-time behavior, or side-channel claims. |

## Exact validated and unvalidated boundaries

- **Current host-safe audit:** validates Git identity/status capture, Python
  compilation, the public-header inventory, selected Python contracts, the
  installer self-test, and the canonical runner hash. It deliberately does
  not load XRT, inspect an NPU, build an AIE program, or run a silicon test.
- **Historical physical evidence:** the 34-entry `34/34 PASS` result is dated
  evidence from 2026-08-17. Its mixed backend accounting is part of the claim;
  it must not be summarized as a new clean-drive result or as fully on-tile
  validation.
- **Design boundary:** M32e exercises ML-KEM-512 internal deterministic
  interfaces, while M33d/e are host-orchestrated composers. These boundaries
  are detailed in [PQC_COMPLETE_V1.md](PQC_COMPLETE_V1.md) and should be
  retained in any paper table or abstract.
- **Unvalidated here:** this release material does not validate external
  ML-KEM Algorithms 19--21, a fully device-resident ML-DSA implementation,
  reproducible performance, security properties, or a complete hash-locked
  dependency environment.

## Clean-drive protocol

1. Clone the intended revision to a new directory on the target drive; record
   the remote URL and `git rev-parse HEAD`.
2. In normal-user PowerShell 7, run
   `pwsh -File .\scripts\validate_clean_clone.ps1
   -InstallHostDependencies`. The explicit switch installs and verifies
   pinned `numpy==2.5.2`; the validation path remains host-safe and writes
   exactly one timestamped text report below ignored
   `release-evidence/clean-clone/`.
3. Archive that report with the unmodified clone's commit, `git status
   --short --branch`, tool versions, and the SHA-256 of the canonical runner.
4. Only after an approved hardware operator has reviewed the host report,
   execute `pwsh -File .\scripts\validate_clean_clone.ps1 -RunSilicon` on the
   named Phoenix test host. This action accesses the NPU and invokes the
   canonical runner without modifying it.
5. Retain the complete native transcript, generated-program identifiers,
   toolchain/driver versions, raw vectors, and exit status. Label a failed,
   skipped, or unavailable native run as such; do not replace it with a host
   result.

## Artifact retention, citations, and reporting

Keep the raw text report, native transcript where applicable, source commit,
`toolchain.yaml`, relevant vector hashes, and any generated binary/hash data
outside the repository's ignored evidence directory in the institutional
retention location. The ignored directory is a working-output location, not
an archive.

Every manuscript claim should cite a source URL adjacent to the claim:
[FIPS 202](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.202.pdf) for
SHA-3/SHAKE, [FIPS 203](https://nvlpubs.nist.gov/nistpubs/fips/nist.fips.203.pdf)
for ML-KEM, [FIPS 204](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.204.pdf)
for ML-DSA, and the repository's [`CITATION.cff`](../CITATION.cff) for this
software release. Cite the dated validation record for historical counts and
state its date and mixed-backend scope.

Report test-vector count, pass/fail/skip count, backend label, repetitions,
timing method, hardware and driver identity, and numerical tolerance or
bit-exact criterion. Retain negative results and discrepancies; they are not
to be omitted from a release comparison.

## Remaining publication blockers

1. A newly witnessed clean-drive physical run tied to the release commit and
   retained raw transcript.
2. A fully pinned, hash-verified transitive dependency closure, including the
   deferred packages identified in the audit record.
3. Complete provenance/hashes for retained validation vectors and any
   generated physical artifacts intended to support a paper.
4. Explicit protocol and reporting for performance replication rather than
   reuse of a historical timing.
5. Review of terminology so historical mixed-backend evidence is not promoted
   to complete residency, conformance, or certification.

## Release and tag policy

### Clean-drive RC.1 result

The first independent Windows clean-drive execution of `v1.0.1-rc.1` on
2026-08-18 used PowerShell 7.6.5, Git 2.48.1.windows.1, and Python 3.13.15.
Repository identity, Python compilation, the public-header inventory, and the
canonical-runner SHA-256 gate passed. The host-contract stage then stopped
before hardware access because system Python did not contain NumPy. This is a
prerequisite failure, not a passed host or silicon validation. The timestamped
failure report is part of the release-candidate evidence, and RC.2 adds an
explicit pinned-dependency installation switch rather than rewriting RC.1.

Use an annotated release-candidate tag only after the host-safe report and
reviewed diff are retained. The tag message must identify the exact commit,
say whether the NPU path was run, and link or otherwise identify the retained
evidence location; it must not state that a DOI or immutable archive exists.

Promote an RC only when no protected runner change is present, the hash is
the value above, required host checks pass, and all physical claims remain
bounded to their dated evidence. A final release additionally requires the
publication blockers applicable to its claims to be closed or explicitly
listed as limitations.
