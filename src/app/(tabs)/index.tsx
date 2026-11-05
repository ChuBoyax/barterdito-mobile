import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { CalendarDays, Globe, MapPin, Plus, RotateCcw, Search, Trophy, type LucideIcon } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppHeader, MenuButton, NotificationBell } from '@/components/layout';
import { FeaturedCard, featuredCardWidth, FilterSheet, ItemGridRow, useGridRows, useInteractionSets, type GridRow } from '@/components/marketplace';
import { AppText, Avatar, Button, ChipRow, EmptyState, FilterButton, PressableScale, SearchField, SectionHeading } from '@/components/ui';
import { useMountOnOpen } from '@/hooks/useMountOnOpen';
import { useResponsive } from '@/hooks/useResponsive';
import { useAuth, useMarketplace, useTheme } from '@/providers';
import { itemService } from '@/services';
import { NEARBY_RADIUS_KM } from '@/services/itemService';
import { fonts, maxFontScale, neu } from '@/theme';
import type { ItemFilters } from '@/types/models';
import { firstName } from '@/utils/format';
import { shortLocation } from '@/utils/location';
import { openItem } from '@/utils/navigation';

const defaultFilters: ItemFilters = {
  category: 'All',
  search: '',
  condition: 'Any condition',
  sort: 'Nearest first',
};

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function BrowseScreen() {
  const { colors, dark } = useTheme();
  const { gutter, innerWidth, columns, contentWidth } = useResponsive();
  const pad = { paddingHorizontal: gutter };
  const featuredSnap = featuredCardWidth(innerWidth, columns) + 14;
  const { user, requireAuth } = useAuth();
  const { items, loading, loadingMore, error, hasMore, refresh, loadMore, area, profileArea, setArea } = useMarketplace();
  const [filters, setFilters] = useState(defaultFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersMounted = useMountOnOpen(filtersOpen);
  const [refreshing, setRefreshing] = useState(false);

  const visibleItems = useMemo(() => itemService.filterItems(items, filters), [items, filters]);
  const hotItems = useMemo(() => items.filter((item) => item.hot && item.status !== 'Traded'), [items]);
  // The profile area is the default, so only another place (or "Any location") counts as a filter.
  const areaChanged = (area?.id ?? null) !== (profileArea?.id ?? null);
  const filterCount = [filters.condition !== defaultFilters.condition, filters.sort !== defaultFilters.sort, areaChanged].filter(Boolean).length;
  const browsing = filters.search.trim() !== '' || filters.category !== defaultFilters.category || filterCount > 0;

  async function onRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  const update = (next: Partial<ItemFilters>) => setFilters((current) => ({ ...current, ...next }));
  const clearAll = () => {
    setFilters(defaultFilters);
    setArea(profileArea);
  };
  const addLocation = () => requireAuth(() => router.push('/settings?edit=profile'));

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

      <Animated.View entering={FadeInDown.duration(400)} style={pad}>
        <LinearGradient
          colors={dark ? [colors.surface2, colors.surface] : ['#fbf1e7', '#f6efe8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}>
          <Text maxFontSizeMultiplier={maxFontScale} style={[styles.heroTitle, { color: colors.ink }]}>
            Shopping
          </Text>
          <Text maxFontSizeMultiplier={maxFontScale} style={[styles.heroTitle, { color: colors.orange }]}>
            without money.
          </Text>
          <AppText variant="body" style={styles.heroLead}>
            Swap things you have for things you’ll love, no cash needed.
          </AppText>
          {!profileArea ? (
            <Pressable accessibilityRole="button" hitSlop={8} onPress={addLocation} style={styles.heroLink}>
              <AppText variant="small" color="orange" weight="bold">
                Add your profile location for nearby items
              </AppText>
            </Pressable>
          ) : null}
        </LinearGradient>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(60).duration(400)} style={[pad, styles.shortcuts]}>
        <Shortcut
          icon={Plus}
          title="Post a Trade"
          text="List an item in minutes"
          background={colors.orange}
          foreground={colors.onPrimary}
          tile="rgba(255, 255, 255, 0.19)"
          onPress={() => requireAuth(() => router.push('/post-item'))}
        />
        <View style={styles.shortcutRow}>
          <Shortcut
            icon={Trophy}
            title="Leaderboard"
            text="Meet top local traders"
            background={dark ? colors.yellowSoft : '#fff7e9'}
            foreground={dark ? colors.warning : '#a56300'}
            tile="rgba(165, 99, 0, 0.11)"
            onPress={() => router.push('/leaderboard')}
          />
          <Shortcut
            icon={CalendarDays}
            title="Trade Events"
            text="Swap face-to-face"
            background={colors.greenSoft}
            foreground={colors.green}
            tile="rgba(63, 168, 121, 0.11)"
            onPress={() => router.push('/events')}
          />
        </View>
      </Animated.View>

      {hotItems.length ? (
        <View>
          <View style={pad}>
            <SectionHeading eyebrow="Discover" title="Hot swaps near you" action="View map" onAction={() => router.push('/map')} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.hRow, pad]} decelerationRate="fast" snapToInterval={featuredSnap}>
            {hotItems.map((item) => (
              <FeaturedCard key={item.id} item={item} onPress={() => openItem(item)} />
            ))}
          </ScrollView>
        </View>
      ) : null}

      <ChipRow inset={gutter} options={itemService.getCategories()} value={filters.category} onChange={(category) => update({ category })} />

      <View style={[pad, styles.searchRow]}>
        <SearchField
          hero
          value={filters.search}
          onChangeText={(search) => update({ search })}
          placeholder="Search items or services…"
          maxLength={160}
          right={<FilterButton compact count={filterCount} onPress={() => setFiltersOpen(true)} />}
        />
      </View>

      <View style={pad}>
        <SectionHeading
          eyebrow="Discover"
          title={`${visibleItems.length} fresh finds`}
          action={browsing ? 'Clear all' : undefined}
          onAction={browsing ? clearAll : undefined}
        />
      </View>
    </View>
  );

  const empty = (
    <View style={pad}>
      {browsing ? (
        <EmptyState
          icon={Search}
          title="No matches yet"
          text="Try a broader search, another category, or clear your filters."
          action="Clear all"
          actionIcon={RotateCcw}
          onAction={clearAll}
        />
      ) : error ? (
        <EmptyState icon={RotateCcw} title="Could not load listings" text={error} action="Try again" actionIcon={RotateCcw} onAction={() => void onRefresh()} />
      ) : area ? (
        <EmptyState
          icon={MapPin}
          title={`Nothing within ${NEARBY_RADIUS_KM} km yet`}
          text={`No one near ${shortLocation(area.label)} has listed an item. Browse every location, or post the first one in your area.`}
          action="Show all locations"
          actionIcon={Globe}
          onAction={() => setArea(null)}
        />
      ) : (
        <EmptyState
          icon={Plus}
          title="Be the first to post an item"
          text="List something useful and let your next trade begin."
          action="Post an item"
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
          conditions={itemService.getConditions()}
          onChange={update}
          area={area}
          profileArea={profileArea}
          onAreaChange={setArea}
        />
      ) : null}
    </View>
  );
}

