import { router, useLocalSearchParams } from 'expo-router';
import { Star } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { RequireAuth } from '@/components/layout';
import { AppText, Badge, Button, Card, Screen, TextField } from '@/components/ui';
import { useTheme, useToast } from '@/providers';
import { tradeService } from '@/services';

export default function TradeReviewScreen() {
  return (
    <RequireAuth>
      <ReviewForm />
    </RequireAuth>
  );
}

function ReviewForm() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const showToast = useToast();
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!feedback.trim()) return showToast('Add a short written review');
    setSubmitting(true);
    await tradeService.submitReview(id, rating, feedback);
    setSubmitting(false);
    showToast('Thanks — your review was submitted');
    router.navigate('/profile');
  }

  return (
    <Screen>
      <Card style={styles.card}>
        <View style={[styles.icon, { backgroundColor: colors.orangeSoft }]}>
          <Star size={36} color={colors.orange} />
        </View>
        <Badge label="Verified completed trade" tone="green" style={styles.center} />
        <AppText variant="h1" align="center">
          How was your trade?
        </AppText>
        <AppText variant="small" align="center">
          Your review helps Filipino traders build trust.
        </AppText>
        <View style={styles.stars} accessibilityLabel="Trade rating">
          {[1, 2, 3, 4, 5].map((value) => (
            <Pressable key={value} accessibilityLabel={`${value} stars`} onPress={() => setRating(value)} hitSlop={4}>
              <Star size={36} color={rating >= value ? colors.yellow : colors.line} fill={rating >= value ? colors.yellow : 'none'} />
            </Pressable>
          ))}
        </View>
        <TextField
          label="Written review"
          multiline
          value={feedback}
          onChangeText={setFeedback}
          placeholder="Describe the item condition, communication, and meetup…"
        />
        <Button label="Submit rating" icon={Star} disabled={!rating} loading={submitting} onPress={() => void submit()} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  icon: { alignSelf: 'center', width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  center: { alignSelf: 'center' },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginVertical: 6 },
});
