import { Image } from 'expo-image';
import { ArrowRightLeft } from 'lucide-react-native';
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
    <View style={styles.wrap}>
      <SwapSide item={theirs} label={theirsLabel} />
      <View style={[styles.icon, { backgroundColor: colors.orange, borderColor: colors.surface }]}>
        <ArrowRightLeft size={17} color={colors.onPrimary} strokeWidth={2.4} />
      </View>
      <SwapSide item={yours} label={yoursLabel} />
    </View>
  );
}

function SwapSide({ item, label }: { item: Item; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.side, { backgroundColor: colors.surface2 }]}>
      <Image source={item.image} style={styles.image} contentFit="cover" />
      <View style={styles.text}>
        <AppText variant="caption">{label}</AppText>
        <AppText variant="small" color="ink" weight="bold" numberOfLines={1}>
          {item.title}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center' },
  side: { flex: 1, borderRadius: 18, padding: 8, gap: 8 },
  image: { width: '100%', aspectRatio: 1.25, borderRadius: 13 },
  text: { paddingHorizontal: 4, paddingBottom: 4, gap: 1 },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginHorizontal: -12, zIndex: 2, borderWidth: 3 },
});
