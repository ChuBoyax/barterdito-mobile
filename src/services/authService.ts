import type { User } from '@/types/models';
import { initialsOf } from '@/utils/format';
import { ApiError, apiRequest, authenticatedRequest, errorDetail, isUnauthorized, mediaUrl, refreshSession } from './api';
import { toArea, type AreaRow } from './locationService';

export type SignInInput = { email: string; password: string };
export type SignUpInput = SignInInput & { fullName: string };

export type ApiUser = AreaRow & {
  id: string;
  email: string;
  full_name: string;
  bio?: string;
  avatar_url?: string | null;
  email_verified: boolean;
  created_at: string;
};

type Message = { message: string };

export function joinedLabel(createdAt: string): string {
  const date = new Date(createdAt);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-PH', { month: 'short', year: 'numeric' });
}

export function toUser(user: ApiUser): User {
  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    initials: initialsOf(user.full_name) || 'BD',
    bio: user.bio ?? '',
    ...toArea(user),
    avatarUrl: mediaUrl(user.avatar_url),
    emailVerified: user.email_verified,
    createdAt: user.created_at,
    joined: joinedLabel(user.created_at),
  };
}

function isApiUser(value: unknown): value is ApiUser {
  if (typeof value !== 'object' || value === null) return false;
  const user = value as Record<string, unknown>;
  return typeof user.id === 'string' && typeof user.email === 'string' && typeof user.full_name === 'string';
}

/** Same wording rules as the website's auth client, pointed at the mobile settings. */
function authError(error: unknown): Error {
  const status = error instanceof ApiError ? error.status : undefined;
  const detail = error instanceof ApiError ? errorDetail(error.detail) : null;
  if (status === 404) return new ApiError('Authentication endpoint not found. Check that EXPO_PUBLIC_API_URL points to the Barterdito backend.', status);
  if (status && status >= 500) {
    return new ApiError(status === 503 && detail ? detail : 'Authentication server is unavailable. Please try again later.', status);
  }
  if (status === 403 && detail === 'Invalid request origin') {
    return new ApiError('The backend rejected this app. Add EXPO_PUBLIC_SITE_URL to CORS_ORIGINS in the backend .env.', status);
  }
  if (status && status >= 400) return new ApiError(detail || 'Authentication request failed. Please check your details and try again.', status);
  if (error instanceof Error) return error;
  return new ApiError('Cannot reach the authentication server.');
}

async function send<T>(action: string, body?: Record<string, string>): Promise<T> {
  try {
    return await apiRequest<T>(`/session/${action}`, body ? { method: 'POST', body } : {});
  } catch (error) {
    throw authError(error);
  }
}

async function signedIn(result: unknown): Promise<User> {
  if (!isApiUser(result)) throw new ApiError('Authentication server returned an invalid response.');
  // Do not report success unless the session cookie was actually stored.
  try {
    return toUser(await apiRequest<ApiUser>('/session/me'));
  } catch (error) {
    if (isUnauthorized(error)) {
      throw new ApiError('Signed in, but the session could not be saved on this device. Check the backend cookie settings.');
    }
    throw authError(error);
  }
}

export const authService = {
  async signIn({ email, password }: SignInInput): Promise<User> {
    return signedIn(await send('login', { email: email.trim().toLowerCase(), password }));
  },

  /** Starts a pending registration; the account is created by verifyEmail. */
  async register({ email, password, fullName }: SignUpInput): Promise<void> {
    await send<Message>('register', { email: email.trim().toLowerCase(), full_name: fullName.trim(), password });
  },

  async verifyEmail(email: string, code: string): Promise<User> {
    return signedIn(await send('verify-email', { email, code }));
  },

  async resendVerification(email: string): Promise<void> {
    await send<Message>('resend-verification', { email });
  },

  async forgotPassword(email: string): Promise<void> {
    await send<Message>('forgot-password', { email: email.trim().toLowerCase() });
  },

  async resendPasswordReset(email: string): Promise<void> {
    await send<Message>('resend-password-reset', { email });
  },

  async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    await send<Message>('reset-password', { email, code, new_password: newPassword });
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await authenticatedRequest(() => send<Message>('change-password', { current_password: currentPassword, new_password: newPassword }));
  },

  /** Current session user; rejects with a 401 ApiError when signed out. */
  async me(): Promise<User> {
    try {
      return toUser(await apiRequest<ApiUser>('/session/me'));
    } catch (error) {
      if (!isUnauthorized(error)) throw authError(error);
      const refreshed = await refreshSession();
      if (!isApiUser(refreshed)) throw new ApiError('Authentication server returned an invalid response.');
      return toUser(refreshed);
    }
  },

  async signOut(): Promise<void> {
    await send<Message>('logout', {});
  },
};
