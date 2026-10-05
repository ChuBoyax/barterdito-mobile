import { mockAccounts } from '@/mocks/accounts';
import type { User } from '@/types/models';
import { clone, delay, ServiceError } from './client';

export type SignInInput = { email: string; password: string };
export type SignUpInput = SignInInput & { fullName: string };

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function initialsOf(fullName: string) {
  return (
    fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'BD'
  );
}

export const authService = {
  demoAccounts: mockAccounts.map(({ label, email, password }) => ({ label, email, password })),

  async signIn({ email, password }: SignInInput): Promise<User> {
    const account = mockAccounts.find((entry) => entry.email === normalizeEmail(email));
    if (!account || account.password !== password) {
      await delay(undefined, 400);
      throw new ServiceError('Incorrect email or password');
    }
    return delay(clone(account.user), 500);
  },

  async signUp({ email, password, fullName }: SignUpInput): Promise<User> {
    if (password.length < 8) throw new ServiceError('Password must be at least 8 characters');
    if (mockAccounts.some((entry) => entry.email === normalizeEmail(email))) {
      throw new ServiceError('An account with this email already exists');
    }
    const base = clone(mockAccounts[0].user);
    return delay({ ...base, email: normalizeEmail(email), fullName: fullName.trim(), initials: initialsOf(fullName) }, 600);
  },

  async signInWithGoogle(): Promise<User> {
    return delay(clone(mockAccounts[0].user), 500);
  },

  async signOut(): Promise<void> {
    await delay(undefined, 200);
  },
};
