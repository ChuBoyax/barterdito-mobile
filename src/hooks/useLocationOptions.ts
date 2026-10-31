import { useQuery } from '@tanstack/react-query';

import { locationService } from '@/services';
import { queryKeys } from '@/services/queryKeys';
import type { LocationOption } from '@/types/models';
import { errorMessage } from '@/utils/format';

const noOptions: LocationOption[] = [];

/** One address-catalogue list; `null` waits for the parent selection. The catalogue is static. */
export function useLocationOptions(path: string | null) {
  const query = useQuery({
    queryKey: queryKeys.locations(path ?? ''),
    queryFn: () => locationService.options(path!),
    enabled: path !== null,
    staleTime: Infinity,
    gcTime: 60 * 60_000,
    // Some lists hold hundreds of places; keep them out of the saved cache.
    meta: { persist: false },
  });
  return {
    options: query.data ?? noOptions,
    loading: path !== null && query.isPending,
    error: query.error ? errorMessage(query.error, 'Could not load places.') : null,
    retry: () => void query.refetch(),
  };
}
