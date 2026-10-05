import { StyleSheet, View, type DimensionValue } from 'react-native';

import { AppText } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';

type BarChartProps = { values: number[]; labels: string[]; height?: number };

export function BarChart({ values, labels, height = 150 }: BarChartProps) {
  const { colors } = useTheme();
  const max = Math.max(...values, 1);
  return (
    <View accessibilityLabel={`Bar chart with ${values.length} values`}>
      <View style={[styles.chart, { height }]}>
        {values.map((value, index) => (
          <View
            key={index}
            style={[
              styles.bar,
              {
                height: `${(value / max) * 100}%` as DimensionValue,
                backgroundColor: index === values.length - 1 ? colors.orange : colors.orangeSoft,
              },
            ]}
          />
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
  bar: { flex: 1, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
});
