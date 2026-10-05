import { ChevronRight, Star } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Avatar } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import type { Trader } from '@/types/models';

type TraderRowProps = {
  trader: Trader;
  onPress?: () => void;
  right?: ReactNode;
  variant?: 'card' | 'row';
};

export function TraderRow({ trader, onPress, right, variant = 'row' }: TraderRowProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={[
        styles.row,
        variant === 'card' && [styles.card, { backgroundColor: colors.surface, borderColor: colors.line }],
      ]}>
      <Avatar
        initials={trader.initials}
        color={trader.color}
        imageUrl={trader.avatarUrl}
        size={variant === 'card' ? 'large' : 'medium'}
      />
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  card: { width: 250, borderWidth: 1, borderRadius: 18, padding: 14 },
  body: { flex: 1, gap: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
