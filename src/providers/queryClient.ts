import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { focusManager, QueryClient, type Query } from '@tanstack/react-query';
import type { PersistQueryClientOptions } from '@tanstack/react-query-persist-client';
import Constants from 'expo-constants';
import { AppState, Platform } from 'react-native';

/** How long a saved cache is trusted for an instant first paint. */
const CACHE_MAX_AGE = 24 * 60 * 60_000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Show cached data immediately and refresh in the background once it is 30s old.
      staleTime: 30_000,
      // Keep data around as long as the saved cache, so restored screens render instantly.
      gcTime: CACHE_MAX_AGE,
      retry: 1,
    },
  },
});

/**
 * The query cache is saved to device storage, so reopening the app shows the last
 * listings, profile and trades right away while fresh data loads. Only successful
 * results are saved; the cache is reset whenever the signed-in account changes.
 */
export const persistOptions: Omit<PersistQueryClientOptions, 'queryClient'> = {
  persister: createAsyncStoragePersister({ storage: AsyncStorage, key: 'barterdito-query-cache', throttleTime: 1000 }),
  maxAge: CACHE_MAX_AGE,
  // A new app version discards caches shaped by older code.
  buster: Constants.expoConfig?.version ?? '1',
  // Queries can opt out with `meta: { persist: false }` (e.g. large, static address lists).
  dehydrateOptions: { shouldDehydrateQuery: (query: Query) => query.state.status === 'success' && query.meta?.persist !== false },
};

AppState.addEventListener('change', (status) => {
  if (Platform.OS !== 'web') focusManager.setFocused(status === 'active');
});
