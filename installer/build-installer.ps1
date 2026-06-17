# -------------------------------------------------------------------------
# Lychee Desktop — Build Windows NSIS Installer
# -------------------------------------------------------------------------
# Usage:
#   .\build-installer.ps1                  # Auto-detect exe, build installer
#   .\build-installer.ps1 -ExePath .\custom.exe   # Specify exe path
#   .\build-installer.ps1 -Clean          # Clean before build
# -------------------------------------------------------------------------

param(
    [string]$ExePath = "",
    [switch]$Clean,
    [switch]$SkipWebView2,        # Skip WebView2 bundle
    [string]$Version = "1.0.0"
)

$ErrorActionPreference = "Stop"
$ScriptDir = $PSScriptRoot
$ProjectRoot = Resolve-Path "$ScriptDir\.."

Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Lychee Desktop — NSIS Installer Builder            ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ── Step 0: Clean if requested ────────────────────────────────────────
if ($Clean) {
    $outputDir = "$ScriptDir\Output"
    if (Test-Path $outputDir) {
        Write-Host "[Clean] Removing previous output..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force $outputDir
    }
    $distInstaller = "$ProjectRoot\dist\Lychee-Desktop-*-Setup.exe"
    if (Test-Path $distInstaller) {
        Write-Host "[Clean] Removing previous installers from dist..." -ForegroundColor Yellow
        Remove-Item -Force $distInstaller
    }
}

# ── Step 1: Check for NSIS ────────────────────────────────────────────
Write-Host "[1/5] Checking NSIS installation..." -ForegroundColor White

$nsisPaths = @(
    "${env:ProgramFiles}\NSIS\makensis.exe",
    "${env:ProgramFiles(x86)}\NSIS\makensis.exe",
    "$env:LOCALAPPDATA\Programs\NSIS\makensis.exe",
    "$env:APPDATA\..\Local\Programs\NSIS\makensis.exe"
)

$makensis = $null
foreach ($p in $nsisPaths) {
    if (Test-Path $p) {
        $makensis = $p
        break
    }
}

# Also try where.exe
if (-not $makensis) {
    try {
        $makensis = (Get-Command makensis -ErrorAction SilentlyContinue).Source
    } catch { }
}

if ($makensis) {
    Write-Host "  ✓ NSIS found: $makensis" -ForegroundColor Green

    # Get version
    $nsisVersion = & $makensis /VERSION 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    Version: $nsisVersion" -ForegroundColor Gray
    }
} else {
    Write-Host "  ✗ NSIS not found." -ForegroundColor Yellow
    Write-Host ""

    # Check for winget
    $hasWinget = $false
    try {
        $wingetVersion = (winget --version 2>$null)
        if ($LASTEXITCODE -eq 0) {
            $hasWinget = $true
        }
    } catch { }

    if ($hasWinget) {
        Write-Host "  Installing NSIS via winget..." -ForegroundColor Cyan
        winget install NSIS.NSIS --accept-package-agreements --accept-source-agreements

        if ($LASTEXITCODE -ne 0) {
            Write-Host ""
            Write-Host "  ✗ winget install failed." -ForegroundColor Red
            Write-Host "  Please install NSIS manually from: https://nsis.sourceforge.io/Download"
            Write-Host "  Or: choco install nsis"
            Write-Host "  Or: scoop install nsis"
            exit 1
        }

        # Refresh PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + `
                     [System.Environment]::GetEnvironmentVariable("Path","User")

        # Re-check
        foreach ($p in $nsisPaths) {
            if (Test-Path $p) {
                $makensis = $p
                break
            }
        }
        if (-not $makensis) {
            try {
                $makensis = (Get-Command makensis -ErrorAction SilentlyContinue).Source
            } catch { }
        }

        if ($makensis) {
            Write-Host "  ✓ NSIS installed successfully." -ForegroundColor Green
        } else {
            Write-Host "  ✗ NSIS installed but makensis.exe not found in PATH." -ForegroundColor Red
            Write-Host "  Try restarting your terminal and running this script again."
            exit 1
        }
    } else {
        Write-Host "  winget not available. Install NSIS manually:" -ForegroundColor Yellow
        Write-Host "    - Download: https://nsis.sourceforge.io/Download"
        Write-Host "    - Or: choco install nsis (if using Chocolatey)"
        Write-Host "    - Or: scoop install nsis (if using Scoop)"
        exit 1
    }
}

# ── Step 2: Locate lychee-desktop.exe ─────────────────────────────────
Write-Host "[2/5] Locating lychee-desktop.exe..." -ForegroundColor White

