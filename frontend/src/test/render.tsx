import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router';
import { vi } from 'vitest';
import { theme } from '../theme';

/** Renders UI with the app's providers, starting at the given address. */
export function renderWithProviders(ui: ReactElement, { route = '/' }: { route?: string } = {}) {
  // No retries: a failing request should fail the test immediately, not after backoff.
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme} defaultMode="system">
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

/**
 * jsdom has no media queries. MUI's useMediaQuery reads window.matchMedia, so this
 * decides which breakpoint layout a test sees.
 */
export function setScreen(size: 'phone' | 'desktop') {
  vi.stubGlobal(
    'matchMedia',
    (query: string) =>
      ({
        matches: size === 'desktop',
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
      }) satisfies MediaQueryList,
  );
}
