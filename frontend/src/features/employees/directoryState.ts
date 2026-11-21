import type { DirectoryFilters, DirectoryParams, SortField, SortOrder } from '../../api/types';

export const PAGE_SIZE_OPTIONS = [25, 50, 100];

const SORT_FIELDS: readonly SortField[] = ['fullName', 'salary', 'hireDate'];
const SORT_ORDERS: readonly SortOrder[] = ['asc', 'desc'];

/** Everything that decides which employees the directory shows. Kept in the address bar. */
export interface DirectoryState {
  page: number;
  pageSize: number;
  search: string;
  country: string;
  department: string;
  jobTitle: string;
  sortBy: SortField;
  sortOrder: SortOrder;
}

/** Matches the API's own defaults, so a bare /employees address and the API agree. */
export const DEFAULT_DIRECTORY_STATE: DirectoryState = {
  page: 1,
  pageSize: 25,
  search: '',
  country: '',
  department: '',
  jobTitle: '',
  sortBy: 'fullName',
  sortOrder: 'asc',
};

function positiveInt(value: string | null, fallback: number, allowed?: number[]): number {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) return fallback;
  if (allowed && !allowed.includes(number)) return fallback;
  return number;
}

function oneOf<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

/** Reads the address bar. Anything missing or hand-edited into nonsense falls back to a default. */
export function readDirectoryState(params: URLSearchParams): DirectoryState {
  const d = DEFAULT_DIRECTORY_STATE;
  return {
    page: positiveInt(params.get('page'), d.page),
    pageSize: positiveInt(params.get('pageSize'), d.pageSize, PAGE_SIZE_OPTIONS),
    search: params.get('search') ?? d.search,
    country: params.get('country') ?? d.country,
    department: params.get('department') ?? d.department,
    jobTitle: params.get('jobTitle') ?? d.jobTitle,
    sortBy: oneOf(params.get('sortBy'), SORT_FIELDS, d.sortBy),
    sortOrder: oneOf(params.get('sortOrder'), SORT_ORDERS, d.sortOrder),
  };
}

/** Writes only what differs from the defaults, so addresses stay short and readable. */
export function writeDirectoryState(state: DirectoryState): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of Object.keys(DEFAULT_DIRECTORY_STATE) as (keyof DirectoryState)[]) {
    if (state[key] !== DEFAULT_DIRECTORY_STATE[key]) {
      params.set(key, String(state[key]));
    }
  }
  return params;
}

/**
 * Applies a change. Any change other than moving between pages starts again at page 1,
 * because the old page number may not exist in the new result.
 */
export function applyDirectoryChange(state: DirectoryState, changes: Partial<DirectoryState>): DirectoryState {
  return { ...state, ...('page' in changes ? {} : { page: 1 }), ...changes };
}

/**
 * Whether a change gets its own browser history entry, so Back returns to the previous view.
 * Paging, filters and sort do. Search alone does not: it updates as the user types, and one
 * entry per pause in typing would make Back tedious.
 */
export function addsHistoryEntry(changes: Partial<DirectoryState>): boolean {
  return Object.keys(changes).some((key) => key !== 'search');
}

/** Search, filters and sort without paging: what the phone feed and the Excel export use. */
export function toDirectoryFilters(state: DirectoryState): DirectoryFilters {
  return {
    search: state.search.trim() || undefined,
    country: state.country || undefined,
    department: state.department || undefined,
    jobTitle: state.jobTitle || undefined,
    sortBy: state.sortBy,
    sortOrder: state.sortOrder,
  };
}

export function toDirectoryParams(state: DirectoryState): DirectoryParams {
  return { ...toDirectoryFilters(state), page: state.page, pageSize: state.pageSize };
}

/** How many of search, country, department and job title are narrowing the list. */
export function activeFilterCount(state: DirectoryState): number {
  return [state.search.trim(), state.country, state.department, state.jobTitle].filter(Boolean).length;
}
