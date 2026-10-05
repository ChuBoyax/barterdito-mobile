import { router, type Href } from 'expo-router';
import {
  Activity,
  BarChart3,
  Bookmark,
  CalendarDays,
  CircleHelp,
  Leaf,
  Map,
  MessageSquare,
  Settings,
  Sparkles,
  Trophy,
  type LucideIcon,
} from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppText, Avatar, Card, ListRow, Logo, Screen } from '@/components/ui';
import { useAuth, useTheme } from '@/providers';

const explore: { href: Href; label: string; subtitle: string; icon: LucideIcon }[] = [
  { href: '/leaderboard', label: 'Leaderboard', subtitle: 'Top local traders', icon: Trophy },
  { href: '/events', label: 'Trade Events', subtitle: 'Swap face-to-face', icon: CalendarDays },
  { href: '/community', label: 'Community', subtitle: 'Forum and campaigns', icon: MessageSquare },
  { href: '/map', label: 'Nearby Map', subtitle: 'Trades around you', icon: Map },
  { href: '/analytics', label: 'Seller Analytics', subtitle: 'How your listings perform', icon: BarChart3 },
  { href: '/recommendations', label: 'Trade Recommendations', subtitle: 'Picked for you', icon: Sparkles },
  { href: '/settings', label: 'Settings', subtitle: 'Preferences and account', icon: Settings },
];

const quick: { href: Href; label: string; icon: LucideIcon }[] = [
  { href: '/wishlist', label: 'Wishlist', icon: Bookmark },
  { href: '/activity', label: 'Activity', icon: Activity },
  { href: '/help', label: 'Help & Safety', icon: CircleHelp },
];

export default function MenuScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const go = (href: Href) => {
    router.back();
    router.push(href);
  };

  return (
    <Screen>
      <Logo />
      <Card onPress={() => go(user ? '/profile' : '/login')} style={styles.profile}>
        <Avatar initials={user?.initials ?? 'JR'} size="small" />
        <View style={styles.flex}>
          <AppText variant="h3">{user?.fullName ?? 'Guest trader'}</AppText>
          <AppText variant="caption">{user ? 'View profile' : 'Sign in to trade'}</AppText>
        </View>
      </Card>
      <Card>
        <AppText variant="eyebrow">Explore</AppText>
        {explore.map((entry) => (
          <ListRow key={entry.label} icon={entry.icon} title={entry.label} subtitle={entry.subtitle} onPress={() => go(entry.href)} />
        ))}
      </Card>
      <Card>
        {quick.map((entry) => (
          <ListRow key={entry.label} icon={entry.icon} title={entry.label} onPress={() => go(entry.href)} />
        ))}
      </Card>
      <View style={[styles.callout, { backgroundColor: colors.greenSoft }]}>
        <Leaf size={20} color={colors.green} />
        <View>
          <AppText variant="h3">4,812 items</AppText>
          <AppText variant="caption">given a second life this month</AppText>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  callout: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 16 },
});
