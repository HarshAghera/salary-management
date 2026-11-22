import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError } from '../../api/client';
import type { RowError } from '../../api/types';
import { saveFile } from '../../lib/download';
import { renderWithProviders, setScreen } from '../../test/render';
import { ImportExportPage } from './ImportExportPage';

// The browser's "save file" step has no meaning in jsdom; tests check what would be saved.
vi.mock('../../lib/download', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/download')>()),
  saveFile: vi.fn(),
}));

const ROW_ERRORS: RowError[] = [
  { row: 3, column: 'Email', message: 'Email must be a valid email address' },
  { row: 3, column: 'Salary', message: 'Salary must be a positive number' },
  { row: 7, column: 'Country', message: 'Country must be one of: US, GB, IN' },
];

function xlsx(name = 'employees.xlsx', bytes = 2048): File {
  return new File([new Uint8Array(bytes)], name);
}

function renderPage() {
  renderWithProviders(<ImportExportPage />, { route: '/import-export' });
  // applyAccept: false lets a test pick a file the input's accept filter would hide, as a user can.
  return userEvent.setup({ applyAccept: false });
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.mocked(saveFile).mockReset();
  vi.unstubAllGlobals();
});

describe('Import', () => {
  it('downloads the import template', async () => {
    setScreen('desktop');
    const workbook = new Blob(['template']);
    const download = vi.spyOn(api.excel, 'download').mockResolvedValue(workbook);
    const user = renderPage();

    await user.click(screen.getByRole('button', { name: 'Download template' }));

    expect(download).toHaveBeenCalledWith(api.excel.templateUrl());
    expect(saveFile).toHaveBeenCalledWith(workbook, 'employee-import-template.xlsx');
  });

  it('imports a chosen file and reports how many employees were added and updated', async () => {
    setScreen('desktop');
    const importFile = vi.spyOn(api.excel, 'import').mockResolvedValue({ created: 12, updated: 30 });
    const user = renderPage();
    const file = xlsx();

    await user.upload(screen.getByLabelText('Spreadsheet to import'), file);
    expect(screen.getByText('employees.xlsx')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Import employees' }));

    expect(importFile).toHaveBeenCalledWith(file);
    expect(await screen.findByText('Import complete')).toBeInTheDocument();
    expect(screen.getByText('12 added and 30 updated.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View employees' })).toHaveAttribute('href', '/employees');
  });

  it('keeps Import disabled until a file is chosen', () => {
    setScreen('desktop');
    renderPage();

    expect(screen.getByRole('button', { name: 'Import employees' })).toBeDisabled();
  });

  it('turns away a file that is not .xlsx without uploading it', async () => {
    setScreen('desktop');
    const importFile = vi.spyOn(api.excel, 'import');
    const user = renderPage();

    await user.upload(screen.getByLabelText('Spreadsheet to import'), xlsx('employees.csv'));

    expect(screen.getByText(/"employees.csv" is not an .xlsx file/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Import employees' })).toBeDisabled();
    expect(importFile).not.toHaveBeenCalled();
  });

  it('turns away a file over 1 MB without uploading it', async () => {
    setScreen('desktop');
    const user = renderPage();

    await user.upload(screen.getByLabelText('Spreadsheet to import'), xlsx('big.xlsx', 2 * 1024 * 1024));

    expect(screen.getByText(/larger than 1 MB/)).toBeInTheDocument();
  });

  it('lists every problem by row and column when the file is rejected', async () => {
    setScreen('desktop');
    vi.spyOn(api.excel, 'import').mockRejectedValue(
      new ApiError(422, 'The file has errors. Nothing was imported.', ROW_ERRORS),
    );
    const user = renderPage();
    await user.upload(screen.getByLabelText('Spreadsheet to import'), xlsx());

    await user.click(screen.getByRole('button', { name: 'Import employees' }));

    expect(await screen.findByText('Nothing was imported')).toBeInTheDocument();
    expect(screen.getByText('3 problems in 2 rows. Fix them in the spreadsheet and import it again.')).toBeInTheDocument();
    const report = screen.getByRole('table', { name: 'Problems in the file' });
    const firstProblem = within(report).getAllByRole('row')[1];
    expect(firstProblem).toHaveTextContent('3');
    expect(firstProblem).toHaveTextContent('Email');
    expect(firstProblem).toHaveTextContent('Email must be a valid email address');
  });

  it('lists the problems as a list on phones', async () => {
    setScreen('phone');
    vi.spyOn(api.excel, 'import').mockRejectedValue(
      new ApiError(422, 'The file has errors. Nothing was imported.', ROW_ERRORS),
    );
    const user = renderPage();
    await user.upload(screen.getByLabelText('Spreadsheet to import'), xlsx());

    await user.click(screen.getByRole('button', { name: 'Import employees' }));

    expect(await screen.findByText('Row 7 · Country')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('explains a file the server found too large', async () => {
    setScreen('desktop');
    vi.spyOn(api.excel, 'import').mockRejectedValue(new ApiError(413, 'File too large'));
    const user = renderPage();
    await user.upload(screen.getByLabelText('Spreadsheet to import'), xlsx());

    await user.click(screen.getByRole('button', { name: 'Import employees' }));

    expect(await screen.findByText(/larger than 1 MB. Split it into smaller files/)).toBeInTheDocument();
  });
});

describe('Export', () => {
  it('exports every employee to a dated .xlsx file', async () => {
    setScreen('desktop');
    const workbook = new Blob(['export']);
    const download = vi.spyOn(api.excel, 'download').mockResolvedValue(workbook);
    const user = renderPage();

    await user.click(screen.getByRole('button', { name: 'Export all employees' }));

    expect(download).toHaveBeenCalledWith(api.excel.exportUrl({}));
    expect(saveFile).toHaveBeenCalledWith(workbook, expect.stringMatching(/^employees-\d{4}-\d{2}-\d{2}\.xlsx$/));
  });

  it('says so when the export fails', async () => {
    setScreen('desktop');
    vi.spyOn(api.excel, 'download').mockRejectedValue(new ApiError(0, 'Cannot reach the server.'));
    const user = renderPage();

    await user.click(screen.getByRole('button', { name: 'Export all employees' }));

    expect(await screen.findByText(/The export could not be downloaded. Cannot reach the server./)).toBeInTheDocument();
    expect(saveFile).not.toHaveBeenCalled();
  });
});
