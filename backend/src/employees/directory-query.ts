import { Country } from '../common/countries';
import { Employee } from './employee.entity';

export const SORT_FIELDS = ['fullName', 'salary', 'hireDate'] as const;
export type SortField = (typeof SORT_FIELDS)[number];

export const SORT_ORDERS = ['asc', 'desc'] as const;
export type SortOrder = (typeof SORT_ORDERS)[number];

/**
 * The only columns the directory can be ordered by. Client input selects a key,
 * never a column name, so nothing user-supplied reaches ORDER BY (ADR-4).
 */
export const SORT_COLUMNS: Record<SortField, string> = {
  fullName: 'e.fullName',
  salary: 'e.salary',
  hireDate: 'e.hireDate',
};

/** Which employees match and in what order; shared by the paged list and the Excel export. */
export interface DirectorySearch {
  search?: string;
  country?: string;
  department?: string;
  jobTitle?: string;
  sortBy: SortField;
  sortOrder: SortOrder;
}

export interface DirectoryCriteria extends DirectorySearch {
  page: number;
  pageSize: number;
}

export interface EmployeePage {
  items: Employee[];
  total: number;
  page: number;
  pageSize: number;
}

export interface FilterOptions {
  countries: Country[];
  departments: string[];
  jobTitles: string[];
}

/** Escapes LIKE wildcards so a search for "50%" matches that text, not everything. */
export function escapeLike(term: string): string {
  return term.replace(/[\\%_]/g, '\\$&');
}
