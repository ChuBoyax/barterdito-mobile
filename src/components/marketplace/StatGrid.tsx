import { TrendingUp, type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, IconTile } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import { elevation, type Tone } from '@/theme';

export type Stat = {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  change?: string;
  tone?: Tone;
  onPress?: () => void;
};

type StatGridProps = { stats: Stat[]; variant?: 'tiles' | 'inline' };

const defaultTones: Tone[] = ['orange', 'blue', 'red', 'green'];

export function StatGrid({ stats, variant = 'tiles' }: StatGridProps) {
  const { colors } = useTheme();
  if (variant === 'inline') {
    return (
      <View style={[styles.inline, { backgroundColor: colors.surface2 }]}>
        {stats.map((stat, index) => (
          <Pressable
            key={stat.label}
            disabled={!stat.onPress}
            onPress={stat.onPress}
            style={[styles.inlineCell, index > 0 && { borderLeftWidth: 1, borderLeftColor: colors.line }]}>
            <AppText variant="h2" align="center">
              {stat.value}
            </AppText>
            <AppText variant="caption" align="center" numberOfLines={1}>
              {stat.label}
            </AppText>
          </Pressable>
        ))}
      </View>
    );
  }
  const third = stats.length === 3;
  return (
    <View style={styles.tiles}>
      {stats.map(({ label, value, icon, change, tone }, index) => (
        <View
          key={label}
          style={[styles.tile, third && styles.tileThird, { backgroundColor: colors.surface, borderColor: colors.line }, elevation(1, colors)]}>
          {icon ? <IconTile icon={icon} size={38} tone={tone ?? defaultTones[index % defaultTones.length]} /> : null}
          <AppText variant={third ? 'h2' : 'h1'} style={styles.value}>
            {value}
          </AppText>
          <AppText variant="caption">{label}</AppText>
          {change ? (
            <View style={[styles.change, { backgroundColor: colors.greenSoft }]}>
              <TrendingUp size={11} color={colors.green} strokeWidth={2.4} />
              <AppText variant="caption" color="green" weight="bold">
                {change}
              </AppText>
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { flexBasis: '46%', flexGrow: 1, borderWidth: 1, borderRadius: 20, padding: 16, gap: 3 },
  tileThird: { flexBasis: '30%', padding: 14 },
  value: { marginTop: 10 },
  change: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2, marginTop: 6 },
  inline: { alignSelf: 'stretch', flexDirection: 'row', borderRadius: 16, paddingVertical: 14 },
  inlineCell: { flex: 1, gap: 2, paddingHorizontal: 2 },
});
