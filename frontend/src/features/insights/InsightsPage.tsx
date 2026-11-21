import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import { Box, Grid, MenuItem, Skeleton, Stack, TextField, Typography } from '@mui/material';
import { useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router';
import type { Overview } from '../../api/types';
import { BarList } from '../../components/BarList';
import { LoadError } from '../../components/LoadError';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { StatTile } from '../../components/StatTile';
import { formatCount } from '../../lib/format';
import { CountrySummaryTable } from './CountrySummaryTable';
import { JobTitleTable } from './JobTitleTable';
import { useCountrySummaries, useJobTitles, useOverview } from './queries';

function SkeletonRows({ count = 5, height = 28 }: { count?: number; height?: number }) {
  return (
    <Stack spacing={1.5} aria-label="Loading">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} variant="rounded" height={height} />
      ))}
    </Stack>
  );
}

function largest(items: { label: string; headcount: number }[]): string | undefined {
  const top = items[0];
  return top && `Largest: ${top.label} (${formatCount(top.headcount)})`;
}

function OverviewSection() {
  const overview = useOverview();
  const data: Overview | undefined = overview.data;

  if (overview.isError) {
    return <LoadError what="the headcount overview" error={overview.error} onRetry={() => void overview.refetch()} />;
  }

  const byCountry = (data?.byCountry ?? []).map((row) => ({
    key: row.countryCode,
    label: row.countryName,
    value: row.headcount,
    valueLabel: formatCount(row.headcount),
  }));
  const byDepartment = (data?.byDepartment ?? []).map((row) => ({
    key: row.department,
    label: row.department,
    value: row.headcount,
    valueLabel: formatCount(row.headcount),
  }));

  return (
    <Grid container spacing={{ xs: 2, md: 3 }}>
      <Grid size={{ xs: 12, sm: 4 }}>
        <StatTile
          label="Employees"
          value={data && formatCount(data.totalHeadcount)}
          detail="Across the whole organization"
          icon={<GroupsOutlinedIcon />}
          accent="primary"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <StatTile
          label="Countries"
          value={data && formatCount(data.byCountry.length)}
          detail={data && largest(byCountry.map((row) => ({ label: row.label, headcount: row.value })))}
          icon={<PublicOutlinedIcon />}
          accent="secondary"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <StatTile
          label="Departments"
          value={data && formatCount(data.byDepartment.length)}
          detail={data && largest(byDepartment.map((row) => ({ label: row.label, headcount: row.value })))}
          icon={<ApartmentOutlinedIcon />}
          accent="primary"
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <SectionCard title="Headcount by country" description="Employees per country, largest first">
          {data ? <BarList items={byCountry} label="Headcount by country" /> : <SkeletonRows />}
        </SectionCard>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <SectionCard title="Headcount by department" description="Employees per department, largest first">
          {data ? <BarList items={byDepartment} label="Headcount by department" /> : <SkeletonRows />}
        </SectionCard>
      </Grid>
    </Grid>
  );
}

export function InsightsPage() {
  const countries = useCountrySummaries();
  const [params, setParams] = useSearchParams();
  const breakdownRef = useRef<HTMLDivElement>(null);

  // Largest country first, matching the headcount chart above.
  const summaries = useMemo(
    () => [...(countries.data ?? [])].sort((a, b) => b.headcount - a.headcount),
    [countries.data],
  );
  // The country in the address if it has employees, otherwise the largest one.
  const requested = params.get('country');
  const selected = summaries.find((row) => row.countryCode === requested)?.countryCode ?? summaries[0]?.countryCode;
  const jobTitles = useJobTitles(selected);

  /** Choosing a country is a step Back can undo, like the directory's filters (ADR-12). */
  const selectCountry = (countryCode: string, { scroll = false } = {}) => {
    setParams((current) => {
      const next = new URLSearchParams(current);
      next.set('country', countryCode);
      return next;
    });
    if (scroll) {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      breakdownRef.current?.scrollIntoView?.({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }
  };

  const countryPicker = summaries.length > 0 && selected && (
    <TextField
      select
      label="Country"
      value={selected}
      onChange={(event) => selectCountry(event.target.value)}
      sx={{ minWidth: { xs: '100%', sm: 220 } }}
    >
      {summaries.map((row) => (
        <MenuItem key={row.countryCode} value={row.countryCode}>
          {row.countryName}
        </MenuItem>
      ))}
    </TextField>
  );

  return (
    <>
      <PageHeader title="Salary insights" description="How ACME pays people, by country and job title." />

      <Stack spacing={{ xs: 2, md: 3 }}>
        <OverviewSection />

        <SectionCard
          title="Salaries by country"
          description="In each country's own currency. Choose a country to see its job titles."
          flush
        >
          {countries.isError ? (
            <Box sx={{ px: { xs: 2, sm: 3 }, pb: 3 }}>
              <LoadError what="the salary summary" error={countries.error} onRetry={() => void countries.refetch()} />
            </Box>
          ) : countries.isPending ? (
            <Box sx={{ px: { xs: 2, sm: 3 }, pb: 3 }}>
              <SkeletonRows count={6} height={40} />
            </Box>
          ) : summaries.length === 0 ? (
            <Typography color="text.secondary" sx={{ px: { xs: 2, sm: 3 }, pb: 3 }}>
              There are no employees yet, so there are no salaries to summarize.
            </Typography>
          ) : (
            <CountrySummaryTable
              rows={summaries}
              selected={selected}
              onSelect={(code) => selectCountry(code, { scroll: true })}
            />
          )}
        </SectionCard>

        {selected && (
          <Box ref={breakdownRef} sx={{ scrollMarginTop: { xs: 72, lg: 88 } }}>
            <SectionCard
              title="Salaries by job title"
              description={
                jobTitles.data
                  ? `${jobTitles.data.countryName}, in ${jobTitles.data.currency}. Highest average first.`
                  : 'Highest average first.'
              }
              action={countryPicker}
              flush
            >
              {jobTitles.isError ? (
                <Box sx={{ px: { xs: 2, sm: 3 }, pb: 3 }}>
                  <LoadError what="the job titles" error={jobTitles.error} onRetry={() => void jobTitles.refetch()} />
                </Box>
              ) : jobTitles.data ? (
                <JobTitleTable data={jobTitles.data} />
              ) : (
                <Box sx={{ px: { xs: 2, sm: 3 }, pb: 3 }}>
                  <SkeletonRows count={6} height={40} />
                </Box>
              )}
            </SectionCard>
          </Box>
        )}
      </Stack>
    </>
  );
}
