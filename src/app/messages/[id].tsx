import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ChevronRight, Package, Plus, Search, X } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActionSheetIOS, Alert, AppState, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ChatAttachments, ChatFrame, MessageBubble, MessageComposer, PrivatePhoto, SharedListingCard } from '@/components/chat';
import { RequireAuth } from '@/components/layout';
import { shortDate } from '@/components/trades';
import { AppText, Avatar, Badge, Button, IconButton, LoadingView, TextField } from '@/components/ui';
import { useDirectPresence } from '@/hooks/useDirectPresence';
import { useMessageDraft } from '@/hooks/useMessageDraft';
import { usePolling, useTradeConversation } from '@/hooks/useTradeConversation';
import { setNotificationCounts } from '@/hooks/useNotificationCounts';
import { queryClient, useAuth, useTheme } from '@/providers';
import { tradeService } from '@/services';
import { notificationService } from '@/services/notificationService';
import { queryKeys } from '@/services/queryKeys';
import { neu } from '@/theme';
import type { Conversation, TradeMessage } from '@/types/trades';
import { confirmAction } from '@/utils/confirm';
import { mergeById } from '@/utils/collections';
import { errorMessage } from '@/utils/format';
import { confirmations, otherTrader } from '@/utils/trades';

export default function TradeChatScreen() {
  return (
    <RequireAuth>
      <TradeChat />
    </RequireAuth>
  );
}

const SEARCH_DELAY_MS = 300;

function messageTime(message: TradeMessage) {
  const time = shortDate(message.createdAt);
  return message.editedAt && !message.deletedAt ? `${time} · edited` : time;
}

/** A few words on what happens next, shown in the trade strip. */
function nextStep(data: Conversation, userId: string) {
  if (data.status === 'completed') return 'Completed · Rate your trade';
  if (data.status === 'cancelled') return 'Trade cancelled';
  if (data.issues.some((entry) => entry.status === 'open')) return 'Paused · Problem reported';
  const { mine, theirs } = confirmations(data, userId);
  if (mine) return 'Waiting for their confirmation';
  if (theirs) return 'They confirmed · Your turn';
  return 'Arrange here, then confirm the exchange';
}

