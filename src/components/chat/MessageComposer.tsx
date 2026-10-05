import { ImagePlus, Send, X } from 'lucide-react-native';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import { fonts } from '@/theme';

type MessageComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onAttach?: () => void;
  editing?: boolean;
  onCancelEdit?: () => void;
};

export function MessageComposer({ value, onChange, onSend, onAttach, editing, onCancelEdit }: MessageComposerProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const canSend = value.trim().length > 0;
  return (
    <View style={[styles.wrap, { borderTopColor: colors.line, backgroundColor: colors.surface, paddingBottom: insets.bottom + 10 }]}>
      {editing ? (
        <View style={styles.editing}>
          <AppText variant="caption" color="orange" weight="bold">
            Editing message
          </AppText>
          <Pressable accessibilityLabel="Cancel edit" onPress={onCancelEdit} hitSlop={8}>
            <X size={15} color={colors.muted} />
          </Pressable>
        </View>
      ) : null}
      <View style={styles.row}>
        {onAttach ? (
          <Pressable accessibilityLabel="Attach image" onPress={onAttach} style={[styles.round, { backgroundColor: colors.surface2 }]}>
            <ImagePlus size={20} color={colors.muted} />
          </Pressable>
        ) : null}
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={editing ? 'Edit your message…' : 'Write a message…'}
          placeholderTextColor={colors.muted2}
          multiline
          style={[styles.input, { backgroundColor: colors.surface2, color: colors.ink }]}
        />
        <Pressable
          accessibilityLabel="Send message"
          disabled={!canSend}
          onPress={onSend}
          style={[styles.round, { backgroundColor: canSend ? colors.orange : colors.line }]}>
          <Send size={18} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderTopWidth: 1, paddingHorizontal: 12, paddingTop: 10, gap: 6 },
  editing: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  round: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, minHeight: 42, maxHeight: 120, borderRadius: 21, paddingHorizontal: 16, paddingTop: 11, paddingBottom: 11, fontFamily: fonts.medium, fontSize: 14 },
});
