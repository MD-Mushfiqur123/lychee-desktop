# Lychee Desktop

> The native desktop UI for Lychee — chat, pipeline builder, model manager

[![GitHub Stars](https://img.shields.io/github/stars/MD-Mushfiqur123/lychee-desktop?style=social)](https://github.com/MD-Mushfiqur123/lychee-desktop/stargazers)
[![Discord](https://img.shields.io/badge/Discord-Join%20Server-5865F2?logo=discord&logoColor=white)](https://discord.gg/lychee-dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Lychee Desktop is a [Wails](https://wails.io) desktop application that wraps the Lychee AI platform in a native window. Manage models, build pipelines, and chat — all from your desktop.

---

## Features

| Feature | Description |
|---------|-------------|
| 💬 **Chat** | Full Lychee chat with streaming responses |
| 🔧 **Pipeline Studio** | Visual drag-and-drop pipeline builder |
| 🤖 **Model Manager** | Switch models, configure parameters, view status |
| ⚙️ **Settings** | Configure backends, API keys, and app preferences |
| 📤 **Export/Import** | Share pipelines as JSON files — export, import, or send to teammates |
| 🔄 **Auto-Start Server** | Automatically starts/stops `lychee serve` with the desktop app |
| ⌨️ **Keyboard Shortcuts** | Quick actions for chat, navigation, and pipeline operations |
| 🖥️ **Native Window** | Dedicated desktop window — no browser tabs needed |
| 📦 **Windows Installer** | One-command install with Start Menu, Desktop shortcuts & auto-start |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + N` | New chat |
| `Ctrl + Shift + P` | Open Pipeline Studio |
| `Ctrl + ,` | Open Settings |
| `Ctrl + R` | Refresh / reconnect |
| `F5` | Refresh page |

---

## Screenshots

<!-- Replace with actual screenshots -->

| Chat | Pipeline Studio | Model Manager |
|:----:|:---------------:|:-------------:|
| ![Chat](docs/screenshots/chat.png) | ![Studio](docs/screenshots/studio.png) | ![Models](docs/screenshots/models.png) |

*Screenshots coming soon — PRs welcome!*

---

## Quick Start

### Download

**[⬇️ Download Latest Release](https://github.com/MD-Mushfiqur123/lychee-desktop/releases/latest)**

Grab the `.exe` for Windows, or the macOS/Linux binary from [Releases](https://github.com/MD-Mushfiqur123/lychee-desktop/releases).

### Launch

Double-click `launch.bat` or run:

```cmd
scripts\launch.bat
```

This starts `lychee serve` automatically, then opens Lychee Desktop. Closing the window stops the server.

### Windows Installer

```powershell
# User-only install (no admin required)
.\scripts\installer.ps1 -UserOnly

# System-wide install (run as Administrator)
.\scripts\installer.ps1
```

Installs to `%LOCALAPPDATA%\Programs\lychee-desktop` with Start Menu shortcut and auto-start on login.

---

## Build from Source

### Prerequisites

- [Go](https://go.dev/dl/) 1.21+
- [Node.js](https://nodejs.org/) 18+
- [Wails CLI](https://wails.io/docs/gettingstarted/installation): `go install github.com/wailsapp/wails/v2/cmd/wails@latest`
- [Lychee](https://github.com/lychee-dev/lychee) — the core backend (optional; only needed to run, not to build)

### Build

```bash
# Clone
git clone https://github.com/MD-Mushfiqur123/lychee-desktop.git
cd lychee-desktop

# Install frontend deps
cd frontend && npm install && cd ..

# Build
wails build
```

Binary output:

| Platform  | Path |
|-----------|------|
| Windows   | `build/bin/lychee-desktop.exe` |
| macOS     | `build/bin/lychee-desktop` |
| Linux     | `build/bin/lychee-desktop` |

### Dev Mode (hot reload)

```bash
wails dev
```

Starts:
- Vite dev server for the React frontend (hot reload)
- Go backend with bound methods
- Wails dev server at `http://localhost:34115` for browser debugging

---

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
│   └── windows/         # Windows-specific (icon.ico, manifest, NSIS installer)
├── scripts/             # Utility scripts
│   ├── build.ps1        # Build wrapper
│   ├── dev.ps1          # Dev mode launcher
│   ├── launch.bat       # Double-click launcher
│   ├── installer.ps1    # Windows installer
│   └── start-with-lychee.ps1  # Managed lifecycle launcher
└── .github/workflows/   # CI/CD
    └── build-desktop.yml
```

## How It Works

1. Desktop app launches and starts `lychee serve` in the background
2. Embedded webview loads the Lychee web UI
3. Go ↔ JS bindings manage process lifecycle (start, stop, health check)
4. Closing the desktop window gracefully stops the lychee process

---

## CI/CD

GitHub Actions in `.github/workflows/build-desktop.yml`:
- Builds on every push to `main`
- Uploads `lychee-desktop.exe` as an artifact
- Auto-attaches builds to GitHub Releases on tag push

---

## Documentation

- **[USAGE.md](USAGE.md)** — Full usage guide: chat, Studio, model management, troubleshooting

---

## Community

| Channel | Purpose |
|---------|---------|
| 💬 **Discord** | Real-time chat, community help, showcase — [Join](https://discord.gg/lychee-dev) |
| 🗣️ **Discussions** | Questions, ideas, feature discussion — [Start one](https://github.com/MD-Mushfiqur123/lychee-desktop/discussions) |
| 📝 **Contributing** | Setup, code style, PR workflow — [CONTRIBUTING.md](CONTRIBUTING.md) |
| 📜 **Code of Conduct** | Community standards — [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) |

---

## Related Projects

| Project | Description |
|---------|-------------|
| 🍒 **Lychee CLI** | Core orchestration for local LLMs — [repo](https://github.com/MD-Mushfiqur123/lychee) |
| 🌐 **Landing Page** | Official project website — [site](https://md-mushfiqur123.github.io/lychee-landing-page) |
| 📖 **Lychee Docs** | Full documentation (VitePress) — [docs](https://md-mushfiqur123.github.io/lychee-docs/) |

---

## License

MIT © Lychee Tech

---

Built with [Wails](https://wails.io) + [React](https://react.dev) + [TypeScript](https://www.typescriptlang.org/)
