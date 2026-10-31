import { useInfiniteQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ChevronRight, MapPin, Search, SearchX, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { NearbyMap, type MapArea } from '@/components/marketplace/NearbyMap';
import { AppText, Badge, Button, Chip, EmptyState, LoadingView, Screen, TextField } from '@/components/ui';
import { useAuth, useTheme } from '@/providers';
import { ApiError, itemService } from '@/services';
import { MAP_RADII, type NearbyMapPage } from '@/services/itemService';
import { neu } from '@/theme';
import type { Item, User } from '@/types/models';
import { errorMessage } from '@/utils/format';
import { distanceLabel, shortLocation } from '@/utils/location';
import { openItem } from '@/utils/navigation';

/** The map needs a saved profile location with coordinates (GPS first, then the area centre). */
function hasMapCenter(user: User | null) {
  if (!user?.location?.trim()) return false;
  return (user.gpsLatitude != null && user.gpsLongitude != null) || (user.locationLatitude != null && user.locationLongitude != null);
}

function areasOf(items: Item[]): MapArea[] {
  const areas = new Map<string, MapArea>();
  for (const item of items) {
    if (item.latitude == null || item.longitude == null) continue;
    const key = `${item.latitude}:${item.longitude}`;
    const area = areas.get(key) ?? { key, latitude: item.latitude, longitude: item.longitude, count: 0 };
    area.count += 1;
    areas.set(key, area);
  }
  return [...areas.values()];
}

export default function MapScreen() {
  const { user } = useAuth();
  if (!user) {
    return (
      <Screen>
        <EmptyState
          icon={MapPin}
          title="Find trades near you"
          text="Sign in and set your profile location to explore nearby listings on the map."
          action="Sign in"
          onAction={() => router.push('/login')}
        />
      </Screen>
    );
  }
  if (!hasMapCenter(user)) return <LocationGate saved={user.location} />;
  return <NearbyContent user={user} />;
}

function LocationGate({ saved, error }: { saved?: string; error?: string }) {
  return (
    <Screen>
      <EmptyState
        icon={MapPin}
        title="Set your profile location"
        text={
          saved
            ? `Saved area: ${saved}. Choose your city in Edit profile, or use “Use my location”, so we can place it on the map.`
            : 'Nearby Map needs your saved location. Choose your country and city in Edit profile, or use “Use my location”, then save.'
        }
        action="Set profile location"
        actionIcon={MapPin}
        onAction={() => router.push('/settings?edit=profile')}
      />
      {error ? (
        <AppText variant="caption" color="red" align="center">
          {error}
        </AppText>
      ) : null}
    </Screen>
  );
}

function NearbyContent({ user }: { user: User }) {
  const { colors } = useTheme();
  const [radiusKm, setRadiusKm] = useState(50);
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  // Wait for a pause in typing before searching, like the website.
  useEffect(() => {
    const timer = setTimeout(() => setQuery(input.trim()), input.trim() ? 300 : 0);
    return () => clearTimeout(timer);
  }, [input]);

  const centerKey = `${user.gpsLatitude}:${user.gpsLongitude}:${user.locationLatitude}:${user.locationLongitude}`;
  const nearby = useInfiniteQuery({
    queryKey: ['nearbyMap', user.id, centerKey, radiusKm, query],
    queryFn: ({ pageParam }) => itemService.getNearbyMap(radiusKm, query, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last: NearbyMapPage, pages: NearbyMapPage[]) => {
      const loaded = pages.reduce((sum, page) => sum + page.items.length, 0);
      return last.items.length && loaded < last.total ? loaded : undefined;
    },
    placeholderData: (previous) => previous,
  });

  const first = nearby.data?.pages[0];
  const items = useMemo(() => {
    const seen = new Set<string>();
    return (nearby.data?.pages ?? []).flatMap((page) => page.items).filter((item) => !seen.has(item.id) && Boolean(seen.add(item.id)));
  }, [nearby.data]);
  const areas = useMemo(() => areasOf(items), [items]);
  const inArea = selected ? items.filter((item) => `${item.latitude}:${item.longitude}` === selected) : [];
  const list = selected && inArea.length ? inArea : items;

  // The backend still refuses a text-only location (e.g. saved on another device).
  if (nearby.error instanceof ApiError && nearby.error.status === 422) return <LocationGate saved={user.location} error={nearby.error.message} />;

  const center = first?.center ?? {
    latitude: (user.gpsLatitude ?? user.locationLatitude)!,
    longitude: (user.gpsLongitude ?? user.locationLongitude)!,
  };

  return (
    <Screen contentStyle={styles.screen} refreshing={nearby.isRefetching && !nearby.isFetchingNextPage} onRefresh={() => void nearby.refetch()}>
      <View style={[styles.heading, { backgroundColor: colors.surface }, neu(colors, 1)]}>
        <MapPin size={18} color={colors.orange} />
        <View style={styles.flex}>
          <AppText variant="h3" numberOfLines={1}>
            {shortLocation(first?.location || user.location)}
          </AppText>
          <AppText variant="caption">Within {radiusKm} km. Pins are traders’ profile areas; agree on the exact meetup in chat.</AppText>
        </View>
        <Pressable accessibilityRole="button" onPress={() => router.push('/settings?edit=profile')} hitSlop={8}>
          <AppText variant="caption" color="orange" weight="bold">
            Edit
          </AppText>
        </Pressable>
      </View>

      <NearbyMap center={center} radiusKm={radiusKm} areas={areas} selected={selected} onSelect={setSelected} />

      <TextField icon={Search} value={input} onChangeText={setInput} placeholder="Search this area" maxLength={100} returnKeyType="search" autoCorrect={false} />
      <View style={styles.radii}>
        {MAP_RADII.map((km) => (
          <Chip
            key={km}
            label={`${km} km`}
            active={radiusKm === km}
            onPress={() => {
              setRadiusKm(km);
              setSelected(null);
            }}
          />
        ))}
      </View>

      <View style={styles.listHeader}>
        <AppText variant="h2" style={styles.flex}>
          {selected && inArea.length ? shortLocation(inArea[0]!.location) : 'Nearby trades'}
        </AppText>
        {selected ? (
          <Pressable accessibilityRole="button" onPress={() => setSelected(null)} hitSlop={8} style={styles.inline}>
            <X size={14} color={colors.orange} />
            <AppText variant="caption" color="orange" weight="bold">
              Show all
            </AppText>
          </Pressable>
        ) : first ? (
          <Badge label={`${first.total} found`} tone="orange" />
        ) : null}
      </View>

      {nearby.isPending ? (
        <LoadingView variant="list" inline label="Finding listings near you" />
      ) : nearby.isError && !items.length ? (
        <EmptyState icon={MapPin} title="Nearby listings unavailable" text={errorMessage(nearby.error)} action="Try again" onAction={() => void nearby.refetch()} />
      ) : !items.length ? (
        <View style={styles.empty}>
          <SearchX size={28} color={colors.muted2} />
          <AppText variant="h3" align="center">
            {query ? 'No nearby listings match your search' : 'No listings from other traders here yet'}
          </AppText>
          <AppText variant="small" align="center">
            {query ? 'Try another item name or clear your search.' : 'Try a wider distance or check back for new trades.'}
          </AppText>
          {query ? <Button label="Clear search" variant="ghost" compact onPress={() => setInput('')} /> : null}
        </View>
      ) : (
        <>
          <View style={[styles.list, { backgroundColor: colors.surface }, neu(colors, 2)]}>
            {list.map((item, index) => (
              <NearbyRow key={item.id} item={item} first={index === 0} />
            ))}
          </View>
          {!selected && nearby.hasNextPage ? (
            <Button label="Load more nearby listings" variant="secondary" loading={nearby.isFetchingNextPage} onPress={() => void nearby.fetchNextPage()} />
          ) : null}
        </>
      )}
    </Screen>
  );
}

function NearbyRow({ item, first }: { item: Item; first: boolean }) {
  const { colors } = useTheme();
  const distance = distanceLabel(item.distanceKm) || 'Profile area';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View ${item.title}`}
      onPress={() => openItem(item)}
      style={({ pressed }) => [
        styles.row,
        !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
        pressed && { backgroundColor: colors.orangePale },
      ]}>
      <Image source={item.image} cachePolicy="memory-disk" style={styles.thumb} contentFit="cover" />
      <View style={[styles.flex, styles.rowBody]}>
        <AppText variant="h3" numberOfLines={1}>
          {item.title}
        </AppText>
        <AppText variant="caption" numberOfLines={1}>
          {item.condition} · {shortLocation(item.location)}
        </AppText>
        <AppText variant="caption" color="orange" weight="semibold">
          {distance}
          {item.status === 'In Negotiation' ? ' · In negotiation' : ''}
        </AppText>
      </View>
      <ChevronRight size={18} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { gap: 16, paddingBottom: 32 },
  flex: { flex: 1 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, padding: 14 },
  radii: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  listHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  list: { borderRadius: 24, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14, paddingVertical: 12 },
  rowBody: { gap: 3 },
  thumb: { width: 64, height: 64, borderRadius: 16 },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 32 },
});
