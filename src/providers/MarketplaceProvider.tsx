import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { itemService } from '@/services';
import { timeAgo } from '@/services/itemService';
import { readJson, storageKeys, writeJson } from '@/utils/storage';
import type { Item } from '@/types/models';
import { errorMessage } from '@/utils/format';
import { useAuth } from './AuthProvider';
import { useToast } from './ToastProvider';

type MarketplaceContextValue = {
  items: Item[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  savedIds: string[];
  heartedIds: string[];
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  toggleSaved: (id: string) => void;
  toggleHeart: (id: string) => void;
  upsertItem: (item: Item) => void;
  removeItem: (id: string) => void;
};

type FeedSnapshot = { items: Item[]; total: number };

const MarketplaceContext = createContext<MarketplaceContextValue | null>(null);

type MarketplaceActions = Pick<MarketplaceContextValue, 'refresh' | 'toggleSaved' | 'toggleHeart' | 'upsertItem' | 'removeItem'>;
const MarketplaceActionsContext = createContext<MarketplaceActions | null>(null);
const noIds: string[] = [];

export function MarketplaceProvider({ children }: { children: ReactNode }) {
  const { user, requireAuth } = useAuth();
  const userId = user?.id ?? null;
  const showToast = useToast();
  const [loaded, setLoaded] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  // How many listings came from the server; the next page starts here.
  const [fetched, setFetched] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [heartedIds, setHeartedIds] = useState<string[]>([]);
  // Local heart adjustments; the backend has no heart endpoint yet (same as the website).
  const [heartDelta, setHeartDelta] = useState<Record<string, number>>({});
  const request = useRef(0);
  // True once the network answered, so a late cache read never replaces fresh data.
  const settled = useRef(false);

  // Instant first paint: show the last saved first page while the network request runs.
  useEffect(() => {
    void readJson<FeedSnapshot>(storageKeys.feed).then((snapshot) => {
      if (!snapshot?.items.length || settled.current) return;
      setLoaded(snapshot.items.map((item) => (item.createdAt ? { ...item, age: timeAgo(item.createdAt) } : item)));
      setFetched(snapshot.items.length);
      setTotal(snapshot.total);
      setLoading(false);
    });
  }, []);

  const refresh = useCallback(async () => {
    const current = ++request.current;
    try {
      const page = await itemService.getItems(0);
      if (current !== request.current) return;
      settled.current = true;
      setLoaded(page.items);
      setFetched(page.items.length);
      setTotal(page.total);
      setError(null);
      void writeJson(storageKeys.feed, { items: page.items, total: page.total } satisfies FeedSnapshot);
    } catch (caught) {
      if (current !== request.current) return;
      const message = errorMessage(caught, 'Could not load listings');
      setError(message);
      showToast(message);
    } finally {
      if (current === request.current) setLoading(false);
    }
  }, [showToast]);

  const loadMore = useCallback(async () => {
    if (loadingMore || fetched >= total) return;
    setLoadingMore(true);
    try {
      const page = await itemService.getItems(fetched);
      setLoaded((current) => [...current, ...page.items.filter((item) => !current.some((entry) => entry.id === item.id))]);
      setFetched((count) => count + page.items.length);
      setTotal(page.total);
    } catch (caught) {
      showToast(errorMessage(caught, 'Could not load more listings'));
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, fetched, total, showToast]);

  // Reload whenever the account changes so "mine" flags match the viewer.
  useEffect(() => {
    void refresh();
  }, [refresh, userId]);

  useEffect(() => {
    setSavedIds([]);
    setHeartedIds([]);
    setHeartDelta({});
    if (!userId) return;
    let active = true;
    void itemService.getInteractions(userId).then((result) => {
      if (!active) return;
      setSavedIds(result.savedIds);
      setHeartedIds(result.heartedIds);
    });
    return () => {
      active = false;
    };
  }, [userId]);

  const persist = useCallback(
    (nextSaved: string[], nextHearted: string[]) => {
      if (userId) void itemService.setInteractions(userId, { savedIds: nextSaved, heartedIds: nextHearted });
    },
    [userId],
  );

  const savedRef = useRef(savedIds);
  const heartedRef = useRef(heartedIds);
  useEffect(() => {
    savedRef.current = savedIds;
    heartedRef.current = heartedIds;
  }, [savedIds, heartedIds]);

  const toggleSaved = useCallback(
    (id: string) =>
      requireAuth(() => {
        const wasSaved = savedRef.current.includes(id);
        const next = wasSaved ? savedRef.current.filter((entry) => entry !== id) : [...savedRef.current, id];
        savedRef.current = next;
        setSavedIds(next);
        persist(next, heartedRef.current);
      }),
    [requireAuth, persist],
  );

  const toggleHeart = useCallback(
    (id: string) =>
      requireAuth(() => {
        const wasHearted = heartedRef.current.includes(id);
        const next = wasHearted ? heartedRef.current.filter((entry) => entry !== id) : [...heartedRef.current, id];
        heartedRef.current = next;
        setHeartedIds(next);
        setHeartDelta((current) => ({ ...current, [id]: (current[id] ?? 0) + (wasHearted ? -1 : 1) }));
        persist(savedRef.current, next);
        showToast(wasHearted ? 'Heart removed' : 'You hearted this item');
      }),
    [requireAuth, persist, showToast],
  );

  const upsertItem = useCallback((item: Item) => {
    setLoaded((current) =>
      current.some((entry) => entry.id === item.id) ? current.map((entry) => (entry.id === item.id ? item : entry)) : [item, ...current],
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setLoaded((current) => current.filter((entry) => entry.id !== id));
  }, []);

  const items = useMemo(
    () =>
      loaded.map((item) => {
        const delta = heartDelta[item.id] ?? 0;
        const mine = Boolean(userId) && item.userId === userId;
        return delta || mine !== Boolean(item.mine) ? { ...item, mine, hearts: Math.max(0, item.hearts + delta) } : item;
      }),
    [loaded, heartDelta, userId],
  );

  const value = useMemo(
    () => ({
      items,
      loading,
      loadingMore,
      error,
      hasMore: fetched < total,
      savedIds: userId ? savedIds : noIds,
      heartedIds: userId ? heartedIds : noIds,
      refresh,
      loadMore,
      toggleSaved,
      toggleHeart,
      upsertItem,
      removeItem,
    }),
    [items, loading, loadingMore, error, fetched, total, userId, savedIds, heartedIds, refresh, loadMore, toggleSaved, toggleHeart, upsertItem, removeItem],
  );

  // Stable callbacks only: screens that just trigger updates do not re-render when the feed changes.
  const actions = useMemo(
    () => ({ refresh, toggleSaved, toggleHeart, upsertItem, removeItem }),
    [refresh, toggleSaved, toggleHeart, upsertItem, removeItem],
  );

  return (
    <MarketplaceActionsContext.Provider value={actions}>
      <MarketplaceContext.Provider value={value}>{children}</MarketplaceContext.Provider>
    </MarketplaceActionsContext.Provider>
  );
}

export function useMarketplace() {
  const context = useContext(MarketplaceContext);
  if (!context) throw new Error('useMarketplace must be used inside MarketplaceProvider');
  return context;
}

export function useMarketplaceActions() {
  const context = useContext(MarketplaceActionsContext);
  if (!context) throw new Error('useMarketplaceActions must be used inside MarketplaceProvider');
  return context;
}
