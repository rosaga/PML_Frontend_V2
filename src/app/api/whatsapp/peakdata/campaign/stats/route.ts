import { NextRequest, NextResponse } from "next/server";

const PEAKDATA_BASE_URL = "https://peakdata-1048592730476.europe-west4.run.app/api/v1";

export async function GET(request: NextRequest) {
  const organizationExternalId = request.nextUrl.searchParams.get("organizationExternalId")?.trim();
  const token = request.headers.get("x-auth-token");
  if (!organizationExternalId) {
    return NextResponse.json({ error: { message: "An organization external ID is required" } }, { status: 400 });
  }
  if (!token) {
    return NextResponse.json({ error: { message: "Authentication token is required" } }, { status: 401 });
  }

  try {
    const params = new URLSearchParams({
      page: request.nextUrl.searchParams.get("page") || "1",
      limit: request.nextUrl.searchParams.get("limit") || "10",
    });
    for (const key of ["search", "group_id"]) {
      const value = request.nextUrl.searchParams.get(key)?.trim();
      if (value) params.set(key, value);
    }
    const url = `${PEAKDATA_BASE_URL}/whatsapp/campaign/stats/${encodeURIComponent(organizationExternalId)}?${params}`;

    const response = await fetch(url, {
      headers: { accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: request.signal,
    });

    const text = await response.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: { message: "Failed to fetch campaign stats" } },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(
      { error: { message: "Failed to fetch campaign stats" } },
      { status: 502 }
    );
  }
}
