import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError } from '../../api/client';
import type { CountryJobTitles, CountrySummary, Overview } from '../../api/types';
import { renderWithProviders, setScreen } from '../../test/render';
import { InsightsPage } from './InsightsPage';

const OVERVIEW: Overview = {
  totalHeadcount: 3000,
  byCountry: [
    { countryCode: 'IN', countryName: 'India', currency: 'INR', headcount: 2000 },
    { countryCode: 'GB', countryName: 'United Kingdom', currency: 'GBP', headcount: 1000 },
  ],
  byDepartment: [
    { department: 'Engineering', headcount: 1800 },
    { department: 'People', headcount: 1200 },
  ],
};

/** The API returns countries in code order; the page shows the largest first. */
const COUNTRIES: CountrySummary[] = [
  {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    currency: 'GBP',
    headcount: 1000,
    minSalary: 30000,
    maxSalary: 120000,
    averageSalary: 58250.5,
    medianSalary: 55000,
  },
  {
    countryCode: 'IN',
    countryName: 'India',
    currency: 'INR',
    headcount: 2000,
    minSalary: 600000,
    maxSalary: 4500000,
    averageSalary: 1850000.25,
    medianSalary: 1700000,
  },
];

function jobTitlesFor(countryCode: string): CountryJobTitles {
  const country = COUNTRIES.find((row) => row.countryCode === countryCode)!;
  return {
    countryCode,
    countryName: country.countryName,
    currency: country.currency,
    jobTitles: [
      { jobTitle: `Engineering Manager (${countryCode})`, headcount: 40, minSalary: 1, maxSalary: 3, averageSalary: 2 },
      { jobTitle: `Analyst (${countryCode})`, headcount: 60, minSalary: 1, maxSalary: 2, averageSalary: 1 },
    ],
  };
}

function mockApi() {
  return {
    overview: vi.spyOn(api.insights, 'overview').mockResolvedValue(OVERVIEW),
    countries: vi.spyOn(api.insights, 'countries').mockResolvedValue(COUNTRIES),
    jobTitles: vi
      .spyOn(api.insights, 'jobTitles')
      .mockImplementation((code: string) => Promise.resolve(jobTitlesFor(code))),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Salary insights', () => {
  it('shows total headcount and how many countries and departments there are', async () => {
    setScreen('desktop');
    mockApi();

    renderWithProviders(<InsightsPage />, { route: '/insights' });

    expect(await screen.findByText('3,000')).toBeInTheDocument();
    expect(screen.getByText('Largest: India (2,000)')).toBeInTheDocument();
    expect(screen.getByText('Largest: Engineering (1,800)')).toBeInTheDocument();
  });

  it('charts headcount by country and by department, largest first', async () => {
    setScreen('desktop');
    mockApi();

    renderWithProviders(<InsightsPage />, { route: '/insights' });

    const countries = await screen.findByRole('list', { name: 'Headcount by country' });
    const rows = within(countries).getAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('India');
    expect(rows[0]).toHaveTextContent('2,000');
    expect(within(screen.getByRole('list', { name: 'Headcount by department' })).getAllByRole('listitem')).toHaveLength(2);
  });

  it('summarizes salaries per country in local currency, largest country first', async () => {
    setScreen('desktop');
    mockApi();

    renderWithProviders(<InsightsPage />, { route: '/insights' });

    const table = await screen.findByRole('table', { name: 'Salary summary by country' });
    const [, firstRow, secondRow] = within(table).getAllByRole('row');
    expect(firstRow).toHaveTextContent('India');
    expect(firstRow).toHaveTextContent('₹ 1,700,000');
    expect(firstRow).toHaveTextContent('₹ 1,850,000');
    expect(secondRow).toHaveTextContent('£ 55,000');
  });

  it('opens on the job titles of the largest country', async () => {
    setScreen('desktop');
    const { jobTitles } = mockApi();

    renderWithProviders(<InsightsPage />, { route: '/insights' });

    expect(await screen.findByRole('table', { name: 'Salaries by job title in India' })).toBeInTheDocument();
    expect(jobTitles).toHaveBeenCalledWith('IN');
  });

  it('starts on the country named in the address', async () => {
    setScreen('desktop');
    mockApi();

    renderWithProviders(<InsightsPage />, { route: '/insights?country=GB' });

    expect(await screen.findByRole('table', { name: 'Salaries by job title in United Kingdom' })).toBeInTheDocument();
  });

  it('shows a country’s job titles when it is chosen in the summary', async () => {
    setScreen('desktop');
    mockApi();
    renderWithProviders(<InsightsPage />, { route: '/insights' });

    await userEvent.click(await screen.findByRole('button', { name: 'United Kingdom: show salaries by job title' }));

    const table = await screen.findByRole('table', { name: 'Salaries by job title in United Kingdom' });
    expect(within(table).getByText('Engineering Manager (GB)')).toBeInTheDocument();
  });

  it('switches country from the picker beside the job titles', async () => {
    setScreen('phone');
    const { jobTitles } = mockApi();
    renderWithProviders(<InsightsPage />, { route: '/insights' });
    await screen.findByRole('table', { name: 'Salaries by job title in India' });

    await userEvent.click(screen.getByRole('combobox', { name: /Country/ }));
    await userEvent.click(await screen.findByRole('option', { name: 'United Kingdom' }));

    await waitFor(() => expect(jobTitles).toHaveBeenLastCalledWith('GB'));
  });

  it('shows what failed and lets HR try again', async () => {
    setScreen('desktop');
    const { countries } = mockApi();
    countries.mockRejectedValueOnce(new ApiError(0, 'Cannot reach the server. Check your connection and try again.'));
    renderWithProviders(<InsightsPage />, { route: '/insights' });
    expect(await screen.findByText(/Could not load the salary summary/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('table', { name: 'Salary summary by country' })).toBeInTheDocument();
  });

  it('explains an empty organization instead of showing empty tables', async () => {
    setScreen('desktop');
    const { overview, countries } = mockApi();
    overview.mockResolvedValue({ totalHeadcount: 0, byCountry: [], byDepartment: [] });
    countries.mockResolvedValue([]);

    renderWithProviders(<InsightsPage />, { route: '/insights' });

    expect(await screen.findByText(/There are no employees yet/)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Salaries by job title' })).not.toBeInTheDocument();
  });
});
