import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, View, type DimensionValue } from 'react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { tone as getTone, type Tone } from '@/theme';
import { AppText } from './AppText';
import { IconTile } from './IconTile';
import { SkeletonScreen, type SkeletonVariant } from './Skeleton';

export function ProgressBar({ value, max = 100 }: { value: number; max?: number }) {
  const { colors } = useTheme();
  const pct = `${Math.min(100, Math.max(0, (value / max) * 100))}%` as DimensionValue;
  return (
    <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max, now: value }} style={[styles.track, { backgroundColor: colors.surface2 }]}>
      <View style={[styles.fill, { width: pct, backgroundColor: colors.orange }]} />
    </View>
  );
}


export function LoadingView({ variant, inline, label }: { variant?: SkeletonVariant; inline?: boolean; label?: string }) {
  return <SkeletonScreen variant={variant} inline={inline} label={label} />;
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
  note: { flexDirection: 'row', alignItems: 'center', gap: 13, borderRadius: 20, padding: 14 },
  flex: { flex: 1, gap: 2 },
});
