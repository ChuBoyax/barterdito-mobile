import { ImagePlus, Send, X, type LucideIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Glass, PressableScale } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import { elevation, fonts, maxFontScale } from '@/theme';

type MessageComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onAttach?: () => void;
  attachIcon?: LucideIcon;
  attachLabel?: string;
  editing?: boolean;
  onCancelEdit?: () => void;
};

function useKeyboardOpen() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    // iOS reports the keyboard before it animates; Android only after.
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setOpen(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return open;
}

export function MessageComposer({ value, onChange, onSend, onAttach, attachIcon: AttachIcon = ImagePlus, attachLabel = 'Attach image', editing, onCancelEdit }: MessageComposerProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const keyboardOpen = useKeyboardOpen();
  const canSend = value.trim().length > 0;
  // Sit just above the gesture bar / home indicator, and right above the keyboard while typing.
  const bottom = keyboardOpen ? 8 : Math.max(insets.bottom - 6, 8);
  return (
    <View style={[styles.outer, { paddingBottom: bottom }]}>
      {editing ? (
        <View style={[styles.editing, { backgroundColor: colors.orangeSoft }]}>
          <AppText variant="caption" color="orange" weight="bold">
            Editing message
          </AppText>
          <Pressable accessibilityLabel="Cancel edit" onPress={onCancelEdit} hitSlop={8}>
            <X size={15} color={colors.orange} />
          </Pressable>
        </View>
      ) : null}
      <Glass strong intensity={60} style={[styles.bar, elevation(2, colors)]}>
        {onAttach ? (
          <Pressable accessibilityLabel={attachLabel} onPress={onAttach} style={[styles.round, { backgroundColor: colors.surface2 }]}>
            <AttachIcon size={19} color={colors.ink} strokeWidth={2.1} />
          </Pressable>
        ) : null}
        <TextInput maxFontSizeMultiplier={maxFontScale}
          value={value}
          onChangeText={onChange}
          placeholder={editing ? 'Edit your message…' : 'Write a message…'}
          placeholderTextColor={colors.muted2}
          selectionColor={colors.orange}
          multiline
          textAlignVertical="center"
          style={[styles.input, { color: colors.ink }]}
        />
        <PressableScale accessibilityLabel="Send message" disabled={!canSend} onPress={onSend} scaleTo={0.88}>
          <View style={[styles.round, { backgroundColor: canSend ? colors.orange : colors.line }]}>
            <Send size={17} color={colors.onPrimary} strokeWidth={2.2} />
          </View>
        </PressableScale>
      </Glass>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 12, paddingTop: 8, gap: 6 },
  editing: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  bar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, borderRadius: 28, padding: 6 },
  round: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, minHeight: 44, maxHeight: 120, paddingHorizontal: 8, paddingTop: 11, paddingBottom: 11, fontFamily: fonts.medium, fontSize: 14.5, lineHeight: 20, includeFontPadding: false },
});
