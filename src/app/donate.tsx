import { router } from 'expo-router';
import { HandHeart, Lock } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { HeroBanner } from '@/components/marketplace';
import { AppText, Button, Card, Screen, TextField } from '@/components/ui';
import { useAuth, useTheme, useToast } from '@/providers';
import { paymentService } from '@/services';
import { errorMessage, formatPeso } from '@/utils/format';

const amounts = [50, 100, 200, 500, 1000];

export default function DonateScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const showToast = useToast();
  const [amount, setAmount] = useState(100);
  const [name, setName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [processing, setProcessing] = useState(false);

  async function checkout() {
    setProcessing(true);
    try {
      const receipt = await paymentService.startDonation({ amount, name, email });
      router.replace({ pathname: '/payment-receipt', params: { ...receipt, amount: String(receipt.amount) } });
    } catch (error) {
      showToast(errorMessage(error, 'Could not start checkout'));
    } finally {
      setProcessing(false);
    }
  }

  return (
    <Screen>
      <HeroBanner
        badge="Community supported"
        badgeTone="green"
        tint="green"
        icon={HandHeart}
        title="Help local trading stay open to everyone."
        text="Your support funds safety tools, community events, and better ways to keep useful things in circulation.">
        <View style={styles.row}>
          <AppText variant="h2">12,482</AppText>
          <AppText variant="caption">traders supported</AppText>
        </View>
      </HeroBanner>
      <Card style={styles.form}>
        <AppText variant="h2">Choose an amount</AppText>
        <View style={styles.amounts}>
          {amounts.map((value) => {
            const active = value === amount;
            return (
              <Pressable
                key={value}
                onPress={() => setAmount(value)}
                style={[styles.amount, { borderColor: active ? colors.orange : colors.line, backgroundColor: active ? colors.orangeSoft : colors.surface }]}>
                <AppText variant="h3" color={active ? 'orange' : 'ink'}>
                  {formatPeso(value)}
                </AppText>
              </Pressable>
            );
          })}
        </View>
        <TextField label="Your name" value={name} onChangeText={setName} placeholder="John Ramirez" />
        <TextField label="Email receipt" value={email} onChangeText={setEmail} placeholder="john@example.com" keyboardType="email-address" autoCapitalize="none" />
        <View style={styles.methods}>
          {['Card', 'GCash', 'Maya'].map((method) => (
            <View key={method} style={[styles.method, { backgroundColor: colors.surface2 }]}>
              <AppText variant="caption" color="ink" weight="bold">
                {method}
              </AppText>
            </View>
          ))}
        </View>
        <Button label={processing ? 'Opening secure checkout…' : `Donate ${formatPeso(amount)}`} loading={processing} onPress={() => void checkout()} />
        <View style={[styles.row, styles.center]}>
          <Lock size={12} color={colors.muted} />
          <AppText variant="caption">Secure checkout powered by PayMongo</AppText>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  center: { justifyContent: 'center' },
  form: { gap: 14 },
  amounts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amount: { flexBasis: '30%', flexGrow: 1, alignItems: 'center', borderWidth: 1.5, borderRadius: 12, paddingVertical: 12 },
  methods: { flexDirection: 'row', gap: 8 },
  method: { flex: 1, alignItems: 'center', borderRadius: 10, paddingVertical: 9 },
});
