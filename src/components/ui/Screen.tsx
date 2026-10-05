import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useResponsive } from '@/hooks/useResponsive';
import { useTheme } from '@/providers/ThemeProvider';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: StyleProp<ViewStyle>;
  footer?: ReactNode;
  header?: ReactNode;
};

export function Screen({
  children,
  scroll = true,
  padded = true,
  refreshing,
  onRefresh,
  contentStyle,
  footer,
  header,
}: ScreenProps) {
  const { colors } = useTheme();
  const { contentWidth, gutter } = useResponsive();
  const frame = { width: '100%' as const, maxWidth: contentWidth, alignSelf: 'center' as const };
  const padding = padded ? { paddingHorizontal: gutter, paddingTop: 12 } : null;
  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[frame, padding, styles.gap, styles.bottom, contentStyle]}
          refreshControl={
            onRefresh ? <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={colors.orange} colors={[colors.orange]} /> : undefined
          }>
          {header}
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, frame, padding, contentStyle]}>
          {header}
          {children}
        </View>
      )}
      {footer}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { gap: 18 },
  bottom: { paddingBottom: 40 },
});
