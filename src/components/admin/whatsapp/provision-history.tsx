"use client";

import type { useWhatsAppDemo } from "./demo-context";
import { formatAmount, formatDateTime } from "./ui";

type WhatsAppDemo = ReturnType<typeof useWhatsAppDemo>;

type ProvisionHistoryProps = {
  provisions: WhatsAppDemo["provisions"];
  organizations: WhatsAppDemo["organizations"];
  showOrganization?: boolean;
  showBalance?: boolean;
};

export function WhatsAppProvisionHistory({
  provisions,
  organizations,
  showOrganization = true,
  showBalance = false,
}: ProvisionHistoryProps) {
  const sortedProvisions = [...provisions].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
  const organizationNames = new Map(
    organizations.map((organization) => [organization.id, organization.name]),
  );
  const cellClass = "border-b border-gray-100 px-5 py-4 text-sm text-gray-600";
  const headingClass =
    "border-b border-gray-200 px-5 py-4 text-left text-xs font-semibold text-gray-500";

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <caption className="sr-only">WhatsApp credit provision history</caption>
        <thead>
          <tr>
            <th scope="col" className={headingClass}>Provision ID</th>
            {showOrganization && <th scope="col" className={headingClass}>Organization</th>}
            <th scope="col" className={headingClass}>Service</th>
            <th scope="col" className={headingClass}>Amount</th>
            {showBalance && <th scope="col" className={headingClass}>Balance After</th>}
            <th scope="col" className={headingClass}>Admin</th>
            <th scope="col" className={headingClass}>Date &amp; Time (EAT)</th>
          </tr>
        </thead>
        <tbody>
          {sortedProvisions.length === 0 ? (
            <tr>
              <td
                colSpan={5 + Number(showOrganization) + Number(showBalance)}
                className="px-5 py-10 text-center text-sm text-gray-500"
              >
                No WhatsApp credit provisions found.
              </td>
            </tr>
          ) : (
            sortedProvisions.map((provision) => (
              <tr key={provision.id}>
                <td className={`${cellClass} whitespace-nowrap font-semibold text-[#02051d]`}>
                  {provision.id}
                </td>
                {showOrganization && (
                  <td className={`${cellClass} font-medium text-gray-900`}>
                    {organizationNames.get(provision.organizationId) ?? "Unknown organization"}
                  </td>
                )}
                <td className={cellClass}>
                  <span className="inline-flex rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
                    WhatsApp
                  </span>
                </td>
                <td className={`${cellClass} whitespace-nowrap font-semibold text-gray-900`}>
                  {formatAmount(provision.amount)}
                </td>
                {showBalance && (
                  <td className={`${cellClass} whitespace-nowrap`}>
                    {formatAmount(provision.balanceAfter)}
                  </td>
                )}
                <td className={cellClass}>{provision.admin}</td>
                <td className={`${cellClass} whitespace-nowrap`}>
                  {formatDateTime(provision.createdAt)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
