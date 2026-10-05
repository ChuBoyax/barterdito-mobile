import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { fonts, radius } from '@/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  compact?: boolean;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

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
  const palette = {
    primary: { bg: colors.orange, fg: colors.white, border: colors.orange },
    secondary: { bg: colors.surface, fg: colors.ink, border: colors.line },
    ghost: { bg: 'transparent', fg: colors.orange, border: 'transparent' },
    danger: { bg: colors.redSoft, fg: colors.red, border: colors.redSoft },
  }[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        compact && styles.compact,
        fullWidth && styles.full,
        { backgroundColor: palette.bg, borderColor: palette.border },
        variant === 'primary' && styles.primaryShadow,
        variant === 'ghost' && styles.ghost,
        (pressed || inactive) && { opacity: inactive ? 0.55 : 0.85 },
        style,
      ]}>
      {loading ? <ActivityIndicator size="small" color={palette.fg} /> : Icon ? <Icon size={17} color={palette.fg} /> : null}
      <Text style={[styles.label, { color: palette.fg }]}>{label}</Text>
      {IconRight ? <IconRight size={17} color={palette.fg} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 18,
  },
  compact: { minHeight: 36, paddingHorizontal: 13 },
  full: { alignSelf: 'stretch' },
  ghost: { paddingHorizontal: 6 },
  primaryShadow: {
    shadowColor: '#ff6e00',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  label: { fontFamily: fonts.bold, fontSize: 13.5 },
});
