"use client";

import { useState, type FormEvent } from "react";
import { Building2, CreditCard, History } from "lucide-react";
import { useWhatsAppDemo } from "./demo-context";
import { WhatsAppProvisionHistory } from "./provision-history";
import {
  AdminCard,
  AdminMetric,
  DemoNotice,
  StatusBadge,
  formatAmount,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "./ui";

type WhatsAppProvisioningProps = { initialOrganizationId?: string };

export default function WhatsAppProvisioning({ initialOrganizationId = "" }: WhatsAppProvisioningProps) {
  const { organizations, provisions, peakWalletBalance, provisionCredit } = useWhatsAppDemo();
  const [organizationId, setOrganizationId] = useState(
    organizations.some((organization) => organization.id === initialOrganizationId) ? initialOrganizationId : "",
  );
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [historyOrganizationId, setHistoryOrganizationId] = useState("");
  const selectedOrganization = organizations.find((organization) => organization.id === organizationId);
  const provisionAmount = Number(amount);
  const hasValidAmount = Number.isFinite(provisionAmount) && provisionAmount > 0
    && Math.abs(Math.round(provisionAmount * 100) - provisionAmount * 100) < 0.000001;
  const filteredProvisions = historyOrganizationId
    ? provisions.filter((provision) => provision.organizationId === historyOrganizationId)
    : provisions;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!selectedOrganization) {
      setError("Select an organization to provision credits.");
      return;
    }
    if (!hasValidAmount) {
      setError("Enter a positive amount with up to two decimal places.");
      return;
    }
    if (provisionAmount > peakWalletBalance) {
      setError("The amount exceeds the available Peak WhatsApp wallet balance.");
      return;
    }
    try {
      provisionCredit(selectedOrganization.id, provisionAmount);
      setSuccess(`${formatAmount(provisionAmount)} provisioned to ${selectedOrganization.name}'s WhatsApp wallet.`);
      setAmount("");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to provision these credits.");
    }
  }

  function clearForm() {
    setOrganizationId("");
    setAmount("");
    setError("");
    setSuccess("");
  }

  return (
    <div className="space-y-5">
      <DemoNotice />
      <div className="grid gap-4 sm:grid-cols-3">
        <AdminMetric title="Peak WhatsApp Wallet" value={formatAmount(peakWalletBalance)} subtitle="Available balance for provisioning" icon={<CreditCard className="h-5 w-5" />} />
        <AdminMetric title="Customer Wallets" value={organizations.length.toLocaleString()} subtitle="Organizations with WhatsApp wallets" icon={<Building2 className="h-5 w-5" />} />
        <AdminMetric title="Provision Records" value={provisions.length.toLocaleString()} subtitle="WhatsApp credit top ups" icon={<History className="h-5 w-5" />} />
      </div>

      {success && <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}
      <AdminCard title="Provision WhatsApp Credits" description="Allocate credits from the Peak WhatsApp wallet to an organization.">
        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="whatsapp-provision-organization" className="mb-2 block text-sm font-semibold text-gray-700">Organization</label>
              <select
                id="whatsapp-provision-organization"
                value={organizationId}
                onChange={(event) => { setOrganizationId(event.target.value); setError(""); setSuccess(""); }}
                className={`${inputClass} w-full`}
                required
              >
                <option value="">Select organization</option>
                {organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="whatsapp-provision-amount" className="mb-2 block text-sm font-semibold text-gray-700">Amount (KES)</label>
              <input
                id="whatsapp-provision-amount"
                type="number"
                min="0.01"
                max={peakWalletBalance}
                step="0.01"
                required
                value={amount}
                onChange={(event) => { setAmount(event.target.value); setError(""); setSuccess(""); }}
                placeholder="Enter amount"
                className={`${inputClass} w-full`}
                aria-describedby="whatsapp-provision-available"
              />
              <p id="whatsapp-provision-available" className="mt-2 text-xs text-gray-500">Available: {formatAmount(peakWalletBalance)}</p>
            </div>
          </div>

          {selectedOrganization && (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div>
                <div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold text-gray-900">{selectedOrganization.name}</p><StatusBadge status={selectedOrganization.status} /></div>
                <p className="mt-1 text-sm text-gray-600">Current balance: {formatAmount(selectedOrganization.balance)}</p>
              </div>
              <div className="text-sm text-gray-600">
                Balance after provision
                <p className="mt-1 font-semibold text-[#02051d]">{formatAmount(selectedOrganization.balance + (hasValidAmount ? provisionAmount : 0))}</p>
              </div>
            </div>
          )}

          {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" onClick={clearForm} className={secondaryButtonClass}>Clear</button>
            <button type="submit" className={primaryButtonClass} disabled={organizations.length === 0 || peakWalletBalance <= 0}>Provision Credits</button>
          </div>
        </form>
      </AdminCard>

      <AdminCard
        title="WhatsApp Provision History"
        description="Credit allocations, the administrator and the date of each provision."
        action={
          <div className="w-full sm:w-64">
            <label htmlFor="whatsapp-provision-history-organization" className="sr-only">Filter provision history by organization</label>
            <select id="whatsapp-provision-history-organization" value={historyOrganizationId} onChange={(event) => setHistoryOrganizationId(event.target.value)} className={`${inputClass} w-full`}>
              <option value="">All organizations</option>
              {organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
            </select>
          </div>
        }
      >
        <WhatsAppProvisionHistory provisions={filteredProvisions} organizations={organizations} />
      </AdminCard>
    </div>
  );
}
