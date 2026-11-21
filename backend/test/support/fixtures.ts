import ExcelJS from 'exceljs';
import { DataSource } from 'typeorm';
import { currencyForCountry } from '../../src/common/countries';
import { CreateEmployeeDto } from '../../src/employees/dto/create-employee.dto';
import { Employee } from '../../src/employees/employee.entity';
import { NewEmployee } from '../../src/employees/employees.repository';
import { asWorkbookInput } from '../../src/excel/workbook-input';

let sequence = 0;

/** A valid employee with a unique email; currency always follows the country. */
export function newEmployee(overrides: Partial<Omit<NewEmployee, 'currency'>> = {}): NewEmployee {
  sequence += 1;
  const countryCode = overrides.countryCode ?? 'GB';
  return {
    fullName: `Employee ${sequence}`,
    email: `employee.${sequence}@acme.com`,
    jobTitle: 'Software Engineer',
    department: 'Engineering',
    salary: 50000,
    hireDate: '2022-01-01',
    ...overrides,
    countryCode,
    currency: currencyForCountry(countryCode),
  };
}

/** The same employee as a client would send it: no currency, which the server derives. */
export function newEmployeeInput(overrides: Partial<CreateEmployeeDto> = {}): CreateEmployeeDto {
  const { currency, ...input } = newEmployee(overrides);
  return input;
}

export async function insertEmployees(dataSource: DataSource, employees: NewEmployee[]): Promise<void> {
  await dataSource.getRepository(Employee).insert(employees);
}

export const IMPORT_HEADER = ['Full name', 'Email', 'Job title', 'Department', 'Country code', 'Salary', 'Hire date'];

export async function workbookBuffer(rows: unknown[][]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Employees');
  rows.forEach((row) => sheet.addRow(row));
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export async function readEmployeesSheet(buffer: Buffer): Promise<unknown[][]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(asWorkbookInput(buffer));
  const rows: unknown[][] = [];
  workbook.getWorksheet('Employees')!.eachRow((row) => rows.push((row.values as unknown[]).slice(1)));
  return rows;
}
