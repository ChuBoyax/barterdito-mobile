import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "./AuthProvider";
import { MarketplaceProvider } from "./MarketplaceProvider";
import { queryClient } from "./queryClient";
import { ThemeProvider } from "./ThemeProvider";
import { ToastProvider } from "./ToastProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <MarketplaceProvider>{children}</MarketplaceProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

export { useAuth } from "./AuthProvider";
export { useMarketplace } from "./MarketplaceProvider";
export { useTheme } from "./ThemeProvider";
export { useToast } from "./ToastProvider";
export { queryClient } from "./queryClient";
