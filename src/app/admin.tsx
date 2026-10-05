import { CalendarDays, CheckCircle2, Flag, HandHeart, Lock, Package, ShieldCheck, Users } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { RequireAuth } from '@/components/layout';
import { StatGrid } from '@/components/marketplace';
import { AppText, Card, EmptyState, ListRow, LoadingView, Screen, SectionHeading } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useAuth, useTheme, useToast } from '@/providers';
import { communityService } from '@/services';

export default function AdminScreen() {
  return (
    <RequireAuth>
      <AdminContent />
    </RequireAuth>
  );
}

function AdminContent() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const showToast = useToast();
  const allowed = user?.role === 'sentinel' || __DEV__;
  const { data: summary, loading } = useAsync(() => communityService.getAdminSummary(), []);

  if (!allowed) {
    return (
      <Screen>
        <EmptyState
          icon={Lock}
          title="Sentinel access only"
          text="Your account must have the sentinel role. This check must also be enforced by database RLS and server routes."
        />
      </Screen>
    );
  }
  if (loading || !summary) return <LoadingView />;

  return (
    <Screen>
      <View style={[styles.warning, { backgroundColor: colors.orangeSoft }]}>
        <ShieldCheck size={22} color={colors.orange} />
        <View style={styles.flex}>
          <AppText variant="h3">Sentinel access</AppText>
          <AppText variant="caption">Actions are logged and require server-side role verification.</AppText>
        </View>
      </View>
      <StatGrid
        stats={[
          { label: 'Users', value: summary.users, icon: Users },
          { label: 'Active posts', value: summary.activePosts, icon: Package },
          { label: 'Open reports', value: summary.openReports, icon: Flag },
          { label: 'Completed trades', value: summary.completedTrades, icon: CheckCircle2 },
        ]}
      />
      <Card>
        <SectionHeading eyebrow="Moderation" title="Flagged content" />
        <EmptyState icon={ShieldCheck} title="Moderation queue is clear" text="New user and item reports will appear here." />
      </Card>
      <Card>
        <SectionHeading eyebrow="Tools" title="Management" />
        <ListRow icon={CalendarDays} title="Create trade event" subtitle="Publish a verified community meetup" onPress={() => showToast('Event editor opened')} />
        <ListRow icon={HandHeart} title="Manage campaigns" subtitle="Review goals and campaign status" onPress={() => showToast('Campaign editor opened')} />
        <ListRow icon={Users} title="User management" subtitle="Review, ban, or restore accounts" onPress={() => showToast('User management opened')} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  warning: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, padding: 14 },
  flex: { flex: 1 },
});
