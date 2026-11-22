import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../../api/client';
import type { DirectoryFilters, DirectoryParams, Employee, EmployeeInput } from '../../api/types';
import { insightKeys } from '../insights/queries';

/** Every key starts with "employees", so one invalidation refreshes lists, feeds and filter options. */
export const employeeKeys = {
  all: ['employees'] as const,
  page: (params: DirectoryParams) => ['employees', 'page', params] as const,
  feed: (filters: DirectoryFilters, pageSize: number) => ['employees', 'feed', filters, pageSize] as const,
  filterOptions: ['employees', 'filter-options'] as const,
};

/** One page of the directory for the data grid. The previous page stays on screen while the next loads. */
export function useEmployeePage(params: DirectoryParams, enabled: boolean) {
  return useQuery({
    queryKey: employeeKeys.page(params),
    queryFn: () => api.employees.list(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

/** The phone card list: pages are appended as the user asks for more. */
export function useEmployeeFeed(filters: DirectoryFilters, pageSize: number, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: employeeKeys.feed(filters, pageSize),
    queryFn: ({ pageParam }) => api.employees.list({ ...filters, page: pageParam, pageSize }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page * last.pageSize < last.total ? last.page + 1 : undefined),
    enabled,
  });
}

export function useFilterOptions() {
  return useQuery({
    queryKey: employeeKeys.filterOptions,
    queryFn: api.employees.filterOptions,
    // Countries never change at run time; departments and job titles change only through saves, which invalidate.
    staleTime: 5 * 60_000,
  });
}

/** After any change to employees, the directory and the salary insights are both out of date. */
export function useRefreshAfterEmployeeChange() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: employeeKeys.all }),
      queryClient.invalidateQueries({ queryKey: insightKeys.all }),
    ]);
}

/** The employee was deleted elsewhere (another tab, another person) after this screen loaded. */
export function isEmployeeGone(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

/** Creates an employee, or updates one when an id is given. */
export function useSaveEmployee() {
  const refresh = useRefreshAfterEmployeeChange();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: EmployeeInput }): Promise<Employee> =>
      id ? api.employees.update(id, input) : api.employees.create(input),
    onSuccess: refresh,
    // A record that has gone should disappear from the list too.
    onError: (error) => (isEmployeeGone(error) ? refresh() : undefined),
  });
}

export function useDeleteEmployee() {
  const refresh = useRefreshAfterEmployeeChange();
  return useMutation({
    mutationFn: (id: string) => api.employees.remove(id),
    onSuccess: refresh,
    onError: (error) => (isEmployeeGone(error) ? refresh() : undefined),
  });
}
