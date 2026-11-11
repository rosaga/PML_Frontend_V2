import { getToken } from "@/utils/auth";
import { TECH_PROVIDER_API_BASE_URL } from "./config";
import { validateAttachment, validatePublicMediaUrl, type MessagePayload } from "./message-draft";

export class MessageApiError extends Error {
  constructor(message: string, public phase: "upload" | "send", public code = "", public status = 0, public requestId = "", public outcomeUnknown = false, public retryAfterMs = 0) {
    super(message);
    this.name = "MessageApiError";
  }
}
export interface MessageAsset { secure_url: string; public_id: string; resource_type: string }
export interface MessageReceipt { id: string; messageStatus?: string; requestId: string }

function connectionUrl(connectionId: string, suffix: string) {
  if (!connectionId.trim()) throw new Error("Select a WhatsApp account with a Meta connection before sending.");
  return `${TECH_PROVIDER_API_BASE_URL}/api/v2/meta/connections/${encodeURIComponent(connectionId)}${suffix}`;
}

async function post(url: string, contentType: string, body: BodyInit, phase: "upload" | "send", signal?: AbortSignal) {
  const token = getToken();
  if (!token) throw new Error("Please sign in again before sending a message.");
  let response: Response | undefined;
  let result;
  try {
    response = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": contentType }, body, signal });
    result = await response.json();
  } catch {
    throw new MessageApiError(phase === "send" ? "The send response is unavailable. The message may already have been accepted." : "The attachment upload response is unavailable. Your file has been kept.", phase, phase === "send" ? "MESSAGE_OUTCOME_UNKNOWN" : "", response?.status || 0, response?.headers.get("x-request-id") || "", phase === "send");
  }
  if (!response.ok) {
    const retry = response.headers.get("retry-after");
    const retryAfterMs = retry ? (/^\d+$/.test(retry) ? Number(retry) * 1000 : Math.max(0, Date.parse(retry) - Date.now())) : 0;
    throw new MessageApiError(result?.error?.message || `${phase === "send" ? "Send" : "Attachment upload"} failed (status ${response.status}).`, phase, result?.error?.code || "", response.status, result?.request_id || response.headers.get("x-request-id") || "", phase === "send" && (result?.error?.code === "MESSAGE_OUTCOME_UNKNOWN" || response.status >= 500), retryAfterMs);
  }
  return { result, requestId: response.headers.get("x-request-id") || "" };
}

export async function uploadMessageAsset(connectionId: string, file: File, signal?: AbortSignal): Promise<MessageAsset> {
  const rule = validateAttachment(file);
  const url = new URL(connectionUrl(connectionId, "/template-assets"));
  url.searchParams.set("filename", file.name);
  const { result, requestId } = await post(url.toString(), file.type, file, "upload", signal);
  if (typeof result?.asset?.secure_url !== "string" || result.asset.resource_type !== rule.resourceType) throw new MessageApiError("The upload did not return a usable attachment. Your local file has been kept.", "upload", "INVALID_ASSET", 0, requestId);
  try { validatePublicMediaUrl(result.asset.secure_url); }
  catch { throw new MessageApiError("The upload returned an invalid attachment URL.", "upload", "INVALID_ASSET", 0, requestId); }
  return result.asset;
}

export async function sendTechProviderMessage(connectionId: string, payload: MessagePayload, signal?: AbortSignal): Promise<MessageReceipt> {
  const url = connectionUrl(connectionId, payload.template ? "/messages/template" : "/messages");
  const body = JSON.stringify(payload);
  if (new Blob([body]).size > 1048576) throw new Error("Message JSON must be no larger than 1 MiB.");
  const { result, requestId } = await post(url, "application/json", body, "send", signal);
  const message = result?.messages?.[0];
  if (typeof message?.id !== "string" || !message.id.trim()) throw new MessageApiError("The send response did not contain a message ID. The message may already have been accepted.", "send", "MESSAGE_OUTCOME_UNKNOWN", 0, requestId, true);
  return { id: message.id, ...(typeof message.message_status === "string" ? { messageStatus: message.message_status } : {}), requestId };
}
