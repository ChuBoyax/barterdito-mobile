import { router } from 'expo-router';
import { Mail, MailOpen } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { shortDate } from '@/components/trades';
import { AppText, Avatar, PressableScale } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import { fonts, maxFontScale, neu } from '@/theme';
import type { DirectConversation } from '@/types/directMessages';

type DirectThreadRowProps = {
  conversation: DirectConversation;
  /** Sets or clears your private "unread" reminder; omit to hide the button. */
  onToggleUnread?: (conversation: DirectConversation) => void;
  busy?: boolean;
};

/** One private conversation in the Inbox › Messages list. */
export function DirectThreadRow({ conversation, onToggleUnread, busy }: DirectThreadRowProps) {
  const { colors } = useTheme();
  const { other, unreadCount, lastMessage, unreadReminderId } = conversation;
  const unread = conversation.isUnread || unreadCount > 0;
  // Reminders are private; they never show as a message count.
  const reminder = unreadCount === 0 && unreadReminderId !== null;
  const empty = !lastMessage;
  return (
    <View style={[styles.card, { backgroundColor: colors.surface }, neu(colors, 1)]}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`Private chat with ${other.fullName}. ${unreadCount ? `${unreadCount} unread. ` : reminder ? 'Marked unread. ' : ''}${lastMessage ?? 'No messages yet'}`}
        onPress={() => router.push(`/direct-messages/${conversation.id}`)}
        scaleTo={0.98}
        style={styles.open}>
        <Avatar initials={other.initials} imageUrl={other.avatarUrl} size="medium" />
        <View style={styles.body}>
          <View style={styles.row}>
            <AppText variant="h3" weight={unread ? 'extrabold' : 'bold'} numberOfLines={1} style={styles.flex}>
              {other.fullName}
            </AppText>
            <AppText variant="caption" color={unread ? 'orange' : 'muted'} weight={unread ? 'bold' : 'medium'}>
              {shortDate(conversation.updatedAt)}
            </AppText>
          </View>
          <View style={styles.row}>
            <AppText variant="small" color={unread ? 'ink' : 'muted'} weight={unread ? 'semibold' : 'medium'} numberOfLines={1} style={styles.flex}>
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
      {onToggleUnread ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={unreadReminderId ? `Clear unread reminder for ${other.fullName}` : `Mark conversation with ${other.fullName} as unread`}
          disabled={busy || empty}
          hitSlop={6}
          onPress={() => onToggleUnread(conversation)}
          style={[styles.action, { backgroundColor: colors.background }, (busy || empty) && styles.dimmed]}>
          {unreadReminderId ? <MailOpen size={17} color={colors.orange} /> : <Mail size={17} color={colors.muted} />}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20, paddingRight: 10 },
  open: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  body: { flex: 1, gap: 3 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1 },
  badge: { minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { fontFamily: fonts.extrabold, fontSize: 11 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  action: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  dimmed: { opacity: 0.45 },
});
