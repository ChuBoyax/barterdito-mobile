import { router } from 'expo-router';
import { Lock, LogIn } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState, LoadingView } from '@/components/ui';
import { useAuth } from '@/providers';
import { useTheme } from '@/providers/ThemeProvider';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { authenticated, ready } = useAuth();
  const { colors } = useTheme();
  if (!ready) return <LoadingView />;
  if (authenticated) return <>{children}</>;
  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      <EmptyState
        icon={Lock}
        title="Sign in to continue"
        text="Log in to send offers, save finds, chat with traders, and manage your listings."
        action="Log in"
        actionIcon={LogIn}
        onAction={() => router.push('/login')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center' },
});
