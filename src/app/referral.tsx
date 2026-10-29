import * as Clipboard from 'expo-clipboard';
import { Copy, Gift, Share2 } from 'lucide-react-native';
import { Pressable, Share, StyleSheet, View } from 'react-native';

import { RequireAuth } from '@/components/layout';
import { AppText, Badge, Button, Card, Screen } from '@/components/ui';
import { links } from '@/constants/app';
import { useTheme, useToast } from '@/providers';

export default function ReferralScreen() {
  return (
    <RequireAuth>
      <ReferralContent />
    </RequireAuth>
  );
}

/** Basic invitation, like the website: shares the real signup link. Rewards are not implemented yet. */
function ReferralContent() {
  const { colors } = useTheme();
  const showToast = useToast();
  const link = links.signup();

  async function copy() {
    await Clipboard.setStringAsync(link);
    showToast('Invite link copied');
  }

  return (
    <Screen>
      <Card style={styles.card}>
        <View style={[styles.art, { backgroundColor: colors.orangeSoft }]}>
          <Gift size={64} color={colors.orange} strokeWidth={1.6} />
        </View>
        <Badge label="Invite a ka-barter" tone="orange" style={styles.center} />
        <AppText variant="h1" align="center">
          Good trades are better with friends
        </AppText>
        <AppText variant="small" align="center">
          Share Barterdito with friends and neighbors so there are more useful things to swap nearby.
        </AppText>
        <View style={[styles.link, { borderColor: colors.line, backgroundColor: colors.surface2 }]}>
          <AppText variant="small" color="ink" weight="bold" style={styles.flex} numberOfLines={1}>
            {link}
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
          onPress={() => void Share.share({ message: `Join me on Barterdito and trade more, waste less: ${link}` }).catch(() => undefined)}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  art: { alignSelf: 'center', width: 130, height: 130, borderRadius: 65, alignItems: 'center', justifyContent: 'center' },
  center: { alignSelf: 'center' },
  link: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  flex: { flex: 1 },
  copy: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
