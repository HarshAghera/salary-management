import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';

/** Every key starts with "insights", so a change to employees can refresh them all at once. */
export const insightKeys = {
  all: ['insights'] as const,
  overview: ['insights', 'overview'] as const,
  countries: ['insights', 'countries'] as const,
  jobTitles: (countryCode: string) => ['insights', 'job-titles', countryCode] as const,
};

export function useOverview() {
  return useQuery({ queryKey: insightKeys.overview, queryFn: api.insights.overview });
}

export function useCountrySummaries() {
  return useQuery({ queryKey: insightKeys.countries, queryFn: api.insights.countries });
}

export function useJobTitles(countryCode: string | undefined) {
  return useQuery({
    queryKey: insightKeys.jobTitles(countryCode ?? ''),
    queryFn: () => api.insights.jobTitles(countryCode ?? ''),
    enabled: Boolean(countryCode),
  });
}
