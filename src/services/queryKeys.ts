import type { ConnectionKind } from './userService';
import type { OfferDirection, OfferFilter } from '@/types/trades';

/**
 * Every React Query cache key for backend data lives here, so reads and
 * invalidations always agree. Prefix keys (e.g. `profiles`) invalidate a family.
 */
export const queryKeys = {
  item: (id: string) => ['item', id] as const,
  myItems: ['myItems'] as const,
  traderItems: (id: string) => ['traderItems', id] as const,

  profiles: ['profile'] as const,
  myProfile: ['profile', 'me'] as const,
  profile: (id: string) => ['profile', id] as const,
  connections: (kind?: ConnectionKind) => (kind ? (['connections', kind] as const) : (['connections'] as const)),

  offers: (direction?: OfferDirection, status?: OfferFilter) =>
    direction ? (status ? (['offers', direction, status] as const) : (['offers', direction] as const)) : (['offers'] as const),
  conversations: (filter?: 'all' | 'completed') => (filter ? (['conversations', filter] as const) : (['conversations'] as const)),
  reviews: (userId: string) => ['reviews', userId] as const,
  directConversations: ['directConversations'] as const,

  /** Address catalogue lists; `path` is one of `locationPaths`. */
  locations: (path: string) => ['locations', path] as const,

  leaderboard: ['leaderboard'] as const,

  notifications: ['notifications'] as const,
  notificationList: ['notifications', 'list'] as const,
  notificationCounts: ['notifications', 'counts'] as const,
};
