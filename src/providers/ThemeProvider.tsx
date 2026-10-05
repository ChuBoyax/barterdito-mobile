import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { darkColors, lightColors, type ThemeColors } from '@/theme';
import { readJson, storageKeys, writeJson } from '@/utils/storage';

type ThemeContextValue = {
  colors: ThemeColors;
  dark: boolean;
  setDark: (dark: boolean) => void;
  toggleDark: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [override, setOverride] = useState<boolean | null>(null);

  useEffect(() => {
    void readJson<'dark' | 'light'>(storageKeys.theme).then((saved) => {
      if (saved) setOverride(saved === 'dark');
    });
  }, []);

  const dark = override ?? system === 'dark';

  const value = useMemo<ThemeContextValue>(() => {
    const setDark = (next: boolean) => {
      setOverride(next);
      void writeJson(storageKeys.theme, next ? 'dark' : 'light');
    };
    return {
      colors: dark ? darkColors : lightColors,
      dark,
      setDark,
      toggleDark: () => setDark(!dark),
    };
  }, [dark]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}
