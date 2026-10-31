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
};

export type DirectMessage = { id: number; senderId: string; clientId: string; body: string; createdAt: string };

export type DirectMessagesPage = { messages: DirectMessage[]; hasMore: boolean };

/** Typing lease and the other person's read cursor (read receipts). */
export type DirectPresence = { otherIsTyping: boolean; typingMs: number; otherLastReadMessageId: number };
