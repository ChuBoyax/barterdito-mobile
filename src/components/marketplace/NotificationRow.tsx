import { ArrowRight, Award, BellRing, CheckCircle2, Heart, UserPlus, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import type { AppNotification, NotificationKind } from '@/types/models';

const icons: Record<NotificationKind, LucideIcon> = {
  offer: ArrowRight,
  heart: Heart,
  trade: CheckCircle2,
  follow: UserPlus,
  badge: Award,
  system: BellRing,
};

export function NotificationRow({ notification }: { notification: AppNotification }) {
  const { colors } = useTheme();
  const Icon = icons[notification.kind];
  return (
    <View
      style={[
        styles.row,
        { borderBottomColor: colors.line },
        notification.unread && { backgroundColor: colors.orangePale },
      ]}>
      <View style={[styles.icon, { backgroundColor: colors.orangeSoft }]}>
        <Icon size={18} color={colors.orange} />
      </View>
      <View style={styles.body}>
        <AppText variant="small" weight="bold" color="ink">
          {notification.text}
        </AppText>
        <AppText variant="caption">{notification.time} ago</AppText>
      </View>
      {notification.unread ? <View style={[styles.dot, { backgroundColor: colors.orange }]} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, paddingHorizontal: 14, paddingVertical: 13 },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
