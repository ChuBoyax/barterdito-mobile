import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { shortDate } from '@/components/trades';
import { AppText, Avatar, PressableScale } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import { fonts, maxFontScale, neu } from '@/theme';
import type { DirectConversation } from '@/types/directMessages';

/** One private conversation in the Inbox › Messages list. */
export function DirectThreadRow({ conversation }: { conversation: DirectConversation }) {
  const { colors } = useTheme();
  const { other, unreadCount, lastMessage } = conversation;
  const unread = unreadCount > 0;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`Private chat with ${other.fullName}. ${unread ? `${unreadCount} unread. ` : ''}${lastMessage ?? 'No messages yet'}`}
      onPress={() => router.push(`/direct-messages/${conversation.id}`)}
      scaleTo={0.98}
      style={[styles.card, { backgroundColor: colors.surface }, neu(colors, 1)]}>
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
          {unread ? (
            <View style={[styles.badge, { backgroundColor: colors.orange }]}>
              <Text maxFontSizeMultiplier={maxFontScale} style={[styles.badgeText, { color: colors.onPrimary }]}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, padding: 12 },
  body: { flex: 1, gap: 3 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1 },
  badge: { minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { fontFamily: fonts.extrabold, fontSize: 11 },
});
