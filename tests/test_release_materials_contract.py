"""Host-only static checks for release-maintenance materials."""

from __future__ import annotations

import hashlib
import json
import re
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
SCRIPT = REPO / "scripts" / "validate_clean_clone.ps1"
ACTIVATE_SCRIPT = REPO / "scripts" / "activate_ironenv.ps1"
RUNNER = REPO / "run_all_silicon_tests.py"
ARCHIVED_MARKDOWN_ROOTS = (REPO / "docs" / "history", REPO / "third_party")
EXPECTED_RUNNER_SHA256 = (
    "742591321ac5dc3069a51ded4e198905367f8dc6261df8c3ebae20b5e333fbad"
)


class ReleaseMaterialsContractTests(unittest.TestCase):
    def test_clean_clone_script_keeps_default_path_host_safe(self) -> None:
        source = SCRIPT.read_text(encoding="utf-8-sig")
        self.assertEqual(source.count("{"), source.count("}"))
        self.assertIn("[switch]$RunSilicon", source)
        self.assertIn("[switch]$InstallHostDependencies", source)
        self.assertIn("if ($RunSilicon)", source)
        self.assertIn("accesses the NPU", source)
        self.assertIn("numpy==$requiredNumpyVersion", source)
        self.assertIn('"2.5.2"', source)
        self.assertIn("Re-run with -InstallHostDependencies", source)
        self.assertIn("Compile maintained Python", source)
        self.assertIn("Run host-only contracts", source)
        self.assertIn(EXPECTED_RUNNER_SHA256, source)

    def test_canonical_runner_identity_is_unchanged(self) -> None:
        self.assertEqual(
            hashlib.sha256(RUNNER.read_bytes()).hexdigest(),
            EXPECTED_RUNNER_SHA256,
        )

    def test_ironenv_activation_is_checkout_local_and_documented(self) -> None:
        source = ACTIVATE_SCRIPT.read_text(encoding="utf-8-sig")
        self.assertIn("$PSScriptRoot", source)
        self.assertIn("PEANO_INSTALL_DIR", source)
        self.assertIn(r"third_party\mlir-aie\ironenv\Scripts\Activate.ps1", source)
        self.assertNotIn(r"C:\phoenix-sdr-dsp", source)
        self.assertNotIn(r"C:\Xilinx\XRT", source)

        for path in (REPO / "README.md", REPO / "docs" / "SETUP_WINDOWS.md"):
            with self.subTest(path=path.relative_to(REPO)):
                text = path.read_text(encoding="utf-8-sig")
                self.assertIn(r".\scripts\activate_ironenv.ps1", text)

    def test_project_license_metadata_and_file_exception_are_consistent(self) -> None:
        license_text = (REPO / "LICENSE").read_text(encoding="utf-8")
        notice = (REPO / "NOTICE").read_text(encoding="utf-8")
        citation = (REPO / "CITATION.cff").read_text(encoding="utf-8")
        zenodo = json.loads((REPO / ".zenodo.json").read_text(encoding="utf-8"))
        toolchain = (REPO / "toolchain.yaml").read_text(encoding="utf-8")
        third_party = (REPO / "THIRD_PARTY_NOTICES.md").read_text(encoding="utf-8")
        provenance = (REPO / "THIRD_PARTY_PROVENANCE.md").read_text(encoding="utf-8")
        nist_notice = (REPO / "LICENSES" / "NIST-ACVP-NOTICE.txt").read_text(
            encoding="utf-8"
        )
        history = (REPO / "LICENSE_HISTORY.md").read_text(encoding="utf-8")
        contributing = (REPO / "CONTRIBUTING.md").read_text(encoding="utf-8")
        mit_text = (REPO / "LICENSES" / "MIT.txt").read_text(encoding="utf-8")
        kpke = (REPO / "tests" / "m32_mlkem" / "kpke_kernel.cc").read_text(
            encoding="utf-8"
        )

        self.assertIn("Apache License", license_text)
        self.assertIn("Version 2.0", license_text)
        self.assertIn("Copyright 2026 Midhat Nashar", notice)
        self.assertIn("license: Apache-2.0", citation)
        self.assertIn('version: "1.0.1-rc.4"', citation)
        self.assertEqual(zenodo["version"], "1.0.1-rc.4")
        self.assertEqual(zenodo["license"], "Apache-2.0")
        self.assertEqual(zenodo["access_right"], "open")
        self.assertIn("license: Apache-2.0", toolchain)
        self.assertIn("LICENSES/MIT.txt", third_party)
        self.assertIn("THIRD_PARTY_PROVENANCE.md", third_party)
        self.assertIn(
            "975de31eb83d87039ec88934fdc47d8c312b892d",
            provenance,
        )
        self.assertIn("Comparison anchor only", provenance)
        self.assertIn(
            "f037dc6f0c45452a28a3ad8059a299ccc1ab94461c822b67bbe85fccdf8e5cbc",
            provenance,
        )
        self.assertIn("acknowledges the National Institute of Standards", provenance)
        self.assertIn(
            "National Institute of Standards and Technology",
            " ".join(nist_notice.split()),
        )
        self.assertIn("keep intact this entire notice", nist_notice)
        self.assertIn("Permissions already granted", history)
        self.assertIn("submitted under the repository's", contributing)
        self.assertIn("Apache License 2.0", contributing)
        self.assertIn("immutable upstream URL and revision", contributing)
        self.assertTrue(mit_text.startswith("MIT License"))
        self.assertTrue(kpke.startswith("// SPDX-License-Identifier: MIT"))

    def test_provenance_manifest_matches_local_files(self) -> None:
        provenance = (REPO / "THIRD_PARTY_PROVENANCE.md").read_text(encoding="utf-8")
        rows = re.findall(
            r"^\| `([^`]+)` \| `([0-9a-f]{64})` \|",
            provenance,
            flags=re.MULTILINE,
        )
        self.assertGreaterEqual(len(rows), 29)
        for relative_path, expected_sha256 in rows:
            with self.subTest(path=relative_path):
                path = REPO / relative_path
                self.assertTrue(path.is_file())
                self.assertEqual(
                    hashlib.sha256(path.read_bytes()).hexdigest(),
                    expected_sha256,
                )

    def test_publication_documents_link_to_release_controls(self) -> None:
        readiness = (REPO / "docs" / "PUBLICATION_READINESS.md").read_text(
            encoding="utf-8"
        )
        checklist = (REPO / "docs" / "JOURNAL_REPRODUCIBILITY_CHECKLIST.md").read_text(
            encoding="utf-8"
        )
        self.assertIn("34/34 mixed-backend", readiness)
        self.assertIn("29 direct-hardware", readiness)
        self.assertIn("four host/NPU", readiness)
        self.assertIn(EXPECTED_RUNNER_SHA256, checklist)
        self.assertIn("-InstallHostDependencies", checklist)
        self.assertIn("-RunSilicon", checklist)

    def test_maintained_markdown_uses_supported_math_notation(self) -> None:
        offending = []
        malformed_delimiters = []
        for path in REPO.rglob("*.md"):
            if any(root in path.parents for root in ARCHIVED_MARKDOWN_ROOTS):
                continue
            text = path.read_text(encoding="utf-8")
            if "\\operatorname" in text:
                offending.append(path.relative_to(REPO).as_posix())
            for line_number, line in enumerate(text.splitlines(), start=1):
                if re.search(r"\\(?:Bigg|bigg|Big|big)(?![lrm])", line):
                    malformed_delimiters.append(
                        f"{path.relative_to(REPO).as_posix()}:{line_number}"
                    )
        self.assertEqual(offending, [])
        self.assertEqual(malformed_delimiters, [])

    def test_current_setup_materials_prefer_the_extensionless_launcher(self) -> None:
        current_guidance = [
            REPO / "README.md",
            REPO / "CONTRIBUTING.md",
            REPO / "docs" / "README.md",
            REPO / "docs" / "SETUP_WINDOWS.md",
            REPO / "docs" / "PQC_COMPLETE_V1.md",
            REPO / "requirements" / "toolchain-versions.md",
        ]
        for path in current_guidance:
            with self.subTest(path=path.relative_to(REPO)):
                text = path.read_text(encoding="utf-8")
                self.assertIn(r"py .\install", text)
                self.assertNotIn(r"py .\install.py", text)

        workflow = (REPO / ".github" / "workflows" / "ci.yml").read_text(
            encoding="utf-8"
        )
        self.assertIn("python install --self-test", workflow)
        self.assertNotIn("python install.py --self-test", workflow)


if __name__ == "__main__":
    unittest.main()
