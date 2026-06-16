/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

// NOTE: We intentionally do NOT use @vitejs/plugin-react here.
// The plugin injects react-refresh virtual modules that are incompatible
// with jsdom. Vitest's built-in oxc/esbuild handles JSX transformation instead.
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
  },
});
