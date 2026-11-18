"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Crown, Loader2, Plus, RefreshCw, Search, ShieldCheck, Users, X } from "lucide-react";
import { Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { OrganizationAccessError } from "@/lib/organization-permissions/request";
import { createOrganizationPermissionsClient } from "@/lib/organization-permissions/client";
import RoleChoices from "./role-choices";
import type { AccessData, Member, Permission, Role } from "@/lib/organization-permissions/types";

const primaryButton = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#090A29] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800 focus-visible:outline-[#E88A17] disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButton = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-[#E88A17] disabled:cursor-not-allowed disabled:opacity-50";
const inputClass = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-[#E88A17] focus:outline-none focus:ring-1 focus:ring-[#E88A17]";
type Editor =
  | { kind: "member"; member: Member; role_ids: string[]; confirmed: boolean }
  | { kind: "role"; id: string | null; name: string; description: string; permission_ids: string[]; is_system?: boolean; detailsLoading?: boolean; detailsFailed?: boolean; confirmed: boolean }
  | { kind: "invite"; firstname: string; lastName: string; password: string; confirmPassword: string; email: string; role_ids: string[]; confirmed: boolean };

const toggle = (ids: string[], id: string) => ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];
const message = (error: unknown) => error instanceof Error ? error.message : "Unable to complete this change. Please try again.";

function PermissionList({ permissions, selected, emptyMessage = "No permissions granted." }: { permissions: Permission[]; selected: string[]; emptyMessage?: string }) {
  const visible = selected.map((id) => permissions.find((permission) => permission.id === id) ?? { id, name: id });
  return visible.length ? (
    <div className="flex flex-wrap gap-2">
      {visible.map((permission) => <span key={permission.id} className="rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-600">{permission.name}</span>)}
    </div>
  ) : <p className="text-sm text-gray-500">{emptyMessage}</p>;
}

function PermissionChoices({ permissions, selected, onChange }: { permissions: Permission[]; selected: string[]; onChange: (ids: string[]) => void }) {
  const choices = [...permissions, ...selected.filter((id) => !permissions.some((permission) => permission.id === id)).map((id) => ({ id, name: id, group: "Other assigned permissions", description: "This permission is not in the current catalog. Keep it selected to retain it, or uncheck it to remove it." }))];
  return (
    <div>
      <h5 className="mb-3 text-sm font-semibold">Permissions <span className="font-normal text-gray-500">· {selected.length} selected</span></h5>
      {!permissions.length && <p className="text-sm text-gray-500">No permissions are available in the catalog.</p>}
      <div className="space-y-4">
        {Array.from(new Set(choices.map((permission) => permission.group))).map((group) => (
          <fieldset key={group} className="rounded-xl border border-gray-200 p-4">
            <legend className="px-1 text-xs font-semibold text-gray-500">{group}</legend>
            <div className="space-y-3">
              {choices.filter((permission) => permission.group === group).map((permission) => (
                <label key={permission.id} className="flex cursor-pointer items-start gap-3">
                  <input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-[#E88A17]" checked={selected.includes(permission.id)} onChange={() => onChange(toggle(selected, permission.id))} />
                  <span><span className="block text-sm font-medium">{permission.name}</span><span className="mt-0.5 block text-xs text-gray-500">{permission.description}</span></span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
    </div>
  );
}

export default function UsersPermissions({ organizationId }: { organizationId: string }) {
  const sectionId = useId();
  const client = useMemo(() => createOrganizationPermissionsClient(organizationId), [organizationId]);
  const [data, setData] = useState<AccessData | null>(null);
  const [tab, setTab] = useState("users");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editor, setEditor] = useState<Editor | null>(null);
  const [editorError, setEditorError] = useState("");
  const [saving, setSaving] = useState(false);
  const [writeDenied, setWriteDenied] = useState(false);
  const detailRequest = useRef(0);
  const sequence = useRef({ version: 0 });
  const inFlight = useRef(false);
  const scope = useRef(client);
  // Invalidate old organization results immediately, before effects run.
  scope.current = client;
  const [loadedClient, setLoadedClient] = useState<typeof client | null>(null);
  const currentData = loadedClient === client ? data : null;

  const refresh = useCallback(async () => {
    const version = ++sequence.current.version;
    setLoading(true);
    setError("");
    try {
      const next = await client.load();
      if (version === sequence.current.version && scope.current === client) {
        setData(next);
        setLoadedClient(client);
        setWriteDenied(false);
      }
    } catch (err) {
      if (version === sequence.current.version && scope.current === client) {
        setError(message(err));
        setData(null);
      }
    } finally {
      if (version === sequence.current.version && scope.current === client) setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    const counter = sequence.current;
    setData(null);
    setEditor(null);
    setSuccess("");
    setSearch("");
    setSaving(false);
    setWriteDenied(false);
    ++detailRequest.current;
    inFlight.current = false;
    refresh();
    return () => { ++counter.version; };
  }, [refresh]);

  const owner = currentData?.access.is_owner === true;
  const roles = currentData?.roles ?? [];
  const permissions = currentData?.permissions ?? [];
  const members = currentData?.members ?? [];
  const filteredMembers = members.filter((member) => `${member.name} ${member.email}`.toLowerCase().includes(search.toLowerCase()));
  const selectedRoles = editor && (editor.kind === "member" || editor.kind === "invite") ? roles.filter((role) => editor.role_ids.includes(role.id)) : [];
  const selectedPermissions = Array.from(new Set(selectedRoles.flatMap((role) => role.permission_ids)));
  const matchingInvite = editor?.kind === "invite" ? members.find((member) => member.email.toLowerCase() === editor.email.trim().toLowerCase()) : undefined;
  const affectedMembers = editor?.kind === "role" && editor.id ? members.filter((member) => !member.existing_access_preserved && member.roles.some((role) => role.id === editor.id)) : [];
  const needsConfirmation = editor?.kind === "member" || (editor?.kind === "invite" && editor.role_ids.length > 0) || (editor?.kind === "role" && !!editor.id);
  const roleAccessUnavailable = !!currentData?.resourceErrors?.roles || !!currentData?.resourceErrors?.permissions;
  const canManageRoles = owner && !writeDenied && !roleAccessUnavailable;
  const canManageMembers = owner && !writeDenied && !roleAccessUnavailable && !currentData?.resourceErrors?.members && !currentData?.resourceErrors?.users;
  const canSaveEditor = !writeDenied && owner && (editor?.kind === "role" ? canManageRoles && !editor.is_system && !editor.detailsLoading && !editor.detailsFailed : editor?.kind === "member" ? canManageMembers : !(editor?.kind === "invite" && editor.role_ids.length > 0) || canManageMembers);

  const open = (next: Editor) => {
    if (!owner || writeDenied || loading || inFlight.current || scope.current !== client) return;
    setEditorError("");
    setSuccess("");
    setEditor(next);
  };
  const close = () => { if (!inFlight.current) { ++detailRequest.current; setEditor(null); } };
  const openRole = async (role: Role) => {
    if (loading || inFlight.current || scope.current !== client) return;
    const requestId = ++detailRequest.current;
    const version = sequence.current.version;
    setEditorError("");
    setSuccess("");
    setEditor({ kind: "role", ...role, permission_ids: [], detailsLoading: true, confirmed: false });
    try {
      const details = await client.getRole(role.id);
      if (scope.current === client && version === sequence.current.version && requestId === detailRequest.current) {
        setEditor({ kind: "role", ...details, detailsLoading: false, confirmed: false });
      }
    } catch (err) {
      if (scope.current === client && version === sequence.current.version && requestId === detailRequest.current) {
        setEditorError(message(err));
        setEditor({ kind: "role", ...role, permission_ids: [], detailsLoading: false, detailsFailed: true, confirmed: false });
      }
    }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editor || !canSaveEditor || loading || inFlight.current || scope.current !== client || (needsConfirmation && !editor.confirmed)) return;
    setEditorError("");
    if (editor.kind === "role" && !editor.name.trim()) { setEditorError("Enter a role name."); return; }
    if (editor.kind === "invite" && (!editor.firstname.trim() || !editor.lastName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editor.email.trim()))) { setEditorError("Enter first and last names and a valid email address."); return; }
    if (editor.kind === "member" && editor.member.is_owner) return;
    if (editor.kind === "invite" && (!editor.password || editor.password !== editor.confirmPassword)) { setEditorError("Enter a password and matching confirmation."); return; }
    if (editor.kind === "invite" && matchingInvite?.is_owner) { setEditorError("The organization owner does not need an invitation."); return; }
    const operationClient = client;
    const version = sequence.current.version;
    const current = () => scope.current === operationClient && version === sequence.current.version;
    inFlight.current = true;
    setSaving(true);
    try {
      let savedMessage = "";
      if (editor.kind === "member") {
        await client.saveMemberRoles(editor.member.id, editor.role_ids);
        savedMessage = `Roles saved for ${editor.member.name}.`;
      } else if (editor.kind === "role") {
        await client.saveRole(editor.id, { name: editor.name, description: editor.description, permissions: editor.permission_ids });
        savedMessage = `Role ${editor.id ? "updated" : "created"}.`;
      } else {
        await client.invite({ firstname: editor.firstname, lastName: editor.lastName, email: editor.email.trim(), credentials: [{ type: "password", value: editor.password, temporary: false }], ...(editor.role_ids.length > 0 ? { role_ids: editor.role_ids } : {}) });
        savedMessage = matchingInvite ? `Invitation resent to ${editor.email.trim()}.${editor.role_ids.length > 0 ? " Selected roles saved." : " Their access is unchanged."}` : `Invitation created for ${editor.email.trim()}.`;
      }
      if (!current()) return;
      setEditor(null);
      setSuccess(savedMessage);
      // Re-read current access, catalog, roles and members after every explicit save.
      await refresh();
    } catch (err) {
      if (current()) {
        setEditorError(message(err));
        if (err instanceof OrganizationAccessError && err.status === 403) setWriteDenied(true);
        if (err instanceof OrganizationAccessError && err.savedRoleId && editor.kind === "role") {
          // Retain the created ID so a failed reload can never repeat POST /roles.
          setEditor({ ...editor, id: err.savedRoleId, detailsFailed: true, confirmed: false });
        }
      }
    } finally {
      if (scope.current === operationClient) {
        inFlight.current = false;
        setSaving(false);
      }
    }
  };

  return <section className="min-w-0 text-gray-900" aria-labelledby={`${sectionId}-title`} aria-busy={loading}>
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <div className="flex flex-wrap items-center gap-3"><ShieldCheck size={22} className="text-[#E88A17]" /><h3 id={`${sectionId}-title`} className="text-lg font-semibold">Users &amp; Permissions</h3></div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={secondaryButton} disabled={loading || saving} onClick={async () => { close(); setSuccess(""); await refresh(); }}><RefreshCw size={16} className={loading ? "animate-spin" : ""} />Refresh</button>
        {owner && !writeDenied && !currentData?.resourceErrors?.members && <button type="button" className={primaryButton} disabled={loading || saving} onClick={() => open({ kind: "invite", firstname: "", lastName: "", password: "", confirmPassword: "", email: "", role_ids: [], confirmed: false })}><Plus size={16} />Invite user</button>}
      </div>
    </header>

    {success && <div role="status" className="mt-4 flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800"><CheckCircle2 size={18} className="mt-0.5 shrink-0" />{success}</div>}
    {error && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><p>{error}</p><button type="button" className="mt-2 font-semibold underline" disabled={loading} onClick={refresh}>Try again</button></div>}

    {loading ? <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-gray-500" role="status"><Loader2 size={22} className="animate-spin text-[#E88A17]" />Loading users and permissions…</div> : currentData && <>
      {writeDenied && <p role="alert" className="mt-4 text-sm text-red-700">The server denied this change. Refresh to check your current access before trying again.</p>}
      {Object.entries(currentData.resourceErrors ?? {}).map(([resource, detail]) => <p key={resource} role="alert" className="mt-4 text-sm text-red-700">Unable to view {resource}: {detail}</p>)}
      {!owner && <p role="status" className="mt-4 text-sm text-gray-500">Only the organization owner can create or edit roles, invite users, and change user access.</p>}
      <div className="mt-6 flex flex-wrap gap-1 border-b border-gray-200" role="group" aria-label="Users and permissions views">
        {[["users", `Users (${members.length})`], ["roles", `Roles (${roles.length})`], ["access", "Your permissions"]].map(([value, label]) => <button key={value} type="button" aria-pressed={tab === value} onClick={() => setTab(value)} className={`border-b-2 px-4 py-3 text-sm font-medium focus-visible:outline-[#E88A17] ${tab === value ? "border-[#E88A17] text-[#A75A05]" : "border-transparent text-gray-500 hover:text-gray-900"}`}>{label}</button>)}
      </div>
      {tab === "users" && <div className="mt-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-gray-500">{members.filter((member) => member.status === "active").length} active · {members.filter((member) => member.status === "invited").length} invited</p><label className="relative w-full sm:w-72"><span className="sr-only">Search users</span><Search size={16} className="absolute left-3 top-3 text-gray-400" /><input type="search" placeholder="Search by name or email" value={search} onChange={(event) => setSearch(event.target.value)} className={`${inputClass} pl-9`} /></label></div>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-left text-sm"><caption className="sr-only">Organization users, roles, and current access</caption><thead className="bg-gray-50 text-xs text-gray-500"><tr>{["User", "Status", "Roles & access", ""].map((label, index) => <th key={index} scope="col" className="px-4 py-3 font-medium">{label || <span className="sr-only">Actions</span>}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">
            {filteredMembers.map((member) => <tr key={member.id} className="hover:bg-gray-50/60">
              <td className="px-4 py-4"><div className="flex items-center gap-3"><div aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-50 text-xs font-semibold text-[#A75A05]">{member.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</div><div><p className="whitespace-nowrap font-medium">{member.name}{member.id === currentData.access.user_id && <span className="ml-2 text-xs font-normal text-gray-400">You</span>}</p><p className="mt-1 text-xs text-gray-500">{member.email}</p></div></div></td>
              <td className="px-4 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${member.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}><span className={`h-1.5 w-1.5 rounded-full ${member.status === "active" ? "bg-green-500" : "bg-gray-400"}`} />{member.status === "active" ? "Active" : "Invited"}</span></td>
              <td className="min-w-56 px-4 py-4">
                <div className="flex flex-wrap gap-1.5">
                  {member.is_owner ? <span className="inline-flex items-center gap-1 rounded-md bg-[#090A29] px-2.5 py-1 text-xs text-white"><Crown size={12} />Owner</span> : member.roles.map((role) => <span key={role.id} className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600">{role.name}</span>)}
                </div>
                {member.is_owner ? <p className="mt-1.5 text-xs text-gray-500">Full organization access</p> : member.existing_access_preserved ? <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-amber-800"><ShieldCheck size={13} />Existing access preserved</p> : <p className="mt-1.5 text-xs text-gray-500">{member.roles.length ? `${member.permission_ids.length} permissions` : "No roles assigned"}</p>}
              </td>
              <td className="px-4 py-4 text-right">
                {member.is_owner ? <span className="text-xs text-gray-400">Owner access</span> : (
                  <div className="flex flex-col items-end gap-2">
                    <button type="button" className="whitespace-nowrap text-xs font-medium text-[#945003] hover:underline disabled:text-gray-400 disabled:no-underline" disabled={!canManageMembers || saving} aria-label={`Manage roles for ${member.name}`} onClick={() => { if (canManageMembers) open({ kind: "member", member, role_ids: member.roles.map((role) => role.id), confirmed: false }); }}>Manage roles</button>
                  </div>
                )}
              </td>
            </tr>)}
            {filteredMembers.length === 0 && <tr><td colSpan={4} className="p-10 text-center text-sm text-gray-500"><Users size={24} className="mx-auto mb-3 text-gray-300" />{search ? "No users match your search." : "No users in this organization yet."}</td></tr>}
          </tbody></table>
        </div>
      </div>}
      {tab === "roles" && <div className="mt-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">{canManageRoles && <button type="button" className={secondaryButton} disabled={saving} onClick={() => open({ kind: "role", id: null, name: "", description: "", permission_ids: [], confirmed: false })}><Plus size={16} />Create role</button>}</div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{roles.map((role) => <article key={role.id} className="flex flex-col rounded-xl border border-gray-200 bg-white p-5"><div className="mb-4 flex items-center justify-between"><ShieldCheck size={22} className="text-[#E88A17]" /><span className="text-xs text-gray-500">{members.filter((member) => member.roles.some((item) => item.id === role.id)).length} users</span></div><h4 className="font-semibold">{role.name}</h4>{role.is_system && <p className="mt-2 text-xs font-medium text-gray-500">Built-in system role · Protected</p>}<p className="mt-2 flex-1 text-sm leading-6 text-gray-500">{role.description || "Organization role"}</p><div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4"><span className="text-xs text-gray-500">{role.permission_ids.length} permissions</span><button type="button" className="text-sm font-semibold text-[#945003] hover:underline" onClick={() => openRole(role)} disabled={saving} aria-label={`${canManageRoles && !role.is_system ? "Edit" : "View"} ${role.name} role`}>{canManageRoles && !role.is_system ? "Edit role" : "View role"}</button></div></article>)}</div>
        {!roles.length && <p className="py-10 text-center text-sm text-gray-500">No roles yet. Create a role using the permission catalog.</p>}
      </div>}
      {tab === "access" && <div className="mt-5 rounded-xl border border-gray-200 p-5"><div className="mb-4 flex items-center gap-2"><ShieldCheck size={18} className="text-[#E88A17]" /><h4 className="text-sm font-semibold">Your current access</h4>{owner && <span className="rounded-full bg-orange-50 px-2 py-1 text-xs text-[#945003]">Organization owner</span>}</div><PermissionList permissions={permissions} selected={currentData.access.permission_ids} /></div>}
    </>}

    <Dialog open={!!editor && !!currentData} onClose={close} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3, maxHeight: "90dvh" } }} aria-labelledby={`${sectionId}-dialog-title`} aria-describedby={editor?.kind === "member" ? `${sectionId}-dialog-description` : undefined}>
      <DialogTitle id={`${sectionId}-dialog-title`} component="div" className="border-b border-gray-100">
        <div className="flex items-center justify-between gap-4"><h4 className="text-lg font-semibold">{editor?.kind === "member" ? "Manage user roles" : editor?.kind === "role" ? `${canManageRoles && !editor.is_system ? editor.id ? "Edit" : "Create" : "View"} role` : matchingInvite ? "Re-invite user" : "Invite user"}</h4><button type="button" onClick={close} disabled={saving} aria-label="Close dialog" className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"><X size={20} /></button></div>
        {editor?.kind === "member" && <p id={`${sectionId}-dialog-description`} className="mt-2 text-sm font-normal text-gray-500">{editor.member.name} · {editor.member.email}</p>}
      </DialogTitle>
      <form onSubmit={save} noValidate>
        <DialogContent dividers className="space-y-5" sx={{ maxHeight: "60dvh", borderTop: 0 }}>
          {editorError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{editorError}</p>}
          {editor?.kind === "role" && editor.detailsFailed && <button type="button" className={secondaryButton} onClick={() => openRole({ id: editor.id!, name: editor.name, description: editor.description, permission_ids: [], is_system: editor.is_system })}>Retry loading role</button>}
          <fieldset disabled={saving || !canSaveEditor} className="min-w-0 space-y-5">
            {editor?.kind === "role" ? <>
              {editor.detailsLoading && <p role="status" className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="animate-spin" size={16} />Loading role details…</p>}
              {editor.is_system && <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">Built-in system roles cannot be edited or deleted.</p>}
              <label className="block"><span className="mb-2 block text-sm font-medium">Role name</span><input autoFocus maxLength={80} value={editor.name} onChange={(event) => setEditor({ ...editor, name: event.target.value, confirmed: false })} className={inputClass} placeholder="e.g. Support team" /></label>
              <label className="block"><span className="mb-2 block text-sm font-medium">Description <span className="font-normal text-gray-400">(optional)</span></span><textarea rows={2} maxLength={300} value={editor.description} onChange={(event) => setEditor({ ...editor, description: event.target.value, confirmed: false })} className={inputClass} placeholder="What will this role be used for?" /></label>
              <PermissionChoices permissions={permissions} selected={editor.permission_ids} onChange={(permission_ids) => setEditor({ ...editor, permission_ids, confirmed: false })} />
              {!editor.permission_ids.length && <p className="text-sm text-amber-800">This role will grant no permissions until you select some.</p>}
              {editor.id && <p className="rounded-lg bg-amber-50 p-3 text-sm leading-6 text-amber-900">Editing this role changes access for all managed users assigned to it{affectedMembers.length ? ` (${affectedMembers.length} shown here)` : ""}. Users with existing access preserved are unaffected.</p>}
            </> : editor && <>
              {editor.kind === "invite" && <>
                <label className="block"><span className="mb-2 block text-sm font-medium">First name</span><input autoFocus autoComplete="given-name" maxLength={120} className={inputClass} value={editor.firstname} onChange={(event) => setEditor({ ...editor, firstname: event.target.value })} /></label>
                <label className="block"><span className="mb-2 block text-sm font-medium">Last name</span><input autoComplete="family-name" maxLength={120} className={inputClass} value={editor.lastName} onChange={(event) => setEditor({ ...editor, lastName: event.target.value })} /></label>
                <label className="block"><span className="mb-2 block text-sm font-medium">Password</span><input type="password" autoComplete="new-password" className={inputClass} value={editor.password} onChange={(event) => setEditor({ ...editor, password: event.target.value })} /></label>
                <label className="block"><span className="mb-2 block text-sm font-medium">Confirm password</span><input type="password" autoComplete="new-password" className={inputClass} value={editor.confirmPassword} onChange={(event) => setEditor({ ...editor, confirmPassword: event.target.value })} /></label>
                <label className="block"><span className="mb-2 block text-sm font-medium">Email address</span><input type="email" autoComplete="email" className={inputClass} value={editor.email} onChange={(event) => setEditor({ ...editor, email: event.target.value, confirmed: false })} placeholder="sam@example.com" /></label>
              </>}
              {(editor.kind === "member" || editor.kind === "invite") && <>
                {editor.kind === "member" && editor.member.existing_access_preserved && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Existing access preserved.</p>}
                <RoleChoices disabled={editor.kind === "invite" && !canManageMembers} roles={[...roles, ...(editor.kind === "member" ? editor.member.roles.filter((role) => !roles.some((item) => item.id === role.id)) : [])]} selected={editor.role_ids} onChange={(role_ids) => setEditor({ ...editor, role_ids, confirmed: false })} />
                {editor.kind === "member" && <div className="rounded-xl bg-gray-50 p-4"><h5 className="mb-3 text-sm font-semibold">Permissions after saving</h5><PermissionList permissions={permissions} selected={selectedPermissions} /></div>}
                {editor.kind === "member" && editor.role_ids.length === 0 && <p className="text-sm font-medium text-red-700">Saving with no roles will remove all role-based permissions{editor.kind === "member" || matchingInvite ? " and replace this user's current access" : ""}.</p>}
              </>}
            </>}
            {needsConfirmation && editor && canSaveEditor && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="flex items-start gap-2 text-sm font-medium leading-6 text-amber-900"><AlertCircle size={18} className="mt-0.5 shrink-0" />{editor.kind === "role" ? "This will change access for all managed users assigned to this role." : editor.kind === "invite" ? "Selected roles will set access for this invitation, replacing existing access if this user already belongs to the organization." : "Selected roles will replace this user’s current access."}</p><label className="mt-3 flex cursor-pointer items-start gap-3"><input type="checkbox" checked={editor.confirmed} className="mt-1 h-4 w-4 shrink-0 accent-[#E88A17]" onChange={(event) => setEditor({ ...editor, confirmed: event.target.checked })} /><span className="text-sm leading-6 text-amber-900">I understand and want to save these access changes.</span></label></div>}
          </fieldset>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}><button type="button" className={secondaryButton} onClick={close} disabled={saving}>{owner ? "Cancel" : "Close"}</button>{canSaveEditor && <button type="submit" className={primaryButton} disabled={saving || (needsConfirmation && !editor?.confirmed)}>{saving && <Loader2 size={16} className="animate-spin" />}{saving ? "Saving…" : editor?.kind === "member" ? "Save roles" : editor?.kind === "role" ? "Save role" : matchingInvite ? "Resend invitation" : "Send invitation"}</button>}</DialogActions>
      </form>
    </Dialog>
  </section>;
}
