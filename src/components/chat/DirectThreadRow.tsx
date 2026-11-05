import { router } from 'expo-router';
import { BellOff, MoreHorizontal, Pin } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { shortDate } from '@/components/trades';
import { AppText, Avatar, PressableScale } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import { fonts, maxFontScale } from '@/theme';
import type { DirectConversation } from '@/types/directMessages';

type DirectThreadRowProps = {
  conversation: DirectConversation;
  /** Opens pin, archive, unread, and block; omit to hide the button. */
  onOptions?: (conversation: DirectConversation) => void;
};

/** One private conversation in the Inbox › Messages list. */
export function DirectThreadRow({ conversation, onOptions }: DirectThreadRowProps) {
  const { colors } = useTheme();
  const { other, unreadCount, lastMessage, unreadReminderId, isPinned, isMuted } = conversation;
  const unread = conversation.isUnread || unreadCount > 0;
  // Reminders are private; they never show as a message count.
  const reminder = unreadCount === 0 && unreadReminderId !== null;
  return (
    <View style={[styles.card, unread && { backgroundColor: colors.orangeSoft }]}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`Private chat with ${other.fullName}. ${isPinned ? 'Pinned. ' : ''}${unreadCount ? `${unreadCount} unread. ` : reminder ? 'Marked unread. ' : ''}${lastMessage ?? 'No messages yet'}`}
        onPress={() => router.push(`/direct-messages/${conversation.id}`)}
        scaleTo={0.98}
        style={styles.open}>
        <Avatar initials={other.initials} imageUrl={other.avatarUrl} size="large" />
        <View style={styles.body}>
          <View style={styles.row}>
            <AppText variant="h3" weight="bold" numberOfLines={1} style={[styles.flex, styles.name]}>
              {other.fullName}
            </AppText>
            {isMuted ? <BellOff size={13} color={colors.muted} accessibilityLabel="Muted" /> : null}
            {isPinned ? <Pin size={13} color={colors.orange} /> : null}
            <AppText variant="caption" color={unread ? 'orange' : 'muted'} weight={unread ? 'bold' : 'medium'} style={styles.time}>
              {shortDate(conversation.updatedAt)}
            </AppText>
          </View>
          <View style={styles.row}>
            <AppText variant="small" color={unread ? 'ink' : 'muted'} weight={unread ? 'semibold' : 'medium'} numberOfLines={1} style={[styles.flex, styles.preview]}>
              {lastMessage || 'Say hello'}
            </AppText>
            {unreadCount > 0 ? (
              <View style={[styles.badge, { backgroundColor: colors.orange }]}>
                <Text maxFontSizeMultiplier={maxFontScale} style={[styles.badgeText, { color: colors.onPrimary }]}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            ) : reminder ? (
              <View accessibilityLabel="Marked unread" style={[styles.dot, { backgroundColor: colors.orange }]} />
            ) : null}
          </View>
        </View>
      </PressableScale>
      {onOptions ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Options for conversation with ${other.fullName}`}
          hitSlop={6}
          onPress={() => onOptions(conversation)}
          style={styles.action}>
          <MoreHorizontal size={18} color={colors.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 18, paddingRight: 4 },
  open: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 8, paddingVertical: 11 },
  body: { flex: 1, gap: 3 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1 },
  name: { fontSize: 14, lineHeight: 19 },
  time: { fontSize: 11 },
  preview: { fontSize: 13, lineHeight: 18 },
  badge: { minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { fontFamily: fonts.extrabold, fontSize: 11 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  action: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center' },
});
