import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ArrowRightLeft, Crown, RotateCcw, Star, Trophy } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppText, Avatar, Button, EmptyState, LoadingView, PressableScale, Screen } from '@/components/ui';
import { queryClient, useAuth, useTheme } from '@/providers';
import { userService } from '@/services';
import { queryKeys } from '@/services/queryKeys';
import { avatarPalette, fonts, maxFontScale, neu } from '@/theme';
import type { LeaderboardEntry, LeaderboardPage } from '@/types/models';
import { errorMessage, formatNumber } from '@/utils/format';

const podiumHeights: Record<number, number> = { 1: 92, 2: 66, 3: 50 };
const MANILA_OFFSET_MS = 8 * 60 * 60_000;

/** "Oct 27" in Asia/Manila, where the weekly reset happens (Monday 00:00). */
function manilaDate(value: string | number) {
  const date = new Date(new Date(value).getTime() + MANILA_OFFSET_MS);
  return `${date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })} ${date.getUTCDate()}`;
}

function stats(person: LeaderboardEntry) {
  const trades = `${person.trades} ${person.trades === 1 ? 'trade' : 'trades'}`;
  return person.rating == null ? `${trades} · No reviews` : `${trades} · ★ ${person.rating} (${person.reviewCount})`;
}

type PageParam = { offset: number; asOf?: string };

export default function LeaderboardScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const ranking = useInfiniteQuery({
    queryKey: queryKeys.leaderboard,
    queryFn: ({ pageParam }: { pageParam: PageParam }) => userService.getLeaderboard(pageParam.offset, pageParam.asOf),
    initialPageParam: { offset: 0 } as PageParam,
    // Later pages use the first page's snapshot, so new trades never shift ranks mid-scroll.
    getNextPageParam: (last: LeaderboardPage, pages: LeaderboardPage[]) => {
      const loaded = pages.reduce((sum, page) => sum + page.entries.length, 0);
      return last.entries.length && loaded < last.total ? { offset: loaded, asOf: pages[0]!.asOf } : undefined;
    },
    staleTime: 60_000,
  });
  const first = ranking.data?.pages[0];
  const mine = useQuery({
    queryKey: [...queryKeys.leaderboard, 'me', user?.id, first?.asOf],
    queryFn: () => userService.getMyRank(first!.asOf),
    enabled: Boolean(user && first),
  });

  async function refresh() {
    setRefreshing(true);
    // Start again from a fresh snapshot rather than refetching pages pinned to the old one.
    await queryClient.resetQueries({ queryKey: queryKeys.leaderboard });
    setRefreshing(false);
  }

  if (ranking.isPending) return <LoadingView variant="list" />;
  if (!first) {
    return (
      <Screen>
        <EmptyState
          icon={Trophy}
          title="Could not load the leaderboard"
          text={errorMessage(ranking.error, 'Please try again.')}
          action="Try again"
          actionIcon={RotateCcw}
          onAction={() => void refresh()}
        />
      </Screen>
    );
  }

  const entries = ranking.data!.pages.flatMap((page) => page.entries);
  const byRank = (rank: number) => first.podium.find((person) => person.rank === rank);
  const podium = [byRank(2), byRank(1), byRank(3)].filter((person): person is LeaderboardEntry => Boolean(person));
  const others = entries.filter((person) => (person.rank ?? 0) > 3);
  const own = mine.data;
  const ownOutside = own && own.rank !== null && own.rank > 3 && !entries.some((person) => person.id === own.id);
  const topPoints = first.podium[0]?.points || 1;
  const weekEnd = new Date(first.weekEnd).getTime() - 1;

  return (
    <Screen contentStyle={styles.screen} refreshing={refreshing} onRefresh={() => void refresh()}>
      <View style={styles.intro}>
        <AppText variant="eyebrow" color="orange">
          Weekly rankings
        </AppText>
        <AppText variant="hero">Top traders</AppText>
        <AppText variant="small">
          {manilaDate(first.weekStart)} – {manilaDate(weekEnd)} · Resets Monday at 00:00 (Asia/Manila)
        </AppText>
      </View>

      {first.total === 0 ? (
        <EmptyState
          icon={Trophy}
          title="This week’s leaderboard is open"
          text="Complete a trade together or receive a verified review to earn the first points this week."
        />
      ) : (
        <View style={[styles.stage, { backgroundColor: colors.orange }, neu(colors, 2)]}>
          <View style={[styles.orb, styles.orbLeft]} />
          <View style={[styles.orb, styles.orbRight]} />
          <View style={styles.podium}>
            {podium.map((person) => (
              <PodiumSpot key={person.id} person={person} you={person.id === user?.id} />
            ))}
          </View>
        </View>
      )}

      {own ? (
        <View style={[styles.youCard, { backgroundColor: colors.surface, borderColor: colors.orange }, neu(colors, 2)]}>
          <View style={[styles.youRank, { backgroundColor: colors.orangeSoft }]}>
            <Text maxFontSizeMultiplier={maxFontScale} style={[styles.youRankText, { color: colors.orange }]}>{own.rank ? `#${own.rank}` : '—'}</Text>
          </View>
          <View style={styles.flex}>
            <AppText variant="caption" color="orange" weight="bold">
              Your rank
            </AppText>
            <AppText variant="h3" numberOfLines={1}>
              {own.name}
            </AppText>
            <AppText variant="caption">
              {own.rank ? stats(own) : 'Not ranked yet. Points appear after both traders confirm a trade or you get a verified review.'}
            </AppText>
          </View>
          <View style={styles.youPoints}>
            <AppText variant="h2" color="orange">
              {formatNumber(own.points)}
            </AppText>
            <AppText variant="caption">points</AppText>
          </View>
        </View>
      ) : mine.isError ? (
        <Pressable accessibilityRole="button" onPress={() => void mine.refetch()}>
          <AppText variant="caption" color="red">
            Your rank could not be loaded. Tap to try again.
          </AppText>
        </Pressable>
      ) : !user ? (
        <Pressable accessibilityRole="button" onPress={() => router.push('/login')}>
          <AppText variant="small">
            <AppText variant="small" color="orange" weight="bold">
              Sign in
            </AppText>{' '}
            to see your own weekly rank.
          </AppText>
        </Pressable>
      ) : null}

      {others.length || ownOutside ? (
        <View style={styles.section}>
          <AppText variant="h2">Rankings</AppText>
          <View style={[styles.list, { backgroundColor: colors.surface }, neu(colors, 2)]}>
            {others.map((person, index) => (
              <RankRow key={person.id} person={person} first={index === 0} topPoints={topPoints} you={person.id === user?.id} />
            ))}
            {ownOutside ? <RankRow person={own} first={!others.length} topPoints={topPoints} you /> : null}
          </View>
          {ranking.hasNextPage ? (
            <Button label="Load more traders" variant="secondary" loading={ranking.isFetchingNextPage} onPress={() => void ranking.fetchNextPage()} />
          ) : null}
        </View>
      ) : null}

      <View style={styles.section}>
        <AppText variant="h2">How to earn points</AppText>
        <View style={styles.earnRow}>
          <EarnCard icon={ArrowRightLeft} points={first.pointsPerTrade} label="per completed trade" />
          <EarnCard icon={Star} points={first.pointsPerReviewStar} label="per review star you receive" />
        </View>
        <AppText variant="caption">Only trades confirmed by both traders and verified reviews count.</AppText>
      </View>
    </Screen>
  );
}

