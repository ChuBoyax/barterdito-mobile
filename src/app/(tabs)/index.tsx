import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  CalendarDays,
  ChevronRight,
  Heart,
  Leaf,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trophy,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { FeaturedCard, FilterSheet, ItemGrid, TraderRow } from '@/components/marketplace';
import { AppText, Badge, ChipRow, EmptyState, Screen, SectionHeading } from '@/components/ui';
import { useAuth, useMarketplace, useTheme } from '@/providers';
import { itemService } from '@/services';
import { avatarPalette, fonts } from '@/theme';
import type { ItemFilters, Trader } from '@/types/models';

const defaultFilters: ItemFilters = {
  category: 'All',
  search: '',
  condition: 'Any condition',
  location: 'Any location',
  sort: 'Newest first',
};

export default function BrowseScreen() {
  const { colors, dark } = useTheme();
  const { requireAuth } = useAuth();
  const { items, loading, refresh } = useMarketplace();
  const [filters, setFilters] = useState(defaultFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const visibleItems = useMemo(() => itemService.filterItems(items, filters), [items, filters]);
  const locations = useMemo(() => [...new Set(items.map((item) => item.location))].sort(), [items]);
  const hotItems = items.filter((item) => item.hot);
  const featured = items[1] ?? items[0];
  const filtersActive =
    filters.condition !== defaultFilters.condition ||
    filters.location !== defaultFilters.location ||
    filters.sort !== defaultFilters.sort;

  const traders = useMemo<Trader[]>(() => {
    const byOwner = new Map<string, Trader>();
    items.forEach((item, index) => {
      const id = item.userId ?? item.owner;
      if (byOwner.has(id)) return;
      byOwner.set(id, {
        id,
        name: item.owner,
        initials: item.ownerAvatar,
        avatarUrl: item.ownerAvatarUrl,
        rating: item.rating,
        trades: item.trades,
        color: avatarPalette[index % avatarPalette.length],
      });
    });
    return [...byOwner.values()].slice(0, 6);
  }, [items]);

  async function onRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  const update = (next: Partial<ItemFilters>) => setFilters((current) => ({ ...current, ...next }));

  return (
    <Screen padded={false} refreshing={refreshing} onRefresh={() => void onRefresh()} contentStyle={styles.content}>
      <View style={styles.section}>
        <LinearGradient
          colors={dark ? [colors.heroStart, colors.heroEnd] : ['#fff2e7', '#fffaf4', '#f3ede6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}>
          <Badge label="🇵🇭 Built for local traders" tone="orange" />
          <AppText variant="hero">
            Good finds deserve a{' '}
            <AppText variant="hero" color="orange" style={styles.italic}>
              second story.
            </AppText>
          </AppText>
          <AppText variant="body" color="muted">
            Swap things you have for things you’ll love—no cash needed.
          </AppText>
          <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <Search size={19} color={colors.muted} />
            <TextInput
              value={filters.search}
              onChangeText={(search) => update({ search })}
              placeholder="Search cameras, bikes, services…"
              placeholderTextColor={colors.muted2}
              style={[styles.searchInput, { color: colors.ink }]}
              accessibilityLabel="Search marketplace"
              returnKeyType="search"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Filters"
              onPress={() => setFiltersOpen(true)}
              style={[styles.filterButton, { backgroundColor: colors.orange }]}>
              <SlidersHorizontal size={17} color="#fff" />
              {filtersActive ? <View style={[styles.filterDot, { borderColor: colors.orange }]} /> : null}
            </Pressable>
          </View>
          <View style={styles.trust}>
            <TrustPill icon={ShieldCheck} label="Verified traders" />
            <TrustPill icon={MapPin} label="Meet locally" />
            <TrustPill icon={Leaf} label="Waste less" />
          </View>
          {featured ? (
            <Pressable onPress={() => router.push(`/items/${featured.id}`)} style={styles.heroPhoto}>
              <Image source={featured.image} style={StyleSheet.absoluteFill} contentFit="cover" />
              <View style={[styles.heroInfo, { backgroundColor: colors.surface }]}>
                <View style={styles.flex}>
                  <AppText variant="caption">Trending near you</AppText>
                  <AppText variant="h3" numberOfLines={1}>
                    {featured.title}
                  </AppText>
                </View>
                <Badge label="4.8 ★" tone="green" />
              </View>
              <View style={[styles.float, styles.floatOne, { backgroundColor: colors.surface }]}>
                <Heart size={14} color={colors.red} fill={colors.red} />
                <AppText variant="caption" color="ink" weight="bold">
                  28 traders like this
                </AppText>
              </View>
              <View style={[styles.float, styles.floatTwo, { backgroundColor: colors.surface }]}>
                <Zap size={14} color={colors.orange} />
                <AppText variant="caption" color="ink" weight="bold">
                  12 new finds today
                </AppText>
              </View>
            </Pressable>
          ) : null}
        </LinearGradient>
      </View>

      <ChipRow options={itemService.getCategories()} value={filters.category} onChange={(category) => update({ category })} />

      <View style={[styles.section, styles.shortcuts]}>
        <Shortcut icon={Plus} title="Post a Trade" text="List an item in minutes" tone="orange" onPress={() => requireAuth(() => router.push('/post-item'))} />
        <Shortcut icon={Trophy} title="Leaderboard" text="Meet top local traders" tone="cream" onPress={() => router.push('/leaderboard')} />
        <Shortcut icon={CalendarDays} title="Trade Events" text="Swap face-to-face" tone="green" onPress={() => router.push('/events')} />
      </View>

      {hotItems.length ? (
        <View>
          <View style={styles.section}>
            <SectionHeading title="Hot swaps near you" action="View map" onAction={() => router.push('/map')} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
            {hotItems.map((item) => (
              <FeaturedCard key={item.id} item={item} onPress={() => router.push(`/items/${item.id}`)} />
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View>
        <View style={styles.section}>
          <SectionHeading title="Featured traders" action="Leaderboard" onAction={() => router.push('/leaderboard')} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
          {traders.map((trader) => (
            <TraderRow key={trader.id} trader={trader} variant="card" onPress={() => router.push(`/traders/${trader.id}`)} />
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <SectionHeading title={`${visibleItems.length} fresh finds`} />
        {loading || visibleItems.length ? (
          <ItemGrid items={visibleItems} loading={loading} />
        ) : (
          <EmptyState icon={Search} title="No matches yet" text="Try a broader search, another category, or clear your filters." />
        )}
      </View>

      <FilterSheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        locations={locations}
        conditions={itemService.getConditions()}
        onChange={update}
      />
    </Screen>
  );
}

function TrustPill({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.trustPill}>
      <Icon size={15} color={colors.green} />
      <AppText variant="caption" weight="bold">
        {label}
      </AppText>
    </View>
  );
}

function Shortcut({
  icon: Icon,
  title,
  text,
  tone,
  onPress,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  tone: 'orange' | 'cream' | 'green';
  onPress: () => void;
}) {
  const { colors, dark } = useTheme();
  const palette = {
    orange: { bg: colors.orange, fg: '#fff', iconBg: 'rgba(255,255,255,0.2)' },
    cream: { bg: dark ? '#352b1d' : '#fff4dc', fg: colors.ink, iconBg: colors.yellow },
    green: { bg: colors.greenSoft, fg: colors.ink, iconBg: colors.green },
  }[tone];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.shortcut, { backgroundColor: palette.bg }, pressed && { opacity: 0.85 }]}>
      <View style={[styles.shortcutIcon, { backgroundColor: palette.iconBg }]}>
        <Icon size={20} color="#fff" />
      </View>
      <View style={styles.flex}>
        <AppText variant="h3" style={{ color: palette.fg }}>
          {title}
        </AppText>
        <AppText variant="caption" style={{ color: palette.fg, opacity: 0.8 }}>
          {text}
        </AppText>
      </View>
      <ChevronRight size={18} color={palette.fg} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { gap: 24, paddingTop: 8, paddingBottom: 40 },
  section: { paddingHorizontal: 16 },
  flex: { flex: 1 },
  hero: { borderRadius: 24, padding: 20, gap: 12, overflow: 'hidden' },
  italic: { fontStyle: 'italic' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 16, paddingLeft: 14, padding: 6, marginTop: 4 },
  searchInput: { flex: 1, fontFamily: fonts.medium, fontSize: 14, paddingVertical: 8 },
  filterButton: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  filterDot: { position: 'absolute', top: 6, right: 6, width: 9, height: 9, borderRadius: 5, backgroundColor: '#ffcd57', borderWidth: 2 },
  trust: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  trustPill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroPhoto: { height: 220, borderRadius: 20, overflow: 'hidden', marginTop: 8, justifyContent: 'flex-end' },
  heroInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 10, borderRadius: 14, padding: 10 },
  float: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  floatOne: { top: 12, left: 12 },
  floatTwo: { top: 52, right: 12 },
  shortcuts: { gap: 10 },
  shortcut: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, padding: 14 },
  shortcutIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  hRow: { gap: 12, paddingHorizontal: 16 },
});
