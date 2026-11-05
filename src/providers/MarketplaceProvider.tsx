import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { itemService } from '@/services';
import { timeAgo, type FeedScope } from '@/services/itemService';
import { readJson, storageKeys, writeJson } from '@/utils/storage';
import type { Item, Place, Trader, User } from '@/types/models';
import { errorMessage } from '@/utils/format';
import { useAuth } from './AuthProvider';
import { useToast } from './ToastProvider';

type MarketplaceContextValue = {
  items: Item[];
  /** Up to five traders the backend ranks for the current area. */
  featuredTraders: Trader[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  /** Area the feed is loaded for (within NEARBY_RADIUS_KM); null means every location. */
  area: Place | null;
  /** The signed-in trader's saved profile area, when it has coordinates. */
  profileArea: Place | null;
  setArea: (place: Place | null) => void;
  savedIds: string[];
  /** When each saved item was saved (ISO time); items saved before this was recorded have none. */
  savedAt: Record<string, string>;
  heartedIds: string[];
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  toggleSaved: (id: string) => void;
  counts: LiveCounts;
  toggleHeart: (item: Pick<Item, 'id' | 'hearts'>) => void;
  recordView: (id: string) => void;
  upsertItem: (item: Item) => void;
  removeItem: (id: string) => void;
};

/** Listings loaded for one feed scope (`key`). */
type Feed = { key: string; items: Item[]; featured: Trader[]; fetched: number; total: number };

const MarketplaceContext = createContext<MarketplaceContextValue | null>(null);

type MarketplaceActions = Pick<MarketplaceContextValue, 'refresh' | 'toggleSaved' | 'toggleHeart' | 'recordView' | 'upsertItem' | 'removeItem'>;
type LiveCounts = Record<string, { hearts?: number; views?: number }>;
const MarketplaceActionsContext = createContext<MarketplaceActions | null>(null);
const noIds: string[] = [];
const noSavedAt: Record<string, string> = {};
const noTraders: Trader[] = [];

/** Like the website: the saved area centre, or the saved GPS pair when there is no centre. */
function profileAreaOf(user: User | null): Place | null {
  if (!user?.location) return null;
  const centre = user.locationLatitude != null && user.locationLongitude != null;
  const gps = user.gpsLatitude != null && user.gpsLongitude != null;
  if (!centre && !gps) return null;
  return {
    id: `profile-${user.id}`,
    label: user.location,
    latitude: centre ? user.locationLatitude! : user.gpsLatitude!,
    longitude: centre ? user.locationLongitude! : user.gpsLongitude!,
  };
}

function upsertInto(items: Item[], item: Item) {
  return items.some((entry) => entry.id === item.id) ? items.map((entry) => (entry.id === item.id ? item : entry)) : [item, ...items];
}

export function MarketplaceProvider({ children }: { children: ReactNode }) {
  const { user, requireAuth } = useAuth();
  const userId = user?.id ?? null;
  const showToast = useToast();
  const [feed, setFeed] = useState<Feed | null>(null);
  // The last feed saved on this device, shown instantly while its scope loads.
  const [snapshot, setSnapshot] = useState<Feed | null>(null);
  const [error, setError] = useState<{ key: string; message: string } | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [savedAt, setSavedAt] = useState<Record<string, string>>({});
  const [heartedIds, setHeartedIds] = useState<string[]>([]);
  // The latest totals from the backend: the feed and the detail screen load separate copies of a listing.
  const [counts, setCounts] = useState<LiveCounts>({});
  const pendingHearts = useRef(new Set<string>());
  const recordedViews = useRef(new Set<string>());
  // A place chosen in Filters; it belongs to the account that chose it.
  const [selection, setSelection] = useState<{ userId: string | null; place: Place | null } | null>(null);
  const request = useRef(0);

  // Browse defaults to the profile area; any other choice lasts until the account changes.
  const profileArea = useMemo(
    () => profileAreaOf(user),
    // Only the area fields matter; a name or photo change must not reload the feed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, user?.location, user?.locationLatitude, user?.locationLongitude, user?.gpsLatitude, user?.gpsLongitude],
  );
  const selected = selection && selection.userId === userId ? selection.place : profileArea;
  const area = selected && profileArea && selected.id === profileArea.id ? profileArea : selected;
  // Near the profile area with saved GPS: the backend uses the private coordinates itself.
  const nearMe = Boolean(area && area === profileArea && user?.gpsLatitude != null && user?.gpsLongitude != null);
  const scope = useMemo<FeedScope>(() => ({ area, nearMe }), [area, nearMe]);
  const scopeKey = nearMe ? `near:${user?.gpsLatitude}:${user?.gpsLongitude}` : area ? `area:${area.latitude}:${area.longitude}` : 'all';

  useEffect(() => {
    void readJson<Feed>(storageKeys.feed).then((saved) => {
      if (!saved?.items?.length || typeof saved.key !== 'string') return;
      setSnapshot({ ...saved, featured: saved.featured ?? [], items: saved.items.map((item) => (item.createdAt ? { ...item, age: timeAgo(item.createdAt) } : item)) });
    });
  }, []);

  const refresh = useCallback(async () => {
    const current = ++request.current;
    const key = scopeKey;
    try {
      const page = await itemService.getItems(0, scope);
      if (current !== request.current) return;
      const next: Feed = { key, items: page.items, featured: page.featuredTraders, fetched: page.items.length, total: page.total };
      setFeed(next);
      setError(null);
      void writeJson(storageKeys.feed, next);
    } catch (caught) {
      if (current !== request.current) return;
      const message = errorMessage(caught, 'Could not load listings');
      setError({ key, message });
      showToast(message);
    }
  }, [scope, scopeKey, showToast]);

  // Fresh data for this scope wins; until it arrives, a saved snapshot of the same scope shows.
  const live = feed?.key === scopeKey ? feed : null;
  const source = live ?? (snapshot?.key === scopeKey ? snapshot : null);

  const loadMore = useCallback(async () => {
    if (loadingMore || !live || live.fetched >= live.total) return;
    const { key, fetched } = live;
    setLoadingMore(true);
    try {
      const page = await itemService.getItems(fetched, scope);
      setFeed((current) =>
        current?.key === key
          ? {
              ...current,
              items: [...current.items, ...page.items.filter((item) => !current.items.some((entry) => entry.id === item.id))],
              fetched: current.fetched + page.items.length,
              total: page.total,
            }
          : current,
      );
    } catch (caught) {
      showToast(errorMessage(caught, 'Could not load more listings'));
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, live, scope, showToast]);

  // Reload whenever the account or the browsing area changes ("mine" flags follow the viewer).
  useEffect(() => {
    void refresh();
  }, [refresh, userId]);

  useEffect(() => {
    setSavedIds([]);
    setSavedAt({});
    setHeartedIds([]);
    setCounts({});
    if (!userId) return;
    let active = true;
    void itemService.getInteractions(userId).then((result) => {
      if (!active) return;
      setSavedIds(result.savedIds);
      setSavedAt(result.savedAt);
    });
    // Hearts still work if this fails; they just do not show as filled until the next load.
    void itemService.getHeartedIds().then((ids) => active && setHeartedIds(ids)).catch(() => undefined);
    return () => {
      active = false;
    };
  }, [userId]);

  const persist = useCallback(
    (nextSaved: string[], nextSavedAt: Record<string, string>) => {
      if (userId) void itemService.setInteractions(userId, { savedIds: nextSaved, savedAt: nextSavedAt });
    },
    [userId],
  );

  const savedRef = useRef(savedIds);
  const savedAtRef = useRef(savedAt);
  const heartedRef = useRef(heartedIds);
  useEffect(() => {
    savedRef.current = savedIds;
    savedAtRef.current = savedAt;
    heartedRef.current = heartedIds;
  }, [savedIds, savedAt, heartedIds]);

  const toggleSaved = useCallback(
    (id: string) =>
      requireAuth(() => {
        const wasSaved = savedRef.current.includes(id);
        const next = wasSaved ? savedRef.current.filter((entry) => entry !== id) : [...savedRef.current, id];
        const nextSavedAt = { ...savedAtRef.current };
        if (wasSaved) delete nextSavedAt[id];
        else nextSavedAt[id] = new Date().toISOString();
        savedRef.current = next;
        savedAtRef.current = nextSavedAt;
        setSavedIds(next);
        setSavedAt(nextSavedAt);
        persist(next, nextSavedAt);
      }),
    [requireAuth, persist],
  );

  const toggleHeart = useCallback(
    (item: Pick<Item, 'id' | 'hearts'>) =>
      requireAuth(() => {
        const { id } = item;
        // One request per listing at a time, so quick double taps cannot finish out of order.
        if (pendingHearts.current.has(id)) return;
        pendingHearts.current.add(id);
        const hearted = !heartedRef.current.includes(id);
        const mark = (value: boolean) => {
          heartedRef.current = value ? [...heartedRef.current, id] : heartedRef.current.filter((entry) => entry !== id);
          setHeartedIds(heartedRef.current);
        };
        const adjust = (change: number) =>
          setCounts((current) => ({ ...current, [id]: { ...current[id], hearts: Math.max(0, (current[id]?.hearts ?? item.hearts) + change) } }));
        mark(hearted);
        adjust(hearted ? 1 : -1);
        itemService
          .setHeart(id, hearted)
          .then((hearts) => setCounts((current) => ({ ...current, [id]: { ...current[id], hearts } })))
          .catch((caught) => {
            mark(!hearted);
            adjust(hearted ? -1 : 1);
            showToast(errorMessage(caught, 'Could not update your heart. Please try again.'));
          })
          .finally(() => pendingHearts.current.delete(id));
      }),
    [requireAuth, showToast],
  );

  const recordView = useCallback(
    (id: string) => {
      const key = `${userId}:${id}`;
      if (!userId || recordedViews.current.has(key)) return;
      recordedViews.current.add(key);
      itemService
        .recordView(id)
        .then((views) => setCounts((current) => ({ ...current, [id]: { ...current[id], views } })))
        // A missed view never interrupts browsing.
        .catch(() => recordedViews.current.delete(key));
    },
    [userId],
  );

  const upsertItem = useCallback((item: Item) => {
    setFeed((current) => current && { ...current, items: upsertInto(current.items, item) });
    setSnapshot((current) => current && { ...current, items: upsertInto(current.items, item) });
  }, []);

  const removeItem = useCallback((id: string) => {
    setFeed((current) => current && { ...current, items: current.items.filter((entry) => entry.id !== id) });
    setSnapshot((current) => current && { ...current, items: current.items.filter((entry) => entry.id !== id) });
  }, []);

  const setArea = useCallback((place: Place | null) => setSelection({ userId, place }), [userId]);

  const loaded = source?.items;
  const items = useMemo(
    () =>
      (loaded ?? []).map((item) => {
        const live = counts[item.id];
        const mine = Boolean(userId) && item.userId === userId;
        return live || mine !== Boolean(item.mine) ? { ...item, mine, hearts: live?.hearts ?? item.hearts, views: live?.views ?? item.views } : item;
      }),
    [loaded, counts, userId],
  );

  const scopeError = error?.key === scopeKey ? error.message : null;

  const value = useMemo(
    () => ({
      items,
      featuredTraders: source?.featured ?? noTraders,
      loading: !source && !scopeError,
      loadingMore,
      error: scopeError,
      hasMore: Boolean(live && live.fetched < live.total),
      area,
      profileArea,
      setArea,
      savedIds: userId ? savedIds : noIds,
      savedAt: userId ? savedAt : noSavedAt,
      heartedIds: userId ? heartedIds : noIds,
      counts,
      refresh,
      loadMore,
      toggleSaved,
      toggleHeart,
      recordView,
      upsertItem,
      removeItem,
    }),
    [items, source, live, scopeError, loadingMore, area, profileArea, setArea, userId, savedIds, savedAt, heartedIds, counts, recordView, refresh, loadMore, toggleSaved, toggleHeart, upsertItem, removeItem],
  );

  // Stable callbacks only: screens that just trigger updates do not re-render when the feed changes.
  const actions = useMemo(
    () => ({ refresh, toggleSaved, toggleHeart, recordView, upsertItem, removeItem }),
    [refresh, toggleSaved, toggleHeart, recordView, upsertItem, removeItem],
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
