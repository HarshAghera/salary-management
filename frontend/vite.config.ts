/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    // Form tests drive several MUI inputs in jsdom; the default 5 s is too tight on slower CI machines.
    testTimeout: 15_000,
  },
});
