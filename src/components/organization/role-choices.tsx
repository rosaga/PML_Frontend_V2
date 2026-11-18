import type { Role } from "@/lib/organization-permissions/types";

export default function RoleChoices({ roles, selected, onChange, disabled = false }: {
  roles: Role[];
  selected: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}) {
  return <fieldset disabled={disabled} className="space-y-2">
    <legend className="mb-3 text-sm font-semibold text-gray-900">Roles <span className="font-normal text-gray-500">· {selected.length} selected</span></legend>
    {!roles.length && <p className="text-sm text-gray-500">No roles available.</p>}
    {roles.map((role) => <label key={role.id} className={`flex items-start gap-3 rounded-xl border p-4 ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${selected.includes(role.id) ? "border-[#E88A17] bg-orange-50/50" : "border-gray-200 hover:bg-gray-50"}`}>
      <input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-[#E88A17]" checked={selected.includes(role.id)} onChange={() => onChange(selected.includes(role.id) ? selected.filter((id) => id !== role.id) : [...selected, role.id])} />
      <span className="min-w-0 flex-1"><span className="block text-sm font-medium text-gray-900">{role.name}</span>{role.description && <span className="mt-1 block text-xs leading-5 text-gray-500">{role.description}</span>}</span>
    </label>)}
  </fieldset>;
}
