import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { fonts, maxFontScale } from '@/theme';
import { Glass } from './Glass';
import { PressableScale } from './PressableScale';

type IconButtonProps = {
  icon: LucideIcon;
  label: string;
  onPress?: () => void;
  size?: number;
  active?: boolean;
  tone?: 'default' | 'danger' | 'plain' | 'glass';
  filled?: boolean;
  badge?: number;
  dimension?: number;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({
  icon: Icon,
  label,
  onPress,
  size = 20,
  active,
  tone = 'default',
  filled,
  badge,
  dimension = 44,
  style,
}: IconButtonProps) {
  const { colors } = useTheme();
  const color = tone === 'danger' ? colors.red : active ? colors.orange : colors.ink;
  const shape = { width: dimension, height: dimension, borderRadius: dimension / 2 };
  const icon = <Icon size={size} color={color} fill={filled ? color : 'none'} strokeWidth={2} />;

  return (
    <PressableScale accessibilityRole="button" accessibilityLabel={label} hitSlop={6} onPress={onPress} scaleTo={0.9} style={style}>
      {tone === 'glass' ? (
        <Glass style={[styles.center, shape]}>{icon}</Glass>
      ) : (
        <View
          style={[
            styles.center,
            shape,
            tone === 'default' && { backgroundColor: active ? colors.orangeSoft : colors.surface, borderWidth: 1, borderColor: colors.line },
            tone === 'danger' && { backgroundColor: colors.redSoft },
          ]}>
          {icon}
        </View>
      )}
      {badge ? (
        <View style={[styles.badge, { backgroundColor: colors.orange, borderColor: colors.background }]}>
          <Text maxFontSizeMultiplier={maxFontScale} style={[styles.badgeText, { color: colors.onPrimary }]}>{badge}</Text>
        </View>
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -3, right: -3, minWidth: 19, height: 19, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 2, paddingHorizontal: 4 },
  badgeText: { fontFamily: fonts.extrabold, fontSize: 9.5 },
});
