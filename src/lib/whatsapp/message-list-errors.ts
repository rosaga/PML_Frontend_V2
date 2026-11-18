export function messageListErrorMessage(status: number, data?: unknown): string {
  const payload = data && typeof data === "object" ? data as Record<string, unknown> : {};
  const error = payload.error && typeof payload.error === "object" ? payload.error as Record<string, unknown> : {};
  const message = [error.message, payload.error, payload.message, payload.detail].find((value) => typeof value === "string" && value.trim());
  if (typeof message === "string") return message;
  if (status === 401) return "Your session is missing or expired. Please sign in again to view WhatsApp messages.";
  if (status === 403) return "You do not have permission to view WhatsApp messages for this organization.";
  return `Failed to fetch WhatsApp messages (HTTP ${status}).`;
}
