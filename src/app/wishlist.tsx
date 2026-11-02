import { useQueries } from '@tanstack/react-query';
import { router, useFocusEffect } from 'expo-router';
import { Bookmark, Compass } from 'lucide-react-native';
import { useCallback, useState } from 'react';

import { RequireAuth } from '@/components/layout';
import { ItemGrid } from '@/components/marketplace';
import { EmptyState, Screen } from '@/components/ui';
import { useMarketplace } from '@/providers';
import { itemService } from '@/services';
import { timeAgo } from '@/services/itemService';
import { queryKeys } from '@/services/queryKeys';
import type { Item } from '@/types/models';

export default function WishlistScreen() {
  return (
    <RequireAuth>
      <WishlistContent />
    </RequireAuth>
  );
}

/** Items saved before save times were recorded have no time to show. */
function savedLabel(at: string | undefined, now: number) {
  if (!at) return 'Saved';
  return now - new Date(at).getTime() < 60_000 ? 'Saved just now' : `Saved ${timeAgo(at)}`;
}

function WishlistContent() {
  const { items, savedIds, savedAt } = useMarketplace();
  // Refreshes the labels on returning to this screen, which stays mounted behind others.
  const [now, setNow] = useState(() => Date.now());
  useFocusEffect(useCallback(() => setNow(Date.now()), []));
  // The feed only holds the browsing area; load saved items from elsewhere one by one.
  const missing = savedIds.filter((id) => !items.some((item) => item.id === id));
  const others = useQueries({
    queries: missing.map((id) => ({ queryKey: queryKeys.item(id), queryFn: () => itemService.getItem(id), retry: false })),
  });
  const saved = [
    ...items.filter((item) => savedIds.includes(item.id)),
    // Deleted listings fail to load and are simply left out.
    ...others.map((result) => result.data).filter((item): item is Item => Boolean(item)),
  ];
  const loading = others.some((result) => result.isPending);
  return (
    <Screen>
      {saved.length || loading ? (
        <ItemGrid items={saved} loading={loading && !saved.length} ageLabel={(item) => savedLabel(savedAt[item.id], now)} />
      ) : (
        <EmptyState
          icon={Bookmark}
          title="Your wishlist is ready"
          text="Save interesting items while you browse and compare them here."
          action="Browse items"
          actionIcon={Compass}
          onAction={() => router.navigate('/')}
        />
      )}
    </Screen>
  );
}
