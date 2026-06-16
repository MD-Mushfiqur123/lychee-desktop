# Lychee Desktop — Usage Guide

> Native desktop app for Lychee — universal LLM runtime

Lychee Desktop wraps the Lychee AI platform in a native window with system tray support, model management, pipeline builder, and a full chat interface.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Building from Source](#building-from-source)
- [Running the App](#running-the-app)
- [Using the Chat](#using-the-chat)
- [Using Studio](#using-studio)
- [Managing Models](#managing-models)
- [System Tray & Auto-start](#system-tray--auto-start)
- [Scripts Reference](#scripts-reference)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| [Go](https://go.dev/dl/) | 1.21+ | Backend runtime |
| [Node.js](https://nodejs.org/) | 18+ | Frontend build |
| [Wails CLI](https://wails.io/docs/gettingstarted/installation) | v2 | Desktop framework |
| [Lychee](https://github.com/lychee-dev/lychee) | latest | Core LLM runtime |

### Install Wails CLI

```bash
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```

### Verify Installation

```bash
wails doctor
```

Should show all green checkmarks. On Windows, make sure you have:
- **WebView2 Runtime** (pre-installed on Windows 11, [download](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) for Windows 10)
- **GCC** — install via [MSYS2](https://www.msys2.org/) or `choco install mingw`

---

## Installation

### Download Pre-built (recommended)

Get the latest `.exe` from [Releases](https://github.com/lychee-dev/lychee-desktop/releases).

### Windows Installer

```powershell
# User-only install (no admin required)
.\scripts\installer.ps1 -UserOnly

# System-wide install (run as Administrator)
.\scripts\installer.ps1

# Skip auto-start
.\scripts\installer.ps1 -NoStartup

# Custom binary location
.\scripts\installer.ps1 -ExePath "D:\apps\lychee-desktop.exe"
```

The installer:
- Copies `lychee-desktop.exe` to `Program Files\Lychee Desktop`
- Creates Start Menu shortcut
- Creates Desktop shortcut
- Optionally adds to startup folder (auto-start on login)

---

## Building from Source

```bash
# 1. Clone
git clone https://github.com/lychee-dev/lychee-desktop.git
cd lychee-desktop

# 2. Install frontend dependencies
cd frontend
npm install
cd ..

# 3. Generate app icon (optional, already included)
node scripts/generate-icon.js

# 4. Build
wails build
```

**Output:** `build/bin/lychee-desktop.exe` (Windows) or `build/bin/lychee-desktop` (macOS/Linux)

### Build for Development

```bash
# Hot-reload dev mode
wails dev

# Or use the script
.\scripts\dev.ps1
```

This starts:
- Vite dev server (frontend hot reload)
- Go backend with bound methods
- Wails dev server at `http://localhost:34115` (browser debugging)

---

## Running the App

### Option 1: Direct Launch (Simplest)

Double-click `lychee-desktop.exe`. The app will auto-start a local `lychee serve` process.

### Option 2: Launcher Script (with lifecycle management)

```powershell
# PowerShell wrapper — starts lychee serve, waits for API, launches desktop
.\scripts\start-with-lychee.ps1
```

```cmd
:: Batch script — quick double-click launch
scripts\launch.bat
```

### Option 3: Manual

```bash
# Terminal 1 — Start lychee backend
lychee serve

# Terminal 2 — Launch desktop
./lychee-desktop.exe
```

### What Happens on Launch

1. Desktop app starts
2. If no `lychee serve` is running, the app spawns it automatically
3. WebView loads the Lychee web UI
4. Go ↔ JS bindings manage lychee process lifecycle
5. Closing the desktop window stops the lychee process

---

## Using the Chat

The **Chat** tab provides the full Lychee chat experience:

1. **Select a model** — Use the dropdown in the top bar to choose which LLM to use
2. **Type a message** — Type in the input box at the bottom
3. **Send** — Press Enter or click the send button
4. **Watch streaming** — Responses stream in real-time with Markdown rendering
5. **Code blocks** — Syntax-highlighted code blocks with a copy button
6. **History** — Previous conversations appear in the left sidebar

### Chat Features

| Feature | Description |
|---------|-------------|
| Streaming | Real-time token-by-token response display |
| Markdown | Full Markdown rendering including tables, lists, code |
| Syntax Highlighting | Code blocks with language detection |
| Copy Code | One-click copy for code blocks |
| Model Switching | Change models mid-conversation |
| Clear Chat | Reset the conversation |

---

## Using Studio

The **Studio** tab is the pipeline builder — compose multiple LLM calls, transforms, and logic blocks:

### Pipeline Concepts

- **Stage** — A single processing step (LLM call, transform, condition, input)
- **Pipeline** — A directed graph of stages connected by data flow
- **Run** — Execute the pipeline; data flows stage by stage

### Building a Pipeline

1. Click **Studio** in the sidebar
2. Click **+ New Pipeline** or select an existing one
3. Add stages from the toolbox:
   - **LLM Call** — Send a prompt to a model
   - **Transform** — Process text (summarize, extract, translate)
   - **Condition** — Branch based on logic (if/else)
   - **Input** — Define pipeline inputs
   - **Output** — Collect final results
4. Connect stages by dragging from output handles to input handles
5. Configure each stage (prompt, model, parameters)
6. Click **Run** to execute

### Example: Summarize + Translate

```
Input → LLM (Summarize with GPT-4) → LLM (Translate to French) → Output
```

### Pipeline Features

| Feature | Description |
|---------|-------------|
| Visual Editor | Drag-and-drop stage composition |
| Multiple Models | Mix different models in one pipeline |
| Conditional Logic | Branch based on output analysis |
| Real-time Preview | See stage outputs as they complete |
| Reusable Templates | Save and reuse pipeline configurations |
| Export/Import | Share pipelines as JSON |

---

## Managing Models

The **Models** tab lets you configure and manage LLM providers:

### Adding a Model

1. Click **Models** in the sidebar
2. Click **+ Add Model**
3. Fill in the provider details:
   - **Provider** — OpenAI, Anthropic, Gemini, Ollama, etc.
   - **API Key** — Your provider API key
   - **Model Name** — e.g., `gpt-4o`, `claude-sonnet-4-20250514`
   - **Base URL** (optional) — For custom endpoints or proxies
4. Click **Save**

### Model Operations

| Action | Description |
|--------|-------------|
| Add | Register a new model provider |
| Edit | Update API key, parameters, or config |
| Remove | Delete a model registration |
| Test | Send a test ping to verify connectivity |
| Set Default | Choose which model loads by default |
| Status | View model availability and latency |

### Supported Providers

- **OpenAI** — GPT-4o, GPT-4, GPT-3.5
- **Anthropic** — Claude 3.5 Sonnet, Claude 3 Opus
- **Google** — Gemini 1.5 Pro, Gemini 1.5 Flash
- **Ollama** — Local models (Llama, Mistral, etc.)
- **OpenRouter** — Multi-provider gateway
- **Custom** — Any OpenAI-compatible endpoint

### Parameters

Each model supports adjustable parameters:
- **Temperature** — Creativity (0.0 = deterministic, 1.0 = creative)
- **Max Tokens** — Response length limit
- **Top P** — Nucleus sampling
- **System Prompt** — Default system message
- **Stop Sequences** — Custom stop tokens

---

## System Tray & Auto-start

Lychee Desktop uses a lightweight approach instead of a traditional system tray:

### Auto-start on Login

The installer (`scripts/installer.ps1`) can add Lychee Desktop to the Windows startup folder. To manually configure:

1. Press `Win + R`, type `shell:startup`, press Enter
2. Create a shortcut to `lychee-desktop.exe`
3. Right-click the shortcut → Properties → Target → add `--minimized`

### Run Minimized to Tray

Add `--minimized` to the shortcut target to start the app minimized. Use the window controls to minimize to taskbar.

### Process Lifecycle

The wrapper script `scripts/start-with-lychee.ps1` manages both processes:
- Starts `lychee serve` first
- Waits for the API to respond
- Launches the desktop app
- Automatically stops `lychee serve` when the desktop closes

---

## Scripts Reference

| Script | Purpose | Usage |
|--------|---------|-------|
| `scripts/build.ps1` | Build with Wails | `.\scripts\build.ps1` |
| `scripts/dev.ps1` | Start dev mode | `.\scripts\dev.ps1` |
| `scripts/installer.ps1` | Windows installer | `.\scripts\installer.ps1 [-UserOnly] [-NoStartup]` |
| `scripts/start-with-lychee.ps1` | Managed launch wrapper | `.\scripts\start-with-lychee.ps1` |
| `scripts/launch.bat` | Simple double-click launcher | Double-click or `scripts\launch.bat` |
| `scripts/generate-icon.js` | Generate app icon PNG | `node scripts/generate-icon.js` |

---

## Troubleshooting

### "lychee not found"

Make sure Lychee is installed and in your PATH:

```bash
# Check if lychee is available
where lychee

# Or specify the full path
.\scripts\start-with-lychee.ps1 -LycheePath "C:\tools\lychee.exe"
```

### White/Blank Window

- Ensure **WebView2 Runtime** is installed ([download](https://developer.microsoft.com/en-us/microsoft-edge/webview2/))
- Run `wails doctor` to check for missing dependencies

### Build Errors on Windows

```bash
# Install GCC via chocolatey
choco install mingw

# Or via MSYS2
# 1. Install MSYS2 from https://www.msys2.org/
# 2. Run: pacman -S mingw-w64-x86_64-gcc
```

### API Connection Failed

```bash
# Check if lychee is running
curl http://localhost:8080/api/health

# Check if port is in use
netstat -ano | findstr :8080

# Try a different port
.\scripts\start-with-lychee.ps1 -ApiPort 8081
```

### "This app can't run on your PC"

This is a Windows SmartScreen warning for unsigned executables. Click "More info" → "Run anyway".

---

## License

MIT © Lychee Tech

---

Built with [Wails](https://wails.io) + [React](https://react.dev) + [TypeScript](https://www.typescriptlang.org/)
