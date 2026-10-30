import Constants from 'expo-constants';
import { router, useLocalSearchParams } from 'expo-router';
import {
  AlertTriangle,
  ArrowRightLeft,
  ChevronRight,
  CircleHelp,
  FileText,
  Gift,
  Eye,
  EyeOff,
  HandHeart,
  Heart,
  KeyRound,
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
import { Pressable, StyleSheet, View } from 'react-native';

import { EditProfileSheet } from '@/components/account';
import { PasswordStrength } from '@/components/auth';
import { AppText, Avatar, Button, Card, ListRow, Screen, SegmentedControl, TextField } from '@/components/ui';
import { SENTINEL_PREVIEW } from '@/constants/app';
import { useMountOnOpen } from '@/hooks/useMountOnOpen';
import { useSignOut } from '@/hooks/useSignOut';
import { useAuth, useTheme, useToast } from '@/providers';
import type { ThemeMode } from '@/providers/ThemeProvider';
import { authService, userService } from '@/services';
import type { NotificationPrefs } from '@/types/models';
import { errorMessage } from '@/utils/format';
import { validateNewPassword } from '@/utils/validation';

const notificationRows: { key: keyof NotificationPrefs; title: string; icon: LucideIcon }[] = [
  { key: 'offers', title: 'Trade offers', icon: ArrowRightLeft },
  { key: 'messages', title: 'Messages', icon: MessageCircle },
  { key: 'followers', title: 'New followers', icon: UserPlus },
  { key: 'hearts', title: 'Likes', icon: Heart },
  { key: 'system', title: 'Updates & safety', icon: Megaphone },
];

export default function SettingsScreen() {
  const { colors, mode, setMode } = useTheme();
  const { authenticated, user } = useAuth();
  const signOut = useSignOut();
  const params = useLocalSearchParams<{ edit?: string }>();
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [editOpen, setEditOpen] = useState(params.edit === 'profile');
  const editMounted = useMountOnOpen(editOpen);

  useEffect(() => {
    void userService.getNotificationPrefs().then(setPrefs);
  }, []);

  function togglePref(key: keyof NotificationPrefs, value: boolean) {
    if (!prefs) return;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    void userService.updateNotificationPrefs(next);
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
          </View>
          <ChevronRight size={18} color={colors.muted} />
        </Card>
      ) : (
        <Card style={styles.signedOut}>
          <AppText variant="h2">You’re not signed in</AppText>
          <Button label="Sign in" onPress={() => router.push('/login')} />
        </Card>
      )}

      <Section title="Theme">
        <View style={styles.appearance}>
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

      {authenticated ? <ChangePassword /> : null}

      {authenticated ? (
        <Section title="Notifications" footer={allOff ? 'All notifications are off' : undefined}>
          {prefs
            ? notificationRows.map((row) => (
                <ListRow
                  key={row.key}
                  icon={row.icon}
                  iconTone="neutral"
                  title={row.title}
                  toggle={{ value: prefs[row.key], onChange: (value) => togglePref(row.key, value) }}
                />
              ))
            : null}
        </Section>
      ) : null}

      {authenticated ? (
        <Section title="Trading">
          <ListRow icon={MessageSquare} iconTone="neutral" title="Direct messages" onPress={() => router.push('/direct-messages')} />
          <ListRow icon={Gift} iconTone="neutral" title="Invite friends" onPress={() => router.push('/referral')} />
          <ListRow icon={AlertTriangle} iconTone="neutral" title="Disputes" onPress={() => router.push('/disputes')} />
        </Section>
      ) : null}

      <Section title="About">
        <ListRow icon={CircleHelp} iconTone="neutral" title="Help & safety" onPress={() => router.push('/help')} />
        <ListRow icon={HandHeart} iconTone="neutral" title="Support Barterdito" onPress={() => router.push('/donate')} />
        <ListRow icon={FileText} iconTone="neutral" title="Terms of service" onPress={() => router.push('/terms')} />
        <ListRow icon={Lock} iconTone="neutral" title="Privacy policy" onPress={() => router.push('/privacy')} />
        {SENTINEL_PREVIEW ? (
          <ListRow icon={ShieldCheck} iconTone="neutral" title="Sentinel admin" onPress={() => router.push('/admin')} />
        ) : null}
      </Section>

      {authenticated ? (
        <Card style={styles.group}>
          <ListRow icon={LogOut} iconTone="red" title="Sign out" destructive showChevron={false} onPress={() => void signOut()} />
        </Card>
      ) : null}

      <AppText variant="caption" align="center" style={styles.version}>
        Barterdito v{Constants.expoConfig?.version ?? '1.0.0'}
      </AppText>

      {editMounted ? <EditProfileSheet visible={editOpen} onClose={() => setEditOpen(false)} /> : null}
    </Screen>
  );
}

