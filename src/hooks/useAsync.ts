import { useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { errorMessage } from '@/utils/format';

type AsyncState<T> = {
  data: T | undefined;
  /** True only on the first load, while there is nothing to show yet (render a skeleton). */
  loading: boolean;
  /** True during a user-triggered pull-to-refresh. Background refreshes stay silent. */
  refreshing: boolean;
  error: string | null;
  reload: () => Promise<void>;
  /** Updates the cached value (e.g. after a mutation) so every screen using the same key stays in sync. */
  setData: (updater: T | ((current: T | undefined) => T)) => void;
};

/**
 * Cached data loading.
 *
 *   const { data, loading } = useAsync(['trader', id], () => userService.getTrader(id));
 *
 * The key identifies the data: screens that use the same key share one cache entry,
 * and revisiting a screen shows the cached value instantly while it refreshes in the background.
 */
export function useAsync<T>(key: QueryKey, loader: () => Promise<T>): AsyncState<T> {
  const queryClient = useQueryClient();
  // TanStack Query rejects `undefined` results (e.g. "thread not found"), so store those as null.
  const query = useQuery({ queryKey: key, queryFn: async () => ((await loader()) ?? null) as T });
  const [refreshing, setRefreshing] = useState(false);
  const { refetch } = query;

  const reload = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const setData = useCallback(
    (updater: T | ((current: T | undefined) => T)) => {
      queryClient.setQueryData<T>(key, (current) =>
        typeof updater === 'function' ? (updater as (value: T | undefined) => T)(current) : updater,
      );
    },
    // The key's contents identify the entry; a new array with the same values must not change setData.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient, JSON.stringify(key)],
  );

  return {
    data: query.data ?? undefined,
    loading: query.isPending,
    refreshing,
    error: query.error ? errorMessage(query.error) : null,
    reload,
    setData,
  };
}
