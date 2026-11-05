import { Image } from 'expo-image';
import { Edit3, Eye, Heart, Package, Trash2, type LucideIcon } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppText, PressableScale } from '@/components/ui';
import { itemStatusTone } from '@/constants/status';
import { useTheme } from '@/providers/ThemeProvider';
import { elevation, fonts, maxFontScale, neu, tone } from '@/theme';
import type { Item } from '@/types/models';
import { formatNumber } from '@/utils/format';
import { openItem } from '@/utils/navigation';

type ManagedItemCardProps = {
  item: Item;
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
  /** Long press: share and mark as traded. */
  onOptions: (item: Item) => void;
};

/** One of the owner's listings, as on the website's phone view: photo with its chips, then edit, view and delete. */
export const ManagedItemCard = memo(function ManagedItemCard({ item, onEdit, onDelete, onOptions }: ManagedItemCardProps) {
  const { colors } = useTheme();
  const status = tone(colors, itemStatusTone[item.status]);
  const traded = item.status === 'Traded';

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }, neu(colors, 2)]}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`${item.title}, ${item.status}`}
        accessibilityHint="Long press for more options"
        onPress={() => openItem(item)}
        onLongPress={() => onOptions(item)}
        scaleTo={0.98}
        style={[styles.media, { backgroundColor: colors.surface2 }]}>
        {item.image ? (
          <Image source={item.image} cachePolicy="memory-disk" style={[StyleSheet.absoluteFill, traded && styles.faded]} contentFit="cover" />
        ) : (
          <Package size={22} color={colors.muted} />
        )}
        <View style={[styles.badge, { backgroundColor: status.bg }, elevation(1, colors)]}>
          <View style={[styles.dot, { backgroundColor: status.fg }]} />
          <Text maxFontSizeMultiplier={maxFontScale} numberOfLines={1} style={[styles.badgeText, { color: status.fg }]}>
            {item.status}
          </Text>
        </View>
        <View style={[styles.stats, { backgroundColor: colors.glass }, elevation(1, colors)]}>
          <Heart size={12} color={colors.ink} />
          <Text maxFontSizeMultiplier={maxFontScale} style={[styles.statText, { color: colors.ink }]}>
            {formatNumber(item.hearts)}
          </Text>
          <Eye size={12} color={colors.ink} />
          <Text maxFontSizeMultiplier={maxFontScale} style={[styles.statText, { color: colors.ink }]}>
            {formatNumber(item.views)}
          </Text>
        </View>
      </PressableScale>

      <View style={styles.body}>
        <Text maxFontSizeMultiplier={maxFontScale} numberOfLines={1} style={[styles.meta, { color: colors.orange }]}>
          {[item.category, item.condition].filter(Boolean).join(' · ')}
        </Text>
        <AppText variant="h3" numberOfLines={2} style={styles.title}>
          {item.title}
        </AppText>
        <View style={[styles.tray, { backgroundColor: colors.background }, neu(colors, 1, true)]}>
          <TrayButton icon={Edit3} label={`Edit ${item.title}`} disabled={item.status !== 'Active'} onPress={() => onEdit(item)} />
          <TrayButton icon={Eye} label={`View ${item.title}`} onPress={() => openItem(item)} />
          {/* Reserved by an accepted trade: the backend refuses to delete it. */}
          <TrayButton icon={Trash2} label={`Delete ${item.title}`} danger disabled={item.status === 'In Negotiation'} onPress={() => onDelete(item)} />
        </View>
      </View>
    </View>
  );
});

function TrayButton({ icon: Icon, label, danger, disabled, onPress }: { icon: LucideIcon; label: string; danger?: boolean; disabled?: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={[styles.trayButton, disabled && styles.disabled]}>
      <Icon size={16} color={danger ? colors.red : colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 0, borderRadius: 20, padding: 6 },
  media: { width: '100%', aspectRatio: 4 / 3, borderRadius: 13, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  faded: { opacity: 0.55 },
  badge: { position: 'absolute', top: 8, left: 8, maxWidth: '85%', flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 10 },
  stats: { position: 'absolute', right: 8, bottom: 8, flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  statText: { fontFamily: fonts.bold, fontSize: 11, marginRight: 3 },
  body: { flex: 1, gap: 4, paddingTop: 10 },
  meta: { minHeight: 16, marginHorizontal: 4, fontFamily: fonts.bold, fontSize: 11, lineHeight: 16 },
  title: { marginHorizontal: 4, marginBottom: 10, fontSize: 15, lineHeight: 21 },
  tray: { marginTop: 'auto', flexDirection: 'row', gap: 2, borderRadius: 14, padding: 2 },
  trayButton: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  disabled: { opacity: 0.4 },
});
