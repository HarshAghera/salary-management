import { UnprocessableEntityException } from '@nestjs/common';
import { PassThrough } from 'stream';
import { DataSource } from 'typeorm';
import { Employee } from '../src/employees/employee.entity';
import { EmployeesRepository } from '../src/employees/employees.repository';
import { ExcelService } from '../src/excel/excel.service';
import { IMPORT_HEADER, insertEmployees, newEmployee, readEmployeesSheet, workbookBuffer } from './support/fixtures';
import { createTestDataSource, emptyEmployees } from './support/test-database';

describe('Excel import and export against PostgreSQL', () => {
  let dataSource: DataSource;
  let excel: ExcelService;

  const stored = () => dataSource.getRepository(Employee).find({ order: { email: 'ASC' } });

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    excel = new ExcelService(new EmployeesRepository(dataSource.getRepository(Employee)));
  });

  beforeEach(() => emptyEmployees(dataSource));

  afterAll(() => dataSource?.destroy());

  it('creates new employees and updates existing ones matched by email in any letter case', async () => {
    await insertEmployees(dataSource, [newEmployee({ email: 'asha@acme.com', countryCode: 'GB', salary: 50000 })]);
    const file = await workbookBuffer([
      IMPORT_HEADER,
      ['Asha Rao', 'ASHA@ACME.COM', 'Engineering Manager', 'Engineering', 'IN', 60000.5, '2020-05-01'],
      ['Ben Carter', 'ben@acme.com', 'Accountant', 'Finance', 'GB', 52000, '2021-01-10'],
    ]);

    const result = await excel.importWorkbook(file);

    expect(result).toEqual({ created: 1, updated: 1 });
    const [asha, ben] = await stored();
    expect(asha).toMatchObject({
      email: 'asha@acme.com',
      jobTitle: 'Engineering Manager',
      countryCode: 'IN',
      currency: 'INR',
      salary: 60000.5,
      hireDate: '2020-05-01',
    });
    expect(ben).toMatchObject({ email: 'ben@acme.com', currency: 'GBP', salary: 52000 });
  });

  it('saves nothing, not even the valid rows, when any row is invalid', async () => {
    await insertEmployees(dataSource, [newEmployee({ email: 'asha@acme.com', salary: 50000 })]);
    const file = await workbookBuffer([
      IMPORT_HEADER,
      ['Asha Rao', 'asha@acme.com', 'Software Engineer', 'Engineering', 'GB', 99999, '2020-05-01'],
      ['Ben Carter', 'ben@acme.com', 'Accountant', 'Finance', 'GB', -1, '2021-01-10'],
    ]);

    await expect(excel.importWorkbook(file)).rejects.toBeInstanceOf(UnprocessableEntityException);

    const employees = await stored();
    expect(employees).toHaveLength(1);
    expect(employees[0].salary).toBe(50000);
  });

  it('is idempotent when the same file is imported twice', async () => {
    const file = await workbookBuffer([
      IMPORT_HEADER,
      ['Asha Rao', 'asha@acme.com', 'Software Engineer', 'Engineering', 'GB', 50000, '2020-05-01'],
      ['Ben Carter', 'ben@acme.com', 'Accountant', 'Finance', 'GB', 52000, '2021-01-10'],
    ]);

    const first = await excel.importWorkbook(file);
    const second = await excel.importWorkbook(file);

    expect(first).toEqual({ created: 2, updated: 0 });
    expect(second).toEqual({ created: 0, updated: 2 });
    expect(await stored()).toHaveLength(2);
  });

  it('exports exactly the employees that match the filters, and the export imports back unchanged', async () => {
    await insertEmployees(dataSource, [
      newEmployee({ fullName: 'In One', email: 'in.one@acme.com', countryCode: 'IN', salary: 1200000.5 }),
      newEmployee({ fullName: 'Gb One', email: 'gb.one@acme.com', countryCode: 'GB' }),
    ]);
    const output = new PassThrough();
    const chunks: Buffer[] = [];
    output.on('data', (chunk: Buffer) => chunks.push(chunk));

    await excel.writeExport({ country: 'IN', sortBy: 'fullName', sortOrder: 'asc' }, output);
    const exported = Buffer.concat(chunks);

    expect((await readEmployeesSheet(exported)).slice(1)).toEqual([
      ['In One', 'in.one@acme.com', 'Software Engineer', 'Engineering', 'IN', 1200000.5, '2022-01-01', 'INR'],
    ]);
    expect(await excel.importWorkbook(exported)).toEqual({ created: 0, updated: 1 });
  });
});
