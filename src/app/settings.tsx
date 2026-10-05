import { router } from 'expo-router';
import { AlertTriangle, Bell, CircleHelp, Compass, Gift, HandHeart, Info, Lock, LogOut, MessageSquare, Moon, ShieldCheck } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { AppText, Button, Card, ListRow, Screen } from '@/components/ui';
import { useAuth, useTheme, useToast } from '@/providers';
import { userService } from '@/services';
import type { NotificationPrefs } from '@/types/models';

const prefLabels: [keyof NotificationPrefs, string][] = [
  ['offers', 'Trade offers'],
  ['messages', 'Messages'],
  ['followers', 'New followers'],
  ['hearts', 'Heart reactions'],
  ['system', 'System notices'],
];

export default function SettingsScreen() {
  const { dark, setDark } = useTheme();
  const { authenticated, signOut, user } = useAuth();
  const showToast = useToast();
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);

  useEffect(() => {
    void userService.getNotificationPrefs().then(setPrefs);
  }, []);

  function togglePref(key: keyof NotificationPrefs, value: boolean) {
    if (!prefs) return;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    void userService.updateNotificationPrefs(next);
  }

  async function logout() {
    await signOut();
    showToast('You’re signed out');
    router.navigate('/');
  }

  return (
    <Screen>
      <Card>
        <AppText variant="h2" style={styles.title}>
          Preferences
        </AppText>
        <ListRow icon={Moon} title="Dark mode" subtitle="Use a darker palette at night" toggle={{ value: dark, onChange: setDark }} />
        {prefs
          ? prefLabels.map(([key, label]) => (
              <ListRow
                key={key}
                icon={Bell}
                title={label}
                subtitle="Push notification preference"
                toggle={{ value: prefs[key], onChange: (value) => togglePref(key, value) }}
              />
            ))
          : null}
        <ListRow icon={Compass} title="Language" subtitle="English" onPress={() => showToast('More languages coming soon')} />
      </Card>
      <Card>
        <AppText variant="h2" style={styles.title}>
          Account & community
        </AppText>
        <ListRow icon={Gift} title="Referral rewards" subtitle="Invite friends to Barterdito" onPress={() => router.push('/referral')} />
        <ListRow icon={HandHeart} title="Support Barterdito" subtitle="Help keep local trading accessible" onPress={() => router.push('/donate')} />
        <ListRow icon={MessageSquare} title="Direct messages" subtitle="Conversations outside trade offers" onPress={() => router.push('/direct-messages')} />
        <ListRow icon={AlertTriangle} title="Dispute resolution" subtitle="File an issue and attach evidence" onPress={() => router.push('/disputes')} />
        <ListRow icon={Lock} title="Privacy policy" subtitle="How Barterdito handles account data" onPress={() => router.push('/privacy')} />
        <ListRow icon={Info} title="Terms of service" subtitle="Community and marketplace rules" onPress={() => router.push('/terms')} />
        <ListRow icon={CircleHelp} title="Help, FAQ & safety" subtitle="Trading guides and policies" onPress={() => router.push('/help')} />
        {user?.role === 'sentinel' || __DEV__ ? (
          <ListRow icon={ShieldCheck} title="Sentinel admin" subtitle="Moderation tools (preview)" onPress={() => router.push('/admin')} />
        ) : null}
      </Card>
      {authenticated ? (
        <Button label="Log out" icon={LogOut} variant="danger" onPress={() => void logout()} />
      ) : (
        <Button label="Log in" onPress={() => router.push('/login')} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: 4 },
});
