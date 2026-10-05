import { Star } from 'lucide-react-native';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/providers/ThemeProvider';

type StarsProps = {
  rating: number;
  size?: number;
};

export const Stars = memo(function Stars({ rating, size = 12 }: StarsProps) {
  const { colors } = useTheme();
  const filled = Math.round(rating);
  return (
    <View style={styles.row} accessibilityLabel={`${rating.toFixed(1)} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star key={index} size={size} color={colors.yellow} fill={index < filled ? colors.yellow : 'transparent'} />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});
