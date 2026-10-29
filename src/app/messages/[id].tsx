import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ChevronRight, Package } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActionSheetIOS, Alert, AppState, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { MessageBubble, MessageComposer } from '@/components/chat';
import { RequireAuth } from '@/components/layout';
import { shortDate } from '@/components/trades';
import { AppText, Avatar, Badge, Button, LoadingView } from '@/components/ui';
import { usePolling, useTradeConversation } from '@/hooks/useTradeConversation';
import { setNotificationCounts } from '@/hooks/useNotificationCounts';
import { queryClient, useAuth, useTheme } from '@/providers';
import { tradeService } from '@/services';
import { notificationService } from '@/services/notificationService';
import { queryKeys } from '@/services/queryKeys';
import { clientId } from '@/services/tradeService';
import { neu } from '@/theme';
import type { Conversation, TradeMessage } from '@/types/trades';
import { confirmAction } from '@/utils/confirm';
import { errorMessage } from '@/utils/format';
import { confirmations, otherTrader } from '@/utils/trades';

export default function TradeChatScreen() {
  return (
    <RequireAuth>
      <TradeChat />
    </RequireAuth>
  );
}

function messageTime(message: TradeMessage) {
  const time = shortDate(message.createdAt);
  return message.editedAt && !message.deletedAt ? `${time} · edited` : time;
}

function merge(current: TradeMessage[], incoming: TradeMessage[]) {
  return [...new Map([...current, ...incoming].map((entry) => [entry.id, entry])).values()].sort((a, b) => a.id - b.id);
}

/** A few words on what happens next, shown in the trade strip. */
function nextStep(data: Conversation, userId: string) {
  if (data.status === 'completed') return 'Completed · Rate your trade';
  if (data.status === 'cancelled') return 'Trade cancelled';
  if (data.issues.some((entry) => entry.status === 'open')) return 'Paused · Problem reported';
  const { mine, theirs } = confirmations(data, userId);
  if (mine) return 'Waiting for their confirmation';
  if (theirs) return 'They confirmed · Your turn';
  if (data.meetups.some((entry) => entry.status === 'accepted')) return 'Meetup agreed';
  if (data.meetups.some((entry) => entry.status === 'pending')) return 'Meetup proposal waiting';
  return 'Plan a meetup';
}

