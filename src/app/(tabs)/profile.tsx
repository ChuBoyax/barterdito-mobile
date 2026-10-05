import { router } from 'expo-router';
import { Activity, ArrowRightLeft, BadgeCheck, Bookmark, Camera, Edit3, Gift, LogOut, MapPin, QrCode, Settings, Share2, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeaderActions, RequireAuth } from '@/components/layout';
import { StatGrid } from '@/components/marketplace';
import { AppText, Avatar, Button, Card, IconTile, ListRow, PressableScale, ProgressBar, Screen, SegmentedControl } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useAuth, useTheme, useToast } from '@/providers';
import { userService } from '@/services';
import { elevation, fonts, type Tone } from '@/theme';
import { stars } from '@/utils/format';

type Tab = 'history' | 'reviews';

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
  const { user, signOut } = useAuth();
  const showToast = useToast();
  const [tab, setTab] = useState<Tab>('history');
  const { data: stats } = useAsync(() => userService.getProfileStats(), []);
  const { data: history = [] } = useAsync(() => userService.getTradeHistory(), []);
  const { data: reviews = [] } = useAsync(() => userService.getReviews(), []);

  if (!user) return null;

  async function logout() {
    await signOut();
    showToast('You’re signed out');
    router.navigate('/');
  }

  return (
    <Screen padded={false} contentStyle={styles.content}>
      <View style={[styles.cover, { backgroundColor: colors.orangeSoft, paddingTop: insets.top + 8 }]}>
        <View style={styles.coverTop}>
          <Text style={[styles.coverLabel, { color: colors.orange }]}>MY PROFILE</Text>
          <HeaderActions />
        </View>
      </View>

      <View style={styles.pad}>
        <Card style={[styles.identity, elevation(3, colors)]}>
          <View style={styles.avatarWrap}>
            <Avatar initials={user.initials} imageUrl={user.avatarUrl} size="hero" ring online />
            <PressableScale
              accessibilityLabel="Change photo"
              onPress={() => showToast('Photo upload coming soon')}
              style={[styles.camera, { backgroundColor: colors.orange, borderColor: colors.surface }]}>
              <Camera size={14} color={colors.onPrimary} />
            </PressableScale>
          </View>
          <View style={styles.nameRow}>
            <AppText variant="h1" align="center">
              {user.fullName}
            </AppText>
            <BadgeCheck size={20} color={colors.blue} fill={colors.blueSoft} />
          </View>
          <View style={styles.row}>
            <MapPin size={13} color={colors.muted} />
            <AppText variant="caption">
              {user.location} · Joined {user.joined}
            </AppText>
          </View>
          <AppText variant="small" align="center" style={styles.bio}>
            {user.bio}
          </AppText>
          {stats ? (
            <StatGrid
              variant="inline"
              stats={[
                { label: 'Trades', value: stats.totalTrades },
                { label: 'Rating', value: `${stats.rating}★` },
                { label: 'Followers', value: stats.followers, onPress: () => router.push('/followers') },
                { label: 'Following', value: stats.following, onPress: () => router.push('/followers') },
              ]}
            />
          ) : null}
          <View style={styles.buttons}>
            <Button label="Edit profile" icon={Edit3} compact style={styles.flex} onPress={() => router.push('/settings')} />
            <Button
              label="Share"
              icon={Share2}
              variant="secondary"
              compact
              style={styles.flex}
              onPress={() => void Share.share({ message: `${user.fullName} on Barterdito: https://barterdito.ph/traders/${user.id}` })}
            />
          </View>
        </Card>
      </View>

      {stats ? (
        <View style={styles.pad}>
          <Card style={styles.strength}>
            <View style={styles.row}>
              <View style={styles.flex}>
                <AppText variant="h3">Profile strength</AppText>
                <AppText variant="caption">Add one more detail to build trader trust.</AppText>
              </View>
              <AppText variant="h1" color="orange">
                {stats.profileStrength}%
              </AppText>
            </View>
            <ProgressBar value={stats.profileStrength} />
          </Card>
        </View>
      ) : null}

      <View style={[styles.pad, styles.quick]}>
        <QuickAction icon={QrCode} label="QR Profile" tone="blue" onPress={() => router.push('/qr')} />
        <QuickAction icon={Gift} label="Invite" tone="yellow" onPress={() => router.push('/referral')} />
        <QuickAction icon={Bookmark} label="Wishlist" tone="red" onPress={() => router.push('/wishlist')} />
        <QuickAction icon={Activity} label="Activity" tone="violet" onPress={() => router.push('/activity')} />
      </View>

      <View style={[styles.pad, styles.section]}>
        <SegmentedControl<Tab>
          value={tab}
          onChange={setTab}
          segments={[
            { value: 'history', label: 'Trade history' },
            { value: 'reviews', label: 'Reviews', count: reviews.length },
          ]}
        />
        <Card>
          {tab === 'history'
            ? history.map((entry) => (
                <View key={entry.id} style={styles.historyRow}>
                  <IconTile icon={ArrowRightLeft} size={44} rounded />
                  <View style={styles.flex}>
                    <AppText variant="h3">{entry.title}</AppText>
                    <AppText variant="caption">
                      with {entry.partner} · {entry.date}
                    </AppText>
                  </View>
                  <AppText variant="caption" style={{ color: colors.yellow }}>
                    {stars(entry.rating)}
                  </AppText>
                </View>
              ))
            : reviews.map((review) => (
                <View key={review.id} style={styles.review}>
                  <View style={styles.row}>
                    <Avatar initials={review.initials} size="small" />
                    <View style={styles.flex}>
                      <AppText variant="h3">{review.author}</AppText>
                      <AppText variant="caption" style={{ color: colors.yellow }}>
                        {stars(review.rating)} <AppText variant="caption">· {review.date}</AppText>
                      </AppText>
                    </View>
                  </View>
                  <AppText variant="body" color="ink">
                    “{review.text}”
                  </AppText>
                </View>
              ))}
        </Card>
        <Card>
          <ListRow icon={Settings} title="Settings" subtitle="Preferences, privacy and support" onPress={() => router.push('/settings')} />
          <ListRow icon={LogOut} iconTone="red" title="Sign out" onPress={() => void logout()} />
        </Card>
      </View>
    </Screen>
  );
}

