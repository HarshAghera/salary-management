import { CreateEmployeeDto } from '../employees/dto/create-employee.dto';

export interface ImportColumn {
  key: keyof CreateEmployeeDto;
  header: string;
  width: number;
}

/** The columns HR fills in. Currency is never imported: it is derived from the country (ADR-6). */
export const IMPORT_COLUMNS: readonly ImportColumn[] = [
  { key: 'fullName', header: 'Full name', width: 28 },
  { key: 'email', header: 'Email', width: 32 },
  { key: 'jobTitle', header: 'Job title', width: 28 },
  { key: 'department', header: 'Department', width: 20 },
  { key: 'countryCode', header: 'Country code', width: 14 },
  { key: 'salary', header: 'Salary', width: 16 },
  { key: 'hireDate', header: 'Hire date', width: 14 },
];

/** Exports add the derived currency so the file reads correctly on its own; import ignores it. */
export const CURRENCY_HEADER = 'Currency';

export const EMPLOYEES_SHEET = 'Employees';

/** Import is for routine batches; the full organization is loaded by the seed script (ADR-7). */
export const MAX_IMPORT_ROWS = 1_000;
export const MAX_IMPORT_BYTES = 1024 * 1024;

export const XLSX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
