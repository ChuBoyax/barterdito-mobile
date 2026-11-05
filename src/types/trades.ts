import type { MessagePhoto, SharedListing } from './directMessages';

/** Shapes returned by the backend's /trades endpoints (app/schemas/trade*.py). */

export type OfferStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'unavailable';
export type OfferDirection = 'received' | 'sent';
/** `status` filter on GET /trades/offers; applied by the backend before pagination. */
export type OfferFilter = 'pending' | 'accepted' | 'cancelled' | 'completed' | 'declined' | 'unavailable' | 'all';
export type OfferSort = 'newest' | 'oldest';
export type OfferQuery = { status: OfferFilter; query: string; sort: OfferSort; needsAction: boolean };
export type OfferReasonCode = 'not_a_match' | 'different_item' | 'item_unavailable' | 'meetup_difficulty' | 'schedule_changed' | 'changed_mind' | 'other';
/** The three ways a proposal closes with an optional reason: recipient declines, sender withdraws, either cancels an accepted trade. */
export type OfferCloseKind = 'decline' | 'withdraw' | 'cancel';
export type OfferRequiredAction = 'respond_proposal' | 'respond_meetup' | 'confirm_exchange';
export type OfferNextStep = 'arrange_meetup' | 'review_meetup' | 'await_meetup' | 'confirm_exchange' | 'await_confirmation' | 'resolve_issue' | 'check_items' | 'check_trade' | 'complete';
export type OfferAction = 'accept' | 'decline' | 'cancel';
export type TradeStatus = 'active' | 'completed' | 'cancelled';

export type OfferPerson = { id: string; fullName: string; initials: string; avatarUrl: string | null };
export type OfferListing = { id: string | null; title: string; imageUrl: string | null; status: string | null; condition: string | null };

/** Why a proposal closed; only the two traders can read it. */
export type OfferResolution = { actorId: string; action: OfferCloseKind; reasonCode: OfferReasonCode | null; reasonNote: string; createdAt: string };

export type OfferMeetupSummary = { startsAt: string; location: string };

/** Summary of an accepted trade, worded for the signed-in trader. */
export type OfferProgress = {
  agreedMeetup: OfferMeetupSummary | null;
  pendingMeetup: OfferMeetupSummary | null;
  proposerConfirmedAt: string | null;
  recipientConfirmedAt: string | null;
  completedAt: string | null;
  openIssueCount: number;
  nextStep: OfferNextStep;
};

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
  requiredAction: OfferRequiredAction | null;
  /** Fingerprint of what the recipient reviewed; only on a fresh detail response. */
  acceptReviewToken: string | null;
  resolution: OfferResolution | null;
  progress: OfferProgress | null;
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
  listing: SharedListing | null;
  photo: MessagePhoto | null;
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
