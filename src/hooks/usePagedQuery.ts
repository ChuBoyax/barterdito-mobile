import { useInfiniteQuery, type QueryKey } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

type Page = { total: number };

/**
 * Offset-paginated backend list (`limit`/`offset` + `total`).
 * `select` picks the rows out of each page; the next offset is the number loaded so far.
 * `persist: false` keeps private lists (staff data, blocks) out of the cache saved on the device.
 *
 * A background `poll` re-renders only when the data really changed, and only `refresh`
 * (a pull by the user) turns on `refreshing`.
 */
export function usePagedQuery<P extends Page, T>(key: QueryKey, load: (offset: number) => Promise<P>, select: (page: P) => T[], { persist = true } = {}) {
  const query = useInfiniteQuery({
    queryKey: key,
    meta: { persist },
    notifyOnChangeProps: ['data', 'error', 'status', 'hasNextPage', 'isFetchingNextPage'],
    queryFn: ({ pageParam }) => load(pageParam),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => {
      const loaded = pages.reduce((sum, page) => sum + select(page).length, 0);
      return select(last).length && loaded < last.total ? loaded : undefined;
    },
  });
  const { data, refetch } = query;
  const rows = useMemo(() => data?.pages.flatMap(select) ?? [], [data, select]);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);
  // Joins a fetch already in flight instead of cancelling it.
  const poll = useCallback(() => void refetch({ cancelRefetch: false }), [refetch]);

  return {
    rows,
    firstPage: data?.pages[0],
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch,
    refresh,
    refreshing,
    poll,
  };
}
