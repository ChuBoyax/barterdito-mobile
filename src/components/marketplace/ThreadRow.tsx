import { Archive } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppText, Avatar } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import { fonts } from '@/theme';
import type { Thread } from '@/types/models';

type ThreadRowProps = {
  thread: Thread;
  onPress: () => void;
  onArchive?: () => void;
};

export function ThreadRow({ thread, onPress, onArchive }: ThreadRowProps) {
  const { colors } = useTheme();
  const unread = thread.unread > 0;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: colors.line },
        unread && { backgroundColor: colors.orangePale },
        pressed && { opacity: 0.75 },
      ]}>
      <Avatar initials={thread.initials} />
      <View style={styles.body}>
        <View style={styles.top}>
          <AppText variant="h3" weight={unread ? 'extrabold' : 'bold'} style={styles.flex} numberOfLines={1}>
            {thread.name}
          </AppText>
          <AppText variant="caption">{thread.time}</AppText>
        </View>
        {thread.item ? (
          <AppText variant="caption" color="orange" weight="bold" numberOfLines={1}>
            {thread.item}
          </AppText>
        ) : null}
        <AppText variant="small" color={unread ? 'ink' : 'muted'} numberOfLines={1}>
          {thread.preview}
        </AppText>
      </View>
      <View style={styles.side}>
        {unread ? (
          <View style={[styles.count, { backgroundColor: colors.orange }]}>
            <Text style={styles.countText}>{thread.unread}</Text>
          </View>
        ) : null}
        {onArchive ? (
          <Pressable accessibilityLabel="Archive thread" hitSlop={8} onPress={onArchive}>
            <Archive size={16} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, paddingHorizontal: 12, paddingVertical: 13 },
  body: { flex: 1, gap: 2 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1 },
  side: { alignItems: 'center', gap: 10 },
  count: { minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  countText: { color: '#fff', fontFamily: fonts.extrabold, fontSize: 10 },
});
