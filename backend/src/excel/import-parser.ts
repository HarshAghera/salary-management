import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateEmployeeDto } from '../employees/dto/create-employee.dto';
import { IMPORT_COLUMNS, ImportColumn, MAX_IMPORT_ROWS } from './excel-columns';

/** One spreadsheet row: its Excel row number and its cell values, first column first. */
export interface SheetRow {
  rowNumber: number;
  cells: unknown[];
}

export interface RowError {
  row: number;
  column: string;
  message: string;
}

export type ImportParseResult =
  | { kind: 'valid'; employees: CreateEmployeeDto[] }
  | { kind: 'row-errors'; errors: RowError[] }
  | { kind: 'file-error'; message: string };

type CellValue = string | number | undefined;

/**
 * Reduces an Excel cell to plain text or a number. Excel wraps values in objects for
 * hyperlinks (emails are often auto-linked), rich text and formulas, and stores
 * dates as Date objects at UTC midnight.
 */
export function normaliseCell(value: unknown): CellValue {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return value.trim() === '' ? undefined : value.trim();
  if (typeof value === 'boolean') return String(value);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'object') {
    const cell = value as { richText?: { text: string }[]; text?: unknown; result?: unknown };
    if (Array.isArray(cell.richText)) return normaliseCell(cell.richText.map((run) => run.text).join(''));
    if ('result' in cell) return normaliseCell(cell.result);
    if ('text' in cell) return normaliseCell(cell.text);
  }
  return undefined;
}

const headerKey = (header: unknown) => String(normaliseCell(header) ?? '').toLowerCase().replace(/\s+/g, ' ');

/** Salaries typed as text ("85,000.50") are accepted; anything else is left for validation to reject. */
function toSalary(value: CellValue): unknown {
  if (typeof value !== 'string') return value;
  const plain = value.replace(/,/g, '');
  return /^-?\d+(\.\d+)?$/.test(plain) ? Number(plain) : value;
}

function toFieldValue(column: ImportColumn, value: CellValue): unknown {
  if (column.key === 'salary') return toSalary(value);
  return typeof value === 'number' ? String(value) : value;
}

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
}

/** class-validator messages start with the property name; HR sees the column header instead. */
function columnMessage(column: ImportColumn, message: string): string {
  return message.replace(new RegExp(`^${column.key}\\b`), column.header);
}

/**
 * Turns spreadsheet rows into validated employees. The first row is the header;
 * columns are matched by name in any order. Every row is checked with the same
 * rules as the API, and nothing is returned as valid unless every row passes, which
 * is what makes the import all-or-nothing (ADR-7).
 */
export async function parseImportRows(rows: SheetRow[]): Promise<ImportParseResult> {
  const nonEmpty = rows.filter((row) => row.cells.some((cell) => normaliseCell(cell) !== undefined));
  if (nonEmpty.length === 0) {
    return { kind: 'file-error', message: 'The file is empty. Download the template to see the expected columns.' };
  }

  const [header, ...dataRows] = nonEmpty;
  const positions = new Map(header.cells.map((cell, index) => [headerKey(cell), index]));

  const missing = IMPORT_COLUMNS.filter((column) => !positions.has(headerKey(column.header)));
  if (missing.length > 0) {
    return {
      kind: 'row-errors',
      errors: missing.map((column) => ({
        row: header.rowNumber,
        column: column.header,
        message: 'Required column is missing',
      })),
    };
  }

  if (dataRows.length === 0) {
    return { kind: 'file-error', message: 'The file has no employee rows.' };
  }
  if (dataRows.length > MAX_IMPORT_ROWS) {
    return {
      kind: 'file-error',
      message: `The file has ${dataRows.length} employee rows; the limit is ${MAX_IMPORT_ROWS} per file.`,
    };
  }

  const errors: RowError[] = [];
  const employees: CreateEmployeeDto[] = [];
  const firstRowByEmail = new Map<string, number>();

  for (const row of dataRows) {
    const fields = Object.fromEntries(
      IMPORT_COLUMNS.map((column) => [
        column.key,
        toFieldValue(column, normaliseCell(row.cells[positions.get(headerKey(column.header))!])),
      ]),
    );
    const employee = plainToInstance(CreateEmployeeDto, fields);
    const failures = await validate(employee);

    for (const failure of failures) {
      const column = IMPORT_COLUMNS.find((c) => c.key === failure.property)!;
      // A blank cell fails every rule at once, and the first of them ("too long", "not a
      // country") would mislead. Say plainly that the value is required.
      if (isBlank(fields[column.key])) {
        errors.push({ row: row.rowNumber, column: column.header, message: `${column.header} is required` });
        continue;
      }
      const [firstMessage] = Object.values(failure.constraints ?? {});
      errors.push({ row: row.rowNumber, column: column.header, message: columnMessage(column, firstMessage) });
    }

    if (failures.length === 0) {
      // Duplicates inside one file are ambiguous (which row wins?) and would break the single upsert.
      const earlierRow = firstRowByEmail.get(employee.email);
      if (earlierRow !== undefined) {
        errors.push({ row: row.rowNumber, column: 'Email', message: `Email already appears on row ${earlierRow}` });
      } else {
        firstRowByEmail.set(employee.email, row.rowNumber);
        employees.push(employee);
      }
    }
  }

  return errors.length > 0 ? { kind: 'row-errors', errors } : { kind: 'valid', employees };
}
