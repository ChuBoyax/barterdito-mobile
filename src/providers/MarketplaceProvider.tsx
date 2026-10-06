import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { itemService } from '@/services';
import type { Item } from '@/types/models';
import { useAuth } from './AuthProvider';
import { useToast } from './ToastProvider';

type MarketplaceContextValue = {
  items: Item[];
  loading: boolean;
  savedIds: string[];
  heartedIds: string[];
  refresh: () => Promise<void>;
  toggleSaved: (id: string) => void;
  toggleHeart: (id: string) => void;
  upsertItem: (item: Item) => void;
  removeItem: (id: string) => void;
};

const MarketplaceContext = createContext<MarketplaceContextValue | null>(null);
const noIds: string[] = [];


export function MarketplaceProvider({ children }: { children: ReactNode }) {
  const { authenticated, requireAuth } = useAuth();
  const showToast = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [heartedIds, setHeartedIds] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    try {
      setItems(await itemService.getItems());
    } catch {
      showToast('Could not refresh listings');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    let active = true;
    itemService
      .getItems()
      .then((next) => active && setItems(next))
      .catch(() => showToast('Could not refresh listings'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [showToast]);

  useEffect(() => {
    if (!authenticated) return;
    let active = true;
    void itemService.getInteractions().then((result) => {
      if (!active) return;
      setSavedIds(result.savedIds);
      setHeartedIds(result.heartedIds);
    });
    return () => {
      active = false;
    };
  }, [authenticated]);

  // Read the latest ids through refs so the toggles keep a stable identity and memoized cards don't all re-render.
  const savedRef = useRef(savedIds);
  const heartedRef = useRef(heartedIds);
  useEffect(() => {
    savedRef.current = savedIds;
    heartedRef.current = heartedIds;
  }, [savedIds, heartedIds]);

  const toggleSaved = useCallback(
    (id: string) =>
      requireAuth(() => {
        const savedIds = savedRef.current;
        const wasSaved = savedIds.includes(id);
        setSavedIds((current) => (wasSaved ? current.filter((entry) => entry !== id) : [...current, id]));
        itemService
          .setSaved(id, !wasSaved)
          .then(() => showToast(wasSaved ? 'Removed from wishlist' : 'Saved to your wishlist'))
          .catch(() => {
            setSavedIds(savedIds);
            showToast('Could not update your wishlist');
          });
      }),
    [requireAuth, showToast],
  );

  const toggleHeart = useCallback(
    (id: string) =>
      requireAuth(() => {
        const heartedIds = heartedRef.current;
        const wasHearted = heartedIds.includes(id);
        const delta = wasHearted ? -1 : 1;
        setHeartedIds((current) => (wasHearted ? current.filter((entry) => entry !== id) : [...current, id]));
        setItems((current) =>
          current.map((item) => (item.id === id ? { ...item, hearts: Math.max(0, item.hearts + delta) } : item)),
        );
        itemService
          .setHeart(id, !wasHearted)
          .then(() => showToast(wasHearted ? 'Heart removed' : 'You hearted this item'))
          .catch(() => {
            setHeartedIds(heartedIds);
            setItems((current) =>
              current.map((item) => (item.id === id ? { ...item, hearts: Math.max(0, item.hearts - delta) } : item)),
            );
            showToast('Could not update this reaction');
          });
      }),
    [requireAuth, showToast],
  );

  const upsertItem = useCallback((item: Item) => {
    setItems((current) => [item, ...current.filter((entry) => entry.id !== item.id)]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((current) => current.filter((entry) => entry.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      items,
      loading,
      savedIds: authenticated ? savedIds : noIds,
      heartedIds: authenticated ? heartedIds : noIds,
      refresh,
      toggleSaved,
      toggleHeart,
      upsertItem,
      removeItem,
    }),
    [items, loading, authenticated, savedIds, heartedIds, refresh, toggleSaved, toggleHeart, upsertItem, removeItem],
  );

  return <MarketplaceContext.Provider value={value}>{children}</MarketplaceContext.Provider>;
}

export function useMarketplace() {
  const context = useContext(MarketplaceContext);
  if (!context) throw new Error('useMarketplace must be used inside MarketplaceProvider');
  return context;
}
