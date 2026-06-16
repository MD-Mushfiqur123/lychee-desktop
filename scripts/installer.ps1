# Lychee Desktop Windows Installer
# Copies lychee-desktop.exe to Program Files, creates Start Menu & Desktop shortcuts
# Run as Administrator for system-wide install

param(
    [switch]$UserOnly,          # Install for current user only (no admin required)
    [switch]$NoStartup,         # Skip adding to startup folder
    [switch]$NoDesktopShortcut, # Skip creating Desktop shortcut
    [string]$ExePath = ""       # Path to lychee-desktop.exe (auto-detects if empty)
)

$ErrorActionPreference = "Stop"

# --- Detect paths ---
if ($ExePath -eq "") {
    $possiblePaths = @(
        "$PSScriptRoot\..\build\bin\lychee-desktop.exe",
        "$PSScriptRoot\..\lychee-desktop.exe"
    )
    foreach ($p in $possiblePaths) {
        if (Test-Path $p) {
            $ExePath = Resolve-Path $p
            break
        }
    }
}

if (-not (Test-Path $ExePath)) {
    Write-Host "[ERROR] lychee-desktop.exe not found." -ForegroundColor Red
    Write-Host "  Searched:"
    foreach ($p in $possiblePaths) { Write-Host "    $p" }
    Write-Host "  Usage: .\installer.ps1 -ExePath 'C:\path\to\lychee-desktop.exe'"
    exit 1
}

$exeName = [System.IO.Path]::GetFileName($ExePath)

# --- Determine install directory ---
if ($UserOnly) {
    $installDir = "$env:LOCALAPPDATA\Programs\Lychee Desktop"
    $startMenuDir = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Lychee Desktop"
    $startupDir = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
} else {
    # Check admin
    $isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    if (-not $isAdmin) {
        Write-Host "[!] Not running as Administrator." -ForegroundColor Yellow
        Write-Host "    For system-wide install, re-run as Admin."
        Write-Host "    For current-user install, use: .\installer.ps1 -UserOnly"
        Write-Host "    Continuing with UserOnly mode..."
        $UserOnly = $true
        $installDir = "$env:LOCALAPPDATA\Programs\Lychee Desktop"
        $startMenuDir = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Lychee Desktop"
        $startupDir = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
    } else {
        $installDir = "${env:ProgramFiles}\Lychee Desktop"
        $startMenuDir = "$env:ALLUSERSPROFILE\Microsoft\Windows\Start Menu\Programs\Lychee Desktop"
        $startupDir = "$env:ALLUSERSPROFILE\Microsoft\Windows\Start Menu\Programs\Startup"
    }
}

Write-Host "╔══════════════════════════════════════════════╗"
Write-Host "║       Lychee Desktop Installer               ║"
Write-Host "╚══════════════════════════════════════════════╝"
Write-Host ""
Write-Host "  Source:  $ExePath"
Write-Host "  Install: $installDir"
Write-Host "  Mode:    $(if ($UserOnly) { 'Current User' } else { 'All Users (Admin)' })"
Write-Host ""

# --- Step 1: Copy executable ---
Write-Host "[1/4] Copying files..."
New-Item -ItemType Directory -Force -Path $installDir | Out-Null
Copy-Item -Path $ExePath -Destination "$installDir\$exeName" -Force
Write-Host "  ✓ $installDir\$exeName"

# --- Step 2: Create Start Menu shortcut ---
Write-Host "[2/4] Creating Start Menu shortcut..."
New-Item -ItemType Directory -Force -Path $startMenuDir | Out-Null
$WshShell = New-Object -ComObject WScript.Shell
$shortcut = $WshShell.CreateShortcut("$startMenuDir\Lychee Desktop.lnk")
$shortcut.TargetPath = "$installDir\$exeName"
$shortcut.WorkingDirectory = $installDir
$shortcut.Description = "Lychee Desktop — Universal LLM Runtime"
$shortcut.IconLocation = "$installDir\$exeName,0"
$shortcut.Save()
Write-Host "  ✓ $startMenuDir\Lychee Desktop.lnk"

# --- Step 3: Create Desktop shortcut ---
if (-not $NoDesktopShortcut) {
    Write-Host "[3/4] Creating Desktop shortcut..."
    $desktopDir = [Environment]::GetFolderPath("Desktop")
    $desktopShortcut = $WshShell.CreateShortcut("$desktopDir\Lychee Desktop.lnk")
    $desktopShortcut.TargetPath = "$installDir\$exeName"
    $desktopShortcut.WorkingDirectory = $installDir
    $desktopShortcut.Description = "Lychee Desktop — Universal LLM Runtime"
    $desktopShortcut.IconLocation = "$installDir\$exeName,0"
    $desktopShortcut.Save()
    Write-Host "  ✓ $desktopDir\Lychee Desktop.lnk"
} else {
    Write-Host "[3/4] Desktop shortcut skipped (--NoDesktopShortcut)"
}

# --- Step 4: Add to startup (optional) ---
if (-not $NoStartup) {
    Write-Host "[4/4] Adding to startup folder..."
    $startupShortcut = $WshShell.CreateShortcut("$startupDir\Lychee Desktop.lnk")
    $startupShortcut.TargetPath = "$installDir\$exeName"
    $startupShortcut.WorkingDirectory = $installDir
    $startupShortcut.Description = "Start Lychee Desktop on login"
    $startupShortcut.Arguments = "--minimized"
    $startupShortcut.Save()
    Write-Host "  ✓ $startupDir\Lychee Desktop.lnk"
} else {
    Write-Host "[4/4] Auto-start skipped (--NoStartup)"
}

Write-Host ""
Write-Host "╔═══════════════════════════════════════╗"
Write-Host "║  ✓ Installation complete!            ║"
Write-Host "╚═══════════════════════════════════════╝"
Write-Host ""
Write-Host "To uninstall, delete:"
Write-Host "  $installDir"
Write-Host "  $startMenuDir"
if (-not $NoDesktopShortcut) {
    Write-Host "  $desktopDir\Lychee Desktop.lnk"
}
Write-Host ""
