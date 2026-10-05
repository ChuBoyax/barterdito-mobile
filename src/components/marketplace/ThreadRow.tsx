import { ArrowRightLeft } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { AppText, Avatar, PressableScale } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import { fonts, maxFontScale } from '@/theme';
import type { Thread } from '@/types/models';

type ThreadRowProps = {
  thread: Thread;
  onPress: () => void;
  onLongPress?: () => void;
  divider?: boolean;
};

export function ThreadRow({ thread, onPress, onLongPress, divider }: ThreadRowProps) {
  const { colors } = useTheme();
  const unread = thread.unread > 0;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${thread.name}${unread ? `, ${thread.unread} unread` : ''}. ${thread.preview}`}
      accessibilityHint={onLongPress ? 'Long press for more options' : undefined}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      scaleTo={0.98}
      style={[styles.row, unread && { backgroundColor: colors.orangeSoft }]}>
      <Avatar initials={thread.initials} />
      <View style={[styles.body, divider && { borderBottomColor: colors.hairline, borderBottomWidth: StyleSheet.hairlineWidth }]}>
        <View style={styles.inline}>
          <AppText variant="h3" weight={unread ? 'extrabold' : 'bold'} style={styles.flex} numberOfLines={1}>
            {thread.name}
          </AppText>
          <AppText variant="caption" color={unread ? 'orange' : 'muted'} weight={unread ? 'bold' : 'medium'}>
            {thread.time}
          </AppText>
        </View>
        {thread.item ? (
          <View style={styles.item}>
            <ArrowRightLeft size={11} color={colors.muted} strokeWidth={2.4} />
            <AppText variant="caption" weight="semibold" numberOfLines={1} style={styles.flex}>
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
              <Text maxFontSizeMultiplier={maxFontScale} style={[styles.countText, { color: colors.onPrimary }]}>{thread.unread}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 14, borderRadius: 16 },
  body: { flex: 1, gap: 3, paddingVertical: 13 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flexShrink: 1, flexGrow: 1 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  count: { minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  countText: { fontFamily: fonts.extrabold, fontSize: 10 },
});
