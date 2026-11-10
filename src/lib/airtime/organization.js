import { GetAccounts } from "@/app/api/actions/accounts/accounts";

export function getActiveOrganizationId() {
  return typeof window === "undefined" ? null : localStorage.getItem("selectedAccountId") || null;
}

// Resolve older selections containing a database ID inside the airtime flow.
// The shared organization selector and the other products keep their behavior.
export async function resolveAirtimeOrganization(selectedId) {
  if (!selectedId) throw new Error("Select an organization first.");
  if (!/^\d+$/.test(String(selectedId))) return String(selectedId);
  const response = await GetAccounts();
  const account = response.data?.find((item) => String(item.id) === String(selectedId));
  if (typeof account?.external_id !== "string" || !account.external_id.trim()) {
    throw new Error("The organization's external ID is unavailable. Please select an account again.");
  }
  return account.external_id;
}

export function subscribeToOrganization(callback) {
  window.addEventListener("storage", callback);
  window.addEventListener("organization-changed", callback);
  window.addEventListener("focus", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("organization-changed", callback);
    window.removeEventListener("focus", callback);
  };
}

export function refreshOrganization(orgId, event = "airtime-updated") {
  if (getActiveOrganizationId() === orgId) {
    window.dispatchEvent(new CustomEvent(event, { detail: { orgId } }));
  }
}
