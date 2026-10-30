import { BadgeCheck, ChevronRight, Star } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Avatar, PressableScale } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import { elevation } from '@/theme';
import type { Trader } from '@/types/models';

type TraderRowProps = {
  trader: Trader;
  onPress?: () => void;
  right?: ReactNode;
  variant?: 'card' | 'row';
  /** Replaces the rating line, e.g. with a location or listing count. */
  subtitle?: string;
  /** Card width override, e.g. to fit an exact number of cards across the screen. */
  width?: number;
};

export function TraderRow({ trader, onPress, right, variant = 'row', subtitle, width }: TraderRowProps) {
  const { colors } = useTheme();
  if (variant === 'card') {
    return (
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`View ${trader.name}`}
        onPress={onPress}
        scaleTo={0.96}
        style={[styles.card, { backgroundColor: colors.surface }, width ? { width } : null, elevation(1, colors)]}>
        <Avatar initials={trader.initials} color={trader.color} imageUrl={trader.avatarUrl} size="medium" online />
        <View style={styles.nameRow}>
          <AppText variant="small" color="ink" weight="bold" numberOfLines={1} style={styles.shrink}>
            {trader.name}
          </AppText>
          <BadgeCheck size={12} color={colors.blue} fill={colors.blueSoft} />
        </View>
        <View style={[styles.rating, { backgroundColor: colors.surface2 }]}>
          {subtitle !== undefined ? (
            <AppText variant="caption" numberOfLines={1}>
              {subtitle}
            </AppText>
          ) : (
            <>
              <Star size={10} color={colors.yellow} fill={colors.yellow} />
              <AppText variant="caption" color="ink" weight="bold">
                {trader.rating}
              </AppText>
              <AppText variant="caption">· {trader.trades} trades</AppText>
            </>
          )}
        </View>
      </PressableScale>
    );
  }
  return (
    <Pressable accessibilityRole={onPress ? 'button' : undefined} disabled={!onPress} onPress={onPress} style={styles.row}>
      <Avatar initials={trader.initials} color={trader.color} imageUrl={trader.avatarUrl} />
      <View style={styles.body}>
        <AppText variant="h3" numberOfLines={1}>
          {trader.name}
        </AppText>
        {subtitle !== undefined ? (
          subtitle ? (
            <AppText variant="caption" numberOfLines={1}>
              {subtitle}
            </AppText>
          ) : null
        ) : (
          <View style={styles.meta}>
            <Star size={12} color={colors.yellow} fill={colors.yellow} />
            <AppText variant="caption">
              {trader.rating} · {trader.trades} trades
            </AppText>
          </View>
        )}
      </View>
      {right ?? (onPress ? <ChevronRight size={18} color={colors.muted} /> : null)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 },
  card: { width: 104, alignItems: 'center', gap: 6, borderRadius: 18, paddingHorizontal: 8, paddingTop: 12, paddingBottom: 10 },
  shrink: { flexShrink: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: '100%' },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3, maxWidth: '100%', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  body: { flex: 1, gap: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
