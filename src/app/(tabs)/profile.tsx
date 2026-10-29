import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Activity, BadgeCheck, Bookmark, ChevronRight, Gift, LogOut, Package, Plus, QrCode, Settings, Share2, Star, type LucideIcon } from 'lucide-react-native';
import { memo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppHeader, RequireAuth } from '@/components/layout';
import { ProfileReviews } from '@/components/trades';
import { AppText, Avatar, Button, Card, IconButton, IconTile, ListRow, PressableScale, ProgressBar, Screen, SectionHeading, StatRow } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useResponsive } from '@/hooks/useResponsive';
import { useSignOut } from '@/hooks/useSignOut';
import { useAuth, useTheme } from '@/providers';
import { itemService, userService } from '@/services';
import { queryKeys } from '@/services/queryKeys';
import { profileCompletion } from '@/services/userService';
import { neu, type Tone } from '@/theme';
import type { Item, Profile } from '@/types/models';
import { openItem } from '@/utils/navigation';
import { shareTrader } from '@/utils/share';

const PREVIEW_COUNT = 8;

function nextProfileStep(profile: Profile): string {
  if (!profile.avatarUrl) return 'Add a photo';
  if (!profile.bio.trim()) return 'Add a short bio';
  if (!profile.location.trim()) return 'Add your city';
  return 'Verify your email';
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
  const { gutter } = useResponsive();
  const { user } = useAuth();
  const signOut = useSignOut();
  const { data: profile, refreshing, reload } = useAsync(queryKeys.myProfile, () => userService.getMyProfile());
  const { data: listings = [], reload: reloadListings } = useAsync(queryKeys.myItems, () => itemService.getMyItems());

  if (!user) return null;

  const strength = profile ? profileCompletion(profile) : 100;
  const open = listings.filter((item) => item.status !== 'Traded');
  const meta = [profile?.location || user.location, (profile?.joined || user.joined) && `Joined ${profile?.joined || user.joined}`].filter(Boolean).join(' · ');
  const editProfile = () => router.push('/settings?edit=profile');

  return (
    <Screen
      refreshing={refreshing}
      onRefresh={() => {
        void reload();
        void reloadListings();
      }}
      header={<AppHeader title="Profile" />}>
      <Card style={styles.identity}>
        <View style={styles.person}>
          <PressableScale accessibilityRole="button" accessibilityLabel="Edit profile" onPress={editProfile} scaleTo={0.96}>
            <Avatar initials={user.initials} imageUrl={user.avatarUrl} size="large" ring />
          </PressableScale>
          <View style={styles.flex}>
            <View style={styles.row}>
              <AppText variant="h2" numberOfLines={1} style={styles.shrink}>
                {user.fullName}
              </AppText>
              {(profile?.emailVerified ?? user.emailVerified) ? <BadgeCheck size={18} color={colors.blue} fill={colors.blueSoft} accessibilityLabel="Verified email" /> : null}
            </View>
            {meta ? (
              <AppText variant="caption" numberOfLines={1}>
                {meta}
              </AppText>
            ) : null}
            {profile?.reviewCount && profile.averageRating !== null ? (
              <View style={styles.row}>
                <Star size={13} color={colors.yellow} fill={colors.yellow} />
                <AppText variant="caption" color="ink" weight="bold">
                  {profile.averageRating}
                </AppText>
                <AppText variant="caption">({profile.reviewCount})</AppText>
              </View>
            ) : null}
          </View>
        </View>

        {user.bio ? <AppText variant="small">{user.bio}</AppText> : null}

        {profile ? (
          <StatRow
            raised={false}
            style={[styles.stats, { backgroundColor: colors.background }, neu(colors, 1, true)]}
            stats={[
              { label: 'Listings', value: profile.listingCount, onPress: () => router.navigate('/my-items') },
              { label: 'Trades', value: profile.completedTradeCount },
              { label: 'Followers', value: profile.followersCount, onPress: () => router.push('/followers?tab=followers') },
              { label: 'Following', value: profile.followingCount, onPress: () => router.push('/followers?tab=following') },
            ]}
          />
        ) : null}

        <View style={styles.row}>
          <Button label="Edit profile" variant="secondary" compact style={styles.flex} onPress={editProfile} />
          <IconButton icon={Share2} label="Share profile" size={17} dimension={40} onPress={() => void shareTrader({ id: user.id, name: user.fullName })} />
        </View>
      </Card>

      {profile && strength < 100 ? (
        <Card onPress={editProfile} accessibilityLabel={`Profile ${strength}% complete`} style={styles.strength}>
          <View style={styles.row}>
            <AppText variant="h3" style={styles.flex}>
              Complete your profile
            </AppText>
            <AppText variant="small" color="ink" weight="bold">
              {strength}%
            </AppText>
          </View>
          <ProgressBar value={strength} />
          <View style={styles.row}>
            <AppText variant="caption" style={styles.flex}>
              Next: {nextProfileStep(profile)}
            </AppText>
            <ChevronRight size={16} color={colors.muted} />
          </View>
        </Card>
      ) : null}

      <View style={styles.quick}>
        <QuickAction icon={QrCode} label="My QR" tone="blue" onPress={() => router.push('/qr')} />
        <QuickAction icon={Gift} label="Invite" tone="yellow" onPress={() => router.push('/referral')} />
        <QuickAction icon={Bookmark} label="Wishlist" tone="red" onPress={() => router.push('/wishlist')} />
        <QuickAction icon={Activity} label="Activity" tone="violet" onPress={() => router.push('/activity')} />
      </View>

      <View>
        <SectionHeading title={open.length ? `Listings · ${open.length}` : 'Listings'} action={open.length ? 'See all' : undefined} onAction={() => router.navigate('/my-items')} />
        {open.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -gutter }} contentContainerStyle={[styles.listings, { paddingHorizontal: gutter }]}>
            {open.slice(0, PREVIEW_COUNT).map((item) => (
              <MiniListing key={item.id} item={item} />
            ))}
          </ScrollView>
        ) : (
          <Button label="Post an item" icon={Plus} variant="secondary" compact onPress={() => router.push('/post-item')} />
        )}
      </View>

      <ProfileReviews userId={user.id} />

      <Card style={styles.menu}>
        <ListRow icon={Settings} title="Settings" onPress={() => router.push('/settings')} />
        <ListRow icon={LogOut} iconTone="red" title="Sign out" showChevron={false} onPress={() => void signOut()} />
      </Card>
    </Screen>
  );
}

