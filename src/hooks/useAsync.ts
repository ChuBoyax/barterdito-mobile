import { hashKey, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';

import { errorMessage } from '@/utils/format';

type AsyncState<T> = {
  data: T | undefined;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  reload: () => Promise<void>;
  setData: (updater: T | ((current: T | undefined) => T)) => void;
};

export function useAsync<T>(key: QueryKey, loader: () => Promise<T>): AsyncState<T> {
  const queryClient = useQueryClient();
 
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

  // Callers pass a fresh key array each render; depend on its hash so setData stays stable.
  const keyHash = hashKey(key);
  const keyRef = useRef(key);
  keyRef.current = key;
  const setData = useCallback(
    (updater: T | ((current: T | undefined) => T)) => {
      queryClient.setQueryData<T>(keyRef.current, (current) =>
        typeof updater === 'function' ? (updater as (value: T | undefined) => T)(current) : updater,
      );
    },
    // keyHash identifies the cache entry that keyRef points at.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient, keyHash],
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
