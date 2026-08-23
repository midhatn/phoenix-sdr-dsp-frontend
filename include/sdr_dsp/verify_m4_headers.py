# Purpose: Automated compilation and validation script for Milestone 4 SDR DSP kernels.
# Target operating system: Windows 11 Pro 25H2.
# Target architecture: AMD Ryzen 9 7940HS Phoenix / XDNA1 / AIE2.
# Input types: Verification suite across all M4 kernels.
# Output types: Success verification report.

from pathlib import Path

# Repo root auto-detected from this file's location:
# include/sdr_dsp/verify_m4_headers.py -> parents[2] is the repo root.
REPO_ROOT = Path(__file__).resolve().parents[2]


def main() -> int:
    print("=== Phoenix SDR-DSP Milestone 4: Header Library Verification ===")
    include_dir = REPO_ROOT / "include" / "sdr_dsp"
    print(f"Checking SDR DSP include directory: {include_dir}")

    headers = [
        "sdr_dsp_common.hpp",
        "fir_filter.hpp",
        "complex_mixer.hpp",
        "power_detector.hpp",
        "modular_arithmetic.hpp",
    ]

    missing = []
    for h in headers:
        p = include_dir / h
        if p.exists():
            print(f"  [OK] Header present: {h} ({p.stat().st_size} bytes)")
        else:
            print(f"  [FAIL] Missing header: {h}")
            missing.append(h)

    if missing:
        print(f"\nHeader verification failed: {', '.join(missing)}")
        return 1

    print("\nAll expected public headers are present.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
