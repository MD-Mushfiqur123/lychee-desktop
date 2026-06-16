/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

// NOTE: We intentionally do NOT use @vitejs/plugin-react here.
// The plugin injects react-refresh virtual modules that are incompatible
// with jsdom. Vitest's built-in esbuild handles JSX transformation instead.
export default defineConfig({
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
  },
});
