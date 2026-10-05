import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { tone as getTone, type Tone } from '@/theme';

type IconTileProps = {
  icon: LucideIcon;
  tone?: Tone;
  variant?: 'soft' | 'solid';
  size?: number;
  rounded?: boolean;
};

export function IconTile({ icon: Icon, tone = 'orange', variant = 'soft', size = 42, rounded }: IconTileProps) {
  const { colors } = useTheme();
  const palette = getTone(colors, tone);
  const solid = variant === 'solid';
  return (
    <View
      style={[
        styles.tile,
        { width: size, height: size, borderRadius: rounded ? size / 2 : size * 0.3, backgroundColor: solid ? palette.solid : palette.bg },
      ]}>
      <Icon size={Math.round(size * 0.46)} color={solid ? colors.onPrimary : palette.fg} strokeWidth={2.1} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { alignItems: 'center', justifyContent: 'center' },
});
