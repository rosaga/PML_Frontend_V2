"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { Building2, CreditCard, History, Wallet, X } from "lucide-react";
import { useWhatsAppDemo } from "./demo-context";
import { WhatsAppProvisionHistory } from "./provision-history";
import {
  AdminCard,
  AdminMetric,
  DemoNotice,
  StatusBadge,
  formatAmount,
  formatDateTime,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "./ui";

export default function WhatsAppWallets() {
  const { organizations, provisions, peakWalletBalance } = useWhatsAppDemo();
  const [search, setSearch] = useState("");
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null);
  const historyTrigger = useRef<HTMLButtonElement | null>(null);
  const selectedOrganization = organizations.find(
    (organization) => organization.id === selectedOrganizationId,
  );
  const filteredOrganizations = organizations.filter((organization) =>
    organization.name.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const customerBalance = organizations.reduce(
    (total, organization) => total + organization.balance,
    0,
  );
  const totalTopUps = provisions.reduce((total, provision) => total + provision.amount, 0);
  const latestTopUps = new Map<string, string>();
  for (const provision of provisions) {
    const latest = latestTopUps.get(provision.organizationId);
    if (!latest || new Date(provision.createdAt).getTime() > new Date(latest).getTime()) {
      latestTopUps.set(provision.organizationId, provision.createdAt);
    }
  }

  return (
    <div className="space-y-5">
      <DemoNotice />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetric title="Customer Wallets" value={organizations.length.toLocaleString()} subtitle="Organizations with WhatsApp wallets" icon={<Building2 className="h-5 w-5" />} />
        <AdminMetric title="Total Customer Balance" value={formatAmount(customerBalance)} subtitle="Combined customer wallet balance" icon={<Wallet className="h-5 w-5" />} />
        <AdminMetric title="Peak WhatsApp Wallet" value={formatAmount(peakWalletBalance)} subtitle="Available company wallet balance" icon={<CreditCard className="h-5 w-5" />} />
        <AdminMetric title="Total Provisioned" value={formatAmount(totalTopUps)} subtitle="Total recorded customer top ups" icon={<History className="h-5 w-5" />} />
      </div>

      <AdminCard
        title="WhatsApp Customer Wallets"
        description="View organization balances and their top up history."
        action={
          <div className="w-full sm:w-72">
            <label htmlFor="whatsapp-wallet-search" className="sr-only">Search customer wallets</label>
            <input
              id="whatsapp-wallet-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search organization..."
              className={`${inputClass} w-full`}
            />
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <caption className="sr-only">WhatsApp customer wallet balances</caption>
            <thead>
              <tr>
                {["Organization", "Status", "Wallet Balance", "Last Top Up (EAT)", "Actions"].map((heading) => (
                  <th key={heading} scope="col" className="border-b border-gray-200 px-5 py-4 text-left text-xs font-semibold text-gray-500">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredOrganizations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-500">No customer wallets match your search.</td>
                </tr>
              ) : filteredOrganizations.map((organization) => {
                const lastTopUp = latestTopUps.get(organization.id);
                return (
                  <tr key={organization.id}>
                    <td className="border-b border-gray-100 px-5 py-4 text-sm font-semibold text-gray-900">{organization.name}</td>
                    <td className="border-b border-gray-100 px-5 py-4"><StatusBadge status={organization.status} /></td>
                    <td className="whitespace-nowrap border-b border-gray-100 px-5 py-4 text-sm font-semibold text-gray-900">{formatAmount(organization.balance)}</td>
                    <td className="whitespace-nowrap border-b border-gray-100 px-5 py-4 text-sm text-gray-600">{lastTopUp ? formatDateTime(lastTopUp) : "No top ups yet"}</td>
                    <td className="border-b border-gray-100 px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            historyTrigger.current = event.currentTarget;
                            setSelectedOrganizationId(organization.id);
                          }}
                          className={`${secondaryButtonClass} whitespace-nowrap`}
                          aria-label={`View top up history for ${organization.name}`}
                        >
                          View History
                        </button>
                        <Link
                          href={`/apps/admin/provisionUnits?tab=whatsapp&organization=${encodeURIComponent(organization.id)}`}
                          className={`${primaryButtonClass} whitespace-nowrap`}
                          aria-label={`Provision WhatsApp credits for ${organization.name}`}
                        >
                          Provision
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-4 text-sm text-gray-500">{filteredOrganizations.length} of {organizations.length} customer wallets</div>
      </AdminCard>

      <Dialog.Root open={Boolean(selectedOrganization)} onOpenChange={(open) => { if (!open) setSelectedOrganizationId(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white shadow-xl focus:outline-none"
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              historyTrigger.current?.focus();
            }}
          >
            <div className="relative border-b border-gray-200 p-6 pr-14">
              <Dialog.Title className="text-xl font-semibold text-[#02051d]">{selectedOrganization?.name} Top Up History</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-gray-500">
                Current WhatsApp wallet balance: {formatAmount(selectedOrganization?.balance ?? 0)}.
              </Dialog.Description>
              <Dialog.Close className="absolute right-4 top-4 rounded-lg p-2 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500" aria-label="Close top up history">
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>
            <WhatsAppProvisionHistory
              provisions={provisions.filter((provision) => provision.organizationId === selectedOrganizationId)}
              organizations={organizations}
              showOrganization={false}
              showBalance
            />
            <div className="flex justify-end p-5"><Dialog.Close className={secondaryButtonClass}>Close</Dialog.Close></div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
