import { NextRequest, NextResponse } from "next/server";

const PEAKDATA_V1 = "https://peakdata-jja4kcvvdq-ez.a.run.app/api/v1";
const PEAKDATA_V2 = "https://peakdata-jja4kcvvdq-ez.a.run.app/api/v2";

// Module-level server-side cache for mobileNo lookups.
// Keyed by "orgId:mobileNo". Stores null for confirmed 404s so we don't re-hit the slow API.
const _cache = new Map<string, { v: any; t: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

function cacheGet(key: string): { hit: true; v: any } | { hit: false } {
  const e = _cache.get(key);
  if (!e) return { hit: false };
  if (Date.now() - e.t > CACHE_TTL) { _cache.delete(key); return { hit: false }; }
  return { hit: true, v: e.v };
}
function cachePut(key: string, v: any) {
  _cache.set(key, { v, t: Date.now() });
}

function tryParse(text: string) {
  try { return JSON.parse(text); } catch { return text; }
}

function authHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// GET /api/contacts?organizationId=...              → list all (V2)
// GET /api/contacts?organizationId=...&mobileNo=... → lookup by mobile_no (V2 filter)
// Requires: x-auth-token header (Keycloak JWT from localStorage "token")
export async function GET(request: NextRequest) {
  const orgId    = request.nextUrl.searchParams.get("organizationId");
  const mobileNo = request.nextUrl.searchParams.get("mobileNo");
  const token    = request.headers.get("x-auth-token") ?? "";

  if (!orgId)  return NextResponse.json({ error: "organizationId required" }, { status: 400 });
  if (!token)  return NextResponse.json({ error: "x-auth-token header required" }, { status: 401 });

  const headers = authHeaders(token);

  // Lookup by mobile_no — ilike for flexible number format matching
  if (mobileNo) {
    const cKey = `${orgId}:${mobileNo}`;
    const cached = cacheGet(cKey);
    if (cached.hit) {
      return NextResponse.json(cached.v, { status: cached.v ? 200 : 404 });
    }

    const url = `${PEAKDATA_V2}/organization/${orgId}/contact?ilike__mobile_no=${encodeURIComponent(mobileNo)}&orderby=created_at%20DESC&page=1&size=10`;
    try {
      const res = await fetch(url, { headers });
      // Pass auth errors straight through — do NOT convert to 404 or cache them.
      // Clients use the 401 to trigger the re-login modal.
      if (res.status === 401) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const data = tryParse(await res.text());
      let contact = null;
      if (Array.isArray(data?.data) && data.data.length > 0) {
        // Prefer ACTIVE contact with names set, then any ACTIVE, then first result
        contact =
          data.data.find((c: any) => c.status === "ACTIVE" && (c.first_name || c.last_name)) ??
          data.data.find((c: any) => c.status === "ACTIVE") ??
          data.data[0];
      }
      // Cache both found contacts and genuine 404s (contact not found is stable)
      cachePut(cKey, contact);
      return NextResponse.json(contact, { status: contact ? res.status : 404 });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  // List all
  const size = request.nextUrl.searchParams.get("size") ?? "20";
  const url  = `${PEAKDATA_V2}/organization/${orgId}/contact?orderby=created_at%20DESC&page=1&size=${size}`;
  try {
    const res = await fetch(url, { headers });
    if (res.status === 401) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(tryParse(await res.text()), { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/contacts?organizationId=...
// body: { mobile_no, metadata: { FIRSTNAME?, LASTNAME? } }
// Requires: x-auth-token header (Keycloak JWT from localStorage "token")
export async function POST(request: NextRequest) {
  const orgId = request.nextUrl.searchParams.get("organizationId");
  const token = request.headers.get("x-auth-token") ?? "";
  if (!orgId)  return NextResponse.json({ error: "organizationId required" }, { status: 400 });
  if (!token)  return NextResponse.json({ error: "x-auth-token header required" }, { status: 401 });

  try {
    const body = await request.json();
    const res = await fetch(`${PEAKDATA_V2}/organization/${orgId}/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    return NextResponse.json(tryParse(await res.text()), { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/contacts?organizationId=...
// body: { contact_id, first_name?, last_name?, label? }
export async function PATCH(request: NextRequest) {
  const orgId = request.nextUrl.searchParams.get("organizationId");
  if (!orgId) return NextResponse.json({ error: "organizationId required" }, { status: 400 });

  try {
    const body = await request.json();
    if (!body.contact_id) {
      return NextResponse.json({ error: "contact_id is required" }, { status: 400 });
    }

    const res = await fetch(`${PEAKDATA_V1}/organization/${orgId}/contact/label`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return NextResponse.json(tryParse(await res.text()), { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update contact" }, { status: 500 });
  }
}
