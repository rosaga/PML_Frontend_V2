import { NextRequest, NextResponse } from "next/server";

const PEAKDATA_BASE_URL = "https://peakdata-jja4kcvvdq-ez.a.run.app/api/v2";

function tryParse(text: string) {
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
  const organizationExternalId = request.nextUrl.searchParams.get("organizationExternalId");
  const token = request.headers.get("x-auth-token") || "";

  if (!organizationExternalId) {
    return NextResponse.json(
      { error: { message: "Organization external ID is required" } },
      { status: 400 }
    );
  }

  if (!token) {
    return NextResponse.json(
      { error: { message: "Authentication token is required" } },
      { status: 401 }
    );
  }

  const orderby = request.nextUrl.searchParams.get("orderby") || "created_at DESC";
  const page = request.nextUrl.searchParams.get("page") || "1";
  const size = request.nextUrl.searchParams.get("size") || "10";
  const url = `${PEAKDATA_BASE_URL}/organization/${encodeURIComponent(organizationExternalId)}/groups/${encodeURIComponent(groupId)}/contacts?orderby=${encodeURIComponent(orderby)}&size=${encodeURIComponent(size)}&page=${encodeURIComponent(page)}`;

  try {
    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const data = tryParse(await response.text());

    if (!response.ok) {
      return NextResponse.json(
        { error: { message: data?.error?.message || data?.error || "Failed to fetch group contacts" } },
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

// Looks up an existing contact by mobile number. Returns the contact
// object (with its numeric id) if found, or null if not found.
async function findContactByMobileNo(
  organizationExternalId: string,
  mobileNo: string,
  token: string
) {
  const url = `${PEAKDATA_BASE_URL}/organization/${encodeURIComponent(organizationExternalId)}/contact?ilike__mobile_no=${encodeURIComponent(mobileNo)}&orderby=created_at%20DESC&page=1&size=10`;

  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = tryParse(await response.text());
  if (!response.ok || !Array.isArray(data?.data) || data.data.length === 0) {
    return null;
  }

  return (
    data.data.find((c: any) => c.status === "ACTIVE" && (c.first_name || c.last_name)) ??
    data.data.find((c: any) => c.status === "ACTIVE") ??
    data.data[0]
  );
}

// Creates a new contact. Returns the created contact object (with id),
// or null if creation failed (e.g. contact already exists).
async function createContact(
  organizationExternalId: string,
  mobileNo: string,
  metadata: Record<string, unknown> | undefined,
  token: string
) {
  const url = `${PEAKDATA_BASE_URL}/organization/${encodeURIComponent(organizationExternalId)}/contact`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      mobile_no: mobileNo,
      ...(metadata && typeof metadata === "object" ? { metadata } : {}),
    }),
  });

  const rawText = await response.text();
  const data = tryParse(rawText);

  console.log("CREATE CONTACT STATUS:", response.status);
  console.log("CREATE CONTACT RESPONSE:", rawText);

  if (!response.ok) {
    return null;
  }

  // Some backends return the created object directly, others wrap it in `data`.
  return data?.data ?? data;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const body = await request.json();
    const { mobile_no, metadata, contact_id: providedContactId } = body;
    const token = request.headers.get("x-auth-token") || "";

    const organizationExternalId =
      body.organizationExternalId ||
      body.organizationId ||
      request.nextUrl.searchParams.get("organizationExternalId") ||
      request.nextUrl.searchParams.get("organizationId");

    if (!organizationExternalId) {
      return NextResponse.json(
        { error: { message: "Organization external ID is required" } },
        { status: 400 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { error: { message: "Authentication token is required" } },
        { status: 401 }
      );
    }

    if (!mobile_no && !providedContactId) {
      return NextResponse.json(
        { error: { message: "mobile_no or contact_id is required" } },
        { status: 400 }
      );
    }

    let contactId: number | undefined = providedContactId;

    // Step 1: resolve a contact_id if one wasn't given directly.
    if (!contactId) {
      // Try creating the contact first.
      const created = await createContact(organizationExternalId, mobile_no, metadata, token);

      if (created?.id) {
        contactId = created.id;
      } else {
        // Creation failed — most likely the contact already exists.
        // Look it up by mobile number instead.
        const existing = await findContactByMobileNo(organizationExternalId, mobile_no, token);
        if (existing?.id) {
          contactId = existing.id;
        }
      }
    }

    if (!contactId) {
      return NextResponse.json(
        {
          error: {
            message: "Could not create or find a contact with that phone number.",
          },
        },
        { status: 400 }
      );
    }

    // Step 2: attach the resolved contact_id to the group.
    const attachUrl = `${PEAKDATA_BASE_URL}/organization/${encodeURIComponent(organizationExternalId)}/group/${encodeURIComponent(groupId)}/contact/attach`;
    const attachBody = [{ contact_id: contactId }];

    console.log("ATTACHING TO GROUP:", attachUrl);
    console.log("ATTACH BODY:", JSON.stringify(attachBody));

    const attachResponse = await fetch(attachUrl, {
      method: "PUT",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(attachBody),
    });

    const attachRawText = await attachResponse.text();
    const attachData = tryParse(attachRawText);

    console.log("ATTACH RESPONSE STATUS:", attachResponse.status);
    console.log("ATTACH RESPONSE TEXT:", attachRawText);

    if (!attachResponse.ok) {
      return NextResponse.json(
        {
          error: {
            message:
              attachData?.error?.message ||
              attachData?.error ||
              attachData?.msg ||
              (Array.isArray(attachData?.errors) ? attachData.errors.join(", ") : null) ||
              "Unable to add contact to group. Check the phone number and try again.",
          },
        },
        { status: attachResponse.status }
      );
    }

    return NextResponse.json(attachData);
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message || "Internal server error" } },
      { status: 500 }
    );
  }
}