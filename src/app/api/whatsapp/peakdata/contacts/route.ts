import { NextRequest, NextResponse } from "next/server";

const PEAKDATA_BASE_URL = "https://peakdata-1048592730476.europe-west4.run.app/api/v1";
const PEAKDATA_BASE_URL_2 = "https://peakdata-jja4kcvvdq-ez.a.run.app/api/v2";
const ORGANIZATION_ID = process.env.NEXT_PUBLIC_ORGANIZATION_ID || "58045135-f272-4879-be0f-2559d836fdba";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("contacts") as File;
    const groupId = formData.get("group_id") as string;
    const organizationExternalId =
      (formData.get("organizationExternalId") as string) ||
      request.nextUrl.searchParams.get("organizationExternalId") ||
      ORGANIZATION_ID;
    const token = request.headers.get("x-auth-token") || "";

    if (!token) {
      return NextResponse.json(
        { error: { message: "Authentication token is required" } },
        { status: 401 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: { message: "CSV file is required" } },
        { status: 400 }
      );
    }

    if (!groupId) {
      return NextResponse.json(
        { error: { message: "Group ID is required" } },
        { status: 400 }
      );
    }

    // Create new FormData for the external API
    const apiFormData = new FormData();
    apiFormData.append("contacts", file);
    apiFormData.append("group_id", groupId);
    apiFormData.append("service", "WHATSAPP");

    const response = await fetch(
      `${PEAKDATA_BASE_URL_2}/organization/${encodeURIComponent(organizationExternalId)}/contact/upload`,
      {
        method: "POST",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: apiFormData,
      }
    );

    // Get response text first to handle empty responses
    const text = await response.text();
    
    // If response is empty but status is ok (200-299), treat as success
    if (response.ok && !text) {
      return NextResponse.json({ success: true, message: "Contacts uploaded successfully" });
    }

    // Try to parse as JSON
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      if (response.ok) {
        // If status is OK but not JSON, still treat as success
        return NextResponse.json({ success: true, message: "Contacts uploaded successfully" });
      }
      return NextResponse.json(
        { error: { message: "Invalid response from server" } },
        { status: 500 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: { message: data.error || "Failed to upload contacts" } },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || "Internal server error" } },
      { status: 500 }
    );
  }
}
