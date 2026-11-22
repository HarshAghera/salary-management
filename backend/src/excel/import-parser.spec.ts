import { MAX_IMPORT_ROWS } from './excel-columns';
import { SheetRow, normaliseCell, parseImportRows } from './import-parser';

const HEADER = ['Full name', 'Email', 'Job title', 'Department', 'Country code', 'Salary', 'Hire date'];

const VALID: unknown[] = ['Asha Rao', 'asha@acme.com', 'Software Engineer', 'Engineering', 'IN', 1800000.5, '2022-04-18'];

/** Builds sheet rows the way Excel numbers them: the header is row 1. */
function sheet(...rows: unknown[][]): SheetRow[] {
  return rows.map((cells, index) => ({ rowNumber: index + 1, cells }));
}

describe('parseImportRows', () => {
  it('reads employees from the rows under the header', async () => {
    const result = await parseImportRows(sheet(HEADER, VALID));

    expect(result).toEqual({
      kind: 'valid',
      employees: [
        expect.objectContaining({
          fullName: 'Asha Rao',
          email: 'asha@acme.com',
          countryCode: 'IN',
          salary: 1800000.5,
          hireDate: '2022-04-18',
        }),
      ],
    });
  });

  it('matches headers regardless of letter case, spacing and column order', async () => {
    const header = ['  EMAIL ', 'full NAME', 'Salary', 'Hire Date', 'job title', 'Country Code', 'department'];
    const row = ['asha@acme.com', 'Asha Rao', 72000, '2022-04-18', 'Software Engineer', 'GB', 'Engineering'];

    const result = await parseImportRows(sheet(header, row));

    expect(result.kind).toBe('valid');
  });

  it('ignores extra columns such as the Currency column from an export', async () => {
    const result = await parseImportRows(sheet([...HEADER, 'Currency'], [...VALID, 'USD']));

    expect(result.kind).toBe('valid');
  });

  it('reports every required column that is missing', async () => {
    const result = await parseImportRows(sheet(['Full name', 'Email'], ['Asha Rao', 'asha@acme.com']));

    expect(result).toEqual({
      kind: 'row-errors',
      errors: expect.arrayContaining([
        { row: 1, column: 'Salary', message: 'Required column is missing' },
        { row: 1, column: 'Country code', message: 'Required column is missing' },
      ]),
    });
  });

  it('skips completely empty rows', async () => {
    const result = await parseImportRows(sheet(HEADER, [], [null, '', undefined], VALID));

    expect(result.kind === 'valid' && result.employees).toHaveLength(1);
  });

  it('reports each invalid cell with its Excel row number and column header', async () => {
    const badSalary = [...VALID];
    badSalary[5] = -10;
    const badCountry = [...VALID];
    badCountry[1] = 'ben@acme.com';
    badCountry[4] = 'ZZ';

    const result = await parseImportRows(sheet(HEADER, badSalary, badCountry));

    expect(result).toEqual({
      kind: 'row-errors',
      errors: [
        { row: 2, column: 'Salary', message: 'Salary must be a positive number' },
        { row: 3, column: 'Country code', message: expect.stringMatching(/^Country code must be one of/) },
      ],
    });
  });

  it('reports a missing required value', async () => {
    const row = [...VALID];
    row[2] = '';

    const result = await parseImportRows(sheet(HEADER, row));

    expect(result).toEqual({
      kind: 'row-errors',
      errors: [{ row: 2, column: 'Job title', message: 'Job title is required' }],
    });
  });

  it.each(HEADER.map((header, index) => [header, index] as const))(
    'says an empty %s cell is required, not that it is too long or the wrong type',
    async (header, index) => {
      const row = [...VALID];
      row[index] = null;

      const result = await parseImportRows(sheet(HEADER, row));

      expect(result).toEqual({ kind: 'row-errors', errors: [{ row: 2, column: header, message: `${header} is required` }] });
    },
  );

  it('treats a cell of only spaces as empty', async () => {
    const row = [...VALID];
    row[0] = '   ';

    const result = await parseImportRows(sheet(HEADER, row));

    expect(result).toEqual({ kind: 'row-errors', errors: [{ row: 2, column: 'Full name', message: 'Full name is required' }] });
  });

  it('rejects an email that appears twice in the file, ignoring letter case', async () => {
    const duplicate = [...VALID];
    duplicate[1] = 'ASHA@acme.com';

    const result = await parseImportRows(sheet(HEADER, VALID, duplicate));

    expect(result).toEqual({
      kind: 'row-errors',
      errors: [{ row: 3, column: 'Email', message: 'Email already appears on row 2' }],
    });
  });

  it('reads a salary typed as text, including thousands separators', async () => {
    const row = [...VALID];
    row[5] = '85,000.50';

    const result = await parseImportRows(sheet(HEADER, row));

    expect(result.kind === 'valid' && result.employees[0].salary).toBe(85000.5);
  });

  it('reads an Excel date cell as a YYYY-MM-DD hire date', async () => {
    const row = [...VALID];
    row[6] = new Date(Date.UTC(2021, 0, 10));

    const result = await parseImportRows(sheet(HEADER, row));

    expect(result.kind === 'valid' && result.employees[0].hireDate).toBe('2021-01-10');
  });

  it('reports a file with no employee rows', async () => {
    expect(await parseImportRows(sheet(HEADER))).toEqual({
      kind: 'file-error',
      message: 'The file has no employee rows.',
    });
  });

  it('reports an empty file', async () => {
    expect(await parseImportRows([])).toEqual({
      kind: 'file-error',
      message: 'The file is empty. Download the template to see the expected columns.',
    });
  });

  it(`rejects more than ${MAX_IMPORT_ROWS} employee rows`, async () => {
    const rows = Array.from({ length: MAX_IMPORT_ROWS + 1 }, () => VALID);

    expect(await parseImportRows(sheet(HEADER, ...rows))).toEqual({
      kind: 'file-error',
      message: `The file has ${MAX_IMPORT_ROWS + 1} employee rows; the limit is ${MAX_IMPORT_ROWS} per file.`,
    });
  });
});

describe('normaliseCell', () => {
  it('reads the text of a hyperlinked email', () => {
    expect(normaliseCell({ text: 'asha@acme.com', hyperlink: 'mailto:asha@acme.com' })).toBe('asha@acme.com');
  });

  it('joins the runs of rich text', () => {
    expect(normaliseCell({ richText: [{ text: 'Asha ' }, { text: 'Rao' }] })).toBe('Asha Rao');
  });

  it('reads the result of a formula', () => {
    expect(normaliseCell({ formula: 'B2*2', result: 1000 })).toBe(1000);
  });

  it('treats blank text as empty', () => {
    expect(normaliseCell('   ')).toBeUndefined();
  });
});
