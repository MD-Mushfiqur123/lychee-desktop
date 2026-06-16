# Lychee Desktop — Visual Preview

## Overview

Lychee Desktop is a native Windows desktop application built with Wails (Go backend + React/TypeScript frontend) that provides a full-featured local AI management interface. The entire UI uses a sophisticated **dark theme** with carefully chosen slate/charcoal tones, blue accents, and smooth animations.

---

## Color Palette

| Role | Color | Usage |
|------|-------|-------|
| Primary BG | `#0f1117` | Main content area |
| Secondary BG | `#14161a` | Cards, elevated surfaces |
| Sidebar BG | `#121418` | Left sidebar navigation |
| Input BG | `#1e2027` | Text inputs, selectors |
| Border | `#242730` | Dividers, card borders |
| Accent | `#3b82f6` | Active tabs, buttons, links |
| Success | `#22c55e` | Running status dot, success badges |
| Danger | `#ef4444` | Error states, delete buttons |
| Warning | `#f59e0b` | Warnings |
| Text Primary | `#e4e6eb` | Body text, headings |
| Text Secondary | `#9ca3af` | Labels, descriptions |
| Text Muted | `#6b7280` | Version numbers, meta text |

---

## Layout Architecture

```
┌──────────────────────────────────────────────────────────┐
│ ┌──────┐  ┌────────────────────────────────────────────┐ │
│ │      │  │                                            │ │
│ │  🟡  │  │            Main Content Area               │ │
│ │  🏠  │  │         (max-width: 960px centered)        │ │
│ │  💬  │  │                                            │ │
│ │  ✏️  │  │        Tab content switches here            │ │
│ │  📦  │  │                                            │ │
│ │  ⚙️  │  │                                            │ │
│ │      │  │                                            │ │
│ │ v0.1 │  ├────────────────────────────────────────────┤ │
│ └──────┘  │ 🟢 Lychee Running | 3 models | v0.3.2     │ │
│           └────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

## Sidebar Navigation (Desktop)

The left sidebar is a narrow **52px column** with dark background (`#121418`) and a subtle right border. It contains:

1. **Lychee Brand Logo** (top) — A stylized SVG of concentric circles with radiating lines (like a sun/gear hybrid) in accent blue, with a gentle hover scale animation (`1.08x`).

2. **5 SVG Icon Tabs** (center, stacked vertically with 2px gaps):
   - **Home** 🏠 — House with door outline
   - **Chat** 💬 — Speech bubble with tail
   - **Studio** ✏️ — Geometric pen/ruler shape (intersecting lines)
   - **Models** 📦 — 3D cube/box (hexahedron) with perspective lines
   - **Settings** ⚙️ — Gear/cog with center circle

   Each tab:
   - 38px tall, full sidebar width
   - Muted gray icon (`#6b7280`) when inactive
   - Brightens to `#e4e6eb` with subtle background on hover
   - Glows in accent blue (`#3b82f6`) with a subtle blue background and a 3px left accent bar when active
   - Smooth 180ms transitions on all state changes

3. **Version Badge** (bottom) — Tiny "v0.1" label in muted gray

---

## Status Bar (Bottom)

A slim **26px bar** spanning the full width, with frosted glass effect (`backdrop-filter: blur(8px)` on semi-transparent dark background). Contains:

- **Left side**: Colored status dot (green pulsing when Lychee is running, red when stopped) + "Lychee Running"/"Lychee Stopped" text + model count ("3 models")
- **Right side**: Version number (e.g., "v0.3.2")
- All in 11px muted gray text, with subtle separator dots

---

## Tab Views

### 🏠 Home Tab

A dashboard landing page with:

- **Header**: Large brand icon (40px) + "Lychee Desktop" title (24px, bold, accent blue) + tagline "Local AI, always available." in secondary gray
- **Stats Grid** (3-column on desktop, 1-column on mobile):
  - **Installed Models**: Count card with "Models" label — shows model count in large text with a box icon
  - **Lychee Status**: Running/Stopped card with colored dot indicator
  - **Lychee Version**: Version number card
  - Each card has dark background (`#1a1c21`), rounded corners (`12px`), subtle border, and a smooth fade-in animation
- **Quick Actions** (3 buttons in a row):
  - "Open Chat" — accent blue button → navigates to Chat tab
  - "Open Studio" — outlined accent button → navigates to Studio tab
  - "Manage Models" — secondary button → navigates to Models tab

### 💬 Chat Tab

A full chat interface styled like a modern AI assistant:

- **Header**: "Chat" title + selected model badge (pill-shaped, accent outline). Model selector dropdown on the right side, styled with dark input background, showing model names with parameter sizes.
- **Message Area** (scrollable, flex-grow):
  - **Empty state**: Large pulsing chat icon (speech bubble with dots), "Start a conversation" title, "Select a model and send a message to begin" subtitle
  - **User messages**: Right-aligned, blue-tinted background (`accent-subtle`), rounded corners (larger radius on right side), slide-up animation
  - **Assistant messages**: Left-aligned, dark card background, with model name badge above. Content includes:
    - Regular text in primary color
    - **Code blocks**: Dark background (`#0d1117`), monospace font (JetBrains Mono / Fira Code), syntax-colored with subtle left border accent
    - **Streaming indicator**: Animated typing dots (3 bouncing dots) when response is generating
  - Messages animate in with `slideUp` keyframe (fade + translateY)
