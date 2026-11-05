import { router, Stack, useLocalSearchParams } from 'expo-router';
import { MoreHorizontal, Plus } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  ChatAttachments,
  ChatFrame,
  ConversationOptionsSheet,
  MessageBubble,
  MessageComposer,
  MessageSearchSheet,
  PrivatePhoto,
  ReportMessageSheet,
  SharedListingCard,
} from '@/components/chat';
import { RequireAuth } from '@/components/layout';
import { shortDate } from '@/components/trades';
import { AppText, Avatar, Button, IconButton, LoadingView } from '@/components/ui';
import { useMessageDraft } from '@/hooks/useMessageDraft';
import { useMountOnOpen } from '@/hooks/useMountOnOpen';
import { useDirectPresence } from '@/hooks/useDirectPresence';
import { usePolling } from '@/hooks/useTradeConversation';
import { queryClient, useAuth, useTheme } from '@/providers';
import { directMessageService } from '@/services';
import { queryKeys } from '@/services/queryKeys';
import type { DirectConversation, DirectMessage } from '@/types/directMessages';
import { errorMessage } from '@/utils/format';

export default function DirectChatScreen() {
  const { id, message } = useLocalSearchParams<{ id: string; message?: string }>();
  const focused = Number(message);
  const focusedMessageId = Number.isInteger(focused) && focused > 0 ? focused : undefined;
  return (
    <RequireAuth>
      <DirectChat key={`${id}:${focusedMessageId ?? 'latest'}`} id={id} focusedMessageId={focusedMessageId} />
    </RequireAuth>
  );
}

const POLL_MS = 3000;
const MAX_LENGTH = 2000;

function merge(current: DirectMessage[], incoming: DirectMessage[]) {
  return [...new Map([...current, ...incoming].map((entry) => [entry.id, entry])).values()].sort((a, b) => a.id - b.id);
}

