import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { fonts } from '@/theme';

type IconButtonProps = {
  icon: LucideIcon;
  label: string;
  onPress?: () => void;
  size?: number;
  active?: boolean;
  tone?: 'default' | 'danger' | 'plain';
  filled?: boolean;
  badge?: number;
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
  style,
}: IconButtonProps) {
  const { colors } = useTheme();
  const color = tone === 'danger' ? colors.red : active ? colors.orange : colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        tone !== 'plain' && { backgroundColor: active ? colors.orangeSoft : colors.surface, borderColor: colors.line },
        tone === 'danger' && { backgroundColor: colors.redSoft, borderColor: colors.redSoft },
        tone === 'plain' && styles.plain,
        pressed && { opacity: 0.7 },
        style,
      ]}>
      <Icon size={size} color={color} fill={filled ? color : 'none'} />
      {badge ? (
        <View style={[styles.badge, { backgroundColor: colors.orange, borderColor: colors.background }]}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  plain: { borderWidth: 0, width: 36, height: 36 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    borderWidth: 2,
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontFamily: fonts.extrabold, fontSize: 9 },
});
