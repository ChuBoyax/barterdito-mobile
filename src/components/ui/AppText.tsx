import { Text, type TextProps, type TextStyle } from 'react-native';

import { useResponsive } from '@/hooks/useResponsive';
import { useTheme } from '@/providers/ThemeProvider';
import { fonts, maxFontScale, type FontWeight, type ThemeColors } from '@/theme';

type Variant = 'display' | 'hero' | 'h1' | 'h2' | 'h3' | 'body' | 'small' | 'caption' | 'eyebrow';

const variants: Record<Variant, TextStyle & { weight: FontWeight }> = {
  display: { fontSize: 33, lineHeight: 38, weight: 'extrabold', letterSpacing: -1.2 },
  hero: { fontSize: 30, lineHeight: 36, weight: 'extrabold', letterSpacing: -0.9 },
  h1: { fontSize: 24, lineHeight: 30, weight: 'extrabold', letterSpacing: -0.6 },
  h2: { fontSize: 19, lineHeight: 25, weight: 'bold', letterSpacing: -0.3 },
  h3: { fontSize: 15, lineHeight: 20, weight: 'bold', letterSpacing: -0.15 },
  body: { fontSize: 14.5, lineHeight: 22, weight: 'regular' },
  small: { fontSize: 13.5, lineHeight: 20, weight: 'medium' },
  caption: { fontSize: 12, lineHeight: 16, weight: 'medium' },
  eyebrow: { fontSize: 11, lineHeight: 14, weight: 'bold', letterSpacing: 1.1, textTransform: 'uppercase' },
};

const compactScale: Partial<Record<Variant, number>> = { display: 0.84, hero: 0.84, h1: 0.92 };
const tabletScale: Partial<Record<Variant, number>> = { display: 1.15, hero: 1.1, h1: 1.05 };

export type AppTextProps = TextProps & {
  variant?: Variant;
  weight?: FontWeight;
  color?: keyof ThemeColors;
  align?: TextStyle['textAlign'];
};

export function AppText({ variant = 'body', weight, color, align, style, ...rest }: AppTextProps) {
  const { colors } = useTheme();
  const { isCompact, isTablet } = useResponsive();
  const { weight: defaultWeight, ...variantStyle } = variants[variant];
  const scale = (isCompact ? compactScale[variant] : isTablet ? tabletScale[variant] : undefined) ?? 1;
  const sized = scale === 1 ? variantStyle : { ...variantStyle, fontSize: (variantStyle.fontSize ?? 14) * scale, lineHeight: (variantStyle.lineHeight ?? 20) * scale };
  const defaultColor: keyof ThemeColors =
    variant === 'caption' || variant === 'small' || variant === 'eyebrow' ? 'muted' : 'ink';
  return (
    <Text
      maxFontSizeMultiplier={maxFontScale}
      {...rest}
      style={[
        sized,
        { fontFamily: fonts[weight ?? defaultWeight], color: colors[color ?? defaultColor] as string, textAlign: align },
        style,
      ]}
    />
  );
}
