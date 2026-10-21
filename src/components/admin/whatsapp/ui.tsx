"use client";

import { useEffect, useState, type ReactNode } from "react";

export const primaryButtonClass = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#02051d] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#001F3D] disabled:cursor-not-allowed disabled:opacity-50";
export const secondaryButtonClass = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#001F3D] disabled:cursor-not-allowed disabled:opacity-50";
export const inputClass = "h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-[#001F3D] focus:ring-1 focus:ring-[#001F3D]";

export function formatAmount(value: number) {
  return `KES ${value.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Nairobi", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date(value));
}

export function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Nairobi", day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export function SampleDataBadge() {
  return <span className="inline-flex shrink-0 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-500">Sample data</span>;
}

export function DemoNotice({ children = "WhatsApp balances and activity are examples. Credit changes apply to this preview only." }: { children?: ReactNode }) {
  return <div className="mb-5 flex flex-wrap items-center gap-3 text-sm text-gray-500"><SampleDataBadge /><span>{children}</span></div>;
}

export function AdminCard({ title, description, action, children }: { title: string; description?: string; action?: ReactNode; children: ReactNode }) {
  return <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 px-5 py-5 sm:px-6">
      <div><h2 className="text-[20px] font-semibold text-gray-900">{title}</h2>{description && <p className="mt-1 text-sm text-gray-500">{description}</p>}</div>
      {action}
    </div>
    {children}
  </section>;
}

export function AdminMetric({ title, value, subtitle, icon }: { title: string; value: ReactNode; subtitle?: ReactNode; icon?: ReactNode }) {
  return <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
    <div className="flex min-h-11 items-start justify-between gap-3">
      <p className="text-sm font-medium text-gray-600">{title}</p>
      {icon && <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-50 text-[#F58426]">{icon}</div>}
    </div>
    <p className="mt-2 break-words text-[26px] font-semibold leading-tight text-gray-900">{value}</p>
    {subtitle && <div className="mt-3 text-xs text-gray-500">{subtitle}</div>}
  </div>;
}

export function StatusBadge({ status }: { status: string }) {
  const classes = status === "Active" || status === "Delivered" ? "bg-[#02051d] text-white" : status === "Failed" ? "bg-rose-50 text-rose-700" : "bg-gray-100 text-gray-600";
  return <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${classes}`}>{status}</span>;
}

export type TableColumn<T> = { key: string; label: string; render?: (row: T) => ReactNode };

export function AdminTable<T extends { id: string }>({ columns, rows, emptyMessage = "No records found.", pageSize = 5 }: { columns: TableColumn<T>[]; rows: T[]; emptyMessage?: string; pageSize?: number }) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  useEffect(() => { setPage(1); }, [rows]);
  const visibleRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return <>
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead><tr>{columns.map((column) => <th scope="col" key={column.key} className="whitespace-nowrap border-b border-gray-200 px-5 py-4 text-left text-xs font-semibold text-gray-600 sm:px-6">{column.label}</th>)}</tr></thead>
        <tbody>{visibleRows.length ? visibleRows.map((row) => <tr key={row.id} className="hover:bg-gray-50">{columns.map((column) => <td key={column.key} className="border-b border-gray-100 px-5 py-4 text-gray-900 sm:px-6">{column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? "—")}</td>)}</tr>) : <tr><td colSpan={columns.length} className="px-6 py-10 text-center text-sm text-gray-500">{emptyMessage}</td></tr>}</tbody>
      </table>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-xs text-gray-500 sm:px-6">
      <p>{rows.length ? `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, rows.length)} of ${rows.length} records` : "0 records"}</p>
      <div className="flex items-center gap-2"><button type="button" className={secondaryButtonClass} disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button><span className="px-1">{currentPage} / {pageCount}</span><button type="button" className={secondaryButtonClass} disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Next</button></div>
    </div>
  </>;
}
