import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/ui';
import { tabs } from '@/navigation/tabs';
import { useTheme } from '@/providers';
import { fonts } from '@/theme';

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { backgroundColor: colors.surface, borderTopColor: colors.line, paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route, index) => {
        const tab = tabs.find((entry) => entry.name === route.name);
        if (!tab) return null;
        const focused = state.index === index;
        const color = focused ? colors.orange : colors.muted;
        const Icon = tab.icon;
        return (
          <PressableScale
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={tab.title}
            scaleTo={0.92}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
            }}
            style={styles.tab}>
            <View style={[styles.indicator, { backgroundColor: focused ? colors.orange : 'transparent' }]} />
            <View style={[styles.iconWrap, focused && { backgroundColor: colors.orangeSoft }]}>
              <Icon size={21} color={color} strokeWidth={focused ? 2.4 : 2} />
              {tab.badge ? (
                <View style={[styles.badge, { backgroundColor: colors.orange, borderColor: colors.surface }]}>
                  <Text style={[styles.badgeText, { color: colors.onPrimary }]}>{tab.badge}</Text>
                </View>
              ) : null}
            </View>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
              style={[styles.label, { color, fontFamily: focused ? fonts.bold : fonts.medium }]}>
              {tab.title}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 6, paddingHorizontal: 4 },
  tab: { flex: 1, alignItems: 'center', gap: 3, minWidth: 0 },
  indicator: { position: 'absolute', top: -6, width: 22, height: 3, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
  iconWrap: { width: 52, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11, maxWidth: '100%' },
  badge: { position: 'absolute', top: -3, right: 6, minWidth: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { fontFamily: fonts.extrabold, fontSize: 9 },
});
