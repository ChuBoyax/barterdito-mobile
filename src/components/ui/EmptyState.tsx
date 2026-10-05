import { Plus, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { AppText } from './AppText';
import { Button } from './Button';

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  text: string;
  action?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
};

export function EmptyState({ icon: Icon, title, text, action, onAction, actionIcon = Plus }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={[styles.icon, { backgroundColor: colors.orangeSoft }]}>
        <Icon size={32} color={colors.orange} />
      </View>
      <AppText variant="h2" align="center">
        {title}
      </AppText>
      <AppText variant="small" align="center" style={styles.text}>
        {text}
      </AppText>
      {action && onAction ? <Button label={action} icon={actionIcon} compact onPress={onAction} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 10, paddingVertical: 36, paddingHorizontal: 20 },
  icon: { width: 74, height: 74, borderRadius: 37, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  text: { maxWidth: 300, marginBottom: 6 },
});
