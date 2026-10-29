import { router } from 'expo-router';
import { ArrowRightLeft, MessageCircle, MessageSquare, RotateCcw, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';

import { AppHeader, RequireAuth } from '@/components/layout';
import { ThreadRow } from '@/components/marketplace';
import { Button, Card, EmptyState, ListRow, LoadingView, Screen, SegmentedControl, TextField } from '@/components/ui';
import { usePagedQuery } from '@/hooks/usePagedQuery';
import { usePolling } from '@/hooks/useTradeConversation';
import { useAuth } from '@/providers';
import { tradeService } from '@/services';
import type { ConversationSummary } from '@/types/trades';
import { errorMessage } from '@/utils/format';
import { otherTrader } from '@/utils/trades';
import { queryKeys } from '@/services/queryKeys';

type Filter = 'all' | 'completed';

const statusLabels = { active: 'Active trade', completed: 'Completed trade', cancelled: 'Cancelled trade' } as const;

export default function InboxScreen() {
  return (
    <RequireAuth>
      <InboxContent />
    </RequireAuth>
  );
}

function shortDate(value: string) {
  const date = new Date(value);
  const today = new Date();
  return date.toDateString() === today.toDateString()
    ? date.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })
    : date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

const INBOX_POLL_MS = 10_000;
const selectConversations = (page: { conversations: ConversationSummary[]; total: number }) => page.conversations;

function InboxContent() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const query = usePagedQuery(queryKeys.conversations(filter), (offset) => tradeService.getConversations(filter === 'completed', offset), selectConversations);
  // The inbox only needs a gentle refresh; open chats poll faster on their own screen.
  usePolling(() => {
    if (query.data && !query.isFetching) void query.refetch();
  }, INBOX_POLL_MS);

  const rows = query.rows;
  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return rows.filter(({ offer, lastMessage }) =>
      [offer.proposer.fullName, offer.recipient.fullName, offer.offered.title, offer.requested.title, lastMessage].join(' ').toLowerCase().includes(needle),
    );
  }, [rows, search]);

  return (
    <Screen refreshing={query.isRefetching && !query.isFetchingNextPage} onRefresh={() => void query.refetch()} header={<AppHeader eyebrow="Conversations" title="Inbox" />}>
      <Card style={styles.offers}>
        <ListRow icon={ArrowRightLeft} title="Trade offers" subtitle="Review received proposals or check those you sent" onPress={() => router.navigate('/offers')} />
      </Card>
      <SegmentedControl<Filter>
        value={filter}
        onChange={setFilter}
        segments={[
          { value: 'all', label: 'Messages' },
          { value: 'completed', label: 'Completed' },
        ]}
      />
      {rows.length ? <TextField icon={Search} value={search} onChangeText={setSearch} placeholder="Search loaded conversations" /> : null}
      {query.isPending ? (
        <LoadingView variant="list" inline />
      ) : query.isError && !rows.length ? (
        <EmptyState icon={MessageCircle} title="Could not load conversations" text={errorMessage(query.error)} action="Try again" actionIcon={RotateCcw} onAction={() => void query.refetch()} />
      ) : !rows.length ? (
        <EmptyState
          icon={MessageSquare}
          title={filter === 'completed' ? 'No completed trades yet' : 'No trade conversations yet'}
          text="Accepted proposals appear here. Both traders must confirm an exchange to complete it."
          action="Trade offers"
          onAction={() => router.navigate('/offers')}
        />
      ) : visible.length && user ? (
        <>
          <Card padded={false} style={styles.list}>
            {visible.map(({ offer, status, lastMessage, updatedAt }, index) => {
              const other = otherTrader(offer, user.id);
              return (
                <ThreadRow
                  key={offer.id}
                  thread={{
                    id: offer.id,
                    name: other.fullName,
                    initials: other.initials,
                    item: `${offer.offered.title} ↔ ${offer.requested.title}`,
                    preview: `${statusLabels[status]} · ${lastMessage}`,
                    time: shortDate(updatedAt),
                    unread: 0,
                  }}
                  divider={index < visible.length - 1}
                  onPress={() => router.push(`/messages/${offer.id}`)}
                />
              );
            })}
          </Card>
          {query.hasNextPage ? (
            <Button label="Load more conversations" variant="secondary" loading={query.isFetchingNextPage} onPress={() => void query.fetchNextPage()} />
          ) : null}
        </>
      ) : (
        <EmptyState icon={Search} title="No results" text={`No conversations match “${search.trim()}”.`} action="Clear search" onAction={() => setSearch('')} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  offers: { paddingVertical: 4 },
  list: { padding: 6 },
});
