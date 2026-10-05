import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './AuthProvider';
import { MarketplaceProvider } from './MarketplaceProvider';
import { ThemeProvider } from './ThemeProvider';
import { ToastProvider } from './ToastProvider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <MarketplaceProvider>{children}</MarketplaceProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export { useAuth } from './AuthProvider';
export { useMarketplace } from './MarketplaceProvider';
export { useTheme } from './ThemeProvider';
export { useToast } from './ToastProvider';
