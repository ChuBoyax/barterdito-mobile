import { router, Stack, useLocalSearchParams } from 'expo-router';
import { BadgeCheck, Flag, MapPin, MessageCircle, Package, Share2, User, UserCheck, UserPlus } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ItemGrid, ReportSheet, StatGrid } from '@/components/marketplace';
import { ProfileReviews } from '@/components/trades';
import { AppText, Avatar, Button, Card, EmptyState, IconButton, LoadingView, PressableScale, Screen, SectionHeading } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useMountOnOpen } from '@/hooks/useMountOnOpen';
import { queryClient, useAuth, useTheme, useToast } from '@/providers';
import { directMessageService, itemService, userService } from '@/services';
import { errorMessage, firstName as getFirstName } from '@/utils/format';
import { shareTrader } from '@/utils/share';
import { queryKeys } from '@/services/queryKeys';

export default function TraderProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user, requireAuth } = useAuth();
  const showToast = useToast();
  const { data: trader, loading, error, refreshing, reload, setData } = useAsync(queryKeys.profile(id), () => userService.getProfile(id));
  const { data: listings = [], loading: listingsLoading, reload: reloadListings } = useAsync(queryKeys.traderItems(id), () => itemService.getItemsByTrader(id));
  const [reportOpen, setReportOpen] = useState(false);
  const reportMounted = useMountOnOpen(reportOpen);
  const [opening, setOpening] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);

  const available = useMemo(() => listings.filter((item) => item.status !== 'Traded'), [listings]);

  if (loading) return <LoadingView variant="profile" />;
  if (!trader) {
    return (
      <Screen>
        <EmptyState
          icon={User}
          title={error && !/not found/i.test(error) ? 'Could not load this profile' : 'Trader not found'}
          text={error && !/not found/i.test(error) ? error : 'This profile may no longer be public.'}
          action="Browse items"
          onAction={() => router.navigate('/')}
        />
      </Screen>
    );
  }

  const isMe = user?.id === trader.id;
  const firstName = getFirstName(trader.fullName);

  function toggleFollow() {
    requireAuth(async () => {
      if (!trader || followBusy) return;
      const next = !trader.isFollowing;
      setFollowBusy(true);
      try {
        setData(await userService.setFollowing(trader.id, next));
        void queryClient.invalidateQueries({ queryKey: queryKeys.myProfile });
        void queryClient.invalidateQueries({ queryKey: queryKeys.connections() });
        showToast(next ? `Following ${firstName}` : `Unfollowed ${firstName}`);
      } catch (caught) {
        showToast(errorMessage(caught, 'Could not update follow status'));
      } finally {
        setFollowBusy(false);
      }
    });
  }

  function message() {
    requireAuth(async () => {
      setOpening(true);
      try {
        // Opens the one private conversation with this trader, creating it the first time.
        const conversation = await directMessageService.start(trader!.id);
        router.push(`/direct-messages/${conversation.id}`);
      } catch (caught) {
        showToast(errorMessage(caught, 'Could not open a private conversation.'));
      } finally {
        setOpening(false);
      }
    });
  }

  const share = () => void shareTrader({ id: trader.id, name: trader.fullName });

  return (
    <>
      <Stack.Screen
        options={{
          title: trader.fullName,
          headerRight: () => <IconButton icon={Share2} label={`Share ${trader.fullName}'s profile`} size={18} dimension={40} onPress={share} />,
        }}
      />
      <Screen
        refreshing={refreshing}
        onRefresh={() => {
          void reload();
          void reloadListings();
        }}>
        <Card style={styles.hero}>
          <View style={styles.main}>
            <Avatar initials={trader.initials} imageUrl={trader.avatarUrl} size="hero" />
            <View style={styles.flex}>
              <AppText variant="caption" color="green" weight="bold">
                ● Public trader
              </AppText>
              <View style={styles.row}>
                {/* One line always: long names shrink to fit instead of wrapping. */}
                <AppText variant="h1" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5} style={styles.shrink}>
                  {trader.fullName}
                </AppText>
                {trader.emailVerified ? <BadgeCheck size={18} color={colors.blue} fill={colors.blueSoft} accessibilityLabel="Verified email" /> : null}
              </View>
              {trader.location ? (
                <View style={styles.row}>
                  <MapPin size={13} color={colors.muted} />
                  <AppText variant="caption">{trader.location}</AppText>
                </View>
              ) : null}
              {trader.joined ? <AppText variant="caption">Joined {trader.joined}</AppText> : null}
            </View>
          </View>
          {trader.bio ? <AppText variant="small">{trader.bio}</AppText> : null}
          <StatGrid
            variant="inline"
            stats={[
              { label: 'Available', value: trader.activeListingCount },
              { label: 'Traded', value: trader.tradedListingCount },
              { label: 'Followers', value: trader.followersCount },
              { label: 'Following', value: trader.followingCount },
            ]}
          />
          {!isMe ? (
            <View style={styles.actions}>
              <Button
                label={trader.isFollowing ? 'Following' : 'Follow'}
                icon={trader.isFollowing ? UserCheck : UserPlus}
                variant={trader.isFollowing ? 'secondary' : 'primary'}
                loading={followBusy}
                style={styles.flex}
                onPress={toggleFollow}
              />
              <Button label="Message" icon={MessageCircle} variant="secondary" loading={opening} style={styles.flex} onPress={message} />
            </View>
          ) : (
            <Button label="Edit my profile" variant="secondary" onPress={() => router.push('/settings?edit=profile')} />
          )}
        </Card>

        <View>
          <SectionHeading eyebrow={`Listings · ${available.length}`} title="Available for swap" />
          {listingsLoading || available.length ? (
            <ItemGrid items={available} loading={listingsLoading} />
          ) : (
            <EmptyState
              icon={Package}
              title="Nothing listed right now"
              text={isMe ? 'Post an item to see it here.' : `Follow ${firstName} and check back for new listings.`}
            />
          )}
        </View>

        <ProfileReviews userId={trader.id} />

        {!isMe ? (
          <PressableScale onPress={() => requireAuth(() => setReportOpen(true))} style={styles.report}>
            <Flag size={14} color={colors.muted} />
            <AppText variant="caption" weight="bold">
              Report this trader
            </AppText>
          </PressableScale>
        ) : null}

        {reportMounted ? (
          <ReportSheet
            visible={reportOpen}
            title="Report this trader"
            onClose={() => setReportOpen(false)}
            onSubmit={async (reason) => {
              await userService.reportUser(trader.id, reason);
              showToast('Report submitted. Thanks for keeping Barterdito safe.');
            }}
          />
        ) : null}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  hero: { gap: 14 },
  main: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  flex: { flex: 1 },
  shrink: { flexShrink: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actions: { flexDirection: 'row', gap: 10 },
  report: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
});
