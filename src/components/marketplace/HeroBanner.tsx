import { LinearGradient } from 'expo-linear-gradient';
import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Badge, type BadgeTone } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';

type HeroBannerProps = {
  badge: string;
  badgeTone?: BadgeTone;
  title: string;
  text?: string;
  icon?: LucideIcon;
  tint?: 'orange' | 'green' | 'blue';
  children?: ReactNode;
};

export function HeroBanner({ badge, badgeTone = 'orange', title, text, icon: Icon, tint = 'orange', children }: HeroBannerProps) {
  const { colors, dark } = useTheme();
  const gradients: Record<typeof tint, readonly [string, string]> = {
    orange: dark ? ['#3a2518', '#211f1d'] : ['#fff2e7', '#f3ede6'],
    green: dark ? ['#19382d', '#254237'] : ['#e9f7f0', '#dff1e8'],
    blue: dark ? ['#1d2d48', '#19352b'] : ['#e9f0ff', '#e9f7f0'],
  };
  const iconColor = { orange: colors.orange, green: colors.green, blue: colors.blue }[tint];
  return (
    <LinearGradient colors={gradients[tint]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
      <View style={styles.row}>
        <View style={styles.copy}>
          <Badge label={badge} tone={badgeTone} />
          <AppText variant="h1">{title}</AppText>
          {text ? <AppText variant="small">{text}</AppText> : null}
        </View>
        {Icon ? <Icon size={54} color={iconColor} strokeWidth={1.6} /> : null}
      </View>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 24, padding: 20, gap: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  copy: { flex: 1, gap: 8 },
});
