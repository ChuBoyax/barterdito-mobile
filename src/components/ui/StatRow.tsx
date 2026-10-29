import { Fragment, memo } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { fonts, maxFontScale, neu } from '@/theme';
import { formatNumber } from '@/utils/format';
import { AppText } from './AppText';

export type StatItem = { label: string; value: number | string; onPress?: () => void };

type StatRowProps = { stats: StatItem[]; raised?: boolean; style?: StyleProp<ViewStyle> };

/** Headline numbers in one row with hairline dividers. `raised` gives it its own card. */
export const StatRow = memo(function StatRow({ stats, raised = true, style }: StatRowProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, raised && [styles.card, { backgroundColor: colors.surface }, neu(colors, 1)], style]}>
      {stats.map((stat, index) => (
        <Fragment key={stat.label}>
          {index > 0 ? <View style={[styles.divider, { backgroundColor: colors.line }]} /> : null}
          <Pressable
            accessibilityRole={stat.onPress ? 'button' : undefined}
            accessibilityLabel={`${stat.value} ${stat.label}`}
            disabled={!stat.onPress}
            onPress={stat.onPress}
            style={styles.stat}>
            <Text maxFontSizeMultiplier={maxFontScale} style={[styles.value, { color: colors.ink }]}>
              {typeof stat.value === 'number' ? formatNumber(stat.value) : stat.value}
            </Text>
            <AppText variant="caption" numberOfLines={1}>
              {stat.label}
            </AppText>
          </Pressable>
        </Fragment>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  card: { borderRadius: 20, paddingVertical: 14 },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  value: { fontFamily: fonts.extrabold, fontSize: 20, lineHeight: 26, letterSpacing: -0.4 },
  divider: { width: StyleSheet.hairlineWidth * 2, height: 30 },
});
