import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ArrowUpRight, ChevronRight, LocateFixed, MapPin, Search, SearchX } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, type DimensionValue } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';

import { AppText, Badge, PressableScale, Screen, TextField } from '@/components/ui';
import { useMarketplace, useTheme } from '@/providers';
import { neu } from '@/theme';
import type { Item } from '@/types/models';
import { displayLocation } from '@/utils/listing';
import { pluralize } from '@/utils/format';

/** Illustrative preview, same as the web: pins are spread deterministically, not plotted from coordinates. */
function pinPosition(index: number) {
  return {
    left: `${10 + ((index * 23) % 68)}%` as DimensionValue,
    top: `${16 + ((index * 29) % 52)}%` as DimensionValue,
  };
}

export default function MapScreen() {
  const { colors } = useTheme();
  const { items } = useMarketplace();
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const pins = useMemo(() => items.slice(0, 6), [items]);
  const nearby = useMemo(() => {
    const term = query.trim().toLowerCase();
    return items.filter((item) => `${item.title} ${item.location} ${item.category}`.toLowerCase().includes(term)).slice(0, 6);
  }, [items, query]);
  const selected = pins.find((item) => item.id === selectedId) ?? pins[0];

  return (
    <Screen contentStyle={styles.screen}>
      <View style={[styles.map, { backgroundColor: colors.mapLand }, neu(colors, 2)]}>
        <MapArt />
        <YouAreHere />
        {pins.map((item, index) => (
          <PhotoPin key={item.id} item={item} active={item.id === selected?.id} position={pinPosition(index)} onPress={() => setSelectedId(item.id)} />
        ))}

        <View style={[styles.counter, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
          <View style={[styles.liveDot, { backgroundColor: colors.green }]} />
          <AppText variant="caption" color="ink" weight="bold">
            {pluralize(pins.length, 'trade')} around you
          </AppText>
        </View>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Recenter map"
          onPress={() => setSelectedId(null)}
          scaleTo={0.9}
          style={[styles.locate, { backgroundColor: colors.surface }, neu(colors, 1)]}>
          <LocateFixed size={19} color={colors.ink} strokeWidth={2.1} />
        </PressableScale>

        {selected ? <Callout key={selected.id} item={selected} /> : null}
      </View>

      <View style={styles.listHeader}>
        <View style={styles.flex}>
          <AppText variant="eyebrow" color="orange">
            Around you
          </AppText>
          <AppText variant="h1">Nearby trades</AppText>
        </View>
        <Badge label={`${nearby.length} found`} tone="orange" />
      </View>
      <TextField icon={Search} value={query} onChangeText={setQuery} placeholder="Search items or places" returnKeyType="search" autoCorrect={false} />

      {nearby.length ? (
        <View style={[styles.list, { backgroundColor: colors.surface }, neu(colors, 2)]}>
          {nearby.map((item, index) => (
            <NearbyRow key={item.id} item={item} first={index === 0} active={item.id === selected?.id} />
          ))}
        </View>
      ) : (
        <View style={styles.empty}>
          <SearchX size={28} color={colors.muted2} />
          <AppText variant="h3" align="center">
            No trades match “{query.trim()}”
          </AppText>
          <AppText variant="small" align="center">
            Try a different item name or place.
          </AppText>
        </View>
      )}
    </Screen>
  );
}

/** Stylised streets, park and river drawn with plain views, so no map SDK is needed for the preview. */
function MapArt() {
  const { colors } = useTheme();
  const road = { backgroundColor: colors.mapRoad };
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.park, { backgroundColor: colors.greenSoft }]} />
      <View style={[styles.river, { backgroundColor: colors.mapWater }]} />
      <View style={[styles.street, styles.avenueOne, road]} />
      <View style={[styles.street, styles.avenueTwo, road]} />
      <View style={[styles.street, styles.laneOne, road]} />
      <View style={[styles.street, styles.laneTwo, road]} />
      <View style={[styles.street, styles.laneThree, road]} />
    </View>
  );
}

function YouAreHere() {
  const { colors } = useTheme();
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), -1, false);
  }, [pulse]);
  const ring = useAnimatedStyle(() => ({ opacity: 0.45 * (1 - pulse.value), transform: [{ scale: 1 + pulse.value * 2.2 }] }));
  return (
    <View style={styles.you} pointerEvents="none" accessibilityLabel="Your location">
      <Animated.View style={[styles.youRing, { backgroundColor: colors.blue }, ring]} />
      <View style={[styles.youDot, { backgroundColor: colors.blue, borderColor: colors.white }]} />
    </View>
  );
}

