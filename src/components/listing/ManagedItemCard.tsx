import { Image } from 'expo-image';
import { MoreHorizontal, Package } from 'lucide-react-native';
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppText, IconButton, PressableScale } from '@/components/ui';
import { itemStatusTone } from '@/constants/status';
import { useTheme } from '@/providers/ThemeProvider';
import { fonts, maxFontScale, neu, tone } from '@/theme';
import type { Item } from '@/types/models';
import { formatNumber } from '@/utils/format';
import { openItem } from '@/utils/navigation';

type ManagedItemCardProps = { item: Item; onOptions: (item: Item) => void };

/** One of the owner's listings: photo, title, status and a single line of stats. Actions live in the menu. */
export const ManagedItemCard = memo(function ManagedItemCard({ item, onOptions }: ManagedItemCardProps) {
  const { colors } = useTheme();
  const status = tone(colors, itemStatusTone[item.status]);
  const traded = item.status === 'Traded';

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${item.status}`}
      onPress={() => openItem(item)}
      scaleTo={0.98}
      style={[styles.card, { backgroundColor: colors.surface }, neu(colors, 1)]}>
      <View style={[styles.photo, { backgroundColor: colors.surface2 }]}>
        {item.image ? (
          <Image source={item.image} cachePolicy="memory-disk" style={[StyleSheet.absoluteFill, traded && styles.faded]} contentFit="cover" />
        ) : (
          <Package size={22} color={colors.muted} />
        )}
      </View>

      <View style={styles.body}>
        <AppText variant="h3" numberOfLines={1}>
          {item.title}
        </AppText>
        <View style={styles.row}>
          <View style={[styles.status, { backgroundColor: status.bg }]}>
            <Text maxFontSizeMultiplier={maxFontScale} style={[styles.statusText, { color: status.fg }]}>
              {item.status}
            </Text>
          </View>
        </View>
        <AppText variant="caption" numberOfLines={1}>
          {formatNumber(item.views)} views · {formatNumber(item.hearts)} likes · {item.age}
        </AppText>
      </View>

      <IconButton icon={MoreHorizontal} label={`Options for ${item.title}`} size={16} dimension={36} onPress={() => onOptions(item)} />
    </PressableScale>
  );
});

const PHOTO = 72;

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 20, padding: 10, paddingRight: 12 },
  photo: { width: PHOTO, height: PHOTO, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  faded: { opacity: 0.55 },
  body: { flex: 1, minWidth: 0, gap: 5 },
  row: { flexDirection: 'row' },
  status: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  statusText: { fontFamily: fonts.bold, fontSize: 11 },
});
