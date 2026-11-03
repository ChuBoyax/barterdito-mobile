import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { useTheme } from '@/providers';

type CheckRowProps = {
  title: string;
  subtitle?: string;
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
};

export function CheckRow({ title, subtitle, checked, disabled, onToggle }: CheckRowProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={title}
      disabled={disabled}
      onPress={onToggle}
      style={[styles.row, disabled && styles.disabled]}>
      <View style={[styles.box, { borderColor: checked ? colors.orange : colors.muted2, backgroundColor: checked ? colors.orange : 'transparent' }]}>
        {checked ? <Check size={14} color={colors.onPrimary} strokeWidth={3} /> : null}
      </View>
      <View style={styles.flex}>
        <AppText variant="small" color="ink" weight="semibold">
          {title}
        </AppText>
        {subtitle ? <AppText variant="caption">{subtitle}</AppText> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 6 },
  disabled: { opacity: 0.55 },
  box: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  flex: { flex: 1 },
});
