import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Badge, IconTile } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import { tone as getTone, type Tone } from '@/theme';

type HeroBannerProps = {
  badge: string;
  title: string;
  text?: string;
  icon?: LucideIcon;
  tone?: Tone;
  children?: ReactNode;
};

export function HeroBanner({ badge, title, text, icon, tone = 'orange', children }: HeroBannerProps) {
  const { colors } = useTheme();
  const palette = getTone(colors, tone);
  return (
    <View style={[styles.hero, { backgroundColor: palette.bg }]}>
      <View style={styles.row}>
        <View style={styles.copy}>
          <Badge label={badge} tone={tone} style={{ backgroundColor: colors.surface }} />
          <AppText variant="h1">{title}</AppText>
          {text ? <AppText variant="small">{text}</AppText> : null}
        </View>
        {icon ? <IconTile icon={icon} tone={tone} variant="solid" size={60} rounded /> : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 24, padding: 20, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  copy: { flex: 1, gap: 8 },
});
