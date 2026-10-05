import { ArrowUpRight } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { AppText } from './AppText';

type SectionHeadingProps = {
  title: string;
  eyebrow?: string;
  action?: string;
  onAction?: () => void;
};

export function SectionHeading({ title, eyebrow, action, onAction }: SectionHeadingProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.flex}>
        {eyebrow ? <AppText variant="eyebrow">{eyebrow}</AppText> : null}
        <AppText variant="h2">{title}</AppText>
      </View>
      {action && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8} style={[styles.action, { backgroundColor: colors.surface2 }]}>
          <AppText variant="caption" weight="bold" color="ink">
            {action}
          </AppText>
          <ArrowUpRight size={14} color={colors.ink} strokeWidth={2.4} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginBottom: 14 },
  flex: { flex: 1, gap: 2 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6 },
});
