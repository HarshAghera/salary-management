import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { Alert, Button, Grid, Link, Stack, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { ImportCard } from './ImportCard';
import { useExportEmployees } from './queries';

function ExportCard() {
  const exporter = useExportEmployees();
  return (
    <SectionCard title="Export employees" description="Take the directory into Excel.">
      <Stack spacing={2.5}>
        <Typography variant="body2" color="text.secondary">
          Downloads every employee as an .xlsx file. It has the template&apos;s columns plus Currency, so you can edit
          it and import it back without reformatting.
        </Typography>
        <Button
          variant="contained"
          startIcon={<FileDownloadOutlinedIcon />}
          onClick={() => exporter.mutate({})}
          loading={exporter.isPending}
          sx={{ alignSelf: 'flex-start' }}
        >
          Export all employees
        </Button>
        {exporter.isError && (
          <Alert severity="error">The export could not be downloaded. {exporter.error.message}</Alert>
        )}
        <Typography variant="body2" color="text.secondary">
          Need only some employees? Search or filter the{' '}
          <Link component={RouterLink} to="/employees">
            employee directory
          </Link>
          , then choose Export there.
        </Typography>
      </Stack>
    </SectionCard>
  );
}

export function ImportExportPage() {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });

  return (
    <>
      <PageHeader
        title="Import & export"
        description="Move employee data between this app and Excel spreadsheets."
      />
      <Grid container spacing={{ xs: 2, md: 3 }} sx={{ alignItems: 'flex-start' }}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <ImportCard compact={isPhone} />
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <ExportCard />
        </Grid>
      </Grid>
    </>
  );
}