function EarnCard({ icon: Icon, points, label }: { icon: typeof Star; points: number; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.earn, { backgroundColor: colors.surface }, neu(colors, 1)]}>
      <Icon size={22} color={colors.orange} strokeWidth={1.9} />
      <AppText variant="h2" color="orange">
        +{points}
      </AppText>
      <AppText variant="caption" color="ink" weight="semibold" align="center">
        {label}
      </AppText>
    </View>
  );
}

function PodiumSpot({ person, you }: { person: LeaderboardEntry; you: boolean }) {
  const { colors } = useTheme();
  const rank = person.rank ?? 3;
  const isFirst = rank === 1;
  const medal = [colors.medalGold, colors.medalSilver, colors.medalBronze][rank - 1];
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`View ${person.name}, rank ${rank}, ${person.points} points`}
      onPress={() => router.push(`/traders/${person.id}`)}
      scaleTo={0.96}
      style={styles.spot}>
      {isFirst ? <Crown size={24} color={colors.medalGold} fill={colors.medalGold} /> : <View style={styles.crownSpace} />}
      <View style={[styles.avatarRing, isFirst && styles.avatarRingFirst, { borderColor: medal }]}>
        <Avatar initials={person.initials} imageUrl={person.avatarUrl} size={isFirst ? 'large' : 'medium'} color={avatarPalette[rank % avatarPalette.length]} />
        <View style={[styles.medal, { backgroundColor: medal, borderColor: colors.orange }]}>
          <Text maxFontSizeMultiplier={maxFontScale} style={[styles.medalText, { color: colors.black }]}>{rank}</Text>
        </View>
      </View>
      <Text maxFontSizeMultiplier={maxFontScale} numberOfLines={1} style={[styles.spotName, { color: colors.onPhoto }]}>
        {you ? 'You' : person.name.split(' ')[0]}
      </Text>
      <View style={styles.pointsPill}>
        <Text maxFontSizeMultiplier={maxFontScale} style={[styles.pointsText, { color: colors.onPhoto }]}>{formatNumber(person.points)} pts</Text>
      </View>
      <View style={[styles.block, { height: podiumHeights[rank], backgroundColor: isFirst ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.16)' }]}>
        <Text maxFontSizeMultiplier={maxFontScale} style={[styles.blockRank, { color: colors.onPhoto }]}>{rank}</Text>
      </View>
    </PressableScale>
  );
}

