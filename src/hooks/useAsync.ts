import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react';

import { errorMessage } from '@/utils/format';

type AsyncState<T> = {
  data: T | undefined;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  setData: (updater: T | ((current: T | undefined) => T)) => void;
};

export function useAsync<T>(loader: () => Promise<T>, deps: DependencyList): AsyncState<T> {
  const [data, setDataState] = useState<T>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loaderRef = useRef(loader);

  useEffect(() => {
    loaderRef.current = loader;
  });

  const run = useCallback(async (isActive: () => boolean) => {
    try {
      const next = await loaderRef.current();
      if (!isActive()) return;
      setDataState(next);
      setError(null);
    } catch (caught) {
      if (isActive()) setError(errorMessage(caught));
    } finally {
      if (isActive()) setLoading(false);
    }
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    await run(() => true);
  }, [run]);

  useEffect(() => {
    let active = true;
    void run(() => active);
    return () => {
      active = false;
    };
  }, deps);

  const setData = useCallback((updater: T | ((current: T | undefined) => T)) => {
    setDataState((current) =>
      typeof updater === 'function' ? (updater as (value: T | undefined) => T)(current) : updater,
    );
  }, []);

  return { data, loading, error, reload, setData };
}
