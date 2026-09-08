import { NextRequest, NextResponse } from "next/server";

const BALANCE_API_URL = "https://consolev1.pinbot.ai/api/get-user-balance";
const BALANCE_API_KEY = "94bafe77-9f78-11f0-98fc-02c8a5e042bd";

export async function GET(request: NextRequest) {
  try {
    const displayPhoneNumber = request.headers.get("x-display-phone-number") || "";

    if (!displayPhoneNumber) {
      return NextResponse.json({ error: "Display phone number is required" }, { status: 400 });
    }

    const formattedPhoneNumber = displayPhoneNumber.startsWith("+")
      ? displayPhoneNumber
      : `+${displayPhoneNumber}`;

    const response = await fetch(BALANCE_API_URL, {
      method: "POST",
      headers: {
        apikey: BALANCE_API_KEY,
        wabanumber: formattedPhoneNumber,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch balance" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
