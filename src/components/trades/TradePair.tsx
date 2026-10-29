import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ArrowLeftRight, PackageX } from 'lucide-react-native';
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppText, PhotoScrim, PressableScale } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import { fonts, maxFontScale, neu } from '@/theme';
import type { OfferListing } from '@/types/trades';

type Side = { item: OfferListing; label: string };

/** Two traded items as photo tiles with a raised swap badge between them. */
export const TradePair = memo(function TradePair({ left, right }: { left: Side; right: Side }) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <PairSide {...left} />
      <PairSide {...right} />
      <View pointerEvents="none" style={styles.center}>
        <View style={[styles.swap, { backgroundColor: colors.surface }, neu(colors, 2)]}>
          <View style={[styles.swapInner, { backgroundColor: colors.orange }]}>
            <ArrowLeftRight size={16} color={colors.onPrimary} strokeWidth={2.6} />
          </View>
        </View>
      </View>
    </View>
  );
});

function PairSide({ item, label }: Side) {
  const { colors } = useTheme();
  const removed = !item.id;
  return (
    <PressableScale
      accessibilityRole={removed ? undefined : 'button'}
      accessibilityLabel={`${label}: ${item.title}`}
      disabled={removed}
      onPress={() => item.id && router.push(`/items/${item.id}`)}
      scaleTo={0.97}
      style={[styles.side, { backgroundColor: colors.surface }, neu(colors, 1)]}>
      <View style={[styles.photo, { backgroundColor: colors.surface2 }]}>
        {item.imageUrl ? (
          <>
            <Image source={item.imageUrl} cachePolicy="memory-disk" style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
            <PhotoScrim />
          </>
        ) : (
          <View style={styles.placeholder}>
            <PackageX size={26} color={colors.muted} />
          </View>
        )}
        <View style={[styles.chip, { backgroundColor: colors.glass }]}>
          <Text maxFontSizeMultiplier={maxFontScale} numberOfLines={1} style={[styles.chipText, { color: colors.ink }]}>
            {label}
          </Text>
        </View>
        {item.imageUrl ? (
          <Text maxFontSizeMultiplier={maxFontScale} numberOfLines={2} style={[styles.overlayTitle, { color: colors.onPhoto }]}>
            {item.title}
          </Text>
        ) : null}
      </View>
      {!item.imageUrl ? (
        <AppText variant="small" color="ink" weight="bold" numberOfLines={2} style={styles.title}>
          {item.title}
        </AppText>
      ) : null}
      {removed ? (
        <AppText variant="caption" style={styles.title}>
          Listing removed
        </AppText>
      ) : null}
    </PressableScale>
  );
}

const SWAP = 44;

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: 12 },
  side: { flex: 1, minWidth: 0, borderRadius: 22, padding: 6, gap: 6 },
  photo: { width: '100%', aspectRatio: 1, borderRadius: 17, overflow: 'hidden', justifyContent: 'space-between' },
  placeholder: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  chip: { alignSelf: 'flex-start', maxWidth: '88%', margin: 8, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  chipText: { fontFamily: fonts.bold, fontSize: 10.5 },
  overlayTitle: { fontFamily: fonts.extrabold, fontSize: 14, lineHeight: 18, margin: 10 },
  title: { paddingHorizontal: 6, paddingBottom: 4 },
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  swap: { width: SWAP, height: SWAP, borderRadius: SWAP / 2, alignItems: 'center', justifyContent: 'center' },
  swapInner: { width: SWAP - 10, height: SWAP - 10, borderRadius: (SWAP - 10) / 2, alignItems: 'center', justifyContent: 'center' },
});
