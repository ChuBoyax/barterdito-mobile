import type {
  BlockedPerson,
  DirectConversation,
  DirectConversationsPage,
  DirectMessage,
  DirectMessagesPage,
  DirectPerson,
  DirectPresence,
  DirectView,
  MessageReport,
  MessageReportReason,
  MessageReportStatus,
  MessageSearchPage,
  SharedListing,
} from '@/types/directMessages';
import { initialsOf } from '@/utils/format';
import { apiRequest, apiUploadFile, authenticatedRequest, mediaUrl } from './api';

type PersonRow = { id: string; full_name: string; avatar_url: string | null };
type ConversationRow = {
  id: string;
  other: PersonRow;
  updated_at: string;
  last_message: string | null;
  unread_count: number;
  can_message: boolean;
  is_unread?: boolean;
  unread_reminder_id?: string | null;
  is_pinned?: boolean;
  is_archived?: boolean;
  blocked_by_me?: boolean;
  is_muted?: boolean;
};
export type SharedListingRow = { id: string | null; title: string; condition: string; image_url: string | null; status: SharedListing['status'] };
type MessageRow = {
  id: number;
  conversation_id?: string;
  sender_id: string;
  client_id: string;
  body: string;
  created_at: string;
  listing?: SharedListingRow | null;
  photo?: { width: number; height: number } | null;
};
type ReportRow = {
  id: string;
  status: MessageReportStatus;
  created_at: string;
  reporter: PersonRow;
  sender: PersonRow;
  reason: string;
  details: string;
  message_body: string;
  photo?: { width: number; height: number } | null;
  reviewed_at: string | null;
  review_notes: string;
};
export type PresenceRow = { other_is_typing: boolean; typing_expires_at: string | null; other_last_read_message_id: number; server_time: string };

const path = (id: string) => `/direct-messages/${encodeURIComponent(id)}`;
const get = <T>(url: string) => authenticatedRequest(() => apiRequest<T>(url));
const post = <T>(url: string, body: unknown, timeout?: number) => authenticatedRequest(() => apiRequest<T>(url, { method: 'POST', body, timeout }));

function toPerson(row: PersonRow): DirectPerson {
  return { id: row.id, fullName: row.full_name, initials: initialsOf(row.full_name) || 'BD', avatarUrl: mediaUrl(row.avatar_url) };
}

function toConversation(row: ConversationRow): DirectConversation {
  return {
    id: row.id,
    other: toPerson(row.other),
    updatedAt: row.updated_at,
    lastMessage: row.last_message,
    unreadCount: row.unread_count,
    canMessage: row.can_message,
    isUnread: row.is_unread ?? row.unread_count > 0,
    unreadReminderId: row.unread_reminder_id ?? null,
    isPinned: row.is_pinned ?? false,
    isArchived: row.is_archived ?? false,
    blockedByMe: row.blocked_by_me ?? false,
    isMuted: row.is_muted ?? false,
  };
}

export function toSharedListing(row: SharedListingRow): SharedListing {
  return { id: row.id, title: row.title, condition: row.condition, imageUrl: mediaUrl(row.image_url), status: row.status };
}

function toMessage(row: MessageRow): DirectMessage {
  return {
    id: row.id,
    senderId: row.sender_id,
    clientId: row.client_id,
    body: row.body,
    createdAt: row.created_at,
    listing: row.listing ? toSharedListing(row.listing) : null,
    photo: row.photo ? { width: row.photo.width, height: row.photo.height } : null,
  };
}

function toReport(row: ReportRow): MessageReport {
  return {
    id: row.id,
    status: row.status,
    createdAt: row.created_at,
    reporter: toPerson(row.reporter),
    sender: toPerson(row.sender),
    reason: row.reason,
    details: row.details,
    messageBody: row.message_body,
    photo: row.photo ? { width: row.photo.width, height: row.photo.height } : null,
    reviewedAt: row.reviewed_at,
    reviewNotes: row.review_notes,
  };
}