function PhotoPin({ item, active, position, onPress }: { item: Item; active: boolean; position: { left: DimensionValue; top: DimensionValue }; onPress: () => void }) {
  const { colors } = useTheme();
  const ring = active ? colors.orange : colors.white;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Show ${item.title}`}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      hitSlop={6}
      style={[styles.pin, position, active && styles.pinActive]}>
      <View style={[styles.pinHead, { borderColor: ring, backgroundColor: colors.surface2 }, neu(colors, 1)]}>
        <Image source={item.image} cachePolicy="memory-disk" style={styles.pinImage} contentFit="cover" recyclingKey={item.id} />
      </View>
      <View style={[styles.pinTail, { backgroundColor: ring }]} />
    </Pressable>
  );
}

function Callout({ item }: { item: Item }) {
  const { colors } = useTheme();
  return (
    <Animated.View entering={FadeInDown.duration(260)} style={styles.calloutWrap}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.title}`}
        onPress={() => router.push(`/items/${item.id}`)}
        scaleTo={0.98}
        style={[styles.callout, { backgroundColor: colors.surface }, neu(colors, 2)]}>
        <Image source={item.image} cachePolicy="memory-disk" style={styles.calloutImage} contentFit="cover" />
        <View style={styles.flex}>
          <AppText variant="h3" numberOfLines={1}>
            {item.title}
          </AppText>
          <View style={styles.meta}>
            <MapPin size={12} color={colors.muted} />
            <AppText variant="caption" numberOfLines={1} style={styles.flex}>
              {displayLocation(item.location)}
            </AppText>
          </View>
        </View>
        <View style={[styles.go, { backgroundColor: colors.orange }]}>
          <ArrowUpRight size={18} color={colors.onPrimary} strokeWidth={2.4} />
        </View>
      </PressableScale>
    </Animated.View>
  );
}

function NearbyRow({ item, first, active }: { item: Item; first: boolean; active: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${item.title}`}
      onPress={() => router.push(`/items/${item.id}`)}
      style={({ pressed }) => [
        styles.row,
        !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
        (pressed || active) && { backgroundColor: colors.orangePale },
      ]}>
      <Image source={item.image} cachePolicy="memory-disk" style={styles.thumb} contentFit="cover" />
      <View style={[styles.flex, styles.rowBody]}>
        <AppText variant="h3" numberOfLines={1}>
          {item.title}
        </AppText>
        <View style={styles.meta}>
          <MapPin size={12} color={colors.muted} />
          <AppText variant="caption" numberOfLines={1} style={styles.flex}>
            {displayLocation(item.location)}
          </AppText>
        </View>
        <Badge label={item.condition} tone={active ? 'orange' : 'neutral'} />
      </View>
      <ChevronRight size={18} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { gap: 18, paddingBottom: 32 },
  flex: { flex: 1 },
  map: { height: 360, borderRadius: 28, overflow: 'hidden' },

  park: { position: 'absolute', width: 150, height: 110, borderRadius: 40, top: -20, left: -30, opacity: 0.9 },
  river: { position: 'absolute', width: '160%', height: 46, borderRadius: 23, bottom: 34, left: '-30%', transform: [{ rotate: '-12deg' }] },
  street: { position: 'absolute', borderRadius: 4 },
  avenueOne: { width: '150%', height: 12, top: '36%', left: '-25%', transform: [{ rotate: '-16deg' }] },
  avenueTwo: { width: 12, height: '150%', top: '-25%', left: '58%', transform: [{ rotate: '14deg' }] },
  laneOne: { width: '150%', height: 5, top: '18%', left: '-25%', transform: [{ rotate: '6deg' }] },
  laneTwo: { width: 5, height: '150%', top: '-25%', left: '24%', transform: [{ rotate: '-8deg' }] },
  laneThree: { width: 5, height: '150%', top: '-25%', left: '84%', transform: [{ rotate: '4deg' }] },

  you: { position: 'absolute', left: '46%', top: '44%', width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  youRing: { position: 'absolute', width: 18, height: 18, borderRadius: 9 },
  youDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 3 },

  pin: { position: 'absolute', alignItems: 'center' },
  pinActive: { zIndex: 2, transform: [{ scale: 1.18 }] },
  pinHead: { width: 44, height: 44, borderRadius: 22, borderWidth: 3, overflow: 'hidden' },
  pinImage: { width: '100%', height: '100%' },
  pinTail: { width: 10, height: 10, marginTop: -6, transform: [{ rotate: '45deg' }], borderRadius: 2 },

  counter: { position: 'absolute', top: 14, left: 14, flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  locate: { position: 'absolute', top: 12, right: 12, width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  calloutWrap: { position: 'absolute', left: 12, right: 12, bottom: 12, zIndex: 3 },
  callout: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, padding: 10 },
  calloutImage: { width: 52, height: 52, borderRadius: 14 },
  go: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },

  listHeader: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginTop: 6 },
  list: { borderRadius: 24, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14, paddingVertical: 12 },
  rowBody: { gap: 5 },
  thumb: { width: 64, height: 64, borderRadius: 16 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 32 },
});
