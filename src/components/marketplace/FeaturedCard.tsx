import { Image } from 'expo-image';
import { ArrowRightLeft, MapPin } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Badge, PhotoScrim, PressableScale } from '@/components/ui';
import { useResponsive } from '@/hooks/useResponsive';
import { useTheme } from '@/providers/ThemeProvider';
import { fonts, maxFontScale } from '@/theme';
import type { Item } from '@/types/models';

export function featuredCardWidth(screenWidth: number, isTablet: boolean) {
  return isTablet ? 220 : Math.round(Math.min(184, screenWidth * 0.5));
}

export function FeaturedCard({ item, onPress }: { item: Item; onPress: () => void }) {
  const { colors } = useTheme();
  const { width, isTablet } = useResponsive();
  const cardWidth = featuredCardWidth(width, isTablet);
  return (
    <PressableScale accessibilityRole="button" accessibilityLabel={item.title} onPress={onPress} scaleTo={0.97} style={[styles.card, { width: cardWidth, height: Math.round(cardWidth * 1.22) }]}>
      <Image source={item.image} style={StyleSheet.absoluteFill} contentFit="cover" />
      <PhotoScrim />
      <View style={styles.top}>
        <Badge label={item.category} tone="glass" />
      </View>
      <View style={styles.body}>
        <Text maxFontSizeMultiplier={maxFontScale} style={[styles.title, { color: colors.onPhoto }]} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.row}>
          <MapPin size={12} color={colors.onPhoto} />
          <Text maxFontSizeMultiplier={maxFontScale} style={[styles.meta, { color: colors.onPhoto }]}>{item.location}</Text>
        </View>
        <View style={[styles.wants, { backgroundColor: colors.glass }]}>
          <ArrowRightLeft size={12} color={colors.orange} strokeWidth={2.4} />
          <Text maxFontSizeMultiplier={maxFontScale} style={[styles.wantsText, { color: colors.ink }]} numberOfLines={1}>
            {item.wanted}
          </Text>
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, overflow: 'hidden', justifyContent: 'space-between' },
  top: { padding: 10 },
  body: { padding: 12, gap: 5 },
  title: { fontFamily: fonts.extrabold, fontSize: 16, lineHeight: 20, letterSpacing: -0.3 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { fontFamily: fonts.medium, fontSize: 11.5, opacity: 0.9 },
  wants: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, marginTop: 2 },
  wantsText: { flex: 1, fontFamily: fonts.semibold, fontSize: 11 },
});
