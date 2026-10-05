import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { fonts } from '@/theme';

export type Segment<T extends string> = { value: T; label: string; count?: number };

type SegmentedControlProps<T extends string> = {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({ segments, value, onChange }: SegmentedControlProps<T>) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: colors.surface2 }]}>
      {segments.map((segment) => {
        const active = segment.value === value;
        return (
          <Pressable
            key={segment.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(segment.value)}
            style={[styles.segment, active && [styles.active, { backgroundColor: colors.surface }]]}>
            <Text style={[styles.label, { color: active ? colors.ink : colors.muted }]}>{segment.label}</Text>
            {segment.count !== undefined ? (
              <View style={[styles.count, { backgroundColor: active ? colors.orange : colors.line }]}>
                <Text style={[styles.countText, { color: active ? colors.white : colors.muted }]}>{segment.count}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', borderRadius: 13, padding: 4, gap: 4 },
  segment: {
    flex: 1,
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
  },
  active: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  label: { fontFamily: fonts.bold, fontSize: 12.5 },
  count: { minWidth: 20, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1, alignItems: 'center' },
  countText: { fontFamily: fonts.extrabold, fontSize: 10 },
});
