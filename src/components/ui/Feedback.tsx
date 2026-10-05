import { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { AppText } from './AppText';

export function ProgressBar({ value, max = 100 }: { value: number; max?: number }) {
  const { colors } = useTheme();
  const pct = `${Math.min(100, Math.max(0, (value / max) * 100))}%` as DimensionValue;
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max, now: value }}
      style={[styles.track, { backgroundColor: colors.surface2 }]}>
      <View style={[styles.fill, { width: pct, backgroundColor: colors.orange }]} />
    </View>
  );
}

/** Pulsing placeholder block used while services load. */
export function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  const [opacity] = useState(() => new Animated.Value(0.5));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 650, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={[{ backgroundColor: colors.surface2, borderRadius: 8, opacity }, style]} />;
}

export function LoadingView({ label = 'Loading…' }: { label?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.orange} />
      <AppText variant="small">{label}</AppText>
    </View>
  );
}

/** Tinted icon + title + text callout (web `.safe-trade-note`). */
export function InfoNote({
  icon: Icon,
  title,
  text,
  tone = 'green',
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  tone?: 'green' | 'blue' | 'orange';
}) {
  const { colors } = useTheme();
  const palette = {
    green: { bg: colors.greenSoft, fg: colors.green },
    blue: { bg: colors.blueSoft, fg: colors.blue },
    orange: { bg: colors.orangeSoft, fg: colors.orange },
  }[tone];
  return (
    <View style={[styles.note, { backgroundColor: palette.bg }]}>
      <Icon size={22} color={palette.fg} />
      <View style={styles.flex}>
        <AppText variant="h3">{title}</AppText>
        <AppText variant="small">{text}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 40 },
  note: { flexDirection: 'row', gap: 12, borderRadius: 14, padding: 14 },
  flex: { flex: 1, gap: 2 },
});
