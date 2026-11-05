import { router } from 'expo-router';
import { Search } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { shortDate } from '@/components/trades';
import { AppText, Avatar, BottomSheet, Button, TextField } from '@/components/ui';
import { useAuth, useTheme } from '@/providers';
import { directMessageService } from '@/services';
import type { MessageSearchHit } from '@/types/directMessages';
import { errorMessage } from '@/utils/format';

const DELAY_MS = 300;
const CONTEXT_CHARS = 60;

type MessageSearchSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Limits the search to one conversation. */
  threadId?: string;
  traderName?: string;
};

function excerpt(body: string, query: string) {
  const at = body.toLowerCase().indexOf(query.toLowerCase());
  if (at < 0) return { before: body.slice(0, CONTEXT_CHARS * 2), match: '', after: '' };
  const start = Math.max(0, at - CONTEXT_CHARS);
  const end = at + query.length;
  return {
    before: `${start ? '…' : ''}${body.slice(start, at)}`,
    match: body.slice(at, end),
    after: `${body.slice(end, end + CONTEXT_CHARS)}${end + CONTEXT_CHARS < body.length ? '…' : ''}`,
  };
}

/** Searches saved private messages. Read-only: nothing here counts as reading them. */
export function MessageSearchSheet({ visible, onClose, threadId, traderName }: MessageSearchSheetProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [matches, setMatches] = useState<MessageSearchHit[]>([]);
  const [next, setNext] = useState<number | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [moreBusy, setMoreBusy] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const latest = useRef(0);
  const query = input.trim();
  const valid = query.length >= 2;

  useEffect(() => {
    const request = ++latest.current;
    setMatches([]);
    setNext(null);
    setError('');
    if (!valid) return setState('idle');
    setState('loading');
    const timer = setTimeout(() => {
      directMessageService
        .search(query, threadId)
        .then((page) => {
          if (request !== latest.current) return;
          setMatches(page.matches);
          setNext(page.hasMore ? page.nextBeforeId : null);
          setState('done');
        })
        .catch((caught) => {
          if (request !== latest.current) return;
          setError(errorMessage(caught, 'Could not search saved messages.'));
          setState('done');
        });
    }, DELAY_MS);
    return () => clearTimeout(timer);
  }, [query, valid, threadId, attempt]);

  async function more() {
    if (next === null || moreBusy) return;
    const request = latest.current;
    setMoreBusy(true);
    try {
      const page = await directMessageService.search(query, threadId, next);
      if (request !== latest.current) return;
      setMatches((current) => [...new Map([...current, ...page.matches].map((hit) => [hit.message.id, hit])).values()]);
      setNext(page.hasMore ? page.nextBeforeId : null);
    } catch (caught) {
      if (request === latest.current) setError(errorMessage(caught, 'Could not load more matches.'));
    } finally {
      setMoreBusy(false);
    }
  }

  function open(hit: MessageSearchHit) {
    onClose();
    if (threadId === hit.conversationId) router.setParams({ message: String(hit.message.id) });
    else router.push(`/direct-messages/${hit.conversationId}?message=${hit.message.id}`);
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} fill eyebrow="Private messages" title="Search messages">
      <AppText variant="small">{threadId ? `Search saved messages with ${traderName || 'this trader'}.` : 'Search saved private messages, including archived conversations.'}</AppText>
      <TextField icon={Search} value={input} onChangeText={setInput} placeholder="Search message history" maxLength={120} autoFocus autoCorrect={false} returnKeyType="search" />
      <ScrollView keyboardShouldPersistTaps="handled" style={styles.flex} contentContainerStyle={styles.results}>
        {!valid ? <AppText variant="caption">Enter at least two characters.</AppText> : null}
        {state === 'loading' ? <AppText variant="caption">Searching saved messages…</AppText> : null}
        {error ? (
          <View style={styles.errorRow}>
            <AppText variant="caption" color="red" style={styles.flex}>
              {error}
            </AppText>
            <Button label="Retry" variant="ghost" compact fullWidth={false} onPress={() => setAttempt((value) => value + 1)} />
          </View>
        ) : null}
        {valid && state === 'done' && !error && !matches.length ? <AppText variant="small">No saved messages match your search.</AppText> : null}
        {matches.map((hit) => {
          const text = excerpt(hit.message.body, query);
          return (
            <Pressable
              key={hit.message.id}
              accessibilityRole="button"
              accessibilityLabel={`View message with ${hit.other.fullName}`}
              onPress={() => open(hit)}
              style={({ pressed }) => [styles.hit, { backgroundColor: pressed ? colors.surface2 : colors.background }]}>
              <Avatar initials={hit.other.initials} imageUrl={hit.other.avatarUrl} size="small" />
              <View style={styles.flex}>
                <AppText variant="h3" numberOfLines={1}>
                  {hit.other.fullName}
                </AppText>
                <AppText variant="caption" numberOfLines={1}>
                  {hit.message.senderId === user?.id ? 'You' : hit.other.fullName} · {shortDate(hit.message.createdAt)}
                </AppText>
                <AppText variant="small" color="ink" numberOfLines={3}>
                  {text.before}
                  <Text style={{ color: colors.orange, fontWeight: '700' }}>{text.match}</Text>
                  {text.after}
                </AppText>
              </View>
            </Pressable>
          );
        })}
        {next !== null ? <Button label="Load more matches" variant="secondary" loading={moreBusy} onPress={() => void more()} /> : null}
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  results: { gap: 10, paddingBottom: 8 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hit: { flexDirection: 'row', gap: 12, borderRadius: 16, padding: 10 },
});
