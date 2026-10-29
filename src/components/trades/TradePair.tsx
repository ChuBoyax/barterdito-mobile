import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ArrowRightLeft, Package } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppText, PressableScale } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import type { OfferListing } from '@/types/trades';

type Side = { item: OfferListing; label: string };

/** Two traded items side by side; a removed listing keeps its saved title. */
export function TradePair({ left, right }: { left: Side; right: Side }) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <PairSide {...left} />
      <View style={[styles.icon, { backgroundColor: colors.orange, borderColor: colors.surface }]}>
        <ArrowRightLeft size={16} color={colors.onPrimary} strokeWidth={2.4} />
      </View>
      <PairSide {...right} />
    </View>
  );
}

function PairSide({ item, label }: Side) {
  const { colors } = useTheme();
  return (
    <PressableScale
      accessibilityRole={item.id ? 'button' : undefined}
      accessibilityLabel={`${label}: ${item.title}`}
      disabled={!item.id}
      onPress={() => item.id && router.push(`/items/${item.id}`)}
      scaleTo={0.97}
      style={[styles.side, { backgroundColor: colors.surface2 }]}>
      {item.imageUrl ? (
        <Image source={item.imageUrl} cachePolicy="memory-disk" style={styles.image} contentFit="cover" />
      ) : (
        <View style={[styles.image, styles.placeholder, { backgroundColor: colors.line }]}>
          <Package size={22} color={colors.muted} />
        </View>
      )}
      <AppText variant="caption" numberOfLines={1}>
        {label}
      </AppText>
      <AppText variant="small" color="ink" weight="bold" numberOfLines={2}>
        {item.title}
      </AppText>
      {!item.id ? <AppText variant="caption">Listing removed</AppText> : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center' },
  side: { flex: 1, gap: 3, borderRadius: 18, padding: 8 },
  image: { width: '100%', aspectRatio: 1.3, borderRadius: 12, marginBottom: 4 },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  icon: { width: 34, height: 34, borderRadius: 17, borderWidth: 3, alignItems: 'center', justifyContent: 'center', marginHorizontal: -10, zIndex: 1 },
});
