/** Shapes of the backend's `/direct-messages` endpoints: user-to-user PMs, separate from trade chats. */

export type DirectPerson = { id: string; fullName: string; initials: string; avatarUrl: string | null };

export type DirectConversation = {
  id: string;
  other: DirectPerson;
  updatedAt: string;
  lastMessage: string | null;
  unreadCount: number;
  /** False when the other account is disabled or either person has blocked the other; history stays readable. */
  canMessage: boolean;
  /** Unread incoming messages, or a personal "mark as unread" reminder. */
  isUnread: boolean;
  /** Your private reminder token; null when none. It never changes the other trader's read receipt. */
  unreadReminderId: string | null;
  /** Private to you; pinned threads come first in every view. */
  isPinned: boolean;
  /** Private to you; a new message restores the thread to the main inbox. */
  isArchived: boolean;
  /** Only your own block is ever exposed, never the other trader's. */
  blockedByMe: boolean;
  /** Private to you; stops bell alerts for new messages, not the unread counts. */
  isMuted: boolean;
};

/** Filtered by the backend before paging. "all" and "unread" leave out archived threads. */
export type DirectView = 'all' | 'unread' | 'archived';

export type DirectConversationsPage = {
  conversations: DirectConversation[];
  /** Conversations in the selected view. */
  total: number;
  allTotal: number;
  unreadTotal: number;
  archivedTotal: number;
};

/** A listing card in a PM, with live details; `id` is null once it is deleted or its owner is inactive. */
export type SharedListing = {
  id: string | null;
  title: string;
  condition: string;
  imageUrl: string | null;
  status: 'active' | 'in_negotiation' | 'traded' | 'unavailable';
};

/** Size of a private photo; the bytes need a signed-in request, so there is no public URL. */
export type MessagePhoto = { width: number; height: number };

export type DirectMessage = { id: number; senderId: string; clientId: string; body: string; createdAt: string; listing: SharedListing | null; photo: MessagePhoto | null };

/** One saved message found by search, with who it was exchanged with. */
export type MessageSearchHit = { message: DirectMessage; conversationId: string; other: DirectPerson };
export type MessageSearchPage = { matches: MessageSearchHit[]; hasMore: boolean; nextBeforeId: number | null };

export type BlockedPerson = { user: DirectPerson; conversationId: string; blockedAt: string };

export type MessageReportReason = 'spam' | 'harassment' | 'scam' | 'inappropriate' | 'other';
export type MessageReportStatus = 'open' | 'resolved' | 'dismissed';

/** A reported message, as moderators see it; the body is a snapshot taken by the backend. */
export type MessageReport = {
  id: string;
  status: MessageReportStatus;
  createdAt: string;
  reporter: DirectPerson;
  sender: DirectPerson;
  reason: string;
  details: string;
  messageBody: string;
  photo: MessagePhoto | null;
  reviewedAt: string | null;
  reviewNotes: string;
};

export type DirectMessagesPage = { messages: DirectMessage[]; hasMore: boolean };

/** Typing lease and the other person's read cursor (read receipts). */
export type DirectPresence = { otherIsTyping: boolean; typingMs: number; otherLastReadMessageId: number };
