import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { radius } from '@/theme';

type CardProps = {
  children: ReactNode;
  onPress?: () => void;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/** Surface container matching the web `.content-card`. */
export function Card({ children, onPress, padded = true, style, accessibilityLabel }: CardProps) {
  const { colors } = useTheme();
  const cardStyle = [
    styles.card,
    padded && styles.padded,
    { backgroundColor: colors.surface, borderColor: colors.line, shadowColor: colors.shadow },
    style,
  ];
  if (!onPress) return <View style={cardStyle}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [cardStyle, pressed && { opacity: 0.88 }]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  padded: { padding: 16 },
});
