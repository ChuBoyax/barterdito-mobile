import { router } from 'expo-router';
import { ArrowRight, Camera, Edit3, Gift, LogOut, MapPin, QrCode, Settings, Share2 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Share, StyleSheet, View } from 'react-native';

import { RequireAuth } from '@/components/layout';
import { StatGrid } from '@/components/marketplace';
import { AppText, Avatar, Button, Card, ProgressBar, Screen, SegmentedControl } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useAuth, useTheme, useToast } from '@/providers';
import { userService } from '@/services';
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
    <Screen>
      <Card style={styles.hero}>
        <View style={styles.main}>
          <View>
            <Avatar initials={user.initials} imageUrl={user.avatarUrl} size="hero" />
            <Pressable
              accessibilityLabel="Change photo"
              onPress={() => showToast('Photo upload coming soon')}
              style={[styles.camera, { backgroundColor: colors.orange, borderColor: colors.surface }]}>
              <Camera size={14} color="#fff" />
            </Pressable>
          </View>
          <View style={styles.flex}>
            <AppText variant="caption" color="green" weight="bold">
              ● Active trader
            </AppText>
            <AppText variant="h1">{user.fullName}</AppText>
            <View style={styles.row}>
              <MapPin size={13} color={colors.muted} />
              <AppText variant="caption">{user.location}</AppText>
            </View>
          </View>
        </View>
        <AppText variant="small">{user.bio}</AppText>
        <AppText variant="caption">Joined {user.joined}</AppText>
        <Button label="Edit profile" icon={Edit3} variant="secondary" compact onPress={() => router.push('/settings')} />
        {stats ? (
          <>
            <View style={[styles.strength, { backgroundColor: colors.surface2 }]}>
              <View style={styles.strengthHead}>
                <View style={styles.flex}>
                  <AppText variant="h3">Profile strength</AppText>
                  <AppText variant="caption">One more detail helps traders trust you.</AppText>
                </View>
                <AppText variant="h2" color="orange">
                  {stats.profileStrength}%
                </AppText>
              </View>
              <ProgressBar value={stats.profileStrength} />
            </View>
            <StatGrid
              variant="inline"
              stats={[
                { label: 'Completed', value: stats.completed },
                { label: 'Total trades', value: stats.totalTrades },
                { label: 'Avg rating', value: `${stats.rating}★` },
                { label: 'Followers', value: stats.followers, onPress: () => router.push('/followers') },
                { label: 'Following', value: stats.following, onPress: () => router.push('/followers') },
              ]}
            />
          </>
        ) : null}
        <View style={styles.actions}>
          <ProfileAction icon={QrCode} label="QR Profile" onPress={() => router.push('/qr')} />
          <ProfileAction icon={Gift} label="Invite" onPress={() => router.push('/referral')} />
          <ProfileAction
            icon={Share2}
            label="Share"
            onPress={() => void Share.share({ message: `${user.fullName} on Barterdito: https://barterdito.ph/traders/${user.id}` })}
          />
          <ProfileAction icon={Settings} label="Settings" onPress={() => router.push('/settings')} />
        </View>
      </Card>

      <SegmentedControl<Tab>
        value={tab}
        onChange={setTab}
        segments={[
          { value: 'history', label: 'History' },
          { value: 'reviews', label: 'Reviews' },
        ]}
      />
      <Card>
        {tab === 'history'
          ? history.map((entry) => (
              <View key={entry.id} style={[styles.historyRow, { borderBottomColor: colors.line }]}>
                <View style={[styles.historyIcon, { backgroundColor: colors.orangeSoft }]}>
                  <ArrowRight size={18} color={colors.orange} />
                </View>
                <View style={styles.flex}>
                  <AppText variant="h3">{entry.title}</AppText>
                  <AppText variant="caption">
                    Traded with {entry.partner} · {entry.date}
                  </AppText>
                </View>
                <AppText variant="small" style={{ color: colors.yellow }}>
                  {stars(entry.rating)}
                </AppText>
              </View>
            ))
          : reviews.map((review) => (
              <View key={review.id} style={styles.review}>
                <View style={styles.row}>
                  <Avatar initials={review.initials} size="small" />
                  <View>
                    <AppText variant="h3">{review.author}</AppText>
                    <AppText variant="caption">
                      {stars(review.rating)} · {review.date}
                    </AppText>
                  </View>
                </View>
                <AppText variant="small" color="ink">
                  {review.text}
                </AppText>
              </View>
            ))}
      </Card>
      <View style={styles.links}>
        <Button label="Wishlist" variant="secondary" style={styles.flex} onPress={() => router.push('/wishlist')} />
        <Button label="Activity" variant="secondary" style={styles.flex} onPress={() => router.push('/activity')} />
      </View>
      <Button label="Sign out" icon={LogOut} variant="danger" onPress={() => void logout()} />
    </Screen>
  );
}

function ProfileAction({ icon: Icon, label, onPress }: { icon: typeof QrCode; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.action, { backgroundColor: colors.surface2 }]}>
      <Icon size={19} color={colors.orange} />
      <AppText variant="caption" color="ink" weight="bold">
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: { gap: 12 },
  main: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  camera: { position: 'absolute', right: 0, bottom: 0, width: 30, height: 30, borderRadius: 15, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  strength: { borderRadius: 14, padding: 12, gap: 10 },
  strengthHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actions: { flexDirection: 'row', gap: 8 },
  action: { flex: 1, alignItems: 'center', gap: 5, borderRadius: 14, paddingVertical: 12 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, paddingVertical: 12 },
  historyIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  review: { gap: 10 },
  links: { flexDirection: 'row', gap: 10 },
});
