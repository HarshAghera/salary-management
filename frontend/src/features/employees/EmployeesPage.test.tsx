import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useNavigate } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError } from '../../api/client';
import type { Employee, EmployeePage, FilterOptions } from '../../api/types';
import { renderWithProviders, setScreen } from '../../test/render';
import { EmployeesPage } from './EmployeesPage';

const OPTIONS: FilterOptions = {
  countries: [
    { code: 'GB', name: 'United Kingdom', currency: 'GBP' },
    { code: 'IN', name: 'India', currency: 'INR' },
  ],
  departments: ['Engineering', 'People'],
  jobTitles: ['HR Specialist', 'Software Engineer'],
};

function employee(overrides: Partial<Employee>): Employee {
  return {
    id: 'id',
    fullName: 'Name',
    email: 'name@acme.com',
    jobTitle: 'Software Engineer',
    department: 'Engineering',
    countryCode: 'IN',
    currency: 'INR',
    salary: 1000,
    hireDate: '2021-03-01',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const priya = employee({
  id: 'emp-1',
  fullName: 'Priya Nair',
  email: 'priya.nair@acme.com',
  salary: 2450000,
});
const amelia = employee({
  id: 'emp-2',
  fullName: 'Amelia Hughes',
  email: 'amelia.hughes@acme.com',
  jobTitle: 'HR Specialist',
  department: 'People',
  countryCode: 'GB',
  currency: 'GBP',
  salary: 48500,
  hireDate: '2019-07-15',
});

function pageOf(items: Employee[], { total = items.length, page = 1, pageSize = 25 } = {}): EmployeePage {
  return { items, total, page, pageSize };
}

/** Stubs the API; tests that need other answers change the returned spies before rendering. */
function mockApi() {
  return {
    list: vi.spyOn(api.employees, 'list').mockResolvedValue(pageOf([priya, amelia])),
    filterOptions: vi.spyOn(api.employees, 'filterOptions').mockResolvedValue(OPTIONS),
    create: vi.spyOn(api.employees, 'create'),
    update: vi.spyOn(api.employees, 'update'),
    remove: vi.spyOn(api.employees, 'remove'),
  };
}

/** Stand-ins for the browser's Back and Forward buttons. */
function HistoryButtons() {
  const navigate = useNavigate();
  return (
    <>
      <button type="button" onClick={() => void navigate(-1)}>
        Browser back
      </button>
      <button type="button" onClick={() => void navigate(1)}>
        Browser forward
      </button>
    </>
  );
}

function renderPage(route = '/employees') {
  renderWithProviders(
    <>
      <EmployeesPage />
      <HistoryButtons />
    </>,
    { route },
  );
}

async function chooseOption(combobox: HTMLElement, option: string) {
  await userEvent.click(combobox);
  await userEvent.click(await screen.findByRole('option', { name: option }));
}

/** Pastes rather than types each value: the same input events, without one render per letter. */
async function enter(field: HTMLElement, text: string) {
  await userEvent.click(field);
  await userEvent.paste(text);
}

async function fillEmployeeForm(dialog: HTMLElement) {
  await enter(within(dialog).getByLabelText(/Full name/), 'Priya Nair');
  await enter(within(dialog).getByLabelText(/Email/), 'Priya.Nair@acme.com');
  await enter(within(dialog).getByRole('combobox', { name: /Job title/ }), 'Software Engineer');
  await enter(within(dialog).getByRole('combobox', { name: /Department/ }), 'Engineering');
  await chooseOption(within(dialog).getByRole('combobox', { name: /Country/ }), 'India');
  await enter(within(dialog).getByLabelText(/Annual salary/), '2450000');
  fireEvent.change(within(dialog).getByLabelText(/Hire date/), { target: { value: '2021-03-01' } });
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Employee directory', () => {
  it('lists employees with their country and salary in local currency', async () => {
    setScreen('desktop');
    mockApi();

    renderPage();

    expect(await screen.findByText('Priya Nair')).toBeInTheDocument();
    expect(screen.getByText('₹ 2,450,000')).toBeInTheDocument();
    expect(screen.getByText('£ 48,500')).toBeInTheDocument();
    expect(await screen.findByText('United Kingdom')).toBeInTheDocument();
  });

  it('asks for the first page sorted by name by default', async () => {
    setScreen('desktop');
    const { list } = mockApi();

    renderPage();

    await waitFor(() =>
      expect(list).toHaveBeenCalledWith({ page: 1, pageSize: 25, sortBy: 'fullName', sortOrder: 'asc' }),
    );
  });

  it('starts from the search, filters and page in the address', async () => {
    setScreen('desktop');
    const { list } = mockApi();

    renderPage('/employees?country=IN&search=nair&page=2');

    await waitFor(() =>
      expect(list).toHaveBeenCalledWith(expect.objectContaining({ country: 'IN', search: 'nair', page: 2 })),
    );
  });

  it('searches once typing stops rather than on every keystroke', async () => {
    setScreen('desktop');
    const { list } = mockApi();
    renderPage();
    await screen.findByText('Priya Nair');

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search by name or email' }), 'nair');

    await waitFor(() => expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'nair', page: 1 })));
    expect(list.mock.calls.some(([params]) => params.search === 'n')).toBe(false);
  });

  it('filters by country', async () => {
    setScreen('desktop');
    const { list } = mockApi();
    renderPage();
    await screen.findByText('Priya Nair');

    await chooseOption(screen.getByRole('combobox', { name: /Country/ }), 'India');

    await waitFor(() => expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ country: 'IN', page: 1 })));
  });

  it('shows "All countries" again after a country filter is removed', async () => {
    setScreen('desktop');
    const { list } = mockApi();
    renderPage();
    await screen.findByText('Priya Nair');
    const country = screen.getByRole('combobox', { name: /Country/ });
    await chooseOption(country, 'India');

    await chooseOption(country, 'All countries');

    expect(country).toHaveTextContent('All countries');
    await waitFor(() => expect(list.mock.lastCall?.[0].country).toBeUndefined());
  });

  it('returns to the previous view with Back and comes forward again', async () => {
    setScreen('desktop');
    const { list } = mockApi();
    renderPage();
    await screen.findByText('Priya Nair');
    await chooseOption(screen.getByRole('combobox', { name: /Country/ }), 'India');
    await waitFor(() => expect(list.mock.lastCall?.[0].country).toBe('IN'));

    await userEvent.click(screen.getByRole('button', { name: 'Browser back' }));

    await waitFor(() => expect(list.mock.lastCall?.[0].country).toBeUndefined());
    expect(screen.getByRole('combobox', { name: /Country/ })).toHaveTextContent('All countries');

    await userEvent.click(screen.getByRole('button', { name: 'Browser forward' }));

    await waitFor(() => expect(list.mock.lastCall?.[0].country).toBe('IN'));
  });

  it('does not make Back step through each search', async () => {
    setScreen('desktop');
    const { list } = mockApi();
    renderPage();
    await screen.findByText('Priya Nair');
    await chooseOption(screen.getByRole('combobox', { name: /Country/ }), 'India');
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search by name or email' }), 'nair');
    await waitFor(() => expect(list.mock.lastCall?.[0].search).toBe('nair'));

    await userEvent.click(screen.getByRole('button', { name: 'Browser back' }));

    await waitFor(() =>
      expect(list.mock.lastCall?.[0]).toEqual({ page: 1, pageSize: 25, sortBy: 'fullName', sortOrder: 'asc' }),
    );
    expect(screen.getByRole('searchbox', { name: 'Search by name or email' })).toHaveValue('');
  });

  it('clears search and filters in one step', async () => {
    setScreen('desktop');
    const { list } = mockApi();
    renderPage('/employees?country=IN&search=nair');
    await screen.findByText('Priya Nair');

    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));

    await waitFor(() =>
      expect(list.mock.lastCall?.[0]).toEqual({ page: 1, pageSize: 25, sortBy: 'fullName', sortOrder: 'asc' }),
    );
  });

  it('sorts by salary from the column header', async () => {
    setScreen('desktop');
    const { list } = mockApi();
    renderPage();
    await screen.findByText('Priya Nair');

    await userEvent.click(screen.getByRole('columnheader', { name: /Salary/ }));

    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ sortBy: 'salary', sortOrder: 'asc' })),
    );
  });

  it('suggests choosing a country when sorting by salary across all countries', async () => {
    setScreen('desktop');
    mockApi();

    renderPage('/employees?sortBy=salary&sortOrder=desc');

    expect(await screen.findByText(/Choose a country to compare salaries/)).toBeInTheDocument();
  });

  it('drops the salary hint once a country is chosen', async () => {
    setScreen('desktop');
    mockApi();

    renderPage('/employees?sortBy=salary&sortOrder=desc&country=IN');

    await screen.findByText('Priya Nair');
    expect(screen.queryByText(/Choose a country to compare salaries/)).not.toBeInTheDocument();
  });

  it('shows no salary hint for other sort orders', async () => {
    setScreen('desktop');
    mockApi();

    renderPage();

    await screen.findByText('Priya Nair');
    expect(screen.queryByText(/Choose a country to compare salaries/)).not.toBeInTheDocument();
  });

  it('shows only the essential columns on tablets', async () => {
    setScreen('tablet');
    mockApi();

    renderPage();

    await screen.findByText('Priya Nair');
    expect(screen.getByRole('columnheader', { name: /Job title/ })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: /Department/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: /Hire date/ })).not.toBeInTheDocument();
  });

  it('explains when nobody matches and offers to clear the filters', async () => {
    setScreen('desktop');
    const { list } = mockApi();
    list.mockResolvedValue(pageOf([]));

    renderPage('/employees?search=zzz');

    expect(await screen.findByRole('heading', { name: 'No employees match your search and filters' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Clear filters' }).length).toBeGreaterThan(0);
  });

  it('shows an error with a way to try again when the directory cannot load', async () => {
    setScreen('desktop');
    const { list } = mockApi();
    list.mockRejectedValueOnce(new ApiError(0, 'Cannot reach the server. Check your connection and try again.'));
    renderPage();
    expect(await screen.findByText(/could not be loaded/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Priya Nair')).toBeInTheDocument();
  });
});

describe('Employee directory on phones', () => {
  it('shows employees as cards and loads more on request', async () => {
    setScreen('phone');
    const { list } = mockApi();
    list
      .mockResolvedValueOnce(pageOf([priya], { total: 2, pageSize: 1 }))
      .mockResolvedValueOnce(pageOf([amelia], { total: 2, page: 2, pageSize: 1 }));
    renderPage();
    const cards = await screen.findByRole('list', { name: 'Employees' });
    expect(within(cards).getAllByRole('listitem')).toHaveLength(1);
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Show more' }));

    expect(await within(cards).findByText('Amelia Hughes')).toBeInTheDocument();
    expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
    expect(screen.queryByRole('button', { name: 'Show more' })).not.toBeInTheDocument();
  });

  it('keeps the filters in a panel that opens on request', async () => {
    setScreen('phone');
    mockApi();
    renderPage();
    const toggle = await screen.findByRole('button', { name: /Filters/ });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('combobox', { name: /Sort by/ })).toBeVisible();
  });
});

describe('Adding, editing and deleting employees', () => {
  it('adds an employee and confirms it', async () => {
    setScreen('desktop');
    const { create } = mockApi();
    create.mockResolvedValue(priya);
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: 'Add employee' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add employee' });

    await fillEmployeeForm(dialog);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add employee' }));

    expect(create).toHaveBeenCalledWith({
      fullName: 'Priya Nair',
      email: 'priya.nair@acme.com',
      jobTitle: 'Software Engineer',
      department: 'Engineering',
      countryCode: 'IN',
      salary: 2450000,
      hireDate: '2021-03-01',
    });
    expect(await screen.findByText('Priya Nair added')).toBeInTheDocument();
  });

  it('points out missing details before sending anything', async () => {
    setScreen('desktop');
    const { create } = mockApi();
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: 'Add employee' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add employee' });

    await userEvent.click(within(dialog).getByRole('button', { name: 'Add employee' }));

    expect(within(dialog).getByText("Enter the employee's full name")).toBeInTheDocument();
    expect(within(dialog).getByText('Choose a country')).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });

  it('shows a duplicate email next to the email field', async () => {
    setScreen('desktop');
    const { create } = mockApi();
    create.mockRejectedValue(new ApiError(409, 'An employee with this email already exists'));
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: 'Add employee' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add employee' });
    await fillEmployeeForm(dialog);

    await userEvent.click(within(dialog).getByRole('button', { name: 'Add employee' }));

    expect(await within(dialog).findByText('An employee with this email already exists')).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/Email/)).toHaveAttribute('aria-invalid', 'true');
  });

  it('edits an employee starting from their current details', async () => {
    setScreen('desktop');
    const { update } = mockApi();
    update.mockResolvedValue({ ...priya, salary: 2600000 });
    renderPage();
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Edit Priya Nair' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit employee' });
    expect(within(dialog).getByLabelText(/Full name/)).toHaveValue('Priya Nair');

    const salary = within(dialog).getByLabelText(/Annual salary/);
    await userEvent.clear(salary);
    await userEvent.paste('2600000');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save changes' }));

    expect(update).toHaveBeenCalledWith('emp-1', expect.objectContaining({ salary: 2600000, email: 'priya.nair@acme.com' }));
    expect(await screen.findByText('Priya Nair updated')).toBeInTheDocument();
  });

  it('deletes an employee after confirmation', async () => {
    setScreen('desktop');
    const { remove } = mockApi();
    remove.mockResolvedValue(undefined);
    renderPage();
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete Priya Nair' }));
    const dialog = await screen.findByRole('dialog', { name: 'Delete Priya Nair?' });

    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(remove).toHaveBeenCalledWith('emp-1');
    expect(await screen.findByText('Priya Nair deleted')).toBeInTheDocument();
  });

  it('keeps the employee when deletion is cancelled', async () => {
    setScreen('desktop');
    const { remove } = mockApi();
    renderPage();
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete Priya Nair' }));
    const dialog = await screen.findByRole('dialog', { name: 'Delete Priya Nair?' });

    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(remove).not.toHaveBeenCalled();
  });
});
