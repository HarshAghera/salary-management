import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { renderWithProviders, setScreen } from './test/render';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('App shell', () => {
  it('opens the home page on the employee directory', () => {
    setScreen('desktop');

    renderWithProviders(<App />, { route: '/' });

    expect(screen.getByRole('heading', { level: 1, name: 'Employees' })).toBeInTheDocument();
  });

  it('shows the navigation permanently on large screens', () => {
    setScreen('desktop');

    renderWithProviders(<App />, { route: '/employees' });

    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(within(nav).getByRole('link', { name: 'Insights' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Open navigation' })).not.toBeInTheDocument();
  });

  it('hides the navigation behind a menu button on small screens', async () => {
    setScreen('phone');
    renderWithProviders(<App />, { route: '/employees' });
    expect(screen.queryByRole('navigation', { name: 'Main' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Open navigation' }));

    expect(within(screen.getByRole('navigation', { name: 'Main' })).getByRole('link', { name: 'Insights' })).toBeVisible();
  });

  it('navigates between sections and marks the current one', async () => {
    setScreen('desktop');
    renderWithProviders(<App />, { route: '/employees' });

    await userEvent.click(screen.getByRole('link', { name: 'Insights' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Salary insights' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Insights' })).toHaveAttribute('aria-current', 'page');
  });

  it('closes the phone menu after choosing a section', async () => {
    setScreen('phone');
    renderWithProviders(<App />, { route: '/employees' });

    await userEvent.click(screen.getByRole('button', { name: 'Open navigation' }));
    await userEvent.click(screen.getByRole('link', { name: 'Import & export' }));

    // The drawer animates closed; the page is hidden from assistive technology until it has gone.
    await waitFor(() => expect(screen.queryByRole('navigation', { name: 'Main' })).not.toBeInTheDocument());
    expect(screen.getByRole('heading', { level: 1, name: 'Import & export' })).toBeInTheDocument();
  });

  it('switches between light and dark mode', async () => {
    setScreen('desktop');
    renderWithProviders(<App />, { route: '/employees' });
    const toggle = await screen.findByRole('button', { name: /^Switch to (light|dark) mode$/ });
    const target = toggle.getAttribute('aria-label') === 'Switch to dark mode' ? 'dark' : 'light';

    await userEvent.click(toggle);

    expect(document.documentElement).toHaveClass(target);
    expect(
      screen.getByRole('button', { name: `Switch to ${target === 'dark' ? 'light' : 'dark'} mode` }),
    ).toBeInTheDocument();
  });

  it('offers the colour mode switch in the app bar on small screens', async () => {
    setScreen('phone');

    renderWithProviders(<App />, { route: '/employees' });

    expect(await screen.findByRole('button', { name: /^Switch to (light|dark) mode$/ })).toBeVisible();
  });

  it('names each page in the browser tab', async () => {
    setScreen('desktop');
    renderWithProviders(<App />, { route: '/employees' });
    expect(document.title).toBe('Employees · ACME Salary Management');

    await userEvent.click(screen.getByRole('link', { name: 'Insights' }));

    expect(document.title).toBe('Salary insights · ACME Salary Management');
  });

  it('shows a helpful page for an unknown address', () => {
    setScreen('desktop');

    renderWithProviders(<App />, { route: '/no-such-page' });

    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to the employee directory' })).toBeInTheDocument();
  });
});
