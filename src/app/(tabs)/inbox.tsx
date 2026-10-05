import { router } from 'expo-router';
import { ArrowRight, CheckCircle2, Search } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { AppHeader, RequireAuth } from '@/components/layout';
import { ThreadRow } from '@/components/marketplace';
import { Card, EmptyState, LoadingView, Screen, SegmentedControl, TextField } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useToast } from '@/providers';
import { messageService } from '@/services';

type Tab = 'messages' | 'offers' | 'trades';

export default function InboxScreen() {
  return (
    <RequireAuth>
      <InboxContent />
    </RequireAuth>
  );
}

function InboxContent() {
  const showToast = useToast();
  const [tab, setTab] = useState<Tab>('messages');
  const [query, setQuery] = useState('');
  const { data: threads = [], loading, setData, reload } = useAsync(() => messageService.getThreads(), []);
  const unread = threads.reduce((sum, thread) => sum + thread.unread, 0);
  const visible = threads.filter((thread) =>
    `${thread.name} ${thread.item ?? ''} ${thread.preview}`.toLowerCase().includes(query.trim().toLowerCase()),
  );

  async function archive(id: string) {
    await messageService.archiveThread(id);
    setData((current = []) => current.filter((thread) => thread.id !== id));
    showToast('Conversation archived');
  }

  return (
    <Screen refreshing={loading} onRefresh={() => void reload()} header={<AppHeader eyebrow="Conversations" title="Inbox" />}>
      <SegmentedControl<Tab>
        value={tab}
        onChange={setTab}
        segments={[
          { value: 'messages', label: 'Messages', count: unread || undefined },
          { value: 'offers', label: 'Offers' },
          { value: 'trades', label: 'Completed' },
        ]}
      />
      {tab === 'messages' ? (
        <>
          <TextField icon={Search} value={query} onChangeText={setQuery} placeholder="Search conversations" />
          {loading && !threads.length ? (
            <LoadingView />
          ) : visible.length ? (
            <Card style={styles.list}>
              {visible.map((thread) => (
                <ThreadRow
                  key={thread.id}
                  thread={thread}
                  onPress={() => router.push(`/messages/${thread.id}`)}
                  onArchive={() => void archive(thread.id)}
                />
              ))}
            </Card>
          ) : (
            <EmptyState icon={Search} title="No conversations" text="Try a different search or start a trade." />
          )}
        </>
      ) : tab === 'offers' ? (
        <EmptyState
          icon={ArrowRight}
          title="Your offers live here"
          text="Open Trade Offers to review and respond to every proposal."
          action="View offers"
          actionIcon={ArrowRight}
          onAction={() => router.navigate('/offers')}
        />
      ) : (
        <EmptyState icon={CheckCircle2} title="No completed trades yet" text="Finished trade conversations will be archived here." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingVertical: 6 },
});


