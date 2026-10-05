import { Archive, ArrowRightLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppText, Avatar, PressableScale } from '@/components/ui';
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
    <PressableScale accessibilityRole="button" onPress={onPress} scaleTo={0.98} style={styles.row}>
      <Avatar initials={thread.initials} online={unread} />
      <View style={styles.body}>
        <View style={styles.inline}>
          <AppText variant="h3" weight={unread ? 'extrabold' : 'bold'} style={styles.flex} numberOfLines={1}>
            {thread.name}
          </AppText>
          <AppText variant="caption" color={unread ? 'orange' : 'muted'} weight={unread ? 'bold' : 'medium'}>
            {thread.time}
          </AppText>
        </View>
        {thread.item ? (
          <View style={[styles.item, { backgroundColor: colors.orangeSoft }]}>
            <ArrowRightLeft size={10} color={colors.orange} strokeWidth={2.4} />
            <AppText variant="caption" color="orange" weight="bold" numberOfLines={1}>
              {thread.item}
            </AppText>
          </View>
        ) : null}
        <View style={styles.inline}>
          <AppText variant="small" color={unread ? 'ink' : 'muted'} weight={unread ? 'semibold' : 'medium'} numberOfLines={1} style={styles.flex}>
            {thread.preview}
          </AppText>
          {unread ? (
            <View style={[styles.count, { backgroundColor: colors.orange }]}>
              <Text style={[styles.countText, { color: colors.onPrimary }]}>{thread.unread}</Text>
            </View>
          ) : onArchive ? (
            <Pressable accessibilityLabel="Archive thread" hitSlop={10} onPress={onArchive}>
              <Archive size={15} color={colors.muted2} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 12 },
  body: { flex: 1, gap: 4 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1 },
  item: { alignSelf: 'flex-start', maxWidth: '100%', flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  count: { minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  countText: { fontFamily: fonts.extrabold, fontSize: 10 },
});
