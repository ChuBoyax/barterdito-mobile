import { Image } from 'expo-image';
import { ArrowLeftRight, Bookmark, Eye, Heart, MapPin } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppText, PressableScale, Skeleton } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import { elevation, fonts, maxFontScale, neu } from '@/theme';
import type { Item } from '@/types/models';
import { distanceLabel, shortLocation } from '@/utils/location';

/** Distance first on narrow cards, so a long area name never hides it. */
export function placeLine(item: Item) {
  const place = shortLocation(item.location) || 'Location not added';
  const distance = distanceLabel(item.distanceKm);
  return distance ? `${distance} · ${place}` : place;
}

type ItemCardProps = {
  item: Item;
  saved: boolean;
  hearted?: boolean;
  /** Replaces the listing's posted age, e.g. "Saved 2h ago" on the wishlist. */
  ageLabel?: string;
  onOpen: (item: Item) => void;
  onSave: (id: string) => void;
  onHeart: (item: Item) => void;
};

/** Same layout as the website's phone view: photo with its chips, facts, "looking for", then counts. */
export const ItemCard = memo(function ItemCard({ item, saved, hearted, ageLabel, onOpen: openItem, onSave: saveItem, onHeart: heartItem }: ItemCardProps) {
  const { colors } = useTheme();
  const onOpen = () => openItem(item);
  const onSave = () => saveItem(item.id);
  const onHeart = () => heartItem(item);
  const dot = item.status === 'Active' ? colors.green : item.status === 'In Negotiation' ? colors.warning : colors.muted;
  const chip = [{ backgroundColor: colors.glass }, elevation(1, colors)];
  return (
    <View style={[styles.card, { backgroundColor: colors.surface }, neu(colors, 2)]}>
      <View style={[styles.media, { backgroundColor: colors.surface2 }]}>
        <PressableScale accessibilityRole="button" accessibilityLabel={`View ${item.title}`} onPress={onOpen} scaleTo={0.98} style={StyleSheet.absoluteFill}>
          <Image source={item.image} cachePolicy="memory-disk" style={StyleSheet.absoluteFill} contentFit="cover" transition={150} recyclingKey={item.id} />
        </PressableScale>
        <View pointerEvents="none" style={[styles.category, chip]}>
          <Text maxFontSizeMultiplier={maxFontScale} numberOfLines={1} style={[styles.categoryText, { color: colors.orange }]}>
            {item.category}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={saved ? 'Remove from saved items' : 'Save item'}
          accessibilityState={{ selected: saved }}
          hitSlop={6}
          onPress={onSave}
          style={[styles.save, chip]}>
          <Bookmark size={15} color={saved ? colors.orange : colors.ink} fill={saved ? colors.orange : 'none'} />
        </Pressable>
        {item.hot ? (
          <View pointerEvents="none" style={[styles.hot, { backgroundColor: colors.orange }]}>
            <Text maxFontSizeMultiplier={maxFontScale} style={[styles.hotText, { color: colors.onPrimary }]}>
              🔥 Hot
            </Text>
          </View>
        ) : null}
        <View pointerEvents="none" style={[styles.status, chip]}>
          <View style={[styles.dot, { backgroundColor: dot }]} />
          <Text maxFontSizeMultiplier={maxFontScale} numberOfLines={1} style={[styles.statusText, { color: colors.ink }]}>
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <Pressable onPress={onOpen}>
          <AppText variant="small" color="ink" weight="semibold" numberOfLines={1} style={styles.title}>
            {item.title}
          </AppText>
        </Pressable>
        <View style={styles.facts}>
          <AppText variant="caption" color="ink" weight="bold" numberOfLines={1} style={styles.condition}>
            {item.condition}
          </AppText>
          <View style={styles.location}>
            <MapPin size={12} color={colors.muted2} />
            <AppText variant="caption" numberOfLines={1} style={styles.flex}>
              {placeLine(item)}
            </AppText>
          </View>
        </View>
        <View style={[styles.wanted, { backgroundColor: colors.background }, neu(colors, 1, true)]}>
          <View style={[styles.wantedIcon, { backgroundColor: colors.orangeSoft }]}>
            <ArrowLeftRight size={12} color={colors.orange} />
          </View>
          <View style={styles.flex}>
            <Text maxFontSizeMultiplier={maxFontScale} style={[styles.wantedLabel, { color: colors.muted }]}>
              Looking for
            </Text>
            <Text maxFontSizeMultiplier={maxFontScale} numberOfLines={1} style={[styles.wantedText, { color: colors.ink }]}>
              {item.wanted.trim() || 'Not specified'}
            </Text>
          </View>
        </View>
        <View style={styles.meta}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Heart item, ${item.hearts} likes`} accessibilityState={{ selected: hearted }} onPress={onHeart} style={styles.heart}>
            <Heart size={13} color={hearted ? colors.orange : colors.muted} fill={hearted ? colors.orange : 'none'} />
            <Text maxFontSizeMultiplier={maxFontScale} style={[styles.metaText, { color: colors.muted }]}>
              {item.hearts}
            </Text>
          </Pressable>
          <View style={styles.views} accessibilityLabel={`${item.views} views`}>
            <Eye size={13} color={colors.muted} />
            <Text maxFontSizeMultiplier={maxFontScale} style={[styles.metaText, { color: colors.muted }]}>
              {item.views}
            </Text>
          </View>
          <Text maxFontSizeMultiplier={maxFontScale} numberOfLines={1} style={[styles.metaText, styles.age, { color: colors.muted }]}>
            {ageLabel ?? item.age}
          </Text>
        </View>
      </View>
    </View>
  );
});

export function ItemCardSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface }, neu(colors, 2)]}>
      <Skeleton style={[styles.media, styles.skeletonMedia]} />
      <View style={[styles.body, styles.skeletonBody]}>
        <Skeleton style={styles.skeletonTitle} />
        <Skeleton style={styles.skeletonLine} />
        <Skeleton style={styles.skeletonWanted} />
        <Skeleton style={styles.skeletonShort} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 0, borderRadius: 20, padding: 6 },
  flex: { flex: 1, minWidth: 0 },
  media: { width: '100%', aspectRatio: 1, borderRadius: 14, overflow: 'hidden' },
  category: { position: 'absolute', top: 8, left: 8, maxWidth: '62%', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  categoryText: { fontFamily: fonts.bold, fontSize: 10, lineHeight: 14 },
  save: { position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  hot: { position: 'absolute', left: 8, bottom: 34, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2 },
  hotText: { fontFamily: fonts.bold, fontSize: 10 },
  status: { position: 'absolute', right: 8, bottom: 8, maxWidth: '86%', flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 10, lineHeight: 16 },
  body: { flex: 1, gap: 2, paddingTop: 8, paddingHorizontal: 2 },
  title: { fontSize: 14, lineHeight: 19 },
  facts: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  condition: { flexShrink: 0, maxWidth: '50%' },
  location: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 3 },
  wanted: { marginTop: 'auto', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 12, paddingVertical: 4, paddingLeft: 4, paddingRight: 8 },
  wantedIcon: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  wantedLabel: { fontFamily: fonts.regular, fontSize: 10, lineHeight: 13 },
  wantedText: { fontFamily: fonts.bold, fontSize: 11, lineHeight: 15 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 40 },
  heart: { flexDirection: 'row', alignItems: 'center', gap: 3, minWidth: 44, minHeight: 40 },
  views: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontFamily: fonts.medium, fontSize: 11 },
  age: { flex: 1, minWidth: 0, textAlign: 'right' },
  skeletonMedia: { borderRadius: 14 },
  skeletonBody: { gap: 6, paddingBottom: 8 },
  skeletonTitle: { width: '85%', height: 15 },
  skeletonLine: { width: '65%', height: 11 },
  skeletonWanted: { width: '100%', height: 34, borderRadius: 12 },
  skeletonShort: { width: '40%', height: 11 },
});
