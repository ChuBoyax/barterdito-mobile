import { Share2, ShieldCheck } from 'lucide-react-native';
import { Share, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { RequireAuth } from '@/components/layout';
import { AppText, Avatar, Button, Card, Logo, Screen } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useAuth, useTheme } from '@/providers';
import { userService } from '@/services';

export default function QRScreen() {
  return (
    <RequireAuth>
      <QRContent />
    </RequireAuth>
  );
}

function QRContent() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { data: stats } = useAsync(() => userService.getProfileStats(), []);
  if (!user) return null;
  const url = `https://barterdito.ph/traders/${user.id}`;

  return (
    <Screen>
      <Card style={styles.card}>
        <Logo />
        <AppText variant="h1" align="center">
          Trade with {user.fullName}
        </AppText>
        <AppText variant="small" align="center">
          Scan to open this Barterdito trader profile.
        </AppText>
        <View style={[styles.qr, { backgroundColor: colors.white }]}>
          <QRCode value={url} size={220} color={colors.blue} backgroundColor={colors.white} ecl="H" />
        </View>
        <View style={[styles.pill, { backgroundColor: colors.surface2 }]}>
          <Avatar initials={user.initials} size="small" />
          <View style={styles.flex}>
            <AppText variant="h3">{user.fullName}</AppText>
            <AppText variant="caption">
              {stats?.rating ?? '—'} ★ · {stats?.totalTrades ?? 0} trades
            </AppText>
          </View>
          <ShieldCheck size={20} color={colors.green} />
        </View>
        <Button label="Share QR Profile" icon={Share2} onPress={() => void Share.share({ message: `Trade with me on Barterdito: ${url}` })} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', gap: 12 },
  qr: { borderRadius: 20, padding: 16 },
  pill: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, padding: 10 },
  flex: { flex: 1 },
});
