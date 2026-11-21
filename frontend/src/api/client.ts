import { API_URL } from './config';
import type {
  CountryJobTitles,
  CountrySummary,
  DirectoryFilters,
  DirectoryParams,
  Employee,
  EmployeeInput,
  EmployeePage,
  FilterOptions,
  ImportResult,
  Overview,
  RowError,
} from './types';

/** Every failed request becomes an ApiError, so screens handle one shape of error. */
export class ApiError extends Error {
  constructor(
    /** HTTP status, or 0 when the server could not be reached at all. */
    readonly status: number,
    message: string,
    /** Row-level problems from a rejected Excel import. */
    readonly rowErrors: RowError[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ErrorBody {
  message?: string | string[];
  errors?: RowError[];
}

type QueryValue = string | number | undefined;

/** Builds "?a=1&b=2", leaving out empty values so the API applies its defaults. */
export function toQueryString(params: Record<string, QueryValue>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      query.append(key, String(value));
    }
  }
  const text = query.toString();
  return text ? `?${text}` : '';
}

function errorMessage(body: ErrorBody | null, response: Response): string {
  if (Array.isArray(body?.message)) return body.message.join('. ');
  return body?.message ?? (response.statusText || `Request failed with status ${response.status}`);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, init);
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.');
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ErrorBody | null;
    throw new ApiError(response.status, errorMessage(body, response), body?.errors ?? []);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

const sendJson = (method: 'POST' | 'PATCH', body: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

/** The only module that knows the API's URLs. */
export const api = {
  employees: {
    list: (params: DirectoryParams) => request<EmployeePage>(`/employees${toQueryString({ ...params })}`),
    get: (id: string) => request<Employee>(`/employees/${id}`),
    create: (input: EmployeeInput) => request<Employee>('/employees', sendJson('POST', input)),
    update: (id: string, changes: Partial<EmployeeInput>) =>
      request<Employee>(`/employees/${id}`, sendJson('PATCH', changes)),
    remove: (id: string) => request<void>(`/employees/${id}`, { method: 'DELETE' }),
    filterOptions: () => request<FilterOptions>('/employees/filter-options'),
  },
  insights: {
    overview: () => request<Overview>('/insights/overview'),
    countries: () => request<CountrySummary[]>('/insights/countries'),
    jobTitles: (countryCode: string) => request<CountryJobTitles>(`/insights/countries/${countryCode}/job-titles`),
  },
  excel: {
    templateUrl: () => `${API_URL}/excel/template`,
    exportUrl: (filters: DirectoryFilters) => `${API_URL}/excel/export${toQueryString({ ...filters })}`,
    import: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return request<ImportResult>('/excel/import', { method: 'POST', body: form });
    },
  },
};
