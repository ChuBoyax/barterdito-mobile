import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Camera, CheckCircle2, Edit3, Gift, LogOut, MapPin, Package, Plus, QrCode, Settings, Share2, type LucideIcon } from 'lucide-react-native';
import { memo, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader, RequireAuth } from '@/components/layout';
import { ProfileReviews } from '@/components/trades';
import { AppText, Avatar, Badge, Button, Card, PressableScale, ProgressBar, Screen, type BadgeTone } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useSignOut } from '@/hooks/useSignOut';
import { useAuth, useTheme } from '@/providers';
import { itemService, userService } from '@/services';
import { queryKeys } from '@/services/queryKeys';
import { profileCompletion } from '@/services/userService';
import { fonts, maxFontScale, neu } from '@/theme';
import type { Item, ItemStatus } from '@/types/models';
import { chunk } from '@/utils/collections';
import { openItem } from '@/utils/navigation';
import { shareTrader } from '@/utils/share';

type Tab = 'Listings' | 'Marked traded';

const statusTones: Record<ItemStatus, BadgeTone> = { Active: 'green', 'In Negotiation': 'neutral', Traded: 'blue' };

export default function ProfileScreen() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}

function ProfileContent() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const signOut = useSignOut();
  const [tab, setTab] = useState<Tab>('Listings');
  const { data: profile, refreshing, reload } = useAsync(queryKeys.myProfile, () => userService.getMyProfile());
  const { data: listings = [], reload: reloadListings } = useAsync(queryKeys.myItems, () => itemService.getMyItems());
  const shown = useMemo(() => listings.filter((item) => (tab === 'Listings' ? item.status !== 'Traded' : item.status === 'Traded')), [listings, tab]);
  const rows = useMemo(() => chunk(shown, 2), [shown]);

  if (!user) return null;

  const strength = profile ? profileCompletion(profile) : 100;
  const verified = profile?.emailVerified ?? user.emailVerified;
  const createdAt = profile?.createdAt ?? user.createdAt;
  const joined = createdAt ? new Date(createdAt).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' }) : '';
  const location = profile?.location || user.location || 'Location not added';
  const editProfile = () => router.push('/settings?edit=profile');

  return (
    <Screen
      refreshing={refreshing}
      onRefresh={() => {
        void reload();
        void reloadListings();
      }}
      header={<AppHeader title="Profile" />}>
      <Card style={styles.hero}>
        <View style={styles.identity}>
          <View>
            <Avatar initials={user.initials} imageUrl={user.avatarUrl} size="hero" />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Change profile photo"
              onPress={editProfile}
              style={[styles.camera, { backgroundColor: colors.orange, borderColor: colors.surface }, neu(colors, 1)]}>
              <Camera size={15} color={colors.onPrimary} />
            </Pressable>
          </View>
          {verified ? (
            <View style={[styles.member, { backgroundColor: colors.greenSoft }]}>
              <CheckCircle2 size={14} color={colors.green} />
              <Text maxFontSizeMultiplier={maxFontScale} style={[styles.memberText, { color: colors.green }]}>
                Email verified
              </Text>
            </View>
          ) : (
            <AppText variant="caption" color="green" weight="bold">
              BarterDito member
            </AppText>
          )}
          <Text maxFontSizeMultiplier={maxFontScale} style={[styles.name, { color: colors.ink }]}>
            {user.fullName}
          </Text>
          <AppText variant="small" align="center">
            {user.bio || 'Add a short bio so other traders can get to know you.'}
          </AppText>
          <View style={styles.location}>
            <MapPin size={15} color={colors.muted} />
            <AppText variant="caption" align="center" style={styles.shrink}>
              {location}
              {joined ? ` · Joined ${joined}` : ''}
            </AppText>
          </View>
        </View>

        <View style={styles.headActions}>
          <Button label="Edit profile" icon={Edit3} variant="secondary" style={styles.flex} onPress={editProfile} />
          <Pressable accessibilityRole="button" onPress={() => void signOut()} style={[styles.signOut, { borderColor: colors.redSoft }]}>
            <LogOut size={16} color={colors.red} />
            <AppText variant="caption" color="red" weight="semibold">
              Sign out
            </AppText>
          </Pressable>
        </View>

        {profile ? (
          <View style={[styles.progress, { backgroundColor: colors.surface }, neu(colors, 1)]}>
            <View style={styles.progressHead}>
              <View style={styles.flex}>
                <AppText variant="small" color="orange" weight="bold">
                  Profile completeness
                </AppText>
                <AppText variant="caption">{strength === 100 ? 'Your profile is complete.' : 'Add your photo, bio, and city to complete your profile.'}</AppText>
              </View>
              <AppText variant="small" color="orange" weight="bold">
                {strength}%
              </AppText>
            </View>
            <ProgressBar value={strength} />
          </View>
        ) : null}

        {profile ? (
          <View style={[styles.stats, { backgroundColor: colors.background }, neu(colors, 1, true)]}>
            <Stat value={profile.listingCount} label="Listings" />
            <Stat value={profile.tradedListingCount} label="Marked traded" divided />
            <Stat value={profile.followersCount} label="Followers" divided onPress={() => router.push('/followers?tab=followers')} />
            <Stat value={profile.followingCount} label="Following" divided onPress={() => router.push('/followers?tab=following')} />
          </View>
        ) : null}
        {profile ? (
          <AppText variant="caption" align="center">
            {profile.completedTradeCount} verified completed trades · {profile.reviewCount ? `${profile.averageRating}/5 from ${profile.reviewCount} reviews` : 'No trade reviews yet'}
          </AppText>
        ) : null}

        <View style={styles.actions}>
          <ActionPill icon={QrCode} label="QR Profile" onPress={() => router.push('/qr')} />
          <ActionPill icon={Gift} label="Invite friends" onPress={() => router.push('/referral')} />
        </View>
        <View style={styles.actions}>
          <ActionPill icon={Share2} label="Share" onPress={() => void shareTrader({ id: user.id, name: user.fullName })} />
          <ActionPill icon={Settings} label="Settings" onPress={() => router.push('/settings')} />
        </View>
      </Card>

      <Card padded={false}>
        <View style={[styles.tabs, { borderBottomColor: colors.line }]}>
          <ProfileTab label="Listings" active={tab === 'Listings'} onPress={() => setTab('Listings')} />
          <ProfileTab label="Marked traded" active={tab === 'Marked traded'} onPress={() => setTab('Marked traded')} />
          <ProfileTab label="Saved items" onPress={() => router.push('/wishlist')} />
        </View>
        {rows.length ? (
          <View style={styles.grid}>
            {rows.map((row) => (
              <View key={row[0]!.id} style={styles.gridRow}>
                {row.map((item) => (
                  <ProfileItem key={item.id} item={item} />
                ))}
                {row.length < 2 ? <View style={styles.flex} /> : null}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.empty}>
            <AppText variant="h3" align="center">
              No listings here yet
            </AppText>
            <AppText variant="small" align="center">
              Published items will appear here.
            </AppText>
            {tab === 'Listings' ? <Button label="Post an item" icon={Plus} variant="secondary" compact fullWidth={false} onPress={() => router.push('/post-item')} /> : null}
          </View>
        )}
      </Card>

      <ProfileReviews userId={user.id} />
    </Screen>
  );
}

function Stat({ value, label, divided, onPress }: { value: number; label: string; divided?: boolean; onPress?: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${value} ${label}`}
      disabled={!onPress}
      onPress={onPress}
      style={[styles.stat, divided && { borderLeftColor: colors.line, borderLeftWidth: 1 }]}>
      <Text maxFontSizeMultiplier={maxFontScale} style={[styles.statValue, { color: colors.ink }]}>
        {value}
      </Text>
      <AppText variant="caption" align="center" numberOfLines={2} style={styles.statLabel}>
        {label}
      </AppText>
    </Pressable>
  );
}

function ActionPill({ icon: Icon, label, onPress }: { icon: LucideIcon; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <PressableScale accessibilityRole="button" accessibilityLabel={label} onPress={onPress} scaleTo={0.96} style={[styles.pill, { backgroundColor: colors.surface }, neu(colors, 1)]}>
      <Icon size={18} color={colors.ink} />
      <AppText variant="caption" color="ink" weight="bold" numberOfLines={1}>
        {label}
      </AppText>
    </PressableScale>
  );
}

function ProfileTab({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={onPress} style={styles.tab}>
      <AppText variant="small" color={active ? 'ink' : 'muted'} weight="semibold" numberOfLines={1}>
        {label}
      </AppText>
      {active ? <View style={[styles.tabLine, { backgroundColor: colors.orange }]} /> : null}
    </Pressable>
  );
}

const ProfileItem = memo(function ProfileItem({ item }: { item: Item }) {
  const { colors } = useTheme();
  return (
    <PressableScale accessibilityRole="button" accessibilityLabel={item.title} onPress={() => openItem(item)} scaleTo={0.97} style={[styles.item, { backgroundColor: colors.surface }, neu(colors, 2)]}>
      <View style={[styles.itemPhoto, { backgroundColor: colors.surface2 }]}>
        {item.image ? <Image source={item.image} cachePolicy="memory-disk" style={StyleSheet.absoluteFill} contentFit="cover" /> : <Package size={20} color={colors.muted} />}
        <Badge label={item.status} tone={statusTones[item.status]} style={styles.itemBadge} />
      </View>
      <View style={styles.itemBody}>
        <AppText variant="small" color="ink" weight="bold" numberOfLines={2}>
          {item.title}
        </AppText>
        <AppText variant="caption" numberOfLines={1}>
          {item.condition} · {item.category}
        </AppText>
      </View>
    </PressableScale>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  shrink: { flexShrink: 1 },
  hero: { gap: 16, paddingHorizontal: 16, paddingVertical: 20 },
  identity: { alignItems: 'center', gap: 6 },
  camera: { position: 'absolute', right: 0, bottom: 0, width: 34, height: 34, borderRadius: 17, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  member: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  memberText: { fontFamily: fonts.bold, fontSize: 11 },
  name: { fontFamily: fonts.extrabold, fontSize: 24, lineHeight: 28, letterSpacing: -0.5, textAlign: 'center' },
  location: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 2 },
  headActions: { flexDirection: 'row', gap: 10 },
  signOut: { flex: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 999, borderWidth: 1 },
  progress: { gap: 10, borderRadius: 18, paddingHorizontal: 18, paddingVertical: 16 },
  progressHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stats: { flexDirection: 'row', borderRadius: 18, overflow: 'hidden' },
  stat: { flex: 1, minWidth: 0, minHeight: 72, alignItems: 'center', justifyContent: 'center', gap: 2, paddingHorizontal: 2 },
  statValue: { fontFamily: fonts.extrabold, fontSize: 18 },
  statLabel: { fontSize: 10 },
  actions: { flexDirection: 'row', gap: 10 },
  pill: { flex: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 999, paddingHorizontal: 10 },
  tabs: { flexDirection: 'row', gap: 8, marginHorizontal: 16, borderBottomWidth: 1 },
  tab: { flex: 1, minHeight: 50, alignItems: 'center', justifyContent: 'center' },
  tabLine: { position: 'absolute', left: 0, right: 0, bottom: -1, height: 2, borderRadius: 2 },
  grid: { gap: 12, paddingHorizontal: 12, paddingTop: 16, paddingBottom: 18 },
  gridRow: { flexDirection: 'row', gap: 12 },
  item: { flex: 1, minWidth: 0, borderRadius: 20, padding: 6 },
  itemPhoto: { width: '100%', aspectRatio: 4 / 3, borderRadius: 15, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  itemBadge: { position: 'absolute', top: 8, left: 8 },
  itemBody: { gap: 2, paddingHorizontal: 6, paddingTop: 10, paddingBottom: 6 },
  empty: { alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingTop: 48, paddingBottom: 56 },
});
