"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getOrganizationWhatsAppBalance } from "@/app/api/actions/admin/whatsapp-reports";
import { useWhatsAppOrganizations } from "./use-organizations";
import { AdminCard, AdminTable, formatAmount, inputClass, secondaryButtonClass, type TableColumn } from "./ui";

type WalletRow = { id: string; name: string };
type BalanceState = { loading: boolean; amount?: number; error?: string };

export default function WhatsAppWallets() {
  const { organizations, loading, error, refresh } = useWhatsAppOrganizations();
  const [search, setSearch] = useState("");
  const [balances, setBalances] = useState<Record<string, BalanceState>>({});
  const pending = useRef(new Map<string, AbortController>());

  useEffect(() => {
    const requests = pending.current;
    return () => { requests.forEach((controller) => controller.abort()); requests.clear(); };
  }, []);

  async function checkBalance(externalId: string) {
    if (pending.current.has(externalId)) return;
    const controller = new AbortController();
    pending.current.set(externalId, controller);
    setBalances((current) => ({ ...current, [externalId]: { loading: true } }));
    try {
      const amount = await getOrganizationWhatsAppBalance(externalId, controller.signal);
      if (!controller.signal.aborted) setBalances((current) => ({ ...current, [externalId]: { loading: false, amount } }));
    } catch (err) {
      if (!controller.signal.aborted) setBalances((current) => ({ ...current, [externalId]: { loading: false, error: err instanceof Error ? err.message : "Unable to check balance." } }));
    } finally {
      pending.current.delete(externalId);
    }
  }

  const rows: WalletRow[] = organizations.filter((organization) => organization.organization_name.toLowerCase().includes(search.trim().toLowerCase())).map((organization) => ({ id: organization.organization_external_id, name: organization.organization_name }));
  const columns: TableColumn<WalletRow>[] = [
    { key: "name", label: "Organization", render: (row) => <Link href={`/apps/admin/organizations/${encodeURIComponent(row.id)}`} className="font-semibold text-[#001F3D] underline underline-offset-4">{row.name}</Link> },
    { key: "balance", label: "Wallet Balance", render: (row) => {
      const balance = balances[row.id];
      return balance?.loading ? <span role="status" className="text-gray-500">Checking...</span> : balance?.error ? <span role="alert" className="text-xs text-rose-600">{balance.error}</span> : balance?.amount !== undefined ? <span className="whitespace-nowrap font-semibold">{formatAmount(balance.amount)}</span> : <span className="text-gray-500">Not checked</span>;
    } },
    { key: "actions", label: "Actions", render: (row) => <button type="button" className="inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#001F3D] disabled:cursor-not-allowed disabled:opacity-50" disabled={balances[row.id]?.loading ?? false} aria-label={`Check WhatsApp balance for ${row.name}`} onClick={() => checkBalance(row.id)}>{balances[row.id]?.loading ? "Checking..." : balances[row.id]?.error ? "Retry Balance" : "Check Balance"}</button> },
  ];

  return <AdminCard title="WhatsApp Customer Wallets" description="Check the current WhatsApp balance for an organization." action={<div className="flex flex-wrap gap-3">
    <label className="w-full sm:w-72"><span className="sr-only">Search customer wallets</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search organization..." className={inputClass} /></label>
    <button type="button" className={secondaryButtonClass} disabled={loading} onClick={refresh}>Refresh Organizations</button>
  </div>}>
    {loading ? <p role="status" className="px-6 py-10 text-center text-sm text-gray-500">Loading WhatsApp organizations...</p>
      : error ? <div role="alert" className="m-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error} <button type="button" className={secondaryButtonClass} onClick={refresh}>Retry</button></div>
      : <AdminTable columns={columns} rows={rows} emptyMessage="No customer wallets match your search." />}
  </AdminCard>;
}
