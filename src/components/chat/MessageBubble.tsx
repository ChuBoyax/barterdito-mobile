import { Image } from 'expo-image';
import { Check, CheckCheck } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { elevation, fonts, maxFontScale } from '@/theme';
import type { ChatMessage } from '@/types/models';

type MessageBubbleProps = {
  message: ChatMessage;
  onLongPress?: () => void;
  /** Delivery state of your own private message: saved by the server, or read by the other trader. */
  status?: 'sending' | 'sent' | 'read';
};

const statusLabels = { sending: 'Sending…', sent: 'Sent', read: 'Read' } as const;

export function MessageBubble({ message, onLongPress, status }: MessageBubbleProps) {
  const { colors } = useTheme();
  const mine = message.mine;
  const content = (
    <>
      {message.image ? <Image source={message.image} style={styles.image} contentFit="cover" /> : null}
      <Text maxFontSizeMultiplier={maxFontScale} style={[styles.text, { color: mine ? colors.onPrimary : colors.ink }]}>{message.text}</Text>
    </>
  );
  return (
    <Pressable onLongPress={onLongPress} disabled={!onLongPress} style={[styles.wrap, mine ? styles.mine : styles.theirs]}>
      {mine ? (
        <View style={[styles.bubble, styles.bubbleMine, { backgroundColor: colors.orange }]}>{content}</View>
      ) : (
        <View style={[styles.bubble, styles.bubbleTheirs, { backgroundColor: colors.surface, borderColor: 'transparent' }, elevation(1, colors)]}>{content}</View>
      )}
      <View style={styles.meta}>
        <Text maxFontSizeMultiplier={maxFontScale} style={[styles.time, { color: colors.muted }]}>{message.time}</Text>
        {status ? (
          <View style={styles.status} accessibilityLabel={statusLabels[status]}>
            {status === 'read' ? <CheckCheck size={12} color={colors.blue} /> : status === 'sent' ? <Check size={12} color={colors.muted} /> : null}
            <Text maxFontSizeMultiplier={maxFontScale} style={[styles.time, { color: status === 'read' ? colors.blue : colors.muted }]}>{statusLabels[status]}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { maxWidth: '80%', gap: 4 },
  mine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  theirs: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: { borderRadius: 22, paddingHorizontal: 15, paddingVertical: 11, gap: 8 },
  bubbleMine: { borderBottomRightRadius: 6 },
  bubbleTheirs: { borderBottomLeftRadius: 6, borderWidth: 1 },
  image: { width: 210, height: 160, borderRadius: 14 },
  text: { fontFamily: fonts.medium, fontSize: 14.5, lineHeight: 21 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6 },
  time: { fontFamily: fonts.medium, fontSize: 10.5 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 2, marginLeft: 4 },
});
