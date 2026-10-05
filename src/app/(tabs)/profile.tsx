import { router } from 'expo-router';
import {
  Activity,
  ArrowRightLeft,
  BadgeCheck,
  Bookmark,
  ChevronRight,
  Edit3,
  Gift,
  LogOut,
  MapPin,
  QrCode,
  Settings,
  Share2,
  Star,
  type LucideIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeaderActions, RequireAuth } from '@/components/layout';
import { StatGrid } from '@/components/marketplace';
import { AppText, Avatar, Button, Card, EmptyState, IconTile, ListRow, PressableScale, ProgressBar, Screen, SegmentedControl, Stars } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useResponsive } from '@/hooks/useResponsive';
import { useSignOut } from '@/hooks/useSignOut';
import { useAuth, useTheme } from '@/providers';
import { userService } from '@/services';
import { elevation, fonts, type Tone, maxFontScale } from '@/theme';
import type { User } from '@/types/models';
import { pluralize } from '@/utils/format';
import { shareTrader } from '@/utils/share';

type Tab = 'history' | 'reviews';

const PREVIEW_COUNT = 3;
const HEADER_ROW = 44;


function nextProfileStep(user: User): string {
  if (!user.avatarUrl) return 'Add a profile photo so traders recognise you.';
  if (!user.bio?.trim()) return 'Write a short bio about what you like to trade.';
  if (!user.location?.trim()) return 'Add your city to appear in nearby searches.';
  return 'Verify your phone number to earn a trust badge.';
}

export default function ProfileScreen() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}

function ProfileContent() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { gutter } = useResponsive();
  const pad = { paddingHorizontal: gutter };
  const { user } = useAuth();
  const signOut = useSignOut();
  const [tab, setTab] = useState<Tab>('history');
  const { data: stats } = useAsync(['userService.getProfileStats'], () => userService.getProfileStats());
  const { data: history = [] } = useAsync(['userService.getTradeHistory'], () => userService.getTradeHistory());
  const { data: reviews = [] } = useAsync(['userService.getReviews'], () => userService.getReviews());

  if (!user) return null;

  const share = () => void shareTrader({ id: user.id, name: user.fullName });
  const averageRating = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  const strengthDone = (stats?.profileStrength ?? 100) >= 100;

  return (
    <Screen padded={false} contentStyle={styles.content}>
      {/* Cover is tall enough that the avatar sits below the header row instead of colliding with it. */}
      <View style={[styles.cover, pad, { backgroundColor: colors.orangeSoft, paddingTop: insets.top + 8, height: insets.top + 8 + HEADER_ROW + 100 }]}>
        <View style={styles.coverTop}>
          <Text maxFontSizeMultiplier={maxFontScale} style={[styles.coverLabel, { color: colors.orange }]}>MY PROFILE</Text>
          <HeaderActions />
        </View>
      </View>

      <View style={pad}>
        <Card style={[styles.identity, elevation(3, colors)]}>
          <PressableScale accessibilityRole="button" accessibilityLabel="Edit profile" onPress={() => router.push('/settings?edit=profile')} scaleTo={0.96} style={styles.avatarWrap}>
            <Avatar initials={user.initials} imageUrl={user.avatarUrl} size="hero" ring />
          </PressableScale>
          <View style={styles.nameRow}>
            <AppText variant="h1" align="center">
              {user.fullName}
            </AppText>
            <BadgeCheck size={20} color={colors.blue} fill={colors.blueSoft} accessibilityLabel="Verified" />
          </View>
          <View style={styles.row}>
            <MapPin size={13} color={colors.muted} />
            <AppText variant="caption">
              {user.location} · Joined {user.joined}
            </AppText>
          </View>
          {user.bio ? (
            <AppText variant="small" align="center" style={styles.bio}>
              {user.bio}
            </AppText>
          ) : null}
          {stats ? (
            <StatGrid
              variant="inline"
              stats={[
                { label: 'Trades', value: stats.totalTrades, onPress: () => setTab('history') },
                { label: 'Rating', value: `${stats.rating}★`, onPress: () => setTab('reviews') },
                { label: 'Followers', value: stats.followers, onPress: () => router.push('/followers?tab=followers') },
                { label: 'Following', value: stats.following, onPress: () => router.push('/followers?tab=following') },
              ]}
            />
          ) : null}
          <View style={styles.buttons}>
            <Button label="Edit profile" icon={Edit3} compact style={styles.flex} onPress={() => router.push('/settings?edit=profile')} />
            <Button label="Share profile" icon={Share2} variant="secondary" compact style={styles.flex} onPress={share} />
          </View>
        </Card>
      </View>

      {stats && !strengthDone ? (
        <View style={pad}>
          <Card onPress={() => router.push('/settings?edit=profile')} accessibilityLabel={`Profile ${stats.profileStrength}% complete`} style={styles.strength}>
            <View style={styles.row}>
              <View style={styles.flex}>
                <AppText variant="h3">Profile {stats.profileStrength}% complete</AppText>
                <AppText variant="caption">{nextProfileStep(user)}</AppText>
              </View>
              <ChevronRight size={18} color={colors.muted} />
            </View>
            <ProgressBar value={stats.profileStrength} />
          </Card>
        </View>
      ) : null}

      <View style={[pad, styles.quick]}>
        <QuickAction icon={QrCode} label="My QR" tone="blue" onPress={() => router.push('/qr')} />
        <QuickAction icon={Gift} label="Invite" tone="yellow" onPress={() => router.push('/referral')} />
        <QuickAction icon={Bookmark} label="Wishlist" tone="red" onPress={() => router.push('/wishlist')} />
        <QuickAction icon={Activity} label="Activity" tone="violet" onPress={() => router.push('/activity')} />
      </View>

      <View style={[pad, styles.section]}>
        <SegmentedControl<Tab>
          value={tab}
          onChange={setTab}
          segments={[
            { value: 'history', label: 'Trade history', count: history.length || undefined },
            { value: 'reviews', label: 'Reviews', count: reviews.length || undefined },
          ]}
        />

        {tab === 'history' ? (
          history.length ? (
            <Card style={styles.listCard}>
              {history.slice(0, PREVIEW_COUNT).map((entry, index) => (
                <View
                  key={entry.id}
                  style={[styles.historyRow, index > 0 && { borderTopColor: colors.hairline, borderTopWidth: StyleSheet.hairlineWidth }]}>
                  <IconTile icon={ArrowRightLeft} size={40} rounded />
                  <View style={styles.flex}>
                    <AppText variant="h3" numberOfLines={1}>
                      {entry.title}
                    </AppText>
                    <AppText variant="caption" numberOfLines={1}>
                      with {entry.partner} · {entry.date}
                    </AppText>
                  </View>
                  <View style={styles.ratingPill}>
                    <Star size={12} color={colors.yellow} fill={colors.yellow} />
                    <AppText variant="caption" color="ink" weight="bold">
                      {entry.rating.toFixed(1)}
                    </AppText>
                  </View>
                </View>
              ))}
              {history.length > PREVIEW_COUNT ? (
                <SeeAll label={`See all ${history.length} trades`} onPress={() => router.push('/activity')} />
              ) : null}
            </Card>
          ) : (
            <EmptyState icon={ArrowRightLeft} title="No trades yet" text="Your completed swaps will appear here." action="Browse items" onAction={() => router.navigate('/')} />
          )
        ) : reviews.length ? (
          <Card style={styles.listCard}>
            <View style={styles.summary}>
              <AppText variant="hero">{averageRating.toFixed(1)}</AppText>
              <View style={styles.flex}>
                <Stars rating={averageRating} size={15} />
                <AppText variant="caption">
                  Based on {pluralize(reviews.length, 'review')}
                </AppText>
              </View>
            </View>
            {reviews.slice(0, PREVIEW_COUNT).map((review) => (
              <View key={review.id} style={[styles.review, { borderTopColor: colors.hairline }]}>
                <View style={styles.row}>
                  <Avatar initials={review.initials} size="small" />
                  <View style={styles.flex}>
                    <AppText variant="h3">{review.author}</AppText>
                    <View style={styles.row}>
                      <Stars rating={review.rating} size={11} />
                      <AppText variant="caption">· {review.date}</AppText>
                    </View>
                  </View>
                </View>
                <AppText variant="small" color="ink">
                  {review.text}
                </AppText>
              </View>
            ))}
          </Card>
        ) : (
          <EmptyState icon={Star} title="No reviews yet" text="Traders can review you after a completed swap." />
        )}

        <Card style={styles.listCard}>
          <ListRow icon={Settings} title="Settings" subtitle="Account, notifications, privacy and help" onPress={() => router.push('/settings')} />
          <ListRow icon={LogOut} iconTone="red" title="Sign out" showChevron={false} onPress={() => void signOut()} />
        </Card>
      </View>
    </Screen>
  );
}

