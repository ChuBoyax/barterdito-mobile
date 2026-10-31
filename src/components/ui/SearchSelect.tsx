import { Check, ChevronDown, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { fonts, maxFontScale, neu } from '@/theme';
import { AppText } from './AppText';
import { BottomSheet } from './BottomSheet';
import { TextField } from './TextField';

export type SearchOption = { value: string; label: string };

type SearchSelectProps = {
  label: string;
  /** Text shown in the field: the chosen option's label. */
  value: string;
  selected?: string;
  options: SearchOption[];
  onSelect: (value: string) => void;
  placeholder?: string;
  loading?: boolean;
  disabled?: boolean;
  hint?: string;
  error?: string;
};

const ROW_HEIGHT = 52;
const fold = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Like SelectField, for long lists (countries, cities, barangays): searchable and virtualized. */
export function SearchSelect({ label, value, selected, options, onSelect, placeholder = 'Select…', loading, disabled, hint, error }: SearchSelectProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const visible = useMemo(() => {
    const needle = fold(query.trim());
    return needle ? options.filter((option) => fold(option.label).includes(needle)) : options;
  }, [options, query]);
  const inactive = disabled || loading;

  function close() {
    setOpen(false);
    setQuery('');
  }

  return (
    <View style={styles.wrap}>
      <Text maxFontSizeMultiplier={maxFontScale} style={[styles.label, { color: colors.ink }]}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || placeholder}`}
        accessibilityState={{ disabled: inactive }}
        disabled={inactive}
        onPress={() => setOpen(true)}
        style={[
          styles.field,
          { backgroundColor: colors.background, borderColor: error ? colors.red : 'transparent' },
          neu(colors, 2, true),
          inactive && styles.dimmed,
        ]}>
        <Text maxFontSizeMultiplier={maxFontScale} style={[styles.value, { color: value ? colors.ink : colors.muted2 }]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        {loading ? <ActivityIndicator size="small" color={colors.muted} /> : <ChevronDown size={18} color={colors.muted} />}
      </Pressable>
      {error || hint ? (
        <Text maxFontSizeMultiplier={maxFontScale} style={[styles.note, { color: error ? colors.red : colors.muted }]}>{error ?? hint}</Text>
      ) : null}
      <BottomSheet visible={open} onClose={close} title={label} fill>
        {options.length > 8 ? (
          <TextField icon={Search} value={query} onChangeText={setQuery} placeholder={`Search ${label.toLowerCase()}`} autoCorrect={false} returnKeyType="search" />
        ) : null}
        <FlatList
          data={visible}
          keyExtractor={(option) => option.value}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          initialNumToRender={16}
          getItemLayout={(_, index) => ({ length: ROW_HEIGHT + 6, offset: (ROW_HEIGHT + 6) * index, index })}
          ItemSeparatorComponent={Gap}
          ListEmptyComponent={
            <AppText variant="small" align="center" style={styles.empty}>
              No matches for “{query.trim()}”.
            </AppText>
          }
          renderItem={({ item: option }) => {
            const active = option.value === selected;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => {
                  onSelect(option.value);
                  close();
                }}
                style={[styles.option, { backgroundColor: active ? colors.orangeSoft : colors.surface }]}>
                <Text maxFontSizeMultiplier={maxFontScale} numberOfLines={1} style={[styles.optionText, { color: active ? colors.orange : colors.ink }]}>
                  {option.label}
                </Text>
                {active ? <Check size={18} color={colors.orange} /> : null}
              </Pressable>
            );
          }}
        />
      </BottomSheet>
    </View>
  );
}

const Gap = () => <View style={styles.gap} />;

const styles = StyleSheet.create({
  wrap: { gap: 7 },
  label: { fontFamily: fonts.bold, fontSize: 12.5 },
  field: { minHeight: 48, flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 13, gap: 8 },
  dimmed: { opacity: 0.55 },
  value: { flex: 1, fontFamily: fonts.medium, fontSize: 14 },
  note: { fontFamily: fonts.medium, fontSize: 11.5 },
  option: { height: ROW_HEIGHT, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderRadius: 12, paddingHorizontal: 14 },
  optionText: { flex: 1, fontFamily: fonts.semibold, fontSize: 14 },
  gap: { height: 6 },
  empty: { paddingVertical: 24 },
});
