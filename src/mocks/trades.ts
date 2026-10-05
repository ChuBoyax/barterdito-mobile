import type { ChatMessage, Offer, Thread } from '@/types/models';
import { mockItems } from './items';

export const mockOffers: Offer[] = [
  {
    id: '1',
    person: 'Mika Santos',
    initials: 'MS',
    theirs: mockItems[0],
    yours: mockItems[6],
    status: 'Pending',
    time: '12 min ago',
    received: true,
  },
  {
    id: '2',
    person: 'Paolo Reyes',
    initials: 'PR',
    theirs: mockItems[1],
    yours: mockItems[7],
    status: 'Accepted',
    time: 'Yesterday',
    received: false,
  },
];

export const mockThreads: Thread[] = [
  {
    id: '1',
    name: 'Mika Santos',
    initials: 'MS',
    item: 'Sony WH-1000XM4 ↔ iPhone 13 Mini',
    preview: 'Available ka ba Saturday afternoon?',
    time: '10:42 AM',
    unread: 2,
  },
  {
    id: '2',
    name: 'Paolo Reyes',
    initials: 'PR',
    item: 'Fujifilm X-T20 ↔ Cordless Tool Set',
    preview: 'Sounds good! I sent a meetup suggestion.',
    time: 'Yesterday',
    unread: 0,
  },
  {
    id: '3',
    name: 'Bea Mendoza',
    initials: 'BM',
    item: 'Nike Everyday Sneakers',
    preview: 'Hi! Would you consider fitness accessories?',
    time: 'Mon',
    unread: 0,
  },
];


export const mockTradeMessages: Record<string, ChatMessage[]> = {
  '1': [
    { id: 'm1', mine: false, text: 'Hi John! Interested ako sa iPhone 13 Mini mo.', time: '10:36 AM' },
    { id: 'm2', mine: true, text: 'Hi Mika! I saw your Sony headphones. Open ka for a straight swap?', time: '10:38 AM' },
    { id: 'm3', mine: false, text: 'Yes! Available ka ba Saturday afternoon?', time: '10:42 AM' },
  ],
};


export const mockDirectMessages: Record<string, ChatMessage[]> = {
  '1': [{ id: 'd1', mine: false, text: 'Hi! I saw your profile through the community forum.', time: '9:15 AM' }],
};

export const mockCompletedTrades = ['Sony headphones ↔ iPhone 13 Mini'];
