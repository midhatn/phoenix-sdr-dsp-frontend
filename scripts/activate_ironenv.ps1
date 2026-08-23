<#
.SYNOPSIS
    Activates the checkout-local Phoenix SDR-DSP IRON environment.

.DESCRIPTION
    Resolves all paths from the current repository checkout, so the script
    works from any drive or directory. The environment must first be created
    by running `py .\install` from the repository root.

    The installer places the validated pyxrt binding and its DLL-path shim
    inside ironenv. This script therefore does not depend on a hard-coded
    system XRT installation.

.EXAMPLE
    .\scripts\activate_ironenv.ps1
#>

[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path -LiteralPath (Split-Path -Parent $PSScriptRoot)).Path
$activate = Join-Path $repoRoot "third_party\mlir-aie\ironenv\Scripts\Activate.ps1"
$ironPython = Join-Path $repoRoot "third_party\mlir-aie\ironenv\Scripts\python.exe"
$peano = Join-Path $repoRoot "third_party\mlir-aie\ironenv\Lib\site-packages\llvm-aie"

if (-not (Test-Path -LiteralPath $activate -PathType Leaf) -or
    -not (Test-Path -LiteralPath $ironPython -PathType Leaf)) {
    throw @"
The checkout-local ironenv has not been installed:
  $ironPython

From the repository root, run:
  py .\install

Then activate it with:
  .\scripts\activate_ironenv.ps1
"@
}

if (-not (Test-Path -LiteralPath $peano -PathType Container)) {
    throw @"
The checkout-local Peano compiler directory is missing:
  $peano

Repair the supported environment from the repository root:
  py .\install
"@
}

& $activate
if (-not $?) {
    throw "IRON environment activation failed."
}

$env:PEANO_INSTALL_DIR = (Resolve-Path -LiteralPath $peano).Path
$env:PHOENIX_SDR_DSP_ROOT = $repoRoot

Write-Host "Phoenix SDR-DSP ironenv activated."
Write-Host "Python: $ironPython"
Write-Host "PEANO_INSTALL_DIR: $env:PEANO_INSTALL_DIR"
