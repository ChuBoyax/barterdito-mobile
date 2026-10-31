import { useQuery } from '@tanstack/react-query';

import { queryClient, useAuth } from '@/providers';
import { notificationService, type NotificationCounts } from '@/services/notificationService';
import { queryKeys } from '@/services/queryKeys';

/** Same cadence as the website; React Query pauses it while the app is in the background. */
const POLL_MS = 5000;

async function loadCounts(): Promise<NotificationCounts> {
  const previous = queryClient.getQueryData<NotificationCounts>(queryKeys.notificationCounts);
  const next = await notificationService.getCounts();
  // A new event or message: refresh the lists that show it.
  if (previous && (previous.latestId !== next.latestId || previous.unreadMessageCount !== next.unreadMessageCount)) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.notificationList });
    void queryClient.invalidateQueries({ queryKey: queryKeys.conversations() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.directConversations });
  }
  return next;
}

/** Unread notification and message counts for the signed-in user (undefined when signed out). */
export function useNotificationCounts(): NotificationCounts | undefined {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: queryKeys.notificationCounts,
    queryFn: loadCounts,
    enabled: Boolean(user),
    staleTime: 0,
    refetchInterval: POLL_MS,
  });
  return user ? data : undefined;
}

/** Applies counts returned by a mark-read call so badges update without waiting for the next poll. */
export function setNotificationCounts(counts: NotificationCounts) {
  queryClient.setQueryData<NotificationCounts>(queryKeys.notificationCounts, {
    unreadCount: counts.unreadCount,
    unreadMessageCount: counts.unreadMessageCount,
    unreadConversationCount: counts.unreadConversationCount,
    unreadDirectMessageCount: counts.unreadDirectMessageCount,
    unreadTradeMessageCount: counts.unreadTradeMessageCount,
    latestId: counts.latestId,
  });
}
