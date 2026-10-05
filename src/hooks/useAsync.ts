import { useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

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

  const setData = useCallback(
    (updater: T | ((current: T | undefined) => T)) => {
      queryClient.setQueryData<T>(key, (current) =>
        typeof updater === 'function' ? (updater as (value: T | undefined) => T)(current) : updater,
      );
    },
   
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
