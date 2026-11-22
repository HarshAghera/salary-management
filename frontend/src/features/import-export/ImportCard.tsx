import CloseIcon from '@mui/icons-material/Close';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import { Alert, AlertTitle, Box, Button, IconButton, Stack, Typography } from '@mui/material';
import { useId, useRef, useState, type DragEvent } from 'react';
import { Link as RouterLink } from 'react-router';
import { ApiError } from '../../api/client';
import { SectionCard } from '../../components/SectionCard';
import { formatCount } from '../../lib/format';
import { checkImportFile, formatFileSize } from './importFile';
import { ImportErrorReport } from './ImportErrorReport';
import { useDownloadTemplate, useImportEmployees } from './queries';

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <Stack direction="row" spacing={2} component="li">
      <Box
        aria-hidden
        sx={{
          width: 28,
          height: 28,
          flexShrink: 0,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          typography: 'caption',
          fontWeight: 700,
          color: 'primary.contrastText',
          bgcolor: 'primary.main',
        }}
      >
        {number}
      </Box>
      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Typography component="h3" variant="subtitle1" sx={{ lineHeight: '28px' }}>
          {title}
        </Typography>
        <Box sx={{ mt: 1 }}>{children}</Box>
      </Box>
    </Stack>
  );
}

/** Why an import failed, in the words HR needs; row problems are listed separately. */
function failureMessage(error: Error): string {
  if (error instanceof ApiError && error.status === 413) {
    return 'The file is larger than 1 MB. Split it into smaller files and import each one.';
  }
  return error.message;
}

export function ImportCard({ compact }: { compact: boolean }) {
  const template = useDownloadTemplate();
  const importer = useImportEmployees();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File>();
  const [fileProblem, setFileProblem] = useState<string>();
  const [dragging, setDragging] = useState(false);

  const choose = (chosen: File | undefined) => {
    importer.reset();
    if (!chosen) return;
    const problem = checkImportFile(chosen);
    setFileProblem(problem);
    setFile(problem ? undefined : chosen);
  };

  const clearFile = () => {
    setFile(undefined);
    setFileProblem(undefined);
    importer.reset();
    if (inputRef.current) inputRef.current.value = '';
  };

  const startImport = () => {
    if (!file) return;
    importer.mutate(file, {
      onSuccess: () => {
        setFile(undefined);
        if (inputRef.current) inputRef.current.value = '';
      },
    });
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    choose(event.dataTransfer.files[0]);
  };

  const rowErrors = importer.error instanceof ApiError ? importer.error.rowErrors : [];

  return (
    <SectionCard title="Import employees" description="Add new joiners and update salaries in bulk from a spreadsheet.">
      <Stack spacing={3}>
        <Box component="ul" sx={{ m: 0, pl: 2.5, color: 'text.secondary', typography: 'body2', display: 'grid', gap: 0.5 }}>
          <li>Rows are matched by email: new emails are added and existing employees are updated.</li>
          <li>If any row has a problem, nothing is imported and you get a list of what to fix.</li>
          <li>Up to 1,000 rows and 1 MB per .xlsx file. Importing never deletes anyone.</li>
        </Box>

        <Stack component="ol" spacing={3} sx={{ m: 0, p: 0, listStyle: 'none' }}>
          <Step number={1} title="Download the template">
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              It has the expected columns and a country list. An export from this app works too.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<FileDownloadOutlinedIcon />}
              onClick={() => template.mutate()}
              loading={template.isPending}
            >
              Download template
            </Button>
            {template.isError && (
              <Alert severity="error" sx={{ mt: 1.5 }}>
                The template could not be downloaded. {template.error.message}
              </Alert>
            )}
          </Step>

          <Step number={2} title="Choose your filled-in file">
            <Box
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              sx={{
                border: '2px dashed',
                borderColor: dragging ? 'primary.main' : 'divider',
                bgcolor: dragging ? 'action.hover' : 'transparent',
                borderRadius: 3,
                p: { xs: 2, sm: 3 },
                textAlign: 'center',
                transition: 'border-color 150ms, background-color 150ms',
              }}
            >
              <input
                ref={inputRef}
                id={inputId}
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                aria-label="Spreadsheet to import"
                hidden
                onChange={(event) => choose(event.target.files?.[0])}
              />
              {file ? (
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', textAlign: 'left' }}>
                  <DescriptionOutlinedIcon color="primary" />
                  <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                      {file.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize(file.size)}
                    </Typography>
                  </Box>
                  <IconButton aria-label={`Remove ${file.name}`} onClick={clearFile} disabled={importer.isPending}>
                    <CloseIcon />
                  </IconButton>
                </Stack>
              ) : (
                <Stack spacing={1} sx={{ alignItems: 'center' }}>
                  <UploadFileOutlinedIcon sx={{ fontSize: 36, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {compact ? 'Choose an .xlsx file' : 'Drag an .xlsx file here, or'}
                  </Typography>
                  <Button variant="outlined" component="label" htmlFor={inputId}>
                    Choose file
                  </Button>
                </Stack>
              )}
            </Box>
            {fileProblem && (
              <Alert severity="error" sx={{ mt: 1.5 }}>
                {fileProblem}
              </Alert>
            )}
          </Step>

          <Step number={3} title="Import">
            <Button
              variant="contained"
              startIcon={<UploadFileOutlinedIcon />}
              onClick={startImport}
              disabled={!file}
              loading={importer.isPending}
            >
              Import employees
            </Button>
          </Step>
        </Stack>

        <Box aria-live="polite">
          {importer.isSuccess && (
            <Alert
              severity="success"
              action={
                <Button color="inherit" component={RouterLink} to="/employees">
                  View employees
                </Button>
              }
            >
              <AlertTitle>Import complete</AlertTitle>
              {formatCount(importer.data.created)} added and {formatCount(importer.data.updated)} updated.
            </Alert>
          )}
          {importer.isError && (
            <Stack spacing={2}>
              <Alert severity="error">
                <AlertTitle>Nothing was imported</AlertTitle>
                {rowErrors.length > 0 ? 'The file has problems, listed below.' : failureMessage(importer.error)}
              </Alert>
              {rowErrors.length > 0 && <ImportErrorReport errors={rowErrors} compact={compact} />}
            </Stack>
          )}
        </Box>
      </Stack>
    </SectionCard>
  );
}
