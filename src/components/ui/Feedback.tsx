import type { LucideIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { tone as getTone, type Tone } from '@/theme';
import { AppText } from './AppText';
import { IconTile } from './IconTile';

export function ProgressBar({ value, max = 100 }: { value: number; max?: number }) {
  const { colors } = useTheme();
  const pct = `${Math.min(100, Math.max(0, (value / max) * 100))}%` as DimensionValue;
  return (
    <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max, now: value }} style={[styles.track, { backgroundColor: colors.surface2 }]}>
      <View style={[styles.fill, { width: pct, backgroundColor: colors.orange }]} />
    </View>
  );
}

export function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  const [opacity] = useState(() => new Animated.Value(0.45));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={[{ backgroundColor: colors.surface2, borderRadius: 10, opacity }, style]} />;
}

export function LoadingView({ label = 'Loading…' }: { label?: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.loading, { backgroundColor: colors.background }]}>
      <View style={[styles.spinner, { backgroundColor: colors.orangeSoft }]}>
        <ActivityIndicator color={colors.orange} />
      </View>
      <AppText variant="small">{label}</AppText>
    </View>
  );
}

export function InfoNote({
  icon,
  title,
  text,
  tone = 'green',
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  tone?: Tone;
}) {
  const { colors } = useTheme();
  const palette = getTone(colors, tone);
  return (
    <View style={[styles.note, { backgroundColor: palette.bg }]}>
      <IconTile icon={icon} size={40} tone={tone} variant="solid" />
      <View style={styles.flex}>
        <AppText variant="h3">{title}</AppText>
        <AppText variant="small">{text}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 10, borderRadius: 5, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 48 },
  spinner: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  note: { flexDirection: 'row', alignItems: 'center', gap: 13, borderRadius: 20, padding: 14 },
  flex: { flex: 1, gap: 2 },
});
