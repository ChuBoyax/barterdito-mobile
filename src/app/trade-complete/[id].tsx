import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle2, Compass, Star } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { RequireAuth } from '@/components/layout';
import { SwapPreview } from '@/components/marketplace';
import { AppText, Badge, Button, Card, LoadingView, Screen } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useTheme } from '@/providers';
import { tradeService } from '@/services';
import { firstName } from '@/utils/format';


export default function TradeCompleteScreen() {
  return (
    <RequireAuth>
      <TradeComplete />
    </RequireAuth>
  );
}

function TradeComplete() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { data: offer, loading } = useAsync(() => tradeService.getOffer(id), [id]);
  const confetti = [colors.orange, colors.blue, colors.green, colors.yellow, colors.red, colors.violet];
  if (loading) return <LoadingView />;

  return (
    <Screen>
      <Card style={styles.card}>
        <View style={styles.confetti} pointerEvents="none">
          {Array.from({ length: 18 }, (_, index) => (
            <View
              key={index}
              style={[
                styles.piece,
                {
                  backgroundColor: confetti[index % confetti.length],
                  left: `${(index * 37) % 100}%`,
                  top: (index * 23) % 90,
                  transform: [{ rotate: `${index * 29}deg` }],
                },
              ]}
            />
          ))}
        </View>
        <View style={[styles.icon, { backgroundColor: colors.greenSoft }]}>
          <CheckCircle2 size={44} color={colors.green} />
        </View>
        <Badge label="Trade completed" tone="green" style={styles.center} />
        <AppText variant="h1" align="center">
          Successful swap, ka-barter!
        </AppText>
        <AppText variant="small" align="center">
          Both traders confirmed the exchange. Your 7-day post-trade support window starts now.
        </AppText>
        {offer ? (
          <SwapPreview
            theirs={offer.theirs}
            yours={offer.yours}
            theirsLabel={`${firstName(offer.person)} traded`}
            yoursLabel="You traded"
          />
        ) : null}
        <Button label="Rate Your Trade" icon={Star} onPress={() => router.push(`/trade-review/${id}`)} />
        <Button label="Browse More Items" icon={Compass} variant="secondary" onPress={() => router.navigate('/')} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12, overflow: 'hidden', paddingTop: 40 },
  confetti: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  piece: { position: 'absolute', width: 8, height: 14, borderRadius: 2 },
  icon: { alignSelf: 'center', width: 86, height: 86, borderRadius: 43, alignItems: 'center', justifyContent: 'center' },
  center: { alignSelf: 'center' },
});
