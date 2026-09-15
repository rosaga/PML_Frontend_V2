import { NextRequest, NextResponse } from "next/server";

const FLOWBOT_API = "https://flowbot-1048592730476.europe-west4.run.app/api/v2";

export async function GET(
  request: NextRequest,
  { params }: { params: { flowId: string } }
) {
  try {
    const response = await fetch(`${FLOWBOT_API}/flows/${params.flowId}/edges`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error(`Flowbot API error: ${response.statusText}`);
    return NextResponse.json(await response.json());
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch edges" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { flowId: string } }
) {
  try {
    const body = await request.json();
    const response = await fetch(`${FLOWBOT_API}/flows/${params.flowId}/edges`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`Flowbot API error: ${response.statusText}`);
    return NextResponse.json(await response.json(), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create edge" }, { status: 500 });
  }
}
