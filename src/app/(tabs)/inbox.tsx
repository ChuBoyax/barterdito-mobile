import { router } from 'expo-router';
import { Archive, Mail, MailOpen, MessageCircle, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';

import { AppHeader, RequireAuth } from '@/components/layout';
import { ThreadRow } from '@/components/marketplace';
import { ActionSheet, AppText, Card, EmptyState, LoadingView, Screen, SegmentedControl, TextField, type ActionSheetOption } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useToast } from '@/providers';
import { messageService } from '@/services';
import type { Thread } from '@/types/models';
import { confirmAction } from '@/utils/confirm';

type Filter = 'all' | 'unread';

export default function InboxScreen() {
  return (
    <RequireAuth>
      <InboxContent />
    </RequireAuth>
  );
}

function InboxContent() {
  const showToast = useToast();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [menuThread, setMenuThread] = useState<Thread | null>(null);
  const { data: threads = [], loading, refreshing, setData, reload } = useAsync(['messageService.getThreads'], () => messageService.getThreads());
  const unreadThreads = threads.filter((thread) => thread.unread > 0).length;

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return threads.filter(
      (thread) =>
        (filter === 'all' || thread.unread > 0) &&
        `${thread.name} ${thread.item ?? ''} ${thread.preview}`.toLowerCase().includes(needle),
    );
  }, [threads, filter, query]);

  const setUnread = (id: string, unread: number) =>
    setData((current = []) => current.map((thread) => (thread.id === id ? { ...thread, unread } : thread)));

  function markRead(thread: Thread) {
    if (!thread.unread) return;
    setUnread(thread.id, 0);
    void messageService.markThreadRead(thread.id);
  }

  function open(thread: Thread) {
    markRead(thread);
    router.push(thread.item ? `/messages/${thread.id}` : `/direct-messages/${thread.id}`);
  }

  async function archive(thread: Thread) {
    const ok = await confirmAction({
      title: 'Archive conversation?',
      message: `Your chat with ${thread.name} will be removed from your inbox.`,
      confirmLabel: 'Archive',
      destructive: true,
    });
    if (!ok) return;
    setData((current = []) => current.filter((entry) => entry.id !== thread.id));
    await messageService.archiveThread(thread.id);
    showToast('Conversation archived');
  }

  const menuOptions = (thread: Thread): ActionSheetOption[] => [
    { label: 'Open conversation', icon: MessageCircle, onPress: () => open(thread) },
    thread.unread
      ? { label: 'Mark as read', icon: MailOpen, onPress: () => markRead(thread) }
      : { label: 'Mark as unread', icon: Mail, onPress: () => setUnread(thread.id, 1) },
    { label: 'Archive conversation', icon: Archive, description: 'Remove it from your inbox', destructive: true, onPress: () => void archive(thread) },
  ];

  const empty = !loading && !threads.length;

  return (
    <Screen refreshing={refreshing} onRefresh={() => void reload()} header={<AppHeader eyebrow="Conversations" title="Inbox" />}>
      {empty ? (
        <EmptyState
          icon={MessageCircle}
          title="No conversations yet"
          text="When you propose a swap or message a trader, your chats will show up here."
          action="Browse items"
          onAction={() => router.navigate('/')}
        />
      ) : (
        <>
          <TextField icon={Search} value={query} onChangeText={setQuery} placeholder="Search by name or item" />
          <SegmentedControl<Filter>
            value={filter}
            onChange={setFilter}
            segments={[
              { value: 'all', label: 'All' },
              { value: 'unread', label: 'Unread', count: unreadThreads || undefined },
            ]}
          />
          {loading && !threads.length ? (
            <LoadingView variant="list" inline />
          ) : visible.length ? (
            <>
              <Card padded={false} style={styles.list}>
                {visible.map((thread, index) => (
                  <ThreadRow
                    key={thread.id}
                    thread={thread}
                    divider={index < visible.length - 1}
                    onPress={() => open(thread)}
                    onLongPress={() => setMenuThread(thread)}
                  />
                ))}
              </Card>
              <AppText variant="caption" align="center">
                Long press a conversation for more options
              </AppText>
            </>
          ) : query.trim() ? (
            <EmptyState icon={Search} title="No results" text={`No conversations match “${query.trim()}”.`} action="Clear search" onAction={() => setQuery('')} />
          ) : (
            <EmptyState icon={MessageCircle} title="You're all caught up" text="No unread messages right now." action="Show all" onAction={() => setFilter('all')} />
          )}
        </>
      )}
      <ActionSheet
        visible={Boolean(menuThread)}
        onClose={() => setMenuThread(null)}
        title={menuThread?.name}
        subtitle={menuThread?.item}
        options={menuThread ? menuOptions(menuThread) : []}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 6 },
});
