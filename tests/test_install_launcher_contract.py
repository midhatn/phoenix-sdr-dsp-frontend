"""Host-safe contracts for the extensionless Windows installation launcher."""

from __future__ import annotations

import importlib.machinery
import importlib.util
import subprocess
import sys
import unittest
from pathlib import Path
from unittest import mock

REPO = Path(__file__).resolve().parents[1]
LAUNCHER = REPO / "install"
INSTALLER = REPO / "install.py"


def load_launcher():
    loader = importlib.machinery.SourceFileLoader(
        "phoenix_install_launcher_contract",
        str(LAUNCHER),
    )
    spec = importlib.util.spec_from_loader(loader.name, loader)
    if spec is None:
        raise RuntimeError("could not load extensionless install launcher")
    module = importlib.util.module_from_spec(spec)
    loader.exec_module(module)
    return module


class InstallLauncherContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.launcher = load_launcher()

    def test_default_full_install_requests_canonical_regression(self) -> None:
        self.assertEqual(self.launcher.build_install_argv([]), ["--run-tests"])
        self.assertEqual(
            self.launcher.build_install_argv(["--force", "--repo-root", "clone"]),
            ["--force", "--repo-root", "clone", "--run-tests"],
        )

    def test_explicit_modes_are_forwarded_without_invoking_canonical_tests(
        self,
    ) -> None:
        for mode in ("--check-only", "--download-only", "--self-test"):
            with self.subTest(mode=mode):
                self.assertEqual(
                    self.launcher.build_install_argv([mode, "--force"]),
                    [mode, "--force"],
                )

    def test_explicit_run_tests_is_not_duplicated(self) -> None:
        self.assertEqual(
            self.launcher.build_install_argv(["--run-tests", "--force"]),
            ["--run-tests", "--force"],
        )

    def test_help_identifies_the_extensionless_launcher(self) -> None:
        result = subprocess.run(
            [sys.executable, str(LAUNCHER), "--help"],
            check=False,
            capture_output=True,
            text=True,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("usage: install", result.stdout)
        self.assertNotIn("usage: install.py", result.stdout)

    def test_launcher_delegates_to_install_py_with_forwarded_arguments(self) -> None:
        original_argv = sys.argv
        observed: dict[str, object] = {}

        def record_call(
            path: str,
            *,
            run_name: str,
            init_globals: dict[str, bool],
        ) -> None:
            observed["path"] = path
            observed["run_name"] = run_name
            observed["argv"] = list(sys.argv)
            observed["init_globals"] = init_globals

        with mock.patch.object(
            self.launcher.runpy, "run_path", side_effect=record_call
        ):
            self.assertEqual(self.launcher.main(["--self-test", "--force"]), 0)

        self.assertIs(sys.argv, original_argv)
        self.assertEqual(observed["path"], str(INSTALLER))
        self.assertEqual(observed["run_name"], "__main__")
        self.assertEqual(observed["argv"], [str(LAUNCHER), "--self-test", "--force"])
        self.assertEqual(observed["init_globals"], {"PHOENIX_INSTALL_LAUNCHER": True})


if __name__ == "__main__":
    unittest.main()
