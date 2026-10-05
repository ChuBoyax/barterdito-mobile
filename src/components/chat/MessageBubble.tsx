import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { fonts } from '@/theme';
import type { ChatMessage } from '@/types/models';

type MessageBubbleProps = {
  message: ChatMessage;
  onLongPress?: () => void;
};

export function MessageBubble({ message, onLongPress }: MessageBubbleProps) {
  const { colors } = useTheme();
  const mine = message.mine;
  return (
    <Pressable
      onLongPress={onLongPress}
      disabled={!onLongPress}
      style={[styles.wrap, mine ? styles.mine : styles.theirs]}>
      <View
        style={[
          styles.bubble,
          mine
            ? { backgroundColor: colors.orange, borderBottomRightRadius: 5 }
            : { backgroundColor: colors.surface2, borderBottomLeftRadius: 5 },
        ]}>
        {message.image ? <Image source={message.image} style={styles.image} contentFit="cover" /> : null}
        <Text style={[styles.text, { color: mine ? colors.white : colors.ink }]}>{message.text}</Text>
      </View>
      <Text style={[styles.time, { color: colors.muted }]}>{message.time}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { maxWidth: '80%', gap: 3 },
  mine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  theirs: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  image: { width: 200, height: 150, borderRadius: 12 },
  text: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
  time: { fontFamily: fonts.medium, fontSize: 10, paddingHorizontal: 4 },
});
