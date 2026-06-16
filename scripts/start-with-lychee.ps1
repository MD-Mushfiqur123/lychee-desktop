# Lychee Desktop — Wrapper Script
# Starts lychee serve in background, then launches the desktop app.
# On desktop close, stops the lychee process.

param(
    [string]$LycheePath = "lychee",    # Path to lychee binary
    [int]$WaitSeconds = 3,             # Seconds to wait for API ready
    [int]$ApiPort = 8080,              # Lychee API port
    [string]$DesktopExe = ""           # Path to lychee-desktop.exe (auto-detect)
)

$ErrorActionPreference = "Stop"
$script:lycheePid = $null
$script:exitCode = 0

# --- Cleanup handler ---
function Stop-LycheeProcess {
    if ($script:lycheePid) {
        try {
            $proc = Get-Process -Id $script:lycheePid -ErrorAction SilentlyContinue
            if ($proc) {
                Write-Host "[lychee] Stopping lychee serve (PID: $script:lycheePid)..."
                $proc.Kill()
                $proc.WaitForExit(5000)
                Write-Host "[lychee] Process stopped."
            }
        } catch {
            Write-Host "[lychee] Failed to stop process: $_"
        }
    }
}

# Register cleanup on script exit
Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action {
    # This runs when pwsh exits — best effort cleanup
    if ($script:lycheePid) {
        Stop-Process -Id $script:lycheePid -Force -ErrorAction SilentlyContinue
    }
} | Out-Null

# --- Detect desktop exe ---
if ($DesktopExe -eq "") {
    $possibleExes = @(
        "$PSScriptRoot\..\build\bin\lychee-desktop.exe",
        "$PSScriptRoot\..\lychee-desktop.exe",
        "${env:ProgramFiles}\Lychee Desktop\lychee-desktop.exe",
        "${env:LOCALAPPDATA}\Programs\Lychee Desktop\lychee-desktop.exe"
    )
    foreach ($p in $possibleExes) {
        if (Test-Path $p) {
            $DesktopExe = Resolve-Path $p
            break
        }
    }
}

if (-not (Test-Path $DesktopExe)) {
    Write-Host "[ERROR] lychee-desktop.exe not found." -ForegroundColor Red
    Write-Host "  Specify path: .\start-with-lychee.ps1 -DesktopExe 'C:\path\to\lychee-desktop.exe'"
    exit 1
}

# --- Step 1: Start lychee serve ---
Write-Host "╔══════════════════════════════════════════════╗"
Write-Host "║       Lychee Desktop Launcher                ║"
Write-Host "╚══════════════════════════════════════════════╝"
Write-Host ""
Write-Host "[lychee] Starting 'lychee serve'..."

try {
    $procInfo = Start-Process -FilePath $LycheePath -ArgumentList "serve" -PassThru -NoNewWindow
    $script:lycheePid = $procInfo.Id
    Write-Host "[lychee] Started with PID: $script:lycheePid"
} catch {
    Write-Host "[ERROR] Failed to start lychee: $_" -ForegroundColor Red
    Write-Host "  Make sure 'lychee' is in PATH or use -LycheePath"
    exit 1
}

# --- Step 2: Wait for API to be ready ---
Write-Host "[lychee] Waiting for API on port $ApiPort..."
$ready = $false
$elapsed = 0
$timeout = 30  # max 30 seconds

while ($elapsed -lt $timeout) {
    Start-Sleep -Seconds 1
    $elapsed++

    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$ApiPort/api/health" -TimeoutSec 1 -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $ready = $true
            break
        }
    } catch {
        # Not ready yet — silently retry
    }

    if ($elapsed % 5 -eq 0) {
        Write-Host "[lychee] Still waiting... ($elapsed s)"
    }
}

if (-not $ready) {
    Write-Host "[WARNING] Lychee API did not respond within ${timeout}s." -ForegroundColor Yellow
    Write-Host "  Launching desktop anyway — it will auto-start lychee if needed."
}

if ($ready) {
    Write-Host "[lychee] API ready! (waited $elapsed s)"
}

# Wait just a bit more for stability
Start-Sleep -Seconds $WaitSeconds

# --- Step 3: Launch desktop ---
Write-Host "[desktop] Launching: $DesktopExe"
try {
    $desktopProc = Start-Process -FilePath $DesktopExe -PassThru -Wait
    $script:exitCode = $desktopProc.ExitCode
    Write-Host "[desktop] Closed (exit code: $script:exitCode)"
} catch {
    Write-Host "[ERROR] Failed to launch desktop: $_" -ForegroundColor Red
    $script:exitCode = 1
}

# --- Step 4: Cleanup ---
Stop-LycheeProcess

Write-Host ""
Write-Host "[done] Lychee Desktop session ended."
exit $script:exitCode
