import { router } from 'expo-router';

import { queryClient } from '@/providers/queryClient';
import { queryKeys } from '@/services/queryKeys';
import type { Item } from '@/types/models';

/**
 * Opens a listing with the copy we already have, so the detail screen renders
 * immediately; it is marked stale so fresh data still loads in the background.
 */
export function openItem(item: Item) {
  const key = queryKeys.item(item.id);
  if (!queryClient.getQueryData(key)) queryClient.setQueryData(key, item, { updatedAt: 0 });
  router.push(`/items/${item.id}`);
}
