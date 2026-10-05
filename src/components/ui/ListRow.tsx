import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { useTheme } from '@/providers/ThemeProvider';
import type { Tone } from '@/theme';
import { AppText } from './AppText';
import { IconTile } from './IconTile';

type ListRowProps = {
  icon?: LucideIcon;
  iconTone?: Tone;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  toggle?: { value: boolean; onChange: (value: boolean) => void };
  right?: ReactNode;
  showChevron?: boolean;
};

export function ListRow({ icon, iconTone = 'orange', title, subtitle, onPress, toggle, right, showChevron = true }: ListRowProps) {
  const { colors } = useTheme();
  const handlePress = toggle ? () => toggle.onChange(!toggle.value) : onPress;
  return (
    <Pressable
      accessibilityRole={toggle ? 'switch' : 'button'}
      accessibilityState={toggle ? { checked: toggle.value } : undefined}
      onPress={handlePress}
      style={({ pressed }) => [styles.row, pressed && handlePress && { opacity: 0.6 }]}>
      {icon ? <IconTile icon={icon} tone={iconTone} size={42} /> : null}
      <View style={styles.body}>
        <AppText variant="h3">{title}</AppText>
        {subtitle ? <AppText variant="caption">{subtitle}</AppText> : null}
      </View>
      {right}
      {toggle ? (
        <Switch
          value={toggle.value}
          onValueChange={toggle.onChange}
          trackColor={{ true: colors.orange, false: colors.line }}
          thumbColor={colors.white}
          ios_backgroundColor={colors.line}
        />
      ) : showChevron && onPress ? (
        <View style={[styles.chevron, { backgroundColor: colors.surface2 }]}>
          <ChevronRight size={16} color={colors.muted} strokeWidth={2.4} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 10 },
  body: { flex: 1, gap: 1 },
  chevron: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
