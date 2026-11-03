import { Lock } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AccountsPanel, HistoryPanel, ReportsPanel, RolesPanel } from '@/components/admin';
import { RequireAuth } from '@/components/layout';
import { AppText, Chip, EmptyState, Screen } from '@/components/ui';
import { usePolling } from '@/hooks/useTradeConversation';
import { useAuth } from '@/providers';
import { canOpenAdministration, hasPermission } from '@/utils/permissions';

/** A removed role should take effect here without needing to sign in again. */
const PERMISSION_REFRESH_MS = 30_000;

type Panel = 'reports' | 'accounts' | 'roles' | 'history';

export default function AdminScreen() {
  return (
    <RequireAuth>
      <AdminContent />
    </RequireAuth>
  );
}

function AdminContent() {
  const { user, refreshUser } = useAuth();
  const [chosen, setChosen] = useState<Panel | null>(null);

  usePolling(() => void refreshUser(), PERMISSION_REFRESH_MS);

  if (!canOpenAdministration(user)) {
    return (
      <Screen>
        <EmptyState icon={Lock} title="Staff access only" text="Your account does not have permission to open Administration." />
      </Screen>
    );
  }

  const canReview = hasPermission(user, 'message_reports.review');
  const canManageUsers = hasPermission(user, 'users.roles.manage');
  const panels: { value: Panel; label: string; allowed: boolean }[] = [
    { value: 'reports', label: 'Message reports', allowed: canReview || hasPermission(user, 'message_reports.read') },
    { value: 'accounts', label: 'Accounts', allowed: hasPermission(user, 'users.read') },
    { value: 'roles', label: 'Roles', allowed: hasPermission(user, 'roles.manage') },
    { value: 'history', label: 'Access history', allowed: hasPermission(user, 'audit.read') },
  ];
  const allowed = panels.filter((panel) => panel.allowed);
  // Permissions can change while this is open, so fall back to a panel that is still allowed.
  const panel = allowed.find((entry) => entry.value === chosen)?.value ?? allowed[0]?.value;

  return (
    <Screen>
      <AppText variant="small">Every action here is checked by the server and recorded.</AppText>
      {allowed.length > 1 ? (
        <View style={styles.tabs}>
          {allowed.map((entry) => (
            <Chip key={entry.value} label={entry.label} active={panel === entry.value} onPress={() => setChosen(entry.value)} />
          ))}
        </View>
      ) : null}
      {panel === 'reports' ? <ReportsPanel canReview={canReview} /> : null}
      {panel === 'accounts' ? <AccountsPanel canManage={canManageUsers} /> : null}
      {panel === 'roles' ? <RolesPanel /> : null}
      {panel === 'history' ? <HistoryPanel /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
