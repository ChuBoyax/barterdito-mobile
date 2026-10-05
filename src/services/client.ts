
const MOCK_LATENCY = 350;

export function delay<T>(value: T, ms = MOCK_LATENCY): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}


export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export class ServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServiceError';
  }
}

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';
