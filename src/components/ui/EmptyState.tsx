import { Plus, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { AppText } from './AppText';
import { Button } from './Button';
import { IconTile } from './IconTile';

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  text: string;
  action?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
};

export function EmptyState({ icon, title, text, action, onAction, actionIcon = Plus }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={[styles.halo, { backgroundColor: colors.orangeSoft }]}>
        <View style={[styles.haloInner, { backgroundColor: colors.orangePale }]}>
          <IconTile icon={icon} size={64} rounded />
        </View>
      </View>
      <AppText variant="h1" align="center">
        {title}
      </AppText>
      <AppText variant="small" align="center" style={styles.text}>
        {text}
      </AppText>
      {action && onAction ? <Button label={action} icon={actionIcon} onPress={onAction} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 10, paddingVertical: 36, paddingHorizontal: 24 },
  halo: { width: 132, height: 132, borderRadius: 66, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  haloInner: { width: 98, height: 98, borderRadius: 49, alignItems: 'center', justifyContent: 'center' },
  text: { maxWidth: 300, marginBottom: 10 },
});
