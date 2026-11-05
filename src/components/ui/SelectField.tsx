import { Check, ChevronDown } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { fonts, maxFontScale, neu } from '@/theme';
import { BottomSheet } from './BottomSheet';

type SelectFieldProps = {
  label?: string;
  /** Marks the label with a red asterisk; validation stays with the caller. */
  required?: boolean;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  /** Thin borders instead of shadows, on the field and its option sheet. */
  flat?: boolean;
};


export function SelectField({ label, required, value, options, onChange, placeholder = 'Select…', error, flat }: SelectFieldProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.wrap}>
      {label ? (
        <Text maxFontSizeMultiplier={maxFontScale} style={[styles.label, { color: colors.ink }]}>
          {label}
          {required ? <Text style={{ color: colors.red }}> *</Text> : null}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label ?? placeholder}
        onPress={() => setOpen(true)}
        style={[styles.field, { backgroundColor: colors.background, borderColor: error ? colors.red : flat ? colors.line : 'transparent' }, !flat && neu(colors, 2, true)]}>
        <Text maxFontSizeMultiplier={maxFontScale} style={[styles.value, { color: value ? colors.ink : colors.muted2 }]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <ChevronDown size={18} color={colors.muted} />
      </Pressable>
      {error ? <Text maxFontSizeMultiplier={maxFontScale} style={[styles.error, { color: colors.red }]}>{error}</Text> : null}
      <BottomSheet visible={open} flat={flat} onClose={() => setOpen(false)} title={label ?? placeholder}>
        {options.map((option) => {
          const active = option === value;
          return (
            <Pressable
              key={option}
              onPress={() => {
                onChange(option);
                setOpen(false);
              }}
              style={[
                styles.option,
                { backgroundColor: active ? colors.orangeSoft : colors.surface },
                flat ? [styles.flatOption, { borderColor: active ? colors.orange : colors.line }] : neu(colors, 1, active),
              ]}>
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
  flatOption: { borderWidth: 1 },
  optionText: { fontFamily: fonts.semibold, fontSize: 14 },
  error: { fontFamily: fonts.semibold, fontSize: 12 },
});
