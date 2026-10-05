import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { AppText } from './AppText';

type ListRowProps = {
  icon?: LucideIcon;
  iconColor?: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  /** Renders a switch instead of a chevron. */
  toggle?: { value: boolean; onChange: (value: boolean) => void };
  right?: ReactNode;
  showChevron?: boolean;
};

/** Icon + title + subtitle row used in settings, menus and action lists. */
export function ListRow({ icon: Icon, iconColor, title, subtitle, onPress, toggle, right, showChevron = true }: ListRowProps) {
  const { colors } = useTheme();
  const handlePress = toggle ? () => toggle.onChange(!toggle.value) : onPress;
  return (
    <Pressable
      accessibilityRole={toggle ? 'switch' : 'button'}
      accessibilityState={toggle ? { checked: toggle.value } : undefined}
      onPress={handlePress}
      style={({ pressed }) => [styles.row, pressed && handlePress && { opacity: 0.7 }]}>
      {Icon ? (
        <View style={[styles.icon, { backgroundColor: colors.orangeSoft }]}>
          <Icon size={19} color={iconColor ?? colors.orange} />
        </View>
      ) : null}
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
        />
      ) : showChevron && onPress ? (
        <ChevronRight size={18} color={colors.muted} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 1 },
});
