"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getOrganizationWhatsAppUsage, type WhatsAppUsage as Usage } from "@/app/api/actions/admin/whatsapp-reports";
import { useWhatsAppOrganizations } from "./use-organizations";
import { AdminCard, AdminTable, inputClass, secondaryButtonClass, type TableColumn } from "./ui";

type UsageRow = { id: string; organization: string; usage?: Usage; error?: string };

export default function WhatsAppUsage() {
  const { organizations, loading: directoryLoading, error: directoryError, refresh: refreshOrganizations } = useWhatsAppOrganizations();
  const [query, setQuery] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<UsageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const pageSize = 5;
  const filtered = useMemo(() => organizations.filter((organization) => (!organizationId || organization.organization_external_id === organizationId) && organization.organization_name.toLowerCase().includes(query.trim().toLowerCase())), [organizations, organizationId, query]);
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  const visible = useMemo(() => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize), [filtered, currentPage]);

  useEffect(() => {
    if (directoryLoading || directoryError) return;
    const controller = new AbortController();
    setLoading(true);
    setRows([]);
    async function load() {
      // Limit concurrent organization requests to the five rows on this page.
      const result = await Promise.all(visible.map(async (organization): Promise<UsageRow> => {
        const row = { id: organization.organization_external_id, organization: organization.organization_name };
        try {
          return { ...row, usage: await getOrganizationWhatsAppUsage(row.id, controller.signal) };
        } catch (err) {
          return { ...row, error: err instanceof Error ? err.message : "Unable to load organization usage." };
        }
      }));
      if (!controller.signal.aborted) { setRows(result); setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [directoryLoading, directoryError, visible, revision]);

  const columns: TableColumn<UsageRow>[] = [
    { key: "organization", label: "Organization", render: (row) => <Link href={`/apps/admin/organizations/${encodeURIComponent(row.id)}`} className="font-semibold text-[#001F3D] underline underline-offset-4">{row.organization}</Link> },
    { key: "campaignCount", label: "Campaigns", render: (row) => row.usage?.campaignCount.toLocaleString("en-KE") ?? "—" },
    { key: "total_messages", label: "Total Messages", render: (row) => row.usage?.total_messages.toLocaleString("en-KE") ?? "—" },
    { key: "sent_count", label: "Sent", render: (row) => row.usage?.sent_count.toLocaleString("en-KE") ?? "—" },
    { key: "delivered_count", label: "Delivered", render: (row) => row.usage?.delivered_count.toLocaleString("en-KE") ?? "—" },
    { key: "campaign_read_count", label: "Read", render: (row) => row.usage?.campaign_read_count.toLocaleString("en-KE") ?? "—" },
    { key: "failed_count", label: "Failed", render: (row) => <span className="text-rose-600">{row.usage?.failed_count.toLocaleString("en-KE") ?? "—"}</span> },
    { key: "actions", label: "Actions", render: (row) => row.error ? <div className="space-y-2"><p role="alert" className="text-xs text-rose-600">{row.error}</p><button type="button" className={secondaryButtonClass} onClick={() => setRevision((value) => value + 1)}>Retry Usage</button></div> : "—" },
  ];

  return <div className="space-y-5">
    <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <label className="min-w-0 flex-1 basis-60 text-sm font-medium text-gray-700">Search organizations
        <input className={`${inputClass} mt-2`} type="search" placeholder="Organization name" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} />
      </label>
      <label className="w-full text-sm font-medium text-gray-700 sm:w-64">Organization
        <select className={`${inputClass} mt-2`} value={organizationId} disabled={directoryLoading || Boolean(directoryError)} onChange={(event) => { setOrganizationId(event.target.value); setPage(1); }}><option value="">All Organizations</option>{organizations.map((organization) => <option key={organization.organization_external_id} value={organization.organization_external_id}>{organization.organization_name}</option>)}</select>
      </label>
      <button type="button" className={secondaryButtonClass} disabled={!query && !organizationId} onClick={() => { setQuery(""); setOrganizationId(""); setPage(1); }}>Clear Filters</button>
    </div>
    <AdminCard title="Organization Usage" description="Totals across all WhatsApp campaigns for each organization." action={<button type="button" className={secondaryButtonClass} disabled={directoryLoading || (!directoryError && loading)} onClick={() => directoryError ? refreshOrganizations() : setRevision((value) => value + 1)}>Refresh</button>}>
      {directoryError ? <div role="alert" className="m-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{directoryError} <button type="button" className={secondaryButtonClass} onClick={refreshOrganizations}>Retry Organizations</button></div>
        : directoryLoading || loading ? <p role="status" className="px-6 py-10 text-center text-sm text-gray-500">Loading organization usage...</p>
        : <AdminTable columns={columns} rows={rows} emptyMessage="No organizations match these filters." pagination={{ offset: (currentPage - 1) * pageSize, limit: pageSize, count: filtered.length, onPageChange: (offset) => setPage(Math.floor(offset / pageSize) + 1) }} />}
    </AdminCard>
  </div>;
}