- **Input Area** (bottom):
  - Large text input with dark background, rounded corners, subtle border
  - Glowing blue border on focus (box-shadow accent glow)
  - Placeholder: "Type a message..." in muted gray
  - Send button (accent blue, circular with arrow icon) and Stop button (danger red, only visible during generation)
  - Disabled state with reduced opacity when no model is selected

### ✏️ Studio Tab (Pipeline Builder)

A visual pipeline construction interface:

- **Two-column layout**: Left sidebar (240px model palette) + Right canvas (pipeline stages)
- **Model Palette** (left):
  - "Models" header
  - Scrollable list of available models shown as draggable cards
  - Each card shows model name, provider badge, parameter size
  - Cards can be clicked to add a stage, or dragged onto the canvas
  - Loading state shows shimmer animation skeleton cards
- **Pipeline Canvas** (right):
  - **Empty state**: Large diagram icon, "Build your pipeline" heading, "Add stages from the model palette to get started"
  - **Active pipeline**: Connected vertical flow of stage cards
    - Each stage: Model name header, provider badge, parameter badge, configuration options (temperature slider, top-p slider, max tokens input), remove button (×)
    - Stages connected by animated vertical lines/arrows showing data flow
    - Stage numbers (Step 1, Step 2, etc.)
  - **Action bar** (bottom): "Run Pipeline" (accent green button with play icon), "Clear" (outlined danger button), progress spinner during execution
  - **Output area**: Final output displayed in a dark code-block style panel after pipeline execution
  - Error states shown in red banners

### 📦 Model Manager Tab

A card-based model management interface:

- **Header**: "Model Manager" title + refresh button
- **Search bar**: Full-width input with magnifying glass icon, filters models by name/family/parameter size in real-time
- **Pull form**: Input field + "Pull" button to download new models from registry, with progress status text
- **Model Grid** (responsive: 3 cols → 2 cols → 1 col):
  - Each model displayed as a **card** with:
    - Model name (bold, primary text)
    - Provider/family badge (small pill, accent outline)
    - Parameter size (e.g., "7B", "13B") in a muted badge
    - Model size on disk (formatted: "4.2 GB", "1.8 GB")
    - Last modified date
    - **Delete button** (danger red outline, with confirmation state)
  - Cards have hover effect: subtle background shift + border glow
  - Empty state: "No models installed" with suggestion to pull one
  - Loading state: shimmer skeleton cards
  - Error state: red banner with retry button

### ⚙️ Settings Tab

Configuration panel organized in sections:

- **Lychee Server** section:
  - Binary path input (default: "ollama") with file picker
  - Port input (default: "11434")
  - Backend selector dropdown (llama.cpp, etc.)
  - Start/Stop server button (green when stopped, red when running) with loading state
  - Status indicator: "✓ Running" or "✗ Stopped" with check/x icon
- **System Information** section:
  - 2-column grid showing: Platform, Architecture, CPU Cores, Memory
  - Each in a labeled read-only field with icon
- **About** section:
  - Lychee Desktop version
  - Build info
  - Links to GitHub, documentation
- All sections use card containers with subtle borders and spacing
- Input fields have consistent dark styling with accent focus glow

---

## Animations & Micro-interactions

| Animation | Trigger | Effect |
|-----------|---------|--------|
| `fadeIn` | Tab content mount | Opacity 0 → 1 |
| `slideUp` | New messages | Slide up 12px + fade in |
| `pulseGlow` | Active status dot | Box-shadow pulse 4px → 16px |
| `typingBounce` | Streaming response | 3 dots bounce sequentially |
| `spin` | Loading spinners | Continuous 360° rotation |
| `shimmer` | Skeleton loaders | Animated gradient sweep |
| `scale(1.02)` | Sidebar tab hover | Subtle enlargement |
| `scale(1.08)` | Brand logo hover | Noticeable enlargement |

All transitions use `180ms ease` for snappy but smooth feel.

---

## Responsive Design

### Desktop (769px+)

Full layout with 52px left sidebar, centered content (max 960px), all features visible.

### Tablet (769px - 1200px)

- Sidebar narrows to 44px
- Model Manager grid: 2 columns
- Studio sidebar narrows to 180px
- Padding reduced to 24px

### Mobile (< 768px)

- **Desktop sidebar hidden** — replaced by bottom tab bar
- **Bottom Tab Bar**: Fixed 52px bar at bottom with 5 tabs showing **icon + label** (e.g., Home, Chat, Studio, Models, Settings)
- Content takes full width with 16px padding
- Models grid → single column
- Studio → single column (model palette hidden)
- Chat header stacks vertically
- Status bar font shrinks to 10px
- Main content gets `padding-bottom: 52px` to clear bottom tabs

### Small Mobile (< 480px)

- Chat title shrinks to 16px
- Model selector minimum width reduced to 140px
- Stat card padding tightens to 16px
- Stat value font reduces to 18px
- Studio canvas padding: 12px

---

## Typography

- **System font stack**: Inter → Nunito → -apple-system → BlinkMacSystemFont → Segoe UI → Roboto → sans-serif
- **Monospace**: JetBrains Mono → Fira Code → Cascadia Code → Consolas → SF Mono
- **Smooth rendering**: `-webkit-font-smoothing: antialiased` throughout
- **Custom scrollbars**: 6px thin, semi-transparent thumb, rounded

---

## Window Controls

Native Windows title bar with standard minimize/maximize/close. The app uses Wails' frameless window support with the dark theme seamlessly extending to the title bar area.
