import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Flag, MapPin, MessageCircle, Package, Share2, User, UserCheck, UserPlus } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ItemGrid, ReportSheet, StatGrid } from '@/components/marketplace';
import { AppText, Avatar, Button, Card, EmptyState, IconButton, LoadingView, PressableScale, Screen, SectionHeading, Stars } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useAuth, useTheme, useToast } from '@/providers';
import { itemService, messageService, userService } from '@/services';
import { firstName as getFirstName } from '@/utils/format';
import { shareTrader } from '@/utils/share';

export default function TraderProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user, requireAuth, authenticated } = useAuth();
  const showToast = useToast();
  const { data: trader, loading, error } = useAsync(['userService.getTrader', id], () => userService.getTrader(id));
  const { data: listings = [], loading: listingsLoading } = useAsync(['itemService.getItemsByTrader', id], () => itemService.getItemsByTrader(id));
  const { data: reviews = [] } = useAsync(['userService.getReviews'], () => userService.getReviews());
  const [following, setFollowing] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [opening, setOpening] = useState(false);

  const available = useMemo(() => listings.filter((item) => item.status !== 'Traded'), [listings]);

  useEffect(() => {
    if (authenticated) void userService.isFollowing(id).then(setFollowing);
  }, [authenticated, id]);

  if (loading) return <LoadingView variant="profile" />;
  if (!trader || error) {
    return (
      <Screen>
        <EmptyState
          icon={User}
          title="Trader not found"
          text="This profile may no longer be public."
          action="Browse items"
          onAction={() => router.navigate('/')}
        />
      </Screen>
    );
  }

  const isMe = user?.id === trader.id;
  const firstName = getFirstName(trader.name);

  function toggleFollow() {
    requireAuth(() => {
      const next = !following;
      setFollowing(next);
      void userService.setFollowing(id, next);
      showToast(next ? `Following ${firstName}` : `Unfollowed ${firstName}`);
    });
  }

  function message() {
    requireAuth(async () => {
      setOpening(true);
      try {
        const threadId = await messageService.openDirectThread(trader!.name, trader!.initials);
        router.push(`/direct-messages/${threadId}`);
      } catch {
        showToast('Could not open the chat. Please try again.');
      } finally {
        setOpening(false);
      }
    });
  }

  const share = () => void shareTrader(trader);

  return (
    <>
      <Stack.Screen
        options={{
          title: trader.name,
          headerRight: () => <IconButton icon={Share2} label={`Share ${trader.name}'s profile`} size={18} dimension={40} onPress={share} />,
        }}
      />
      <Screen>
        <Card style={styles.hero}>
          <View style={styles.main}>
            <Avatar initials={trader.initials} color={trader.color} imageUrl={trader.avatarUrl} size="hero" />
            <View style={styles.flex}>
              <AppText variant="caption" color="green" weight="bold">
                ● Public trader
              </AppText>
              <AppText variant="h1">{trader.name}</AppText>
              {trader.location ? (
                <View style={styles.row}>
                  <MapPin size={13} color={colors.muted} />
                  <AppText variant="caption">{trader.location}</AppText>
                </View>
              ) : null}
            </View>
          </View>
          <AppText variant="small">Local Barterdito member offering useful finds and open to fair community swaps.</AppText>
          <StatGrid
            variant="inline"
            stats={[
              { label: 'Completed', value: trader.trades },
              { label: 'Available', value: available.length },
              { label: 'Avg rating', value: trader.rating ? `${trader.rating}★` : '—' },
            ]}
          />
          {!isMe ? (
            <View style={styles.actions}>
              <Button
                label={following ? 'Following' : 'Follow'}
                icon={following ? UserCheck : UserPlus}
                variant={following ? 'secondary' : 'primary'}
                style={styles.flex}
                onPress={toggleFollow}
              />
              <Button label="Message" icon={MessageCircle} variant="secondary" loading={opening} style={styles.flex} onPress={message} />
            </View>
          ) : null}
        </Card>

        <View>
          <SectionHeading eyebrow={`Listings · ${available.length}`} title="Available for swap" />
          {listingsLoading || available.length ? (
            <ItemGrid items={available} loading={listingsLoading} />
          ) : (
            <EmptyState
              icon={Package}
              title="Nothing listed right now"
              text={following ? `We'll let you know when ${firstName} posts something new.` : `Follow ${firstName} to get notified about new listings.`}
            />
          )}
        </View>

        {reviews.length ? (
          <View>
            <SectionHeading eyebrow="Reviews" title="What traders say" />
            <View style={styles.reviews}>
              {reviews.slice(0, 2).map((review) => (
                <Card key={review.id} style={styles.review}>
                  <View style={styles.row}>
                    <Avatar initials={review.initials} size="small" />
                    <View style={styles.flex}>
                      <AppText variant="h3">{review.author}</AppText>
                      <View style={styles.stars}>
                        <Stars rating={review.rating} />
                        <AppText variant="caption">· {review.date}</AppText>
                      </View>
                    </View>
                  </View>
                  <AppText variant="small" color="ink">
                    {review.text}
                  </AppText>
                </Card>
              ))}
            </View>
          </View>
        ) : null}

        {!isMe ? (
          <PressableScale onPress={() => requireAuth(() => setReportOpen(true))} style={styles.report}>
            <Flag size={14} color={colors.muted} />
            <AppText variant="caption" weight="bold">
              Report this trader
            </AppText>
          </PressableScale>
        ) : null}

        <ReportSheet
          visible={reportOpen}
          title="Report this trader"
          onClose={() => setReportOpen(false)}
          onSubmit={async (reason) => {
            await userService.reportUser(trader.id, reason);
            showToast('Report submitted. Thanks for keeping Barterdito safe.');
          }}
        />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  hero: { gap: 14 },
  main: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stars: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 10 },
  reviews: { gap: 10 },
  review: { gap: 10 },
  report: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
});
