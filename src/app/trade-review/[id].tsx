import { useLocalSearchParams } from 'expo-router';
import { Star } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { RequireAuth } from '@/components/layout';
import { WorkflowScreen } from '@/components/trades/WorkflowScreen';
import { AppText, Badge, Button, Card, Stars, TextField } from '@/components/ui';
import type { TradeConversationState } from '@/hooks/useTradeConversation';
import { useTheme, useToast } from '@/providers';
import { tradeService } from '@/services';

export default function TradeReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <RequireAuth>
      <WorkflowScreen id={id}>
        {(state, userId) => <ReviewSection state={state} userId={userId} />}
      </WorkflowScreen>
    </RequireAuth>
  );
}

function ReviewSection({ state, userId }: { state: TradeConversationState; userId: string }) {
  const { colors } = useTheme();
  const showToast = useToast();
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const data = state.data!;
  const own = data.reviews.find((entry) => entry.author.id === userId);

  async function submit() {
    if (await state.act(() => tradeService.review(data.offer.id, rating, body))) showToast('Thanks — your review was saved');
  }

  return (
    <>
      {data.status !== 'completed' ? (
        <Card>
          <AppText variant="small">Reviews are available after both traders confirm the exchange.</AppText>
        </Card>
      ) : own ? (
        <Card style={styles.card}>
          <Badge label="Your review is saved" tone="green" />
          <Stars rating={own.rating} size={18} />
          {own.body ? <AppText variant="small" color="ink">{own.body}</AppText> : null}
        </Card>
      ) : (
        <Card style={styles.card}>
          <Badge label="Verified completed trade" tone="green" style={styles.center} />
          <AppText variant="h2" align="center">
            How was your trade?
          </AppText>
          <AppText variant="small" align="center">
            Your review will appear on the other trader’s public profile.
          </AppText>
          <View style={styles.stars} accessibilityLabel="Trade rating">
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityLabel={`${value} stars`}
                accessibilityState={{ selected: rating === value }}
                onPress={() => setRating(value)}
                hitSlop={4}>
                <Star size={36} color={rating >= value ? colors.yellow : colors.line} fill={rating >= value ? colors.yellow : 'none'} />
              </Pressable>
            ))}
          </View>
          <TextField
            label="Written review (optional)"
            multiline
            value={body}
            onChangeText={setBody}
            maxLength={2000}
            placeholder="Describe the item condition, communication, and meetup…"
          />
          <Button label="Submit review" icon={Star} disabled={!rating} loading={state.busy} onPress={() => void submit()} />
        </Card>
      )}
      {data.reviews.length ? (
        <Card style={styles.card}>
          <AppText variant="h3">Trade reviews</AppText>
          {data.reviews.map((entry) => (
            <View key={entry.id} style={styles.review}>
              <AppText variant="small" color="ink" weight="bold">
                {entry.author.fullName} · {entry.rating}/5
              </AppText>
              {entry.body ? <AppText variant="small">{entry.body}</AppText> : null}
            </View>
          ))}
        </Card>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  center: { alignSelf: 'center' },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginVertical: 6 },
  review: { gap: 2 },
});