function QuickAction({ icon, label, tone, onPress }: { icon: LucideIcon; label: string; tone: Tone; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <PressableScale onPress={onPress} scaleTo={0.94} style={[styles.action, { backgroundColor: colors.surface, borderColor: colors.hairline }, elevation(1, colors)]}>
      <IconTile icon={icon} tone={tone} size={42} />
      <AppText variant="caption" color="ink" weight="bold">
        {label}
      </AppText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  content: { gap: 16, paddingTop: 0 },
  pad: { paddingHorizontal: 20 },
  flex: { flex: 1 },
  cover: { height: 210, paddingHorizontal: 20, overflow: 'hidden' },
  coverTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  coverLabel: { fontFamily: fonts.extrabold, fontSize: 12, letterSpacing: 2 },
  identity: { marginTop: -120, alignItems: 'center', gap: 8, paddingTop: 0 },
  avatarWrap: { marginTop: -52 },
  camera: { position: 'absolute', right: 2, bottom: 6, width: 32, height: 32, borderRadius: 16, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bio: { maxWidth: 300, marginBottom: 6 },
  buttons: { flexDirection: 'row', gap: 10, alignSelf: 'stretch', marginTop: 6 },
  strength: { gap: 12 },
  quick: { flexDirection: 'row', gap: 10 },
  action: { flex: 1, alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 22, paddingVertical: 14 },
  section: { gap: 14 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  review: { gap: 10 },
});
