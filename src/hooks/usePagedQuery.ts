import { useInfiniteQuery, type QueryKey } from '@tanstack/react-query';
import { useMemo } from 'react';

type Page = { total: number };

/**
 * Offset-paginated backend list (`limit`/`offset` + `total`).
 * `select` picks the rows out of each page; the next offset is the number loaded so far.
 */
export function usePagedQuery<P extends Page, T>(key: QueryKey, load: (offset: number) => Promise<P>, select: (page: P) => T[]) {
  const query = useInfiniteQuery({
    queryKey: key,
    queryFn: ({ pageParam }) => load(pageParam),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => {
      const loaded = pages.reduce((sum, page) => sum + select(page).length, 0);
      return select(last).length && loaded < last.total ? loaded : undefined;
    },
  });
  const rows = useMemo(() => query.data?.pages.flatMap(select) ?? [], [query.data, select]);
  return { ...query, rows, firstPage: query.data?.pages[0] };
}
