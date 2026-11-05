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

  offers: (direction?: OfferDirection, status?: OfferFilter, query = '', sort = 'newest', needsAction = false) =>
    direction ? (status ? (['offers', direction, status, query, sort, needsAction] as const) : (['offers', direction] as const)) : (['offers'] as const),
  conversations: (filter?: 'all' | 'completed') => (filter ? (['conversations', filter] as const) : (['conversations'] as const)),
  reviews: (userId: string) => ['reviews', userId] as const,
  directConversations: (view?: 'all' | 'unread' | 'archived') => (view ? (['directConversations', view] as const) : (['directConversations'] as const)),

  /** Address catalogue lists; `path` is one of `locationPaths`. */
  locations: (path: string) => ['locations', path] as const,

  leaderboard: ['leaderboard'] as const,

  blockedPeople: ['blockedPeople'] as const,
  messageReports: (status?: string) => (status ? (['messageReports', status] as const) : (['messageReports'] as const)),
  /** Staff data for Administration; all of it stays out of the saved cache. */
  access: ['access'] as const,
  accessUsers: (query: string) => ['access', 'users', query] as const,
  accessRoles: ['access', 'roles'] as const,
  accessPermissions: ['access', 'permissions'] as const,
  accessAudit: ['access', 'audit'] as const,
  activityEvents: (filters: string) => ['access', 'activityEvents', filters] as const,
  activityAccounts: (query: string) => ['access', 'activityAccounts', query] as const,
  activityReport: (report: string, range: string) => ['access', 'activityReport', report, range] as const,
  monitoring: (filters: string) => ['access', 'monitoring', filters] as const,

  notifications: ['notifications'] as const,
  notificationList: ['notifications', 'list'] as const,
  notificationCounts: ['notifications', 'counts'] as const,
};
