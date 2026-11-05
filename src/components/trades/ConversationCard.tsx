import { router } from 'expo-router';
import { ArrowLeftRight } from 'lucide-react-native';
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppText, Avatar, PressableScale } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import { fonts, maxFontScale } from '@/theme';
import type { ConversationSummary } from '@/types/trades';
import { otherTrader } from '@/utils/trades';

export function shortDate(value: string) {
  const date = new Date(value);
  const today = new Date();
  return date.toDateString() === today.toDateString()
    ? date.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })
    : date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

/** One trade conversation: who it is with, the two items, and the latest message. */
export const ConversationCard = memo(function ConversationCard({ conversation, userId }: { conversation: ConversationSummary; userId: string }) {
  const { colors } = useTheme();
  const { offer, status, lastMessage, updatedAt, unreadCount } = conversation;
  const other = otherTrader(offer, userId);
  const mineFirst = offer.proposer.id === userId;
  const theirs = mineFirst ? offer.requested : offer.offered;
  const yours = mineFirst ? offer.offered : offer.requested;
  const closed = status !== 'active';
  const unread = unreadCount > 0;
  const statusPalette = status === 'completed' ? { bg: colors.blueSoft, fg: colors.blue } : status === 'cancelled' ? { bg: colors.surface2, fg: colors.muted } : { bg: colors.greenSoft, fg: colors.green };

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`Trade chat with ${other.fullName} about ${theirs.title} and ${yours.title}. ${unread ? `${unreadCount} unread. ` : ''}${closed ? `${status}. ` : ''}${lastMessage ?? ''}`}
      onPress={() => router.push(`/messages/${offer.id}`)}
      scaleTo={0.98}
      style={[styles.row, unread && { backgroundColor: colors.orangeSoft }]}>
      <Avatar initials={other.initials} imageUrl={other.avatarUrl} size="large" />
      <View style={styles.body}>
        <View style={styles.line}>
          <AppText variant="h3" weight="bold" numberOfLines={1} style={[styles.flex, styles.name]}>
            {other.fullName}
          </AppText>
          <AppText variant="caption" color={unread ? 'orange' : 'muted'} weight={unread ? 'bold' : 'medium'} style={styles.time}>
            {shortDate(updatedAt)}
          </AppText>
        </View>
        <View style={styles.items}>
          <Text maxFontSizeMultiplier={maxFontScale} numberOfLines={1} style={[styles.itemText, { color: colors.orangeDark }]}>
            {theirs.title}
          </Text>
          <ArrowLeftRight size={12} color={colors.muted2} />
          <Text maxFontSizeMultiplier={maxFontScale} numberOfLines={1} style={[styles.itemText, { color: colors.orangeDark }]}>
            {yours.title}
          </Text>
        </View>
        <View style={styles.line}>
          <AppText variant="small" color={unread ? 'ink' : 'muted'} weight={unread ? 'semibold' : 'medium'} numberOfLines={1} style={[styles.flex, styles.preview]}>
            {lastMessage || 'No messages yet'}
          </AppText>
          {unread ? (
            <View style={[styles.count, { backgroundColor: colors.orange }]}>
              <Text maxFontSizeMultiplier={1} style={[styles.countText, { color: colors.onPrimary }]}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          ) : null}
          {closed ? (
            <View style={[styles.status, { backgroundColor: statusPalette.bg }]}>
              <Text maxFontSizeMultiplier={maxFontScale} style={[styles.statusText, { color: statusPalette.fg }]}>
                {status === 'completed' ? 'Completed' : 'Cancelled'}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </PressableScale>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, paddingHorizontal: 8, paddingVertical: 11 },
  body: { flex: 1, minWidth: 0, gap: 3 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1, minWidth: 0 },
  name: { fontSize: 14, lineHeight: 19 },
  time: { fontSize: 11 },
  preview: { fontSize: 13, lineHeight: 18 },
  items: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemText: { flexShrink: 1, fontFamily: fonts.semibold, fontSize: 11 },
  count: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  countText: { fontFamily: fonts.bold, fontSize: 10 },
  status: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { fontFamily: fonts.bold, fontSize: 10 },
});
