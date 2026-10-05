import { mockCurrentUser } from '@/mocks/users';
import type { User } from '@/types/models';
import { clone, delay, ServiceError } from './client';

export type SignInInput = { email: string; password: string };
export type SignUpInput = SignInInput & { fullName: string };


export const authService = {
  async signIn({ email, password }: SignInInput): Promise<User> {
    if (password.length < 8) throw new ServiceError('Password must be at least 8 characters');
    return delay({ ...clone(mockCurrentUser), email }, 600);
  },

  async signUp({ email, password, fullName }: SignUpInput): Promise<User> {
    if (password.length < 8) throw new ServiceError('Password must be at least 8 characters');
    const initials = fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
    return delay({ ...clone(mockCurrentUser), email, fullName, initials: initials || 'BD' }, 700);
  },

  async signInWithGoogle(): Promise<User> {
    return delay(clone(mockCurrentUser), 600);
  },

  async signOut(): Promise<void> {
    await delay(undefined, 200);
  },
};
