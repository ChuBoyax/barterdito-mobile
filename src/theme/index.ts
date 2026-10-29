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
  sm: 14,
  md: 18,
  lg: 24,
  xl: 28,
  pill: 999,
} as const;

const depths = {
  1: { offset: 3, blur: 8 },
  2: { offset: 5, blur: 14 },
  3: { offset: 8, blur: 22 },
} as const;

export type NeuDepth = keyof typeof depths;

/**
 * Neumorphic (soft UI) shadow: a highlight from the top-left and a shadow to the
 * bottom-right, so the element looks extruded from (or, with `inset`, pressed into)
 * a surface of the same color. Uses `boxShadow`, which supports several layers.
 */
export function neu(colors: ThemeColors, depth: NeuDepth = 2, inset = false): ViewStyle {
  // Cached per palette so every render reuses the same style object (no native prop churn).
  let palette = shadowCache.get(colors);
  if (!palette) shadowCache.set(colors, (palette = new Map()));
  const key = inset ? -depth : depth;
  let style = palette.get(key);
  if (!style) {
    const { offset, blur } = depths[depth];
    const prefix = inset ? 'inset ' : '';
    style = {
      boxShadow: `${prefix}${offset}px ${offset}px ${blur}px ${colors.neuDark}, ${prefix}${-offset}px ${-offset}px ${blur}px ${colors.neuLight}`,
    };
    palette.set(key, style);
  }
  return style;
}

const shadowCache = new WeakMap<ThemeColors, Map<number, ViewStyle>>();

/** Raised neumorphic surface; kept under the old name so every caller picks up the new look. */
export function elevation(level: 1 | 2 | 3, colors: ThemeColors): ViewStyle {
  return neu(colors, level);
}
