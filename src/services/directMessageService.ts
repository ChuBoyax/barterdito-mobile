import type { DirectConversation, DirectMessage, DirectMessagesPage, DirectPerson, DirectPresence } from '@/types/directMessages';
import { initialsOf } from '@/utils/format';
import { apiRequest, authenticatedRequest, mediaUrl } from './api';

type PersonRow = { id: string; full_name: string; avatar_url: string | null };
type ConversationRow = { id: string; other: PersonRow; updated_at: string; last_message: string | null; unread_count: number; can_message: boolean };
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
  };
}

function toMessage(row: MessageRow): DirectMessage {
  return { id: row.id, senderId: row.sender_id, clientId: row.client_id, body: row.body, createdAt: row.created_at };
}

/** Private messages between two traders (sign-in required), like the website's Inbox › Messages. */
export const directMessageService = {
  async getConversations(offset = 0): Promise<{ conversations: DirectConversation[]; total: number }> {
    const page = await get<{ conversations: ConversationRow[]; total: number }>(`/direct-messages?limit=50&offset=${offset}`);
    return { conversations: page.conversations.map(toConversation), total: page.total };
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

  async markRead(id: string, throughMessageId: number): Promise<void> {
    await post(`${path(id)}/read`, { through_message_id: throughMessageId });
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
