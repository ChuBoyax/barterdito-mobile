import Constants from 'expo-constants';

/**
 * HTTP transport for the FastAPI backend. Like the website, the app uses the cookie
 * session (`/session/*`): the native networking layer stores the HTTP-only cookies,
 * and every request carries the website origin so the backend's origin check accepts it.
 */

function developmentApiUrl() {
  // The computer running `npx expo start` also runs the backend during development.
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return `http://${host || 'localhost'}:5000`;
}

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || developmentApiUrl()).replace(/\/$/, '');
export const SITE_URL = (process.env.EXPO_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly detail?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const fieldLabels: Record<string, string> = {
  email: 'Email address',
  full_name: 'Full name',
  password: 'Password',
  new_password: 'New password',
  current_password: 'Current password',
  code: 'Verification code',
  title: 'Title',
  description: 'Description',
  category: 'Category',
  condition: 'Condition',
  looking_for: 'Looking for',
  location: 'Location',
  tags: 'Tags',
  images: 'Photos',
  bio: 'Bio',
  avatar: 'Profile photo',
};

/** FastAPI validation failures use a detail array; ordinary failures use a string. */
export function errorDetail(detail: unknown): string | null {
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (!Array.isArray(detail)) return null;
  const issue = detail.find((entry) => typeof entry === 'object' && entry !== null && typeof entry.msg === 'string');
  if (!issue) return null;
  const field = Array.isArray(issue.loc) ? issue.loc.find((part: unknown) => typeof part === 'string' && fieldLabels[part]) : null;
  const message = String(issue.msg).replace(/^Value error,\s*/i, '');
  return field ? `${fieldLabels[field]}: ${message}` : message;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  timeout?: number;
};

export async function apiRequest<T>(path: string, { method = 'GET', body, timeout = 20_000 }: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      credentials: 'include',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Cache-Control': 'no-cache',
        Origin: SITE_URL,
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      controller.signal.aborted ? 'The server took too long to respond. Please try again.' : 'Cannot reach the server. Check your connection and try again.',
    );
  } finally {
    clearTimeout(timer);
  }
  const result: unknown = await response.json().catch(() => null);
  const detail = result && typeof result === 'object' && 'detail' in result ? result.detail : null;
  if (!response.ok) {
    const message =
      response.status >= 500 && response.status !== 503
        ? 'The service is temporarily unavailable. Please try again later.'
        : errorDetail(detail) || 'The request could not be completed.';
    throw new ApiError(message, response.status, detail);
  }
  if (result === null) throw new ApiError('The server returned an invalid response.', response.status);
  return result as T;
}

export function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

/** Absolute URL for photo paths returned by the backend. */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return path.startsWith('/') ? `${API_URL}${path}` : path;
}

/** Reverse of mediaUrl, so an edited listing can keep its stored photos. */
export function storedMediaPath(url: string): string {
  return url.startsWith(`${API_URL}/`) ? url.slice(API_URL.length) : url;
}

let inFlightRefresh: Promise<unknown> | null = null;
let expiredListener: (() => void) | null = null;

export function onSessionExpired(listener: (() => void) | null) {
  expiredListener = listener;
}

export function refreshSession(): Promise<unknown> {
  if (!inFlightRefresh) {
    inFlightRefresh = apiRequest('/session/refresh', { method: 'POST', body: {} }).finally(() => {
      inFlightRefresh = null;
    });
  }
  return inFlightRefresh;
}

/** Protected endpoints reject 401 before mutating, so one retry after a refresh is safe. */
export async function authenticatedRequest<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    try {
      await refreshSession();
    } catch (cause) {
      if (isUnauthorized(cause)) {
        expiredListener?.();
        throw new ApiError('Your session has expired. Please sign in again.', 401);
      }
      throw cause;
    }
    return operation();
  }
}
