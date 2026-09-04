import { NextRequest, NextResponse } from "next/server";

const FLOWBOT_API = "https://flowbot-1048592730476.europe-west4.run.app/api/v2";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("organization_id");
    const size = searchParams.get("size") || "10";
    const page = searchParams.get("page") || "1";

    if (!orgId) {
      return NextResponse.json({ error: "organization_id is required" }, { status: 400 });
    }

    const response = await fetch(
      `${FLOWBOT_API}/flows?eq__organization_id=${orgId}&size=${size}&page=${page}&orderby=updated_at%20desc`,
      { method: "GET", headers: { "Content-Type": "application/json" } }
    );

    if (!response.ok) throw new Error(`Flowbot API error: ${response.statusText}`);

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch flows" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.organization_id) {
      return NextResponse.json({ error: "organization_id is required" }, { status: 400 });
    }

    const response = await fetch(`${FLOWBOT_API}/flows`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error(`Flowbot API error: ${response.statusText}`);

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create flow" }, { status: 500 });
  }
}
