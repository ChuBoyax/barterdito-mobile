import type { User } from '@/types/models';
import { mockCurrentUser } from './users';

export type MockAccount = {
  label: string;
  email: string;
  password: string;
  user: User;
};

export const mockAccounts: MockAccount[] = [
  {
    label: 'Trader',
    email: 'demo@barterdito.ph',
    password: 'barter123',
    user: { ...mockCurrentUser, email: 'demo@barterdito.ph' },
  },
  {
    label: 'Admin',
    email: 'admin@barterdito.ph',
    password: 'admin123',
    user: {
      ...mockCurrentUser,
      id: 'sentinel-admin',
      fullName: 'Sentinel Admin',
      initials: 'SA',
      email: 'admin@barterdito.ph',
      role: 'sentinel',
    },
  },
];
