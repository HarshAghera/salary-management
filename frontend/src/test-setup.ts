// Vitest globals are enabled, so Testing Library cleans up between tests by itself.
import '@testing-library/jest-dom/vitest';

// jsdom has no layout engine and no ResizeObserver; the data grid needs one to exist.
class NoopResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= NoopResizeObserver;
