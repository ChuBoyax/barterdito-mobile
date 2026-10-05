import type { ThemeColors } from './colors';

export type Tone = 'orange' | 'green' | 'blue' | 'red' | 'yellow' | 'violet' | 'neutral';

export type ToneColors = { bg: string; fg: string; solid: string };

export function tone(colors: ThemeColors, name: Tone): ToneColors {
  switch (name) {
    case 'orange':
      return { bg: colors.orangeSoft, fg: colors.orange, solid: colors.orange };
    case 'green':
      return { bg: colors.greenSoft, fg: colors.green, solid: colors.green };
    case 'blue':
      return { bg: colors.blueSoft, fg: colors.blue, solid: colors.blue };
    case 'red':
      return { bg: colors.redSoft, fg: colors.red, solid: colors.red };
    case 'yellow':
      return { bg: colors.yellowSoft, fg: colors.warning, solid: colors.warning };
    case 'violet':
      return { bg: colors.violetSoft, fg: colors.violet, solid: colors.violet };
    default:
      return { bg: colors.surface2, fg: colors.muted, solid: colors.muted };
  }
}
