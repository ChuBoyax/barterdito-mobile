import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { queryClient, useMarketplaceActions } from '@/providers';
import { tradeService } from '@/services';
import type { Conversation } from '@/types/trades';
import { errorMessage } from '@/utils/format';
import { queryKeys } from '@/services/queryKeys';

export const POLL_MS = 3000;

/** Runs `task` now and every `interval` ms while the screen is focused and the app is in the foreground. */
export function usePolling(task: () => void, interval = POLL_MS) {
  const latest = useRef(task);
  useEffect(() => {
    latest.current = task;
  }, [task]);

  useFocusEffect(
    useCallback(() => {
      latest.current();
      const timer = setInterval(() => {
        if (AppState.currentState === 'active') latest.current();
      }, interval);
      const subscription = AppState.addEventListener('change', (status) => {
        if (status === 'active') latest.current();
      });
      return () => {
        clearInterval(timer);
        subscription.remove();
      };
    }, [interval]),
  );
}

/** Accepted-trade state (meetups, confirmations, problem reports, reviews), polled like the website. */
export function useTradeConversation(id: string) {
  const { refresh: refreshListings } = useMarketplaceActions();
  const [data, setData] = useState<Conversation | null>(null);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const mutating = useRef(false);
  const loading = useRef(false);
  const revision = useRef(0);

  const load = useCallback(async () => {
    if (loading.current || mutating.current) return;
    loading.current = true;
    const current = revision.current;
    try {
      const next = await tradeService.getConversation(id);
      if (!mutating.current && current === revision.current) {
        setData(next);
        setLoadError('');
      }
    } catch (error) {
      setLoadError(errorMessage(error, 'Could not load this trade.'));
    } finally {
      loading.current = false;
    }
  }, [id]);

  usePolling(() => void load());

  const act = useCallback(
    async (operation: () => Promise<Conversation>) => {
      if (mutating.current) return false;
      revision.current++;
      mutating.current = true;
      setBusy(true);
      setActionError('');
      try {
        setData(await operation());
        setLoadError('');
        // Completion and cancellation change listing and offer states.
        void queryClient.invalidateQueries({ queryKey: queryKeys.offers() });
        void queryClient.invalidateQueries({ queryKey: queryKeys.myItems });
        void queryClient.invalidateQueries({ queryKey: queryKeys.profiles });
        void refreshListings();
        return true;
      } catch (error) {
        setActionError(errorMessage(error, 'Could not update this trade.'));
        return false;
      } finally {
        mutating.current = false;
        setBusy(false);
      }
    },
    [refreshListings],
  );

  return { data, error: actionError || loadError, busy, reload: load, act };
}

export type TradeConversationState = ReturnType<typeof useTradeConversation>;
