# Native Windows Setup

This guide prepares a clean Windows installation to run Phoenix SDR-DSP on a supported AMD Phoenix NPU.

## Scope

The project targets:

- Windows 11 Pro
- [AMD Ryzen 9 7940HS](https://www.amd.com/en/products/processors/laptop/ryzen/7000-series/amd-ryzen-9-7940hs.html) / Phoenix NPU
- [XDNA1 / AIE2](https://docs.kernel.org/accel/amdxdna/amdnpu.html)
- Native Windows [MLIR-AIE](https://github.com/Xilinx/mlir-aie), [LLVM-AIE / Peano](https://github.com/Xilinx/llvm-aie), and [XRT](https://github.com/Xilinx/XRT) ([official IRON Windows guide, v1.4.1](https://xilinx.github.io/mlir-aie/1.4.1/buildHostWinNative/))

The validated versions are recorded in [toolchain-versions.md](../requirements/toolchain-versions.md).

## Prerequisites

Before cloning, install Git for Windows, CPython 3.13, CMake, and Visual Studio
2022 Build Tools with the Desktop Development with C++ and C++ Clang/LLVM
components. The target also needs a compatible AMD Phoenix/XDNA1 NPU driver.
The installer checks these prerequisites and manages the pinned XRT SDK,
MLIR-AIE v1.4.1 wheel, source revision, IRON environment, and Peano setup.

## Clone and install

Clone the repository, open PowerShell in the resulting clone, and run exactly:

```powershell
py .\install
```

The extensionless stdlib-only launcher uses an internal installer
implementation. On a successful full install, it automatically installs the
pinned PQC reference packages and invokes the canonical
`run_all_silicon_tests.py`. Do not manually clone MLIR-AIE, create or activate
`ironenv`, or run `pip install` for the supported clean-clone flow.

## Activate the environment after installation

The installer and whole-suite runner do not require manual activation.
Activation is required when a user wants to run individual M32, M33, or other
Python test files with the generic `python` command. From the repository root,
run:

```powershell
.\scripts\activate_ironenv.ps1
```

The prompt should begin with `(ironenv)`. Verify that the active interpreter
belongs to the current clone:

```powershell
python -c "import sys; print(sys.executable)"
python -c "import mlir_aie, pyxrt; print('IRON and XRT imports: OK')"
```

For a clone at `D:\phoenix-sdr-dsp`, the first command must report:

```text
D:\phoenix-sdr-dsp\third_party\mlir-aie\ironenv\Scripts\python.exe
```

Open PowerShell sessions do not inherit activation from earlier windows. Run
the activation helper once in each new PowerShell window before using generic
`python` commands. If the helper reports that `ironenv` or Peano is missing,
return to the repository root and run `py .\install`.

The installer pins MLIR-AIE to
[`3ca0193cea9e2c39ec670a65f93e1dd43c969f22`](https://github.com/Xilinx/mlir-aie/commit/3ca0193cea9e2c39ec670a65f93e1dd43c969f22)
and uses the published [v1.4.1 wheel](https://github.com/Xilinx/mlir-aie/releases/tag/v1.4.1),
not the rolling wheels channel. Pin rationale is in
[`M2_TOOLCHAIN_PIN.md`](M2_TOOLCHAIN_PIN.md).

## Maintenance modes

The launcher forwards maintenance arguments. These modes never dispatch
kernels or invoke the canonical regression. `--check-only` and
`--download-only` can call `xrt-smi examine` to report prerequisite status;
`--self-test` uses only local temporary files:

```powershell
py .\install --check-only
py .\install --download-only
py .\install --self-test
```

## Post-Quantum Cryptography reference dependencies (M32 / M33)

The M32 FIPS 203 ML-KEM and M33 FIPS 204 ML-DSA tests use official NIST
ACVP-Server known-answer vectors and two published reference implementations
from the [pq-crystals](https://pq-crystals.org/) family. M32b/c/d and M33a/b
dispatch directly to the NPU. M32e combines 60 host KATs with a nine-vector
ML-KEM-512 silicon smoke gate, while M33d/e are host/NPU composers using the
native M33a/M33b primitive runners. The `py .\install` clean-clone flow
auto-installs the version-pinned oracle and test packages into the `ironenv` it
creates. The transitive dependency closure remains unhashed, so this is not
yet a fully locked Python environment.

Versions are pinned to the values validated on 2026-08-16 against the [NIST ACVP-Server](https://github.com/usnistgov/ACVP-Server) response vectors for ML-KEM ([FIPS 203, 2024-08-13](https://nvlpubs.nist.gov/nistpubs/fips/nist.fips.203.pdf)) and ML-DSA ([FIPS 204, 2024-08-13](https://nvlpubs.nist.gov/nistpubs/fips/nist.fips.204.pdf)):

- [`kyber-py`](https://github.com/GiacomoPope/kyber-py) 1.0.1 — reference ML-KEM implementation used by the M32e composer gate as an oracle for [FIPS 203 Algorithms 19-21](https://nvlpubs.nist.gov/nistpubs/fips/nist.fips.203.pdf).
- [`dilithium-py`](https://github.com/GiacomoPope/dilithium-py) 1.4.0 — reference ML-DSA implementation used by the M33d KeyGen and M33e Sign / Verify composer gates as an oracle for [FIPS 204 Algorithms 6-8](https://nvlpubs.nist.gov/nistpubs/fips/nist.fips.204.pdf).
- [`pytest`](https://docs.pytest.org/) — test-parametrisation framework required by `tests/m32_mlkem/test_mlkem_m32e.py`, which imports it at module scope.

All SHAKE128, SHAKE256, SHA3-256, and SHA3-512 primitives used by the M32c reference and the FIPS 204 Keccak reuse come from CPython's [`hashlib`](https://docs.python.org/3/library/hashlib.html) standard library ([`shake_128`](https://docs.python.org/3/library/hashlib.html#hashlib.shake_128) and [`shake_256`](https://docs.python.org/3/library/hashlib.html#hashlib.shake_256) shipped in Python 3.6). No separate SHAKE / Keccak wheel is required.

The NIST ACVP-Server key-generation / encapsulation / decapsulation vectors for ML-KEM and the key-generation / signature-generation / signature-verification vectors for ML-DSA are vendored under `tests/m32_mlkem/vectors/` and `tests/m33_mldsa/vectors/` respectively, so the tests run offline once the packages above are installed. Vector provenance is documented in [`docs/PQC_COMPLETE_V1.md`](PQC_COMPLETE_V1.md).

## Validate the Installation

No separate validation command is required: a successful `py .\install`
automatically invokes the canonical regression runner. The runner uses the
checkout-local `ironenv` itself, so activation is not part of the supported
flow.

## Run the Regression Suite

```powershell
py .\run_all_silicon_tests.py
```

Use this command only to rerun the suite after installation. The automated
suite runs 34 invocations covering M3, M5 through M15, M15b, M17, M17p, M19
through M27, and the Post-Quantum Cryptography track M32b, M32c, M32d, M32e
plus M33a, M33b, M33d, M33e-sign, and M33e-verify. Its current composition is
29 direct-hardware entries, four host/NPU composer entries, and one intentional
CPU reference entry (M12). The strict runner requires all three M32e silicon
groups without skips, explicit M33 silicon backend declarations, and anchored
`TOTAL x/x PASS` lines. The recorded 2026-08-17 run completed 34/34 in 126.29
seconds. See [`M33_SILICON_VALIDATION_20260817.md`](M33_SILICON_VALIDATION_20260817.md).

## Run M32 and M33 individually

These commands compile and dispatch physical workloads to the NPU. Complete
the installation, activate `ironenv`, and run them from the repository root:

```powershell
.\scripts\activate_ironenv.ps1

# M32: ML-KEM
python .\tests\m32_mlkem\test_ntt_m32b.py
python .\tests\m32_mlkem\test_keccak_shake_m32c.py
python .\tests\m32_mlkem\test_kpke_m32d.py
python .\tests\m32_mlkem\test_mlkem_m32e.py

# M33: ML-DSA
python .\tests\m33_mldsa\test_dilithium_ntt_m33a.py
python .\tests\m33_mldsa\test_dilithium_sampler_m33b.py
python .\tests\m33_mldsa\test_mldsa_keygen_m33d.py
python .\tests\m33_mldsa\test_mldsa_sign_m33e.py
python .\tests\m33_mldsa\test_mldsa_verify_m33e.py
```

Do not set `M32E_FORCE_HOST`; the canonical silicon policy rejects a
host-forced M32e run. For the full validated sequence, prefer
`py .\run_all_silicon_tests.py`, which selects the checkout-local interpreter
without requiring activation.

## Optional: I/Q Throughput

Not part of the 34-invocation suite. After the installer completes:

```powershell
python tests\npu_visible\test_iq_throughput.py
```

Expected on Phoenix NPU1: first-buffer max abs error 0.007812, then about 7.5 Msps / 30 MB/s I/Q in over a 5 second window. See the landing-page I/Q section and `tests/npu_visible/README.md`.

## Troubleshooting

| Symptom | Check |
|---|---|
| `activate_ironenv.ps1` says the environment is missing | Run `py .\install` from the repository root, then retry activation. |
| `No module named aie` | Run `.\scripts\activate_ironenv.ps1` and verify that `sys.executable` points inside this clone. |
| `No module named pyxrt` | Re-run `py .\install`; the supported flow installs the validated binding into the checkout-local environment. |
| No `NPU Phoenix` in `xrt-smi examine` | Install or update the AMD NPU driver; confirm the hardware is Phoenix/XDNA1. |
| Peano compiler is not found | Re-run `python utils\\iron_setup.py` inside the MLIR-AIE checkout. |
| Regression imports fail | Confirm the MLIR-AIE checkout is at the pinned commit and submodules are initialized. |
| `Runtime.__init__() missing 1 required positional argument: 'seq_fn'` | mlir-aie checkout is older than v1.4.1. Check out v1.4.1 or later (pinned: `3ca0193`) and re-run `python utils\\iron_setup.py`. |
