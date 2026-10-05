import type { LucideIcon } from 'lucide-react-native';
import { forwardRef, useState, type ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { fonts, maxFontScale } from '@/theme';

type TextFieldProps = TextInputProps & {
  label?: string;
  hint?: string;
  error?: string;
  icon?: LucideIcon;
  right?: ReactNode;
  labelAction?: ReactNode;
  showCount?: boolean;
};

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, hint, error, icon: Icon, right, labelAction, showCount, multiline, style, value, maxLength, onFocus, onBlur, ...rest },
  ref,
) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.red : focused ? colors.orange : colors.hairline;
  return (
    <View style={styles.wrap}>
      {label ? (
        <View style={styles.labelRow}>
          <Text maxFontSizeMultiplier={maxFontScale} style={[styles.label, { color: colors.ink }]}>{label}</Text>
          {labelAction}
        </View>
      ) : null}
      <View
        style={[
          styles.field,
          multiline && styles.multiline,
          { backgroundColor: focused ? colors.surface : colors.surface2, borderColor },
          focused && { shadowColor: colors.orange, shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } },
        ]}>
        {Icon ? <Icon size={18} color={focused ? colors.orange : colors.muted} strokeWidth={2.1} /> : null}
        <TextInput maxFontSizeMultiplier={maxFontScale}
          ref={ref}
          value={value}
          maxLength={maxLength}
          multiline={multiline}
          placeholderTextColor={colors.muted2}
          selectionColor={colors.orange}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={[styles.input, multiline && styles.inputMultiline, { color: colors.ink }, style]}
          {...rest}
        />
        {right}
      </View>
      {error || hint || (showCount && maxLength) ? (
        <View style={styles.footer}>
          <Text maxFontSizeMultiplier={maxFontScale} style={[styles.hint, { color: error ? colors.red : colors.muted }]}>{error ?? hint ?? ''}</Text>
          {showCount && maxLength ? (
            <Text maxFontSizeMultiplier={maxFontScale} style={[styles.hint, { color: colors.muted }]}>
              {value?.length ?? 0}/{maxLength}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontFamily: fonts.bold, fontSize: 13, letterSpacing: -0.1 },
  field: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 15 },
  multiline: { minHeight: 120, alignItems: 'flex-start', paddingVertical: 13 },
  input: { flex: 1, fontFamily: fonts.medium, fontSize: 14.5, paddingVertical: 12 },
  inputMultiline: { minHeight: 92, paddingVertical: 0 },
  footer: { flexDirection: 'row', justifyContent: 'space-between' },
  hint: { fontFamily: fonts.medium, fontSize: 11.5 },
});
