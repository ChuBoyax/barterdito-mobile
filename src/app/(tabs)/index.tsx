import { router } from 'expo-router';
import { ArrowUpRight, CalendarDays, Map, Plus, RotateCcw, Search, SlidersHorizontal, Trophy, X, type LucideIcon } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { AppHeader, MenuButton, NotificationBell } from '@/components/layout';
import { FeaturedCard, featuredCardWidth, FilterSheet, ItemGridRow, TraderRow, useGridRows, useInteractionSets, type GridRow } from '@/components/marketplace';
import { AppText, Avatar, Button, ChipRow, EmptyState, PressableScale, SectionHeading } from '@/components/ui';
import { useMountOnOpen } from '@/hooks/useMountOnOpen';
import { useResponsive } from '@/hooks/useResponsive';
import { useAuth, useMarketplace, useTheme } from '@/providers';
import { itemService } from '@/services';
import { avatarPalette, elevation, fonts, neu, tone as getTone, type Tone, maxFontScale } from '@/theme';
import type { ItemFilters, Trader } from '@/types/models';
import { firstName, pluralize } from '@/utils/format';
import { openItem } from '@/utils/navigation';

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
  const { gutter, innerWidth, columns, contentWidth } = useResponsive();
  const pad = { paddingHorizontal: gutter };
  const hRow = [styles.hRow, pad];
  const featuredSnap = featuredCardWidth(innerWidth, columns) + 14;
  // Exactly three trader cards fit across; the rest scroll in three at a time.
  const traderWidth = Math.floor((innerWidth - TRADER_GAP * 2) / 3);
  const { user, requireAuth } = useAuth();
  const { items, loading, loadingMore, error, hasMore, refresh, loadMore } = useMarketplace();
  const [filters, setFilters] = useState(defaultFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersMounted = useMountOnOpen(filtersOpen);
  const [refreshing, setRefreshing] = useState(false);

  const visibleItems = useMemo(() => itemService.filterItems(items, filters), [items, filters]);
  const locations = useMemo(() => [...new Set(items.map((item) => item.location))].sort(), [items]);
  const hotItems = useMemo(() => items.filter((item) => item.hot), [items]);
  const filtersActive = filters.condition !== defaultFilters.condition || filters.location !== defaultFilters.location || filters.sort !== defaultFilters.sort;
  const browsing = filters.search.trim() !== '' || filters.category !== defaultFilters.category || filtersActive;

  // Owners of the loaded listings; ratings are not tracked yet, so show their listing count.
  const traders = useMemo<(Trader & { listings: number })[]>(() => {
    const byOwner = new globalThis.Map<string, Trader & { listings: number }>();
    items.forEach((item, index) => {
      if (!item.userId || item.mine || item.status === 'Traded') return;
      const known = byOwner.get(item.userId);
      if (known) {
        known.listings += 1;
        return;
      }
      byOwner.set(item.userId, {
        id: item.userId,
        name: item.owner,
        initials: item.ownerAvatar,
        avatarUrl: item.ownerAvatarUrl,
        rating: item.rating,
        trades: item.trades,
        color: avatarPalette[index % avatarPalette.length],
        listings: 1,
      });
    });
    return [...byOwner.values()].sort((a, b) => b.listings - a.listings).slice(0, 6);
  }, [items]);

  async function onRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  const update = (next: Partial<ItemFilters>) => setFilters((current) => ({ ...current, ...next }));
  const clearAll = () => setFilters(defaultFilters);

  const resultsLabel = loading ? 'Searching…' : `${visibleItems.length} ${visibleItems.length === 1 ? 'result' : 'results'}`;

  const rows = useGridRows(visibleItems, loading, columns);
  const { saved, hearted, toggleSaved, toggleHeart } = useInteractionSets();
  const showGrid = loading || visibleItems.length > 0;

  const renderRow = useCallback(
    ({ item: row }: { item: GridRow }) => (
      <View style={pad}>
        <ItemGridRow row={row} columns={columns} saved={saved} hearted={hearted} onSave={toggleSaved} onHeart={toggleHeart} />
      </View>
    ),
    // `pad` only changes with the gutter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gutter, columns, saved, hearted, toggleSaved, toggleHeart],
  );

  // Infinite scroll on the feed (the website's Load more). Filtered results keep the
  // explicit button so a narrow search does not page through the whole catalog.
  const onEndReached = useCallback(() => {
    if (!browsing && hasMore && !loading && !loadingMore) void loadMore();
  }, [browsing, hasMore, loading, loadingMore, loadMore]);

  const header = (
    <View style={styles.headerStack}>
      <View style={pad}>
        <AppHeader
          eyebrow={greeting()}
          title={user ? `Hi, ${firstName(user.fullName)}` : 'Barterdito'}
          leading={
            <PressableScale onPress={() => router.push(user ? '/profile' : '/login')} scaleTo={0.92}>
              <Avatar initials={user?.initials ?? 'BD'} imageUrl={user?.avatarUrl} size="medium" ring online={Boolean(user)} />
            </PressableScale>
          }
          actions={
            <View style={styles.actions}>
              <NotificationBell />
              <MenuButton />
            </View>
          }
        />
      </View>
      <Animated.View entering={FadeInDown.duration(400)} style={[pad, styles.searchBlock]}>
        <View style={[styles.search, { backgroundColor: colors.background, borderColor: 'transparent' }, neu(colors, 2, true)]}>
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
        </Animated.View>
      ) : (
        <>
          <Animated.View entering={FadeInDown.delay(120).duration(400)} style={[pad, styles.quick]}>
            <PrimaryShortcut onPress={() => requireAuth(() => router.push('/post-item'))} />
            <View style={styles.shortcutRow}>
              <Shortcut icon={Map} tone="blue" title="Nearby" onPress={() => router.push('/map')} />
              <Shortcut icon={CalendarDays} tone="green" title="Events" onPress={() => router.push('/events')} />
              <Shortcut icon={Trophy} tone="yellow" title="Top traders" onPress={() => router.push('/leaderboard')} />
            </View>
          </Animated.View>
          {traders.length ? (
            <View>
              <View style={pad}>
                <SectionHeading eyebrow="Community" title="Active traders" />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[...hRow, styles.tradersRow]}
                decelerationRate="fast"
                snapToInterval={(traderWidth + TRADER_GAP) * 3}>
                {traders.map((trader) => (
                  <TraderRow
                    key={trader.id}
                    trader={trader}
                    variant="card"
                    width={traderWidth}
                    subtitle={pluralize(trader.listings, 'listing')}
                    onPress={() => router.push(`/traders/${trader.id}`)}
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}
          {hotItems.length ? (
            <View>
              <View style={pad}>
                <SectionHeading eyebrow="Trending" title="Hot swaps near you" action="See map" onAction={() => router.push('/map')} />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={hRow} decelerationRate="fast" snapToInterval={featuredSnap}>
                {hotItems.map((item) => (
                  <FeaturedCard key={item.id} item={item} onPress={() => openItem(item)} />
                ))}
              </ScrollView>
            </View>
          ) : null}
          <View style={pad}>
            <SectionHeading eyebrow="Fresh finds" title="Latest items" />
          </View>
        </>
      )}
    </View>
  );

  const empty = (
    <View style={pad}>
      {browsing ? (
        <EmptyState
          icon={Search}
          title="No matches found"
          text="Try different keywords, pick another category, or clear your filters."
          action="Clear all"
          actionIcon={RotateCcw}
          onAction={clearAll}
        />
      ) : error ? (
        <EmptyState icon={RotateCcw} title="Could not load listings" text={error} action="Try again" actionIcon={RotateCcw} onAction={() => void onRefresh()} />
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
  );

  const footer = (
    <View style={styles.footer}>
      {hasMore && showGrid && !loading ? (
        <View style={pad}>
          <Button label={browsing ? 'Search more listings' : 'Load more'} variant="secondary" loading={loadingMore} onPress={() => void loadMore()} />
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <FlatList
        data={showGrid ? rows : []}
        keyExtractor={rowKey}
        renderItem={renderRow}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={footer}
        ItemSeparatorComponent={RowGap}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.6}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={7}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, { maxWidth: contentWidth }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={colors.orange} colors={[colors.orange]} />}
      />
      {filtersMounted ? (
        <FilterSheet
          visible={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          filters={filters}
          locations={locations}
          conditions={itemService.getConditions()}
          onChange={update}
        />
      ) : null}
    </View>
  );
}

const TRADER_GAP = 10;
const rowKey = (row: GridRow) => row.key;
const RowGap = () => <View style={styles.rowGap} />;

function PrimaryShortcut({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel="Post a trade"
      onPress={onPress}
      scaleTo={0.98}
      style={[styles.primary, { backgroundColor: colors.orange }, neu(colors, 2)]}>
      <View style={[styles.primaryIcon, { borderColor: colors.onPrimary }]}>
        <Plus size={22} color={colors.onPrimary} strokeWidth={2.4} />
      </View>
      <View style={styles.flex}>
        <Text maxFontSizeMultiplier={maxFontScale} style={[styles.primaryTitle, { color: colors.onPrimary }]}>
          Post a trade
        </Text>
        <Text maxFontSizeMultiplier={maxFontScale} style={[styles.primaryText, { color: colors.onPrimary }]}>
          List an item in minutes — no cash needed
        </Text>
      </View>
      <ArrowUpRight size={20} color={colors.onPrimary} strokeWidth={2.2} />
    </PressableScale>
  );
}

function Shortcut({ icon: Icon, tone, title, onPress }: { icon: LucideIcon; tone: Tone; title: string; onPress: () => void }) {
  const { colors } = useTheme();
  const palette = getTone(colors, tone);
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      scaleTo={0.95}
      style={[styles.shortcut, { backgroundColor: colors.surface, borderColor: 'transparent' }, elevation(1, colors)]}>
      <Icon size={28} color={palette.fg} strokeWidth={1.9} />
      <AppText variant="caption" weight="semibold" color="ink" numberOfLines={1} align="center">
        {title}
      </AppText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  list: { width: '100%', alignSelf: 'center', paddingBottom: 40 },
  headerStack: { gap: 24, paddingBottom: 14 },
  footer: { gap: 24, paddingTop: 22 },
  rowGap: { height: 22 },
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
  shortcut: { flex: 1, alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 4 },
  hRow: { gap: 14, paddingBottom: 6 },
  tradersRow: { gap: TRADER_GAP, paddingTop: 2 },
});
