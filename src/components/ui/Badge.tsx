import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { fonts } from '@/theme';

export type BadgeTone = 'neutral' | 'orange' | 'green' | 'blue' | 'red';

type BadgeProps = {
  label: string;
  tone?: BadgeTone;
  icon?: LucideIcon;
  style?: StyleProp<ViewStyle>;
};

export function Badge({ label, tone = 'neutral', icon: Icon, style }: BadgeProps) {
  const { colors } = useTheme();
  const palette = {
    neutral: { bg: colors.surface2, fg: colors.muted },
    orange: { bg: colors.orangeSoft, fg: colors.orange },
    green: { bg: colors.greenSoft, fg: colors.green },
    blue: { bg: colors.blueSoft, fg: colors.blue },
    red: { bg: colors.redSoft, fg: colors.red },
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }, style]}>
      {Icon ? <Icon size={12} color={palette.fg} /> : null}
      <Text style={[styles.text, { color: palette.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  text: { fontFamily: fonts.extrabold, fontSize: 10, letterSpacing: 0.3 },
});
