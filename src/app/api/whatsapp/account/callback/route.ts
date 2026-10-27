import { NextRequest, NextResponse } from "next/server";

const ACCOUNT_URL = "https://peakdata-1048592730476.europe-west4.run.app/whatsapp/account";
const CALLBACK_URL = "https://peakdata-1048592730476.europe-west4.run.app/api/v2/whatsapp/account/callback";

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: NextRequest) {
  const token = request.headers.get("x-auth-token");
  if (!token) return json({ error: "Sign in again to manage your callback URL." }, 401);
  const externalId = request.nextUrl.searchParams.get("external_id")?.trim();
  if (!externalId) return json({ error: "Select an organization first." }, 400);

  const url = new URL(ACCOUNT_URL);
  url.searchParams.set("organization_external_id", externalId);
  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) return json({ error: "Unable to load the callback URL." }, response.status);
    const result = await response.json();
    if (result.status !== "success" || !result.data) {
      return json({ error: "Unable to load the callback URL." }, 502);
    }
    // Only expose the setting being edited, not the account's API credentials.
    return json({ data: { callback_url: result.data.callback_url || "" } });
  } catch {
    return json({ error: "Unable to load the callback URL. Please try again." }, 502);
  }
}

export async function POST(request: NextRequest) {
  const token = request.headers.get("x-auth-token");
  if (!token) return json({ error: "Sign in again to manage your callback URL." }, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }
  if (typeof body?.external_id !== "string" || !body.external_id.trim() || typeof body?.callback_url !== "string") {
    return json({ error: "external_id and callback_url are required." }, 400);
  }

  const externalId = body.external_id.trim();
  const callbackUrl = body.callback_url.trim();
  if (callbackUrl) {
    try {
      const url = new URL(callbackUrl);
      if (!["http:", "https:"].includes(url.protocol) || !url.hostname || url.username || url.password || url.hash || /[\r\n]/.test(callbackUrl)) {
        throw new Error("Invalid URL");
      }
    } catch {
      return json({ error: "Enter a complete HTTP or HTTPS URL without credentials or a fragment." }, 400);
    }
  }

  try {
    const response = await fetch(CALLBACK_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ external_id: externalId, callback_url: callbackUrl }),
      cache: "no-store",
    });
    if (!response.ok) {
      const result = await response.json().catch(() => null);
      const error = response.status === 400 && typeof result?.error === "string"
        ? result.error : "Unable to save the callback URL. Please try again.";
      return json({ error }, response.status);
    }
    return json({ data: { external_id: externalId, callback_url: callbackUrl } });
  } catch {
    return json({ error: "Unable to save the callback URL. Please try again." }, 502);
  }
}
