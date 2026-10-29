import type { Conversation, TradeOffer } from '@/types/trades';

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
