import { useRef, type ReactNode, type RefObject } from 'react';
import {
  Keyboard,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useKeyboardLift } from '@/hooks/useKeyboardLift';
import { useResponsive } from '@/hooks/useResponsive';
import { useTheme } from '@/providers/ThemeProvider';

/** Space kept above the keyboard, enough to also show a field's character count or error. */
const FIELD_MARGIN = 48;

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
  const { lift, onLayout } = useKeyboardLift();
  const scrollRef = useRef<ScrollView>(null);
  const contentRef = useRef<View>(null);
  const offset = useRef(0);
  const viewport = useRef(0);
  const frame = { width: '100%' as const, maxWidth: contentWidth, alignSelf: 'center' as const };
  const padding = padded ? { paddingHorizontal: gutter, paddingTop: 12 } : null;

  /** Scrolls the field being typed in out from under the keyboard; a field already in view stays put. */
  function revealFocusedField() {
    const scrollView = scrollRef.current;
    const content = contentRef.current;
    const input = TextInput.State.currentlyFocusedInput();
    if (!scrollView || !content || !input || !Keyboard.isVisible()) return;
    input.measureLayout(
      content,
      (_x, y, _width, height) => {
        const bottom = y + height + FIELD_MARGIN;
        if (y >= offset.current && bottom <= offset.current + viewport.current) return;
        // A field taller than the space left keeps its end, where the typing happens, in view.
        const target = Math.max(0, bottom - viewport.current);
        offset.current = target;
        scrollView.scrollTo({ y: target, animated: true });
      },
      // The focused field can be in a sheet above this screen; that sheet handles it.
      () => undefined,
    );
  }

  function rememberOffset(event: NativeSyntheticEvent<NativeScrollEvent>) {
    offset.current = event.nativeEvent.contentOffset.y;
  }

  return (
    <View onLayout={onLayout} style={[styles.flex, { backgroundColor: colors.background, paddingBottom: lift }]}>
      {scroll ? (
        <ScrollView
          ref={scrollRef}
          innerViewRef={contentRef as RefObject<View>}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[frame, padding, styles.gap, styles.bottom, contentStyle]}
          onLayout={(event) => {
            viewport.current = event.nativeEvent.layout.height;
            revealFocusedField();
          }}
          // A description growing line by line must keep its last line above the keyboard.
          onContentSizeChange={revealFocusedField}
          onScrollEndDrag={rememberOffset}
          onMomentumScrollEnd={rememberOffset}
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
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { gap: 18 },
  bottom: { paddingBottom: 40 },
});
