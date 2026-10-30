import { mockCompletedTrades } from '@/mocks/trades';
import type { DisputeInput } from '@/types/models';
import type {
  Conversation,
  ConversationSummary,
  MessagesPage,
  OfferAction,
  OfferDirection,
  OfferFilter,
  OfferListing,
  OfferPerson,
  OffersPage,
  TradeMessage,
  TradeOffer,
  TradeReview,
} from '@/types/trades';
import { initialsOf } from '@/utils/format';
import { apiRequest, authenticatedRequest, mediaUrl } from './api';
import { clone, delay } from './client';

type PersonRow = { id: string; full_name: string; avatar_url: string | null };
type ListingRow = { id: string | null; title: string; image_url: string | null; status: string | null };
type OfferRow = {
  id: string;
  proposer: PersonRow;
  recipient: PersonRow;
  offered: ListingRow;
  requested: ListingRow;
  message: string;
  status: TradeOffer['status'];
  available: boolean;
  created_at: string;
  updated_at: string;
  trade_status?: TradeOffer['tradeStatus'];
  conversation_started?: boolean;
};
type MessageRow = {
  id: number;
  sender_id: string | null;
  body: string;
  kind: 'text' | 'system';
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
};
type ReviewRow = { id: string; author: PersonRow; reviewee_id: string; rating: number; body: string; created_at: string };
type ConversationRow = {
  offer: OfferRow;
  status: Conversation['status'];
  proposer_confirmed_at: string | null;
  recipient_confirmed_at: string | null;
  completed_at: string | null;
  meetups: { id: string; proposed_by: string; starts_at: string; location: string; notes: string; status: Conversation['meetups'][number]['status'] }[];
  issues: { id: string; reporter_id: string; body: string; status: 'open' | 'resolved'; created_at: string }[];
  reviews: ReviewRow[];
};

const person = (row: PersonRow): OfferPerson => ({
  id: row.id,
  fullName: row.full_name,
  initials: initialsOf(row.full_name) || 'BD',
  avatarUrl: mediaUrl(row.avatar_url),
});

const listing = (row: ListingRow): OfferListing => ({ id: row.id, title: row.title, imageUrl: mediaUrl(row.image_url), status: row.status });

const toOffer = (row: OfferRow): TradeOffer => ({
  id: row.id,
  proposer: person(row.proposer),
  recipient: person(row.recipient),
  offered: listing(row.offered),
  requested: listing(row.requested),
  message: row.message,
  status: row.status,
  available: row.available,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  tradeStatus: row.trade_status ?? null,
  conversationStarted: Boolean(row.conversation_started),
});

const toMessage = (row: MessageRow): TradeMessage => ({
  id: row.id,
  senderId: row.sender_id,
  body: row.body,
  kind: row.kind,
  createdAt: row.created_at,
  editedAt: row.edited_at,
  deletedAt: row.deleted_at,
});

const toReview = (row: ReviewRow): TradeReview => ({
  id: row.id,
  author: person(row.author),
  revieweeId: row.reviewee_id,
  rating: row.rating,
  body: row.body,
  createdAt: row.created_at,
});

const toConversation = (row: ConversationRow): Conversation => ({
  offer: toOffer(row.offer),
  status: row.status,
  proposerConfirmedAt: row.proposer_confirmed_at,
  recipientConfirmedAt: row.recipient_confirmed_at,
  completedAt: row.completed_at,
  meetups: row.meetups.map((entry) => ({
    id: entry.id,
    proposedBy: entry.proposed_by,
    startsAt: entry.starts_at,
    location: entry.location,
    notes: entry.notes,
    status: entry.status,
  })),
  issues: row.issues.map((entry) => ({ id: entry.id, reporterId: entry.reporter_id, body: entry.body, status: entry.status, createdAt: entry.created_at })),
  reviews: row.reviews.map(toReview),
});

const offerPath = (id: string) => `/trades/offers/${encodeURIComponent(id)}`;

function get<T>(path: string) {
  return authenticatedRequest(() => apiRequest<T>(path));
}

function post<T>(path: string, body: unknown) {
  return authenticatedRequest(() => apiRequest<T>(path, { method: 'POST', body }));
}

