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

import { useTheme } from '@/providers/ThemeProvider';

type ScreenProps = {
  children: ReactNode;
  /** Use false for screens that manage their own list (FlatList). */
  scroll?: boolean;
  padded?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: StyleProp<ViewStyle>;
  footer?: ReactNode;
};

/** Standard page container: themed background, padding, keyboard handling, pull to refresh. */
export function Screen({ children, scroll = true, padded = true, refreshing, onRefresh, contentStyle, footer }: ScreenProps) {
  const { colors } = useTheme();
  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[padded && styles.padded, styles.gap, contentStyle]}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={colors.orange} />
            ) : undefined
          }>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, padded && styles.padded, contentStyle]}>{children}</View>
      )}
      {footer}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  padded: { padding: 16, paddingBottom: 40 },
  gap: { gap: 16 },
});
