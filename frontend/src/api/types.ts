/**
 * Response and request shapes of the API, mirroring the backend's DTOs and documented
 * in docs/architecture.md. Money is a number with at most two decimals; it is only
 * displayed, never used in arithmetic, on the client.
 */

export interface Country {
  code: string;
  name: string;
  currency: string;
}

export interface Employee {
  id: string;
  fullName: string;
  email: string;
  jobTitle: string;
  department: string;
  countryCode: string;
  currency: string;
  salary: number;
  hireDate: string;
  createdAt: string;
  updatedAt: string;
}

/** What the client sends when creating an employee. The server derives the currency. */
export interface EmployeeInput {
  fullName: string;
  email: string;
  jobTitle: string;
  department: string;
  countryCode: string;
  salary: number;
  hireDate: string;
}

export type SortField = 'fullName' | 'salary' | 'hireDate';
export type SortOrder = 'asc' | 'desc';

/** Search, filters and sort shared by the directory and the Excel export. */
export interface DirectoryFilters {
  search?: string;
  country?: string;
  department?: string;
  jobTitle?: string;
  sortBy?: SortField;
  sortOrder?: SortOrder;
}

export interface DirectoryParams extends DirectoryFilters {
  page?: number;
  pageSize?: number;
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

export interface Overview {
  totalHeadcount: number;
  byCountry: { countryCode: string; countryName: string; currency: string; headcount: number }[];
  byDepartment: { department: string; headcount: number }[];
}

export interface CountrySummary {
  countryCode: string;
  countryName: string;
  currency: string;
  headcount: number;
  minSalary: number;
  maxSalary: number;
  averageSalary: number;
  medianSalary: number;
}

export interface JobTitleSummary {
  jobTitle: string;
  headcount: number;
  minSalary: number;
  maxSalary: number;
  averageSalary: number;
}

export interface CountryJobTitles {
  countryCode: string;
  countryName: string;
  currency: string;
  jobTitles: JobTitleSummary[];
}

export interface ImportResult {
  created: number;
  updated: number;
}

/** One problem in an imported spreadsheet, located by Excel row number and column header. */
export interface RowError {
  row: number;
  column: string;
  message: string;
}
