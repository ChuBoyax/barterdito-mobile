import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle2, Compass } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppText, Badge, Button, Card, Screen } from '@/components/ui';
import { useTheme } from '@/providers';
import { formatPeso } from '@/utils/format';

export default function PaymentReceiptScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ amount?: string; method?: string; date?: string; reference?: string }>();
  const rows = [
    ['Amount', params.amount ? formatPeso(Number(params.amount)) : 'See PayMongo receipt'],
    ['Method', params.method ?? 'PayMongo checkout'],
    ['Date', params.date ?? new Date().toLocaleDateString('en-PH')],
    ['Reference', params.reference ?? '—'],
  ];

  return (
    <Screen>
      <Card style={styles.card}>
        <View style={[styles.icon, { backgroundColor: colors.greenSoft }]}>
          <CheckCircle2 size={46} color={colors.green} />
        </View>
        <Badge label="Checkout returned successfully" tone="green" style={styles.center} />
        <AppText variant="h1" align="center">
          Thank you for supporting Barterdito.
        </AppText>
        <AppText variant="small" align="center">
          PayMongo will also send the official payment confirmation. Final payment status is verified by a signed webhook before being recorded as paid.
        </AppText>
        <View style={[styles.summary, { backgroundColor: colors.surface2 }]}>
          {rows.map(([label, value]) => (
            <View key={label} style={styles.row}>
              <AppText variant="caption">{label}</AppText>
              <AppText variant="h3">{value}</AppText>
            </View>
          ))}
        </View>
        <Button label="Browse more items" icon={Compass} onPress={() => router.navigate('/')} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  icon: { alignSelf: 'center', width: 86, height: 86, borderRadius: 43, alignItems: 'center', justifyContent: 'center' },
  center: { alignSelf: 'center' },
  summary: { borderRadius: 14, padding: 14, gap: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
