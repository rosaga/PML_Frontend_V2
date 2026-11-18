import { NextRequest, NextResponse } from "next/server";

const PEAKDATA_TAGS_URL = "https://peakdata-jja4kcvvdq-ez.a.run.app/api/v1";

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function errorMessage(status: number, data: unknown): string {
  const payload = data && typeof data === "object" ? data as Record<string, unknown> : {};
  const error = payload.error && typeof payload.error === "object" ? payload.error as Record<string, unknown> : {};
  const message = [error.message, payload.error, payload.message].find((value) => typeof value === "string" && value.trim());
  if (typeof message === "string") return message;
  if (status === 401) return "Your session is missing or expired. Please sign in again to manage WhatsApp tags.";
  if (status === 403) return "You do not have permission to manage WhatsApp tags for this organization.";
  return `Unable to load or update WhatsApp tags (HTTP ${status}).`;
}

async function proxyTags(request: NextRequest, method: "GET" | "PATCH") {
  const orgId = request.nextUrl.searchParams.get("organizationId")?.trim();
  if (!orgId) return json({ error: "Select an organization to manage WhatsApp tags." }, 400);

  const token = request.headers.get("x-auth-token")?.trim();
  const authorization = request.headers.get("authorization")?.trim() || (token ? `Bearer ${token}` : "");
  if (!/^Bearer\s+\S+$/i.test(authorization)) return json({ error: errorMessage(401, null) }, 401);

  let body;
  if (method === "PATCH") {
    try {
      body = JSON.stringify(await request.json());
    } catch {
      return json({ error: "Invalid tag update. Send a valid JSON body." }, 400);
    }
  }

  try {
    const res = await fetch(`${PEAKDATA_TAGS_URL}/organization/${encodeURIComponent(orgId)}/contact/label`, {
      method,
      headers: { "Content-Type": "application/json", Authorization: authorization },
      ...(method === "PATCH" ? { body } : {}),
      cache: "no-store",
    });
    if (method === "PATCH" && res.status === 204) return json({ success: true });
    const data = await res.json().catch(() => null);
    if (!res.ok) return json({ error: errorMessage(res.status, data) }, res.status);
    if (data === null) return json({ error: "The WhatsApp tag service returned an invalid response." }, 502);
    return json(data, res.status);
  } catch {
    return json({ error: "Unable to reach the WhatsApp tag service. Please try again." }, 502);
  }
}

export async function GET(request: NextRequest) {
  return proxyTags(request, "GET");
}

export async function PATCH(request: NextRequest) {
  return proxyTags(request, "PATCH");
}