/** Private messages between two traders (sign-in required), like the website's Inbox › Messages. */
export const directMessageService = {
  /** Views are filtered by the backend before paging, so `total` and the page agree. */
  async getConversations(offset = 0, view: DirectView = 'all'): Promise<DirectConversationsPage> {
    const page = await get<{ conversations: ConversationRow[]; total: number; all_total?: number; unread_total?: number; archived_total?: number; view?: DirectView }>(
      `/direct-messages?view=${view}&limit=50&offset=${offset}`,
    );
    // An older backend ignores `view` and would show everything under this filter.
    if (view !== 'all' && page.view !== view) {
      throw new Error('This filter is unavailable. Update the backend and try again.');
    }
    return {
      conversations: page.conversations.map(toConversation),
      total: page.total,
      allTotal: page.all_total ?? page.total,
      unreadTotal: page.unread_total ?? 0,
      archivedTotal: page.archived_total ?? 0,
    };
  },

  async searchPeople(query: string): Promise<DirectPerson[]> {
    return (await get<PersonRow[]>(`/direct-messages/people?q=${encodeURIComponent(query.trim())}`)).map(toPerson);
  },

  /** Opens the one conversation with this trader, creating it the first time. */
  async start(recipientId: string): Promise<DirectConversation> {
    return toConversation(await post<ConversationRow>('/direct-messages', { recipient_id: recipientId }));
  },

  async getConversation(id: string): Promise<DirectConversation> {
    return toConversation(await get<ConversationRow>(path(id)));
  },

  /** Newest page, or the page before `beforeId`; oldest first. */
  async getMessages(id: string, beforeId?: number): Promise<DirectMessagesPage> {
    const page = await get<{ messages: MessageRow[]; has_more: boolean }>(`${path(id)}/messages?limit=50${beforeId ? `&before_id=${beforeId}` : ''}`);
    return { messages: page.messages.map(toMessage), hasMore: page.has_more };
  },

  /** `clientId` makes a retry of the same text safe: the backend saves it once. */
  async send(id: string, body: string, clientId: string): Promise<DirectMessage> {
    return toMessage(await post<MessageRow>(`${path(id)}/messages`, { body, client_id: clientId }));
  },

  /** The photo must be a prepared file, and a retry must send that same file with the same `clientId`. */
  async sendPhoto(id: string, fileUri: string, clientId: string): Promise<DirectMessage> {
    return toMessage(await authenticatedRequest(() => apiUploadFile<MessageRow>(`${path(id)}/photos?client_id=${clientId}`, fileUri, 'image/jpeg')));
  },

  photoPath(id: string, messageId: number) {
    return `${path(id)}/photos/${messageId}`;
  },

  reportPhotoPath(reportId: string) {
    return `/direct-messages/reports/${encodeURIComponent(reportId)}/photo`;
  },

  /** Saved private messages, archived and blocked history included. Read-only: it never marks anything as read. */
  async search(query: string, threadId?: string, beforeId?: number): Promise<MessageSearchPage> {
    const params = `q=${encodeURIComponent(query)}&limit=20${beforeId ? `&before_id=${beforeId}` : ''}${threadId ? `&thread_id=${encodeURIComponent(threadId)}` : ''}`;
    const page = await get<{ matches: { message: MessageRow & { conversation_id: string }; other: PersonRow }[]; has_more: boolean; next_before_id: number | null }>(`/direct-messages/search?${params}`);
    return {
      matches: page.matches.map((hit) => ({ message: toMessage(hit.message), conversationId: hit.message.conversation_id, other: toPerson(hit.other) })),
      hasMore: page.has_more,
      nextBeforeId: page.next_before_id,
    };
  },

  /** A saved message with the messages around it, for opening a search result. */
  async getContext(id: string, messageId: number): Promise<DirectMessagesPage> {
    const page = await get<{ messages: MessageRow[]; has_more: boolean }>(`${path(id)}/messages/${messageId}/context?limit=20`);
    return { messages: page.messages.map(toMessage), hasMore: page.has_more };
  },

  /** Sends one of your active listings as a card. It never creates a trade proposal. */
  async shareListing(id: string, listingId: string, clientId: string): Promise<DirectMessage> {
    return toMessage(await post<MessageRow>(`${path(id)}/listings`, { listing_id: listingId, client_id: clientId }));
  },

  /**
   * Acknowledges messages up to `throughMessageId`. Pass the reminder token you observed so only
   * that reminder is cleared; a newer one made on another device is kept. Returns the remaining token.
   */
  async markRead(id: string, throughMessageId: number, unreadReminderId?: string | null): Promise<string | null> {
    const result = await post<{ unread_reminder_id?: string | null }>(`${path(id)}/read`, {
      through_message_id: throughMessageId,
      ...(unreadReminderId ? { unread_reminder_id: unreadReminderId } : {}),
    });
    return result.unread_reminder_id ?? null;
  },

  /** Your private reminder; the other trader's read receipt and the message counts are untouched. */
  async setMarkedUnread(id: string, markedUnread: boolean): Promise<DirectConversation> {
    return toConversation(await post<ConversationRow>(`${path(id)}/unread`, { marked_unread: markedUnread }));
  },

  /** Stops bell alerts for future messages only; unread counts and history stay. */
  async setMuted(id: string, muted: boolean): Promise<DirectConversation> {
    return toConversation(await post<ConversationRow>(`${path(id)}/mute`, { muted }));
  },

  /** Private to you, like archive; neither changes activity time or read receipts. */
  async setPinned(id: string, pinned: boolean): Promise<DirectConversation> {
    return toConversation(await post<ConversationRow>(`${path(id)}/pin`, { pinned }));
  },

  async setArchived(id: string, archived: boolean): Promise<DirectConversation> {
    return toConversation(await post<ConversationRow>(`${path(id)}/archive`, { archived }));
  },

  /** Stops new PMs both ways while active; history stays readable and trades are unaffected. */
  async setBlocked(id: string, blocked: boolean): Promise<DirectConversation> {
    return toConversation(await post<ConversationRow>(`${path(id)}/block`, { blocked }));
  },

  async getBlocked(offset = 0): Promise<{ users: BlockedPerson[]; total: number }> {
    const page = await get<{ users: { user: PersonRow; conversation_id: string; blocked_at: string }[]; total: number }>(`/direct-messages/blocked?limit=50&offset=${offset}`);
    return { users: page.users.map((row) => ({ user: toPerson(row.user), conversationId: row.conversation_id, blockedAt: row.blocked_at })), total: page.total };
  },

  /** Only the recipient can report a message; the backend snapshots the evidence and the sender is not told. */
  async reportMessage(id: string, messageId: number, reason: MessageReportReason, details: string): Promise<void> {
    await post(`${path(id)}/messages/${messageId}/report`, { reason, details });
  },

  async getReports(status: MessageReportStatus, offset = 0): Promise<{ reports: MessageReport[]; total: number }> {
    const page = await get<{ reports: ReportRow[]; total: number }>(`/direct-messages/reports?status=${status}&limit=20&offset=${offset}`);
    return { reports: page.reports.map(toReport), total: page.total };
  },

  /** Closes a report only; it does not ban the account or delete the message. */
  async reviewReport(reportId: string, status: 'resolved' | 'dismissed', notes: string): Promise<void> {
    await post(`/direct-messages/reports/${encodeURIComponent(reportId)}/review`, { status, notes });
  },

  async getPresence(id: string): Promise<DirectPresence> {
    const row = await get<PresenceRow>(`${path(id)}/presence`);
    // The lease is measured on the server clock, so only the remaining time is used here.
    const typingMs = row.typing_expires_at ? Math.max(0, Math.min(6000, Date.parse(row.typing_expires_at) - Date.parse(row.server_time))) : 0;
    return { otherIsTyping: row.other_is_typing && typingMs > 0, typingMs, otherLastReadMessageId: row.other_last_read_message_id };
  },

  /** Typing lease (about six seconds); only the on/off state is sent, never the draft. */
  async setTyping(id: string, isTyping: boolean): Promise<void> {
    await post(`${path(id)}/typing`, { is_typing: isTyping }, 4000);
  },
};
