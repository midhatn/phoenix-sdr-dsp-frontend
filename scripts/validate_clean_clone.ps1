[CmdletBinding()]
param(
    [switch]$RunSilicon,
    [switch]$InstallHostDependencies,
    [string]$Python = ""
)

# This normal-user PowerShell 7 audit is deliberately host-safe by default.
# It does not probe, compile for, or dispatch to the NPU unless -RunSilicon is
# supplied after all host checks have passed.
$ErrorActionPreference = "Stop"
$repo = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$evidenceDirectory = Join-Path $repo "release-evidence\clean-clone"
New-Item -ItemType Directory -Force -Path $evidenceDirectory | Out-Null
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$report = Join-Path $evidenceDirectory "sdr-clean-clone-$stamp.txt"
$expectedRunnerSha256 = "742591321ac5dc3069a51ded4e198905367f8dc6261df8c3ebae20b5e333fbad"
$requiredNumpyVersion = "2.5.2"

function Write-Report {
    param([string]$Message)
    $Message | Tee-Object -FilePath $report -Append
}

function Invoke-Checked {
    param(
        [string]$Label,
        [string]$FilePath,
        [string[]]$Arguments
    )

    Write-Report "`n>>> $Label"
    Write-Report "> $FilePath $($Arguments -join ' ')"
    & $FilePath @Arguments 2>&1 | ForEach-Object { Write-Report "$_" }
    if ($LASTEXITCODE -ne 0) {
        throw "$Label failed with exit code $LASTEXITCODE."
    }
}

function Resolve-Python {
    param([string]$Requested)
    if ($Requested) {
        return $Requested
    }
    if (Get-Command py -ErrorAction SilentlyContinue) {
        return "py"
    }
    if (Get-Command python -ErrorAction SilentlyContinue) {
        return "python"
    }
    throw "Neither the Windows Python launcher ('py') nor 'python' is available."
}

function Test-HostDependencies {
    param(
        [string]$PythonCommand,
        [switch]$Install
    )

    $versionCheck = @(
        "-c",
        "import numpy; assert numpy.__version__ == '$requiredNumpyVersion', numpy.__version__"
    )
    & $PythonCommand @versionCheck 2>&1 |
        ForEach-Object { Write-Report "$_" }
    if ($LASTEXITCODE -eq 0) {
        Write-Report "Pinned host dependency: numpy==$requiredNumpyVersion (PASS)"
        return
    }

    if (-not $Install) {
        throw (
            "Pinned host dependency numpy==$requiredNumpyVersion is missing or has " +
            "a different version. Re-run with -InstallHostDependencies, or install " +
            "it explicitly with: $PythonCommand -m pip install --upgrade " +
            "numpy==$requiredNumpyVersion"
        )
    }

    Invoke-Checked "Install pinned host dependency" $PythonCommand @(
        "-m", "pip", "install", "--upgrade", "numpy==$requiredNumpyVersion"
    )
    Invoke-Checked "Verify pinned host dependency" $PythonCommand $versionCheck
}

try {
    Set-Location $repo
    Write-Report "Phoenix SDR-DSP clean-clone evidence"
    Write-Report "Timestamp (local): $(Get-Date -Format o)"
    Write-Report "Repository: $repo"
    Write-Report "PowerShell: $($PSVersionTable.PSVersion)"
    Write-Report "Hardware access by default: disabled"

    Invoke-Checked "Verify Git checkout" "git" @("rev-parse", "--is-inside-work-tree")
    Invoke-Checked "Record Git commit" "git" @("rev-parse", "HEAD")
    Invoke-Checked "Record Git status" "git" @("status", "--short", "--branch")
    Invoke-Checked "Record Git version" "git" @("--version")

    $pythonCommand = Resolve-Python $Python
    Invoke-Checked "Record Python version" $pythonCommand @("--version")
    Test-HostDependencies $pythonCommand -Install:$InstallHostDependencies

    $runner = Join-Path $repo "run_all_silicon_tests.py"
    if (-not (Test-Path -LiteralPath $runner)) {
        throw "Canonical runner not found: $runner"
    }
    $actualRunnerSha256 = (Get-FileHash -LiteralPath $runner -Algorithm SHA256).Hash.ToLowerInvariant()
    Write-Report "Canonical runner SHA-256: $actualRunnerSha256"
    if ($actualRunnerSha256 -ne $expectedRunnerSha256) {
        throw "Canonical runner hash mismatch; refusing to continue."
    }

    Invoke-Checked "Compile maintained Python" $pythonCommand @(
        "-m", "compileall", "-q", "phoenix_sdr_dsp", "tests", "tools",
        "run_all_silicon_tests.py"
    )
    Invoke-Checked "Compile clean-clone installer" $pythonCommand @(
        "-m", "py_compile", "install", "install.py"
    )
    Invoke-Checked "Verify public-header inventory" $pythonCommand @(
        "include/sdr_dsp/verify_m4_headers.py"
    )
    Invoke-Checked "Run host-only contracts" $pythonCommand @(
        "-m", "unittest", "-v",
        "tests/test_m33_native_runner_contract.py",
        "tests/test_regression_validation.py",
        "tests/test_release_materials_contract.py",
        "tests/test_install_launcher_contract.py"
    )
    Invoke-Checked "Run installer self-test" $pythonCommand @("install", "--self-test")

    Write-Report "`nHost-safe audit: PASS"
    if ($RunSilicon) {
        Write-Report "NPU dispatch requested: the following canonical runner accesses the NPU."
        Invoke-Checked "Run canonical silicon regression (NPU access)" $pythonCommand @(
            "run_all_silicon_tests.py"
        )
    }
    else {
        Write-Report "Silicon regression: NOT RUN (use -RunSilicon only on an approved Phoenix test host)."
    }
    Write-Report "Evidence report: $report"
    exit 0
}
catch {
    Write-Report "`nRESULT: FAIL"
    Write-Report $_.Exception.Message
    Write-Report "Evidence report: $report"
    exit 1
}
