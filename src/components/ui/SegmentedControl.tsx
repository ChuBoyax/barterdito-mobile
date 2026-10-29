import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

import { useTheme } from '@/providers/ThemeProvider';
import { fonts, maxFontScale, neu } from '@/theme';

export type Segment<T extends string> = { value: T; label: string; count?: number };

type SegmentedControlProps<T extends string> = {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({ segments, value, onChange }: SegmentedControlProps<T>) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const index = Math.max(0, segments.findIndex((segment) => segment.value === value));

  const segmentWidth = width ? (width - 10) / segments.length : 0;

  const indicatorStyle = useAnimatedStyle(() => ({
    width: segmentWidth,
    transform: [{ translateX: withSpring(index * segmentWidth, { damping: 20, stiffness: 220 }) }],
  }));

  return (
    <View
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      style={[styles.wrap, { backgroundColor: colors.background }, neu(colors, 2, true)]}>
      {width ? (
        <Animated.View style={[styles.indicator, { backgroundColor: colors.surface }, neu(colors, 1), indicatorStyle]} />
      ) : null}
      {segments.map((segment) => {
        const active = segment.value === value;
        return (
          <Pressable
            key={segment.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(segment.value)}
            style={styles.segment}>
            <Text maxFontSizeMultiplier={maxFontScale} style={[styles.label, { color: active ? colors.ink : colors.muted }]}>{segment.label}</Text>
            {segment.count !== undefined ? (
              <View style={[styles.count, { backgroundColor: active ? colors.orange : colors.surface2 }]}>
                <Text maxFontSizeMultiplier={maxFontScale} style={[styles.countText, { color: active ? colors.white : colors.muted }]}>{segment.count}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', borderRadius: 999, padding: 5 },
  indicator: { position: 'absolute', top: 5, bottom: 5, left: 5, borderRadius: 999 },
  segment: { flex: 1, height: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  label: { fontFamily: fonts.bold, fontSize: 13 },
  count: { minWidth: 20, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1, alignItems: 'center' },
  countText: { fontFamily: fonts.extrabold, fontSize: 10 },
});
