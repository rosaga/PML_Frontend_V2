"use client";

import { MessageCircle } from "lucide-react";
import { useWhatsAppDemo } from "./demo-context";
import { DemoNotice, SampleDataBadge, formatAmount, formatDateTime } from "./ui";

type OrganizationWhatsAppProps = {
  organizationId: string;
  organizationName: string;
};

export function OrganizationWhatsAppBalance({
  organizationId,
  organizationName,
}: OrganizationWhatsAppProps) {
  const { getOrganization } = useWhatsAppDemo();
  const organization = getOrganization(organizationId, organizationName);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-600">WhatsApp Balance</p>
          <p className="mt-2 text-[24px] font-semibold leading-none text-gray-900">
            <span className="text-sm font-medium">KES </span>
            {formatAmount(organization.balance).replace("KES ", "")}
          </p>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <MessageCircle size={24} aria-hidden="true" />
        </div>
      </div>
      <div className="mt-3">
        <SampleDataBadge />
      </div>
    </div>
  );
}

export function OrganizationWhatsAppHistory({
  organizationId,
  organizationName,
}: OrganizationWhatsAppProps) {
  const { campaigns } = useWhatsAppDemo();
  const organizationCampaigns = campaigns.filter(
    (campaign) => campaign.organizationId === organizationId,
  );

  // Live organizations do not share identifiers with the local sample directory.
  // Keep their preview scoped to this organization without altering live records.
  const rows = organizationCampaigns.length
    ? organizationCampaigns
    : [
        {
          id: `WA-${organizationId || "ORG"}-001`,
          name: "Customer update",
          organizationId,
          totalSent: 1250,
          delivered: 1238,
          failed: 12,
          sentAt: "2026-10-01T08:30:00+03:00",
          deliverySeconds: 42,
        },
      ];

  return (
    <div>
      <div className="px-6 py-5">
        <DemoNotice>WhatsApp dispatch records are sample data for this organization.</DemoNotice>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <caption className="sr-only">
            Sample WhatsApp campaigns for {organizationName}
          </caption>
          <thead>
            <tr>
              {[
                "Campaign ID",
                "Name",
                "Organization",
                "Total Sent",
                "Delivered",
                "Failed",
                "Date",
                "Delivery Time",
              ].map((label) => (
                <th
                  key={label}
                  scope="col"
                  className="whitespace-nowrap border-b border-gray-200 px-6 py-5 text-left text-sm font-semibold text-gray-600"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((campaign) => (
              <tr key={campaign.id}>
                <td className="whitespace-nowrap border-b border-gray-100 px-6 py-5 text-sm font-semibold text-gray-900">
                  {campaign.id}
                </td>
                <td className="whitespace-nowrap border-b border-gray-100 px-6 py-5 text-sm text-gray-900">
                  {campaign.name}
                </td>
                <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-900">
                  {organizationName}
                </td>
                <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-900">
                  {campaign.totalSent.toLocaleString()}
                </td>
                <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-900">
                  {campaign.delivered.toLocaleString()}
                </td>
                <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-900">
                  {campaign.failed.toLocaleString()}
                </td>
                <td className="whitespace-nowrap border-b border-gray-100 px-6 py-5 text-sm text-gray-600">
                  {formatDateTime(campaign.sentAt)}
                </td>
                <td className="whitespace-nowrap border-b border-gray-100 px-6 py-5 text-sm text-gray-600">
                  {campaign.deliverySeconds} sec
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="px-6 py-4 text-sm text-gray-500">
        Total: {rows.length} sample {rows.length === 1 ? "campaign" : "campaigns"}
      </p>
    </div>
  );
}
