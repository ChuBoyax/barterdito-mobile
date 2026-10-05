import { X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/providers/ThemeProvider';
import { AppText } from './AppText';
import { Glass } from './Glass';
import { IconButton } from './IconButton';

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  eyebrow?: string;
  children: ReactNode;
};

export function BottomSheet({ visible, onClose, title, eyebrow, children }: BottomSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={onClose} />
        <Glass strong intensity={60} style={[styles.sheet, { paddingBottom: insets.bottom + 18 }]}>
          <View style={[styles.handle, { backgroundColor: colors.muted2 }]} />
          {title ? (
            <View style={styles.header}>
              <View style={styles.flex}>
                {eyebrow ? <AppText variant="eyebrow">{eyebrow}</AppText> : null}
                <AppText variant="h1">{title}</AppText>
              </View>
              <IconButton icon={X} label="Close" onPress={onClose} size={18} dimension={40} />
            </View>
          ) : null}
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </Glass>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  sheet: { marginTop: 'auto', maxHeight: '88%', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 22, paddingTop: 10 },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, marginBottom: 14, opacity: 0.5 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  content: { gap: 14, paddingBottom: 8 },
});
