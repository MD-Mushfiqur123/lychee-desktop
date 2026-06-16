# Lychee Desktop

> The native desktop UI for Lychee — chat, pipeline builder, model manager

Lychee Desktop is a [Wails](https://wails.io) desktop application that wraps the Lychee AI platform in a native window. Manage models, build pipelines, and chat — all from your desktop.

## Features

- **Native Desktop Shell** — Runs Lychee in a dedicated window with system tray support
- **Chat Interface** — Full Lychee chat experience with streaming responses
- **Pipeline Builder** — Visual pipeline construction and management
- **Model Manager** — Switch between models, configure parameters, view status
- **Process Lifecycle** — Automatically starts/stops `lychee serve` with the desktop app
- **Cross-Platform** — Windows, macOS, and Linux support via Wails

## Screenshot

![Lychee Desktop](docs/screenshot.png)

*Screenshot coming soon*

## Installation

### Download

Pre-built binaries are available on the [Releases](https://github.com/lychee-dev/lychee-desktop/releases) page.

### Prerequisites

- [Go](https://go.dev/dl/) 1.21+
- [Node.js](https://nodejs.org/) 18+
- [Wails CLI](https://wails.io/docs/gettingstarted/installation): `go install github.com/wailsapp/wails/v2/cmd/wails@latest`
- [Lychee](https://github.com/lychee-dev/lychee) — the core backend

### Build from Source

```bash
# Clone the repo
git clone https://github.com/lychee-dev/lychee-desktop.git
cd lychee-desktop

# Install frontend dependencies
cd frontend && npm install && cd ..

# Build the desktop app
wails build
```

The built binary will be in `build/bin/lychee-desktop.exe` (Windows), `build/bin/lychee-desktop` (macOS/Linux).

## Development

```bash
# Start live development with hot reload
wails dev
```

This starts:
- A Vite dev server for the React frontend (hot reload)
- The Go backend with your bound methods
- A Wails dev server at http://localhost:34115 for browser debugging

### Scripts

```powershell
# Build
.\scripts\build.ps1

# Dev mode
.\scripts\dev.ps1
```

## Architecture

```
lychee-desktop/
├── main.go           # Wails entry point
├── app.go            # Go backend (Lychee process management)
├── wails.json        # Wails project config
├── frontend/         # React + TypeScript frontend
│   ├── src/          # React components
│   ├── dist/         # Built assets (embedded by Wails)
│   └── package.json
├── build/            # Build assets (icons, manifests)
│   ├── appicon.png
│   └── windows/
└── scripts/          # Utility scripts
    ├── build.ps1
    └── dev.ps1
```

## How It Works

1. Lychee Desktop launches and starts a local `lychee serve` process in the background
2. The embedded webview loads the Lychee web UI
3. Go ↔ JS bindings manage the lychee process lifecycle (start, stop, health check)
4. Closing the desktop window also stops the lychee process

## License

MIT © Lychee Tech

---

Built with [Wails](https://wails.io) + [React](https://react.dev) + [TypeScript](https://www.typescriptlang.org/)
