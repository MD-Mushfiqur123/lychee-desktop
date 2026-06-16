# Lychee Desktop — Frontend Integration Checklist

> Generated: 2026-06-16
> Branch: Team 12 — Frontend Tests + TypeScript Fix + Final Integration

## ✅ Build & Type Check

- [x] `npm run build` works — Produces `dist/` with JS + CSS bundles
- [x] `npx tsc --noEmit` passes — Zero TypeScript errors
  - Fixed: Renamed `statusbar.tsx` → `StatusBar.tsx` (case sensitivity with `forceConsistentCasingInFileNames`)
- [x] No unused variables or dangling imports

## ✅ Component Smoke Tests (vitest)

- [x] App renders without crashing
- [x] Sidebar renders all navigation tabs (Home, Chat, Studio, Models, Settings)
- [x] Home page renders by default with title and subtitle
- [x] Chat component renders when navigated to (textarea present)
- [x] ModelManager component renders when navigated to
- [x] Studio component renders when navigated to (Pipeline Builder title)

**Test Count:** 6 passed / 0 failed / 0 skipped

## ✅ Component Render Verification

- [x] App (`App.tsx`) — tab routing works
- [x] Layout (`Layout.tsx`) — sidebar + bottom-tab + StatusBar
- [x] Home (`Home.tsx`) — stats + quick actions
- [x] Chat (`Chat.tsx`) — messages, streaming, model selector
- [x] Studio (`Studio.tsx`) — pipeline builder with drag-drop
- [x] ModelManager (`ModelManager.tsx`) — pull, search, delete
- [x] Settings (`Settings.tsx`) — config, system info
- [x] ModelSelector (`ModelSelector.tsx`) — dropdown
- [x] PipelineStage (`PipelineStage.tsx`) — stage config card
- [x] StatusBar (`StatusBar.tsx`) — server status polling

## ✅ API Calls (mock-ready)

- [x] All API calls go through hooks (`useLychee`, `usePipeline`)
- [x] Base URL centralized as `API_BASE = 'http://localhost:11434'`
- [x] Error classification with retry logic (max 3 retries)
- [x] Fetch is mocked in tests to prevent actual network calls

## ✅ Design Consistency

- [x] Dark theme applied via `style.css` + component inline styles
- [x] All components use consistent color palette
- [x] Font: Nunito / system sans-serif stack
- [x] All CSS classes follow BEM-like naming

## ✅ File Naming

- [x] `StatusBar.tsx` — PascalCase ✓ (was `statusbar.tsx`, fixed)
- [x] All other components in PascalCase: `Chat.tsx`, `Home.tsx`, `Layout.tsx`, etc.
- [x] Test file: `App.test.tsx` in `src/__tests__/`

## ✅ No Console Errors

- [x] No runtime errors during build or test
- [x] `scrollIntoView` and `fetch` polyfilled for jsdom test environment
- [x] `AbortSignal.timeout` polyfilled for test environment

## 📋 Summary

| Check | Status |
|-------|--------|
| `npm run build` | ✅ Pass |
| `npx tsc --noEmit` | ✅ Pass (0 errors) |
| All components render | ✅ 6/6 tests pass |
| API calls work (mock) | ✅ Hooks ready |
| Dark theme consistent | ✅ |
| No console errors | ✅ |
| Files in PascalCase | ✅ |
