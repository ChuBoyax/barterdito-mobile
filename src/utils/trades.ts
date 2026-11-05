import type { Href } from 'expo-router';

import type { Conversation, OfferCloseKind, OfferFilter, OfferNextStep, OfferReasonCode, TradeOffer } from '@/types/trades';

/** In chip order; offers open on Pending and "All" comes last. */
export const offerFilterLabels: Record<OfferFilter, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  cancelled: 'Cancelled',
  completed: 'Completed',
  declined: 'Declined',
  unavailable: 'Unavailable',
  all: 'All',
};

export const offerReasonLabels: Record<OfferReasonCode, string> = {
  not_a_match: 'Not the right fit',
  different_item: 'Looking for a different item',
  item_unavailable: 'Item no longer available',
  meetup_difficulty: 'Could not agree on a meetup',
  schedule_changed: 'Schedule changed',
  changed_mind: 'Changed my mind',
  other: 'Other',
};

export const offerCloseLabels: Record<OfferCloseKind, { title: string; confirm: string; back: string; description: string; done: string }> = {
  decline: { title: 'Decline this proposal?', confirm: 'Decline proposal', back: 'Go back', description: 'This proposal will be declined without changing either item’s availability.', done: 'Proposal declined.' },
  withdraw: { title: 'Withdraw this proposal?', confirm: 'Withdraw proposal', back: 'Go back', description: 'Your proposal will be withdrawn without changing either item’s availability.', done: 'Proposal withdrawn.' },
  cancel: { title: 'Cancel this trade?', confirm: 'Cancel trade', back: 'Keep trade', description: 'Both items will become available for other traders again.', done: 'Trade cancelled.' },
};

export type OfferProgressTone = 'waiting' | 'accepted' | 'completed' | 'closed' | 'problem';

const nextStepCopy: Record<OfferNextStep, { tone: OfferProgressTone; text: string }> = {
  arrange_meetup: { tone: 'accepted', text: 'Next: agree on a public meetup in your trade chat.' },
  review_meetup: { tone: 'waiting', text: 'Review the other trader’s meetup proposal.' },
  await_meetup: { tone: 'waiting', text: 'Waiting for the other trader to respond to your meetup proposal.' },
  confirm_exchange: { tone: 'accepted', text: 'After meeting, inspect your item and confirm the exchange.' },
  await_confirmation: { tone: 'waiting', text: 'You confirmed the exchange. Waiting for the other trader.' },
  resolve_issue: { tone: 'problem', text: 'Completion paused until the reported problem is resolved.' },
  check_items: { tone: 'problem', text: 'An item is no longer reserved for this trade. Review the details in trade chat.' },
  check_trade: { tone: 'waiting', text: 'Review the current trade details in your conversation.' },
  complete: { tone: 'completed', text: 'Both traders confirmed the exchange.' },
};

/** One plain sentence on where a proposal stands and what happens next. */
export function offerProgress(offer: TradeOffer, received: boolean, name: string): { tone: OfferProgressTone; text: string } {
  if (offer.tradeStatus === 'completed') return { tone: 'completed', text: 'Both traders confirmed the exchange.' };
  if (offer.tradeStatus === 'cancelled') return { tone: 'closed', text: 'This trade was cancelled. The conversation is read-only.' };
  if (offer.status === 'accepted' && offer.progress) return nextStepCopy[offer.progress.nextStep];
  if (offer.status === 'accepted' && offer.requiredAction === 'confirm_exchange') return { tone: 'accepted', text: 'Your exchange confirmation is needed. Confirm only after receiving and inspecting your item.' };
  switch (offer.status) {
    case 'pending':
      if (!offer.available) return { tone: 'problem', text: 'One of these items is no longer available, so this trade can’t be accepted.' };
      return { tone: 'waiting', text: received ? `${name} wants to trade with you. Accept or decline below.` : `Waiting for ${name} to answer.` };
    case 'accepted':
      return { tone: 'accepted', text: 'Next step: arrange your meetup and confirm the exchange in your trade chat.' };
    case 'declined':
      return { tone: 'closed', text: received ? 'You declined this proposal.' : `${name} declined this proposal.` };
    case 'cancelled':
      return { tone: 'closed', text: 'This proposal was cancelled.' };
    default:
      return { tone: 'problem', text: 'An item was removed, is no longer active, or was reserved for another proposal.' };
  }
}

/** The main next step on an offer card, if it leads somewhere other than the chat. */
export function offerActionLink(offer: TradeOffer): { label: string; href: Href } | null {
  if (offer.status !== 'accepted' || offer.tradeStatus === 'cancelled') return null;
  if (offer.progress?.nextStep === 'complete') return { label: 'Rate your trade', href: `/trade-review/${offer.id}` };
  if (offer.progress?.nextStep === 'confirm_exchange' || offer.requiredAction === 'confirm_exchange') return { label: 'Review exchange', href: `/trade-complete/${offer.id}` };
  return null;
}

/** The filter an offer currently falls under — mirrors the backend's offer_status_filter. */
export function offerFilterFor(offer: TradeOffer): OfferFilter {
  if (offer.tradeStatus === 'completed') return 'completed';
  if (offer.status === 'cancelled' || offer.tradeStatus === 'cancelled') return 'cancelled';
  if (offer.status === 'accepted') return 'accepted';
  return offer.status;
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
