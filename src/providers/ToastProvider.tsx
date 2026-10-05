import { CheckCircle2 } from 'lucide-react-native';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { elevation, fonts } from '@/theme';
import { useTheme } from './ThemeProvider';

type ToastContextValue = { showToast: (message: string) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const [message, setMessage] = useState('');
  const [progress] = useState(() => new Animated.Value(0));
  const insets = useSafeAreaInsets();

  const showToast = useCallback((next: string) => setMessage(next), []);

  useEffect(() => {
    if (!message) return;
    Animated.spring(progress, { toValue: 1, useNativeDriver: true, damping: 16, stiffness: 180 }).start();
    const id = setTimeout(() => {
      Animated.timing(progress, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setMessage(''));
    }, 2600);
    return () => clearTimeout(id);
  }, [message, progress]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] });

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.toast, { top: insets.top + 10, backgroundColor: colors.toast, opacity: progress, transform: [{ translateY }] }, elevation(3, colors)]}
          accessibilityLiveRegion="polite">
          <CheckCircle2 size={18} color={colors.green} strokeWidth={2.4} />
          <Text style={[styles.text, { color: colors.onToast }]}>{message}</Text>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context.showToast;
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    maxWidth: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  text: { flexShrink: 1, fontFamily: fonts.semibold, fontSize: 13 },
});
