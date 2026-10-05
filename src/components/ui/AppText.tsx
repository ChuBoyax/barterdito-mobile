import { Text, type TextProps, type TextStyle } from 'react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { fonts, type FontWeight, type ThemeColors } from '@/theme';

type Variant = 'hero' | 'h1' | 'h2' | 'h3' | 'body' | 'small' | 'caption' | 'eyebrow';

const variants: Record<Variant, TextStyle & { weight: FontWeight }> = {
  hero: { fontSize: 30, lineHeight: 36, weight: 'extrabold', letterSpacing: -0.8 },
  h1: { fontSize: 24, lineHeight: 30, weight: 'extrabold', letterSpacing: -0.5 },
  h2: { fontSize: 19, lineHeight: 25, weight: 'extrabold', letterSpacing: -0.3 },
  h3: { fontSize: 15, lineHeight: 21, weight: 'bold' },
  body: { fontSize: 14, lineHeight: 21, weight: 'regular' },
  small: { fontSize: 12.5, lineHeight: 18, weight: 'medium' },
  caption: { fontSize: 11, lineHeight: 15, weight: 'medium' },
  eyebrow: { fontSize: 10, lineHeight: 14, weight: 'extrabold', letterSpacing: 1.1, textTransform: 'uppercase' },
};

export type AppTextProps = TextProps & {
  variant?: Variant;
  weight?: FontWeight;
  color?: keyof ThemeColors;
  align?: TextStyle['textAlign'];
};

export function AppText({ variant = 'body', weight, color, align, style, ...rest }: AppTextProps) {
  const { colors } = useTheme();
  const { weight: defaultWeight, ...variantStyle } = variants[variant];
  const defaultColor: keyof ThemeColors =
    variant === 'eyebrow' ? 'orange' : variant === 'caption' || variant === 'small' ? 'muted' : 'ink';
  return (
    <Text
      {...rest}
      style={[
        variantStyle,
        { fontFamily: fonts[weight ?? defaultWeight], color: colors[color ?? defaultColor], textAlign: align },
        style,
      ]}
    />
  );
}
