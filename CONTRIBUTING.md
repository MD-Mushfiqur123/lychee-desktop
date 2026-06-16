# Contributing to Lychee Desktop

Thanks for your interest in contributing! Lychee Desktop is the native Wails-based desktop UI for the Lychee AI platform. We welcome contributions of all kinds — bug fixes, features, docs, and feedback.

## Setup

1. **Install prerequisites**
   - [Go](https://go.dev/dl/) 1.21+
   - [Wails v2](https://wails.io/docs/gettingstarted/installation): `go install github.com/wailsapp/wails/v2/cmd/wails@latest`
   - [Node.js](https://nodejs.org/) 18+

2. **Clone the repo**

   ```bash
   git clone https://github.com/MD-Mushfiqur123/lychee-desktop.git
   cd lychee-desktop
   ```

3. **Install frontend dependencies**

   ```bash
   cd frontend && npm install && cd ..
   ```

4. **Run in development mode**

   ```bash
   wails dev
   ```

   This starts a Vite dev server for the React frontend (hot reload), the Go backend with your bound methods, and a Wails dev server at `http://localhost:34115` for browser debugging.

## Project Structure

Lychee Desktop follows the standard Wails v2 project layout with a **Go backend** and a **React + TypeScript frontend**.

```
lychee-desktop/
├── main.go                  # Wails application entry point
├── app.go                   # Go backend — Lychee process lifecycle, health checks,
│                            #   window management, Go ↔ JS bindings
├── wails.json               # Wails project configuration
├── go.mod / go.sum          # Go module dependencies
│
├── frontend/                # React + TypeScript frontend
│   ├── src/
│   │   ├── App.tsx          # Root component with routing
│   │   ├── components/      # UI components (Chat, Home, Studio, Settings)
│   │   ├── hooks/           # Custom React hooks (useLychee, usePipeline)
│   │   └── assets/          # Static assets
│   ├── index.html           # HTML entry point
│   ├── package.json         # Node.js dependencies & scripts
│   ├── vite.config.ts       # Vite build config
│   └── tsconfig.json        # TypeScript config
│
├── build/                   # Build assets (app icons, NSIS installer config)
├── scripts/                 # Utility scripts (build, dev, installer, launch)
└── .github/workflows/       # CI/CD pipeline (build-desktop.yml)
```

### Go Backend (`main.go`, `app.go`)

The Go layer handles:
- **Wails application bootstrap** — window creation, sizing, decorations
- **Process management** — starting, stopping, and health-checking `lychee serve`
- **Go ↔ JS bindings** — methods exposed to the frontend via `@wailsapp/runtime`
- **System integration** — tray icons, notifications, auto-start

### React Frontend (`frontend/src/`)

The frontend layer handles:
- **Chat interface** — streaming responses, message history, model switching
- **Pipeline Studio** — visual pipeline builder for chaining LLM calls
- **Model Manager** — model selection, parameter configuration, status display
- **Settings** — app preferences, API endpoints, theme

Frontend communicates with the Go backend through Wails bindings (runtime methods called from JS).

## How to Contribute

### Bug Reports

Found a bug? Open an issue on [GitHub Issues](https://github.com/MD-Mushfiqur123/lychee-desktop/issues).

Use the **Bug Report** template and include:
- What happened vs. what you expected
- Steps to reproduce
- Your OS and Lychee Desktop version
- Screenshots if helpful

### Feature Requests

Have an idea? Open a [Feature Request](https://github.com/MD-Mushfiqur123/lychee-desktop/issues/new?template=feature_request.md).

### Pull Requests

1. **Fork** the repository
2. **Create a branch** from `main` — use a descriptive name like `fix/chat-scroll-bug` or `feat/dark-mode`
3. **Make your changes** — keep commits small and focused
4. **Test** — run `wails dev` and verify your changes work end-to-end
5. **Push** your branch and open a Pull Request against `main`
6. **Describe** what you changed and why in the PR description

### First-Time Contributors

Look for issues tagged [`good first issue`](https://github.com/MD-Mushfiqur123/lychee-desktop/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) — these are curated for new contributors.

## Code Style

### Go

- Follow standard Go conventions (`gofmt`)
- Run `gofmt -w .` before committing
- Idiomatic Go — prefer simplicity over cleverness
- Document exported functions with Go doc comments

### TypeScript / React

- Use **Prettier** with default settings for formatting
- Run `npx prettier --write "src/**/*.{ts,tsx}"` before committing
- Use functional components with hooks
- Keep components small and single-responsibility
- Type your props with TypeScript interfaces

## Community

- 💬 **Discord** — Join our community server (invite link in README)
- 🗣️ **GitHub Discussions** — Ask questions and share ideas

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for helping make Lychee Desktop better! 🍒**
