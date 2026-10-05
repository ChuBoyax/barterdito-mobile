import { StyleSheet } from 'react-native';

import { RequireAuth } from '@/components/layout';
import { NotificationRow } from '@/components/marketplace';
import { Card, LoadingView, Screen } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { communityService } from '@/services';

export default function ActivityScreen() {
  return (
    <RequireAuth>
      <ActivityContent />
    </RequireAuth>
  );
}

function ActivityContent() {
  const { data: activity = [], loading, reload } = useAsync(() => communityService.getActivity(), []);
  if (loading && !activity.length) return <LoadingView />;
  return (
    <Screen refreshing={loading} onRefresh={() => void reload()}>
      <Card padded={false} style={styles.list}>
        {activity.map((entry) => (
          <NotificationRow key={entry.id} notification={entry} />
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { overflow: 'hidden' },
});
