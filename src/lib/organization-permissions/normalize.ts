import type { CurrentAccess, Member, Permission, Role, UserIdentity } from "./types";

type Fields = Record<string, unknown>;
const object = (value: unknown): Fields => value && typeof value === "object" && !Array.isArray(value) ? value as Fields : {};
const string = (value: unknown) => typeof value === "string" || typeof value === "number" ? String(value) : "";
export function unwrap(value: unknown): unknown {
  return object(value).data !== undefined ? unwrap(object(value).data) : value;
}
function list(value: unknown, key: string): unknown[] {
  const payload = unwrap(value);
  if (Array.isArray(payload)) return payload;
  const items = object(payload)[key] ?? object(payload).items;
  if (Array.isArray(items)) return items;
  throw new Error(`The service returned an invalid ${key} response. Refresh and try again.`);
}
export function permissionIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map((item) => {
    const permission = object(item);
    return string(permission.key ?? permission.code ?? permission.permission ?? permission.id ?? item);
  }).filter(Boolean)));
}

export function normalizePermissions(value: unknown): Permission[] {
  const payload = unwrap(value);
  const root = object(payload);
  const source = root.permissions ?? root.modules ?? root.items ?? payload;
  const permissions: Permission[] = [];
  const add = (entry: unknown, module = "") => {
    const item = object(entry);
    const children = item.permissions;
    const moduleInfo = object(item.module);
    const groupInfo = object(item.group);
    const group = string(item.module_label ?? moduleInfo.label ?? moduleInfo.name ?? groupInfo.label ?? groupInfo.name) || module || string(item.module ?? item.group) || "Other";
    if (Array.isArray(children)) {
      children.forEach((child) => add(child, string(item.label ?? item.name ?? item.module_label ?? item.module) || module));
      return;
    }
    const id = string(item.key ?? item.code ?? item.permission ?? item.id ?? entry);
    if (id) permissions.push({ id, name: string(item.label ?? item.name) || id, group, description: string(item.description) });
  };
  if (Array.isArray(source)) source.forEach((item) => add(item));
  else if (source && typeof source === "object") {
    Object.entries(source).forEach(([module, entries]) => {
      if (Array.isArray(entries)) entries.forEach((entry) => add(entry, module));
      else if (Array.isArray(object(entries).permissions)) add({ ...object(entries), name: object(entries).label ?? module });
    });
  } else throw new Error("The service returned an invalid permission catalog.");
  return Array.from(new Map(permissions.map((permission) => [permission.id, permission])).values());
}

export function normalizeRole(value: unknown): Role {
  const payload = object(unwrap(value));
  const role = object(payload.role ?? payload);
  const id = string(role.id ?? role.role_id);
  if (!id) throw new Error("The service returned a role without an ID. Refresh and try again.");
  return {
    id, name: string(role.name), description: string(role.description),
    permission_ids: permissionIds(role.permissions ?? role.permission_ids),
    is_system: role.is_system === true || role.is_system_role === true || role.is_builtin === true || role.is_built_in === true || role.system === true || role.type === "system",
  };
}
export const normalizeRoles = (value: unknown) => list(value, "roles").map(normalizeRole);

export function normalizeAccess(value: unknown): CurrentAccess {
  const access = object(unwrap(value));
  if (typeof access.is_owner !== "boolean") throw new Error("Unable to verify organization ownership. Refresh and try again.");
  return {
    user_id: string(access.user_id), is_owner: access.is_owner,
    existing_access_preserved: access.existing_access_preserved === true,
    permission_ids: permissionIds(access.permissions ?? access.permission_ids ?? access.effective_permissions),
  };
}

function userName(user: Fields): string {
  return string(user.name).trim() || [user.firstName ?? user.firstname ?? user.first_name, user.lastName ?? user.lastname ?? user.last_name].map(string).filter(Boolean).join(" ").trim();
}

export function normalizeUsers(value: unknown): UserIdentity[] {
  return list(value, "users").map((entry) => {
    const user = object(entry);
    return { id: string(user.user_id ?? user.id), name: userName(user), email: string(user.email) };
  }).filter((user) => user.id);
}

export function normalizeMembers(value: unknown, roles: Role[], access: CurrentAccess, users: UserIdentity[] = []): Member[] {
  const identities = new Map(users.map((user) => [user.id, user]));
  return list(value, "members").map((entry) => {
    const member = object(entry);
    const user = object(member.user ?? member);
    const id = string(member.user_id ?? user.id ?? member.id);
    if (!id) throw new Error("The service returned a member without a user ID.");
    const assigned = member.roles ?? member.role_ids ?? [];
    const memberRoles = (Array.isArray(assigned) ? assigned : []).map((item) => {
      const roleId = string(object(item).id ?? object(item).role_id ?? item);
      return roles.find((role) => role.id === roleId) ?? normalizeRole(typeof item === "object" ? item : { id: roleId, name: roleId });
    });
    const identity = identities.get(id);
    const email = string(user.email) || identity?.email || "";
    return {
      id, name: userName(user) || identity?.name || email || "Organization user",
      email, status: member.status === "invited" || member.status === "pending" ? "invited" : "active",
      is_owner: member.is_owner === true || user.is_owner === true || (access.is_owner && id === access.user_id),
      roles: memberRoles,
      // Empty role lists never imply an intentional access revocation. Explicit false
      // from the backend identifies a user already managed by roles.
      existing_access_preserved: member.existing_access_preserved === true || (member.existing_access_preserved !== false && memberRoles.length === 0),
      permission_ids: permissionIds(member.permissions ?? member.permission_ids ?? member.effective_permissions),
    };
  });
}