const rowKey = (row: GridRow) => row.key;
const RowGap = () => <View style={styles.rowGap} />;

type ShortcutProps = { icon: LucideIcon; title: string; text: string; background: string; foreground: string; tile: string; onPress: () => void };

function Shortcut({ icon: Icon, title, text, background, foreground, tile, onPress }: ShortcutProps) {
  const { colors } = useTheme();
  return (
    <PressableScale accessibilityRole="button" accessibilityLabel={title} onPress={onPress} scaleTo={0.97} style={[styles.shortcut, { backgroundColor: background }, neu(colors, 1)]}>
      <View style={[styles.shortcutIcon, { backgroundColor: tile }]}>
        <Icon size={22} color={foreground} />
      </View>
      <View style={styles.flex}>
        <Text maxFontSizeMultiplier={maxFontScale} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={[styles.shortcutTitle, { color: foreground }]}>
          {title}
        </Text>
        <Text maxFontSizeMultiplier={maxFontScale} numberOfLines={2} style={[styles.shortcutText, { color: foreground }]}>
          {text}
        </Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  list: { width: '100%', alignSelf: 'center', paddingBottom: 40 },
  headerStack: { gap: 16, paddingBottom: 2 },
  footer: { gap: 24, paddingTop: 22 },
  rowGap: { height: 12 },
  flex: { flex: 1, minWidth: 0 },
  actions: { flexDirection: 'row', gap: 8 },
  hero: { borderRadius: 19, paddingHorizontal: 16, paddingVertical: 24 },
  heroTitle: { fontFamily: fonts.bold, fontSize: 36, lineHeight: 40, letterSpacing: -1.26 },
  heroLead: { marginTop: 12, fontSize: 15, lineHeight: 24 },
  heroLink: { marginTop: 12 },
  shortcuts: { gap: 16 },
  shortcutRow: { flexDirection: 'row', gap: 16 },
  shortcut: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 16 },
  shortcutIcon: { width: 39, height: 39, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  shortcutTitle: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 21 },
  shortcutText: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, opacity: 0.78 },
  searchRow: { flexDirection: 'row' },
  hRow: { gap: 14, paddingBottom: 6 },
});
