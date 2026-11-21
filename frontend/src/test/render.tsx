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
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme} defaultMode="system">
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

/** The three widths every screen is checked at (CLAUDE.md UI standards). */
const SCREEN_WIDTHS = { phone: 360, tablet: 768, desktop: 1280 } as const;

/**
 * jsdom has no media queries. MUI's useMediaQuery reads window.matchMedia, so this
 * evaluates the min-width and max-width parts of each query against the chosen width.
 */
export function setScreen(size: keyof typeof SCREEN_WIDTHS) {
  const width = SCREEN_WIDTHS[size];
  vi.stubGlobal('matchMedia', (query: string) => {
    const min = /min-width:\s*([\d.]+)px/.exec(query);
    const max = /max-width:\s*([\d.]+)px/.exec(query);
    const matches = (!min || width >= Number(min[1])) && (!max || width <= Number(max[1]));
    return {
      matches,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    } satisfies MediaQueryList;
  });
}
