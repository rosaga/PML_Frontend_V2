import { NextRequest, NextResponse } from "next/server";

const OPTED_OUT_URL = "https://peakdata-1048592730476.europe-west4.run.app/api/v2/whatsapp/opted-out-numbers";

export async function GET(request: NextRequest) {
  const externalId = request.nextUrl.searchParams.get("external_id")?.trim();
  const token = request.headers.get("x-auth-token");

  if (!externalId) {
    return NextResponse.json({ error: "external_id required" }, { status: 400 });
  }
  if (!token) {
    return NextResponse.json({ error: "x-auth-token header required" }, { status: 401 });
  }

  const url = new URL(OPTED_OUT_URL);
  url.searchParams.set("external_id", externalId);

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!response.ok) {
      return NextResponse.json(
        { error: response.status === 401 ? "Unauthorized" : "Failed to load opted-out contacts" },
        { status: response.status },
      );
    }
    return NextResponse.json(await response.json(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Failed to load opted-out contacts" }, { status: 502 });
  }
}
