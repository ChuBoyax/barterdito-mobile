/**
 * Shared helpers for the mock services layer.
 *
 * Every service function is async and returns plain domain models, so the UI
 * never knows whether data came from mocks, Supabase, or a REST API.
 * To connect the real backend, replace the body of each service function and
 * keep its signature. Screens and hooks should not need to change.
 */

/** Simulated network latency for mock responses (ms). Set to 0 to disable. */
const MOCK_LATENCY = 350;

export function delay<T>(value: T, ms = MOCK_LATENCY): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/** Deep-copies mock data so callers can't mutate the in-memory "database". */
export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export class ServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServiceError';
  }
}

/**
 * Base URL of the existing Next.js backend (AI, notifications, payments).
 * Unused while running on mocks. Set EXPO_PUBLIC_API_URL when wiring it up.
 */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';
