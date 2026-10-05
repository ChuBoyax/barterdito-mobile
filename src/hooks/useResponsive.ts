import { useWindowDimensions } from 'react-native';

import { breakpoints, maxContentWidth } from '@/theme/layout';

const fallbackSize = { width: 390, height: 844 };

export function useResponsive() {
  const dimensions = useWindowDimensions();
  const width = dimensions.width || fallbackSize.width;
  const height = dimensions.height || fallbackSize.height;
  const isCompact = width < breakpoints.compact;
  const isTablet = width >= breakpoints.tablet;
  const isWide = width >= breakpoints.wide;
  const gutter = isCompact ? 16 : isTablet ? 28 : 20;
  const contentWidth = Math.min(width, isWide ? maxContentWidth.wide : isTablet ? maxContentWidth.tablet : width);
  const columns = isWide ? 4 : isTablet ? 3 : 2;

  return {
    width,
    height,
    isCompact,
    isTablet,
    isWide,
    gutter,
    contentWidth,
    innerWidth: contentWidth - gutter * 2,
    columns,
  };
}
