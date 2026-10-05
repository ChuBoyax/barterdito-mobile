import { Crown, Trophy } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { HeroBanner } from '@/components/marketplace';
import { AppText, Avatar, Card, LoadingView, Screen } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useTheme } from '@/providers';
import { userService } from '@/services';
import type { LeaderboardEntry } from '@/types/models';
import { formatNumber } from '@/utils/format';

const podiumHeights: Record<number, number> = { 1: 110, 2: 80, 3: 62 };
const medalColors: Record<number, string> = { 1: '#ffcd57', 2: '#c0c6cf', 3: '#d99a6c' };

export default function LeaderboardScreen() {
  const { data: ranks = [], loading } = useAsync(() => userService.getLeaderboard(), []);
  if (loading) return <LoadingView />;
  const podium = [ranks[1], ranks[0], ranks[2]].filter(Boolean);

  return (
    <Screen>
      <HeroBanner
        badge="Weekly rankings"
        icon={Trophy}
        title="Meet this week’s trade champions"
        text="Earn points for successful swaps, great reviews, and helping the community."
      />
      <View style={styles.podium}>
        {podium.map((person) => (
          <PodiumCard key={person.rank} person={person} />
        ))}
      </View>
      <Card padded={false}>
        {ranks.slice(3).map((person) => (
          <RankRow key={person.name} person={person} />
        ))}
      </Card>
    </Screen>
  );
}

function PodiumCard({ person }: { person: LeaderboardEntry }) {
  const { colors } = useTheme();
  return (
    <View style={styles.podiumCard}>
      {person.rank === 1 ? <Crown size={22} color={colors.yellow} /> : <View style={styles.crownSpace} />}
      <Avatar initials={person.initials} size="large" />
      <AppText variant="small" color="ink" weight="bold" align="center" numberOfLines={1}>
        {person.name}
      </AppText>
      <AppText variant="caption">{formatNumber(person.points)} pts</AppText>
      <View style={[styles.block, { height: podiumHeights[person.rank], backgroundColor: person.rank === 1 ? colors.orange : colors.orangeSoft }]}>
        <View style={[styles.medal, { backgroundColor: medalColors[person.rank] }]}>
          <AppText variant="h3" style={styles.medalText}>
            {person.rank}
          </AppText>
        </View>
      </View>
    </View>
  );
}

function RankRow({ person }: { person: LeaderboardEntry }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.rankRow, { borderBottomColor: colors.line }, person.isYou && { backgroundColor: colors.orangePale }]}>
      <AppText variant="h3" color="muted" style={styles.rankNumber}>
        #{person.rank}
      </AppText>
      <Avatar initials={person.initials} size="small" />
      <View style={styles.flex}>
        <AppText variant="h3">
          {person.name}
          {person.isYou ? ' (you)' : ''}
        </AppText>
        <AppText variant="caption">{person.trades} successful trades</AppText>
      </View>
      <AppText variant="small" color="orange" weight="extrabold">
        {formatNumber(person.points)} pts
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  podium: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  podiumCard: { flex: 1, alignItems: 'center', gap: 4 },
  crownSpace: { height: 22 },
  block: { alignSelf: 'stretch', borderTopLeftRadius: 14, borderTopRightRadius: 14, alignItems: 'center', paddingTop: 10, marginTop: 6 },
  medal: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  medalText: { color: '#2c2c2c' },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, padding: 14 },
  rankNumber: { width: 34 },
  flex: { flex: 1 },
});
