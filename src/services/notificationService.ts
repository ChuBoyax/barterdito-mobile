import { apiRequest, authenticatedRequest } from './api';

/** Shapes from the backend's /notifications endpoints (app/schemas/notification.py). */
export type AppNotification = {
  id: number;
  offerId: string;
  messageId: number | null;
  kind: string;
  text: string;
  /** Website path of the target screen; the same paths exist as app routes. */
  href: string;
  createdAt: string;
  readAt: string | null;
};

export type NotificationCounts = {
  unreadCount: number;
  unreadMessageCount: number;
  unreadConversationCount: number;
  latestId: number;
};

export type NotificationsPage = NotificationCounts & { notifications: AppNotification[]; hasMore: boolean; nextBeforeId: number | null };

type CountsRow = { unread_count: number; unread_message_count: number; unread_conversation_count: number; latest_id: number };
type NotificationRow = {
  id: number;
  offer_id: string;
  message_id: number | null;
  kind: string;
  text: string;
  href: string;
  created_at: string;
  read_at: string | null;
};

const toCounts = (row: CountsRow): NotificationCounts => ({
  unreadCount: row.unread_count,
  unreadMessageCount: row.unread_message_count,
  unreadConversationCount: row.unread_conversation_count,
  latestId: row.latest_id,
});

const toNotification = (row: NotificationRow): AppNotification => ({
  id: row.id,
  offerId: row.offer_id,
  messageId: row.message_id,
  kind: row.kind,
  text: row.text,
  href: row.href,
  createdAt: row.created_at,
  readAt: row.read_at,
});

function get<T>(path: string) {
  return authenticatedRequest(() => apiRequest<T>(path));
}

function post<T>(path: string, body: unknown) {
  return authenticatedRequest(() => apiRequest<T>(path, { method: 'POST', body }));
}

export const notificationService = {
  async getCounts(): Promise<NotificationCounts> {
    return toCounts(await get<CountsRow>('/notifications/counts'));
  },

  /** Newest first; pass the previous page's `nextBeforeId` to continue. */
  async getPage(beforeId?: number | null, limit = 20): Promise<NotificationsPage> {
    const result = await get<CountsRow & { notifications: NotificationRow[]; has_more: boolean; next_before_id: number | null }>(
      `/notifications?limit=${limit}${beforeId ? `&before_id=${beforeId}` : ''}`,
    );
    return { ...toCounts(result), notifications: result.notifications.map(toNotification), hasMore: result.has_more, nextBeforeId: result.next_before_id };
  },

  async markRead(id: number): Promise<NotificationCounts & { notification: AppNotification }> {
    const result = await post<CountsRow & { notification: NotificationRow }>(`/notifications/${id}/read`, {});
    return { ...toCounts(result), notification: toNotification(result.notification) };
  },

  /** Marks everything up to the newest notification the user has seen (a snapshot, like the website). */
  async markAllRead(throughId: number): Promise<NotificationCounts> {
    return toCounts(await post<CountsRow>('/notifications/read-all', { through_id: throughId }));
  },

  /** Moves the chat read position forward; the backend never moves it backward. */
  async markChatRead(offerId: string, throughMessageId: number): Promise<NotificationCounts & { lastReadMessageId: number }> {
    const result = await post<CountsRow & { last_read_message_id: number }>(`/trades/offers/${encodeURIComponent(offerId)}/read`, {
      through_message_id: throughMessageId,
    });
    return { ...toCounts(result), lastReadMessageId: result.last_read_message_id };
  },
};
