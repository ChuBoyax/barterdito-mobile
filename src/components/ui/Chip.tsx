import { ScrollView, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { fonts, maxFontScale } from '@/theme';
import { PressableScale } from './PressableScale';

type ChipProps = { label: string; active?: boolean; onPress?: () => void };

export function Chip({ label, active, onPress }: ChipProps) {
  const { colors } = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      scaleTo={0.94}
      style={[
        styles.chip,
        { backgroundColor: active ? colors.orange : colors.surface, borderColor: active ? colors.orange : colors.line },
      ]}>
      <Text maxFontSizeMultiplier={maxFontScale} style={[styles.text, { color: active ? colors.onPrimary : colors.muted }]}>{label}</Text>
    </PressableScale>
  );
}

type ChipRowProps = {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  inset?: number;
};

export function ChipRow({ options, value, onChange, inset = 20 }: ChipRowProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.row, { paddingHorizontal: inset }]}>
      {options.map((option) => (
        <Chip key={option} label={option} active={value === option} onPress={() => onChange(option)} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: { height: 36, justifyContent: 'center', borderRadius: 999, borderWidth: 1, paddingHorizontal: 15 },
  text: { fontFamily: fonts.bold, fontSize: 12.5 },
  row: { gap: 8 },
});
