import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { Onboarding } from '@/components/layout';
import { AppProviders, useTheme } from '@/providers';
import { fontAssets, fonts } from '@/theme';
import { readJson, storageKeys, writeJson } from '@/utils/storage';

void SplashScreen.preventAutoHideAsync();

const screenTitles: Record<string, string> = {
  'items/[id]': 'Item details',
  'traders/[id]': 'Trader Profile',
  'messages/[id]': 'Trade Chat',
  'direct-messages/index': 'Direct Messages',
  'direct-messages/[id]': 'Direct Chat',
  'meetups/[id]': 'Schedule Meetup',
  'trade-review/[id]': 'Rate Your Trade',
  'trade-complete/[id]': 'Trade Complete',
  'post-item': 'Post an Item',
  leaderboard: 'Leaderboard',
  events: 'Trade Events',
  community: 'Community',
  map: 'Nearby Trades',
  analytics: 'Seller Analytics',
  settings: 'Settings',
  wishlist: 'My Wishlist',
  activity: 'Activity',
  qr: 'QR Profile',
  referral: 'Invite & Earn',
  donate: 'Support Barterdito',
  help: 'Help & Safety',
  followers: 'Community Connections',
  disputes: 'Dispute Resolution',
  recommendations: 'Recommended For You',
  admin: 'Sentinel Admin',
  privacy: 'Privacy Policy',
  terms: 'Terms of Service',
  'payment-receipt': 'Payment Receipt',
  notifications: 'Notifications',
};

function RootStack() {
  const { colors, dark } = useTheme();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    void readJson<string>(storageKeys.onboarded).then((value) => setShowOnboarding(value !== 'yes'));
  }, []);

  const navigationTheme = {
    ...(dark ? DarkTheme : DefaultTheme),
    colors: {
      ...(dark ? DarkTheme : DefaultTheme).colors,
      primary: colors.orange,
      background: colors.background,
      card: colors.background,
      text: colors.ink,
      border: colors.line,
    },
  };

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.ink,
          headerTitleStyle: { fontFamily: fonts.extrabold, fontSize: 17 },
          headerTitleAlign: 'center',
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
          freezeOnBlur: true,
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="menu" options={{ presentation: 'modal', title: 'Explore', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="items/[id]" options={{ headerShown: false }} />
        {Object.entries(screenTitles)
          .filter(([name]) => name !== 'items/[id]')
          .map(([name, title]) => (
            <Stack.Screen key={name} name={name} options={{ title }} />
          ))}
      </Stack>
      <Onboarding
        visible={showOnboarding}
        onFinish={() => {
          setShowOnboarding(false);
          void writeJson(storageKeys.onboarded, 'yes');
        }}
      />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts(fontAssets);

  useEffect(() => {
    if (fontsLoaded) void SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <AppProviders>
      <RootStack />
    </AppProviders>
  );
}
