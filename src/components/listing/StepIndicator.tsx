import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';

type StepIndicatorProps = {
  steps: string[];
  current: number;
  onSelect: (index: number) => void;
};

export function StepIndicator({ steps, current, onSelect }: StepIndicatorProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      {steps.map((label, index) => {
        const reached = current >= index;
        return (
          <Pressable
            key={label}
            accessibilityRole="tab"
            accessibilityState={{ selected: current === index }}
            accessibilityLabel={`Step ${index + 1}: ${label}`}
            onPress={() => onSelect(index)}
            style={styles.step}>
            <View style={[styles.dot, { backgroundColor: reached ? colors.orange : colors.surface2 }]}>
              {current > index ? (
                <Check size={14} color={colors.onPrimary} />
              ) : (
                <AppText variant="caption" weight="extrabold" style={{ color: reached ? colors.onPrimary : colors.muted }}>
                  {index + 1}
                </AppText>
              )}
            </View>
            <AppText variant="caption" color={reached ? 'ink' : 'muted'} weight="bold" align="center">
              {label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  step: { flex: 1, alignItems: 'center', gap: 6 },
  dot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
});