const MiniListing = memo(function MiniListing({ item }: { item: Item }) {
  const { colors } = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={item.title}
      onPress={() => openItem(item)}
      scaleTo={0.97}
      style={[styles.mini, { backgroundColor: colors.surface }, neu(colors, 1)]}>
      <View style={[styles.miniPhoto, { backgroundColor: colors.surface2 }]}>
        {item.image ? (
          <Image source={item.image} cachePolicy="memory-disk" style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <Package size={20} color={colors.muted} />
        )}
      </View>
      <AppText variant="small" color="ink" weight="semibold" numberOfLines={1}>
        {item.title}
      </AppText>
    </PressableScale>
  );
});

function QuickAction({ icon, label, tone, onPress }: { icon: LucideIcon; label: string; tone: Tone; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      scaleTo={0.94}
      style={[styles.action, { backgroundColor: colors.surface }, neu(colors, 1)]}>
      <IconTile icon={icon} tone={tone} size={38} />
      <AppText variant="caption" color="ink" weight="semibold" numberOfLines={1}>
        {label}
      </AppText>
    </PressableScale>
  );
}

const MINI = 116;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  shrink: { flexShrink: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  identity: { gap: 14 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stats: { borderRadius: 16, paddingVertical: 10 },
  strength: { gap: 10 },
  quick: { flexDirection: 'row', gap: 10 },
  action: { flex: 1, alignItems: 'center', gap: 6, borderRadius: 18, paddingVertical: 12 },
  listings: { gap: 12, paddingVertical: 6 },
  mini: { width: MINI + 12, gap: 8, borderRadius: 18, padding: 6, paddingBottom: 10 },
  miniPhoto: { width: MINI, height: MINI, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  menu: { paddingVertical: 4 },
});
