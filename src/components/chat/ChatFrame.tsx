import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useKeyboardLift } from '@/hooks/useKeyboardLift';
import { useTheme } from '@/providers/ThemeProvider';

/** Chat screen frame that keeps the composer right above the keyboard. */
export function ChatFrame({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const { lift, onLayout } = useKeyboardLift();

  return (
    <View onLayout={onLayout} style={[styles.flex, { backgroundColor: colors.background, paddingBottom: lift }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
