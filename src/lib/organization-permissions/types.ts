export type Permission = { id: string; name: string; group: string; description: string };
export type Role = { id: string; name: string; description: string; permission_ids: string[]; is_system?: boolean };
export type Member = {
  id: string;
  name: string;
  email: string;
  status: "active" | "invited";
  is_owner: boolean;
  roles: Role[];
  existing_access_preserved: boolean;
  permission_ids: string[];
  permission_overrides?: { granted: string[]; denied: string[] };
};
export type CurrentAccess = {
  user_id: string;
  is_owner: boolean;
  existing_access_preserved: boolean;
  permission_ids: string[];
};
export type UserIdentity = { id: string; name: string; email: string };
export type AccessData = {
  access: CurrentAccess;
  permissions: Permission[];
  roles: Role[];
  members: Member[];
  resourceErrors?: Partial<Record<"permissions" | "roles" | "members" | "users", string>>;
};
export type RoleInput = { name: string; description: string; permissions: string[] };
// Keep the existing organization user invitation fields, with optional roles.
export type InvitationInput = {
  firstname: string;
  lastName: string;
  email: string;
  credentials: { type: "password"; value: string; temporary: boolean }[];
  role_ids?: string[];
};
export type PermissionRequest = <T>(method: "GET" | "POST" | "PATCH" | "PUT", path: string, body?: unknown) => Promise<T>;
