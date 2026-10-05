import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { fonts, tone as getTone, type Tone } from '@/theme';

export type BadgeTone = Tone | 'glass';

type BadgeProps = {
  label: string;
  tone?: BadgeTone;
  icon?: LucideIcon;
  dot?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Badge({ label, tone = 'neutral', icon: Icon, dot, style }: BadgeProps) {
  const { colors } = useTheme();
  const palette = tone === 'glass' ? { bg: colors.glass, fg: colors.ink } : getTone(colors, tone);
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }, style]}>
      {dot ? <View style={[styles.dot, { backgroundColor: palette.fg }]} /> : null}
      {Icon ? <Icon size={12} color={palette.fg} strokeWidth={2.4} /> : null}
      <Text style={[styles.text, { color: palette.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontFamily: fonts.extrabold, fontSize: 10.5, letterSpacing: 0.2 },
});
