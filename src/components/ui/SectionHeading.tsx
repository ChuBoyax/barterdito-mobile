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

export function SectionHeading({ title, eyebrow, action, onAction }: SectionHeadingProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.flex}>
        {eyebrow ? <AppText variant="eyebrow">{eyebrow}</AppText> : null}
        <AppText variant="h2" weight="medium">
          {title}
        </AppText>
      </View>
      {action && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8} style={styles.action}>
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
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginBottom: 14 },
  flex: { flex: 1, gap: 2 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});
