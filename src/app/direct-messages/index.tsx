import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { StyleSheet } from 'react-native';

import { RequireAuth } from '@/components/layout';
import { ThreadRow } from '@/components/marketplace';
import { Button, Card, LoadingView, Screen, SectionHeading } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useToast } from '@/providers';
import { messageService } from '@/services';

export default function DirectMessagesScreen() {
  return (
    <RequireAuth>
      <DirectMessagesContent />
    </RequireAuth>
  );
}

function DirectMessagesContent() {
  const showToast = useToast();
  const { data: threads = [], loading } = useAsync(['messageService.getThreads'], () => messageService.getThreads());
  return (
    <Screen>
      <SectionHeading eyebrow="Private conversations" title="Direct Messages" />
      <Button label="New message" icon={Plus} compact onPress={() => showToast('New message composer coming soon')} />
      {loading ? (
        <LoadingView variant="list" inline />
      ) : (
        <Card style={styles.list}>
          {threads.map((thread) => (
            <ThreadRow key={thread.id} thread={{ ...thread, item: undefined }} onPress={() => router.push(`/direct-messages/${thread.id}`)} />
          ))}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingVertical: 6 },
});
