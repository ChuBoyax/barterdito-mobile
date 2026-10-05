import { Check, ChevronDown } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { fonts, maxFontScale } from '@/theme';
import { BottomSheet } from './BottomSheet';

type SelectFieldProps = {
  label?: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
};

/** Native-friendly replacement for the web `<select>`: opens a bottom sheet of options. */
export function SelectField({ label, value, options, onChange, placeholder = 'Select…' }: SelectFieldProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.wrap}>
      {label ? <Text maxFontSizeMultiplier={maxFontScale} style={[styles.label, { color: colors.ink }]}>{label}</Text> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label ?? placeholder}
        onPress={() => setOpen(true)}
        style={[styles.field, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        <Text maxFontSizeMultiplier={maxFontScale} style={[styles.value, { color: value ? colors.ink : colors.muted2 }]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <ChevronDown size={18} color={colors.muted} />
      </Pressable>
      <BottomSheet visible={open} onClose={() => setOpen(false)} title={label ?? placeholder}>
        {options.map((option) => {
          const active = option === value;
          return (
            <Pressable
              key={option}
              onPress={() => {
                onChange(option);
                setOpen(false);
              }}
              style={[styles.option, { backgroundColor: active ? colors.orangeSoft : colors.surface2 }]}>
              <Text maxFontSizeMultiplier={maxFontScale} style={[styles.optionText, { color: active ? colors.orange : colors.ink }]}>{option}</Text>
              {active ? <Check size={18} color={colors.orange} /> : null}
            </Pressable>
          );
        })}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 7 },
  label: { fontFamily: fonts.bold, fontSize: 12.5 },
  field: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 13,
    gap: 8,
  },
  value: { flex: 1, fontFamily: fonts.medium, fontSize: 14 },
  option: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  optionText: { fontFamily: fonts.semibold, fontSize: 14 },
});
