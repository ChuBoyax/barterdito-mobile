import { apiRequest, authenticatedRequest } from './api';

/** Database roles and permissions (`/access/*`). The backend authorizes every request. */

export type AccessRole = { code: string; name: string; description: string; isSystem: boolean; permissions: string[]; assignedUsers: number };
export type AccessPermission = { code: string; description: string };
export type AccessUser = { id: string; fullName: string; email: string; isActive: boolean; emailVerified: boolean; roles: string[] };
export type AccessAudit = {
  id: number;
  actorName: string;
  action: string;
  subjectType: string;
  subjectId: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  source: string;
  createdAt: string;
};
export type RoleWrite = { name: string; description: string; permissions: string[] };

type RoleRow = { code: string; name: string; description: string; is_system: boolean; permissions: string[]; assigned_users: number };
type UserRow = { id: string; full_name: string; email: string; is_active: boolean; email_verified: boolean; roles: string[] };
type AuditRow = {
  id: number;
  actor_name: string;
  action: string;
  subject_type: string;
  subject_id: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  source: string;
  created_at: string;
};

const get = <T>(url: string) => authenticatedRequest(() => apiRequest<T>(url));
const rolePath = (code: string) => `/access/roles/${encodeURIComponent(code)}`;

function toRole(row: RoleRow): AccessRole {
  return { code: row.code, name: row.name, description: row.description, isSystem: row.is_system, permissions: row.permissions, assignedUsers: row.assigned_users };
}

export const accessService = {
  async getRoles(): Promise<AccessRole[]> {
    return (await get<RoleRow[]>('/access/roles')).map(toRole);
  },

  getPermissions(): Promise<AccessPermission[]> {
    return get<AccessPermission[]>('/access/permissions');
  },

  async getUsers(query: string, offset = 0): Promise<{ users: AccessUser[]; total: number }> {
    const page = await get<{ users: UserRow[]; total: number }>(`/access/users?q=${encodeURIComponent(query)}&limit=25&offset=${offset}`);
    return {
      users: page.users.map((row) => ({ id: row.id, fullName: row.full_name, email: row.email, isActive: row.is_active, emailVerified: row.email_verified, roles: row.roles })),
      total: page.total,
    };
  },

  async assignRoles(userId: string, roles: string[]): Promise<void> {
    await authenticatedRequest(() => apiRequest(`/access/users/${encodeURIComponent(userId)}/roles`, { method: 'PUT', body: { roles } }));
  },

  async createRole(code: string, role: RoleWrite): Promise<void> {
    await authenticatedRequest(() => apiRequest('/access/roles', { method: 'POST', body: { code, ...role } }));
  },

  async updateRole(code: string, role: RoleWrite): Promise<void> {
    await authenticatedRequest(() => apiRequest(rolePath(code), { method: 'PUT', body: role }));
  },

  async deleteRole(code: string): Promise<void> {
    await authenticatedRequest(() => apiRequest(rolePath(code), { method: 'DELETE' }));
  },

  async getAudit(offset = 0): Promise<{ entries: AccessAudit[]; total: number }> {
    const page = await get<{ entries: AuditRow[]; total: number }>(`/access/audit?limit=25&offset=${offset}`);
    return {
      entries: page.entries.map((row) => ({
        id: row.id,
        actorName: row.actor_name,
        action: row.action,
        subjectType: row.subject_type,
        subjectId: row.subject_id,
        before: row.before,
        after: row.after,
        source: row.source,
        createdAt: row.created_at,
      })),
      total: page.total,
    };
  },
};
