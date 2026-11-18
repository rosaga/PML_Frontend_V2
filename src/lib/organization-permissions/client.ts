import { organizationPermissionRequest, OrganizationAccessError } from "./request";
import { normalizeAccess, normalizeMembers, normalizePermissions, normalizeRole, normalizeRoles, normalizeUsers } from "./normalize";
import type { AccessData, InvitationInput, PermissionRequest, RoleInput, UserIdentity } from "./types";

function numericRoleIds(roleIds: string[]): number[] {
  // Checkbox IDs are strings; the Go API expects role_ids to contain uint values.
  return roleIds.map((id) => {
    const value = /^\d+$/.test(id) ? Number(id) : NaN;
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error("A selected role has an invalid numeric ID. Reload the roles and try again.");
    }
    return value;
  });
}

export function createOrganizationPermissionsClient(orgId: string, request: PermissionRequest = organizationPermissionRequest) {
  if (!orgId) throw new Error("Select an organization first.");
  const prefix = `/api/v2/organization/${encodeURIComponent(orgId)}`;
  const getRole = async (roleId: string) => normalizeRole(await request("GET", `${prefix}/roles/${encodeURIComponent(roleId)}`));
  async function loadUserIdentities(memberIds: string[]): Promise<UserIdentity[]> {
    const users = new Map<string, UserIdentity>();
    for (let page = 1; ; page++) {
      // /members holds access data; /users is the existing Data user directory.
      const payload = await request("GET", `${prefix}/users?page=${page}&size=100&orderby=id%20DESC`);
      const batch = normalizeUsers(payload);
      const previousSize = users.size;
      batch.forEach((user) => users.set(user.id, user));
      if (users.size === previousSize || memberIds.every((id) => users.has(id))) break;
    }
    return Array.from(users.values());
  }
  return {
    async loadInvitationOptions() {
      const access = normalizeAccess(await request("GET", `${prefix}/me/permissions`));
      const roles = normalizeRoles(await request("GET", `${prefix}/roles`));
      return { access, roles };
    },
    async load(): Promise<AccessData> {
      const access = normalizeAccess(await request("GET", `${prefix}/me/permissions`));
      const resources = ["permissions", "roles", "members"] as const;
      const results = await Promise.allSettled(resources.map((resource) => request("GET", `${prefix}/${resource}`)));
      const resourceErrors: AccessData["resourceErrors"] = {};
      const payloads = results.map((result, index) => {
        if (result.status === "fulfilled") return result.value;
        if (!(result.reason instanceof OrganizationAccessError) || result.reason.status !== 403) throw result.reason;
        resourceErrors[resources[index]] = result.reason.message;
        return [];
      });
      const permissions = normalizePermissions(payloads[0]);
      const roles = normalizeRoles(payloads[1]);
      let members = normalizeMembers(payloads[2], roles, access);
      const missingIdentities = members.filter((member) => !member.email || member.name === "Organization user" || member.name === member.email);
      if (missingIdentities.length) {
        try {
          const users = await loadUserIdentities(missingIdentities.map((member) => member.id));
          members = normalizeMembers(payloads[2], roles, access, users);
        } catch (error) {
          resourceErrors.users = error instanceof Error ? error.message : "Unable to load user names and emails.";
        }
      }
      return { access, permissions, roles, members, resourceErrors };
    },
    getRole,
    saveMemberRoles: async (userId: string, roleIds: string[]) => request("PUT", `${prefix}/members/${encodeURIComponent(userId)}/roles`, { role_ids: numericRoleIds(roleIds) }),
    async saveRole(roleId: string | null, input: RoleInput) {
      const fields = { name: input.name.trim(), description: input.description.trim() };
      if (!roleId) {
        const created = normalizeRole(await request("POST", `${prefix}/roles`, { ...fields, permissions: [...input.permissions] }));
        try { return await getRole(created.id); }
        catch (error) {
          throw new OrganizationAccessError("Role was created, but the saved role could not be reloaded. Reload the role before making more changes.", error instanceof OrganizationAccessError ? error.status : 0, created.id);
        }
      }
      const current = await getRole(roleId);
      if (current.is_system) throw new Error("Built-in system roles cannot be edited or deleted.");
      const path = `${prefix}/roles/${encodeURIComponent(roleId)}`;
      await request("PATCH", path, fields);
      try {
        // This endpoint replaces the complete permission set, including an intentional [].
        await request("PUT", `${path}/permissions`, { permissions: [...input.permissions] });
      } catch (error) {
        const detail = error instanceof Error ? error.message : "Please try again.";
        throw new OrganizationAccessError(`Role name and description were saved, but permissions were not saved. ${detail}`, error instanceof OrganizationAccessError ? error.status : 0);
      }
      try { return await getRole(roleId); }
      catch (error) {
        throw new OrganizationAccessError("Role changes were saved, but the saved role could not be reloaded. Reload the role to verify its permissions.", error instanceof OrganizationAccessError ? error.status : 0, roleId);
      }
    },
    invite: async (input: InvitationInput) => request("POST", `${prefix}/users`, {
      firstname: input.firstname.trim(), lastName: input.lastName.trim(), email: input.email.trim(), credentials: input.credentials,
      ...(input.role_ids !== undefined ? { role_ids: numericRoleIds(input.role_ids) } : {}),
    }),
  };
}
