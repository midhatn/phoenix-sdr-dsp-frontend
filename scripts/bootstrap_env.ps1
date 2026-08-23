<#
.SYNOPSIS
    Compatibility wrapper for the pinned Phoenix SDR-DSP Windows installer.

.DESCRIPTION
    This script formerly performed rolling mlir-aie and llvm-aie installs. That
    path is retired because it bypassed the hashes and pin recorded in
    toolchain.yaml. The wrapper now delegates to the extensionless install
    launcher, the supported bootstrap and repair path.

    The launcher validates the XRT archive and MLIR-AIE wheel hashes, checks
    out the pinned mlir-aie revision, and starts the canonical regression after
    a successful full install.

.PARAMETER RepoRoot
    Absolute path to the phoenix-sdr-dsp checkout. Defaults to the parent of
    this script's directory.

.PARAMETER Python
    Python command used to invoke the install launcher. Defaults to "py".

.EXAMPLE
    .\scripts\bootstrap_env.ps1

.EXAMPLE
    .\scripts\bootstrap_env.ps1 -RepoRoot D:\phoenix-sdr-dsp
#>

[CmdletBinding()]
param(
    [string]$RepoRoot = (Split-Path -Parent $PSScriptRoot),
    [string]$Python = "py"
)

$ErrorActionPreference = "Stop"
$repo = Resolve-Path -LiteralPath $RepoRoot
$launcher = Join-Path $repo "install"
if (-not (Test-Path -LiteralPath $launcher)) {
    throw "Pinned install launcher not found at $launcher"
}

Write-Host "Delegating to the pinned install launcher: $launcher" -ForegroundColor Cyan
& $Python $launcher --repo-root $repo
if ($LASTEXITCODE -ne 0) {
    throw "install failed with exit code $LASTEXITCODE"
}

Write-Host "`nPinned bootstrap/repair complete." -ForegroundColor Green
Write-Host "The canonical silicon regression ran after the successful install."