function TradeChat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const state = useTradeConversation(id);
  const [messages, setMessages] = useState<TradeMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [olderBusy, setOlderBusy] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const pending = useRef<{ body: string; client: string } | null>(null);
  const lock = useRef(false);
  const fetching = useRef(false);
  const revision = useRef(0);
  const followLatest = useRef(true);

  const load = useCallback(async () => {
    if (fetching.current) return;
    fetching.current = true;
    const current = revision.current;
    try {
      const page = await tradeService.getMessages(id);
      if (current !== revision.current) return;
      setMessages((old) => merge(old, page.messages));
      setLoaded((wasLoaded) => {
        if (!wasLoaded) setHasMore(page.hasMore);
        return true;
      });
      setError('');
    } catch (caught) {
      setError(errorMessage(caught, 'Could not load messages.'));
    } finally {
      fetching.current = false;
    }
  }, [id]);

  usePolling(() => void load());

  const newestId = messages.at(-1)?.id;
  const newestRef = useRef<number | undefined>(undefined);
  newestRef.current = newestId;
  const acknowledged = useRef(0);

  // Like the website: acknowledge only when the newest message is on screen (scrolled to the bottom).
  const markRead = useCallback(() => {
    const newest = newestRef.current;
    if (!newest || newest <= acknowledged.current || !followLatest.current || AppState.currentState !== 'active') return;
    acknowledged.current = newest;
    notificationService
      .markChatRead(id, newest)
      .then((counts) => {
        setNotificationCounts(counts);
        void queryClient.invalidateQueries({ queryKey: queryKeys.conversations() });
      })
      .catch(() => {
        acknowledged.current = 0;
      });
  }, [id]);

  useEffect(() => {
    if (loaded) markRead();
  }, [loaded, newestId, markRead]);
  useEffect(() => {
    if (!followLatest.current) return;
    const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
    return () => clearTimeout(timer);
  }, [newestId]);

  const data = state.data;
  if (!user) return null;
  if (!data) {
    if (state.error) {
      return (
        <View style={[styles.center, { backgroundColor: colors.background }]}>
          <AppText variant="h3" align="center">
            {state.error}
          </AppText>
          <Button label="Try again" variant="secondary" onPress={() => void state.reload()} />
        </View>
      );
    }
    return <LoadingView variant="chat" />;
  }

  const userId = user.id;
  const active = data.status === 'active';
  const other = otherTrader(data.offer, userId);
  const mineFirst = data.offer.proposer.id === userId;
  const theirItem = mineFirst ? data.offer.requested : data.offer.offered;
  const yourItem = mineFirst ? data.offer.offered : data.offer.requested;
  const step = nextStep(data, userId);

  async function send() {
    const text = draft.trim();
    if (lock.current || !text) return;
    revision.current++;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      if (editing !== null) {
        const updated = await tradeService.editMessage(id, editing, text);
        setMessages((old) => merge(old, [updated]));
      } else {
        // Reuse the request id when retrying the same text so it is not saved twice.
        if (!pending.current || pending.current.body !== text) pending.current = { body: text, client: clientId() };
        const sent = await tradeService.sendMessage(id, text, pending.current.client);
        setMessages((old) => merge(old, [sent]));
        pending.current = null;
      }
      followLatest.current = true;
      setDraft('');
      setEditing(null);
    } catch (caught) {
      setError(errorMessage(caught, 'Message could not be sent. Try again.'));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  async function remove(message: TradeMessage) {
    if (lock.current) return;
    const ok = await confirmAction({ title: 'Remove this message?', confirmLabel: 'Remove', destructive: true });
    if (!ok) return;
    revision.current++;
    lock.current = true;
    setBusy(true);
    try {
      const removed = await tradeService.removeMessage(id, message.id);
      setMessages((old) => merge(old, [removed]));
      if (editing === message.id) {
        setEditing(null);
        setDraft('');
      }
    } catch (caught) {
      setError(errorMessage(caught, 'Could not remove the message.'));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  async function older() {
    if (!messages.length || olderBusy) return;
    setOlderBusy(true);
    followLatest.current = false;
    try {
      const page = await tradeService.getMessages(id, messages[0]!.id);
      setMessages((old) => merge(old, page.messages));
      setHasMore(page.hasMore);
    } catch (caught) {
      setError(errorMessage(caught, 'Could not load older messages.'));
    } finally {
      setOlderBusy(false);
    }
  }

  function openActions(message: TradeMessage) {
    const edit = () => {
      setEditing(message.id);
      setDraft(message.body);
    };
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions({ options: ['Edit', 'Remove', 'Cancel'], destructiveButtonIndex: 1, cancelButtonIndex: 2 }, (index) => {
        if (index === 0) edit();
        if (index === 1) void remove(message);
      });
      return;
    }
    Alert.alert('Message', undefined, [
      { text: 'Edit', onPress: edit },
      { text: 'Remove', style: 'destructive', onPress: () => void remove(message) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
      {/* The other trader replaces the generic "Trade Chat" title: one header row instead of two. */}
      <Stack.Screen
        options={{
          headerTitle: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`View ${other.fullName}'s profile`}
              onPress={() => router.push(`/traders/${other.id}`)}
              style={styles.person}>
              <Avatar initials={other.initials} imageUrl={other.avatarUrl} size="small" />
              <AppText variant="h3" numberOfLines={1} style={styles.name}>
                {other.fullName}
              </AppText>
            </Pressable>
          ),
          headerRight: active
            ? undefined
            : () => <Badge label={data.status === 'completed' ? 'Completed' : 'Cancelled'} tone={data.status === 'completed' ? 'blue' : 'neutral'} />,
        }}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Trade status: ${step}`}
        onPress={() => router.push(`/trade-complete/${id}`)}
        style={[styles.strip, { backgroundColor: colors.background }, neu(colors, 1, true)]}>
        <View style={styles.thumbs}>
          <Thumb uri={theirItem.imageUrl} />
          <Thumb uri={yourItem.imageUrl} overlap />
        </View>
        <AppText variant="small" color="ink" weight="semibold" numberOfLines={1} style={styles.flex}>
          {step}
        </AppText>
        <ChevronRight size={18} color={colors.muted} />
      </Pressable>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={200}
        onScroll={({ nativeEvent }) => {
          const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
          followLatest.current = contentSize.height - contentOffset.y - layoutMeasurement.height < 120;
          if (followLatest.current) markRead();
        }}>
        {hasMore ? <Button label="Earlier messages" variant="ghost" compact loading={olderBusy} onPress={() => void older()} /> : null}
        {loaded && !messages.length ? (
          <AppText variant="caption" align="center">
            No messages yet
          </AppText>
        ) : null}
        {messages.map((message) =>
          message.kind === 'system' ? (
            <AppText key={message.id} variant="caption" align="center" style={styles.system}>
              {message.body}
            </AppText>
          ) : (
            <MessageBubble
              key={message.id}
              message={{
                id: String(message.id),
                mine: message.senderId === userId,
                text: message.deletedAt ? 'Message removed' : message.body,
                time: messageTime(message),
              }}
              onLongPress={active && message.senderId === userId && !message.deletedAt && !busy ? () => openActions(message) : undefined}
            />
          ),
        )}
      </ScrollView>

      {error || state.error ? (
        <AppText variant="caption" color="red" align="center" style={styles.error}>
          {error || state.error}
        </AppText>
      ) : null}
      {active ? (
        <MessageComposer
          value={draft}
          onChange={(value) => setDraft(value.slice(0, 2000))}
          onSend={() => void send()}
          editing={editing !== null}
          onCancelEdit={() => {
            setEditing(null);
            setDraft('');
          }}
        />
      ) : (
        <AppText variant="caption" align="center" style={styles.readonly}>
          Read-only
        </AppText>
      )}
    </KeyboardAvoidingView>
  );
}

function Thumb({ uri, overlap }: { uri: string | null; overlap?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.thumb, overlap && styles.overlap, { backgroundColor: colors.surface2, borderColor: colors.background }]}>
      {uri ? <Image source={uri} cachePolicy="memory-disk" style={StyleSheet.absoluteFill} contentFit="cover" /> : <Package size={14} color={colors.muted} />}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { maxWidth: 200 },
  strip: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginTop: 6, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 10 },
  thumbs: { flexDirection: 'row' },
  thumb: { width: 34, height: 34, borderRadius: 10, borderWidth: 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  overlap: { marginLeft: -10 },
  list: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 16, gap: 12 },
  system: { alignSelf: 'center', maxWidth: '85%', paddingVertical: 2 },
  error: { paddingHorizontal: 16 },
  readonly: { padding: 16 },
});
