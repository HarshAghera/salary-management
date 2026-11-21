import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, api, toQueryString } from './client';
import { API_URL } from './config';

function mockFetch(status: number, body?: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('toQueryString', () => {
  it('leaves out empty and undefined values', () => {
    expect(toQueryString({ search: '', country: 'IN', department: undefined, page: 2 })).toBe('?country=IN&page=2');
  });

  it('returns an empty string when there is nothing to send', () => {
    expect(toQueryString({ search: '' })).toBe('');
  });

  it('encodes special characters', () => {
    expect(toQueryString({ search: '50% & more' })).toBe('?search=50%25+%26+more');
  });
});

describe('api', () => {
  it('requests a directory page with its filters', async () => {
    const fetchMock = mockFetch(200, { items: [], total: 0, page: 2, pageSize: 25 });

    const page = await api.employees.list({ page: 2, pageSize: 25, country: 'GB', search: '' });

    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/employees?page=2&pageSize=25&country=GB`, undefined);
    expect(page.total).toBe(0);
  });

  it('sends a new employee as JSON', async () => {
    const fetchMock = mockFetch(201, { id: '1' });
    const input = {
      fullName: 'Asha Rao',
      email: 'asha@acme.com',
      jobTitle: 'Software Engineer',
      department: 'Engineering',
      countryCode: 'IN',
      salary: 1800000.5,
      hireDate: '2022-04-18',
    };

    await api.employees.create(input);

    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  });

  it('returns nothing for a 204 No Content response', async () => {
    mockFetch(204);

    await expect(api.employees.remove('1')).resolves.toBeUndefined();
  });

  it('turns an error response into an ApiError with its status and message', async () => {
    mockFetch(409, { statusCode: 409, message: 'An employee with email asha@acme.com already exists' });

    const error = await api.employees.create({} as never).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 409, message: 'An employee with email asha@acme.com already exists' });
  });

  it('joins a list of validation messages into one readable message', async () => {
    mockFetch(400, { statusCode: 400, message: ['salary must be a positive number', 'email must be a valid email address'] });

    const error = await api.employees.create({} as never).catch((e: unknown) => e);

    expect(error).toMatchObject({ message: 'salary must be a positive number. email must be a valid email address' });
  });

  it('keeps the row-level errors from a rejected import', async () => {
    const errors = [{ row: 3, column: 'Salary', message: 'Salary must be a positive number' }];
    mockFetch(422, { statusCode: 422, message: 'The file has errors. Nothing was imported.', errors });

    const error = await api.excel.import(new File(['x'], 'employees.xlsx')).catch((e: unknown) => e);

    expect(error).toMatchObject({ status: 422, rowErrors: errors });
  });

  it('reports a network failure as an ApiError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    const error = await api.insights.overview().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 0 });
  });

  it('builds the export link with the current filters', () => {
    expect(api.excel.exportUrl({ country: 'IN', sortBy: 'salary', sortOrder: 'desc' })).toBe(
      `${API_URL}/excel/export?country=IN&sortBy=salary&sortOrder=desc`,
    );
  });
});
