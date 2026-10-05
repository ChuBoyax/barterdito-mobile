import type { LucideIcon } from 'lucide-react-native';
import { forwardRef, type ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { fonts } from '@/theme';

type TextFieldProps = TextInputProps & {
  label?: string;
  hint?: string;
  error?: string;
  icon?: LucideIcon;
  /** Element rendered inside the field on the right (e.g. GPS button, eye toggle). */
  right?: ReactNode;
  /** Element rendered next to the label (e.g. "Write with AI"). */
  labelAction?: ReactNode;
  showCount?: boolean;
};

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, hint, error, icon: Icon, right, labelAction, showCount, multiline, style, value, maxLength, ...rest },
  ref,
) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      {label ? (
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: colors.ink }]}>{label}</Text>
          {labelAction}
        </View>
      ) : null}
      <View
        style={[
          styles.field,
          multiline && styles.multiline,
          { backgroundColor: colors.surface, borderColor: error ? colors.red : colors.line },
        ]}>
        {Icon ? <Icon size={18} color={colors.muted} /> : null}
        <TextInput
          ref={ref}
          value={value}
          maxLength={maxLength}
          multiline={multiline}
          placeholderTextColor={colors.muted2}
          textAlignVertical={multiline ? 'top' : 'center'}
          style={[styles.input, multiline && styles.inputMultiline, { color: colors.ink }, style]}
          {...rest}
        />
        {right}
      </View>
      {error || hint || (showCount && maxLength) ? (
        <View style={styles.footer}>
          <Text style={[styles.hint, { color: error ? colors.red : colors.muted }]}>{error ?? hint ?? ''}</Text>
          {showCount && maxLength ? (
            <Text style={[styles.hint, { color: colors.muted }]}>
              {value?.length ?? 0}/{maxLength}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 7 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontFamily: fonts.bold, fontSize: 12.5 },
  field: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 13,
  },
  multiline: { minHeight: 110, alignItems: 'flex-start', paddingVertical: 11 },
  input: { flex: 1, fontFamily: fonts.medium, fontSize: 14, paddingVertical: 10 },
  inputMultiline: { minHeight: 88, paddingVertical: 0 },
  footer: { flexDirection: 'row', justifyContent: 'space-between' },
  hint: { fontFamily: fonts.medium, fontSize: 11 },
});
