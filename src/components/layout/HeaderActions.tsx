import { router } from 'expo-router';
import { Bell, LayoutGrid, Moon, Sun } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { IconButton } from '@/components/ui';
import { useNotificationCounts } from '@/hooks/useNotificationCounts';
import { useTheme } from '@/providers/ThemeProvider';

export function HeaderActions() {
  const { dark, toggleDark } = useTheme();
  return (
    <View style={styles.row}>
      <IconButton icon={dark ? Sun : Moon} label="Toggle dark mode" size={19} onPress={toggleDark} />
      <NotificationBell />
    </View>
  );
}

/** Bell with the real unread notification count. */
export function NotificationBell() {
  const counts = useNotificationCounts();
  const unread = counts?.unreadCount ?? 0;
  return (
    <IconButton
      icon={Bell}
      label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
      size={19}
      badge={unread || undefined}
      onPress={() => router.push('/notifications')}
    />
  );
}

export function MenuButton() {
  return <IconButton icon={LayoutGrid} label="Open menu" size={19} onPress={() => router.push('/menu')} />;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
});

