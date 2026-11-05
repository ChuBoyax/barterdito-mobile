import { useQuery } from '@tanstack/react-query';
import { RotateCcw, Search, Users } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Badge, BottomSheet, Button, Card, EmptyState, LoadingView, TextField } from '@/components/ui';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { usePagedQuery } from '@/hooks/usePagedQuery';
import { queryClient, useAuth, useToast } from '@/providers';
import { accessService, type AccessRole, type AccessUser } from '@/services/accessService';
import { queryKeys } from '@/services/queryKeys';
import { errorMessage } from '@/utils/format';
import { CheckRow } from './CheckRow';

const selectUsers = (page: { users: AccessUser[]; total: number }) => page.users;

export function AccountsPanel({ canManage }: { canManage: boolean }) {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<AccessUser | null>(null);

  const needle = useDebouncedValue(search.trim());

  const users = usePagedQuery(queryKeys.accessUsers(needle), (offset) => accessService.getUsers(needle, offset), selectUsers, { persist: false });
  const { data: roles = [] } = useQuery({ queryKey: queryKeys.accessRoles, queryFn: () => accessService.getRoles(), enabled: canManage, meta: { persist: false } });

  return (
    <>
      <TextField icon={Search} value={search} onChangeText={setSearch} placeholder="Search name or email" autoCapitalize="none" autoCorrect={false} />
      {users.isPending ? (
        <LoadingView variant="list" inline />
      ) : users.isError && !users.rows.length ? (
        <EmptyState icon={Users} title="Could not load accounts" text={errorMessage(users.error)} action="Try again" actionIcon={RotateCcw} onAction={() => void users.refetch()} />
      ) : !users.rows.length ? (
        <EmptyState icon={Users} title="No accounts found" text="Try another name or email." />
      ) : (
        <>
          {users.rows.map((account) => (
            <Card key={account.id} style={styles.card}>
              <AppText variant="h3" numberOfLines={1}>
                {account.fullName || account.email}
              </AppText>
              <AppText variant="caption" numberOfLines={1}>
                {account.email}
              </AppText>
              <View style={styles.badges}>
                {account.roles.map((code) => (
                  <Badge key={code} label={roles.find((role) => role.code === code)?.name ?? code} tone="orange" />
                ))}
                {!account.isActive ? <Badge label="Inactive" tone="red" /> : null}
                {!account.emailVerified ? <Badge label="Unverified" /> : null}
              </View>
              {canManage ? <Button label="Manage roles" variant="secondary" compact disabled={!roles.length} onPress={() => setEditing(account)} /> : null}
            </Card>
          ))}
          {users.hasNextPage ? <Button label="Load more accounts" variant="secondary" loading={users.isFetchingNextPage} onPress={() => void users.fetchNextPage()} /> : null}
        </>
      )}
      {editing ? <UserRolesSheet key={editing.id} account={editing} roles={roles} onClose={() => setEditing(null)} /> : null}
    </>
  );
}

function UserRolesSheet({ account, roles, onClose }: { account: AccessUser; roles: AccessRole[]; onClose: () => void }) {
  const { refreshUser } = useAuth();
  const showToast = useToast();
  // Every account keeps the baseline role.
  const [selected, setSelected] = useState(() => new Set([...account.roles, 'user']));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function toggle(code: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  async function save() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await accessService.assignRoles(account.id, [...selected].sort());
      void queryClient.invalidateQueries({ queryKey: queryKeys.access });
      // You may have just changed your own access.
      void refreshUser();
      showToast('Roles saved');
      onClose();
    } catch (caught) {
      setError(errorMessage(caught, 'Could not save roles. Try again.'));
      setBusy(false);
    }
  }

  return (
    <BottomSheet visible onClose={onClose} eyebrow={account.email} title={account.fullName || 'Roles'}>
      <AppText variant="small">Roles combine their permissions. User is the baseline for every account. The last active Admin must remain assigned.</AppText>
      <View>
        {roles.map((role) => (
          <CheckRow key={role.code} title={role.name} subtitle={role.description} checked={selected.has(role.code)} disabled={busy || role.code === 'user'} onToggle={() => toggle(role.code)} />
        ))}
      </View>
      {error ? (
        <AppText variant="caption" color="red" weight="semibold">
          {error}
        </AppText>
      ) : null}
      <Button label="Save roles" loading={busy} onPress={() => void save()} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  card: { gap: 8 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
