import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';

import { useTheme } from '@/providers/ThemeProvider';

type PhotoScrimProps = { position?: 'bottom' | 'top' | 'both' };

export function PhotoScrim({ position = 'bottom' }: PhotoScrimProps) {
  const { colors } = useTheme();
  const stops = {
    bottom: { colors: ['transparent', colors.scrim] as const, locations: [0.45, 1] as const },
    top: { colors: [colors.scrim, 'transparent'] as const, locations: [0, 0.4] as const },
    both: { colors: [colors.scrim, 'transparent', 'transparent', colors.scrim] as const, locations: [0, 0.3, 0.6, 1] as const },
  }[position];
  return <LinearGradient pointerEvents="none" colors={stops.colors} locations={stops.locations} style={StyleSheet.absoluteFill} />;
}
