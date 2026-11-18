import type { AccessData, Member, Permission, PermissionRequest, Role } from "./types";

type RoleInput = Pick<Role, "name" | "description" | "permission_ids">;
type InvitationInput = { name: string; email: string; role_ids?: string[] };

// This adapter is deliberately local. It never calls the backend or reads/writes auth storage.
const catalog: Permission[] = [
  { id: "organization.view", name: "View organization", group: "Organization", description: "View company details and settings." },
  { id: "organization.edit", name: "Edit organization", group: "Organization", description: "Update company details and settings." },
  { id: "members.view", name: "View users", group: "Organization", description: "View the organization's users." },
  { id: "reports.view", name: "View reports", group: "Reports & billing", description: "View usage and campaign reports." },
  { id: "billing.view", name: "View billing", group: "Reports & billing", description: "View balances and transaction history." },
  { id: "billing.topup", name: "Top up balances", group: "Reports & billing", description: "Add funds to service balances." },
  { id: "contacts.view", name: "View contacts", group: "Contacts", description: "View contacts and groups." },
  { id: "contacts.manage", name: "Manage contacts", group: "Contacts", description: "Create and update contacts and groups." },
  { id: "sms.view", name: "View SMS", group: "Messaging", description: "View SMS campaigns and messages." },
  { id: "sms.send", name: "Send SMS", group: "Messaging", description: "Create and send SMS campaigns." },
  { id: "whatsapp.view", name: "View WhatsApp", group: "Messaging", description: "View WhatsApp conversations and campaigns." },
  { id: "whatsapp.send", name: "Send WhatsApp messages", group: "Messaging", description: "Reply to conversations and send campaigns." },
  { id: "airtime.view", name: "View airtime", group: "Rewards", description: "View airtime campaigns and rewards." },
  { id: "airtime.send", name: "Send airtime", group: "Rewards", description: "Distribute airtime rewards." },
  { id: "data.view", name: "View data rewards", group: "Rewards", description: "View data campaigns and rewards." },
  { id: "data.send", name: "Send data rewards", group: "Rewards", description: "Distribute data rewards." },
];

function seed(): AccessData {
  const roles: Role[] = [
    { id: "role-campaigns", name: "Campaign manager", description: "Manage contacts and send messaging campaigns.", permission_ids: ["organization.view", "contacts.view", "contacts.manage", "sms.view", "sms.send", "whatsapp.view", "whatsapp.send", "reports.view"] },
    { id: "role-finance", name: "Finance", description: "Monitor spending, balances, and service usage.", permission_ids: ["organization.view", "billing.view", "billing.topup", "reports.view"] },
    { id: "role-viewer", name: "Viewer", description: "View campaigns and reports without making changes.", permission_ids: ["organization.view", "contacts.view", "sms.view", "whatsapp.view", "airtime.view", "data.view", "reports.view"] },
  ];
  return {
    access: { user_id: "user-owner", is_owner: true, existing_access_preserved: false, permission_ids: catalog.map((permission) => permission.id) },
    permissions: catalog,
    roles,
    members: [
      { id: "user-owner", name: "Alex Morgan", email: "alex@example.com", status: "active", is_owner: true, roles: [], existing_access_preserved: false, permission_ids: catalog.map((permission) => permission.id) },
      { id: "user-grace", name: "Grace Wanjiku", email: "grace@example.com", status: "active", is_owner: false, roles: [], existing_access_preserved: true, permission_ids: catalog.map((permission) => permission.id) },
      { id: "user-david", name: "David Otieno", email: "david@example.com", status: "active", is_owner: false, roles: [], existing_access_preserved: true, permission_ids: ["organization.view", "reports.view", "billing.view"] },
      { id: "user-sarah", name: "Sarah Kimani", email: "sarah@example.com", status: "active", is_owner: false, roles: [roles[0]], existing_access_preserved: false, permission_ids: roles[0].permission_ids },
      { id: "user-james", name: "James Mwangi", email: "james@example.com", status: "active", is_owner: false, roles: [roles[1], roles[2]], existing_access_preserved: false, permission_ids: Array.from(new Set([...roles[1].permission_ids, ...roles[2].permission_ids])) },
      { id: "user-amina", name: "Amina Hassan", email: "amina@example.com", status: "invited", is_owner: false, roles: [roles[2]], existing_access_preserved: false, permission_ids: roles[2].permission_ids },
    ],
  };
}

const copy = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

