import { useInfiniteQuery } from '@tanstack/react-query';
import { router, type Href } from 'expo-router';
import { AlertTriangle, ArrowRightLeft, BellRing, CalendarDays, CheckCircle2, MessageCircle, RotateCcw, Star, type LucideIcon } from 'lucide-react-native';
import { memo, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card, EmptyState, IconTile, LoadingView, PressableScale, Screen } from '@/components/ui';
import { setNotificationCounts } from '@/hooks/useNotificationCounts';
import { queryClient, useToast } from '@/providers';
import { notificationService, type AppNotification, type NotificationsPage } from '@/services/notificationService';
import { timeAgo } from '@/services/itemService';
import { queryKeys } from '@/services/queryKeys';
import type { Tone } from '@/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { errorMessage } from '@/utils/format';

type Pages = { pages: NotificationsPage[]; pageParams: (number | null)[] };

/** Icon per backend event kind (offer_*, message, meetup_*, problem_*, trade_completed, review_received). */
function iconFor(kind: string): { icon: LucideIcon; tone: Tone } {
  if (kind === 'message') return { icon: MessageCircle, tone: 'blue' };
  if (kind.startsWith('meetup_')) return { icon: CalendarDays, tone: 'violet' };
  if (kind.startsWith('problem_')) return { icon: AlertTriangle, tone: 'red' };
  if (kind === 'trade_completed' || kind === 'exchange_confirmed') return { icon: CheckCircle2, tone: 'green' };
  if (kind === 'review_received') return { icon: Star, tone: 'yellow' };
  return { icon: ArrowRightLeft, tone: 'orange' };
}

/** Marks notifications read in the cached pages so the list updates immediately. */
function markCached(update: (entry: AppNotification) => boolean) {
  const now = new Date().toISOString();
  queryClient.setQueryData<Pages>(queryKeys.notificationList, (current) =>
    current && {
      ...current,
      pages: current.pages.map((page) => ({
        ...page,
        notifications: page.notifications.map((entry) => (!entry.readAt && update(entry) ? { ...entry, readAt: now } : entry)),
      })),
    },
  );
}

/** Private trade notifications with read state; used by the Notifications and Activity screens. */
export function NotificationList() {
  const showToast = useToast();
  const [busy, setBusy] = useState(false);
  const query = useInfiniteQuery({
    queryKey: queryKeys.notificationList,
    queryFn: ({ pageParam }) => notificationService.getPage(pageParam),
    initialPageParam: null as number | null,
    getNextPageParam: (last) => (last.hasMore ? last.nextBeforeId : undefined),
  });
  const notifications = useMemo(() => query.data?.pages.flatMap((page) => page.notifications) ?? [], [query.data]);
  const unread = notifications.some((entry) => !entry.readAt);

  async function open(notification: AppNotification) {
    if (!notification.readAt) {
      markCached((entry) => entry.id === notification.id);
      notificationService
        .markRead(notification.id)
        .then(setNotificationCounts)
        .catch(() => undefined);
    }
    router.push(notification.href as Href);
  }

  async function markAll() {
    const latest = notifications[0]?.id;
    if (!latest || busy) return;
    setBusy(true);
    try {
      setNotificationCounts(await notificationService.markAllRead(latest));
      markCached((entry) => entry.id <= latest);
    } catch (caught) {
      showToast(errorMessage(caught, 'Could not mark notifications as read'));
    } finally {
      setBusy(false);
    }
  }

  if (query.isPending) return <LoadingView variant="list" />;

  return (
    <Screen refreshing={query.isRefetching && !query.isFetchingNextPage} onRefresh={() => void query.refetch()}>
      {query.isError && !notifications.length ? (
        <EmptyState icon={BellRing} title="Could not load notifications" text={errorMessage(query.error)} action="Try again" actionIcon={RotateCcw} onAction={() => void query.refetch()} />
      ) : !notifications.length ? (
        <EmptyState icon={BellRing} title="You’re all caught up" text="Trade updates will appear here." />
      ) : (
        <>
          {unread ? <Button label="Mark all read" variant="ghost" compact loading={busy} style={styles.right} onPress={() => void markAll()} /> : null}
          <Card padded={false} style={styles.list}>
            {notifications.map((notification, index) => (
              <NotificationItem key={notification.id} notification={notification} divider={index > 0} onPress={open} />
            ))}
          </Card>
          {query.hasNextPage ? (
            <Button label="More" variant="secondary" loading={query.isFetchingNextPage} onPress={() => void query.fetchNextPage()} />
          ) : null}
        </>
      )}
    </Screen>
  );
}

const NotificationItem = memo(function NotificationItem({
  notification,
  divider,
  onPress,
}: {
  notification: AppNotification;
  divider: boolean;
  onPress: (notification: AppNotification) => void;
}) {
  const { colors } = useTheme();
  const { icon, tone } = iconFor(notification.kind);
  const unread = !notification.readAt;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${unread ? 'Unread. ' : ''}${notification.text}`}
      onPress={() => onPress(notification)}
      scaleTo={0.98}
      style={[styles.row, divider && { borderTopColor: colors.hairline, borderTopWidth: StyleSheet.hairlineWidth }]}>
      <IconTile icon={icon} tone={tone} size={40} rounded />
      <View style={styles.body}>
        <AppText variant="small" color="ink" weight={unread ? 'bold' : 'medium'} numberOfLines={2}>
          {notification.text}
        </AppText>
        <AppText variant="caption">{timeAgo(notification.createdAt)}</AppText>
      </View>
      {unread ? <View style={[styles.dot, { backgroundColor: colors.orange }]} /> : null}
    </PressableScale>
  );
});

const styles = StyleSheet.create({
  right: { alignSelf: 'flex-end', marginBottom: -6 },
  list: { paddingHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  body: { flex: 1, minWidth: 0, gap: 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
