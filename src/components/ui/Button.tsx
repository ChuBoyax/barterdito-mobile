import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { brand, fonts, type ThemeColors, maxFontScale } from '@/theme';
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
      return { bg: colors.orange, fg: colors.onPrimary, border: colors.orange };
    case 'success':
      return { bg: colors.green, fg: colors.onPrimary, border: colors.green };
    case 'secondary':
      return { bg: colors.surface, fg: colors.ink, border: colors.line };
    case 'danger':
      return { bg: colors.redSoft, fg: colors.red, border: colors.redSoft };
    default:
      return { bg: 'transparent', fg: colors.orange, border: 'transparent' };
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
        { backgroundColor: palette.bg, borderColor: palette.border },
        variant === 'primary' && !inactive && styles.primaryShadow,
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
  base: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, borderWidth: 1 },
  regular: { height: 50, paddingHorizontal: 20 },
  compact: { height: 38, paddingHorizontal: 14, borderRadius: 12 },
  full: { alignSelf: 'stretch' },
  inactive: { opacity: 0.5 },
  primaryShadow: { shadowColor: brand.orange, shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  label: { fontFamily: fonts.bold, fontSize: 14 },
  labelCompact: { fontSize: 12.5 },
});
