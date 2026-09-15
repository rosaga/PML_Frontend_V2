import { NextRequest, NextResponse } from "next/server";

const PEAKDATA_BASE_URL = "https://peakdata-1048592730476.europe-west4.run.app";

const SUPPORTED_FORMATS = new Set(["csv", "xlsx", "excel", "pdf"]);
const ALLOWED_FILTERS = new Set([
  "eq__status",
  "eq__category",
  "eq__template_name",
  "ilike__mobile_no",
  "ilike__campaign_name",
  "gte__created_at",
  "lte__created_at",
]);
const ALLOWED_SORTS = new Set([
  "created_at ASC",
  "created_at DESC",
  "status ASC",
  "status DESC",
]);

export async function GET(request: NextRequest) {
  const organizationExternalId =
    request.headers.get("x-organization-external-id") ||
    request.headers.get("x-organization-id");

  if (!organizationExternalId) {
    return NextResponse.json(
      { error: { message: "Organization external ID is required" } },
      { status: 400 }
    );
  }

  const format = (request.nextUrl.searchParams.get("format") || "csv").toLowerCase();
  if (!SUPPORTED_FORMATS.has(format)) {
    return NextResponse.json(
      { error: { message: "Unsupported export format" } },
      { status: 400 }
    );
  }

  const queryParams = new URLSearchParams({ format });
  request.nextUrl.searchParams.forEach((value, key) => {
    if (ALLOWED_FILTERS.has(key)) {
      queryParams.append(key, value);
    }
  });

  const orderby = request.nextUrl.searchParams.get("orderby");
  if (orderby && ALLOWED_SORTS.has(orderby)) {
    queryParams.set("orderby", orderby);
  }

  const token = request.headers.get("x-auth-token");
  const headers: Record<string, string> = {
    Accept: "*/*",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(
      `${PEAKDATA_BASE_URL}/organization/${encodeURIComponent(organizationExternalId)}/wa_message/export?${queryParams.toString()}`,
      {
        method: "GET",
        headers,
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      return NextResponse.json(
        {
          error: {
            message:
              data?.error?.message ||
              data?.message ||
              "Failed to export WhatsApp messages",
          },
        },
        { status: response.status }
      );
    }

    const responseHeaders = new Headers({
      "Cache-Control": "no-store",
      "Content-Type": response.headers.get("Content-Type") || "application/octet-stream",
      "X-Content-Type-Options": response.headers.get("X-Content-Type-Options") || "nosniff",
    });
    const contentDisposition = response.headers.get("Content-Disposition");
    if (contentDisposition) {
      responseHeaders.set("Content-Disposition", contentDisposition);
    }

    return new NextResponse(response.body, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("[API] WhatsApp messages export error:", error);
    return NextResponse.json(
      { error: { message: "Failed to export WhatsApp messages" } },
      { status: 500 }
    );
  }
}