/** Random UUID v4 so a retried send is not saved twice (the backend dedupes by client_id). */
export function clientId(): string {
  const random = globalThis.crypto?.getRandomValues?.(new Uint8Array(16)) ?? Uint8Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
  random[6] = (random[6]! & 0x0f) | 0x40;
  random[8] = (random[8]! & 0x3f) | 0x80;
  const hex = [...random].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export const tradeService = {
  async proposeTrade(requestedListingId: string, offeredListingId: string, message: string): Promise<TradeOffer> {
    return toOffer(
      await post<OfferRow>('/trades/offers', { requested_listing_id: requestedListingId, offered_listing_id: offeredListingId, message: message.trim() }),
    );
  },

  async getOffers(direction: OfferDirection, offset = 0, status: OfferFilter = 'all'): Promise<OffersPage> {
    const result = await get<{ offers: OfferRow[]; total: number; received_count: number; sent_count: number }>(
      `/trades/offers?direction=${direction}&status=${status}&limit=20&offset=${offset}`,
    );
    return { offers: result.offers.map(toOffer), total: result.total, receivedCount: result.received_count, sentCount: result.sent_count };
  },

  async getOffer(id: string): Promise<TradeOffer> {
    return toOffer(await get<OfferRow>(offerPath(id)));
  },

  async respond(id: string, action: OfferAction): Promise<TradeOffer> {
    return toOffer(await post<OfferRow>(`${offerPath(id)}/respond`, { action }));
  },

  async getConversations(completed: boolean, offset = 0): Promise<{ conversations: ConversationSummary[]; total: number }> {
    const result = await get<{
      conversations: { offer: OfferRow; status: ConversationSummary['status']; last_message: string; updated_at: string; unread_count?: number }[];
      total: number;
    }>(
      `/trades/conversations?status=${completed ? 'completed' : 'all'}&limit=50&offset=${offset}`,
    );
    return {
      conversations: result.conversations.map((row) => ({
        offer: toOffer(row.offer),
        status: row.status,
        lastMessage: row.last_message,
        updatedAt: row.updated_at,
        unreadCount: row.unread_count ?? 0,
      })),
      total: result.total,
    };
  },

  async getConversation(id: string): Promise<Conversation> {
    return toConversation(await get<ConversationRow>(`${offerPath(id)}/conversation`));
  },

  async getMessages(id: string, beforeId?: number): Promise<MessagesPage> {
    const result = await get<{ messages: MessageRow[]; has_more: boolean }>(`${offerPath(id)}/messages?limit=50${beforeId ? `&before_id=${beforeId}` : ''}`);
    return { messages: result.messages.map(toMessage), hasMore: result.has_more };
  },

  async sendMessage(id: string, body: string, requestId: string): Promise<TradeMessage> {
    return toMessage(await post<MessageRow>(`${offerPath(id)}/messages`, { body, client_id: requestId }));
  },

  async editMessage(id: string, messageId: number, body: string): Promise<TradeMessage> {
    return toMessage(await authenticatedRequest(() => apiRequest<MessageRow>(`${offerPath(id)}/messages/${messageId}`, { method: 'PUT', body: { body } })));
  },

  async removeMessage(id: string, messageId: number): Promise<TradeMessage> {
    return toMessage(await authenticatedRequest(() => apiRequest<MessageRow>(`${offerPath(id)}/messages/${messageId}`, { method: 'DELETE' })));
  },

  async proposeMeetup(id: string, startsAt: Date, location: string, notes: string): Promise<Conversation> {
    return toConversation(await post<ConversationRow>(`${offerPath(id)}/meetups`, { starts_at: startsAt.toISOString(), location: location.trim(), notes: notes.trim() }));
  },

  async respondMeetup(id: string, meetupId: string, action: OfferAction): Promise<Conversation> {
    return toConversation(await post<ConversationRow>(`${offerPath(id)}/meetups/${encodeURIComponent(meetupId)}/respond`, { action }));
  },

  async confirmExchange(id: string): Promise<Conversation> {
    return toConversation(await post<ConversationRow>(`${offerPath(id)}/confirm`, { acknowledge_exchange: true }));
  },

  async reportIssue(id: string, body: string): Promise<Conversation> {
    return toConversation(await post<ConversationRow>(`${offerPath(id)}/issues`, { body: body.trim() }));
  },

  async resolveIssue(id: string, issueId: string): Promise<Conversation> {
    return toConversation(await post<ConversationRow>(`${offerPath(id)}/issues/${encodeURIComponent(issueId)}/resolve`, {}));
  },

  async review(id: string, rating: number, body: string): Promise<Conversation> {
    return toConversation(await post<ConversationRow>(`${offerPath(id)}/reviews`, { rating, body: body.trim() }));
  },

  /** Public reviews from verified completed trades. */
  async getReviews(userId: string, offset = 0): Promise<{ reviews: TradeReview[]; total: number }> {
    const result = await apiRequest<{ reviews: ReviewRow[]; total: number }>(`/profiles/${encodeURIComponent(userId)}/reviews?limit=20&offset=${offset}`);
    return { reviews: result.reviews.map(toReview), total: result.total };
  },

  /** Disputes are still a preview on the website; nothing is stored yet. */
  async getCompletedTrades(): Promise<string[]> {
    return delay([...mockCompletedTrades]);
  },

  async fileDispute(input: DisputeInput): Promise<void> {
    void clone(input);
    await delay(undefined, 600);
  },
};
