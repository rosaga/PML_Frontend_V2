import { NextRequest, NextResponse } from "next/server";

const PEAKDATA_TAGS_URL = "https://peakdata-jja4kcvvdq-ez.a.run.app/api/v1";

export async function GET(request: NextRequest) {
  const orgId = request.nextUrl.searchParams.get("organizationId");
  if (!orgId) return NextResponse.json({ error: "organizationId required" }, { status: 400 });

  try {
    const res = await fetch(`${PEAKDATA_TAGS_URL}/organization/${orgId}/contact/label`, {
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch labels" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const orgId = request.nextUrl.searchParams.get("organizationId");
  if (!orgId) return NextResponse.json({ error: "organizationId required" }, { status: 400 });

  try {
    const body = await request.json();
    const res = await fetch(`${PEAKDATA_TAGS_URL}/organization/${orgId}/contact/label`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update label" }, { status: 500 });
  }
}
