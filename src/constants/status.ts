import type { Tone } from '@/theme';
import type { ItemStatus } from '@/types/models';

export const itemStatusTone: Record<ItemStatus, Tone> = {
  Active: 'green',
  'In Negotiation': 'orange',
  Traded: 'blue',
};


export const itemStatuses: ItemStatus[] = ['Active', 'In Negotiation', 'Traded'];