/** With `focusedMessageId` it shows a saved message from search instead of the latest ones, and marks nothing as read. */
function DirectChat({ id, focusedMessageId }: { id: string; focusedMessageId?: number }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [thread, setThread] = useState<DirectConversation | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const draft = useMessageDraft(`${user?.id ?? ''}:direct:${id}`);
  const [sending, setSending] = useState<{ body: string; client: string } | null>(null);
  const [olderBusy, setOlderBusy] = useState(false);
  const [error, setError] = useState('');
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [attaching, setAttaching] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchMounted = useMountOnOpen(searching);
  const [reporting, setReporting] = useState<DirectMessage | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const fetching = useRef(false);
  const loadedOnce = useRef(false);
  const viewingSaved = focusedMessageId !== undefined;
  const followLatest = useRef(!viewingSaved);
  const targetY = useRef<number | null>(null);
  const presence = useDirectPresence(id, Boolean(thread), Boolean(thread?.canMessage));

  const load = useCallback(async () => {
    if (fetching.current) return;
    fetching.current = true;
    try {
      if (focusedMessageId !== undefined && loadedOnce.current) {
        // Viewing a saved message: only the conversation's state keeps refreshing, so the view stays still.
        setThread(await directMessageService.getConversation(id));
        return;
      }
      const [conversation, page] = await Promise.all([
        directMessageService.getConversation(id),
        focusedMessageId === undefined ? directMessageService.getMessages(id) : directMessageService.getContext(id, focusedMessageId),
      ]);
      setThread(conversation);
      setMessages((old) => merge(old, page.messages));
      setLoaded((wasLoaded) => {
        if (!wasLoaded) setHasMore(page.hasMore);
        return true;
      });
      loadedOnce.current = true;
      setError('');
    } catch (caught) {
      setError(errorMessage(caught, 'Could not load private messages.'));
    } finally {
      fetching.current = false;
    }
  }, [id, focusedMessageId]);

  usePolling(() => void load(), POLL_MS);

  const newestId = messages.at(-1)?.id;
  const newestRef = useRef<number | undefined>(undefined);
  newestRef.current = newestId;
  const acknowledged = useRef({ through: 0, reminder: null as string | null });
  // The reminder token seen on screen: only that one is cleared when the latest messages are read.
  const reminder = thread?.unreadReminderId ?? null;
  const reminderRef = useRef(reminder);
  reminderRef.current = reminder;

  // Acknowledge only what is on screen: the newest message, while scrolled to the bottom.
  const markRead = useCallback(() => {
    const newest = newestRef.current;
    const token = reminderRef.current;
    const done = acknowledged.current;
    if (!newest || viewingSaved || !followLatest.current || AppState.currentState !== 'active') return;
    if (newest <= done.through && (!token || token === done.reminder)) return;
    acknowledged.current = { through: Math.max(newest, done.through), reminder: token };
    directMessageService
      .markRead(id, newest, token)
      .then((remaining) => {
        // A newer reminder made on another device survives this acknowledgement.
        setThread((current) => (current && current.unreadReminderId === token ? { ...current, unreadReminderId: remaining, isUnread: remaining !== null } : current));
        void queryClient.invalidateQueries({ queryKey: queryKeys.notificationCounts });
        void queryClient.invalidateQueries({ queryKey: queryKeys.directConversations() });
      })
      .catch(() => {
        acknowledged.current = done;
      });
  }, [id, viewingSaved]);

  useEffect(() => {
    if (loaded) markRead();
  }, [loaded, newestId, reminder, markRead]);
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
  // A block can start mid-conversation; a typing state from just before it must not linger.
  const typing = presence.typing && thread.canMessage;

  async function send() {
    const text = draft.text.trim();
    if (sending || !text || !thread?.canMessage) return;
    presence.stop();
    // Reuse the request id when retrying the same text so it is saved only once.
    const request = { body: text, client: draft.requestFor(text) };
    setSending(request);
    setError('');
    followLatest.current = true;
    try {
      const sent = await directMessageService.send(id, request.body, request.client);
      setMessages((old) => merge(old, [sent]));
      draft.clear();
      void queryClient.invalidateQueries({ queryKey: queryKeys.directConversations() });
    } catch (caught) {
      setError(errorMessage(caught, 'Message could not be sent. Try again.'));
    } finally {
      setSending(null);
    }
  }

  /** Photos and listings leave any typed text in place. */
  function attached(sent: DirectMessage) {
    followLatest.current = true;
    setMessages((old) => merge(old, [sent]));
    void queryClient.invalidateQueries({ queryKey: queryKeys.directConversations() });
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
    <ChatFrame>
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
                <AppText variant="caption" color={typing ? 'green' : 'muted'}>
                  {typing ? 'typing…' : 'Private message'}
                </AppText>
              </View>
            </Pressable>
          ),
          headerRight: () => <IconButton icon={MoreHorizontal} label="Conversation options" tone="plain" onPress={() => setOptionsOpen(true)} />,
        }}
      />

      {viewingSaved ? (
        <View style={[styles.savedBanner, { backgroundColor: colors.orangeSoft }]}>
          <AppText variant="caption" color="ink" style={styles.flex}>
            Viewing a saved message. New messages stay unread.
          </AppText>
          <Button label="Back to latest" variant="ghost" compact fullWidth={false} onPress={() => router.setParams({ message: undefined })} />
        </View>
      ) : null}
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
          <View style={styles.empty}>
            <Avatar initials={other.initials} imageUrl={other.avatarUrl} size="large" />
            <AppText variant="h3" align="center">
              Say hello to {other.fullName}
            </AppText>
            <AppText variant="small" align="center">
              Your private conversation starts here.
            </AppText>
          </View>
        ) : null}
        {messages.map((message) => {
          const mine = message.senderId === userId;
          return (
            <View
              key={message.id}
              onLayout={
                message.id === focusedMessageId
                  ? ({ nativeEvent }) => {
                      if (targetY.current !== null) return;
                      targetY.current = nativeEvent.layout.y;
                      scrollRef.current?.scrollTo({ y: Math.max(0, nativeEvent.layout.y - 80), animated: false });
                    }
                  : undefined
              }>
              {message.id === focusedMessageId ? (
                <AppText variant="caption" color="orange" weight="bold" align={mine ? 'right' : 'left'}>
                  Matched message
                </AppText>
              ) : null}
              <MessageBubble
                message={{ id: String(message.id), mine, text: message.body, time: shortDate(message.createdAt) }}
                status={mine && !viewingSaved ? (message.id <= presence.peerRead ? 'read' : 'sent') : undefined}
                attachment={
                  message.listing ? (
                    <SharedListingCard listing={message.listing} />
                  ) : message.photo ? (
                    <PrivatePhoto path={directMessageService.photoPath(id, message.id)} photo={message.photo} />
                  ) : undefined
                }
                onReport={mine ? undefined : () => setReporting(message)}
              />
            </View>
          );
        })}
        {sending && !messages.some((entry) => entry.senderId === userId && entry.clientId === sending.client) ? (
          <MessageBubble message={{ id: 'pending', mine: true, text: sending.body, time: '' }} status="sending" />
        ) : null}
        {typing ? (
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
      {viewingSaved ? null : thread.canMessage ? (
        <MessageComposer
          value={draft.text}
          onChange={(value) => {
            const next = value.slice(0, MAX_LENGTH);
            draft.setText(next);
            presence.activity(Boolean(next.trim()));
          }}
          onSend={() => void send()}
          onAttach={() => setAttaching(true)}
          attachIcon={Plus}
          attachLabel="Add a photo or listing"
        />
      ) : (
        <AppText variant="caption" align="center" style={styles.readonly}>
          {thread.blockedByMe
            ? 'You blocked this user. Unblock them from conversation options or Settings to resume private messaging.'
            : 'Private messaging is unavailable for this conversation.'}{' '}
          Your conversation history is still here.
        </AppText>
      )}
      <ConversationOptionsSheet visible={optionsOpen} conversation={thread} onClose={() => setOptionsOpen(false)} onChanged={setThread} onSearch={() => setSearching(true)} />
      {thread.canMessage ? (
        <ChatAttachments
          visible={attaching}
          onClose={() => setAttaching(false)}
          shareListing={async (listingId, requestId) => attached(await directMessageService.shareListing(id, listingId, requestId))}
          sendPhoto={async (fileUri, requestId) => attached(await directMessageService.sendPhoto(id, fileUri, requestId))}
        />
      ) : null}
      {searchMounted ? <MessageSearchSheet visible={searching} onClose={() => setSearching(false)} threadId={id} traderName={other.fullName} /> : null}
      {reporting ? <ReportMessageSheet key={reporting.id} conversationId={id} message={reporting} onClose={() => setReporting(null)} /> : null}
    </ChatFrame>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { maxWidth: 200 },
  list: { flexGrow: 1, width: '100%', maxWidth: 760, alignSelf: 'center', padding: 16, gap: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 24 },
  typing: { alignSelf: 'flex-start', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9 },
  note: { paddingHorizontal: 16 },
  savedBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 16, paddingRight: 8, paddingVertical: 4 },
  readonly: { padding: 16 },
});
