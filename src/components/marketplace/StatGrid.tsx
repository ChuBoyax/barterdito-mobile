import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';

export type Stat = {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  change?: string;
  onPress?: () => void;
};

type StatGridProps = { stats: Stat[]; variant?: 'tiles' | 'inline' };

export function StatGrid({ stats, variant = 'tiles' }: StatGridProps) {
  const { colors } = useTheme();
  if (variant === 'inline') {
    return (
      <View style={[styles.inline, { borderColor: colors.line }]}>
        {stats.map((stat) => (
          <Pressable key={stat.label} disabled={!stat.onPress} onPress={stat.onPress} style={styles.inlineCell}>
            <AppText variant="h2" align="center">
              {stat.value}
            </AppText>
            <AppText variant="caption" align="center">
              {stat.label}
            </AppText>
          </Pressable>
        ))}
      </View>
    );
  }
  return (
    <View style={styles.tiles}>
      {stats.map(({ label, value, icon: Icon, change }) => (
        <View key={label} style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          {Icon ? (
            <View style={[styles.icon, { backgroundColor: colors.orangeSoft }]}>
              <Icon size={19} color={colors.orange} />
            </View>
          ) : null}
          <AppText variant="caption">{label}</AppText>
          <AppText variant="h1">{value}</AppText>
          {change ? (
            <AppText variant="caption" color="green" weight="bold">
              {change} this month
            </AppText>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { flexBasis: '47%', flexGrow: 1, borderWidth: 1, borderRadius: 17, padding: 14, gap: 4 },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  inline: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: 12 },
  inlineCell: { flex: 1, gap: 2 },
});
