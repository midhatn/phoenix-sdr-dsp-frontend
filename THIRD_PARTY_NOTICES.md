# Third-party notices and provenance

This file inventories third-party material distributed in this repository.
The root Apache License 2.0 applies to original Phoenix SDR-DSP work that does
not declare another license. Files carrying their own notices remain subject
to those notices.

## Distributed source

| Path | Origin and provenance | License / notice |
|---|---|---|
| `kernels/fft_stockham_f32.cc` | Adapted from AMD-authored [`diacccc/FFT_R4_AIE`](https://github.com/diacccc/FFT_R4_AIE), as identified in the file header and [`CITATION.cff`](CITATION.cff). | Apache License 2.0 with LLVM Exceptions; retain the file-level copyright, SPDX identifier, and attribution. The Apache 2.0 text is included in [`LICENSES/Apache-2.0.txt`](LICENSES/Apache-2.0.txt). |
| `tests/m3_saxpy/saxpy.cc` | Exact copy of the AMD/Xilinx MLIR-AIE source pinned in [`THIRD_PARTY_PROVENANCE.md`](THIRD_PARTY_PROVENANCE.md). | `Apache-2.0 WITH LLVM-exception`; retain the file-level copyright and SPDX identifier. |
| `tests/m17_radix2_fft/twiddles_r4_stockham.py` | Derives its packed-twiddle layout from [`diacccc/FFT_R4_AIE`](https://github.com/diacccc/FFT_R4_AIE), with an immutable comparison anchor and local hash recorded in [`THIRD_PARTY_PROVENANCE.md`](THIRD_PARTY_PROVENANCE.md). | `Apache-2.0 WITH LLVM-exception`; retain the file-level license and attribution. |
| `tests/m17_radix2_fft/fft64_r4_wrapper.cc` | Original thin wrapper that textually includes the separately listed `kernels/fft_stockham_f32.cc` derivative. | `Apache-2.0 WITH LLVM-exception`; redistribution must also retain the included kernel's AMD attribution and notice. |
| `tests/m32_mlkem/kpke_kernel.cc` | Declares a line-for-line pq-crystals Kyber reference transliteration in its file header. The local hash, upstream comparison anchor, and exactness limitation are recorded in [`THIRD_PARTY_PROVENANCE.md`](THIRD_PARTY_PROVENANCE.md). | MIT; retain the file-level SPDX identifier. The previously applicable project MIT text is preserved at [`LICENSES/MIT.txt`](LICENSES/MIT.txt). |

## Test-vector provenance

The ML-KEM and ML-DSA JSON vectors under `tests/m32_mlkem/vectors/` and
`tests/m33_mldsa/vectors/` are retained test data from the
[NIST ACVP-Server Gen/Vals repository](https://github.com/usnistgov/ACVP-Server).
Their exact upstream commit, upstream and local SHA-256 values, extraction
status, NIST notice, and modification statement are recorded in
[`THIRD_PARTY_PROVENANCE.md`](THIRD_PARTY_PROVENANCE.md).

## Dependencies not redistributed

MLIR-AIE/IRON, XRT, LLVM-AIE/Peano, `kyber-py`, and `dilithium-py` are obtained
externally by the bootstrap or user environment and are not copied into this
repository. Their versions and acquisition URLs are recorded in
[`toolchain.yaml`](toolchain.yaml) and
[`requirements/toolchain-versions.md`](requirements/toolchain-versions.md);
their licenses must be reviewed from their upstream distributions.

## Maintenance policy

When adding imported code or test data:

1. retain upstream copyright and license notices in the imported file;
2. add its path, immutable origin URL/revision, and license expression here;
3. add the license text under `LICENSES/` when the license requires or
   benefits from local redistribution; and
4. do not replace a file-specific SPDX expression with the project-wide Apache-2.0
   identifier.

SPDX guidance on file-level identifiers:
https://spdx.dev/learn/handling-license-info/
