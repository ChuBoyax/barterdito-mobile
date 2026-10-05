import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { AppText } from './AppText';

type SectionHeadingProps = {
  title: string;
  eyebrow?: string;
  action?: string;
  onAction?: () => void;
};

export function SectionHeading({ title, eyebrow = 'Discover', action, onAction }: SectionHeadingProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.flex}>
        {eyebrow ? <AppText variant="eyebrow">{eyebrow}</AppText> : null}
        <AppText variant="h2">{title}</AppText>
      </View>
      {action && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} style={styles.action} hitSlop={8}>
          <AppText variant="small" weight="bold" color="orange">
            {action}
          </AppText>
          <ChevronRight size={16} color={colors.orange} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginBottom: 12 },
  flex: { flex: 1 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingBottom: 3 },
});
