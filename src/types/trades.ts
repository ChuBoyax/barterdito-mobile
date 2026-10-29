/** Shapes returned by the backend's /trades endpoints (app/schemas/trade*.py). */

export type OfferStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'unavailable';
export type OfferDirection = 'received' | 'sent';
export type OfferAction = 'accept' | 'decline' | 'cancel';
export type TradeStatus = 'active' | 'completed' | 'cancelled';

export type OfferPerson = { id: string; fullName: string; initials: string; avatarUrl: string | null };
export type OfferListing = { id: string | null; title: string; imageUrl: string | null; status: string | null };

export type TradeOffer = {
  id: string;
  proposer: OfferPerson;
  recipient: OfferPerson;
  offered: OfferListing;
  requested: OfferListing;
  message: string;
  status: OfferStatus;
  available: boolean;
  createdAt: string;
  updatedAt: string;
  tradeStatus: TradeStatus | null;
  conversationStarted: boolean;
};

export type OffersPage = { offers: TradeOffer[]; total: number; receivedCount: number; sentCount: number };

export type TradeMessage = {
  id: number;
  senderId: string | null;
  body: string;
  kind: 'text' | 'system';
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
};

export type MessagesPage = { messages: TradeMessage[]; hasMore: boolean };

export type TradeMeetup = {
  id: string;
  proposedBy: string;
  startsAt: string;
  location: string;
  notes: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'superseded';
};

export type TradeIssue = { id: string; reporterId: string; body: string; status: 'open' | 'resolved'; createdAt: string };

export type TradeReview = { id: string; author: OfferPerson; revieweeId: string; rating: number; body: string; createdAt: string };

export type Conversation = {
  offer: TradeOffer;
  status: TradeStatus;
  proposerConfirmedAt: string | null;
  recipientConfirmedAt: string | null;
  completedAt: string | null;
  meetups: TradeMeetup[];
  issues: TradeIssue[];
  reviews: TradeReview[];
};

export type ConversationSummary = { offer: TradeOffer; status: TradeStatus; lastMessage: string; updatedAt: string; unreadCount: number };
