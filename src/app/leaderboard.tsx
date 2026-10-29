import { ArrowRightLeft, Crown, HeartHandshake, Star, TrendingUp } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { AppText, Avatar, LoadingView, Screen } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useTheme } from '@/providers';
import { userService } from '@/services';
import { avatarPalette, fonts, maxFontScale, neu } from '@/theme';
import type { LeaderboardEntry } from '@/types/models';
import { formatNumber } from '@/utils/format';

const podiumHeights: Record<number, number> = { 1: 92, 2: 66, 3: 50 };

const earnWays = [
  { icon: ArrowRightLeft, label: 'Successful swaps' },
  { icon: Star, label: 'Great reviews' },
  { icon: HeartHandshake, label: 'Helping others' },
];

export default function LeaderboardScreen() {
  const { colors } = useTheme();
  const { data: ranks = [], loading } = useAsync(['userService.getLeaderboard'], () => userService.getLeaderboard());
  if (loading) return <LoadingView variant="list" />;

  const podium = [ranks[1], ranks[0], ranks[2]].filter(Boolean);
  const others = ranks.slice(3);
  const you = ranks.find((person) => person.isYou);
  const topPoints = ranks[0]?.points ?? 1;

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.intro}>
        <AppText variant="eyebrow" color="orange">
          Weekly rankings
        </AppText>
        <AppText variant="hero">Top traders</AppText>
        <AppText variant="small">This week’s most trusted swappers on Barterdito.</AppText>
      </View>

      <View style={[styles.stage, { backgroundColor: colors.orange }, neu(colors, 2)]}>
        <View style={[styles.orb, styles.orbLeft]} />
        <View style={[styles.orb, styles.orbRight]} />
        <View style={styles.podium}>
          {podium.map((person) => (
            <PodiumSpot key={person.rank} person={person} />
          ))}
        </View>
      </View>

      {you ? (
        <View style={[styles.youCard, { backgroundColor: colors.surface, borderColor: colors.orange }, neu(colors, 2)]}>
          <View style={[styles.youRank, { backgroundColor: colors.orangeSoft }]}>
            <Text maxFontSizeMultiplier={maxFontScale} style={[styles.youRankText, { color: colors.orange }]}>#{you.rank}</Text>
          </View>
          <View style={styles.flex}>
            <AppText variant="caption" color="orange" weight="bold">
              Your rank
            </AppText>
            <AppText variant="h3" numberOfLines={1}>
              {you.name}
            </AppText>
            <AppText variant="caption">{you.trades} successful trades</AppText>
          </View>
          <View style={styles.youPoints}>
            <AppText variant="h2" color="orange">
              {formatNumber(you.points)}
            </AppText>
            <AppText variant="caption">points</AppText>
          </View>
        </View>
      ) : null}

      {others.length ? (
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <AppText variant="h2">Rankings</AppText>
            <View style={styles.trend}>
              <TrendingUp size={14} color={colors.green} />
              <AppText variant="caption" color="green" weight="bold">
                Updated weekly
              </AppText>
            </View>
          </View>
          <View style={[styles.list, { backgroundColor: colors.surface }, neu(colors, 2)]}>
            {others.map((person, index) => (
              <RankRow key={`${person.rank}-${person.name}`} person={person} first={index === 0} topPoints={topPoints} />
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <AppText variant="h2">How to earn points</AppText>
        <View style={styles.earnRow}>
          {earnWays.map(({ icon: Icon, label }) => (
            <View key={label} style={[styles.earn, { backgroundColor: colors.surface }, neu(colors, 1)]}>
              <Icon size={22} color={colors.orange} strokeWidth={1.9} />
              <AppText variant="caption" color="ink" weight="semibold" align="center">
                {label}
              </AppText>
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}

function PodiumSpot({ person }: { person: LeaderboardEntry }) {
  const { colors } = useTheme();
  const first = person.rank === 1;
  const medal = [colors.medalGold, colors.medalSilver, colors.medalBronze][person.rank - 1];
  return (
    <View style={styles.spot}>
      {first ? <Crown size={24} color={colors.medalGold} fill={colors.medalGold} /> : <View style={styles.crownSpace} />}
      <View style={[styles.avatarRing, first && styles.avatarRingFirst, { borderColor: medal }]}>
        <Avatar initials={person.initials} size={first ? 'large' : 'medium'} color={avatarPalette[person.rank % avatarPalette.length]} />
        <View style={[styles.medal, { backgroundColor: medal, borderColor: colors.orange }]}>
          <Text maxFontSizeMultiplier={maxFontScale} style={[styles.medalText, { color: colors.black }]}>{person.rank}</Text>
        </View>
      </View>
      <Text maxFontSizeMultiplier={maxFontScale} numberOfLines={1} style={[styles.spotName, { color: colors.onPhoto }]}>
        {person.name.split(' ')[0]}
      </Text>
      <View style={styles.pointsPill}>
        <Text maxFontSizeMultiplier={maxFontScale} style={[styles.pointsText, { color: colors.onPhoto }]}>{formatNumber(person.points)} pts</Text>
      </View>
      <View style={[styles.block, { height: podiumHeights[person.rank], backgroundColor: first ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.16)' }]}>
        <Text maxFontSizeMultiplier={maxFontScale} style={[styles.blockRank, { color: colors.onPhoto }]}>{person.rank}</Text>
      </View>
    </View>
  );
}

function RankRow({ person, first, topPoints }: { person: LeaderboardEntry; first: boolean; topPoints: number }) {
  const { colors } = useTheme();
  const share = `${Math.max(6, Math.min(100, (person.points / topPoints) * 100))}%` as const;
  return (
    <View
      style={[
        styles.rankRow,
        !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
        person.isYou && { backgroundColor: colors.orangePale },
      ]}>
      <View style={[styles.rankBadge, { backgroundColor: person.isYou ? colors.orange : colors.surface2 }]}>
        <Text maxFontSizeMultiplier={maxFontScale} style={[styles.rankBadgeText, { color: person.isYou ? colors.onPrimary : colors.muted }]}>{person.rank}</Text>
      </View>
      <Avatar initials={person.initials} size="small" color={avatarPalette[person.rank % avatarPalette.length]} />
      <View style={[styles.flex, styles.rankBody]}>
        <View style={styles.nameLine}>
          <AppText variant="h3" numberOfLines={1} style={styles.flexShrink}>
            {person.name}
          </AppText>
          {person.isYou ? (
            <View style={[styles.youTag, { backgroundColor: colors.orange }]}>
              <Text maxFontSizeMultiplier={maxFontScale} style={[styles.youTagText, { color: colors.onPrimary }]}>YOU</Text>
            </View>
          ) : null}
        </View>
        <View style={[styles.track, { backgroundColor: colors.surface2 }]}>
          <View style={[styles.fill, { width: share, backgroundColor: person.isYou ? colors.orange : colors.muted2 }]} />
        </View>
        <AppText variant="caption">{person.trades} trades</AppText>
      </View>
      <View style={styles.rankPoints}>
        <AppText variant="h3" color={person.isYou ? 'orange' : 'ink'}>
          {formatNumber(person.points)}
        </AppText>
        <AppText variant="caption">pts</AppText>
      </View>
    </View>
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
  podium: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  spot: { flex: 1, alignItems: 'center', gap: 6 },
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
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  trend: { flexDirection: 'row', alignItems: 'center', gap: 4 },
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
  earn: { flex: 1, alignItems: 'center', gap: 8, borderRadius: 18, paddingVertical: 16, paddingHorizontal: 6 },
});
