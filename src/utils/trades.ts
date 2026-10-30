import type { Conversation, OfferFilter, TradeOffer } from '@/types/trades';

/** In chip order; "All" comes first. */
export const offerFilterLabels: Record<OfferFilter, string> = {
  all: 'All',
  pending: 'Pending',
  accepted: 'Accepted',
  cancelled: 'Cancelled',
  completed: 'Completed',
};

/** The filter an offer currently falls under — mirrors the backend's offer_status_filter. */
export function offerFilterFor(offer: TradeOffer): OfferFilter {
  if (offer.tradeStatus === 'completed') return 'completed';
  if (offer.status === 'cancelled' || offer.tradeStatus === 'cancelled') return 'cancelled';
  if (offer.status === 'accepted') return 'accepted';
  return offer.status === 'pending' ? 'pending' : 'all';
}

export function offerDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function meetupDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/** The other participant from the viewer's point of view. */
export function otherTrader(offer: TradeOffer, userId: string) {
  return offer.proposer.id === userId ? offer.recipient : offer.proposer;
}

export function confirmations(data: Conversation, userId: string) {
  const proposer = data.offer.proposer.id === userId;
  return {
    mine: proposer ? data.proposerConfirmedAt : data.recipientConfirmedAt,
    theirs: proposer ? data.recipientConfirmedAt : data.proposerConfirmedAt,
  };
}
