import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/providers/ThemeProvider';

type GlassProps = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  strong?: boolean;
  bordered?: boolean;
};

export function Glass({ children, style, intensity = 40, strong, bordered = true }: GlassProps) {
  const { colors, dark } = useTheme();
  const flat = StyleSheet.flatten(style) ?? {};
  const layerRadius = { borderRadius: flat.borderRadius };
  return (
    <View style={[styles.wrap, bordered && { borderWidth: StyleSheet.hairlineWidth * 2, borderColor: colors.glassBorder }, style]}>
      <BlurView
        intensity={intensity}
        tint={dark ? 'dark' : 'light'}
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        style={[styles.layer, layerRadius]}
      />
      <View style={[styles.layer, layerRadius, { backgroundColor: strong ? colors.surface : colors.glass }]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', zIndex: 0 },
  layer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: -1 },
});
