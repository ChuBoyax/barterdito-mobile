import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ArrowDown, ArrowLeftRight, ChevronRight, Edit3, Package, Plus, Search, Trash2, X } from 'lucide-react-native';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { ChatAttachments, ChatFrame, MessageBubble, MessageComposer, PrivatePhoto, SharedListingCard } from '@/components/chat';
import { RequireAuth } from '@/components/layout';
import { TradeControls } from '@/components/trades';
import { ActionSheet, AppText, Avatar, BottomSheet, Button, IconButton, LoadingView, PressableScale, TextField, type ActionSheetOption } from '@/components/ui';
import { useDirectPresence } from '@/hooks/useDirectPresence';
import { useMessageDraft } from '@/hooks/useMessageDraft';
import { useMountOnOpen } from '@/hooks/useMountOnOpen';
import { usePolling, useTradeConversation } from '@/hooks/useTradeConversation';
import { setNotificationCounts } from '@/hooks/useNotificationCounts';
import { queryClient, useAuth, useTheme } from '@/providers';
import { tradeService } from '@/services';
import { notificationService } from '@/services/notificationService';
import { queryKeys } from '@/services/queryKeys';
import type { Conversation, OfferListing, TradeMessage } from '@/types/trades';
import { confirmAction } from '@/utils/confirm';
import { mergeById } from '@/utils/collections';
import { errorMessage } from '@/utils/format';
import { otherTrader } from '@/utils/trades';

export default function TradeChatScreen() {
  return (
    <RequireAuth>
      <TradeChat />
    </RequireAuth>
  );
}

const SEARCH_DELAY_MS = 300;
/** Header width taken by the back arrow, avatar, search and Details; the name gets what is left. */
const HEADER_RESERVED_WIDTH = 256;
const NAME_MIN_WIDTH = 80;

const clockTime = (value: string) => new Date(value).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
const dayLabel = (value: string) => new Date(value).toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

function messageTime(message: TradeMessage) {
  const time = clockTime(message.createdAt);
  return message.editedAt && !message.deletedAt ? `${time} · edited` : time;
}

/** Where the trade stands, under the other trader's name. */
function statusLine(data: Conversation) {
  if (data.issues.some((entry) => entry.status === 'open')) return { text: 'Completion paused: reported problem', color: 'orange' as const };
  if (data.status === 'completed') return { text: 'Trade completed', color: 'muted' as const };
  if (data.status === 'cancelled') return { text: 'Trade cancelled', color: 'muted' as const };
  return { text: 'In progress', color: 'green' as const };
}