function SeeAll({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <PressableScale accessibilityRole="button" onPress={onPress} style={[styles.seeAll, { borderTopColor: colors.hairline }]}>
      <AppText variant="small" color="orange" weight="bold">
        {label}
      </AppText>
      <ChevronRight size={15} color={colors.orange} />
    </PressableScale>
  );
}

function QuickAction({ icon, label, tone, onPress }: { icon: LucideIcon; label: string; tone: Tone; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      scaleTo={0.94}
      style={[styles.action, { backgroundColor: colors.surface, borderColor: colors.hairline }, elevation(1, colors)]}>
      <IconTile icon={icon} tone={tone} size={42} />
      <AppText variant="caption" color="ink" weight="bold" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
        {label}
      </AppText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  content: { gap: 16, paddingTop: 0 },
  flex: { flex: 1 },
  cover: { overflow: 'hidden' },
  coverTop: { height: HEADER_ROW, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  coverLabel: { fontFamily: fonts.extrabold, fontSize: 12, letterSpacing: 2 },
  identity: { marginTop: -40, alignItems: 'center', gap: 8, paddingTop: 0 },
  avatarWrap: { marginTop: -52 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bio: { maxWidth: 300, marginBottom: 6 },
  buttons: { flexDirection: 'row', gap: 10, alignSelf: 'stretch', marginTop: 6 },
  strength: { gap: 12 },
  quick: { flexDirection: 'row', gap: 10 },
  action: { flex: 1, alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 22, paddingVertical: 14 },
  section: { gap: 14 },
  listCard: { paddingVertical: 4 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  ratingPill: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10 },
  review: { gap: 8, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth },
  seeAll: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth },
});
