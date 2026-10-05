import { Image } from 'expo-image';
import { Bookmark, Eye, Heart, MapPin } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppText, Badge, Skeleton } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import { fonts, radius } from '@/theme';
import type { Item } from '@/types/models';

type ItemCardProps = {
  item: Item;
  saved: boolean;
  hearted?: boolean;
  onOpen: () => void;
  onSave: () => void;
  onHeart: () => void;
};

export function ItemCard({ item, saved, hearted, onOpen, onSave, onHeart }: ItemCardProps) {
  const { colors } = useTheme();
  const statusColor = item.status === 'Active' ? colors.green : item.status === 'Traded' ? colors.muted : colors.warning;
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={`View ${item.title}`} onPress={onOpen}>
        <Image source={item.image} style={styles.image} contentFit="cover" transition={200} />
        {item.hot ? (
          <View style={styles.hot}>
            <Text style={styles.hotText}>🔥 Hot</Text>
          </View>
        ) : null}
        <View style={[styles.status, { backgroundColor: statusColor, borderColor: colors.surface }]} />
      </Pressable>
      <View style={styles.body}>
        <View style={styles.top}>
          <Badge label={item.category} tone="orange" />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={saved ? 'Remove from saved items' : 'Save item'}
            hitSlop={8}
            onPress={onSave}>
            <Bookmark size={17} color={saved ? colors.orange : colors.muted} fill={saved ? colors.orange : 'none'} />
          </Pressable>
        </View>
        <Pressable onPress={onOpen}>
          <AppText variant="h3" numberOfLines={1}>
            {item.title}
          </AppText>
        </Pressable>
        <AppText variant="caption">{item.condition}</AppText>
        <View style={styles.row}>
          <MapPin size={12} color={colors.muted} />
          <AppText variant="caption" numberOfLines={1} style={styles.flex}>
            {item.location}
          </AppText>
        </View>
        <View style={[styles.meta, { borderTopColor: colors.line }]}>
          <Pressable accessibilityLabel="Heart item" hitSlop={6} onPress={onHeart} style={styles.row}>
            <Heart size={14} color={hearted ? colors.red : colors.muted} fill={hearted ? colors.red : 'none'} />
            <AppText variant="caption">{item.hearts}</AppText>
          </Pressable>
          <View style={styles.row}>
            <Eye size={14} color={colors.muted} />
            <AppText variant="caption">{item.views}</AppText>
          </View>
          <AppText variant="caption">{item.age}</AppText>
        </View>
      </View>
    </View>
  );
}

export function ItemCardSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      <Skeleton style={styles.image} />
      <View style={styles.body}>
        <Skeleton style={{ width: 70, height: 18, borderRadius: 9 }} />
        <Skeleton style={{ width: '90%', height: 15 }} />
        <Skeleton style={{ width: '60%', height: 11 }} />
        <Skeleton style={{ width: '40%', height: 11 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, overflow: 'hidden', borderRadius: radius.lg, borderWidth: 1 },
  image: { width: '100%', aspectRatio: 1 },
  hot: {
    position: 'absolute',
    top: 10,
    left: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  hotText: { fontFamily: fonts.extrabold, fontSize: 10, color: '#2c2c2c' },
  status: { position: 'absolute', top: 12, right: 12, width: 12, height: 12, borderRadius: 6, borderWidth: 2 },
  body: { padding: 11, gap: 4 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  flex: { flex: 1 },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    marginTop: 6,
    paddingTop: 8,
  },
});
