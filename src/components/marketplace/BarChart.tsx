import { StyleSheet, View, type DimensionValue } from 'react-native';

import { AppText } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';

type BarChartProps = { values: number[]; labels: string[]; height?: number };

export function BarChart({ values, labels, height = 160 }: BarChartProps) {
  const { colors } = useTheme();
  const max = Math.max(...values, 1);
  const peak = values.indexOf(max);
  return (
    <View accessibilityLabel={`Bar chart with ${values.length} values`}>
      <View style={[styles.chart, { height }]}>
        {values.map((value, index) => (
          <View key={index} style={[styles.slot, { backgroundColor: colors.surface2 }]}>
            <View
              style={[
                styles.bar,
                { height: `${(value / max) * 100}%` as DimensionValue, backgroundColor: index === peak ? colors.orange : colors.orangeSoft },
              ]}
            />
          </View>
        ))}
      </View>
      <View style={styles.labels}>
        {labels.map((label) => (
          <AppText key={label} variant="caption">
            {label}
          </AppText>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  slot: { flex: 1, height: '100%', borderRadius: 8, justifyContent: 'flex-end', overflow: 'hidden' },
  bar: { width: '100%', borderRadius: 8 },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
});
