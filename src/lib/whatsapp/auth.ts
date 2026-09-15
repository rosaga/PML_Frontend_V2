// Decodes a JWT without an external library (base64url decode of the payload).
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    // Base64url → base64 → decode
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), "="));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getTokenEmail(token: string): string | null {
  const payload = decodeJwtPayload(token);
  const email = payload?.email;

  return typeof email === "string" && email.trim() ? email.trim() : null;
}

export function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("token") || "";
}

export function hasRole(token: string, role: string): boolean {
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  if (!payload) return false;
  const roles = (payload.realm_access as { roles?: string[] } | undefined)?.roles;
  return Array.isArray(roles) && roles.includes(role);
}
