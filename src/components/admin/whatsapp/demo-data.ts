export type WhatsAppOrganization = {
  id: string;
  name: string;
  status: "Active" | "Inactive";
  connectedAt: string;
  nextRenewal: string | null;
  balance: number;
};

export type WhatsAppCampaign = {
  id: string;
  name: string;
  organizationId: string;
  totalSent: number;
  delivered: number;
  failed: number;
  sentAt: string;
  deliverySeconds: number;
};

export type WhatsAppProvision = {
  id: string;
  organizationId: string;
  amount: number;
  admin: string;
  createdAt: string;
  balanceAfter: number;
};

export type FailedDispatch = {
  id: string;
  organizationId: string;
  service: "SMS" | "Data" | "WhatsApp";
  recipient: string;
  campaign: string;
  status: "Failed";
  createdAt: string;
  error: string;
};

// These fixtures are isolated from the existing WhatsApp client and admin APIs.
export const demoOrganizations: WhatsAppOrganization[] = [
  { id: "wa-org-001", name: "Acacia Retail", status: "Active", connectedAt: "2026-07-12T08:00:00+03:00", nextRenewal: "2026-10-12", balance: 24500 },
  { id: "wa-org-002", name: "Savannah Logistics", status: "Active", connectedAt: "2026-08-08T09:30:00+03:00", nextRenewal: "2026-10-08", balance: 18200 },
  { id: "wa-org-003", name: "Lakeview Hospitality", status: "Active", connectedAt: "2026-06-19T11:15:00+03:00", nextRenewal: "2026-10-19", balance: 32000 },
  { id: "wa-org-004", name: "Jambo Health", status: "Active", connectedAt: "2026-09-02T10:00:00+03:00", nextRenewal: "2026-11-02", balance: 15800 },
  { id: "wa-org-005", name: "Summit Academy", status: "Inactive", connectedAt: "2026-05-15T14:00:00+03:00", nextRenewal: null, balance: 4200 },
  { id: "wa-org-006", name: "Coastline Foods", status: "Active", connectedAt: "2026-08-24T08:45:00+03:00", nextRenewal: "2026-10-24", balance: 17200 },
];

export const demoCampaigns: WhatsAppCampaign[] = [
  { id: "WA-CMP-008", name: "October offers", organizationId: "wa-org-001", totalSent: 2400, delivered: 2346, failed: 54, sentAt: "2026-10-05T10:40:00+03:00", deliverySeconds: 42 },
  { id: "WA-CMP-007", name: "Delivery updates", organizationId: "wa-org-002", totalSent: 1280, delivered: 1258, failed: 22, sentAt: "2026-10-05T09:20:00+03:00", deliverySeconds: 26 },
  { id: "WA-CMP-006", name: "Appointment reminders", organizationId: "wa-org-004", totalSent: 860, delivered: 851, failed: 9, sentAt: "2026-10-05T08:10:00+03:00", deliverySeconds: 19 },
  { id: "WA-CMP-005", name: "Weekend reservations", organizationId: "wa-org-003", totalSent: 1600, delivered: 1544, failed: 56, sentAt: "2026-10-04T15:30:00+03:00", deliverySeconds: 34 },
  { id: "WA-CMP-004", name: "Fresh arrivals", organizationId: "wa-org-006", totalSent: 3200, delivered: 3120, failed: 80, sentAt: "2026-10-04T11:00:00+03:00", deliverySeconds: 58 },
  { id: "WA-CMP-003", name: "Term reminders", organizationId: "wa-org-005", totalSent: 750, delivered: 715, failed: 35, sentAt: "2026-09-28T09:00:00+03:00", deliverySeconds: 22 },
  { id: "WA-CMP-002", name: "Member rewards", organizationId: "wa-org-001", totalSent: 1800, delivered: 1772, failed: 28, sentAt: "2026-10-03T14:20:00+03:00", deliverySeconds: 31 },
  { id: "WA-CMP-001", name: "Shipment confirmations", organizationId: "wa-org-002", totalSent: 960, delivered: 951, failed: 9, sentAt: "2026-10-02T10:15:00+03:00", deliverySeconds: 24 },
];

export const demoProvisions: WhatsAppProvision[] = [
  { id: "WA-PRV-005", organizationId: "wa-org-001", amount: 10000, admin: "Admin", createdAt: "2026-10-05T09:15:00+03:00", balanceAfter: 24500 },
  { id: "WA-PRV-004", organizationId: "wa-org-003", amount: 15000, admin: "Admin", createdAt: "2026-10-04T14:25:00+03:00", balanceAfter: 32000 },
  { id: "WA-PRV-003", organizationId: "wa-org-002", amount: 8000, admin: "Admin", createdAt: "2026-10-03T11:40:00+03:00", balanceAfter: 18200 },
  { id: "WA-PRV-002", organizationId: "wa-org-004", amount: 5000, admin: "Admin", createdAt: "2026-10-02T08:50:00+03:00", balanceAfter: 15800 },
  { id: "WA-PRV-001", organizationId: "wa-org-001", amount: 5000, admin: "Admin", createdAt: "2026-10-01T10:00:00+03:00", balanceAfter: 14500 },
];

export const demoFailedDispatches: FailedDispatch[] = [
  { id: "WA-DSP-006", organizationId: "wa-org-001", service: "WhatsApp", recipient: "+254712000101", campaign: "October offers", status: "Failed", createdAt: "2026-10-05T10:40:42+03:00", error: "Recipient is unavailable on WhatsApp" },
  { id: "SMS-DSP-005", organizationId: "wa-org-003", service: "SMS", recipient: "+254722000102", campaign: "Reservation confirmation", status: "Failed", createdAt: "2026-10-05T10:15:18+03:00", error: "Invalid recipient number" },
  { id: "DATA-DSP-004", organizationId: "wa-org-002", service: "Data", recipient: "+254732000103", campaign: "Driver data rewards", status: "Failed", createdAt: "2026-10-05T09:45:06+03:00", error: "Recipient is not eligible for this bundle" },
  { id: "WA-DSP-003", organizationId: "wa-org-002", service: "WhatsApp", recipient: "+254742000104", campaign: "Delivery updates", status: "Failed", createdAt: "2026-10-05T09:20:26+03:00", error: "Message delivery window expired" },
  { id: "WA-DSP-002", organizationId: "wa-org-004", service: "WhatsApp", recipient: "+254752000105", campaign: "Appointment reminders", status: "Failed", createdAt: "2026-10-05T08:10:19+03:00", error: "Recipient could not be reached" },
  { id: "SMS-DSP-001", organizationId: "wa-org-006", service: "SMS", recipient: "+254762000106", campaign: "Order updates", status: "Failed", createdAt: "2026-10-04T16:35:09+03:00", error: "Delivery rejected by network" },
];

export const DEMO_REPORT_DATE = "2026-10-05";
export const DEMO_PEAK_WALLET_BALANCE = 250000;
