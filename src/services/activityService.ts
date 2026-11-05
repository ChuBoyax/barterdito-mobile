import { apiRequest, authenticatedRequest } from './api';

/** Staff activity reports (`/activity/*`). The backend checks the permission on every request. */

export type ActivitySource = 'backend' | 'browser';
export type ActivityCursor = { time: string; id: string; source: ActivitySource };
export type ActivityEvent = {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  actor_kind: 'authenticated' | 'anonymous' | 'system';
  event_name: string;
  feature: string;
  source: ActivitySource;
  target_type: string | null;
  target_id: string | null;
  page: string | null;
  received_at: string;
};
export type ActivityPage = { events: ActivityEvent[]; next_cursor: ActivityCursor | null };
export type ActivityAccount = { id: string; full_name: string; is_active: boolean };
export type AccountSummary = { account: ActivityAccount; counts: { backend: number; browser: number } };
export type AnalyticsReport = {
  totals: { backend_actions: number; browser_interactions: number; active_accounts: number; page_views: number; completed_trades: number; guest_sessions: number };
  daily: { day: string; backend: number; browser: number }[];
  features: { feature: string; source: ActivitySource; count: number; accounts: number }[];
  actions: { event_name: string; source: ActivitySource; count: number }[];
  pages: { page: string; count: number }[];
};
export type FunnelReport = { definition: string; stages: { key: string; label: string; count: number; conversion: number; drop_off: number }[] };
export type MonitoringGroup = {
  fingerprint: string;
  source: ActivitySource;
  event_name: string;
  page: string;
  status_code: number;
  count: number;
  recent_count: number;
  first_seen: string;
  last_seen: string;
  status: 'open' | 'acknowledged' | 'resolved';
  alert: boolean;
};
export type MonitoringPage = { groups: MonitoringGroup[]; total: number; attention_groups: number };

const get = <T>(path: string, params: Record<string, string | number | undefined>) => {
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join('&');
  return authenticatedRequest(() => apiRequest<T>(`/activity/${path}${query ? `?${query}` : ''}`));
};

/** The start of a report window, as the timezone-aware value the backend requires. */
export const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

export const activityService = {
  getEvents(filters: { source?: string; actorId?: string; since: string }, cursor?: ActivityCursor | null): Promise<ActivityPage> {
    return get('events', {
      source: filters.source,
      actor_id: filters.actorId,
      since: filters.since,
      limit: 25,
      cursor_time: cursor?.time,
      cursor_id: cursor?.id,
      cursor_source: cursor?.source,
    });
  },

  findAccounts(query: string): Promise<{ accounts: ActivityAccount[]; total: number }> {
    return get('accounts', { q: query, limit: 10 });
  },

  getAccount(id: string, since: string): Promise<AccountSummary> {
    return get(`accounts/${encodeURIComponent(id)}`, { since });
  },

  getAnalytics(since: string): Promise<AnalyticsReport> {
    return get('analytics', { since });
  },

  getFunnel(since: string): Promise<FunnelReport> {
    return get('funnel', { since });
  },

  getMonitoring(filters: { since: string; state?: string }, offset = 0): Promise<MonitoringPage> {
    return get('monitoring', { since: filters.since, state: filters.state, offset, limit: 25 });
  },

  /** `through` pins the review to what was on screen; a newer occurrence reopens the group. */
  async reviewMonitoring(group: MonitoringGroup, status: 'acknowledged' | 'resolved'): Promise<void> {
    const body = { status, source: group.source, event_name: group.event_name, page: group.page, status_code: group.status_code, through: group.last_seen };
    await authenticatedRequest(() => apiRequest(`/activity/monitoring/${encodeURIComponent(group.fingerprint)}/review`, { method: 'POST', body }));
  },
};
