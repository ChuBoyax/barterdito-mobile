import { router } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { authService } from '@/services';
import type { SignInInput, SignUpInput } from '@/services/authService';
import type { User } from '@/types/models';
import { initialsOf } from '@/utils/format';
import { readJson, removeKey, storageKeys, writeJson } from '@/utils/storage';

type AuthContextValue = {
  user: User | null;
  authenticated: boolean;
  ready: boolean;
  signIn: (input: SignInInput) => Promise<User>;
  signUp: (input: SignUpInput) => Promise<User>;
  signInWithGoogle: () => Promise<User>;
  signOut: () => Promise<void>;
  updateProfile: (patch: ProfilePatch) => Promise<User>;

  requireAuth: (action?: () => void) => void;
};

export type ProfilePatch = Partial<Pick<User, 'fullName' | 'bio' | 'location'>>;

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void readJson<User>(storageKeys.demoAuth).then((saved) => {
      setUser(saved);
      setReady(true);
    });
  }, []);

  const persist = useCallback((next: User) => {
    setUser(next);
    void writeJson(storageKeys.demoAuth, next);
    return next;
  }, []);

  const signIn = useCallback(async (input: SignInInput) => persist(await authService.signIn(input)), [persist]);
  const signUp = useCallback(async (input: SignUpInput) => persist(await authService.signUp(input)), [persist]);
  const signInWithGoogle = useCallback(async () => persist(await authService.signInWithGoogle()), [persist]);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setUser(null);
    await removeKey(storageKeys.demoAuth);
  }, []);

  // Demo-only: updates the locally stored user until a profile endpoint exists.
  const updateProfile = useCallback(
    async (patch: ProfilePatch) => {
      if (!user) throw new Error('Not signed in');
      const fullName = patch.fullName?.trim() || user.fullName;
      return persist({ ...user, ...patch, fullName, initials: initialsOf(fullName) || user.initials });
    },
    [user, persist],
  );

  const requireAuth = useCallback(
    (action?: () => void) => {
      if (!user) {
        router.push('/login');
        return;
      }
      action?.();
    },
    [user],
  );

  const value = useMemo(
    () => ({ user, authenticated: Boolean(user), ready, signIn, signUp, signInWithGoogle, signOut, updateProfile, requireAuth }),
    [user, ready, signIn, signUp, signInWithGoogle, signOut, updateProfile, requireAuth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
