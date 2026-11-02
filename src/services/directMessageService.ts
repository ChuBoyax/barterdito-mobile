import type { DirectConversation, DirectConversationsPage, DirectMessage, DirectMessagesPage, DirectPerson, DirectPresence, DirectView } from '@/types/directMessages';
import { initialsOf } from '@/utils/format';
import { apiRequest, authenticatedRequest, mediaUrl } from './api';

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
};
type MessageRow = { id: number; sender_id: string; client_id: string; body: string; created_at: string };
type PresenceRow = { other_is_typing: boolean; typing_expires_at: string | null; other_last_read_message_id: number; server_time: string };

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
  };
}

function toMessage(row: MessageRow): DirectMessage {
  return { id: row.id, senderId: row.sender_id, clientId: row.client_id, body: row.body, createdAt: row.created_at };
}

/** Private messages between two traders (sign-in required), like the website's Inbox › Messages. */
export const directMessageService = {
  /** The Unread view is filtered by the backend before paging, so `total` and the page agree. */
  async getConversations(offset = 0, view: DirectView = 'all'): Promise<DirectConversationsPage> {
    const page = await get<{ conversations: ConversationRow[]; total: number; all_total?: number; unread_total?: number; view?: DirectView }>(
      `/direct-messages?view=${view}&limit=50&offset=${offset}`,
    );
    // An older backend ignores `view` and would show everything under "Unread".
    if (view === 'unread' && (page.view !== 'unread' || typeof page.unread_total !== 'number')) {
      throw new Error('Unread filtering is unavailable. Update the backend and try again.');
    }
    return {
      conversations: page.conversations.map(toConversation),
      total: page.total,
      allTotal: page.all_total ?? page.total,
      unreadTotal: page.unread_total ?? 0,
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
