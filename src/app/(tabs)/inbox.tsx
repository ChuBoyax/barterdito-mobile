import { router, useLocalSearchParams } from 'expo-router';
import { Archive, ArrowRightLeft, ChevronRight, MessageCircle, MessageSquare, Plus, RotateCcw, Search } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ConversationOptionsSheet, DirectThreadRow, NewMessageSheet } from '@/components/chat';
import { AppHeader, RequireAuth } from '@/components/layout';
import { ConversationCard } from '@/components/trades';
import { AppText, Button, Chip, EmptyState, IconTile, LoadingView, PressableScale, Screen, SegmentedControl, TextField } from '@/components/ui';
import { useMountOnOpen } from '@/hooks/useMountOnOpen';
import { useNotificationCounts } from '@/hooks/useNotificationCounts';
import { usePagedQuery } from '@/hooks/usePagedQuery';
import { usePolling } from '@/hooks/useTradeConversation';
import { useAuth, useTheme } from '@/providers';
import { directMessageService, tradeService } from '@/services';
import { queryKeys } from '@/services/queryKeys';
import { neu } from '@/theme';
import type { DirectConversation, DirectConversationsPage, DirectView } from '@/types/directMessages';
import type { ConversationSummary } from '@/types/trades';
import { errorMessage } from '@/utils/format';

/** Like the website: private messages, trade conversations, and completed trades. */
type Tab = 'messages' | 'offers' | 'completed';

export default function InboxScreen() {
  return (
    <RequireAuth>
      <InboxContent />
    </RequireAuth>
  );
}

const INBOX_POLL_MS = 5_000;
const selectTrades = (page: { conversations: ConversationSummary[]; total: number }) => page.conversations;
const selectDirect = (page: DirectConversationsPage) => page.conversations;

