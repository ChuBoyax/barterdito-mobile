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
  const { data: activity = [], loading, refreshing, reload } = useAsync(['communityService.getActivity'], () => communityService.getActivity());
  if (loading && !activity.length) return <LoadingView variant="list" />;
  return (
    <Screen refreshing={refreshing} onRefresh={() => void reload()}>
      <Card style={styles.list}>
        {activity.map((entry) => (
          <NotificationRow key={entry.id} notification={entry} />
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingVertical: 6 },
});
