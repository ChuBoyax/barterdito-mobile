import { Image } from 'expo-image';
import { router } from 'expo-router';
import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  Heart,
  Leaf,
  Map,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trophy,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppHeader, MenuButton } from '@/components/layout';
import { FeaturedCard, featuredCardWidth, FilterSheet, ItemGrid, TraderRow } from '@/components/marketplace';
import {
  AppText,
  Avatar,
  ChipRow,
  EmptyState,
  Glass,
  IconButton,
  IconTile,
  PhotoScrim,
  PressableScale,
  Screen,
  SectionHeading,
} from '@/components/ui';
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
  const { gutter, width, isTablet, innerWidth } = useResponsive();
  const pad = { paddingHorizontal: gutter };
  const hRow = [styles.hRow, pad];
  const spotlightHeight = Math.round(Math.min(Math.max(innerWidth * 0.95, 280), 440));
  const featuredSnap = featuredCardWidth(width, isTablet) + 12;
  const { user, requireAuth } = useAuth();
  const { items, loading, refresh } = useMarketplace();
  const [filters, setFilters] = useState(defaultFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const visibleItems = useMemo(() => itemService.filterItems(items, filters), [items, filters]);
  const locations = useMemo(() => [...new Set(items.map((item) => item.location))].sort(), [items]);
  const hotItems = items.filter((item) => item.hot);
  const spotlight = items[1] ?? items[0];
  const filtersActive =
    filters.condition !== defaultFilters.condition || filters.location !== defaultFilters.location || filters.sort !== defaultFilters.sort;

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
      <Animated.View entering={FadeInDown.duration(450)} style={[pad, styles.headline]}>
        <AppText variant="display">
          Good finds deserve a{' '}
          <AppText variant="display" color="orange">
            second story.
          </AppText>
        </AppText>
        <AppText variant="body" color="muted">
          Swap things you have for things you’ll love — no cash needed.
        </AppText>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(60).duration(450)} style={pad}>
        <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.line }, elevation(1, colors)]}>
          <Search size={20} color={colors.muted} strokeWidth={2} />
          <TextInput maxFontSizeMultiplier={maxFontScale}
            value={filters.search}
            onChangeText={(search) => update({ search })}
            placeholder="Search cameras, bikes, services…"
            placeholderTextColor={colors.muted2}
            selectionColor={colors.orange}
            style={[styles.searchInput, { color: colors.ink }]}
            accessibilityLabel="Search marketplace"
            returnKeyType="search"
          />
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Filters"
            onPress={() => setFiltersOpen(true)}
            scaleTo={0.9}
            style={[styles.filterButton, { backgroundColor: colors.orange }]}>
            <SlidersHorizontal size={18} color={colors.onPrimary} strokeWidth={2.2} />
            {filtersActive ? <View style={[styles.filterDot, { backgroundColor: colors.yellow, borderColor: colors.orange }]} /> : null}
          </PressableScale>
        </View>
        <View style={styles.trust}>
          <TrustPill icon={ShieldCheck} label="Verified traders" />
          <TrustPill icon={Heart} label="Meet locally" />
          <TrustPill icon={Leaf} label="Waste less" />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).duration(450)}>
        <ChipRow inset={gutter} options={itemService.getCategories()} value={filters.category} onChange={(category) => update({ category })} />
      </Animated.View>

      {spotlight ? (
        <Animated.View entering={FadeInDown.delay(180).duration(500)} style={pad}>
          <PressableScale onPress={() => router.push(`/items/${spotlight.id}`)} scaleTo={0.98} style={[styles.spotlight, { height: spotlightHeight }, elevation(2, colors)]}>
            <Image source={spotlight.image} style={StyleSheet.absoluteFill} contentFit="cover" />
            <PhotoScrim position="both" />
            <View style={styles.spotTop}>
              <Glass style={styles.pill} intensity={35}>
                <Heart size={13} color={colors.red} fill={colors.red} />
                <Text maxFontSizeMultiplier={maxFontScale} style={[styles.pillText, { color: colors.ink }]}>28 traders like this</Text>
              </Glass>
              <Glass style={styles.pill} intensity={35}>
                <Zap size={13} color={colors.orange} fill={colors.orange} />
                <Text maxFontSizeMultiplier={maxFontScale} style={[styles.pillText, { color: colors.ink }]}>12 new today</Text>
              </Glass>
            </View>
            <View style={[styles.spotInfo, { backgroundColor: colors.surface }]}>
              <View style={styles.flex}>
                <AppText variant="caption">Trending near you</AppText>
                <AppText variant="h2" numberOfLines={1}>
                  {spotlight.title}
                </AppText>
              </View>
              <View style={[styles.spotArrow, { backgroundColor: colors.orange }]}>
                <ArrowUpRight size={20} color={colors.onPrimary} strokeWidth={2.2} />
              </View>
            </View>
          </PressableScale>
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeInDown.delay(240).duration(500)} style={[pad, styles.shortcuts]}>
        <PrimaryShortcut onPress={() => requireAuth(() => router.push('/post-item'))} />
        <View style={styles.shortcutRow}>
          <Shortcut icon={Trophy} tone="yellow" title="Leaderboard" text="Top traders" onPress={() => router.push('/leaderboard')} />
          <Shortcut icon={CalendarDays} tone="green" title="Events" text="Swap face-to-face" onPress={() => router.push('/events')} />
        </View>
        <View style={styles.shortcutRow}>
          <Shortcut icon={Map} tone="blue" title="Nearby map" text="Trades around you" onPress={() => router.push('/map')} />
          <Shortcut icon={Sparkles} tone="violet" title="For you" text="Recommended swaps" onPress={() => requireAuth(() => router.push('/recommendations'))} />
        </View>
        <View style={[styles.impact, { backgroundColor: colors.greenSoft }]}>
          <IconTile icon={Leaf} tone="green" variant="solid" size={44} />
          <View style={styles.flex}>
            <AppText variant="h2">4,812 items</AppText>
            <AppText variant="caption">given a second life this month</AppText>
          </View>
        </View>
      </Animated.View>

      {hotItems.length ? (
        <View>
          <View style={pad}>
            <SectionHeading eyebrow="Discover" title="Hot swaps near you" action="Map" onAction={() => router.push('/map')} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={hRow} decelerationRate="fast" snapToInterval={featuredSnap}>
            {hotItems.map((item) => (
              <FeaturedCard key={item.id} item={item} onPress={() => router.push(`/items/${item.id}`)} />
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View>
        <View style={pad}>
          <SectionHeading eyebrow="Community" title="Featured traders" action="Ranks" onAction={() => router.push('/leaderboard')} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={hRow}>
          {traders.map((trader) => (
            <TraderRow key={trader.id} trader={trader} variant="card" onPress={() => router.push(`/traders/${trader.id}`)} />
          ))}
        </ScrollView>
      </View>

      <View style={pad}>
        <SectionHeading eyebrow="Fresh finds" title={`${visibleItems.length} items to swap`} />
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
      <Icon size={14} color={colors.green} strokeWidth={2.2} />
      <AppText variant="caption" weight="semibold">
        {label}
      </AppText>
    </View>
  );
}

function PrimaryShortcut({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <PressableScale onPress={onPress} scaleTo={0.98} style={[styles.primary, { backgroundColor: colors.orange }]}>
      <View style={[styles.primaryIcon, { borderColor: colors.onPrimary }]}>
        <Plus size={22} color={colors.onPrimary} strokeWidth={2.4} />
      </View>
      <View style={styles.flex}>
        <Text maxFontSizeMultiplier={maxFontScale} style={[styles.primaryTitle, { color: colors.onPrimary }]}>Post a trade</Text>
        <Text maxFontSizeMultiplier={maxFontScale} style={[styles.primaryText, { color: colors.onPrimary }]}>List an item in minutes</Text>
      </View>
      <ArrowUpRight size={20} color={colors.onPrimary} strokeWidth={2.2} />
    </PressableScale>
  );
}

function Shortcut({ icon, tone, title, text, onPress }: { icon: LucideIcon; tone: Tone; title: string; text: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.96}
      style={[styles.shortcut, { backgroundColor: colors.surface, borderColor: colors.line }, elevation(1, colors)]}>
      <IconTile icon={icon} tone={tone} size={40} />
      <View>
        <AppText variant="h3">{title}</AppText>
        <AppText variant="caption">{text}</AppText>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  content: { gap: 24, paddingTop: 0 },
  flex: { flex: 1 },
  actions: { flexDirection: 'row', gap: 8 },
  headline: { gap: 8, marginTop: 4 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 16, height: 56, paddingLeft: 16, paddingRight: 6 },
  searchInput: { flex: 1, fontFamily: fonts.medium, fontSize: 15, paddingVertical: 10 },
  filterButton: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  filterDot: { position: 'absolute', top: 8, right: 8, width: 9, height: 9, borderRadius: 5, borderWidth: 2 },
  trust: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 12 },
  trustPill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  spotlight: { borderRadius: 24, overflow: 'hidden', justifyContent: 'space-between' },
  spotTop: { flexDirection: 'row', justifyContent: 'space-between', padding: 12 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 7 },
  pillText: { fontFamily: fonts.bold, fontSize: 11.5 },
  spotInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, margin: 10, borderRadius: 18, padding: 14 },
  spotArrow: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  shortcuts: { gap: 12 },
  shortcutRow: { flexDirection: 'row', gap: 12 },
  primary: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 20, padding: 16 },
  primaryIcon: { width: 46, height: 46, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', opacity: 0.95 },
  primaryTitle: { fontFamily: fonts.extrabold, fontSize: 17 },
  primaryText: { fontFamily: fonts.medium, fontSize: 12.5, opacity: 0.88 },
  shortcut: { flex: 1, gap: 12, borderWidth: 1, borderRadius: 20, padding: 14 },
  impact: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, padding: 14 },
  hRow: { gap: 12, paddingBottom: 6 },
});
