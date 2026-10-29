import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { fonts, neu, type ThemeColors, maxFontScale } from '@/theme';
import { PressableScale } from './PressableScale';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  compact?: boolean;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

function variantStyle(variant: ButtonVariant, colors: ThemeColors) {
  switch (variant) {
    case 'primary':
      return { bg: colors.orange, fg: colors.onPrimary, raised: true };
    case 'success':
      return { bg: colors.green, fg: colors.onPrimary, raised: true };
    case 'secondary':
      return { bg: colors.surface, fg: colors.ink, raised: true };
    case 'danger':
      return { bg: colors.surface, fg: colors.red, raised: true };
    default:
      return { bg: 'transparent', fg: colors.orange, raised: false };
  }
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon: Icon,
  iconRight: IconRight,
  compact,
  disabled,
  loading,
  fullWidth,
  style,
}: ButtonProps) {
  const { colors } = useTheme();
  const inactive = disabled || loading;
  const palette = variantStyle(variant, colors);
  const iconSize = compact ? 15 : 18;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive }}
      disabled={inactive}
      onPress={onPress}
      scaleTo={0.97}
      style={[
        styles.base,
        compact ? styles.compact : styles.regular,
        { backgroundColor: palette.bg },
        palette.raised && !inactive && neu(colors, compact ? 1 : 2),
        fullWidth && styles.full,
        inactive && styles.inactive,
        style,
      ]}>
      {loading ? <ActivityIndicator size="small" color={palette.fg} /> : Icon ? <Icon size={iconSize} color={palette.fg} strokeWidth={2.2} /> : null}
      <Text maxFontSizeMultiplier={maxFontScale} style={[styles.label, compact && styles.labelCompact, { color: palette.fg }]} numberOfLines={1}>
        {label}
      </Text>
      {IconRight ? <IconRight size={iconSize} color={palette.fg} strokeWidth={2.2} /> : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 999 },
  regular: { height: 52, paddingHorizontal: 22 },
  compact: { height: 40, paddingHorizontal: 16 },
  full: { alignSelf: 'stretch' },
  inactive: { opacity: 0.5 },
  label: { fontFamily: fonts.bold, fontSize: 14 },
  labelCompact: { fontSize: 12.5 },
});