function TradeChat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const state = useTradeConversation(id);
  const [messages, setMessages] = useState<TradeMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const draft = useMessageDraft(`${user?.id ?? ''}:trade:${id}`);
  // Editing uses its own text, so the unsent draft comes back afterwards.
  const [editing, setEditing] = useState<{ id: number; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [olderBusy, setOlderBusy] = useState(false);
  const [error, setError] = useState('');
  const [attaching, setAttaching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState<{ query: string; messages: TradeMessage[] } | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const lock = useRef(false);
  const fetching = useRef(false);
  const revision = useRef(0);
  const followLatest = useRef(true);
  const active = state.data?.status === 'active';
  const presence = useDirectPresence(id, Boolean(state.data), active, tradeService);
  const query = searchOpen ? searchText.trim() : '';
  const searching = query.length > 0;

  const load = useCallback(async () => {
    if (fetching.current) return;
    fetching.current = true;
    const current = revision.current;
    try {
      const page = await tradeService.getMessages(id);
      if (current !== revision.current) return;
      setMessages((old) => mergeById(old, page.messages));
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

  // Search runs in the backend, so it covers older history too.
  useEffect(() => {
    setResults(null);
    if (!query) return;
    let live = true;
    const timer = setTimeout(() => {
      tradeService
        .getMessages(id, undefined, query)
        .then((page) => live && setResults({ query, messages: page.messages }))
        .catch((caught) => {
          if (!live) return;
          setResults({ query, messages: [] });
          setError(errorMessage(caught, 'Could not search this conversation.'));
        });
    }, SEARCH_DELAY_MS);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [id, query]);

  const newestId = messages.at(-1)?.id;
  const newestRef = useRef<number | undefined>(undefined);
  const acknowledged = useRef(0);
  const searchingRef = useRef(searching);
  // Declared before the effects that read them, so those always see this render's values.
  useEffect(() => {
    newestRef.current = newestId;
    searchingRef.current = searching;
  }, [newestId, searching]);

  // Like the website: acknowledge only when the newest message is on screen (scrolled to the bottom).
  const markRead = useCallback(() => {
    const newest = newestRef.current;
    if (!newest || searchingRef.current || newest <= acknowledged.current || !followLatest.current || AppState.currentState !== 'active') return;
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
  }, [loaded, newestId, searching, markRead]);
  useEffect(() => {
    if (!followLatest.current || searching) return;
    const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
    return () => clearTimeout(timer);
  }, [newestId, presence.typing, searching]);

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
  const other = otherTrader(data.offer, userId);
  const mineFirst = data.offer.proposer.id === userId;
  const theirItem = mineFirst ? data.offer.requested : data.offer.offered;
  const yourItem = mineFirst ? data.offer.offered : data.offer.requested;
  const step = nextStep(data, userId);
  const typing = presence.typing && active;
  const shown = searching ? (results?.messages ?? []) : messages;

  async function send() {
    const text = (editing ? editing.text : draft.text).trim();
    if (lock.current || !text) return;
    revision.current++;
    lock.current = true;
    setBusy(true);
    setError('');
    presence.stop();
    try {
      if (editing) {
        const updated = await tradeService.editMessage(id, editing.id, text);
        setMessages((old) => mergeById(old, [updated]));
        setEditing(null);
      } else {
        // Reuse the request id when retrying the same text so it is not saved twice.
        const sent = await tradeService.sendMessage(id, text, draft.requestFor(text));
        setMessages((old) => mergeById(old, [sent]));
        draft.clear();
      }
      followLatest.current = true;
    } catch (caught) {
      setError(errorMessage(caught, 'Message could not be sent. Try again.'));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  /** Photos and listings leave any typed text in place. */
  function attached(sent: TradeMessage) {
    revision.current++;
    followLatest.current = true;
    setSearchOpen(false);
    setSearchText('');
    setMessages((old) => mergeById(old, [sent]));
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
      setMessages((old) => mergeById(old, [removed]));
      if (editing?.id === message.id) setEditing(null);
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
      setMessages((old) => mergeById(old, page.messages));
      setHasMore(page.hasMore);
    } catch (caught) {
      setError(errorMessage(caught, 'Could not load older messages.'));
    } finally {
      setOlderBusy(false);
    }
  }

  function openActions(message: TradeMessage) {
    // Photos and listing cards can only be removed.
    const edit = message.photo || message.listing ? null : () => setEditing({ id: message.id, text: message.body });
    if (Platform.OS === 'ios') {
      const options = edit ? ['Edit', 'Remove', 'Cancel'] : ['Remove', 'Cancel'];
      ActionSheetIOS.showActionSheetWithOptions({ options, destructiveButtonIndex: options.indexOf('Remove'), cancelButtonIndex: options.indexOf('Cancel') }, (index) => {
        if (options[index] === 'Edit') edit?.();
        if (options[index] === 'Remove') void remove(message);
      });
      return;
    }
    Alert.alert('Message', undefined, [
      ...(edit ? [{ text: 'Edit', onPress: edit }] : []),
      { text: 'Remove', style: 'destructive' as const, onPress: () => void remove(message) },
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  }

  return (
    <ChatFrame>
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
              <View>
                <AppText variant="h3" numberOfLines={1} style={styles.name}>
                  {other.fullName}
                </AppText>
                {typing ? (
                  <AppText variant="caption" color="green">
                    typing…
                  </AppText>
                ) : null}
              </View>
            </Pressable>
          ),
          headerRight: () => (
            <View style={styles.headerRight}>
              {active ? null : <Badge label={data.status === 'completed' ? 'Completed' : 'Cancelled'} tone={data.status === 'completed' ? 'blue' : 'neutral'} />}
              <IconButton
                icon={searchOpen ? X : Search}
                label={searchOpen ? 'Close search' : 'Search this trade conversation'}
                tone="plain"
                onPress={() => {
                  setSearchOpen((open) => !open);
                  setSearchText('');
                }}
              />
            </View>
          ),
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

      {searchOpen ? (
        <View style={styles.search}>
          <TextField icon={Search} value={searchText} onChangeText={setSearchText} placeholder="Search this trade conversation" maxLength={120} autoFocus autoCorrect={false} returnKeyType="search" />
          {searching ? <AppText variant="caption">Search results. New messages stay unread until you close search.</AppText> : null}
        </View>
      ) : null}

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={200}
        onScroll={({ nativeEvent }) => {
          const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
          if (searching) return;
          followLatest.current = contentSize.height - contentOffset.y - layoutMeasurement.height < 120;
          if (followLatest.current) markRead();
        }}>
        {hasMore && !searching ? <Button label="Earlier messages" variant="ghost" compact loading={olderBusy} onPress={() => void older()} /> : null}
        {!searching && loaded && !messages.length ? (
          <AppText variant="caption" align="center">
            Start the conversation and arrange your exchange.
          </AppText>
        ) : null}
        {searching && !results ? (
          <AppText variant="caption" align="center">
            Searching…
          </AppText>
        ) : null}
        {searching && results && !results.messages.length ? (
          <AppText variant="caption" align="center">
            No trade messages match this search.
          </AppText>
        ) : null}
        {shown.map((message) => {
          if (message.kind === 'system') {
            return (
              <AppText key={message.id} variant="caption" align="center" style={styles.system}>
                {message.body}
              </AppText>
            );
          }
          const mine = message.senderId === userId;
          const removed = Boolean(message.deletedAt);
          return (
            <MessageBubble
              key={message.id}
              message={{ id: String(message.id), mine, text: removed ? 'Message removed' : message.body, time: messageTime(message) }}
              status={mine && !removed && !searching ? (message.id <= presence.peerRead ? 'read' : 'sent') : undefined}
              attachment={
                removed ? undefined : message.listing ? (
                  <SharedListingCard listing={message.listing} />
                ) : message.photo ? (
                  <PrivatePhoto path={tradeService.photoPath(id, message.id)} photo={message.photo} />
                ) : undefined
              }
              onLongPress={active && mine && !removed && !busy ? () => openActions(message) : undefined}
            />
          );
        })}
        {typing && !searching ? (
          <View style={[styles.typing, { backgroundColor: colors.surface }]} accessibilityLabel={`${other.fullName} is typing`}>
            <AppText variant="caption" weight="semibold">
              {other.fullName.split(' ')[0]} is typing…
            </AppText>
          </View>
        ) : null}
      </ScrollView>

      {error || state.error ? (
        <AppText variant="caption" color="red" align="center" style={styles.error}>
          {error || state.error}
        </AppText>
      ) : null}
      {active ? (
        <MessageComposer
          value={editing ? editing.text : draft.text}
          onChange={(value) => {
            const next = value.slice(0, 2000);
            if (editing) setEditing({ ...editing, text: next });
            else {
              draft.setText(next);
              presence.activity(Boolean(next.trim()));
            }
          }}
          onSend={() => void send()}
          onAttach={editing ? undefined : () => setAttaching(true)}
          attachIcon={Plus}
          attachLabel="Add a photo or listing"
          editing={editing !== null}
          onCancelEdit={() => setEditing(null)}
        />
      ) : (
        <AppText variant="caption" align="center" style={styles.readonly}>
          This trade is closed. Your conversation history is still here.
        </AppText>
      )}
      {active ? (
        <ChatAttachments
          visible={attaching}
          onClose={() => setAttaching(false)}
          shareListing={async (listingId, requestId) => attached(await tradeService.shareListing(id, listingId, requestId))}
          sendPhoto={async (fileUri, requestId) => attached(await tradeService.sendPhoto(id, fileUri, requestId))}
        />
      ) : null}
    </ChatFrame>
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
  name: { maxWidth: 180 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  strip: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginTop: 6, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 10 },
  thumbs: { flexDirection: 'row' },
  thumb: { width: 34, height: 34, borderRadius: 10, borderWidth: 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  overlap: { marginLeft: -10 },
  search: { gap: 6, paddingHorizontal: 16, paddingTop: 10 },
  list: { flexGrow: 1, width: '100%', maxWidth: 760, alignSelf: 'center', padding: 16, gap: 12 },
  system: { alignSelf: 'center', maxWidth: '85%', paddingVertical: 2 },
  typing: { alignSelf: 'flex-start', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9 },
  error: { paddingHorizontal: 16 },
  readonly: { padding: 16 },
});
