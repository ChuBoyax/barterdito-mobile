import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { elevation, radius } from '@/theme';
import { Glass } from './Glass';
import { PressableScale } from './PressableScale';

type CardProps = {
  children: ReactNode;
  onPress?: () => void;
  padded?: boolean;
  glass?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export function Card({ children, onPress, padded = true, glass, style, accessibilityLabel }: CardProps) {
  const { colors } = useTheme();
  const base = [styles.card, padded && styles.padded, style];
  const body = glass ? (
    <Glass style={base}>{children}</Glass>
  ) : (
    <View style={[{ backgroundColor: colors.surface, borderColor: colors.hairline }, styles.border, elevation(1, colors), ...base]}>{children}</View>
  );
  if (!onPress) return body;
  return (
    <PressableScale accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} scaleTo={0.98}>
      {body}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg },
  border: { borderWidth: 1 },
  padded: { padding: 18 },
});
