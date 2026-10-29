import type { LeaderboardEntry } from '@/types/models';

export const mockLeaderboard: LeaderboardEntry[] = [
  { name: 'Mika Santos', initials: 'MS', points: 1840, trades: 31, rank: 1 },
  { name: 'Paolo Reyes', initials: 'PR', points: 1610, trades: 24, rank: 2 },
  { name: 'Bea Mendoza', initials: 'BM', points: 1425, trades: 22, rank: 3 },
  { name: 'Ren Dela Cruz', initials: 'RD', points: 1180, trades: 18, rank: 4 },
  { name: 'John Ramirez', initials: 'JR', points: 980, trades: 12, rank: 12, isYou: true },
];
