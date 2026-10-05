import type { Tone } from '@/theme';
import type { ItemStatus, OfferStatus } from '@/types/models';

export const offerStatusTone: Record<OfferStatus, Tone> = {
  Pending: 'orange',
  Accepted: 'green',
  Declined: 'red',
  Completed: 'blue',
};

export const itemStatusTone: Record<ItemStatus, Tone> = {
  Active: 'green',
  'In Negotiation': 'orange',
  Traded: 'blue',
};

/** Sort order for offer lists: things that still need action come first. */
export const offerStatusOrder: Record<OfferStatus, number> = { Pending: 0, Accepted: 1, Completed: 2, Declined: 3 };

export const itemStatuses: ItemStatus[] = ['Active', 'In Negotiation', 'Traded'];
