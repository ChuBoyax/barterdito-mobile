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
  Package,
  Share2,
  type LucideIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeaderActions, RequireAuth } from '@/components/layout';
import { ItemGrid, StatGrid } from '@/components/marketplace';
import { ProfileReviews } from '@/components/trades';
import { AppText, Avatar, Button, Card, EmptyState, IconTile, ListRow, PressableScale, ProgressBar, Screen, SegmentedControl } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useResponsive } from '@/hooks/useResponsive';
import { useSignOut } from '@/hooks/useSignOut';
import { useAuth, useTheme } from '@/providers';
import { itemService, userService } from '@/services';
import { profileCompletion } from '@/services/userService';
import { elevation, fonts, type Tone, maxFontScale } from '@/theme';
import type { Profile } from '@/types/models';
import { pluralize } from '@/utils/format';
import { shareTrader } from '@/utils/share';
import { queryKeys } from '@/services/queryKeys';

type Tab = 'active' | 'traded';

const PREVIEW_COUNT = 4;
const HEADER_ROW = 44;

function nextProfileStep(profile: Profile): string {
  if (!profile.avatarUrl) return 'Add a profile photo so traders recognise you.';
  if (!profile.bio.trim()) return 'Write a short bio about what you like to trade.';
  if (!profile.location.trim()) return 'Add your city or barangay so nearby traders can find you.';
  return 'Verify your email address to finish your profile.';
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
  const [tab, setTab] = useState<Tab>('active');
  const { data: profile, refreshing, reload } = useAsync(queryKeys.myProfile, () => userService.getMyProfile());
  const { data: listings = [], loading: listingsLoading, reload: reloadListings } = useAsync(queryKeys.myItems, () => itemService.getMyItems());

  if (!user) return null;

  const share = () => void shareTrader({ id: user.id, name: user.fullName });
  const strength = profile ? profileCompletion(profile) : 100;
  const traded = listings.filter((item) => item.status === 'Traded');
  const open = listings.filter((item) => item.status !== 'Traded');
  const visible = tab === 'active' ? open : traded;
  const place = profile?.location || user.location;
  const joined = profile?.joined || user.joined;

  return (
    <Screen
      padded={false}
      contentStyle={styles.content}
      refreshing={refreshing}
      onRefresh={() => {
        void reload();
        void reloadListings();
      }}>
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
            {(profile?.emailVerified ?? user.emailVerified) ? (
              <BadgeCheck size={20} color={colors.blue} fill={colors.blueSoft} accessibilityLabel="Verified email" />
            ) : null}
          </View>
          <View style={styles.row}>
            {place ? <MapPin size={13} color={colors.muted} /> : null}
            <AppText variant="caption">{[place, joined ? `Joined ${joined}` : ''].filter(Boolean).join(' · ')}</AppText>
          </View>
          {user.bio ? (
            <AppText variant="small" align="center" style={styles.bio}>
              {user.bio}
            </AppText>
          ) : null}
          {profile ? (
            <StatGrid
              variant="inline"
              stats={[
                { label: 'Listings', value: profile.listingCount, onPress: () => setTab('active') },
                { label: 'Traded', value: profile.tradedListingCount, onPress: () => setTab('traded') },
                { label: 'Followers', value: profile.followersCount, onPress: () => router.push('/followers?tab=followers') },
                { label: 'Following', value: profile.followingCount, onPress: () => router.push('/followers?tab=following') },
              ]}
            />
          ) : null}
          {profile ? (
            <AppText variant="caption" align="center">
              {pluralize(profile.completedTradeCount, 'verified completed trade')} ·{' '}
              {profile.reviewCount && profile.averageRating !== null
                ? `${profile.averageRating}/5 from ${pluralize(profile.reviewCount, 'review')}`
                : 'No trade reviews yet'}
            </AppText>
          ) : null}
          <View style={styles.buttons}>
            <Button label="Edit profile" icon={Edit3} compact style={styles.flex} onPress={() => router.push('/settings?edit=profile')} />
            <Button label="Share profile" icon={Share2} variant="secondary" compact style={styles.flex} onPress={share} />
          </View>
        </Card>
      </View>

      {profile && strength < 100 ? (
        <View style={pad}>
          <Card onPress={() => router.push('/settings?edit=profile')} accessibilityLabel={`Profile ${strength}% complete`} style={styles.strength}>
            <View style={styles.row}>
              <View style={styles.flex}>
                <AppText variant="h3">Profile {strength}% complete</AppText>
                <AppText variant="caption">{nextProfileStep(profile)}</AppText>
              </View>
              <ChevronRight size={18} color={colors.muted} />
            </View>
            <ProgressBar value={strength} />
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
            { value: 'active', label: 'Listings', count: open.length || undefined },
            { value: 'traded', label: 'Marked traded', count: traded.length || undefined },
          ]}
        />

        {listingsLoading || visible.length ? (
          <>
            <ItemGrid items={visible.slice(0, PREVIEW_COUNT)} loading={listingsLoading} />
            {visible.length > PREVIEW_COUNT ? (
              <Card style={styles.listCard}>
                <SeeAll label={`See all ${visible.length} in My Items`} onPress={() => router.navigate('/my-items')} />
              </Card>
            ) : null}
          </>
        ) : tab === 'active' ? (
          <EmptyState icon={Package} title="No listings yet" text="Post something you no longer need and start receiving offers." action="Post an item" onAction={() => router.push('/post-item')} />
        ) : (
          <EmptyState icon={ArrowRightLeft} title="Nothing marked traded" text="Listings you mark as traded will appear here." />
        )}

        <ProfileReviews userId={user.id} />

        <Card style={styles.listCard}>
          <ListRow icon={Settings} title="Settings" subtitle="Account, password, privacy and help" onPress={() => router.push('/settings')} />
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
      style={[styles.action, { backgroundColor: colors.surface, borderColor: 'transparent' }, elevation(1, colors)]}>
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
  seeAll: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth },
});
