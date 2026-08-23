# Journal Reproducibility Checklist

Use this checklist before submitting a manuscript or creating a release. A
checked box means evidence was retained, not merely observed in a terminal.

## Source and environment

- [ ] Record repository URL, branch, `git rev-parse HEAD`, and clean/dirty
  status from the exact clone.
- [ ] Record OS, PowerShell 7, Python, compiler, MLIR-AIE/IRON, XRT, NPU
  driver, and firmware versions when a physical run is claimed.
- [ ] Retain `toolchain.yaml`, the relevant package pins, and a list of any
  unresolved transitive dependency hashes.
- [ ] State the mathematical standard and exact algorithm/interface scope,
  citing [FIPS 202](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.202.pdf),
  [FIPS 203](https://nvlpubs.nist.gov/nistpubs/fips/nist.fips.203.pdf), or
  [FIPS 204](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.204.pdf) as
  appropriate.

## Source identity, hashes, and clean clone

- [ ] Verify `run_all_silicon_tests.py` SHA-256 equals
  `742591321ac5dc3069a51ded4e198905367f8dc6261df8c3ebae20b5e333fbad`.
- [ ] On the approved Phoenix target, open PowerShell in the clone and run
  `py .\install`. This clean-clone command installs the pinned dependencies
  and automatically invokes the canonical runner on success; retain its full
  transcript. Do not add an environment-activation or manual `pip install`
  step to this supported flow.
- [ ] Run
  `pwsh -File .\scripts\validate_clean_clone.ps1 -InstallHostDependencies`
  from a new clone as a normal user and retain its one timestamped report.
  The switch explicitly installs and verifies pinned `numpy==2.5.2`. Without
  it, a missing or mismatched NumPy installation must stop with an actionable
  refusal before the contract suite.
- [ ] Confirm the default report says NPU access is disabled and distinguish
  it from a physical result.
- [ ] Record the exact revision for every historical transcript referenced by
  a manuscript. The 34-entry 2026-08-17 result is historical
  mixed-backend evidence, not a current host audit.

## Host checks and physical-run safety

- [ ] Retain results for Python compilation, header inventory, host contracts,
  installer self-test, and any link/lint checks used for the release.
- [ ] Before physical execution, review the host report, correct target host,
  power/thermal policy, driver/toolchain compatibility, free storage, and
  operator authorization.
- [ ] Use `-RunSilicon` only on an approved Phoenix test host; it invokes the
  canonical runner and accesses the NPU.
- [ ] Do not describe a missing, skipped, reference-only, or host-only result
  as silicon validation.

## Raw evidence and statistical reporting

- [ ] Retain raw stdout/stderr, exit status, start/end time, command line,
  source hashes, vector identifiers, backend labels, and generated-artifact
  hashes for each physical run.
- [ ] For randomized or repeated work, report seed policy, number of
  repetitions, all outcomes, timing definition, summary statistic, dispersion,
  and outlier policy before examining results.
- [ ] State whether comparisons are bit-exact or give the numerical metric,
  tolerance, reference implementation, and units.
- [ ] Preserve failed, unavailable, and contradictory runs with the same
  metadata as passing runs. Negative results are release evidence.

## Citation and archive checklist

- [ ] Cite repository metadata from [`CITATION.cff`](../CITATION.cff) and cite
  primary standards at the claim site with their URLs.
- [ ] Cite the dated [M33 validation record](M33_SILICON_VALIDATION_20260817.md)
  and [validation errata](V1_0_0_VALIDATION_ERRATA.md) when using the 34-entry
  historical count.
- [ ] Verify every manuscript figure/table has an evidence path, source
  revision, and scope label (host, direct hardware, or host/NPU composition).
- [ ] Do not claim a Zenodo DOI, immutable archive, conformance,
  certification, constant-time behavior, or complete device residency unless
  separately established and cited.
