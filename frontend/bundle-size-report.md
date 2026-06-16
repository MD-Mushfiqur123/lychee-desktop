# Lychee Desktop — Frontend Bundle Size Report

> Generated: 2026-06-16
> Build tool: Vite 3.2.11

## Production Build (dist/)

| File | Size | Gzip |
|------|------|------|
| `index.html` | 0.36 KB | — |
| `assets/index.*.css` | 27.3 KB | ~6 KB |
| `assets/index.*.js` | 177.9 KB | ~57 KB |
| **Total (gzipped)** | **~63 KB** | |

## Source Files by Size

### Large Assets
| File | Size | Notes |
|------|------|-------|
| `src/assets/images/logo-universal.png` | 136 KB | ⚠️ Could be optimized/compressed |
| `src/assets/fonts/nunito-v16-latin-regular.woff2` | 18.5 KB | Font file |

### Styles
| File | Size | Notes |
|------|------|-------|
| `src/App.css` | 36.4 KB | Main app styles |
| `src/style.css` | 0.6 KB | Base styles |

### Components
| File | Size | Lines (est.) |
|------|------|-------------|
| `src/components/Chat.tsx` | 8.1 KB | ~500 |
| `src/components/ModelManager.tsx` | 9.3 KB | ~280 |
| `src/components/Settings.tsx` | 7.5 KB | ~220 |
| `src/components/Studio.tsx` | 7.4 KB | ~590 (incl. inline CSS) |
| `src/components/Layout.tsx` | 5.0 KB | ~130 |
| `src/components/PipelineStage.tsx` | 4.6 KB | ~140 |
| `src/components/Home.tsx` | 4.5 KB | ~130 |
| `src/components/StatusBar.tsx` | 2.6 KB | ~90 |
| `src/components/ModelSelector.tsx` | 1.4 KB | ~55 |

### Hooks
| File | Size | Notes |
|------|------|-------|
| `src/hooks/useLychee.ts` | 11.2 KB | Chat + model management |
| `src/hooks/usePipeline.ts` | 8.4 KB | Pipeline orchestration |

### Core
| File | Size |
|------|------|
| `src/App.tsx` | 1.0 KB |
| `src/main.tsx` | 0.3 KB |

### Tests
| File | Size |
|------|------|
| `src/__tests__/App.test.tsx` | 3.4 KB |
| `src/test-setup.ts` | 0.3 KB |

### Total Source (excluding assets)
**~92 KB** (components + hooks + core + styles)

## Dependencies

| Package | Purpose | Size Impact |
|---------|---------|-------------|
| `react` 18.2.0 | UI framework | ~7 KB gzipped |
| `react-dom` 18.2.0 | DOM renderer | ~40 KB gzipped |
| `@vitejs/plugin-react` 2.0.1 | Dev-only JSX transform | — |

## Optimization Opportunities

1. **⚠️ Logo image (136 KB PNG)**: Convert to optimized WebP (~30 KB) or SVG
2. **Font (18.5 KB WOFF2)**: Consider system font stack only for smaller bundle
3. **App.css (36.4 KB)**: Could be split per-component for code splitting
4. **Studio inline CSS**: ~3 KB of inline styles in `Studio.tsx` — move to CSS file for deduplication
5. **Overall**: Bundle at 178 KB JS + 27 KB CSS (63 KB gzipped) is well within acceptable range for a desktop app

## Summary

| Metric | Value |
|--------|-------|
| Total JS bundle | 177.9 KB |
| Total CSS bundle | 27.3 KB |
| Total gzipped | ~63 KB |
| Source files | 15 .tsx/.ts files |
| Components | 9 |
| Hooks | 2 |
| Large dependencies | react, react-dom |
| **Rating** | ✅ Good — lean bundle for a desktop app |
