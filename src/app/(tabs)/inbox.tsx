import { router } from 'expo-router';
import { ArrowRightLeft, ChevronRight, MessageCircle, MessageSquare, RotateCcw, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppHeader, RequireAuth } from '@/components/layout';
import { ConversationCard } from '@/components/trades';
import { AppText, Button, EmptyState, IconTile, LoadingView, PressableScale, Screen, SegmentedControl, TextField } from '@/components/ui';
import { usePagedQuery } from '@/hooks/usePagedQuery';
import { usePolling } from '@/hooks/useTradeConversation';
import { useAuth, useTheme } from '@/providers';
import { tradeService } from '@/services';
import { queryKeys } from '@/services/queryKeys';
import { neu } from '@/theme';
import type { ConversationSummary } from '@/types/trades';
import { errorMessage } from '@/utils/format';

type Filter = 'all' | 'completed';

export default function InboxScreen() {
  return (
    <RequireAuth>
      <InboxContent />
    </RequireAuth>
  );
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
    <Screen
      refreshing={query.isRefetching && !query.isFetchingNextPage}
      onRefresh={() => void query.refetch()}
      header={<AppHeader title="Inbox" />}>
      <OffersShortcut />
      <SegmentedControl<Filter>
        value={filter}
        onChange={setFilter}
        segments={[
          { value: 'all', label: 'Messages' },
          { value: 'completed', label: 'Completed' },
        ]}
      />
      {rows.length ? <TextField icon={Search} value={search} onChangeText={setSearch} placeholder="Search" /> : null}
      {query.isPending ? (
        <LoadingView variant="list" inline />
      ) : query.isError && !rows.length ? (
        <EmptyState icon={MessageCircle} title="Could not load conversations" text={errorMessage(query.error)} action="Try again" actionIcon={RotateCcw} onAction={() => void query.refetch()} />
      ) : !rows.length ? (
        <EmptyState
          icon={MessageSquare}
          title={filter === 'completed' ? 'No completed trades yet' : 'No trade conversations yet'}
          text="Accepted trades appear here."
          action="Trade offers"
          onAction={() => router.navigate('/offers')}
        />
      ) : visible.length && user ? (
        <>
          <View style={styles.list}>
            {visible.map((conversation) => (
              <ConversationCard key={conversation.offer.id} conversation={conversation} userId={user.id} />
            ))}
          </View>
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

function OffersShortcut() {
  const { colors } = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel="Trade offers"
      onPress={() => router.navigate('/offers')}
      scaleTo={0.98}
      style={[styles.shortcut, { backgroundColor: colors.surface }, neu(colors, 2)]}>
      <IconTile icon={ArrowRightLeft} variant="solid" size={40} />
      <AppText variant="h3" style={styles.flex}>
        Trade offers
      </AppText>
      <View style={[styles.chevron, { backgroundColor: colors.background }, neu(colors, 1, true)]}>
        <ChevronRight size={16} color={colors.orange} />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  shortcut: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 12 },
  chevron: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  list: { gap: 12 },
});
