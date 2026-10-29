import { router } from 'expo-router';
import { Star } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppText, Avatar, Button, Card, PressableScale, SectionHeading, Stars } from '@/components/ui';
import { usePagedQuery } from '@/hooks/usePagedQuery';
import { useTheme } from '@/providers/ThemeProvider';
import { tradeService } from '@/services';
import type { TradeReview } from '@/types/trades';
import { errorMessage } from '@/utils/format';
import { queryKeys } from '@/services/queryKeys';

const selectReviews = (page: { reviews: TradeReview[]; total: number }) => page.reviews;

/** Reviews from verified completed trades, as shown on the website's profiles. */
export function ProfileReviews({ userId }: { userId: string }) {
  const { colors } = useTheme();
  const query = usePagedQuery(queryKeys.reviews(userId), (offset) => tradeService.getReviews(userId, offset), selectReviews);
  const reviews = query.rows;
  const total = query.firstPage?.total ?? 0;

  return (
    <View style={styles.wrap}>
      <SectionHeading eyebrow={`Verified trade reviews · ${total}`} title="What traders say" />
      {query.isPending ? (
        <AppText variant="caption">Loading reviews…</AppText>
      ) : query.isError ? (
        <Card style={styles.card}>
          <AppText variant="small">{errorMessage(query.error, 'Could not load reviews.')}</AppText>
          <Button label="Retry" variant="secondary" compact onPress={() => void query.refetch()} />
        </Card>
      ) : !reviews.length ? (
        <Card style={styles.empty}>
          <Star size={20} color={colors.muted} />
          <AppText variant="small">No reviews from completed trades yet.</AppText>
        </Card>
      ) : (
        reviews.map((review) => (
          <Card key={review.id} style={styles.card}>
            <PressableScale onPress={() => router.push(`/traders/${review.author.id}`)} scaleTo={0.98} style={styles.row}>
              <Avatar initials={review.author.initials} imageUrl={review.author.avatarUrl} size="small" />
              <View style={styles.flex}>
                <AppText variant="h3">{review.author.fullName}</AppText>
                <View style={styles.row}>
                  <Stars rating={review.rating} size={11} />
                  <AppText variant="caption">· {new Date(review.createdAt).toLocaleDateString('en-PH')}</AppText>
                </View>
              </View>
            </PressableScale>
            <AppText variant="small" color={review.body ? 'ink' : 'muted'}>
              {review.body || 'Rating only'}
            </AppText>
          </Card>
        ))
      )}
      {query.hasNextPage ? (
        <Button label="Load more reviews" variant="secondary" loading={query.isFetchingNextPage} onPress={() => void query.fetchNextPage()} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  card: { gap: 8 },
  empty: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1, gap: 2 },
});
