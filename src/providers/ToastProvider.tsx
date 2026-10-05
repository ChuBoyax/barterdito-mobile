import { CheckCircle2 } from 'lucide-react-native';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonts } from '@/theme';

type ToastContextValue = { showToast: (message: string) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  const [opacity] = useState(() => new Animated.Value(0));
  const insets = useSafeAreaInsets();

  const showToast = useCallback((next: string) => setMessage(next), []);

  useEffect(() => {
    if (!message) return;
    Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    const id = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => setMessage(''));
    }, 2600);
    return () => clearTimeout(id);
  }, [message, opacity]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.toast, { bottom: insets.bottom + 90, opacity }]}
          accessibilityLiveRegion="polite">
          <CheckCircle2 size={18} color="#7ee2b8" />
          <Text style={styles.text}>{message}</Text>
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
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    backgroundColor: '#2c2c2c',
    paddingHorizontal: 16,
    paddingVertical: 13,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  text: { flex: 1, color: '#fff', fontFamily: fonts.semibold, fontSize: 13 },
});
