import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ChevronRight, Compass, MapPin, Search } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View, type DimensionValue } from 'react-native';

import { AppText, Card, Screen, TextField } from '@/components/ui';
import { useMarketplace, useTheme } from '@/providers';

const labels = [
  { text: 'Quezon City', top: '14%', left: '52%' },
  { text: 'Makati', top: '62%', left: '18%' },
  { text: 'Pasig', top: '48%', left: '66%' },
] as const;

export default function MapScreen() {
  const { colors, dark } = useTheme();
  const { items } = useMarketplace();
  const [query, setQuery] = useState('');
  const pins = items.slice(0, 6);
  const nearby = items
    .filter((item) => `${item.title} ${item.location}`.toLowerCase().includes(query.trim().toLowerCase()))
    .slice(0, 6);

  return (
    <Screen>
      <View style={[styles.map, { backgroundColor: dark ? '#22302a' : '#e8efe3' }]}>
        <View style={[styles.road, styles.roadOne, { backgroundColor: dark ? '#3a3a35' : '#ffffff' }]} />
        <View style={[styles.road, styles.roadTwo, { backgroundColor: dark ? '#3a3a35' : '#ffffff' }]} />
        <View style={[styles.water, { backgroundColor: dark ? '#1d2d48' : '#cfe1f7' }]} />
        {labels.map((label) => (
          <View key={label.text} style={[styles.label, { top: label.top, left: label.left, backgroundColor: colors.surface }]}>
            <AppText variant="caption" color="ink" weight="bold">
              {label.text}
            </AppText>
          </View>
        ))}
        {pins.map((item, index) => (
          <Pressable
            key={item.id}
            accessibilityLabel={`Open ${item.title}`}
            onPress={() => router.push(`/items/${item.id}`)}
            style={[
              styles.pin,
              {
                left: `${12 + ((index * 13) % 70)}%` as DimensionValue,
                top: `${20 + ((index * 17) % 55)}%` as DimensionValue,
                backgroundColor: colors.orange,
              },
            ]}>
            <MapPin size={16} color="#fff" fill="#fff" />
          </Pressable>
        ))}
        <View style={[styles.compass, { backgroundColor: colors.surface }]}>
          <Compass size={20} color={colors.ink} />
        </View>
      </View>

      <Card style={styles.list}>
        <TextField icon={Search} value={query} onChangeText={setQuery} placeholder="Search this area" />
        <AppText variant="h2">{nearby.length} trades nearby</AppText>
        {nearby.map((item) => (
          <Pressable key={item.id} onPress={() => router.push(`/items/${item.id}`)} style={styles.row}>
            <Image source={item.image} style={styles.thumb} contentFit="cover" />
            <View style={styles.flex}>
              <AppText variant="h3" numberOfLines={1}>
                {item.title}
              </AppText>
              <AppText variant="caption">
                {item.condition} · {item.location}
              </AppText>
            </View>
            <ChevronRight size={17} color={colors.muted} />
          </Pressable>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  map: { height: 340, borderRadius: 24, overflow: 'hidden' },
  road: { position: 'absolute', height: 14 },
  roadOne: { width: '140%', top: '40%', left: '-20%', transform: [{ rotate: '-18deg' }] },
  roadTwo: { width: '140%', top: '62%', left: '-20%', transform: [{ rotate: '24deg' }] },
  water: { position: 'absolute', width: 160, height: 160, borderRadius: 80, right: -40, bottom: -50 },
  label: { position: 'absolute', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  pin: { position: 'absolute', width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' },
  compass: { position: 'absolute', right: 12, top: 12, width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  list: { gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 52, height: 52, borderRadius: 12 },
  flex: { flex: 1 },
});