function TradeChat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { width: screenWidth } = useWindowDimensions();
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
  const [detailsOpen, setDetailsOpen] = useState(false);
  const detailsMounted = useMountOnOpen(detailsOpen);
  const [optionsFor, setOptionsFor] = useState<TradeMessage | null>(null);
  const [atLatest, setAtLatest] = useState(true);
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
  const status = statusLine(data);
  const typing = presence.typing && active;
  const shown = searching ? (results?.messages ?? []) : messages;
  const nameStyle = { maxWidth: Math.max(NAME_MIN_WIDTH, screenWidth - HEADER_RESERVED_WIDTH) };

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

  function jumpToLatest() {
    followLatest.current = true;
    setAtLatest(true);
    scrollRef.current?.scrollToEnd({ animated: true });
  }

  return (
    <ChatFrame>
      {/* The other trader replaces the generic "Trade Chat" title and sits right beside the back arrow on every device. */}
      <Stack.Screen
        options={{
          title: '',
          headerTitleAlign: 'left',
          headerBackVisible: true,
          headerLeft: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`View ${other.fullName}'s profile`}
              onPress={() => router.push(`/traders/${other.id}`)}
              style={styles.person}>
              <Avatar initials={other.initials} imageUrl={other.avatarUrl} size="small" />
              <View>
                <AppText variant="h3" numberOfLines={1} style={nameStyle}>
                  {other.fullName}
                </AppText>
                <AppText variant="caption" color={typing ? 'green' : status.color} numberOfLines={1} style={nameStyle}>
                  {typing ? 'typing…' : status.text}
                </AppText>
              </View>
            </Pressable>
          ),
          headerRight: () => (
            <View style={styles.headerRight}>
              <IconButton
                icon={searchOpen ? X : Search}
                label={searchOpen ? 'Close search' : 'Search this trade conversation'}
                tone="plain"
                onPress={() => {
                  setSearchOpen((open) => !open);
                  setSearchText('');
                }}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open exchange details"
                onPress={() => {
                  presence.stop();
                  setDetailsOpen(true);
                }}
                style={[styles.details, { borderColor: colors.line }]}>
                <ArrowLeftRight size={16} color={colors.ink} />
                <AppText variant="caption" color="ink" weight="bold">
                  Details
                </AppText>
              </Pressable>
            </View>
          ),
        }}
      />

      {searchOpen ? (
        <View style={styles.search}>
          <TextField icon={Search} value={searchText} onChangeText={setSearchText} placeholder="Search this trade conversation" maxLength={120} autoFocus autoCorrect={false} returnKeyType="search" />
          {searching ? <AppText variant="caption">Search results. New messages stay unread until you close search.</AppText> : null}
        </View>
      ) : null}

      <View style={[styles.context, { borderBottomColor: colors.line }]}>
        <ContextItem item={yourItem} label="You offer" />
        <ArrowLeftRight size={17} color={colors.muted} />
        <ContextItem item={theirItem} label="You receive" />
      </View>

      <View style={styles.flex}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={200}
          onScroll={({ nativeEvent }) => {
            const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
            if (searching) return;
            followLatest.current = contentSize.height - contentOffset.y - layoutMeasurement.height < 120;
            setAtLatest(followLatest.current);
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
          {shown.map((message, index) => {
            const previous = shown[index - 1];
            const newDay = !previous || new Date(previous.createdAt).toDateString() !== new Date(message.createdAt).toDateString();
            const dateLine = newDay ? (
              <AppText variant="caption" align="center" style={styles.date}>
                {dayLabel(message.createdAt)}
              </AppText>
            ) : null;
            if (message.kind === 'system') {
              return (
                <Fragment key={message.id}>
                  {dateLine}
                  <AppText variant="caption" align="center" style={styles.system}>
                    {message.body} · {clockTime(message.createdAt)}
                  </AppText>
                </Fragment>
              );
            }
            const mine = message.senderId === userId;
            const removed = Boolean(message.deletedAt);
            const canChange = active && mine && !removed && !busy;
            const bubble = (
              <MessageBubble
                message={{ id: String(message.id), mine, text: removed ? 'Message removed' : message.body, time: messageTime(message) }}
                status={mine && !removed && !searching ? (message.id <= presence.peerRead ? 'read' : 'sent') : undefined}
                attachment={
                  removed ? undefined : message.listing ? (
                    <SharedListingCard listing={message.listing} />
                  ) : message.photo ? (
                    <PrivatePhoto path={tradeService.photoPath(id, message.id)} photo={message.photo} />
                  ) : undefined
                }
                onLongPress={canChange ? () => setOptionsFor(message) : undefined}
                onOptions={canChange ? () => setOptionsFor(message) : undefined}
              />
            );
            return (
              <Fragment key={message.id}>
                {dateLine}
                {mine ? (
                  bubble
                ) : (
                  <View style={styles.incoming}>
                    {/* The avatar marks the end of a run of their messages. */}
                    {shown[index + 1]?.senderId !== message.senderId ? (
                      <View style={styles.incomingAvatar}>
                        <Avatar initials={other.initials} imageUrl={other.avatarUrl} size="xsmall" />
                      </View>
                    ) : (
                      <View style={styles.incomingGap} />
                    )}
                    {bubble}
                  </View>
                )}
              </Fragment>
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
        {!atLatest && !searching ? (
          <PressableScale accessibilityRole="button" onPress={jumpToLatest} style={[styles.latest, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <ArrowDown size={16} color={colors.orange} />
            <AppText variant="caption" color="ink" weight="bold">
              Latest messages
            </AppText>
          </PressableScale>
        ) : null}
      </View>

      {error || state.error ? (
        <AppText variant="caption" color="red" align="center" style={styles.error}>
          {error || state.error}
        </AppText>
      ) : null}
      {active && (editing ? editing.text : draft.text) ? (
        <AppText variant="caption" align="right" style={styles.count}>
          {(editing ? editing.text : draft.text).length}/2000
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
        <View style={styles.readonly}>
          <AppText variant="caption" align="center">
            This conversation is read-only.
          </AppText>
          {data.status === 'completed' ? <Button label="Rate your trade" variant="ghost" compact fullWidth={false} onPress={() => router.push(`/trade-review/${id}`)} /> : null}
        </View>
      )}
      {active ? (
        <ChatAttachments
          visible={attaching}
          onClose={() => setAttaching(false)}
          shareListing={async (listingId, requestId) => attached(await tradeService.shareListing(id, listingId, requestId))}
          sendPhoto={async (fileUri, requestId) => attached(await tradeService.sendPhoto(id, fileUri, requestId))}
        />
      ) : null}
      <MessageOptionsSheet
        message={optionsFor}
        onClose={() => setOptionsFor(null)}
        onEdit={(message) => setEditing({ id: message.id, text: message.body })}
        onRemove={(message) => void remove(message)}
      />
      {detailsMounted ? (
        <BottomSheet visible={detailsOpen} flat onClose={() => setDetailsOpen(false)} title="Exchange details">
          <TradeControls state={state} userId={userId} inChat />
          {state.error ? (
            <AppText variant="caption" color="red" align="center">
              {state.error}
            </AppText>
          ) : null}
          <Button
            label="Trade status"
            variant="secondary"
            iconRight={ChevronRight}
            style={[styles.flatButton, { borderColor: colors.line }]}
            onPress={() => {
              setDetailsOpen(false);
              router.push(`/trade-complete/${id}`);
            }}
          />
        </BottomSheet>
      ) : null}
    </ChatFrame>
  );
}

type MessageOptionsSheetProps = { message: TradeMessage | null; onClose: () => void; onEdit: (message: TradeMessage) => void; onRemove: (message: TradeMessage) => void };

function MessageOptionsSheet({ message, onClose, onEdit, onRemove }: MessageOptionsSheetProps) {
  const options: ActionSheetOption[] = message
    ? [
        // Photos and listing cards can only be removed.
        ...(message.photo || message.listing ? [] : [{ label: 'Edit', icon: Edit3, onPress: () => onEdit(message) }]),
        { label: 'Remove', icon: Trash2, destructive: true, onPress: () => onRemove(message) },
      ]
    : [];
  return <ActionSheet visible={message !== null} onClose={onClose} title="Message" options={options} />;
}

function ContextItem({ item, label }: { item: OfferListing; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.contextItem}>
      <View style={[styles.thumb, { backgroundColor: colors.surface2 }]}>
        {item.imageUrl ? <Image source={item.imageUrl} cachePolicy="memory-disk" style={StyleSheet.absoluteFill} contentFit="cover" /> : <Package size={16} color={colors.muted} />}
      </View>
      <View style={styles.flex}>
        <AppText variant="caption" numberOfLines={1}>
          {label}
        </AppText>
        <AppText variant="caption" color="ink" weight="bold" numberOfLines={2}>
          {item.title}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  details: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 12, paddingHorizontal: 9 },
  context: { flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingVertical: 10 },
  contextItem: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8 },
  thumb: { width: 42, height: 42, borderRadius: 10, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  date: { alignSelf: 'center', marginVertical: 4 },
  incoming: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  incomingAvatar: { marginBottom: 20 },
  incomingGap: { width: 32 },
  latest: { position: 'absolute', alignSelf: 'center', bottom: 8, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  count: { paddingHorizontal: 18 },
  flatButton: { boxShadow: [], borderWidth: 1 },
  search: { gap: 6, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 6 },
  list: { flexGrow: 1, width: '100%', maxWidth: 760, alignSelf: 'center', padding: 16, gap: 12 },
  system: { alignSelf: 'center', maxWidth: '85%', paddingVertical: 2 },
  typing: { alignSelf: 'flex-start', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9 },
  error: { paddingHorizontal: 16 },
  readonly: { alignItems: 'center', gap: 4, padding: 16 },
});
