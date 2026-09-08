import { NextRequest, NextResponse } from "next/server";

const PEAKDATA_BASE_URL = "https://peakdata-jja4kcvvdq-ez.a.run.app";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message_ids } = body;

    if (!Array.isArray(message_ids) || message_ids.length === 0) {
      return NextResponse.json({ error: "message_ids array is required" }, { status: 400 });
    }

    const res = await fetch(`${PEAKDATA_BASE_URL}/organization/wa_message/read`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message_ids }),
    });

    const data = await res.json();
    console.log("[read] Marked", message_ids.length, "messages as read, updated:", data.updated);
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to mark messages as read" }, { status: 500 });
  }
}
