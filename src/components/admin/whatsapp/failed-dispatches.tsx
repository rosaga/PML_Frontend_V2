"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useWhatsAppDemo } from "./demo-context";
import {
  AdminCard,
  AdminTable,
  DemoNotice,
  SampleDataBadge,
  formatDateTime,
  inputClass,
  secondaryButtonClass,
} from "./ui";

type ProductFilter = "All" | "SMS" | "Data" | "WhatsApp";
type FailedDispatch = ReturnType<typeof useWhatsAppDemo>["failedDispatches"][number];
type DispatchRow = FailedDispatch & { organization: string };

const columns = [
  { key: "id", label: "Dispatch ID" },
  { key: "organization", label: "Organization" },
  { key: "service", label: "Product" },
  { key: "recipient", label: "Recipient" },
  {
    key: "error",
    label: "Reason for Failure",
    render: (row: DispatchRow) => <span className="text-rose-700">{row.error}</span>,
  },
  {
    key: "createdAt",
    label: "Date & Time (EAT)",
    render: (row: DispatchRow) => formatDateTime(row.createdAt),
  },
];

function useDispatchRows() {
  const { organizations, failedDispatches } = useWhatsAppDemo();

  return useMemo(() => {
    const names = new Map(organizations.map((organization) => [organization.id, organization.name]));
    return failedDispatches
      .map((dispatch) => ({
        ...dispatch,
        organization: names.get(dispatch.organizationId) || dispatch.organizationId,
      }))
      .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime());
  }, [organizations, failedDispatches]);
}

export function RecentWhatsAppFailedDispatches() {
  const rows = useDispatchRows();
  const recentRows = rows.filter((row) => row.service === "WhatsApp").slice(0, 3);

  return (
    <AdminCard
      title="Recent WhatsApp Failed Dispatches"
      description="Recent sample delivery failures."
      action={
        <div className="flex flex-wrap items-center gap-3">
          <SampleDataBadge />
          <Link href="/apps/admin/failed-dispatches?product=WhatsApp" className={secondaryButtonClass}>
            View WhatsApp Failures
          </Link>
        </div>
      }
    >
      <AdminTable columns={columns} rows={recentRows} emptyMessage="No WhatsApp failed dispatches found." />
    </AdminCard>
  );
}

export default function FailedDispatches({ initialProduct = "All" }: { initialProduct?: ProductFilter }) {
  const [product, setProduct] = useState<ProductFilter>(initialProduct);
  const [search, setSearch] = useState("");
  const rows = useDispatchRows();

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (product !== "All" && row.service !== product) return false;
      return !query || [row.id, row.organization, row.service, row.recipient, row.error]
        .some((value) => value.toLowerCase().includes(query));
    });
  }, [rows, product, search]);

  return (
    <div className="lg:ml-64 min-h-screen bg-gray-50 p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[30px] font-semibold leading-tight text-gray-900">Failed Dispatches</h1>
          <p className="mt-1 text-sm text-gray-600">Review failed deliveries across services.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/apps/admin/dashboard" className={secondaryButtonClass}>Back to Dashboard</Link>
        </div>
      </div>

      <DemoNotice>Dispatch records are sample data for this preview.</DemoNotice>

      <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-[minmax(0,1fr)_180px_auto]">
          <div>
            <label htmlFor="failed-dispatch-search" className="mb-2 block text-sm font-medium text-gray-700">
              Search dispatches
            </label>
            <input
              id="failed-dispatch-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by ID, organization, recipient or reason"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="failed-dispatch-product" className="mb-2 block text-sm font-medium text-gray-700">
              Product
            </label>
            <select
              id="failed-dispatch-product"
              value={product}
              onChange={(event) => setProduct(event.target.value as ProductFilter)}
              className={inputClass}
            >
              <option value="All">All Products</option>
              <option value="SMS">SMS</option>
              <option value="Data">Data</option>
              <option value="WhatsApp">WhatsApp</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => { setSearch(""); setProduct("All"); }}
            className={secondaryButtonClass}
            disabled={!search && product === "All"}
          >
            Clear Filters
          </button>
        </div>
      </div>

      <AdminCard
        title="Failed Dispatches"
        description={`${filteredRows.length.toLocaleString()} ${filteredRows.length === 1 ? "dispatch" : "dispatches"} found`}
      >
        <AdminTable columns={columns} rows={filteredRows} emptyMessage="No failed dispatches match these filters." />
      </AdminCard>
    </div>
  );
}
