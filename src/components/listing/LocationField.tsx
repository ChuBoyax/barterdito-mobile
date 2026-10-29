import * as Location from 'expo-location';
import { Crosshair, MapPin, MapPinned, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from 'react-native';

import { AppText, TextField } from '@/components/ui';
import { useToast } from '@/providers/ToastProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { elevation } from '@/theme';
import { itemService } from '@/services';
import type { Place } from '@/services/itemService';
import { errorMessage } from '@/utils/format';
import { mapLink } from '@/utils/listing';

type Pin = { latitude: number; longitude: number };

type LocationFieldProps = {
  value: string;
  pin: Pin | null;
  error?: string;
  onChange: (label: string, pin: Pin | null) => void;
};

const SEARCH_DELAY = 650;

/**
 * Public pickup area: type a city/barangay to get place suggestions (same backend lookup
 * as the website), or use GPS. Picking either saves an optional public map pin.
 */
export function LocationField({ value, pin, error, onChange }: LocationFieldProps) {
  const { colors } = useTheme();
  const showToast = useToast();
  const [query, setQuery] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const latest = useRef(0);

  useEffect(() => {
    const text = query.trim();
    if (text.length < 2) {
      setPlaces([]);
      return;
    }
    const request = ++latest.current;
    const timer = setTimeout(() => {
      setSearching(true);
      itemService
        .searchPlaces(text)
        .then((results) => request === latest.current && setPlaces(results))
        .catch(() => request === latest.current && setPlaces([]))
        .finally(() => request === latest.current && setSearching(false));
    }, SEARCH_DELAY);
    return () => clearTimeout(timer);
  }, [query]);

  function type(text: string) {
    setQuery(text);
    // A typed label no longer matches the old pin.
    onChange(text, null);
  }

  function choose(place: Place) {
    latest.current++;
    setQuery('');
    setPlaces([]);
    setSearching(false);
    onChange(place.label.slice(0, 160), { latitude: place.latitude, longitude: place.longitude });
  }

  async function locate() {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) return showToast('Location permission was not granted');
      const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const point = { latitude: Number(coords.latitude.toFixed(6)), longitude: Number(coords.longitude.toFixed(6)) };
      const [place] = await Location.reverseGeocodeAsync(coords).catch(() => []);
      const area = [place?.district, place?.city ?? place?.subregion].filter(Boolean).join(', ');
      latest.current++;
      setQuery('');
      setPlaces([]);
      onChange(area || value.trim() || `Pinned location (${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)})`, point);
      showToast(area ? `Pickup area set to ${area}` : 'Map pin added');
    } catch (caught) {
      showToast(errorMessage(caught, 'Could not get your location'));
    } finally {
      setLocating(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <TextField
        label="Pickup area"
        icon={MapPin}
        value={value}
        onChangeText={type}
        placeholder="Search a barangay or city"
        maxLength={160}
        error={error}
        hint="Shown publicly. Choose a public meetup area, not your home address."
        right={
          <Pressable accessibilityRole="button" disabled={locating} onPress={() => void locate()} hitSlop={6} style={styles.gps}>
            {locating ? <ActivityIndicator size="small" color={colors.orange} /> : <Crosshair size={15} color={colors.orange} />}
            <AppText variant="caption" color="orange" weight="bold">
              {locating ? 'Locating…' : 'Use GPS'}
            </AppText>
          </Pressable>
        }
      />
      {searching || places.length ? (
        <View style={[styles.suggestions, { backgroundColor: colors.surface, borderColor: 'transparent' }, elevation(1, colors)]}>
          {searching && !places.length ? (
            <AppText variant="caption" style={styles.suggestion}>
              Searching places…
            </AppText>
          ) : (
            places.map((place, index) => (
              <Pressable
                key={place.id}
                accessibilityRole="button"
                onPress={() => choose(place)}
                style={({ pressed }) => [
                  styles.suggestion,
                  index > 0 && { borderTopColor: colors.hairline, borderTopWidth: StyleSheet.hairlineWidth },
                  pressed && { backgroundColor: colors.surface2 },
                ]}>
                <MapPinned size={15} color={colors.muted} />
                <AppText variant="small" color="ink" style={styles.flex} numberOfLines={2}>
                  {place.label}
                </AppText>
              </Pressable>
            ))
          )}
        </View>
      ) : null}
      {pin ? (
        <View style={[styles.pin, { backgroundColor: colors.greenSoft }]}>
          <MapPinned size={15} color={colors.green} />
          <Pressable accessibilityRole="link" style={styles.flex} onPress={() => void Linking.openURL(mapLink(pin.latitude, pin.longitude))}>
            <AppText variant="caption" color="green" weight="bold">
              Map pin saved · {pin.latitude.toFixed(4)}, {pin.longitude.toFixed(4)}
            </AppText>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Remove map pin" onPress={() => onChange(value, null)} hitSlop={8}>
            <X size={15} color={colors.green} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  flex: { flex: 1 },
  gps: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  suggestions: { borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  suggestion: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 11 },
  pin: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9 },
});
