import * as Clipboard from 'expo-clipboard';
import { Copy, Share2, ShieldCheck } from 'lucide-react-native';
import { Share, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { RequireAuth } from '@/components/layout';
import { AppText, Avatar, Button, Card, Logo, Screen } from '@/components/ui';
import { links } from '@/constants/app';
import { useAsync } from '@/hooks/useAsync';
import { useAuth, useTheme, useToast } from '@/providers';
import { userService } from '@/services';
import { pluralize } from '@/utils/format';
import { queryKeys } from '@/services/queryKeys';

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
  const showToast = useToast();
  const { data: profile } = useAsync(queryKeys.myProfile, () => userService.getMyProfile());
  if (!user) return null;
  const url = links.trader(user.id);

  async function copy() {
    await Clipboard.setStringAsync(url);
    showToast('Profile link copied');
  }

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
          <Avatar initials={user.initials} imageUrl={user.avatarUrl} size="small" />
          <View style={styles.flex}>
            <AppText variant="h3">{user.fullName}</AppText>
            <AppText variant="caption">
              {profile ? `${pluralize(profile.activeListingCount, 'listing')} · ${pluralize(profile.followersCount, 'follower')}` : ' '}
            </AppText>
          </View>
          {user.emailVerified ? <ShieldCheck size={20} color={colors.green} /> : null}
        </View>
        <AppText variant="caption" align="center" selectable numberOfLines={1}>
          {url}
        </AppText>
        <View style={styles.buttons}>
          <Button label="Copy link" icon={Copy} variant="secondary" style={styles.flex} onPress={() => void copy()} />
          <Button
            label="Share"
            icon={Share2}
            style={styles.flex}
            onPress={() => void Share.share({ message: `Trade with me on Barterdito: ${url}` }).catch(() => undefined)}
          />
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', gap: 12 },
  qr: { borderRadius: 20, padding: 16 },
  pill: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, padding: 10 },
  buttons: { alignSelf: 'stretch', flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
});