if ($ExePath -and (Test-Path $ExePath)) {
    $BinaryPath = Resolve-Path $ExePath
} else {
    # Auto-detect: try build/bin first (production), then dist, then root
    $searchPaths = @(
        "$ProjectRoot\build\bin\lychee-desktop.exe",
        "$ProjectRoot\dist\lychee-desktop.exe",
        "$ProjectRoot\lychee-desktop.exe"
    )

    $BinaryPath = $null
    foreach ($p in $searchPaths) {
        if (Test-Path $p) {
            $BinaryPath = Resolve-Path $p
            break
        }
    }
}

if (-not $BinaryPath) {
    Write-Host "  ✗ lychee-desktop.exe not found!" -ForegroundColor Red
    Write-Host "  Searched:"
    foreach ($p in $searchPaths) { Write-Host "    $p" }
    Write-Host ""
    Write-Host "  Build it first: cd .. && wails build --platform windows/amd64"
    Write-Host "  Or specify path: .\build-installer.ps1 -ExePath C:\path\to\lychee-desktop.exe"
    exit 1
}

$BinarySize = [math]::Round((Get-Item $BinaryPath).Length / 1MB, 2)
Write-Host "  ✓ Found: $BinaryPath" -ForegroundColor Green
Write-Host "    Size: $BinarySize MB" -ForegroundColor Gray

# ── Step 3: Verify icon ──────────────────────────────────────────────
Write-Host "[3/5] Checking icon..." -ForegroundColor White
$iconPath = "$ProjectRoot\build\windows\icon.ico"
if (Test-Path $iconPath) {
    Write-Host "  ✓ Icon found: $iconPath" -ForegroundColor Green
} else {
    Write-Host "  ⚠ No icon found at $iconPath" -ForegroundColor Yellow
    Write-Host "    Installer will proceed without custom icon."
    $iconPath = ""
}

# ── Step 4: Ensure output directories ─────────────────────────────────
Write-Host "[4/5] Preparing output directories..." -ForegroundColor White
$distDir = "$ProjectRoot\dist"
if (-not (Test-Path $distDir)) {
    New-Item -ItemType Directory -Path $distDir -Force | Out-Null
}
Write-Host "  ✓ Output: $distDir" -ForegroundColor Green

# ── Step 5: Run makensis ──────────────────────────────────────────────
Write-Host "[5/5] Building installer..." -ForegroundColor White
Write-Host ""

$nsiFile = "$ScriptDir\installer.nsi"

# Build makensis arguments
$nsisArgs = @(
    "/DEXE_PATH=`"$BinaryPath`""
    "/DPRODUCT_VERSION=`"$Version`""
    "/DOUTPUT_DIR=`"$distDir`""
)

if ($iconPath) {
    $nsisArgs += "/DICON_PATH=`"$iconPath`""
}

$nsisArgs += "`"$nsiFile`""

Write-Host "  Running: makensis $($nsisArgs -join ' ')" -ForegroundColor Gray
Write-Host ""

# Run
$nsisOutput = & $makensis @nsisArgs 2>&1
$exitCode = $LASTEXITCODE

# Display output
$nsisOutput | ForEach-Object {
    if ($_ -match "error|Error|ERROR") {
        Write-Host $_ -ForegroundColor Red
    } elseif ($_ -match "warning|Warning|WARNING") {
        Write-Host $_ -ForegroundColor Yellow
    } else {
        Write-Host $_ -ForegroundColor Gray
    }
}

if ($exitCode -ne 0) {
    Write-Host ""
    Write-Host "  ✗ Build FAILED (exit code $exitCode)" -ForegroundColor Red
    exit $exitCode
}

# ── Report ────────────────────────────────────────────────────────────
$outputFile = "$distDir\Lychee-Desktop-$Version-Setup.exe"
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   ✓  INSTALLER BUILT SUCCESSFULLY                    ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

if (Test-Path $outputFile) {
    $installerSize = [math]::Round((Get-Item $outputFile).Length / 1MB, 2)
    Write-Host "  File:    $outputFile" -ForegroundColor White
    Write-Host "  Size:    $installerSize MB" -ForegroundColor White
    Write-Host "  Version: $Version" -ForegroundColor White
    Write-Host "  Binary:  $BinarySize MB" -ForegroundColor Gray
    Write-Host "  Ratio:   $([math]::Round($installerSize/$BinarySize*100, 0))% of binary size (LZMA compressed)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "  Install: .\$outputFile" -ForegroundColor Cyan
Write-Host "  Silent:  .\$outputFile /S" -ForegroundColor Gray
Write-Host "  Silent+Launch: .\$outputFile /S /R" -ForegroundColor Gray
Write-Host ""
