import { messageListErrorMessage } from "./message-list-errors";

export class MessageListError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "MessageListError";
  }
}

// Reuse the existing login token as-is, without changing storage or session handling.
export async function fetchMessageList(url: string, options: RequestInit = {}): Promise<Response> {
  const endpoint = "/api/whatsapp/whatsapp-internal/messages/list";
  if (url !== endpoint && !url.startsWith(`${endpoint}?`)) throw new Error("Invalid WhatsApp message-list endpoint.");
  const headers = new Headers(options.headers);
  if (!headers.get("x-organization-id") && !headers.get("x-organization-external-id")) {
    throw new MessageListError("Select an organization to view WhatsApp messages.", 400);
  }
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) throw new MessageListError(messageListErrorMessage(401), 401);
  headers.set("x-auth-token", token);
  const response = await fetch(url, { ...options, headers, cache: "no-store" });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new MessageListError(messageListErrorMessage(response.status, data), response.status);
  }
  return response;
}
