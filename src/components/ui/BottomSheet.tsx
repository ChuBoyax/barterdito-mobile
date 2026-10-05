import { X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/providers/ThemeProvider';
import { AppText } from './AppText';
import { IconButton } from './IconButton';

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  eyebrow?: string;
  children: ReactNode;
};

/** Modal sheet that slides up from the bottom; replaces the web modals/dialogs. */
export function BottomSheet({ visible, onClose, title, eyebrow, children }: BottomSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 }]}>
          <View style={[styles.handle, { backgroundColor: colors.line }]} />
          {title ? (
            <View style={styles.header}>
              <View style={styles.flex}>
                {eyebrow ? <AppText variant="eyebrow">{eyebrow}</AppText> : null}
                <AppText variant="h2">{title}</AppText>
              </View>
              <IconButton icon={X} label="Close" onPress={onClose} size={18} />
            </View>
          ) : null}
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  sheet: {
    marginTop: 'auto',
    maxHeight: '88%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  handle: { alignSelf: 'center', width: 42, height: 5, borderRadius: 3, marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  content: { gap: 14, paddingBottom: 8 },
});
