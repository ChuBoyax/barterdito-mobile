import * as Clipboard from 'expo-clipboard';
import { Copy, Gift, Share2 } from 'lucide-react-native';
import { Pressable, Share, StyleSheet, View } from 'react-native';

import { RequireAuth } from '@/components/layout';
import { StatGrid } from '@/components/marketplace';
import { AppText, Badge, Button, Card, LoadingView, Screen } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useTheme, useToast } from '@/providers';
import { communityService } from '@/services';

export default function ReferralScreen() {
  return (
    <RequireAuth>
      <ReferralContent />
    </RequireAuth>
  );
}

function ReferralContent() {
  const { colors } = useTheme();
  const showToast = useToast();
  const { data: referral, loading } = useAsync(['communityService.getReferral'], () => communityService.getReferral());
  if (loading || !referral) return <LoadingView variant="stats" />;

  async function copy() {
    await Clipboard.setStringAsync(`https://${referral!.link}`);
    showToast('Referral link copied');
  }

  return (
    <Screen>
      <Card style={styles.card}>
        <View style={[styles.art, { backgroundColor: colors.orangeSoft }]}>
          <Gift size={64} color={colors.orange} strokeWidth={1.6} />
          <View style={[styles.points, { backgroundColor: colors.orange }]}>
            <AppText variant="h3" style={{ color: colors.onPrimary }}>
              +50
            </AppText>
          </View>
        </View>
        <Badge label="Invite a ka-barter" tone="orange" style={styles.center} />
        <AppText variant="h1" align="center">
          Good trades are better with friends
        </AppText>
        <AppText variant="small" align="center">
          Invite friends and earn 50 points after their first completed trade.
        </AppText>
        <View style={[styles.link, { borderColor: colors.line, backgroundColor: colors.surface2 }]}>
          <AppText variant="small" color="ink" weight="bold" style={styles.flex} numberOfLines={1}>
            {referral.link}
          </AppText>
          <Pressable onPress={() => void copy()} style={styles.copy} hitSlop={6}>
            <Copy size={16} color={colors.orange} />
            <AppText variant="small" color="orange" weight="bold">
              Copy
            </AppText>
          </Pressable>
        </View>
        <Button
          label="Share invite"
          icon={Share2}
          onPress={() => void Share.share({ message: `Join me on Barterdito and trade more, waste less: https://${referral.link}` })}
        />
        <StatGrid
          variant="inline"
          stats={[
            { label: 'Friends joined', value: referral.friendsJoined },
            { label: 'Points earned', value: referral.pointsEarned },
            { label: 'Pending', value: referral.pending },
          ]}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  art: { alignSelf: 'center', width: 130, height: 130, borderRadius: 65, alignItems: 'center', justifyContent: 'center' },
  points: { position: 'absolute', right: -4, top: 6, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  center: { alignSelf: 'center' },
  link: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  flex: { flex: 1 },
  copy: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
