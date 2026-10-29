import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import type { ReactNode } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "./AuthProvider";
import { MarketplaceProvider } from "./MarketplaceProvider";
import { persistOptions, queryClient } from "./queryClient";
import { ThemeProvider } from "./ThemeProvider";
import { ToastProvider } from "./ToastProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <MarketplaceProvider>{children}</MarketplaceProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </PersistQueryClientProvider>
  );
}

export { useAuth } from "./AuthProvider";
export { useMarketplace, useMarketplaceActions } from "./MarketplaceProvider";
export { useTheme } from "./ThemeProvider";
export { useToast } from "./ToastProvider";
export { queryClient } from "./queryClient";
