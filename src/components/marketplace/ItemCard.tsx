import { Image } from 'expo-image';
import { ArrowRightLeft, Bookmark, Flame, Heart, MapPin } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppText, Glass, PhotoScrim, PressableScale, Skeleton } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import { fonts, maxFontScale } from '@/theme';
import type { Item } from '@/types/models';

type ItemCardProps = {
  item: Item;
  saved: boolean;
  hearted?: boolean;
  onOpen: (id: string) => void;
  onSave: (id: string) => void;
  onHeart: (id: string) => void;
};

// Memoized so toggling one card (or any parent re-render) doesn't re-render the whole grid.
export const ItemCard = memo(function ItemCard({ item, saved, hearted, onOpen: openItem, onSave: saveItem, onHeart: heartItem }: ItemCardProps) {
  const { colors } = useTheme();
  const onOpen = () => openItem(item.id);
  const onSave = () => saveItem(item.id);
  const onHeart = () => heartItem(item.id);
  return (
    <View style={styles.card}>
      <PressableScale accessibilityRole="button" accessibilityLabel={`View ${item.title}`} onPress={onOpen} scaleTo={0.97} style={styles.media}>
        <Image source={item.image} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} recyclingKey={item.id} />
        <PhotoScrim />
        <View style={styles.topRow}>
          {item.hot ? (
            <View style={[styles.hot, { backgroundColor: colors.orange }]}>
              <Flame size={11} color={colors.onPrimary} fill={colors.onPrimary} />
              <Text maxFontSizeMultiplier={maxFontScale} style={[styles.hotText, { color: colors.onPrimary }]}>Hot</Text>
            </View>
          ) : (
            <View />
          )}
          <Pressable accessibilityLabel="Heart item" hitSlop={6} onPress={onHeart}>
            <Glass style={styles.heart} intensity={30}>
              <Heart size={15} color={hearted ? colors.red : colors.ink} fill={hearted ? colors.red : 'none'} strokeWidth={2.2} />
            </Glass>
          </Pressable>
        </View>
        <View style={styles.bottomRow}>
          <View style={styles.inline}>
            <MapPin size={11} color={colors.onPhoto} strokeWidth={2.4} />
            <Text maxFontSizeMultiplier={maxFontScale} style={[styles.photoText, { color: colors.onPhoto }]} numberOfLines={1}>
              {item.location}
            </Text>
          </View>
          <View style={styles.inlineEnd}>
            <Heart size={11} color={colors.onPhoto} fill={colors.onPhoto} />
            <Text maxFontSizeMultiplier={maxFontScale} style={[styles.photoText, { color: colors.onPhoto }]}>{item.hearts}</Text>
          </View>
        </View>
      </PressableScale>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Pressable onPress={onOpen} style={styles.flex}>
            <AppText variant="h3" numberOfLines={1}>
              {item.title}
            </AppText>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={saved ? 'Remove from saved items' : 'Save item'} hitSlop={8} onPress={onSave}>
            <Bookmark size={17} color={saved ? colors.orange : colors.muted} fill={saved ? colors.orange : 'none'} strokeWidth={2.1} />
          </Pressable>
        </View>
        <View style={styles.inline}>
          <ArrowRightLeft size={11} color={colors.orange} strokeWidth={2.4} />
          <AppText variant="caption" color="orange" weight="semibold" numberOfLines={1} style={styles.flex}>
            {item.wanted}
          </AppText>
        </View>
        <AppText variant="caption" numberOfLines={1}>
          {item.condition} · {item.age}
        </AppText>
      </View>
    </View>
  );
});

export function ItemCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton style={[styles.media, styles.skeletonMedia]} />
      <View style={styles.body}>
        <Skeleton style={styles.skeletonTitle} />
        <Skeleton style={styles.skeletonLine} />
        <Skeleton style={styles.skeletonShort} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, gap: 10 },
  flex: { flex: 1 },
  media: { width: '100%', aspectRatio: 0.85, borderRadius: 20, overflow: 'hidden', justifyContent: 'space-between' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10 },
  hot: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  hotText: { fontFamily: fonts.extrabold, fontSize: 10 },
  heart: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 11, gap: 6 },
  inline: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  inlineEnd: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  photoText: { fontFamily: fonts.bold, fontSize: 10.5 },
  body: { gap: 3, paddingHorizontal: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  skeletonMedia: { borderRadius: 20 },
  skeletonTitle: { width: '85%', height: 15 },
  skeletonLine: { width: '65%', height: 11 },
  skeletonShort: { width: '40%', height: 11 },
});
