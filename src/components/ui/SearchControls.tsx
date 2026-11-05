import { Search, X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { useTheme } from '@/providers/ThemeProvider';
import { fonts, maxFontScale, neu } from '@/theme';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { PressableScale } from './PressableScale';

type SearchFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  /** The tall pill with a raised search button, used on Browse. */
  hero?: boolean;
  /** Sits inside the field, at its right edge. */
  right?: ReactNode;
};

/** A search box pressed into the surface. */
export function SearchField({ value, onChangeText, placeholder = 'Search', maxLength = 120, hero, right }: SearchFieldProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.field, hero && styles.fieldHero, { backgroundColor: colors.background }, neu(colors, 1, true)]}>
      {hero ? (
        <View style={[styles.heroIcon, { backgroundColor: colors.surface }, neu(colors, 1)]}>
          <Search size={20} color={colors.orange} strokeWidth={2.25} />
        </View>
      ) : (
        <Search size={17} color={colors.muted} />
      )}
      <TextInput
        // A larger system font would push the placeholder under the Filter button.
        maxFontSizeMultiplier={hero ? 1.15 : maxFontScale}
        numberOfLines={1}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        selectionColor={colors.orange}
        maxLength={maxLength}
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel={placeholder}
        style={[styles.input, hero && styles.inputHero, { color: colors.ink }]}
      />
      {value ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={8} onPress={() => onChangeText('')} style={styles.clear}>
          <X size={17} color={colors.muted} strokeWidth={2.5} />
        </Pressable>
      ) : null}
      {right}
    </View>
  );
}

/** The "Filter" button: two sliders, a label, and how many filters are on. */
export function FilterButton({ count, onPress, compact }: { count: number; onPress: () => void; compact?: boolean }) {
  const { colors } = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={count ? `Filter, ${count} active` : 'Filter'}
      onPress={onPress}
      scaleTo={0.94}
      style={[styles.filter, compact ? styles.filterCompact : styles.filterTall, { backgroundColor: colors.surface }, neu(colors, 1)]}>
      <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
        <Path d="M3 7h16M3 15h16" stroke={colors.muted} strokeWidth={2} strokeLinecap="round" />
        <Circle cx={14.5} cy={7} r={3} fill={colors.orange} stroke={colors.surface} strokeWidth={2} />
        <Circle cx={7.5} cy={15} r={3} fill={colors.orange} stroke={colors.surface} strokeWidth={2} />
      </Svg>
      <Text maxFontSizeMultiplier={maxFontScale} style={[styles.filterLabel, { color: colors.ink }]}>
        Filter
      </Text>
      <View style={[styles.count, { backgroundColor: count ? colors.orange : colors.surface2, borderColor: colors.background }]}>
        <Text maxFontSizeMultiplier={1} style={[styles.countText, { color: count ? colors.onPrimary : colors.muted }]}>
          {count}
        </Text>
      </View>
    </PressableScale>
  );
}

type FilterSheetFrameProps = { visible: boolean; onClose: () => void; title: string; count: number; onReset: () => void; children: ReactNode };

/** The sheet a FilterButton opens. */
export function FilterMenuSheet({ visible, onClose, title, count, onReset, children }: FilterSheetFrameProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      {children}
      <Button label="Reset filters" variant="ghost" disabled={!count} onPress={onReset} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  field: { flex: 1, minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 16, paddingHorizontal: 14 },
  fieldHero: { minHeight: 52, borderRadius: 999, gap: 8, padding: 4, paddingRight: 6 },
  heroIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, minWidth: 0, fontFamily: fonts.medium, fontSize: 14, paddingVertical: 8 },
  inputHero: { fontSize: 14, minHeight: 44, paddingHorizontal: 0 },
  clear: { width: 32, height: 44, alignItems: 'center', justifyContent: 'center' },
  filter: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 16, paddingLeft: 13, paddingRight: 16 },
  filterTall: { height: 50 },
  filterCompact: { height: 42, gap: 6, paddingLeft: 10, paddingRight: 12 },
  filterLabel: { fontFamily: fonts.bold, fontSize: 13 },
  count: { position: 'absolute', top: -6, right: -6, minWidth: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  countText: { fontFamily: fonts.bold, fontSize: 10 },
});
