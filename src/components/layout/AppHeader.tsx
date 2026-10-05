import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui';
import { HeaderActions } from './HeaderActions';

type AppHeaderProps = {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  leading?: ReactNode;
  actions?: ReactNode;
};

export function AppHeader({ title, eyebrow, subtitle, leading, actions }: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 6 }]}>
      <View style={styles.row}>
        {leading}
        <View style={styles.flex}>
          {eyebrow ? <AppText variant="eyebrow">{eyebrow}</AppText> : null}
          <AppText variant="hero" numberOfLines={1}>
            {title}
          </AppText>
        </View>
        {actions ?? <HeaderActions />}
      </View>
      {subtitle ? (
        <AppText variant="small" style={styles.subtitle}>
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6, paddingBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
  subtitle: { maxWidth: 320 },
});
