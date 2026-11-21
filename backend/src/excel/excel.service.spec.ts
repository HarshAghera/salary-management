import { BadRequestException, UnprocessableEntityException } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { PassThrough } from 'stream';
import { Employee } from '../employees/employee.entity';
import { EmployeesRepository } from '../employees/employees.repository';
import { ExcelService } from './excel.service';
import { asWorkbookInput } from './workbook-input';

type RepoMock = jest.Mocked<Pick<EmployeesRepository, 'upsertByEmail' | 'findAllMatching'>>;

const HEADER = ['Full name', 'Email', 'Job title', 'Department', 'Country code', 'Salary', 'Hire date'];

function setup() {
  const repo: RepoMock = {
    upsertByEmail: jest.fn(),
    findAllMatching: jest.fn(),
  };
  const service = new ExcelService(repo as unknown as EmployeesRepository);
  return { repo, service };
}

async function workbookBuffer(rows: unknown[][]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Employees');
  rows.forEach((row) => sheet.addRow(row));
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

async function readSheet(buffer: Buffer, name: string): Promise<unknown[][]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(asWorkbookInput(buffer));
  const rows: unknown[][] = [];
  workbook.getWorksheet(name)!.eachRow((row) => rows.push((row.values as unknown[]).slice(1)));
  return rows;
}

const storedEmployee = (overrides: Partial<Employee> = {}): Employee => ({
  id: '11111111-1111-4111-8111-111111111111',
  fullName: 'Asha Rao',
  email: 'asha@acme.com',
  jobTitle: 'Software Engineer',
  department: 'Engineering',
  countryCode: 'IN',
  currency: 'INR',
  salary: 1800000.5,
  hireDate: '2022-04-18',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  ...overrides,
});

describe('ExcelService', () => {
  describe('importWorkbook', () => {
    it('upserts every row with its derived currency and reports what changed', async () => {
      const { repo, service } = setup();
      repo.upsertByEmail.mockResolvedValue({ created: 1, updated: 1 });
      const file = await workbookBuffer([
        HEADER,
        ['Asha Rao', 'asha@acme.com', 'Software Engineer', 'Engineering', 'in', 1800000.5, '2022-04-18'],
        ['Ben Carter', 'ben@acme.com', 'Accountant', 'Finance', 'GB', 52000, '2021-01-10'],
      ]);

      const result = await service.importWorkbook(file);

      expect(result).toEqual({ created: 1, updated: 1 });
      expect(repo.upsertByEmail).toHaveBeenCalledWith([
        expect.objectContaining({ email: 'asha@acme.com', countryCode: 'IN', currency: 'INR', salary: 1800000.5 }),
        expect.objectContaining({ email: 'ben@acme.com', countryCode: 'GB', currency: 'GBP', salary: 52000 }),
      ]);
    });

    it('imports nothing and returns row-level errors when any row is invalid', async () => {
      const { repo, service } = setup();
      const file = await workbookBuffer([
        HEADER,
        ['Asha Rao', 'asha@acme.com', 'Software Engineer', 'Engineering', 'IN', 1800000, '2022-04-18'],
        ['Ben Carter', 'not-an-email', 'Accountant', 'Finance', 'GB', 52000, '2021-01-10'],
      ]);

      const error = await service.importWorkbook(file).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(UnprocessableEntityException);
      expect((error as UnprocessableEntityException).getResponse()).toMatchObject({
        statusCode: 422,
        errors: [{ row: 3, column: 'Email', message: 'Email must be a valid email address' }],
      });
      expect(repo.upsertByEmail).not.toHaveBeenCalled();
    });

    it('rejects a file that is not a valid workbook', async () => {
      const { repo, service } = setup();

      await expect(service.importWorkbook(Buffer.from('not a spreadsheet'))).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(repo.upsertByEmail).not.toHaveBeenCalled();
    });

    it('rejects a workbook with no employee rows', async () => {
      const { service } = setup();
      const file = await workbookBuffer([HEADER]);

      await expect(service.importWorkbook(file)).rejects.toThrow('The file has no employee rows.');
    });
  });

  describe('buildTemplate', () => {
    it('contains only the import headers, ready to fill in', async () => {
      const { service } = setup();

      const rows = await readSheet(await service.buildTemplate(), 'Employees');

      expect(rows).toEqual([HEADER]);
    });

    it('round-trips: a filled-in template imports successfully', async () => {
      const { repo, service } = setup();
      repo.upsertByEmail.mockResolvedValue({ created: 1, updated: 0 });
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(asWorkbookInput(await service.buildTemplate()));
      workbook
        .getWorksheet('Employees')!
        .addRow(['Asha Rao', 'asha@acme.com', 'Software Engineer', 'Engineering', 'IN', 1800000, '2022-04-18']);

      const result = await service.importWorkbook(Buffer.from(await workbook.xlsx.writeBuffer()));

      expect(result).toEqual({ created: 1, updated: 0 });
    });
  });

  describe('writeExport', () => {
    async function exportRows(employees: Employee[]) {
      const { repo, service } = setup();
      repo.findAllMatching.mockResolvedValue(employees);
      const output = new PassThrough();
      const chunks: Buffer[] = [];
      output.on('data', (chunk: Buffer) => chunks.push(chunk));

      await service.writeExport({ sortBy: 'fullName', sortOrder: 'asc', country: 'IN' }, output);

      return { repo, rows: await readSheet(Buffer.concat(chunks), 'Employees') };
    }

    it('writes the import headers plus currency, then one row per employee', async () => {
      const { rows } = await exportRows([storedEmployee()]);

      expect(rows).toEqual([
        [...HEADER, 'Currency'],
        ['Asha Rao', 'asha@acme.com', 'Software Engineer', 'Engineering', 'IN', 1800000.5, '2022-04-18', 'INR'],
      ]);
    });

    it('applies the directory filters to the export', async () => {
      const { repo } = await exportRows([]);

      expect(repo.findAllMatching).toHaveBeenCalledWith(expect.objectContaining({ country: 'IN' }));
    });
  });
});
