"use client";

import { useEffect, useState } from "react";
import { getWhatsAppCampaignStats, type WhatsAppCampaign as Campaign, type CampaignPage } from "@/app/api/actions/admin/whatsapp-reports";
import { useWhatsAppOrganizations } from "./use-organizations";
import { AdminCard, AdminTable, formatDateTime, inputClass, secondaryButtonClass, type TableColumn } from "./ui";

const columns: TableColumn<Campaign>[] = [
  { key: "name", label: "Campaign", render: (row) => <span className="font-semibold">{row.name}</span> },
  { key: "group_name", label: "Group" },
  { key: "contacts_count", label: "Contacts", render: (row) => row.contacts_count?.toLocaleString("en-KE") ?? "—" },
  { key: "total_messages", label: "Total Messages", render: (row) => row.total_messages?.toLocaleString("en-KE") ?? "—" },
  { key: "sent_count", label: "Sent", render: (row) => row.sent_count?.toLocaleString("en-KE") ?? "—" },
  { key: "delivered_count", label: "Delivered", render: (row) => row.delivered_count?.toLocaleString("en-KE") ?? "—" },
  { key: "campaign_read_count", label: "Read", render: (row) => row.campaign_read_count?.toLocaleString("en-KE") ?? "—" },
  { key: "failed_count", label: "Failed", render: (row) => <span className={row.failed_count ? "text-rose-600" : ""}>{row.failed_count?.toLocaleString("en-KE") ?? "—"}</span> },
  { key: "button_click_count", label: "Button Clicks", render: (row) => row.button_click_count?.toLocaleString("en-KE") ?? "—" },
  { key: "created_at", label: "Created", render: (row) => <span className="whitespace-nowrap text-gray-600">{row.created_at ? formatDateTime(row.created_at) : "—"}</span> },
];

export default function WhatsAppCampaigns() {
  const { organizations, loading: directoryLoading, error: directoryError, refresh: refreshOrganizations } = useWhatsAppOrganizations();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ organizationId: "", search: "", groupId: "", page: 1 });
  const [result, setResult] = useState<CampaignPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const busy = loading || query.trim() !== filters.search;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFilters((current) => current.search === query.trim() ? current : { ...current, search: query.trim(), page: 1 });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    setResult(null);
    setError("");
    if (!filters.organizationId) { setLoading(false); return; }
    setLoading(true);
    async function loadCampaigns() {
      try {
        const data = await getWhatsAppCampaignStats(filters.organizationId, { page: filters.page, search: filters.search, groupId: filters.groupId }, controller.signal);
        if (controller.signal.aborted) return;
        const lastPage = Math.max(1, Math.ceil(data.total / data.limit));
        if (data.page > lastPage) setFilters((current) => ({ ...current, page: lastPage }));
        else setResult(data);
      } catch (err) {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Unable to load campaigns.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadCampaigns();
    return () => controller.abort();
  }, [filters.organizationId, filters.search, filters.groupId, filters.page, revision]);

  return <div className="space-y-5">
    <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <label className="w-full text-sm font-medium text-gray-700 sm:w-64">Organization
        <select className={`${inputClass} mt-2`} value={filters.organizationId} disabled={directoryLoading || Boolean(directoryError)} onChange={(event) => { const organizationId = event.target.value; setResult(null); setFilters((current) => ({ ...current, organizationId, page: 1 })); }}>
          <option value="">Select an organization</option>
          {organizations.map((organization) => <option key={organization.organization_external_id} value={organization.organization_external_id}>{organization.organization_name}</option>)}
        </select>
      </label>
      <label className="min-w-0 flex-1 basis-60 text-sm font-medium text-gray-700">Search campaigns
        <input className={`${inputClass} mt-2`} type="search" placeholder="Campaign name" value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <label className="w-full text-sm font-medium text-gray-700 sm:w-44">Group ID (optional)
        <input className={`${inputClass} mt-2`} type="number" min="1" step="1" placeholder="All groups" value={filters.groupId} onChange={(event) => { const groupId = event.target.value; setFilters((current) => ({ ...current, groupId, page: 1 })); }} />
      </label>
      <button type="button" className={secondaryButtonClass} disabled={!query && !filters.groupId} onClick={() => { setQuery(""); setFilters((current) => ({ ...current, search: "", groupId: "", page: 1 })); }}>Clear Filters</button>
    </div>
    {directoryError && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{directoryError} <button type="button" className={secondaryButtonClass} onClick={refreshOrganizations}>Retry Organizations</button></div>}
    <AdminCard title="WhatsApp Campaigns" description="Campaign delivery results, from newest to oldest." action={<button type="button" className={secondaryButtonClass} disabled={busy || directoryLoading || !filters.organizationId} onClick={() => setRevision((value) => value + 1)}>Refresh</button>}>
      {directoryLoading ? <p role="status" className="px-6 py-10 text-center text-sm text-gray-500">Loading WhatsApp organizations...</p>
        : !filters.organizationId ? <p className="px-6 py-10 text-center text-sm text-gray-500">{!directoryError && !organizations.length ? "No WhatsApp organizations found." : "Select an organization to view campaigns."}</p>
        : busy ? <p role="status" className="px-6 py-10 text-center text-sm text-gray-500">Loading campaigns...</p>
        : error ? <div role="alert" className="m-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error} <button type="button" className={secondaryButtonClass} onClick={() => setRevision((value) => value + 1)}>Retry</button></div>
        : result && <AdminTable columns={columns} rows={result.data} emptyMessage="No campaigns match these filters." pagination={{ offset: (result.page - 1) * result.limit, limit: result.limit, count: result.total, onPageChange: (offset) => setFilters((current) => ({ ...current, page: Math.floor(offset / result.limit) + 1 })) }} />}
    </AdminCard>
  </div>;
}