// Separate stores make organization switching and tests independent. Changes last for this page session.
export function createDemoPermissionRequest({ delay = 250, isOwner = true }: { delay?: number; isOwner?: boolean } = {}): PermissionRequest {
  const organizations = new Map<string, AccessData>();
  const legacyAccess = new WeakMap<Member, string[]>();
  let nextId = 1;
  return async <T,>(method: string, path: string, body?: unknown): Promise<T> => {
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    const match = path.match(/^\/api\/v2\/organization\/([^/]+)(\/.*)$/);
    if (!match) throw new Error("Unknown organization endpoint.");
    const [, orgId, route] = match;
    if (!organizations.has(orgId)) {
      const data = copy(seed());
      data.access.is_owner = isOwner;
      if (!isOwner) data.access = { ...data.access, user_id: "user-grace", existing_access_preserved: true };
      data.members.filter((member) => member.existing_access_preserved)
        .forEach((member) => legacyAccess.set(member, [...member.permission_ids]));
      organizations.set(orgId, data);
    }
    const data = organizations.get(orgId)!;
    if (method === "GET") {
      const resources: Record<string, unknown> = { "/me/permissions": data.access, "/permissions": data.permissions, "/roles": data.roles, "/members": data.members };
      if (!(route in resources)) throw new Error("Unknown permission endpoint.");
      return copy(resources[route]) as T;
    }
    if (!data.access.is_owner) throw new Error("Only the organization owner can manage users and roles.");

    const roleSelection = (ids: string[]) => {
      if (!Array.isArray(ids) || ids.some((id) => !data.roles.some((role) => role.id === id))) throw new Error("A selected role is no longer available. Refresh and try again.");
      return data.roles.filter((role) => ids.includes(role.id));
    };
    const basePermissions = (member: Member) => legacyAccess.get(member) ?? Array.from(new Set(member.roles.flatMap((role) => role.permission_ids)));
    const refreshMemberAccess = (member: Member) => {
      const { granted = [], denied = [] } = member.permission_overrides ?? {};
      member.permission_ids = Array.from(new Set([...basePermissions(member), ...granted])).filter((id) => !denied.includes(id));
      if (member.id === data.access.user_id) data.access = { ...data.access, permission_ids: member.permission_ids, existing_access_preserved: member.existing_access_preserved };
    };
    const assign = (member: Member, roles: Role[]) => {
      member.roles = roles;
      legacyAccess.delete(member);
      delete member.permission_overrides;
      member.existing_access_preserved = false;
      refreshMemberAccess(member);
    };
    const memberRoute = route.match(/^\/members\/([^/]+)\/(roles|permissions)$/);
    if (method === "PUT" && memberRoute) {
      const member = data.members.find((item) => item.id === decodeURIComponent(memberRoute[1]));
      if (!member) throw new Error("This user is no longer in the organization.");
      if (member.is_owner) throw new Error("The organization owner retains full access.");
      if (memberRoute[2] === "permissions") {
        const selected = (body as { permission_ids: string[] }).permission_ids;
        if (!Array.isArray(selected) || selected.some((id) => !data.permissions.some((permission) => permission.id === id))) throw new Error("Select permissions from the permission catalog.");
        const base = basePermissions(member);
        member.permission_overrides = {
          granted: Array.from(new Set(selected.filter((id) => !base.includes(id)))),
          denied: base.filter((id) => !selected.includes(id)),
        };
        member.existing_access_preserved = false;
        refreshMemberAccess(member);
      } else {
        assign(member, roleSelection((body as { role_ids: string[] }).role_ids));
      }
      return copy(member) as T;
    }
    if ((method === "POST" && route === "/roles") || (method === "PUT" && /^\/roles\/[^/]+$/.test(route))) {
      const input = body as RoleInput;
      if (!input.name?.trim()) throw new Error("Enter a role name.");
      if (!Array.isArray(input.permission_ids) || input.permission_ids.some((id) => !data.permissions.some((permission) => permission.id === id))) throw new Error("Select permissions from the permission catalog.");
      const id = method === "PUT" ? decodeURIComponent(route.slice(7)) : `role-custom-${nextId++}`;
      if (data.roles.some((role) => role.id !== id && role.name.toLowerCase() === input.name.trim().toLowerCase())) throw new Error("A role with this name already exists.");
      const role: Role = { id, name: input.name.trim(), description: input.description.trim(), permission_ids: Array.from(new Set(input.permission_ids)) };
      const index = data.roles.findIndex((item) => item.id === id);
      if (method === "PUT" && index < 0) throw new Error("This role no longer exists.");
      if (index < 0) data.roles.push(role); else data.roles[index] = role;
      // Only explicitly assigned members inherit role edits. Legacy access remains intact.
      data.members.filter((member) => !member.is_owner && !member.existing_access_preserved && member.roles.some((item) => item.id === id))
        .forEach((member) => {
          member.roles = member.roles.map((item) => item.id === id ? role : item);
          refreshMemberAccess(member);
        });
      return copy(role) as T;
    }
    if (method === "POST" && route === "/users") {
      const input = body as InvitationInput;
      if (!input.name?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) throw new Error("Enter a name and a valid email address.");
      const existing = data.members.find((member) => member.email.toLowerCase() === input.email.trim().toLowerCase());
      const roles = input.role_ids === undefined ? undefined : roleSelection(input.role_ids);
      if (existing) {
        if (existing.is_owner) throw new Error("The organization owner does not need an invitation.");
        if (roles !== undefined) assign(existing, roles);
        return copy(existing) as T;
      }
      const member: Member = { id: `user-invited-${nextId++}`, name: input.name.trim(), email: input.email.trim().toLowerCase(), status: "invited", is_owner: false, roles: [], existing_access_preserved: false, permission_ids: [] };
      if (roles !== undefined) assign(member, roles);
      data.members.push(member);
      return copy(member) as T;
    }
    throw new Error("Unknown permission endpoint.");
  };
}

export const demoPermissionRequest = createDemoPermissionRequest();
