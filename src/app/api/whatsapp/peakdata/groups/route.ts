import { NextRequest, NextResponse } from "next/server";

const PEAKDATA_BASE_URL = "https://peakdata-jja4kcvvdq-ez.a.run.app/api/v2";
const DEFAULT_ORGANIZATION_ID = process.env.NEXT_PUBLIC_ORGANIZATION_ID || "58045135-f272-4879-be0f-2559d836fdba";

function tryParse(text: string) {
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get organization external ID from query parameter (preferred), fallback to organizationId, then environment variable
    const organizationExternalId = request.nextUrl.searchParams.get("organizationExternalId");
    const organizationId = request.nextUrl.searchParams.get("organizationId") || DEFAULT_ORGANIZATION_ID;
    const token = request.headers.get("x-auth-token") || "";
    
    // Use organizationExternalId if provided, otherwise fall back to organizationId
    const finalOrgId = organizationExternalId || organizationId;

    if (!token) {
      return NextResponse.json(
        { error: { message: "Authentication token is required" } },
        { status: 401 }
      );
    }
    
    // Get pagination and sorting parameters
    const orderby = request.nextUrl.searchParams.get("orderby") || "created_at DESC";
    const page = request.nextUrl.searchParams.get("page") || "1";
    const size = request.nextUrl.searchParams.get("size") || "10";

    const response = await fetch(
      `${PEAKDATA_BASE_URL}/organization/${finalOrgId}/group?eq__is_deleted=false&orderby=${encodeURIComponent(orderby)}&page=${page}&size=${size}`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = tryParse(await response.text());

    if (!response.ok) {
      return NextResponse.json(
        { error: { message: data?.error?.message || data?.error || "Failed to fetch groups" } },
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, metadata } = body;
    const token = request.headers.get("x-auth-token") || "";
    
    // Get organization external ID from body (preferred), fallback to organizationId, then environment variable
    const organizationExternalId = body.organizationExternalId || body.organizationId || request.nextUrl.searchParams.get("organizationExternalId") || request.nextUrl.searchParams.get("organizationId") || DEFAULT_ORGANIZATION_ID;
    const finalOrgId = organizationExternalId;

    if (!token) {
      return NextResponse.json(
        { error: { message: "Authentication token is required" } },
        { status: 401 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: { message: "Group name is required" } },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${PEAKDATA_BASE_URL}/organization/${finalOrgId}/group`,
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description: description || name,
          ...(metadata && typeof metadata === "object" ? { metadata } : {}),
        }),
      }
    );

    const data = tryParse(await response.text());

    if (!response.ok) {
      return NextResponse.json(
        {
          error: {
            message:
              data?.error?.message ||
              data?.error ||
              "Unable to create group. Check the name and description and try again.",
          },
        },
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
