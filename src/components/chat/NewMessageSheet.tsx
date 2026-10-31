import { router } from 'expo-router';
import { Search } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Avatar, BottomSheet, TextField } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import { directMessageService } from '@/services';
import type { DirectPerson } from '@/types/directMessages';
import { errorMessage } from '@/utils/format';

/** Find a trader by name and open (or create) the private conversation with them. */
export function NewMessageSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<{ query: string; people: DirectPerson[]; error: string } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [opening, setOpening] = useState<string | null>(null);
  const [openError, setOpenError] = useState('');
  const text = query.trim();

  useEffect(() => {
    if (text.length < 2) return;
    let active = true;
    const timer = setTimeout(() => {
      directMessageService
        .searchPeople(text)
        .then((people) => active && setResult({ query: text, people, error: '' }))
        .catch((caught) => active && setResult({ query: text, people: [], error: errorMessage(caught, 'Could not find traders.') }));
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [text, attempt]);

  const current = result?.query === text ? result : null;
  const searching = text.length >= 2 && !current;

  async function choose(person: DirectPerson) {
    if (opening) return;
    setOpening(person.id);
    setOpenError('');
    try {
      const conversation = await directMessageService.start(person.id);
      onClose();
      setQuery('');
      router.push(`/direct-messages/${conversation.id}`);
    } catch (caught) {
      setOpenError(errorMessage(caught, 'Could not start a private message.'));
    } finally {
      setOpening(null);
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} eyebrow="Private message" title="New message">
      <TextField
        icon={Search}
        value={query}
        onChangeText={(value) => {
          setQuery(value);
          setOpenError('');
        }}
        placeholder="Type a trader’s name"
        maxLength={120}
        autoCorrect={false}
        autoFocus
      />
      {text.length < 2 ? <AppText variant="caption">Enter at least two characters.</AppText> : null}
      {searching ? <AppText variant="caption">Finding traders…</AppText> : null}
      {current?.error ? (
        <Pressable accessibilityRole="button" onPress={() => setAttempt((value) => value + 1)}>
          <AppText variant="caption" color="red">
            {current.error} Tap to try again.
          </AppText>
        </Pressable>
      ) : null}
      {current && !current.error && !current.people.length ? <AppText variant="small">No traders found.</AppText> : null}
      {openError ? (
        <AppText variant="small" color="red" weight="semibold">
          {openError}
        </AppText>
      ) : null}
      <View style={styles.list}>
        {current?.people.map((person) => (
          <Pressable
            key={person.id}
            accessibilityRole="button"
            accessibilityLabel={`Message ${person.fullName}`}
            disabled={Boolean(opening)}
            onPress={() => void choose(person)}
            style={({ pressed }) => [styles.person, { backgroundColor: pressed ? colors.orangePale : colors.surface }]}>
            <Avatar initials={person.initials} imageUrl={person.avatarUrl} size="small" />
            <AppText variant="h3" numberOfLines={1} style={styles.flex}>
              {person.fullName}
            </AppText>
            {opening === person.id ? <ActivityIndicator size="small" color={colors.orange} /> : null}
          </Pressable>
        ))}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { gap: 8 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 10 },
});
