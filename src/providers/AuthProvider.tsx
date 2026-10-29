import { router } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { authService, userService } from '@/services';
import { isUnauthorized, onSessionExpired } from '@/services/api';
import type { SignInInput, SignUpInput } from '@/services/authService';
import { setViewer } from '@/services/itemService';
import type { ProfileWrite } from '@/services/userService';
import type { User } from '@/types/models';
import { readJson, removeKey, storageKeys, writeJson } from '@/utils/storage';
import { queryClient } from './queryClient';
import { queryKeys } from '@/services/queryKeys';

type AuthContextValue = {
  user: User | null;
  authenticated: boolean;
  ready: boolean;
  signIn: (input: SignInInput) => Promise<User>;
  register: (input: SignUpInput) => Promise<void>;
  verifyEmail: (email: string, code: string) => Promise<User>;
  signOut: () => Promise<void>;
  /** Clears the local session after the backend already revoked it (password change). */
  forgetSession: () => Promise<void>;
  updateProfile: (patch: ProfileWrite) => Promise<User>;
  refreshUser: () => Promise<void>;
  requireAuth: (action?: () => void) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const REVALIDATE_MS = 30_000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const lastCheck = useRef(0);
  // Bumped on sign in/out so an older session check cannot overwrite a newer result.
  const revision = useRef(0);

  const userId = useRef<string | null>(null);

  const apply = useCallback(<T extends User | null>(next: T): T => {
    setViewer(next?.id ?? null);
    setUser(next);
    if (userId.current !== (next?.id ?? null)) {
      userId.current = next?.id ?? null;
      // Cached responses are viewer-specific (own listings, follow state).
      void queryClient.resetQueries();
    }
    if (next) void writeJson(storageKeys.sessionUser, next);
    else void removeKey(storageKeys.sessionUser);
    return next;
  }, []);

  const check = useCallback(async () => {
    const started = revision.current;
    lastCheck.current = Date.now();
    try {
      const current = await authService.me();
      if (started === revision.current) apply(current);
    } catch (error) {
      // Temporary server/network errors keep the known user, like the website.
      if (started === revision.current && isUnauthorized(error)) apply(null);
    }
  }, [apply]);

  useEffect(() => {
    let active = true;
    void readJson<User>(storageKeys.sessionUser).then(async (cached) => {
      if (!active) return;
      if (cached) {
        userId.current = cached.id;
        setViewer(cached.id);
        setUser(cached);
        setReady(true);
        await check();
      } else {
        await check();
        if (active) setReady(true);
      }
    });
    return () => {
      active = false;
    };
  }, [check]);

  useEffect(() => {
    onSessionExpired(() => {
      revision.current++;
      apply(null);
    });
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active' && Date.now() - lastCheck.current > REVALIDATE_MS) void check();
    });
    return () => {
      onSessionExpired(null);
      subscription.remove();
    };
  }, [apply, check]);

  const signIn = useCallback(
    async (input: SignInInput) => {
      revision.current++;
      return apply(await authService.signIn(input));
    },
    [apply],
  );

  const register = useCallback((input: SignUpInput) => authService.register(input), []);

  const verifyEmail = useCallback(
    async (email: string, code: string) => {
      revision.current++;
      return apply(await authService.verifyEmail(email, code));
    },
    [apply],
  );

  const forgetSession = useCallback(async () => {
    revision.current++;
    apply(null);
  }, [apply]);

  const signOut = useCallback(async () => {
    await authService.signOut();
    await forgetSession();
  }, [forgetSession]);

  const updateProfile = useCallback(
    async (patch: ProfileWrite) => {
      if (!user) throw new Error('Not signed in');
      const profile = await userService.saveProfile(patch);
      void queryClient.invalidateQueries({ queryKey: queryKeys.profiles });
      return apply({
        ...user,
        fullName: profile.fullName,
        initials: profile.initials,
        bio: profile.bio,
        location: profile.location,
        avatarUrl: profile.avatarUrl,
      });
    },
    [user, apply],
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
    () => ({
      user,
      authenticated: Boolean(user),
      ready,
      signIn,
      register,
      verifyEmail,
      signOut,
      forgetSession,
      updateProfile,
      refreshUser: check,
      requireAuth,
    }),
    [user, ready, signIn, register, verifyEmail, signOut, forgetSession, updateProfile, check, requireAuth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
