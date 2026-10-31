import { MapPin, MapPinned, Search } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, TextField } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import { ApiError, itemService } from '@/services';
import { elevation } from '@/theme';
import type { Place } from '@/types/models';
import { errorMessage } from '@/utils/format';

/** Debounce, and keep at least this long between lookups (the backend allows about one per second). */
const DELAY_MS = 500;
const SPACING_MS = 1100;

/** Type a city or barangay and pick a suggestion (Photon via the backend), like the website's area search. */
export function PlaceSearch({ onSelect }: { onSelect: (place: Place) => void }) {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const lastSearch = useRef(0);

  useEffect(() => {
    const text = query.trim();
    setPlaces([]);
    setSearched(false);
    setError('');
    if (text.length < 2) return setBusy(false);
    setBusy(true);
    let active = true;
    let retry: ReturnType<typeof setTimeout> | undefined;
    async function load(again: boolean) {
      lastSearch.current = Date.now();
      try {
        const results = await itemService.searchPlaces(text);
        if (!active) return;
        setPlaces(results);
        setSearched(true);
        setBusy(false);
      } catch (caught) {
        if (!active) return;
        // Rate limited: one quiet retry, as on the website.
        if (caught instanceof ApiError && caught.status === 429 && !again) {
          retry = setTimeout(() => void load(true), SPACING_MS);
          return;
        }
        setBusy(false);
        setError(errorMessage(caught, 'Could not load places. Try again.'));
      }
    }
    const timer = setTimeout(() => void load(false), Math.max(DELAY_MS, lastSearch.current + SPACING_MS - Date.now()));
    return () => {
      active = false;
      clearTimeout(timer);
      clearTimeout(retry);
    };
  }, [query, attempt]);

  function choose(place: Place) {
    setQuery('');
    onSelect(place);
  }

  return (
    <View style={styles.wrap}>
      <TextField
        icon={Search}
        value={query}
        onChangeText={setQuery}
        placeholder="Search city or barangay"
        maxLength={160}
        autoCorrect={false}
        returnKeyType="search"
      />
      {busy ? <AppText variant="caption">Searching places…</AppText> : null}
      {searched && !places.length ? <AppText variant="caption">No places found. Try another city or barangay.</AppText> : null}
      {error ? (
        <View style={styles.row}>
          <AppText variant="caption" color="red" style={styles.flex}>
            {error}
          </AppText>
          <Pressable accessibilityRole="button" onPress={() => setAttempt((value) => value + 1)} hitSlop={8}>
            <AppText variant="caption" color="orange" weight="bold">
              Try again
            </AppText>
          </Pressable>
        </View>
      ) : null}
      {places.length ? (
        <View style={[styles.list, { backgroundColor: colors.surface }, elevation(1, colors)]}>
          {places.map((place, index) => (
            <Pressable
              key={place.id}
              accessibilityRole="button"
              onPress={() => choose(place)}
              style={({ pressed }) => [
                styles.option,
                index > 0 && { borderTopColor: colors.hairline, borderTopWidth: StyleSheet.hairlineWidth },
                pressed && { backgroundColor: colors.surface2 },
              ]}>
              <MapPinned size={15} color={colors.muted} />
              <AppText variant="small" color="ink" numberOfLines={2} style={styles.flex}>
                {place.label}
              </AppText>
            </Pressable>
          ))}
        </View>
      ) : null}
      {places.length || searched ? (
        <View style={styles.row}>
          <MapPin size={11} color={colors.muted2} />
          <AppText variant="caption">Places by Photon / OpenStreetMap</AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  list: { borderRadius: 14, overflow: 'hidden' },
  option: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 11 },
});
