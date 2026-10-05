import Constants from 'expo-constants';
import { router, useLocalSearchParams } from 'expo-router';
import {
  AlertTriangle,
  ArrowRightLeft,
  ChevronRight,
  CircleHelp,
  FileText,
  Gift,
  HandHeart,
  Heart,
  Lock,
  LogOut,
  Megaphone,
  MessageCircle,
  MessageSquare,
  ShieldCheck,
  UserPlus,
  type LucideIcon,
} from 'lucide-react-native';
import { Children, Fragment, useEffect, useState, type ReactNode } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { EditProfileSheet } from '@/components/account';
import { AppText, Avatar, Button, Card, ListRow, Screen, SegmentedControl } from '@/components/ui';
import { useAuth, useTheme, useToast } from '@/providers';
import type { ThemeMode } from '@/providers/ThemeProvider';
import { userService } from '@/services';
import type { NotificationPrefs } from '@/types/models';

const notificationRows: { key: keyof NotificationPrefs; title: string; subtitle: string; icon: LucideIcon }[] = [
  { key: 'offers', title: 'Trade offers', subtitle: 'New, accepted, and declined offers', icon: ArrowRightLeft },
  { key: 'messages', title: 'Messages', subtitle: 'Replies from traders', icon: MessageCircle },
  { key: 'followers', title: 'New followers', subtitle: 'When someone follows you', icon: UserPlus },
  { key: 'hearts', title: 'Likes', subtitle: 'When someone likes your listing', icon: Heart },
  { key: 'system', title: 'Updates & safety', subtitle: 'Important account and app notices', icon: Megaphone },
];

export default function SettingsScreen() {
  const { colors, mode, setMode } = useTheme();
  const { authenticated, signOut, user } = useAuth();
  const showToast = useToast();
  const params = useLocalSearchParams<{ edit?: string }>();
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [editOpen, setEditOpen] = useState(params.edit === 'profile');

  useEffect(() => {
    void userService.getNotificationPrefs().then(setPrefs);
  }, []);

  function togglePref(key: keyof NotificationPrefs, value: boolean) {
    if (!prefs) return;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    void userService.updateNotificationPrefs(next);
  }

  function confirmLogout() {
    Alert.alert('Sign out?', 'You can sign back in anytime with your account.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          showToast('You’re signed out');
          router.navigate('/');
        },
      },
    ]);
  }

  const allOff = prefs ? Object.values(prefs).every((value) => !value) : false;

  return (
    <Screen>
      {user ? (
        <Card onPress={() => setEditOpen(true)} accessibilityLabel="Edit profile" style={styles.account}>
          <Avatar initials={user.initials} imageUrl={user.avatarUrl} size="large" />
          <View style={styles.flex}>
            <AppText variant="h2" numberOfLines={1}>
              {user.fullName}
            </AppText>
            <AppText variant="caption" numberOfLines={1}>
              {user.email}
            </AppText>
            <AppText variant="caption" color="orange" weight="bold" style={styles.editLink}>
              Edit profile
            </AppText>
          </View>
          <ChevronRight size={18} color={colors.muted} />
        </Card>
      ) : (
        <Card style={styles.signedOut}>
          <AppText variant="h2">You’re not signed in</AppText>
          <AppText variant="small">Sign in to manage your profile, notifications, and trades.</AppText>
          <Button label="Sign in" onPress={() => router.push('/login')} />
        </Card>
      )}

      <Section title="Appearance">
        <View style={styles.appearance}>
          <AppText variant="h3">Theme</AppText>
          <AppText variant="caption">“System” follows your phone’s light or dark setting.</AppText>
          <SegmentedControl<ThemeMode>
            value={mode}
            onChange={setMode}
            segments={[
              { value: 'system', label: 'System' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
          />
        </View>
      </Section>

      {authenticated ? (
        <Section title="Push notifications" footer={allOff ? 'All notifications are off. You may miss new offers and messages.' : undefined}>
          {prefs
            ? notificationRows.map((row) => (
                <ListRow
                  key={row.key}
                  icon={row.icon}
                  iconTone="neutral"
                  title={row.title}
                  subtitle={row.subtitle}
                  toggle={{ value: prefs[row.key], onChange: (value) => togglePref(row.key, value) }}
                />
              ))
            : null}
        </Section>
      ) : null}

      {authenticated ? (
        <Section title="Trading">
          <ListRow icon={MessageSquare} iconTone="neutral" title="Direct messages" subtitle="Chats outside of trade offers" onPress={() => router.push('/direct-messages')} />
          <ListRow icon={Gift} iconTone="neutral" title="Invite friends" subtitle="Earn rewards for every referral" onPress={() => router.push('/referral')} />
          <ListRow icon={AlertTriangle} iconTone="neutral" title="Report a trade problem" subtitle="File a dispute and attach evidence" onPress={() => router.push('/disputes')} />
        </Section>
      ) : null}

      <Section title="Help & about">
        <ListRow icon={CircleHelp} iconTone="neutral" title="Help & safety tips" subtitle="FAQs and how to trade safely" onPress={() => router.push('/help')} />
        <ListRow icon={HandHeart} iconTone="neutral" title="Support Barterdito" subtitle="Help keep local trading free" onPress={() => router.push('/donate')} />
        <ListRow icon={FileText} iconTone="neutral" title="Terms of service" onPress={() => router.push('/terms')} />
        <ListRow icon={Lock} iconTone="neutral" title="Privacy policy" onPress={() => router.push('/privacy')} />
        {user?.role === 'sentinel' || __DEV__ ? (
          <ListRow icon={ShieldCheck} iconTone="neutral" title="Sentinel admin" subtitle="Moderation tools (preview)" onPress={() => router.push('/admin')} />
        ) : null}
      </Section>

      {authenticated ? (
        <Card style={styles.group}>
          <ListRow icon={LogOut} iconTone="red" title="Sign out" destructive showChevron={false} onPress={confirmLogout} />
        </Card>
      ) : null}

      <AppText variant="caption" align="center" style={styles.version}>
        Barterdito v{Constants.expoConfig?.version ?? '1.0.0'}
      </AppText>

      <EditProfileSheet visible={editOpen} onClose={() => setEditOpen(false)} />
    </Screen>
  );
}

// Grouped list with a small label above and hairline dividers between rows.
function Section({ title, footer, children }: { title: string; footer?: string; children: ReactNode }) {
  const { colors } = useTheme();
  const rows = Children.toArray(children).filter(Boolean);
  return (
    <View style={styles.section}>
      <AppText variant="eyebrow" color="muted" style={styles.sectionTitle}>
        {title}
      </AppText>
      <Card style={styles.group}>
        {rows.map((row, index) => (
          <Fragment key={index}>
            {index > 0 ? <View style={[styles.divider, { backgroundColor: colors.hairline }]} /> : null}
            {row}
          </Fragment>
        ))}
      </Card>
      {footer ? (
        <AppText variant="caption" color="red" style={styles.sectionTitle}>
          {footer}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 1 },
  account: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  editLink: { marginTop: 4 },
  signedOut: { gap: 10 },
  section: { gap: 8 },
  sectionTitle: { paddingHorizontal: 6 },
  group: { paddingVertical: 4 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 55 },
  appearance: { gap: 6, paddingVertical: 8 },
  version: { marginTop: -4 },
});
