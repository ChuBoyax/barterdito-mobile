import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ChevronRight, ClipboardList } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActionSheetIOS, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { MessageBubble, MessageComposer } from '@/components/chat';
import { RequireAuth } from '@/components/layout';
import { TradePair } from '@/components/trades';
import { AppText, Avatar, Button, LoadingView } from '@/components/ui';
import { usePolling, useTradeConversation } from '@/hooks/useTradeConversation';
import { useAuth, useTheme } from '@/providers';
import { tradeService } from '@/services';
import { clientId } from '@/services/tradeService';
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
  const time = new Date(message.createdAt).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  return message.editedAt && !message.deletedAt ? `${time} · edited` : time;
}

function merge(current: TradeMessage[], incoming: TradeMessage[]) {
  return [...new Map([...current, ...incoming].map((entry) => [entry.id, entry])).values()].sort((a, b) => a.id - b.id);
}

/** One-line summary of what happens next, shown above the chat. */
function nextStep(data: Conversation, userId: string) {
  if (data.status === 'completed') return 'Trade completed. Rate your trade.';
  if (data.status === 'cancelled') return 'This trade was cancelled.';
  if (data.issues.some((entry) => entry.status === 'open')) return 'Completion paused: a problem was reported.';
  const { mine, theirs } = confirmations(data, userId);
  if (mine) return 'You confirmed. Waiting for the other trader.';
  if (theirs) return 'The other trader confirmed the exchange.';
  if (data.meetups.some((entry) => entry.status === 'accepted')) return 'Meetup agreed. Confirm after the exchange.';
  if (data.meetups.some((entry) => entry.status === 'pending')) return 'A meetup proposal is waiting.';
  return 'Arrange a public meetup.';
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
  const proposerMine = data.offer.proposer.id === userId;

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
      <Stack.Screen options={{ title: 'Trade Chat' }} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View ${other.fullName}'s profile`}
        onPress={() => router.push(`/traders/${other.id}`)}
        style={[styles.chatHeader, { borderBottomColor: colors.line, backgroundColor: colors.surface }]}>
        <Avatar initials={other.initials} imageUrl={other.avatarUrl} size="small" />
        <View style={styles.flex}>
          <AppText variant="h3">{other.fullName}</AppText>
          <AppText variant="caption" numberOfLines={1}>
            Private trade conversation · {data.status}
          </AppText>
        </View>
      </Pressable>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={200}
        onScroll={({ nativeEvent }) => {
          const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
          followLatest.current = contentSize.height - contentOffset.y - layoutMeasurement.height < 120;
        }}>
        <TradePair
          left={{ item: data.offer.offered, label: proposerMine ? 'You offer' : `${data.offer.proposer.fullName} offers` }}
          right={{ item: data.offer.requested, label: proposerMine ? `${data.offer.recipient.fullName}'s item` : 'Your item' }}
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(`/trade-complete/${id}`)}
          style={[styles.status, { backgroundColor: colors.orangeSoft }]}>
          <ClipboardList size={16} color={colors.orange} />
          <View style={styles.flex}>
            <AppText variant="small" color="ink" weight="bold">
              {nextStep(data, userId)}
            </AppText>
            <AppText variant="caption">Meetup, confirmation, and problem reports</AppText>
          </View>
          <ChevronRight size={16} color={colors.orange} />
        </Pressable>

        {hasMore ? <Button label="Load older messages" variant="ghost" compact loading={olderBusy} onPress={() => void older()} /> : null}
        {!loaded ? (
          <AppText variant="caption" align="center">
            Loading messages…
          </AppText>
        ) : !messages.length ? (
          <AppText variant="caption" align="center">
            Start the conversation and arrange your exchange.
          </AppText>
        ) : null}
        {messages.map((message) =>
          message.kind === 'system' ? (
            <View key={message.id} style={[styles.system, { backgroundColor: colors.surface2 }]}>
              <AppText variant="caption" align="center">
                {message.body}
              </AppText>
            </View>
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
          This conversation is read-only.
        </AppText>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  chatHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, paddingHorizontal: 20, paddingVertical: 12 },
  list: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 16, gap: 12 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, padding: 12 },
  system: { alignSelf: 'center', maxWidth: '90%', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  error: { paddingHorizontal: 16 },
  readonly: { padding: 16 },
});
