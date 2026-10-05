import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ArrowRight, Flag, MapPin, Share2, User, UserPlus } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';

import { ItemGrid, ReportSheet, StatGrid } from '@/components/marketplace';
import { AppText, Avatar, Button, Card, EmptyState, LoadingView, Screen, SectionHeading } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useAuth, useTheme, useToast } from '@/providers';
import { itemService, userService } from '@/services';

export default function TraderProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { requireAuth, authenticated } = useAuth();
  const showToast = useToast();
  const { data: trader, loading, error } = useAsync(() => userService.getTrader(id), [id]);
  const { data: listings = [], loading: listingsLoading } = useAsync(() => itemService.getItemsByTrader(id), [id]);
  const [following, setFollowing] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    if (authenticated) void userService.isFollowing(id).then(setFollowing);
  }, [authenticated, id]);

  if (loading) return <LoadingView />;
  if (!trader || error) {
    return (
      <Screen>
        <EmptyState icon={User} title="Trader not found" text="This profile may no longer be public." />
      </Screen>
    );
  }

  function toggleFollow() {
    requireAuth(() => {
      const next = !following;
      setFollowing(next);
      void userService.setFollowing(id, next);
      showToast(next ? 'Trader followed' : 'Trader unfollowed');
    });
  }

  return (
    <>
      <Stack.Screen options={{ title: trader.name }} />
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
          <Button
            label={following ? 'Following' : 'Follow'}
            icon={UserPlus}
            variant={following ? 'secondary' : 'primary'}
            onPress={toggleFollow}
          />
          <StatGrid
            variant="inline"
            stats={[
              { label: 'Completed', value: trader.trades },
              { label: 'Active listings', value: listings.length },
              { label: 'Avg rating', value: trader.rating ? `${trader.rating}★` : '—' },
            ]}
          />
          <View style={styles.actions}>
            <Button label="Propose" icon={ArrowRight} variant="secondary" compact style={styles.flex} onPress={() => requireAuth(() => router.push('/post-item'))} />
            <Button
              label="Share"
              icon={Share2}
              variant="secondary"
              compact
              style={styles.flex}
              onPress={() => void Share.share({ message: `${trader.name} on Barterdito — https://barterdito.ph/traders/${trader.id}` })}
            />
            <Button label="Report" icon={Flag} variant="danger" compact style={styles.flex} onPress={() => setReportOpen(true)} />
          </View>
        </Card>

        <View>
          <SectionHeading eyebrow="Listings" title={`${trader.name}’s listings`} />
          {listingsLoading || listings.length ? (
            <ItemGrid items={listings} loading={listingsLoading} />
          ) : (
            <AppText variant="small">No active listings right now.</AppText>
          )}
        </View>

        <Card style={styles.review}>
          <View style={styles.row}>
            <Avatar initials="BD" size="small" />
            <View>
              <AppText variant="h3">Recent review</AppText>
              <AppText variant="caption">★★★★★ · Verified trade</AppText>
            </View>
          </View>
          <AppText variant="small" color="ink">
            Clear communication, accurate item details, and easy to coordinate with.
          </AppText>
        </Card>

        <ReportSheet
          visible={reportOpen}
          title="Report this trader"
          onClose={() => setReportOpen(false)}
          onSubmit={async (reason) => {
            await userService.reportUser(trader.id, reason);
            showToast('User report submitted');
          }}
        />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  hero: { gap: 12 },
  main: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actions: { flexDirection: 'row', gap: 8 },
  review: { gap: 10 },
});
