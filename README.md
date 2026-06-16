# Lychee Desktop

> The native desktop UI for Lychee — chat, pipeline builder, model manager

Lychee Desktop is a [Wails](https://wails.io) desktop application that wraps the Lychee AI platform in a native window. Manage models, build pipelines, and chat — all from your desktop.

## Features

- **Native Desktop Shell** — Runs Lychee in a dedicated window
- **Chat Interface** — Full Lychee chat experience with streaming responses
- **Pipeline Builder (Studio)** — Visual pipeline construction and management
- **Model Manager** — Switch between models, configure parameters, view status
- **Process Lifecycle** — Automatically starts/stops `lychee serve` with the desktop app
- **Windows Installer** — One-command install with Start Menu, Desktop shortcuts & auto-start
- **Cross-Platform** — Windows, macOS, and Linux support via Wails

## Screenshot

![Lychee Desktop](docs/screenshot.png)

*Screenshot coming soon*

## Quick Start

### Download (Recommended)

Get the latest `.exe` from [Releases](https://github.com/lychee-dev/lychee-desktop/releases).

### Windows Installer

```powershell
# User-only install (no admin required)
.\scripts\installer.ps1 -UserOnly

# System-wide install (run as Administrator)
.\scripts\installer.ps1
```

### Double-click Launch

```cmd
scripts\launch.bat
```

Starts `lychee serve` + Lychee Desktop automatically.

---

## Installation

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

| Script | Purpose |
|--------|---------|
| `scripts/build.ps1` | Build with Wails |
| `scripts/dev.ps1` | Start dev mode with hot reload |
| `scripts/installer.ps1` | Windows installer (copies exe, creates shortcuts, auto-start) |
| `scripts/start-with-lychee.ps1` | Managed launch — starts lychee serve, waits for API, launches desktop, auto-stops on close |
| `scripts/launch.bat` | Simple double-click batch launcher |
| `scripts/generate-icon.js` | Generate 256×256 PNG app icon |

## Architecture

```
lychee-desktop/
├── main.go              # Wails entry point
├── app.go               # Go backend (Lychee process management)
├── wails.json           # Wails project config
├── USAGE.md             # Detailed usage guide
├── frontend/            # React + TypeScript frontend
│   ├── src/             # React components
│   │   ├── components/  # Chat, Home, Studio, Settings, etc.
│   │   └── hooks/       # useLychee, usePipeline
│   ├── dist/            # Built assets (embedded by Wails)
│   └── package.json
├── build/               # Build assets
│   ├── appicon.png      # App icon (256×256 PNG)
│   ├── appicon.svg      # App icon (SVG source)
│   └── windows/         # Windows-specific (icon.ico, manifest, installer NSIS)
├── scripts/             # Utility scripts
└── .github/workflows/   # CI/CD
    └── build-desktop.yml
```

## How It Works

1. Lychee Desktop launches and optionally starts a local `lychee serve` process in the background
2. The embedded webview loads the Lychee web UI
3. Go ↔ JS bindings manage the lychee process lifecycle (start, stop, health check)
4. Closing the desktop window also stops the lychee process
5. Use `scripts/start-with-lychee.ps1` for managed lifecycle with auto-stop

## CI/CD

GitHub Actions builds are configured in `.github/workflows/build-desktop.yml`:
- Builds on every push to `main`
- Uploads `lychee-desktop.exe` as an artifact
- Auto-attaches builds to GitHub Releases on tag

## Documentation

- **[USAGE.md](USAGE.md)** — Full usage guide: chat, Studio, model management, troubleshooting

## Community

<div align="center">

[![GitHub Stars](https://img.shields.io/github/stars/MD-Mushfiqur123/lychee-desktop?style=social)](https://github.com/MD-Mushfiqur123/lychee-desktop/stargazers)
[![Discord](https://img.shields.io/badge/Discord-Join%20Server-5865F2?logo=discord&logoColor=white)](https://discord.gg/lychee-dev)
[![GitHub Discussions](https://img.shields.io/badge/GitHub-Discussions-181717?logo=github)](https://github.com/MD-Mushfiqur123/lychee-desktop/discussions)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.0-4baaaa.svg)](CODE_OF_CONDUCT.md)

</div>

| Channel | Purpose |
|---------|---------|
| 💬 **Discord** | Real-time chat, community help, showcase your projects — [Join here](https://discord.gg/lychee-dev) |
| 🗣️ **GitHub Discussions** | Ask questions, share ideas, discuss features — [Start a discussion](https://github.com/MD-Mushfiqur123/lychee-desktop/discussions) |
| 📝 **Contributing Guide** | Setup, project structure, code style, PR workflow — [CONTRIBUTING.md](CONTRIBUTING.md) |
| 📜 **Code of Conduct** | Community standards and expectations — [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) |

---

## License

MIT © Lychee Tech

---

## 🔗 Related Projects

| Project | Description | Link |
|---------|-------------|------|
| 🍒 **Lychee CLI** | Core orchestration layer for local LLMs | [github.com/MD-Mushfiqur123/lychee](https://github.com/MD-Mushfiqur123/lychee) |
| 🌐 **Lychee Landing Page** | Official project website & showcase | [md-mushfiqur123.github.io/lychee-landing-page](https://md-mushfiqur123.github.io/lychee-landing-page) |
| 📖 **Lychee Docs** | Full documentation (VitePress) | [md-mushfiqur123.github.io/lychee-docs](https://md-mushfiqur123.github.io/lychee-docs/) |

> 💡 **Looking for the CLI?** → [github.com/MD-Mushfiqur123/lychee](https://github.com/MD-Mushfiqur123/lychee)  
> 🌐 **Looking for the website?** → [md-mushfiqur123.github.io/lychee-landing-page](https://md-mushfiqur123.github.io/lychee-landing-page)

---

Built with [Wails](https://wails.io) + [React](https://react.dev) + [TypeScript](https://www.typescriptlang.org/)
