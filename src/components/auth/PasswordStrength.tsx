import { Check, Circle } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { useTheme } from '@/providers';
import type { ThemeColors } from '@/theme';
import { passwordRules, passwordStrength } from '@/utils/validation';

const scoreColor: Record<number, keyof ThemeColors> = { 1: 'red', 2: 'warning', 3: 'blue', 4: 'green' };

/** Live strength meter and rule checklist shown under a new-password field. */
export function PasswordStrength({ password, rejected }: { password: string; rejected?: boolean }) {
  const { colors } = useTheme();
  const { score, label } = passwordStrength(password, rejected);
  const tint = scoreColor[score] ?? 'muted';
  return (
    <View style={styles.wrap} accessibilityLiveRegion="polite" accessibilityLabel={`Password strength: ${label || 'none'}`}>
      <View style={styles.meterRow}>
        <View style={styles.meter}>
          {[1, 2, 3, 4].map((step) => (
            <View key={step} style={[styles.segment, { backgroundColor: step <= score ? colors[tint] : colors.surface2 }]} />
          ))}
        </View>
        <AppText variant="caption" weight="bold" color={tint} style={styles.label}>
          {label}
        </AppText>
      </View>
      <View style={styles.rules}>
        {passwordRules(password).map((rule) => (
          <View key={rule.key} style={styles.rule}>
            {rule.met ? <Check size={13} color={colors.green} strokeWidth={2.6} /> : <Circle size={11} color={colors.muted2} strokeWidth={2.2} />}
            <AppText variant="caption" color={rule.met ? 'green' : 'muted'} weight={rule.met ? 'semibold' : 'medium'}>
              {rule.label}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10, paddingHorizontal: 4 },
  meterRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  meter: { flex: 1, flexDirection: 'row', gap: 5 },
  segment: { flex: 1, height: 5, borderRadius: 3 },
  label: { minWidth: 48, textAlign: 'right' },
  rules: { gap: 5 },
  rule: { flexDirection: 'row', alignItems: 'center', gap: 7 },
});
