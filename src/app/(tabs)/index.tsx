import { router } from 'expo-router';
import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  Map,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trophy,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { AppHeader, MenuButton } from '@/components/layout';
import { FeaturedCard, featuredCardWidth, FilterSheet, ItemGrid, TraderRow } from '@/components/marketplace';
import { AppText, Avatar, ChipRow, EmptyState, IconButton, IconTile, PressableScale, Screen, SectionHeading } from '@/components/ui';
import { useResponsive } from '@/hooks/useResponsive';
import { useAuth, useMarketplace, useTheme } from '@/providers';
import { itemService } from '@/services';
import { avatarPalette, elevation, fonts, type Tone, maxFontScale } from '@/theme';
import type { ItemFilters, Trader } from '@/types/models';

const defaultFilters: ItemFilters = {
  category: 'All',
  search: '',
  condition: 'Any condition',
  location: 'Any location',
  sort: 'Newest first',
};

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function BrowseScreen() {
  const { colors } = useTheme();
  const { gutter, width, isTablet } = useResponsive();
  const pad = { paddingHorizontal: gutter };
  const hRow = [styles.hRow, pad];
  const featuredSnap = featuredCardWidth(width, isTablet) + 12;
  const { user, requireAuth } = useAuth();
  const { items, loading, refresh } = useMarketplace();
  const [filters, setFilters] = useState(defaultFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const visibleItems = useMemo(() => itemService.filterItems(items, filters), [items, filters]);
  const locations = useMemo(() => [...new Set(items.map((item) => item.location))].sort(), [items]);
  const hotItems = items.filter((item) => item.hot);
  const filtersActive =
    filters.condition !== defaultFilters.condition || filters.location !== defaultFilters.location || filters.sort !== defaultFilters.sort;
  // While the user is searching or filtering, show only the results — no promos in the way.
  const browsing = filters.search.trim() !== '' || filters.category !== defaultFilters.category || filtersActive;

  const traders = useMemo<Trader[]>(() => {
    const byOwner = new globalThis.Map<string, Trader>();
    items.forEach((item, index) => {
      const id = item.userId ?? item.owner;
      if (byOwner.has(id) || item.mine) return;
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
  const clearAll = () => setFilters(defaultFilters);

  const resultsLabel = loading ? 'Searching…' : `${visibleItems.length} ${visibleItems.length === 1 ? 'result' : 'results'}`;

  return (
    <Screen
      padded={false}
      refreshing={refreshing}
      onRefresh={() => void onRefresh()}
      contentStyle={styles.content}
      header={
        <View style={pad}>
          <AppHeader
            eyebrow={greeting()}
            title={user ? `Hi, ${user.fullName.split(' ')[0]}` : 'Barterdito'}
            leading={
              <PressableScale onPress={() => router.push(user ? '/profile' : '/login')} scaleTo={0.92}>
                <Avatar initials={user?.initials ?? 'BD'} size="medium" ring online={Boolean(user)} />
              </PressableScale>
            }
            actions={
              <View style={styles.actions}>
                <IconButton icon={Bell} label="Notifications" size={19} badge={2} onPress={() => router.push('/notifications')} />
                <MenuButton />
              </View>
            }
          />
        </View>
      }>
      <Animated.View entering={FadeInDown.duration(400)} style={[pad, styles.searchBlock]}>
        <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.line }, elevation(1, colors)]}>
          <Search size={20} color={colors.muted} strokeWidth={2} />
          <TextInput
            maxFontSizeMultiplier={maxFontScale}
            value={filters.search}
            onChangeText={(search) => update({ search })}
            placeholder="What are you looking for?"
            placeholderTextColor={colors.muted2}
            selectionColor={colors.orange}
            style={[styles.searchInput, { color: colors.ink }]}
            accessibilityLabel="Search marketplace"
            returnKeyType="search"
            autoCorrect={false}
          />
          {filters.search ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              onPress={() => update({ search: '' })}
              hitSlop={10}
              style={[styles.clearButton, { backgroundColor: colors.surface2 }]}>
              <X size={14} color={colors.muted} strokeWidth={2.6} />
            </Pressable>
          ) : null}
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={filtersActive ? 'Filters, active' : 'Filters'}
            onPress={() => setFiltersOpen(true)}
            scaleTo={0.9}
            style={[styles.filterButton, { backgroundColor: filtersActive ? colors.orange : colors.surface2 }]}>
            <SlidersHorizontal size={18} color={filtersActive ? colors.onPrimary : colors.ink} strokeWidth={2.2} />
          </PressableScale>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(60).duration(400)} style={styles.chips}>
        <ChipRow inset={gutter} options={itemService.getCategories()} value={filters.category} onChange={(category) => update({ category })} />
      </Animated.View>

      {browsing ? (
        <Animated.View entering={FadeIn.duration(250)} style={pad}>
          <View style={styles.resultsHeader}>
            <AppText variant="h2" style={styles.flex}>
              {resultsLabel}
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search and filters"
              onPress={clearAll}
              hitSlop={8}
              style={[styles.resetButton, { backgroundColor: colors.surface2 }]}>
              <RotateCcw size={13} color={colors.ink} strokeWidth={2.4} />
              <AppText variant="caption" weight="bold" color="ink">
                Clear all
              </AppText>
            </Pressable>
          </View>
          {loading || visibleItems.length ? (
            <ItemGrid items={visibleItems} loading={loading} />
          ) : (
            <EmptyState
              icon={Search}
              title="No matches found"
              text="Try different keywords, pick another category, or clear your filters."
              action="Clear all"
              actionIcon={RotateCcw}
              onAction={clearAll}
            />
          )}
        </Animated.View>
      ) : (
        <>
          <Animated.View entering={FadeInDown.delay(120).duration(400)} style={[pad, styles.quick]}>
            <PrimaryShortcut onPress={() => requireAuth(() => router.push('/post-item'))} />
            <View style={styles.shortcutRow}>
              <Shortcut icon={Map} tone="blue" title="Nearby" onPress={() => router.push('/map')} />
              <Shortcut icon={Sparkles} tone="violet" title="For you" onPress={() => requireAuth(() => router.push('/recommendations'))} />
              <Shortcut icon={CalendarDays} tone="green" title="Events" onPress={() => router.push('/events')} />
              <Shortcut icon={Trophy} tone="yellow" title="Top traders" onPress={() => router.push('/leaderboard')} />
            </View>
          </Animated.View>

          {hotItems.length ? (
            <View>
              <View style={pad}>
                <SectionHeading eyebrow="Trending" title="Hot swaps near you" action="See map" onAction={() => router.push('/map')} />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={hRow} decelerationRate="fast" snapToInterval={featuredSnap}>
                {hotItems.map((item) => (
                  <FeaturedCard key={item.id} item={item} onPress={() => router.push(`/items/${item.id}`)} />
                ))}
              </ScrollView>
            </View>
          ) : null}

          <View style={pad}>
            <SectionHeading eyebrow="Fresh finds" title="Latest items" />
            {loading || visibleItems.length ? (
              <ItemGrid items={visibleItems} loading={loading} />
            ) : (
              <EmptyState
                icon={Plus}
                title="Nothing listed yet"
                text="Be the first to post something to swap in your area."
                action="Post a trade"
                onAction={() => requireAuth(() => router.push('/post-item'))}
              />
            )}
          </View>

          {traders.length ? (
            <View>
              <View style={pad}>
                <SectionHeading eyebrow="Community" title="Featured traders" action="See all" onAction={() => router.push('/leaderboard')} />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={hRow}>
                {traders.map((trader) => (
                  <TraderRow key={trader.id} trader={trader} variant="card" onPress={() => router.push(`/traders/${trader.id}`)} />
                ))}
              </ScrollView>
            </View>
          ) : null}
        </>
      )}

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

function PrimaryShortcut({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel="Post a trade"
      onPress={onPress}
      scaleTo={0.98}
      style={[styles.primary, { backgroundColor: colors.orange }]}>
      <View style={[styles.primaryIcon, { borderColor: colors.onPrimary }]}>
        <Plus size={22} color={colors.onPrimary} strokeWidth={2.4} />
      </View>
      <View style={styles.flex}>
        <Text maxFontSizeMultiplier={maxFontScale} style={[styles.primaryTitle, { color: colors.onPrimary }]}>Post a trade</Text>
        <Text maxFontSizeMultiplier={maxFontScale} style={[styles.primaryText, { color: colors.onPrimary }]}>List an item in minutes — no cash needed</Text>
      </View>
      <ArrowUpRight size={20} color={colors.onPrimary} strokeWidth={2.2} />
    </PressableScale>
  );
}

function Shortcut({ icon, tone, title, onPress }: { icon: LucideIcon; tone: Tone; title: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      scaleTo={0.95}
      style={[styles.shortcut, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      <IconTile icon={icon} tone={tone} size={40} />
      <AppText variant="caption" weight="semibold" color="ink" numberOfLines={1} align="center">
        {title}
      </AppText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  content: { gap: 24, paddingTop: 0 },
  flex: { flex: 1 },
  actions: { flexDirection: 'row', gap: 8 },
  searchBlock: { marginTop: 4 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 16, height: 54, paddingLeft: 16, paddingRight: 6 },
  searchInput: { flex: 1, fontFamily: fonts.medium, fontSize: 15, paddingVertical: 10 },
  clearButton: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  filterButton: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  chips: { marginTop: -12 },
  resultsHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  resetButton: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  quick: { gap: 12 },
  shortcutRow: { flexDirection: 'row', gap: 10 },
  primary: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 20, padding: 16 },
  primaryIcon: { width: 46, height: 46, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', opacity: 0.95 },
  primaryTitle: { fontFamily: fonts.extrabold, fontSize: 17 },
  primaryText: { fontFamily: fonts.medium, fontSize: 12.5, opacity: 0.88 },
  shortcut: { flex: 1, alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 4 },
  hRow: { gap: 12, paddingBottom: 6 },
});
