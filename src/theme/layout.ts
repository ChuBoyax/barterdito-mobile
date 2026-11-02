export const breakpoints = {
  compact: 360,
  tablet: 600,
  wide: 900,
} as const;

export const maxContentWidth = {
  tablet: 720,
  wide: 960,
} as const;

/** How far text follows the phone's font-size setting. Layouts use minHeight and wrapping, so they grow with it. */
export const maxFontScale = 1.5;
