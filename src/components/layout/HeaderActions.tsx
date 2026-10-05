import { router } from 'expo-router';
import { Bell, Menu, Moon, Sun } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { IconButton } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';

export function HeaderActions({ unread = 2 }: { unread?: number }) {
  const { dark, toggleDark } = useTheme();
  return (
    <View style={styles.row}>
      <IconButton icon={dark ? Sun : Moon} label="Toggle dark mode" size={19} onPress={toggleDark} />
      <IconButton icon={Bell} label="Notifications" size={19} badge={unread} onPress={() => router.push('/notifications')} />
    </View>
  );
}

export function MenuButton() {
  return <IconButton icon={Menu} label="Open menu" size={21} tone="plain" onPress={() => router.push('/menu')} />;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, marginRight: 12 },
});
