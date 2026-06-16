# RUN-TEST.md — Lychee Desktop Test Guide

## Prerequisites

- **Lychee CLI** installed and on PATH (verify: `lychee --version`)
- **Lychee Desktop** built:
  ```powershell
  cd lychee-desktop
  .\scripts\build.ps1
  ```
  Or if you haven't built yet, run in dev mode: `.\scripts\dev.ps1`

## Step 1: Start Lychee First

Lychee Desktop manages the `lychee serve` process — but you can also start it manually for testing:

```bash
lychee serve
```

This starts the Lychee backend API on its default port. Keep this terminal open.

## Step 2: Open the Desktop App

### Option A: Run the built binary
```powershell
.\build\bin\lychee-desktop.exe
```

### Option B: Run in dev mode
```powershell
.\scripts\dev.ps1
```

A native window should open titled **"Lychee Desktop"** at 1200×800.

## Step 3: What to Test

| # | Test | Expected Behavior |
|---|------|-------------------|
| 1 | **Window launches** | Native window appears with "Lychee Desktop" title |
| 2 | **UI renders** | React frontend loads (not blank / not error page) |
| 3 | **Window resize** | Drag edges — minimum size is 900×600 |
| 4 | **Go backend bound** | Go methods (`StartLychee`, `StopLychee`, etc.) are callable from JS |
| 5 | **Lychee process lifecycle** | Starting/stoping lychee from the UI works |
| 6 | **Chat functionality** | Send messages and receive responses |
| 7 | **Pipeline builder** | Create/edit pipelines visually |
| 8 | **Model manager** | Switch models and verify |

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| "wails: command not found" | Install Wails CLI: `go install github.com/wailsapp/wails/v2/cmd/wails@latest` |
| Frontend blank/white | Run `cd frontend && npm install && npm run build` |
| "lychee: command not found" | Install Lychee CLI or update PATH |
| Port already in use | Kill the existing lychee process: `taskkill /F /IM lychee.exe` |
| Build fails with Go errors | Run `go mod tidy` in the project root |

## Clean Build

```powershell
# Full clean rebuild
Remove-Item -Recurse -Force build/bin -ErrorAction SilentlyContinue
cd frontend
npm ci
npm run build
cd ..
wails build -clean
```
