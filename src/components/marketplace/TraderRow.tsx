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
};

export function TraderRow({ trader, onPress, right, variant = 'row' }: TraderRowProps) {
  const { colors } = useTheme();
  if (variant === 'card') {
    return (
      <PressableScale
        onPress={onPress}
        scaleTo={0.96}
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.hairline }, elevation(1, colors)]}>
        <Avatar initials={trader.initials} color={trader.color} imageUrl={trader.avatarUrl} size="large" online />
        <View style={styles.nameRow}>
          <AppText variant="h3" numberOfLines={1} align="center">
            {trader.name}
          </AppText>
          <BadgeCheck size={14} color={colors.blue} fill={colors.blueSoft} />
        </View>
        <View style={[styles.rating, { backgroundColor: colors.surface2 }]}>
          <Star size={11} color={colors.yellow} fill={colors.yellow} />
          <AppText variant="caption" color="ink" weight="bold">
            {trader.rating}
          </AppText>
          <AppText variant="caption">· {trader.trades} trades</AppText>
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
        <View style={styles.meta}>
          <Star size={12} color={colors.yellow} fill={colors.yellow} />
          <AppText variant="caption">
            {trader.rating} · {trader.trades} trades
          </AppText>
        </View>
      </View>
      {right ?? (onPress ? <ChevronRight size={18} color={colors.muted} /> : null)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 },
  card: { width: 150, alignItems: 'center', gap: 9, borderWidth: 1, borderRadius: 26, paddingHorizontal: 12, paddingVertical: 18 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: '100%' },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  body: { flex: 1, gap: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
