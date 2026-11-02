/** Shapes of the backend's `/direct-messages` endpoints: user-to-user PMs, separate from trade chats. */

export type DirectPerson = { id: string; fullName: string; initials: string; avatarUrl: string | null };

export type DirectConversation = {
  id: string;
  other: DirectPerson;
  updatedAt: string;
  lastMessage: string | null;
  unreadCount: number;
  /** False once the other account is disabled; history stays readable. */
  canMessage: boolean;
  /** Unread incoming messages, or a personal "mark as unread" reminder. */
  isUnread: boolean;
  /** Your private reminder token; null when none. It never changes the other trader's read receipt. */
  unreadReminderId: string | null;
};

/** "unread" lists conversations with incoming unread messages or your reminder, filtered before paging. */
export type DirectView = 'all' | 'unread';

export type DirectConversationsPage = {
  conversations: DirectConversation[];
  /** Conversations in the selected view. */
  total: number;
  allTotal: number;
  unreadTotal: number;
};

export type DirectMessage = { id: number; senderId: string; clientId: string; body: string; createdAt: string };

export type DirectMessagesPage = { messages: DirectMessage[]; hasMore: boolean };

/** Typing lease and the other person's read cursor (read receipts). */
export type DirectPresence = { otherIsTyping: boolean; typingMs: number; otherLastReadMessageId: number };
