# Third-party provenance manifest

This manifest binds redistributed third-party or derivative material to local
SHA-256 identities and immutable upstream records. It supplements
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md); file-level notices and SPDX
identifiers remain authoritative.

## Confidence labels

- **Exact copy** means the local bytes equal the identified upstream file.
- **Verified extraction** means the local JSON is a documented subset or
  formatting-only transformation of data at the identified upstream commit,
  verified by parsed JSON comparison.
- **Comparison anchor** means the immutable upstream revision is suitable for
  reviewing the declared lineage, but the available repository history does
  not prove that it was the historical source used to create the local file.

No comparison anchor should be represented as an exact source revision.

## Upstream anchors

| ID | Upstream and immutable revision | License / notice | Confidence |
| --- | --- | --- | --- |
| `MLIR-AIE-SAXPY` | Xilinx/AMD MLIR-AIE commit [`3ca0193cea9e2c39ec670a65f93e1dd43c969f22`](https://github.com/Xilinx/mlir-aie/commit/3ca0193cea9e2c39ec670a65f93e1dd43c969f22), file [`programming_examples/getting_started/01_SAXPY/saxpy.cc`](https://github.com/Xilinx/mlir-aie/blob/3ca0193cea9e2c39ec670a65f93e1dd43c969f22/programming_examples/getting_started/01_SAXPY/saxpy.cc). | `Apache-2.0 WITH LLVM-exception`; retain the AMD copyright and SPDX notice. | Exact copy. |
| `FFT-R4-AIE` | diacccc/FFT_R4_AIE commit [`8d6f6dbe38b48e03d7d657fc73c544df78678400`](https://github.com/diacccc/FFT_R4_AIE/commit/8d6f6dbe38b48e03d7d657fc73c544df78678400), including [`kernels/fft_stockham_f32.cc`](https://github.com/diacccc/FFT_R4_AIE/blob/8d6f6dbe38b48e03d7d657fc73c544df78678400/kernels/fft_stockham_f32.cc) and [`test.cpp`](https://github.com/diacccc/FFT_R4_AIE/blob/8d6f6dbe38b48e03d7d657fc73c544df78678400/test.cpp). | `Apache-2.0 WITH LLVM-exception`; retain the file-level notice and AMD attribution. | Comparison anchor for the adapted kernel and twiddle layout. |
| `KYBER-REF` | pq-crystals/kyber commit [`3edd5af5991927164edd4aacebfcbee00b8064e7`](https://github.com/pq-crystals/kyber/commit/3edd5af5991927164edd4aacebfcbee00b8064e7), reference tree [`ref/`](https://github.com/pq-crystals/kyber/tree/3edd5af5991927164edd4aacebfcbee00b8064e7/ref), and [`LICENSE`](https://github.com/pq-crystals/kyber/blob/3edd5af5991927164edd4aacebfcbee00b8064e7/LICENSE). | Upstream offers CC0 or Apache-2.0 for its code and identifies separately attributed public-domain Keccak/AES code. Local file-level licenses are retained; this manifest does not relicense a file. | Comparison anchor only. Exact historical derivation revision is unproven. |
| `DILITHIUM-REF` | pq-crystals/dilithium commit [`d35ba3fe5449bee3e6d43e1f296c3ca818bd36be`](https://github.com/pq-crystals/dilithium/commit/d35ba3fe5449bee3e6d43e1f296c3ca818bd36be), reference tree [`ref/`](https://github.com/pq-crystals/dilithium/tree/d35ba3fe5449bee3e6d43e1f296c3ca818bd36be/ref), and [`LICENSE`](https://github.com/pq-crystals/dilithium/blob/d35ba3fe5449bee3e6d43e1f296c3ca818bd36be/LICENSE). | Upstream offers CC0, Apache-2.0, or GPL-2.0 for its code and identifies separately attributed public-domain Keccak/random code. Local file-level licenses are retained; this manifest does not relicense a file. | Comparison anchor only. Exact historical derivation revision is unproven. |
| `NIST-ACVP-975DE31` | usnistgov/ACVP-Server commit [`975de31eb83d87039ec88934fdc47d8c312b892d`](https://github.com/usnistgov/ACVP-Server/commit/975de31eb83d87039ec88934fdc47d8c312b892d), generated-vector tree [`gen-val/json-files`](https://github.com/usnistgov/ACVP-Server/tree/975de31eb83d87039ec88934fdc47d8c312b892d/gen-val/json-files), and repository [`README.md`](https://github.com/usnistgov/ACVP-Server/blob/975de31eb83d87039ec88934fdc47d8c312b892d/README.md#license). | Retain [`LICENSES/NIST-ACVP-NOTICE.txt`](LICENSES/NIST-ACVP-NOTICE.txt), identify modifications with date and nature, and acknowledge NIST as the source. NIST-developed software is not subject to U.S. copyright protection and is provided as-is. | Verified extraction for the ten vectors below. |

## Local source inventory

Hashes identify the redistributed local bytes in this revision. “Adapted” means
the file contains project-specific structure, interfaces, tests, or comments
and is not asserted to be an upstream byte copy.

| Local path | SHA-256 | Anchor | Local relationship |
| --- | --- | --- | --- |
| `tests/m3_saxpy/saxpy.cc` | `f037dc6f0c45452a28a3ad8059a299ccc1ab94461c822b67bbe85fccdf8e5cbc` | `MLIR-AIE-SAXPY` | Exact copy; upstream hash is identical. |
| `kernels/fft_stockham_f32.cc` | `8feff7b7c4df8d62d59ed5fc941dcce9b8ddfe13ec68599d4b426b7d975b7709` | `FFT-R4-AIE` | Adapted AIE2p kernel; not byte-identical. |
| `tests/m17_radix2_fft/twiddles_r4_stockham.py` | `4be2f213dea6bb7244df86a571ba815dbed963cc79f46d340929757c491e7dac` | `FFT-R4-AIE` | Original Python implementation derived from the upstream packed-twiddle layout. |
| `tests/m17_radix2_fft/fft64_r4_wrapper.cc` | `4c73e405029d051d39274bc9ddc833f86147b273de3d41701cba0bf1116f2000` | `FFT-R4-AIE` | Local wrapper that includes the adapted kernel. |
| `tests/m32_mlkem/kpke_kernel.cc` | `f79700a0c1d9699c1cb71a1e745933c044c2d10f285be5c91d1cc36b07645405` | `KYBER-REF` | Adapted/transliterated; explicit local MIT SPDX exception retained. |
| `tests/m32_mlkem/ntt_kernel.cc` | `c882320d5cecd4a482c30b95864f3f08117723e17bbb5d0afef8fd4a8a107ad7` | `KYBER-REF` | Adapted/transliterated NTT, reduction, and polynomial arithmetic. |
| `tests/m32_mlkem/mlkem_composer.py` | `c465c1f3c42168dabb1a10e6e78c8728c74923843dab41359ea7266573eb6dee` | `KYBER-REF` | Adapted Python reference/composer. |
| `tests/m32_mlkem/test_ntt_m32b.py` | `b34eb228b14acb6506dac4dd4e345c935eb84c8ea3e8d578c3fd963d35646531` | `KYBER-REF` | Local test/reference with upstream constants and arithmetic. |
| `tests/m32_mlkem/test_kpke_m32d.py` | `757cad7572afb5559434fdd5c71bc9de4886cb2f42067ce41a5ac04a3c363f17` | `KYBER-REF` | Local test/reference for the adapted KPKE kernel. |
| `tools/m32b_kernel_transliteration_check.py` | `61406b51df6a08cfa6c7c5b53ee1dc917eac72318913067f195529193ab581eb` | `KYBER-REF` | Local comparison tool. |
| `tools/m32d_kernel_transliteration_check.py` | `728d049b519c9d1929bb8a1e007db00b864e6a6174fdde0858911b43e792c0a1` | `KYBER-REF` | Local comparison tool. |
| `tools/m32e_kernel_transliteration_check.py` | `7ea112d42c3d841d121713def3fc6923a7d6f954e75a154bad365af7be5f3120` | `KYBER-REF` | Local comparison tool. |
| `tests/m33_mldsa/dilithium_ntt_kernel.cc` | `1f2005bd0f10b94005a155c12ac7d29822299a3edb85afd6f3cfcc8831da06ec` | `DILITHIUM-REF` | Adapted/transliterated NTT and reduction arithmetic. |
| `tests/m33_mldsa/dilithium_sampler_kernel.cc` | `99ec00d9ca92d9d798e6b78acc880f4e637d34b2562896d44c922a2e39174a57` | `DILITHIUM-REF` | Adapted rounding/hint arithmetic. |
| `tests/m33_mldsa/mldsa_composer.py` | `1991255534ff87cbe0b2cfe0ee1bd6691df158948d5e6ecab10efef1adeeb0c7` | `DILITHIUM-REF` | Local composer/reference integration. |
| `tests/m33_mldsa/test_dilithium_ntt_m33a.py` | `09a6d8d75cb53114b6d2808cbea1deca68dca281805019664a11fdda4ccaab51` | `DILITHIUM-REF` | Local test/reference. |
| `tests/m33_mldsa/test_dilithium_sampler_m33b.py` | `3aef8004e222570ff1b2d4d6ce18e124e61cbe7de02e8a019a23c6b5d55a0473` | `DILITHIUM-REF` | Local test/reference. |
| `tools/m33a_kernel_transliteration_check.py` | `f145bfa25a1fdf6db2c5e5e11531ed805bcc1b994b503517b26bf8617876a81f` | `DILITHIUM-REF` | Local comparison tool. |
| `tools/m33b_kernel_transliteration_check.py` | `4a1b1c37aeeb4da050000efe61f30f94d2fa99d9a900b9ae6c14574d6722132d` | `DILITHIUM-REF` | Local comparison tool. |

## NIST ACVP vector inventory

The source commit is `NIST-ACVP-975DE31`. Verification performed on
2026-08-18 parsed the local and upstream JSON rather than comparing formatting.
The four ML-KEM files select the ML-KEM-512 groups from larger upstream files
and use compact formatting. The six ML-DSA files preserve the complete upstream
bytes. No vector bytes were changed when this manifest was added.

| Local path | Local SHA-256 | Immutable upstream file | Upstream SHA-256 | Relationship |
| --- | --- | --- | --- | --- |
| `tests/m32_mlkem/vectors/keygen_prompt.json` | `62931c48765a8afca042795d73d52ad963cec715dadbcb008d24984120947512` | [`ML-KEM-keyGen-FIPS203/prompt.json`](https://github.com/usnistgov/ACVP-Server/blob/975de31eb83d87039ec88934fdc47d8c312b892d/gen-val/json-files/ML-KEM-keyGen-FIPS203/prompt.json) | `3f9ce34f6c836c77958bad2729e837c3b213f44ac36c3065976e7acca6389523` | ML-KEM-512 extraction; compacted. |
| `tests/m32_mlkem/vectors/keygen_expected.json` | `e14ee666b21302f75bae27da6e941ca5c11c842f60f5910291baabced0320d19` | [`ML-KEM-keyGen-FIPS203/expectedResults.json`](https://github.com/usnistgov/ACVP-Server/blob/975de31eb83d87039ec88934fdc47d8c312b892d/gen-val/json-files/ML-KEM-keyGen-FIPS203/expectedResults.json) | `a253d0ad91c95ebea5b409673defef0aa49d65d4ed72286399e2e798ddf073a4` | ML-KEM-512 extraction; compacted. |
| `tests/m32_mlkem/vectors/encapdecap_prompt.json` | `9909fe1c488e421100097ae67c53ff20e98e3028e4b1a45368f5a635d12af821` | [`ML-KEM-encapDecap-FIPS203/prompt.json`](https://github.com/usnistgov/ACVP-Server/blob/975de31eb83d87039ec88934fdc47d8c312b892d/gen-val/json-files/ML-KEM-encapDecap-FIPS203/prompt.json) | `998e22dfb12efb14ce9fdff911ca634b13612819a1806f25da69adba7e16db91` | ML-KEM-512 extraction; compacted. |
| `tests/m32_mlkem/vectors/encapdecap_expected.json` | `351d0c5c6d12ddc915c7b215b69960cec16b105764dfaae101c82c86da707632` | [`ML-KEM-encapDecap-FIPS203/expectedResults.json`](https://github.com/usnistgov/ACVP-Server/blob/975de31eb83d87039ec88934fdc47d8c312b892d/gen-val/json-files/ML-KEM-encapDecap-FIPS203/expectedResults.json) | `9089ec6ff2424da9f2782b89b2f831a329a3e28d6e5e24b802b78ff36ac61cdf` | ML-KEM-512 extraction; compacted. |
| `tests/m33_mldsa/vectors/ML-DSA-keyGen-FIPS204_prompt.json` | `43e81ad820e495dbcad086fe27c1008393a8c32100bbbff77c558c3f06dcefef` | [`ML-DSA-keyGen-FIPS204/prompt.json`](https://github.com/usnistgov/ACVP-Server/blob/975de31eb83d87039ec88934fdc47d8c312b892d/gen-val/json-files/ML-DSA-keyGen-FIPS204/prompt.json) | `43e81ad820e495dbcad086fe27c1008393a8c32100bbbff77c558c3f06dcefef` | Parsed data identical; bytes also identical. |
| `tests/m33_mldsa/vectors/ML-DSA-keyGen-FIPS204_expectedResults.json` | `361f47ca19d592adcc66ff2cb591686ad785fea157b295648738bed6921a68df` | [`ML-DSA-keyGen-FIPS204/expectedResults.json`](https://github.com/usnistgov/ACVP-Server/blob/975de31eb83d87039ec88934fdc47d8c312b892d/gen-val/json-files/ML-DSA-keyGen-FIPS204/expectedResults.json) | `361f47ca19d592adcc66ff2cb591686ad785fea157b295648738bed6921a68df` | Parsed data identical; bytes also identical. |
| `tests/m33_mldsa/vectors/ML-DSA-sigGen-FIPS204_prompt.json` | `447749d72817b211160d243311ce32302f3023e59c355b0f70be2bd3e9e7830d` | [`ML-DSA-sigGen-FIPS204/prompt.json`](https://github.com/usnistgov/ACVP-Server/blob/975de31eb83d87039ec88934fdc47d8c312b892d/gen-val/json-files/ML-DSA-sigGen-FIPS204/prompt.json) | `447749d72817b211160d243311ce32302f3023e59c355b0f70be2bd3e9e7830d` | Parsed data identical; bytes also identical. |
| `tests/m33_mldsa/vectors/ML-DSA-sigGen-FIPS204_expectedResults.json` | `228d011bbe274aeb93e22eea1e0d57b78f43795cf6a64fb5ef1e626485a0bedb` | [`ML-DSA-sigGen-FIPS204/expectedResults.json`](https://github.com/usnistgov/ACVP-Server/blob/975de31eb83d87039ec88934fdc47d8c312b892d/gen-val/json-files/ML-DSA-sigGen-FIPS204/expectedResults.json) | `228d011bbe274aeb93e22eea1e0d57b78f43795cf6a64fb5ef1e626485a0bedb` | Parsed data identical; bytes also identical. |
| `tests/m33_mldsa/vectors/ML-DSA-sigVer-FIPS204_prompt.json` | `e2cba4589389756fa0bea1a7e6837138bf0a81f9d14234c9ee8f6d33caa1654e` | [`ML-DSA-sigVer-FIPS204/prompt.json`](https://github.com/usnistgov/ACVP-Server/blob/975de31eb83d87039ec88934fdc47d8c312b892d/gen-val/json-files/ML-DSA-sigVer-FIPS204/prompt.json) | `e2cba4589389756fa0bea1a7e6837138bf0a81f9d14234c9ee8f6d33caa1654e` | Parsed data identical; bytes also identical. |
| `tests/m33_mldsa/vectors/ML-DSA-sigVer-FIPS204_expectedResults.json` | `e1d84ef1b2f35196278ab0b0ed6a46ec62cc03d2dfa92c564199e1999bfb8ea6` | [`ML-DSA-sigVer-FIPS204/expectedResults.json`](https://github.com/usnistgov/ACVP-Server/blob/975de31eb83d87039ec88934fdc47d8c312b892d/gen-val/json-files/ML-DSA-sigVer-FIPS204/expectedResults.json) | `e1d84ef1b2f35196278ab0b0ed6a46ec62cc03d2dfa92c564199e1999bfb8ea6` | Parsed data identical; bytes also identical. |

## NIST modification notice

The four ML-KEM files were extracted from the complete ACVP files on
2026-08-16 by retaining the ML-KEM-512 test groups and serializing compact
JSON. The six ML-DSA files were imported without changing their parsed data.
Phoenix SDR-DSP acknowledges the National Institute of Standards and
Technology as the source. The NIST files are provided without warranty under
the complete notice linked in `NIST-ACVP-975DE31`.

## Maintenance

Any change to a listed local file must update its SHA-256 here in the same
commit. An upstream-anchor change must preserve the prior record in Git history
and state whether exactness was reverified. Protected or historical evidence
must not be rewritten merely to normalize provenance metadata.