function RankRow({ person, first, topPoints, you }: { person: LeaderboardEntry; first: boolean; topPoints: number; you: boolean }) {
  const { colors } = useTheme();
  const share = `${Math.max(6, Math.min(100, (person.points / topPoints) * 100))}%` as const;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View ${person.name}, rank ${person.rank ?? 'unranked'}, ${person.points} points`}
      onPress={() => router.push(`/traders/${person.id}`)}
      style={({ pressed }) => [
        styles.rankRow,
        !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
        (you || pressed) && { backgroundColor: colors.orangePale },
      ]}>
      <View style={[styles.rankBadge, { backgroundColor: you ? colors.orange : colors.surface2 }]}>
        <Text maxFontSizeMultiplier={maxFontScale} style={[styles.rankBadgeText, { color: you ? colors.onPrimary : colors.muted }]}>{person.rank ?? '—'}</Text>
      </View>
      <Avatar initials={person.initials} imageUrl={person.avatarUrl} size="small" color={avatarPalette[(person.rank ?? 0) % avatarPalette.length]} />
      <View style={[styles.flex, styles.rankBody]}>
        <View style={styles.nameLine}>
          <AppText variant="h3" numberOfLines={1} style={styles.flexShrink}>
            {person.name}
          </AppText>
          {you ? (
            <View style={[styles.youTag, { backgroundColor: colors.orange }]}>
              <Text maxFontSizeMultiplier={maxFontScale} style={[styles.youTagText, { color: colors.onPrimary }]}>YOU</Text>
            </View>
          ) : null}
        </View>
        <View style={[styles.track, { backgroundColor: colors.surface2 }]}>
          <View style={[styles.fill, { width: share, backgroundColor: you ? colors.orange : colors.muted2 }]} />
        </View>
        <AppText variant="caption" numberOfLines={1}>
          {stats(person)}
        </AppText>
      </View>
      <View style={styles.rankPoints}>
        <AppText variant="h3" color={you ? 'orange' : 'ink'}>
          {formatNumber(person.points)}
        </AppText>
        <AppText variant="caption">pts</AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { gap: 20, paddingBottom: 32 },
  flex: { flex: 1 },
  flexShrink: { flexShrink: 1 },
  intro: { gap: 6 },

  stage: { borderRadius: 28, paddingTop: 20, paddingHorizontal: 14, overflow: 'hidden' },
  orb: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)' },
  orbLeft: { width: 180, height: 180, left: -70, top: -60 },
  orbRight: { width: 140, height: 140, right: -40, top: 30 },
  podium: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 8 },
  spot: { flex: 1, maxWidth: 140, alignItems: 'center', gap: 6 },
  crownSpace: { height: 24 },
  avatarRing: { borderWidth: 3, borderRadius: 999, padding: 2 },
  avatarRingFirst: { borderWidth: 4 },
  medal: { position: 'absolute', bottom: -6, alignSelf: 'center', width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  medalText: { fontFamily: fonts.extrabold, fontSize: 11 },
  spotName: { fontFamily: fonts.bold, fontSize: 13.5, marginTop: 6, maxWidth: '100%' },
  pointsPill: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3, backgroundColor: 'rgba(0,0,0,0.16)' },
  pointsText: { fontFamily: fonts.bold, fontSize: 11 },
  block: { alignSelf: 'stretch', marginTop: 4, borderTopLeftRadius: 16, borderTopRightRadius: 16, alignItems: 'center', paddingTop: 8 },
  blockRank: { fontFamily: fonts.extrabold, fontSize: 26, opacity: 0.9 },

  youCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 22, borderWidth: 1.5, padding: 14 },
  youRank: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  youRankText: { fontFamily: fonts.extrabold, fontSize: 19 },
  youPoints: { alignItems: 'flex-end' },

  section: { gap: 12 },
  list: { borderRadius: 24, overflow: 'hidden' },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13 },
  rankBadge: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rankBadgeText: { fontFamily: fonts.extrabold, fontSize: 13 },
  rankBody: { gap: 5 },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  youTag: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  youTagText: { fontFamily: fonts.extrabold, fontSize: 9.5, letterSpacing: 0.8 },
  track: { height: 5, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  rankPoints: { alignItems: 'flex-end', minWidth: 52 },

  earnRow: { flexDirection: 'row', gap: 10 },
  earn: { flex: 1, alignItems: 'center', gap: 4, borderRadius: 18, paddingVertical: 16, paddingHorizontal: 8 },
});
