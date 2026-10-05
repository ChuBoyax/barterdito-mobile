import { ArrowRightLeft, Award, BellRing, CheckCircle2, Heart, UserPlus, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppText, IconTile } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import type { Tone } from '@/theme';
import type { AppNotification, NotificationKind } from '@/types/models';

const kinds: Record<NotificationKind, { icon: LucideIcon; tone: Tone }> = {
  offer: { icon: ArrowRightLeft, tone: 'orange' },
  heart: { icon: Heart, tone: 'red' },
  trade: { icon: CheckCircle2, tone: 'green' },
  follow: { icon: UserPlus, tone: 'blue' },
  badge: { icon: Award, tone: 'yellow' },
  system: { icon: BellRing, tone: 'violet' },
};

export function NotificationRow({ notification }: { notification: AppNotification }) {
  const { colors } = useTheme();
  const kind = kinds[notification.kind];
  return (
    <View style={styles.row}>
      <IconTile icon={kind.icon} tone={kind.tone} size={44} rounded />
      <View style={styles.body}>
        <AppText variant="small" weight={notification.unread ? 'bold' : 'medium'} color="ink">
          {notification.text}
        </AppText>
        <AppText variant="caption">{notification.time} ago</AppText>
      </View>
      {notification.unread ? <View style={[styles.dot, { backgroundColor: colors.orange }]} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 11 },
  body: { flex: 1, gap: 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
