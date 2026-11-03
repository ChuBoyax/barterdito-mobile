import type { User } from '@/types/models';

const administrationPermissions = ['message_reports.read', 'message_reports.review', 'users.read', 'users.roles.manage', 'roles.manage', 'audit.read'];

/** Decides what the app shows only; the backend checks permissions on every request. */
export function hasPermission(user: User | null | undefined, permission: string) {
  return user?.permissions?.includes(permission) === true;
}

export function canOpenAdministration(user: User | null | undefined) {
  return administrationPermissions.some((permission) => hasPermission(user, permission));
}
