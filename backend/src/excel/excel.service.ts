import { BadRequestException, Injectable, UnprocessableEntityException } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { Writable } from 'stream';
import { COUNTRIES, COUNTRY_CODES, currencyForCountry } from '../common/countries';
import { DirectorySearch } from '../employees/directory-query';
import { EmployeesRepository } from '../employees/employees.repository';
import { CURRENCY_HEADER, EMPLOYEES_SHEET, IMPORT_COLUMNS, MAX_IMPORT_BYTES, MAX_IMPORT_ROWS } from './excel-columns';
import { SheetRow, parseImportRows } from './import-parser';
import { asWorkbookInput } from './workbook-input';

export interface ImportResult {
  created: number;
  updated: number;
}

const SALARY_FORMAT = '#,##0.00';
/** Text format keeps typed dates as "YYYY-MM-DD" instead of Excel's locale date. */
const TEXT_FORMAT = '@';

@Injectable()
export class ExcelService {
  constructor(private readonly employees: EmployeesRepository) {}

  /** A blank import file: the expected headers, a country dropdown and instructions. */
  async buildTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(EMPLOYEES_SHEET, { views: [{ state: 'frozen', ySplit: 1 }] });
    sheet.columns = IMPORT_COLUMNS.map((column) => ({ header: column.header, key: column.key, width: column.width }));
    sheet.getRow(1).font = { bold: true };
    sheet.getColumn('salary').numFmt = SALARY_FORMAT;
    sheet.getColumn('hireDate').numFmt = TEXT_FORMAT;

    const countryColumn = sheet.getColumn('countryCode').letter;
    for (let row = 2; row <= MAX_IMPORT_ROWS + 1; row++) {
      sheet.getCell(`${countryColumn}${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`"${COUNTRY_CODES.join(',')}"`],
        showErrorMessage: true,
        errorTitle: 'Unknown country',
        error: 'Choose a country code from the list.',
      };
    }

    const instructions = workbook.addWorksheet('Instructions');
    instructions.getColumn(1).width = 110;
    [
      'How to import employees',
      '',
      `Fill in one employee per row on the "${EMPLOYEES_SHEET}" sheet. Keep the header row as it is.`,
      'Rows are matched by email: a new email creates an employee, an existing email updates that employee.',
      'Every row is checked before anything is saved. If any row has a problem, nothing is imported and you',
      'get a list of rows to fix. Import never deletes employees.',
      `Limits: .xlsx files only, up to ${MAX_IMPORT_ROWS.toLocaleString('en')} rows and ${MAX_IMPORT_BYTES / 1024 / 1024} MB per file.`,
      '',
      'Columns',
      'Full name, Job title, Department: required text, up to 120 characters.',
      'Email: required and unique.',
      'Country code: one of the codes below. The currency is set automatically from the country.',
      'Salary: annual gross amount in the local currency, greater than 0, up to 2 decimal places.',
      'Hire date: YYYY-MM-DD, for example 2024-03-01.',
      '',
      'Country codes',
      ...COUNTRIES.map((country) => `${country.code}  ${country.name} (${country.currency})`),
    ].forEach((line, index) => {
      instructions.addRow([line]);
      if (index === 0 || line === 'Columns' || line === 'Country codes') {
        instructions.getRow(index + 1).font = { bold: true };
      }
    });

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  /**
   * Validates the whole file first and writes only if every row is valid, so an
   * import is all-or-nothing (ADR-7).
   */
  async importWorkbook(file: Buffer): Promise<ImportResult> {
    const result = await parseImportRows(await this.readRows(file));

    if (result.kind === 'file-error') {
      throw new BadRequestException(result.message);
    }
    if (result.kind === 'row-errors') {
      throw new UnprocessableEntityException({
        statusCode: 422,
        message: 'The file has errors. Nothing was imported.',
        errors: result.errors,
      });
    }

    return this.employees.upsertByEmail(
      result.employees.map((employee) => ({ ...employee, currency: currencyForCountry(employee.countryCode) })),
    );
  }

  /**
   * Streams the matching directory as a workbook. The columns mirror the import
   * template, so an export can be edited and imported back.
   */
  async writeExport(criteria: DirectorySearch, output: Writable): Promise<void> {
    const employees = await this.employees.findAllMatching(criteria);

    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream: output, useStyles: true });
    const sheet = workbook.addWorksheet(EMPLOYEES_SHEET, { views: [{ state: 'frozen', ySplit: 1 }] });
    sheet.columns = [
      ...IMPORT_COLUMNS.map((column) => ({ header: column.header, key: column.key, width: column.width })),
      { header: CURRENCY_HEADER, key: 'currency', width: 10 },
    ];
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).commit();

    for (const employee of employees) {
      const row = sheet.addRow({
        fullName: employee.fullName,
        email: employee.email,
        jobTitle: employee.jobTitle,
        department: employee.department,
        countryCode: employee.countryCode,
        salary: employee.salary,
        hireDate: employee.hireDate,
        currency: employee.currency,
      });
      row.getCell('salary').numFmt = SALARY_FORMAT;
      row.commit();
    }

    sheet.commit();
    await workbook.commit();
  }

  private async readRows(file: Buffer): Promise<SheetRow[]> {
    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.load(asWorkbookInput(file));
    } catch {
      throw new BadRequestException('The file is not a valid .xlsx workbook.');
    }

    // Prefer the template's sheet; fall back to the first sheet for files HR built themselves.
    const sheet = workbook.getWorksheet(EMPLOYEES_SHEET) ?? workbook.worksheets[0];
    if (!sheet) {
      throw new BadRequestException('The workbook has no sheets.');
    }

    const rows: SheetRow[] = [];
    sheet.eachRow((row) => rows.push({ rowNumber: row.number, cells: (row.values as unknown[]).slice(1) }));
    return rows;
  }
}
