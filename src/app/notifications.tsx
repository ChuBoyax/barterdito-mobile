import { router } from 'expo-router';
import { BellRing, ChevronRight } from 'lucide-react-native';
import { StyleSheet } from 'react-native';

import { RequireAuth } from '@/components/layout';
import { NotificationRow } from '@/components/marketplace';
import { Button, Card, EmptyState, LoadingView, Screen } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useToast } from '@/providers';
import { communityService } from '@/services';

export default function NotificationsScreen() {
  return (
    <RequireAuth>
      <NotificationsContent />
    </RequireAuth>
  );
}

function NotificationsContent() {
  const showToast = useToast();
  const { data: notifications = [], loading, setData, reload } = useAsync(() => communityService.getNotifications(), []);

  async function markAllRead() {
    await communityService.markAllNotificationsRead();
    setData((current = []) => current.map((entry) => ({ ...entry, unread: false })));
    showToast('All caught up!');
  }

  if (loading && !notifications.length) return <LoadingView />;

  return (
    <Screen refreshing={loading} onRefresh={() => void reload()}>
      <Button label="Mark all read" variant="ghost" compact style={styles.right} onPress={() => void markAllRead()} />
      {notifications.length ? (
        <Card style={styles.list}>
          {notifications.map((notification) => (
            <NotificationRow key={notification.id} notification={notification} />
          ))}
        </Card>
      ) : (
        <EmptyState icon={BellRing} title="No notifications" text="Offers, hearts, and follows will appear here." />
      )}
      <Button label="View all activity" iconRight={ChevronRight} variant="secondary" onPress={() => router.push('/activity')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  right: { alignSelf: 'flex-end' },
  list: { paddingVertical: 6 },
});
