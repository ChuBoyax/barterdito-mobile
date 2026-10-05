import type { ViewStyle } from 'react-native';

import type { ThemeColors } from './colors';

export * from './colors';
export * from './layout';
export * from './tones';
export * from './typography';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 999,
} as const;

export function elevation(level: 1 | 2 | 3, colors: ThemeColors): ViewStyle {
  const presets = {
    1: { radius: 10, y: 3, android: 1 },
    2: { radius: 18, y: 8, android: 3 },
    3: { radius: 28, y: 14, android: 6 },
  }[level];
  return {
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowRadius: presets.radius,
    shadowOffset: { width: 0, height: presets.y },
    elevation: presets.android,
  };
}
