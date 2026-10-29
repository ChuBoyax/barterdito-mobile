import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Package } from 'lucide-react-native';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Badge, PressableScale } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import { neu } from '@/theme';
import type { ConversationSummary, OfferListing } from '@/types/trades';
import { otherTrader } from '@/utils/trades';

export function shortDate(value: string) {
  const date = new Date(value);
  const today = new Date();
  return date.toDateString() === today.toDateString()
    ? date.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })
    : date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

/** One trade conversation: the two items, who it is with, and the latest message. */
export const ConversationCard = memo(function ConversationCard({ conversation, userId }: { conversation: ConversationSummary; userId: string }) {
  const { colors } = useTheme();
  const { offer, status, lastMessage, updatedAt, unreadCount } = conversation;
  const other = otherTrader(offer, userId);
  const mineFirst = offer.proposer.id === userId;
  const theirs = mineFirst ? offer.requested : offer.offered;
  const yours = mineFirst ? offer.offered : offer.requested;
  const closed = status !== 'active';

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`Trade chat with ${other.fullName} about ${theirs.title} and ${yours.title}. ${unreadCount ? `${unreadCount} unread. ` : ''}${closed ? `${status}. ` : ''}${lastMessage}`}
      onPress={() => router.push(`/messages/${offer.id}`)}
      scaleTo={0.98}
      style={[styles.card, { backgroundColor: colors.surface }, neu(colors, 1)]}>
      <View style={styles.thumbs}>
        <Thumb item={theirs} style={styles.back} />
        <Thumb item={yours} style={[styles.front, { borderColor: colors.surface }]} />
      </View>

      <View style={styles.body}>
        <View style={styles.row}>
          <AppText variant="h3" weight={unreadCount ? 'extrabold' : 'bold'} numberOfLines={1} style={styles.flex}>
            {other.fullName}
          </AppText>
          <AppText variant="caption" color={unreadCount ? 'orange' : 'muted'} weight={unreadCount ? 'bold' : 'medium'}>
            {shortDate(updatedAt)}
          </AppText>
        </View>
        <View style={styles.row}>
          <AppText variant="small" color={unreadCount ? 'ink' : 'muted'} weight={unreadCount ? 'semibold' : 'medium'} numberOfLines={1} style={styles.flex}>
            {lastMessage}
          </AppText>
          {unreadCount ? (
            <View style={[styles.unread, { backgroundColor: colors.orange }]}>
              <AppText variant="caption" weight="bold" style={{ color: colors.onPrimary }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </AppText>
            </View>
          ) : null}
          {closed ? <Badge label={status === 'completed' ? 'Completed' : 'Cancelled'} tone={status === 'completed' ? 'blue' : 'neutral'} /> : null}
        </View>
      </View>
    </PressableScale>
  );
});

function Thumb({ item, style }: { item: OfferListing; style: object }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.thumb, { backgroundColor: colors.surface2 }, style]}>
      {item.imageUrl ? (
        <Image source={item.imageUrl} cachePolicy="memory-disk" style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <Package size={16} color={colors.muted} />
      )}
    </View>
  );
}

const THUMB = 44;

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 12 },
  thumbs: { width: THUMB + 12, height: THUMB + 12 },
  thumb: { position: 'absolute', width: THUMB, height: THUMB, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  back: { top: 0, left: 0 },
  front: { bottom: 0, right: 0, borderWidth: 2.5 },
  body: { flex: 1, minWidth: 0, gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flex: { flex: 1, minWidth: 0 },
  unread: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
});
