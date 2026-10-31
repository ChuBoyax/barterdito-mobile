import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { MessageBubble, MessageComposer } from '@/components/chat';
import { RequireAuth } from '@/components/layout';
import { shortDate } from '@/components/trades';
import { AppText, Avatar, Button, LoadingView } from '@/components/ui';
import { useDirectPresence } from '@/hooks/useDirectPresence';
import { usePolling } from '@/hooks/useTradeConversation';
import { queryClient, useAuth, useTheme } from '@/providers';
import { directMessageService } from '@/services';
import { queryKeys } from '@/services/queryKeys';
import { clientId } from '@/services/tradeService';
import type { DirectConversation, DirectMessage } from '@/types/directMessages';
import { errorMessage } from '@/utils/format';

export default function DirectChatScreen() {
  return (
    <RequireAuth>
      <DirectChat />
    </RequireAuth>
  );
}

const POLL_MS = 3000;
const MAX_LENGTH = 2000;

function merge(current: DirectMessage[], incoming: DirectMessage[]) {
  return [...new Map([...current, ...incoming].map((entry) => [entry.id, entry])).values()].sort((a, b) => a.id - b.id);
}

function DirectChat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [thread, setThread] = useState<DirectConversation | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState<string | null>(null);
  const [olderBusy, setOlderBusy] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const pending = useRef<{ body: string; client: string } | null>(null);
  const fetching = useRef(false);
  const followLatest = useRef(true);
  const presence = useDirectPresence(id, Boolean(thread), Boolean(thread?.canMessage));

  const load = useCallback(async () => {
    if (fetching.current) return;
    fetching.current = true;
    try {
      const [conversation, page] = await Promise.all([directMessageService.getConversation(id), directMessageService.getMessages(id)]);
      setThread(conversation);
      setMessages((old) => merge(old, page.messages));
      setLoaded((wasLoaded) => {
        if (!wasLoaded) setHasMore(page.hasMore);
        return true;
      });
      setError('');
    } catch (caught) {
      setError(errorMessage(caught, 'Could not load private messages.'));
    } finally {
      fetching.current = false;
    }
  }, [id]);

  usePolling(() => void load(), POLL_MS);

  const newestId = messages.at(-1)?.id;
  const newestRef = useRef<number | undefined>(undefined);
  newestRef.current = newestId;
  const acknowledged = useRef(0);

  // Acknowledge only what is on screen: the newest message, while scrolled to the bottom.
  const markRead = useCallback(() => {
    const newest = newestRef.current;
    if (!newest || newest <= acknowledged.current || !followLatest.current || AppState.currentState !== 'active') return;
    acknowledged.current = newest;
    directMessageService
      .markRead(id, newest)
      .then(() => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.notificationCounts });
        void queryClient.invalidateQueries({ queryKey: queryKeys.directConversations });
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
  }, [newestId, presence.typing, sending]);

  if (!user) return null;
  if (!thread) {
    if (error) {
      return (
        <View style={[styles.center, { backgroundColor: colors.background }]}>
          <AppText variant="h3" align="center">
            {error}
          </AppText>
          <Button label="Try again" variant="secondary" onPress={() => void load()} />
        </View>
      );
    }
    return <LoadingView variant="chat" />;
  }

  const userId = user.id;
  const other = thread.other;

  async function send() {
    const text = draft.trim();
    if (sending || !text || !thread?.canMessage) return;
    presence.stop();
    // Reuse the request id when retrying the same text so it is saved only once.
    if (!pending.current || pending.current.body !== text) pending.current = { body: text, client: clientId() };
    const request = pending.current;
    setSending(request.body);
    setError('');
    followLatest.current = true;
    try {
      const sent = await directMessageService.send(id, request.body, request.client);
      setMessages((old) => merge(old, [sent]));
      pending.current = null;
      setDraft('');
      void queryClient.invalidateQueries({ queryKey: queryKeys.directConversations });
    } catch (caught) {
      setError(errorMessage(caught, 'Message could not be sent. Try again.'));
    } finally {
      setSending(null);
    }
  }

  async function older() {
    if (!messages.length || olderBusy) return;
    setOlderBusy(true);
    followLatest.current = false;
    try {
      const page = await directMessageService.getMessages(id, messages[0]!.id);
      setMessages((old) => merge(old, page.messages));
      setHasMore(page.hasMore);
    } catch (caught) {
      setError(errorMessage(caught, 'Could not load older messages.'));
    } finally {
      setOlderBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`View ${other.fullName}'s profile`}
              onPress={() => router.push(`/traders/${other.id}`)}
              style={styles.person}>
              <Avatar initials={other.initials} imageUrl={other.avatarUrl} size="small" />
              <View>
                <AppText variant="h3" numberOfLines={1} style={styles.name}>
                  {other.fullName}
                </AppText>
                <AppText variant="caption" color={presence.typing ? 'green' : 'muted'}>
                  {presence.typing ? 'typing…' : 'Private message'}
                </AppText>
              </View>
            </Pressable>
          ),
        }}
      />

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
            No messages yet. Say hello to {other.fullName}.
          </AppText>
        ) : null}
        {messages.map((message) => {
          const mine = message.senderId === userId;
          return (
            <MessageBubble
              key={message.id}
              message={{ id: String(message.id), mine, text: message.body, time: shortDate(message.createdAt) }}
              status={mine ? (message.id <= presence.peerRead ? 'read' : 'sent') : undefined}
            />
          );
        })}
        {sending && !messages.some((entry) => entry.senderId === userId && entry.clientId === pending.current?.client) ? (
          <MessageBubble message={{ id: 'pending', mine: true, text: sending, time: '' }} status="sending" />
        ) : null}
        {presence.typing ? (
          <View style={[styles.typing, { backgroundColor: colors.surface }]} accessibilityLabel={`${other.fullName} is typing`}>
            <AppText variant="caption" weight="semibold">
              {other.fullName.split(' ')[0]} is typing…
            </AppText>
          </View>
        ) : null}
      </ScrollView>

      {presence.failed ? (
        <AppText variant="caption" align="center" style={styles.note}>
          Typing and read updates are temporarily unavailable.
        </AppText>
      ) : null}
      {error ? (
        <AppText variant="caption" color="red" align="center" style={styles.note}>
          {error}
        </AppText>
      ) : null}
      {thread.canMessage ? (
        <MessageComposer
          value={draft}
          onChange={(value) => {
            const next = value.slice(0, MAX_LENGTH);
            setDraft(next);
            presence.activity(Boolean(next.trim()));
          }}
          onSend={() => void send()}
        />
      ) : (
        <AppText variant="caption" align="center" style={styles.readonly}>
          This trader is no longer available for new messages. Your conversation history is still here.
        </AppText>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { maxWidth: 200 },
  list: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 16, gap: 12 },
  typing: { alignSelf: 'flex-start', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9 },
  note: { paddingHorizontal: 16 },
  readonly: { padding: 16 },
});
