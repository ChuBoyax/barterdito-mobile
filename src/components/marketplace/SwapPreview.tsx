import { Image } from 'expo-image';
import { ArrowRight } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import type { Item } from '@/types/models';

type SwapPreviewProps = {
  theirs: Item;
  yours: Item;
  theirsLabel?: string;
  yoursLabel?: string;
};

export function SwapPreview({ theirs, yours, theirsLabel = 'Their item', yoursLabel = 'Your item' }: SwapPreviewProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: colors.surface2 }]}>
      <SwapSide item={theirs} label={theirsLabel} />
      <View style={[styles.icon, { backgroundColor: colors.orange }]}>
        <ArrowRight size={18} color="#fff" />
      </View>
      <SwapSide item={yours} label={yoursLabel} />
    </View>
  );
}

function SwapSide({ item, label }: { item: Item; label: string }) {
  return (
    <View style={styles.side}>
      <Image source={item.image} style={styles.image} contentFit="cover" />
      <AppText variant="caption">{label}</AppText>
      <AppText variant="small" weight="bold" color="ink" numberOfLines={2} align="center">
        {item.title}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 16, padding: 12 },
  side: { flex: 1, alignItems: 'center', gap: 4 },
  image: { width: 64, height: 64, borderRadius: 14, marginBottom: 2 },
  icon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});
