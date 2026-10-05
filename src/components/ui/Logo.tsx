import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { AppText } from './AppText';

export function Logo({ compact = false, size = 42 }: { compact?: boolean; size?: number }) {
  return (
    <View style={styles.row} accessibilityLabel="Barterdito">
      <Image
        source={require('@/assets/images/barterdito-mark.jpg')}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
      {!compact ? (
        <View>
          <AppText variant="h3" weight="extrabold">
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
});
