import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { fonts } from '@/theme';

type ChipProps = { label: string; active?: boolean; onPress?: () => void };

export function Chip({ label, active, onPress }: ChipProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: active ? colors.orange : colors.line, backgroundColor: active ? colors.orange : colors.surface },
      ]}>
      <Text style={[styles.text, { color: active ? colors.white : colors.muted }]}>{label}</Text>
    </Pressable>
  );
}

type ChipRowProps = {
  options: string[];
  value: string;
  onChange: (value: string) => void;
};

/** Horizontally scrolling single-select pill row (categories, status filters). */
export function ChipRow({ options, value, onChange }: ChipRowProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {options.map((option) => (
        <Chip key={option} label={option} active={value === option} onPress={() => onChange(option)} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 36,
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 15,
  },
  text: { fontFamily: fonts.bold, fontSize: 12 },
  row: { gap: 8, paddingHorizontal: 16 },
});
