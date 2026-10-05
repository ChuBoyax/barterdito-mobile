import type {
  LeaderboardEntry,
  ProfileStats,
  Review,
  TradeHistoryEntry,
  Trader,
  User,
} from '@/types/models';

export const mockCurrentUser: User = {
  id: 'john-ramirez',
  fullName: 'John Ramirez',
  initials: 'JR',
  email: 'john@example.com',
  bio: 'Tech enthusiast, weekend cyclist, and believer that useful things deserve another home.',
  location: 'Manila, Philippines',
  joined: 'April 2026',
  role: 'member',
};

export const mockProfileStats: ProfileStats = {
  completed: 12,
  totalTrades: 27,
  rating: 4.9,
  followers: 128,
  following: 74,
  profileStrength: 75,
};

export const mockTraders: Trader[] = [
  { id: 'mika-santos', name: 'Mika Santos', initials: 'MS', rating: 4.9, trades: 31, color: '#5c7cfa' },
  { id: 'paolo-reyes', name: 'Paolo Reyes', initials: 'PR', rating: 4.8, trades: 24, color: '#20a37f' },
  { id: 'bea-mendoza', name: 'Bea Mendoza', initials: 'BM', rating: 5, trades: 12, color: '#e8590c' },
  { id: 'ren-dela-cruz', name: 'Ren Dela Cruz', initials: 'RD', rating: 4.7, trades: 18, color: '#9c36b5' },
  { id: 'aya-lim', name: 'Aya Lim', initials: 'AL', rating: 4.9, trades: 9, color: '#3fa879' },
];

export const mockLeaderboard: LeaderboardEntry[] = [
  { name: 'Mika Santos', initials: 'MS', points: 1840, trades: 31, rank: 1 },
  { name: 'Paolo Reyes', initials: 'PR', points: 1610, trades: 24, rank: 2 },
  { name: 'Bea Mendoza', initials: 'BM', points: 1425, trades: 22, rank: 3 },
  { name: 'Ren Dela Cruz', initials: 'RD', points: 1180, trades: 18, rank: 4 },
  { name: 'John Ramirez', initials: 'JR', points: 980, trades: 12, rank: 12, isYou: true },
];

export const mockTradeHistory: TradeHistoryEntry[] = [
  { id: 'h1', title: 'Mechanical Keyboard ↔ Camping Tent', partner: 'Ana Villanueva', date: 'July 12, 2026', rating: 5 },
  { id: 'h2', title: 'Espresso Maker ↔ Bookshelf', partner: 'Leo Tan', date: 'June 20, 2026', rating: 5 },
];

export const mockReviews: Review[] = [
  {
    id: 'r1',
    author: 'Ana Villanueva',
    initials: 'AV',
    rating: 5,
    date: 'July 12',
    text: 'Easy to coordinate with, honest about item condition, and right on time. Salamat!',
  },
];
