import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { neu } from '@/theme';

type GlassProps = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  strong?: boolean;
  bordered?: boolean;
  blur?: boolean;
};


const canBlur = Platform.OS === 'ios';

export function Glass({ children, style, intensity = 40, strong, bordered = false, blur = false }: GlassProps) {
  const { colors, dark } = useTheme();
  const blurred = blur && canBlur;
  const fill = strong || !blurred ? colors.surface : colors.glass;
  const flat = StyleSheet.flatten(style) ?? {};
  const layerRadius = { borderRadius: flat.borderRadius };
  return (
    <View style={[styles.wrap, { backgroundColor: blurred ? undefined : fill }, neu(colors, 2), bordered && { borderWidth: StyleSheet.hairlineWidth * 2, borderColor: colors.glassBorder }, style]}>
      {blurred ? (
        <>
          <BlurView intensity={intensity} tint={dark ? 'dark' : 'light'} style={[styles.layer, layerRadius]} />
          <View style={[styles.layer, layerRadius, { backgroundColor: fill }]} />
        </>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { zIndex: 0 },
  layer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: -1 },
});
