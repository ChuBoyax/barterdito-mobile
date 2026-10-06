import type { LucideIcon } from 'lucide-react-native';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/providers/ThemeProvider';
import { AppText } from './AppText';
import { IconTile } from './IconTile';

export type ActionSheetOption = {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
  description?: string;
  destructive?: boolean;
};

type ActionSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  options: ActionSheetOption[];
};


export function ActionSheet({ visible, onClose, title, subtitle, options }: ActionSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  function select(option: ActionSheetOption) {
    onClose();
   
    setTimeout(option.onPress, 180);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable accessibilityLabel="Close menu" style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 12 }]}>
        <View style={[styles.handle, { backgroundColor: colors.muted2 }]} />
        {title ? (
          <View style={styles.header}>
            <AppText variant="h2" numberOfLines={1}>
              {title}
            </AppText>
            {subtitle ? (
              <AppText variant="caption" numberOfLines={1}>
                {subtitle}
              </AppText>
            ) : null}
          </View>
        ) : null}
        <View style={styles.options}>
          {options.map((option, index) => (
            <View key={option.label}>
              {option.destructive && index > 0 ? <View style={[styles.divider, { backgroundColor: colors.hairline }]} /> : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={option.label}
                onPress={() => select(option)}
                style={({ pressed }) => [styles.option, pressed && { backgroundColor: colors.surface2 }]}>
                <IconTile icon={option.icon} tone={option.destructive ? 'red' : 'neutral'} size={38} />
                <View style={styles.flex}>
                  <AppText variant="h3" color={option.destructive ? 'red' : 'ink'}>
                    {option.label}
                  </AppText>
                  {option.description ? <AppText variant="caption">{option.description}</AppText> : null}
                </View>
              </Pressable>
            </View>
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={onClose}
          style={({ pressed }) => [styles.cancel, { backgroundColor: pressed ? colors.line : colors.surface2 }]}>
          <AppText variant="h3">Cancel</AppText>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 1 },
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: { width: '100%', maxWidth: 640, alignSelf: 'center', marginTop: 'auto', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 14, paddingTop: 10 },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, marginBottom: 12, opacity: 0.5 },
  header: { paddingHorizontal: 8, paddingBottom: 10, gap: 2 },
  options: { paddingBottom: 10 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 16, paddingHorizontal: 8, paddingVertical: 10 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 6, marginHorizontal: 8 },
  cancel: { height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