/** Same flow as the website: the backend revokes every session, so the user signs in again. */
function ChangePassword() {
  const { colors } = useTheme();
  const { forgetSession, user } = useAuth();
  const showToast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setError('');
    if (!current) return setError('Enter your current password.');
    // Same rules as sign-up, as on the website's change-password form.
    const issue = validateNewPassword(next, { email: user?.email, fullName: user?.fullName });
    if (issue) return setError(issue);
    if (next === current) return setError('Choose a new password that is different from your current one.');
    setBusy(true);
    try {
      await authService.changePassword(current, next);
      await forgetSession();
      showToast('Password changed. Sign in with your new password.');
      router.replace('/login');
    } catch (caught) {
      setError(errorMessage(caught, 'Could not change password.'));
    } finally {
      setBusy(false);
    }
  }

  const toggle = (
    <Pressable accessibilityLabel={visible ? 'Hide passwords' : 'Show passwords'} onPress={() => setVisible(!visible)} hitSlop={8}>
      {visible ? <EyeOff size={18} color={colors.muted} /> : <Eye size={18} color={colors.muted} />}
    </Pressable>
  );

  if (!open) {
    return (
      <Section title="Security">
        <ListRow icon={KeyRound} iconTone="neutral" title="Change password" onPress={() => setOpen(true)} />
      </Section>
    );
  }

  return (
    <Section title="Security">
      <View style={styles.password}>
        <TextField
          label="Current password"
          icon={Lock}
          placeholder="Enter your current password"
          value={current}
          onChangeText={(value) => {
            setCurrent(value);
            setError('');
          }}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoComplete="current-password"
          right={toggle}
        />
        <TextField
          label="New password"
          icon={KeyRound}
          value={next}
          onChangeText={(value) => {
            setNext(value);
            setError('');
          }}
          placeholder="Create a strong new password"
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoComplete="new-password"
          error={error || undefined}
          hint="Signs you out on all devices"
        />
        {next ? <PasswordStrength password={next} rejected={!!validateNewPassword(next, { email: user?.email, fullName: user?.fullName })} /> : null}
        <View style={styles.actions}>
          <Button
            label="Cancel"
            variant="ghost"
            compact
            style={styles.grow}
            onPress={() => {
              setOpen(false);
              setCurrent('');
              setNext('');
              setError('');
            }}
          />
          <Button label="Update" variant="secondary" compact loading={busy} disabled={!current || !next} style={styles.grow} onPress={() => void submit()} />
        </View>
      </View>
    </Section>
  );
}

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
  signedOut: { gap: 10 },
  section: { gap: 8 },
  sectionTitle: { paddingHorizontal: 6 },
  group: { paddingVertical: 4 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 55 },
  appearance: { paddingVertical: 8 },
  password: { gap: 12, paddingVertical: 8 },
  actions: { flexDirection: 'row', gap: 10 },
  grow: { flex: 1 },
  version: { marginTop: -4 },
});
