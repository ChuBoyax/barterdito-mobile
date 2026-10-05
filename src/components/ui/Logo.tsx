import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { AppText } from './AppText';

export function Logo({ compact = false, size = 40 }: { compact?: boolean; size?: number }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row} accessibilityLabel="Barterdito">
      <View style={[styles.mark, { width: size + 6, height: size + 6, borderRadius: (size + 6) / 2, borderColor: colors.orangeSoft }]}>
        <Image source={require('@/assets/images/barterdito-mark.jpg')} style={{ width: size, height: size, borderRadius: size / 2 }} />
      </View>
      {!compact ? (
        <View>
          <AppText variant="h2" style={styles.word}>
            Barterdito
          </AppText>
          <AppText variant="caption">Trade more. Waste less.</AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  word: { letterSpacing: -0.6 },
});
