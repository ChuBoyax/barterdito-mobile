import { useQuery } from '@tanstack/react-query';
import { Plus, RotateCcw, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Badge, BottomSheet, Button, Card, EmptyState, LoadingView, TextField } from '@/components/ui';
import { queryClient, useAuth, useToast } from '@/providers';
import { accessService, type AccessPermission, type AccessRole } from '@/services/accessService';
import { queryKeys } from '@/services/queryKeys';
import { confirmAction } from '@/utils/confirm';
import { errorMessage } from '@/utils/format';
import { CheckRow } from './CheckRow';

const FIXED_ROLES = ['user', 'admin'];
const CODE_PATTERN = /^[a-z][a-z0-9_-]{2,39}$/;
const READ_REPORTS = 'message_reports.read';
const REVIEW_REPORTS = 'message_reports.review';

export function RolesPanel() {
  const roles = useQuery({ queryKey: queryKeys.accessRoles, queryFn: () => accessService.getRoles(), meta: { persist: false } });
  const permissions = useQuery({ queryKey: queryKeys.accessPermissions, queryFn: () => accessService.getPermissions(), meta: { persist: false } });
  // `undefined` is closed, `null` creates a role.
  const [editing, setEditing] = useState<AccessRole | null | undefined>(undefined);

  if (roles.isPending || permissions.isPending) return <LoadingView variant="list" inline />;
  if (!roles.data || !permissions.data) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Could not load roles"
        text={errorMessage(roles.error ?? permissions.error)}
        action="Try again"
        actionIcon={RotateCcw}
        onAction={() => {
          void roles.refetch();
          void permissions.refetch();
        }}
      />
    );
  }

  return (
    <>
      <Button label="Create role" icon={Plus} variant="secondary" onPress={() => setEditing(null)} />
      {roles.data.map((role) => (
        <Card key={role.code} style={styles.card}>
          <View style={styles.heading}>
            <AppText variant="h3" numberOfLines={1} style={styles.flex}>
              {role.name}
            </AppText>
            {role.isSystem ? <Badge label="System" /> : null}
          </View>
          {role.description ? <AppText variant="small">{role.description}</AppText> : null}
          <AppText variant="caption">
            {role.permissions.length} {role.permissions.length === 1 ? 'permission' : 'permissions'} · {role.assignedUsers} {role.assignedUsers === 1 ? 'account' : 'accounts'}
          </AppText>
          {FIXED_ROLES.includes(role.code) ? <AppText variant="caption">This role is fixed.</AppText> : <Button label="Edit role" variant="secondary" compact onPress={() => setEditing(role)} />}
        </Card>
      ))}
      {editing !== undefined ? <RoleEditorSheet key={editing?.code ?? 'new'} role={editing} catalog={permissions.data} onClose={() => setEditing(undefined)} /> : null}
    </>
  );
}

function RoleEditorSheet({ role, catalog, onClose }: { role: AccessRole | null; catalog: AccessPermission[]; onClose: () => void }) {
  const { refreshUser } = useAuth();
  const showToast = useToast();
  const [code, setCode] = useState(role?.code ?? '');
  const [name, setName] = useState(role?.name ?? '');
  const [description, setDescription] = useState(role?.description ?? '');
  const [selected, setSelected] = useState(() => new Set(role?.permissions ?? []));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function toggle(permission: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(permission)) {
        next.delete(permission);
        // Reviewing reports requires being able to read them.
        if (permission === READ_REPORTS) next.delete(REVIEW_REPORTS);
      } else {
        next.add(permission);
        if (permission === REVIEW_REPORTS) next.add(READ_REPORTS);
      }
      return next;
    });
  }

  async function run(action: () => Promise<void>, done: string, fallback: string) {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await action();
      void queryClient.invalidateQueries({ queryKey: queryKeys.access });
      void refreshUser();
      showToast(done);
      onClose();
    } catch (caught) {
      setError(errorMessage(caught, fallback));
      setBusy(false);
    }
  }

  function save() {
    if (!CODE_PATTERN.test(code)) return setError('Use a code of 3–40 lowercase letters, numbers, underscores or hyphens, starting with a letter.');
    if (name.trim().length < 2) return setError('Enter a role name of at least 2 characters.');
    const body = { name: name.trim(), description: description.trim(), permissions: [...selected].sort() };
    void run(() => (role ? accessService.updateRole(role.code, body) : accessService.createRole(code, body)), 'Role saved', 'Could not save this role. Try again.');
  }

  async function remove() {
    if (!role) return;
    const confirmed = await confirmAction({ title: `Delete ${role.name}?`, message: 'This removes the unused role. This cannot be undone.', confirmLabel: 'Delete role', destructive: true });
    if (confirmed) void run(() => accessService.deleteRole(role.code), 'Role deleted', 'Could not delete this role. Try again.');
  }

  return (
    <BottomSheet visible onClose={onClose} eyebrow="Administration" title={role ? `Edit ${role.name}` : 'Create role'}>
      <TextField
        label="Role code"
        required
        value={code}
        onChangeText={setCode}
        editable={!role}
        maxLength={40}
        autoCapitalize="none"
        autoCorrect={false}
        hint="A unique lowercase code. It cannot be changed after creation."
      />
      <TextField label="Name" required value={name} onChangeText={setName} maxLength={120} />
      <TextField label="Description" multiline value={description} onChangeText={setDescription} maxLength={400} />
      <AppText variant="h3">Permissions</AppText>
      <View>
        {catalog.map((permission) => (
          <CheckRow key={permission.code} title={permission.description} subtitle={permission.code} checked={selected.has(permission.code)} disabled={busy} onToggle={() => toggle(permission.code)} />
        ))}
      </View>
      {error ? (
        <AppText variant="caption" color="red" weight="semibold">
          {error}
        </AppText>
      ) : null}
      <Button label="Save role" loading={busy} onPress={save} />
      {role && !role.isSystem ? (
        <>
          <Button label="Delete role" variant="danger" disabled={busy || role.assignedUsers > 0} onPress={() => void remove()} />
          {role.assignedUsers > 0 ? <AppText variant="caption">Reassign its users before deleting this role.</AppText> : null}
        </>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { gap: 8 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