function InboxContent() {
  const params = useLocalSearchParams<{ tab?: Tab }>();
  const [tab, setTab] = useState<Tab>(params.tab === 'offers' || params.tab === 'completed' ? params.tab : 'messages');
  const [search, setSearch] = useState('');
  const [composing, setComposing] = useState(false);
  const composeMounted = useMountOnOpen(composing);
  const counts = useNotificationCounts();
  const direct = tab === 'messages';

  // This tab stays mounted, so a later `/inbox?tab=…` link arrives as a param change. Clearing it lets the same link work again.
  useEffect(() => {
    if (!params.tab) return;
    setTab(params.tab === 'offers' || params.tab === 'completed' ? params.tab : 'messages');
    setSearch('');
    router.setParams({ tab: undefined });
  }, [params.tab]);

  // Views are filtered by the backend before paging, so counts and pages always agree.
  const [view, setView] = useState<DirectView>('all');
  const [optionsFor, setOptionsFor] = useState<DirectConversation | null>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const pms = usePagedQuery(queryKeys.directConversations(view), (offset) => directMessageService.getConversations(offset, view), selectDirect);
  // Keep the last known totals visible while the other view loads.
  const totals = useRef({ all: undefined as number | undefined, unread: undefined as number | undefined, archived: undefined as number | undefined });
  if (pms.firstPage) totals.current = { all: pms.firstPage.allTotal, unread: pms.firstPage.unreadTotal, archived: pms.firstPage.archivedTotal };

  function chip(value: DirectView, label: string) {
    const count = totals.current[value];
    return <Chip label={`${label}${count === undefined ? '' : ` · ${count}`}`} active={view === value} onPress={() => setView(value)} />;
  }

  const trades = usePagedQuery(
    queryKeys.conversations(tab === 'completed' ? 'completed' : 'all'),
    (offset) => tradeService.getConversations(tab === 'completed', offset),
    selectTrades,
  );
  const query = direct ? pms : trades;
  usePolling(() => {
    if (query.data && !query.isFetching) void query.refetch();
  }, INBOX_POLL_MS);

  const needle = search.trim().toLowerCase();
  const visiblePms = useMemo(
    () => pms.rows.filter((row) => [row.other.fullName, row.lastMessage ?? ''].join(' ').toLowerCase().includes(needle)),
    [pms.rows, needle],
  );
  const visibleTrades = useMemo(
    () =>
      trades.rows.filter(({ offer, lastMessage }) =>
        [offer.proposer.fullName, offer.recipient.fullName, offer.offered.title, offer.requested.title, lastMessage].join(' ').toLowerCase().includes(needle),
      ),
    [trades.rows, needle],
  );
  const total = direct ? pms.rows.length : trades.rows.length;
  const shown = direct ? visiblePms.length : visibleTrades.length;

  return (
    <Screen refreshing={query.isRefetching && !query.isFetchingNextPage} onRefresh={() => void query.refetch()} header={<AppHeader title="Inbox" />}>
      <SegmentedControl<Tab>
        value={tab}
        onChange={(next) => {
          setTab(next);
          setSearch('');
        }}
        segments={[
          { value: 'messages', label: 'Messages', count: counts?.unreadDirectMessageCount || undefined },
          { value: 'offers', label: 'Trades', count: counts?.unreadTradeMessageCount || undefined },
          { value: 'completed', label: 'Completed' },
        ]}
      />
      {direct ? (
        <>
          <View style={styles.filters}>
            {chip('all', 'All')}
            {chip('unread', 'Unread')}
            {chip('archived', 'Archived')}
          </View>
          <Button label="New message" icon={Plus} variant="secondary" onPress={() => setComposing(true)} />
        </>
      ) : (
        <OffersShortcut />
      )}
      {total ? <TextField icon={Search} value={search} onChangeText={setSearch} placeholder="Search conversations" /> : null}
      {query.isPending ? (
        <LoadingView variant="list" inline />
      ) : query.isError && !total ? (
        <EmptyState icon={MessageCircle} title="Could not load conversations" text={errorMessage(query.error)} action="Try again" actionIcon={RotateCcw} onAction={() => void query.refetch()} />
      ) : !total ? (
        direct ? (
          view === 'unread' ? (
            <EmptyState
              icon={MessageSquare}
              title="No unread messages"
              text="You’re caught up. Switch to All to see your conversations."
              action="Show all"
              onAction={() => setView('all')}
            />
          ) : view === 'archived' ? (
            <EmptyState
              icon={Archive}
              title="No archived conversations"
              text="Archived conversations stay here until you restore them or a new message arrives."
              action="Show all"
              onAction={() => setView('all')}
            />
          ) : (
            <EmptyState
              icon={MessageSquare}
              title="No private messages yet"
              text="Message a trader from their profile, or start a new conversation here."
              action="New message"
              actionIcon={Plus}
              onAction={() => setComposing(true)}
            />
          )
        ) : (
          <EmptyState
            icon={MessageSquare}
            title={tab === 'completed' ? 'No completed trades yet' : 'No trade conversations yet'}
            text="Accepted trade proposals have their own conversation here. Both traders must confirm the exchange to complete it."
            action="Trade offers"
            onAction={() => router.navigate('/offers')}
          />
        )
      ) : shown ? (
        <>
          <View style={styles.list}>
            {direct
              ? visiblePms.map((row) => (
                  <DirectThreadRow
                    key={row.id}
                    conversation={row}
                    onOptions={(entry) => {
                      setOptionsFor(entry);
                      setOptionsOpen(true);
                    }}
                  />
                ))
              : <TradeRows rows={visibleTrades} />}
          </View>
          {query.hasNextPage ? (
            <Button label="Load more conversations" variant="secondary" loading={query.isFetchingNextPage} onPress={() => void query.fetchNextPage()} />
          ) : null}
        </>
      ) : (
        <EmptyState icon={Search} title="No results" text={`No conversations match “${search.trim()}”.`} action="Clear search" onAction={() => setSearch('')} />
      )}
      {composeMounted ? <NewMessageSheet visible={composing} onClose={() => setComposing(false)} /> : null}
      {optionsFor ? <ConversationOptionsSheet visible={optionsOpen} conversation={optionsFor} showUnread onClose={() => setOptionsOpen(false)} /> : null}
    </Screen>
  );
}

function TradeRows({ rows }: { rows: ConversationSummary[] }) {
  const { user } = useAuth();
  if (!user) return null;
  return rows.map((conversation) => <ConversationCard key={conversation.offer.id} conversation={conversation} userId={user.id} />);
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
        View proposals
      </AppText>
      <View style={[styles.chevron, { backgroundColor: colors.background }, neu(colors, 1, true)]}>
        <ChevronRight size={16} color={colors.orange} />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  shortcut: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 12 },
  chevron: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  list: { gap: 12 },
});
