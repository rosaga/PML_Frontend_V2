"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { getToken } from "@/utils/auth";
import { hasRole } from "@/utils/decodeToken";
import {
  approvalErrorMessage, approveRechargeRequest, canApproveRechargeRequest,
  getRechargeRequests, rechargeRequestId, rechargeRequestKey, rechargeRequestService, rechargeRequestStatus, rechargeRequestUnits,
} from "@/app/api/actions/admin/airtime-approvals";

const buttonClass = "h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50";
const pageSize = 10;
const services = [
  { value: "DATA", label: "Data" },
  { value: "SMS", label: "SMS" },
  { value: "AIRTIME", label: "Airtime" },
];

function organizationName(request) {
  return request.organization?.name || request.organization_name || request.org_name || request.account_name || request.account?.name ||
    (typeof window !== "undefined" && window.localStorage.getItem("selectedAccountName")) ||
    String(request.organization_id ?? request.org_id ?? "Organization unavailable");
}

function requestDate(value, pattern = "yyyy-MM-dd HH:mm") {
  try { return format(parseISO(value), pattern); }
  catch { return "—"; }
}

function amount(request) {
  const units = rechargeRequestUnits(request);
  if (!Number.isFinite(units)) return "Units unavailable";
  return rechargeRequestService(request) === "AIRTIME"
    ? `KES ${units.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `${units.toLocaleString()} units`;
}

export default function RechargeApprovalRequests() {
  const [allowed, setAllowed] = useState(null);
  const [requests, setRequests] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [service, setService] = useState("DATA");
  const [status, setStatus] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [approving, setApproving] = useState(new Set());
  const [confirmed, setConfirmed] = useState(new Set());
  const inFlight = useRef(new Set());
  const confirmedIds = useRef(new Set());
  const mounted = useRef(true);
  const sequence = useRef(0);
  const controller = useRef(null);
  const fresh = useRef(false);
  const reload = useRef(null);
  const serviceLabel = services.find((item) => item.value === service).label;

  const changeService = (value) => {
    if (value === service) return;
    controller.current?.abort();
    sequence.current++;
    fresh.current = false;
    setService(value);
    setPage(1);
    setRequests([]);
    setTotal(0);
    setLoading(true);
    setLoadError("");
    setError("");
    setSuccess("");
  };

  const load = useCallback(async () => {
    controller.current?.abort();
    const requestController = new AbortController();
    controller.current = requestController;
    const request = ++sequence.current;
    const current = () => mounted.current && request === sequence.current;
    fresh.current = false;
    setLoading(true);
    setLoadError("");
    try {
      const searchParams = {};
      if (status !== "ALL") searchParams.eq__status = status;
      if (search.trim()) searchParams.ilike__created_by = search.trim();
      if (dateFrom) searchParams.gte__created_at = `${dateFrom}T00:00:00`;
      if (dateTo) searchParams.lte__created_at = `${dateTo}T23:59:59.999`;
      const { rows, count } = await getRechargeRequests(window.localStorage.getItem("selectedAccountId"), page, pageSize, searchParams, requestController.signal, service);
      if (current()) {
        fresh.current = true;
        setRequests(rows.map((request) => ({ ...request, service })));
        setTotal(count);
        setPage((currentPage) => Math.min(currentPage, Math.max(1, Math.ceil(count / pageSize))));
      }
    } catch (error) {
      if (current()) setLoadError(approvalErrorMessage(error));
    } finally {
      if (current()) setLoading(false);
    }
  }, [page, status, search, dateFrom, dateTo, service]);
  reload.current = load;

  useEffect(() => {
    mounted.current = true;
    const token = getToken();
    const access = !!token && hasRole(token, "SuperAdmin");
    setAllowed(access);
    if (access) load();
    const onFocus = () => { if (access) load(); };
    window.addEventListener("focus", onFocus);
    return () => {
      mounted.current = false;
      controller.current?.abort();
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  const approve = async (request) => {
    const id = rechargeRequestId(request);
    const key = rechargeRequestKey(request);
    if (!allowed || !fresh.current || !canApproveRechargeRequest(request) || inFlight.current.has(key) || confirmedIds.current.has(key)) return;
    inFlight.current.add(key);
    setApproving(new Set(inFlight.current));
    setError("");
    setSuccess("");
    try {
      await approveRechargeRequest(request);
      if (!mounted.current) return;
      confirmedIds.current.add(key);
      setConfirmed(new Set(confirmedIds.current));
      setSuccess(`${rechargeRequestService(request)} recharge request approved for ${organizationName(request)} (${amount(request)}).`);
    } catch (error) {
      if (mounted.current) setError(approvalErrorMessage(error, "Approval could not be confirmed. Refresh the request status before trying again."));
    } finally {
      // Reload authoritative status after success, errors, and timeouts. A failed
      // read leaves approval disabled until the admin refreshes successfully.
      if (mounted.current) await reload.current();
      inFlight.current.delete(key);
      if (mounted.current) setApproving(new Set(inFlight.current));
    }
  };

  const visible = requests.filter((request) => {
    if (rechargeRequestService(request) !== service) return false;
    const requestStatus = confirmed.has(rechargeRequestKey(request)) ? "APPROVED" : rechargeRequestStatus(request);
    if (status !== "ALL" && requestStatus !== status) return false;
    return true;
  });
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = page;
  const rows = visible;

  if (allowed === null) return <p className="p-6">Loading approval requests…</p>;
  if (!allowed) return <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">SuperAdmin permission is required to approve recharge requests.</div>;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-semibold text-gray-900">Requests</h1>
          <p className="mt-1 text-sm text-gray-600">Review and approve data, SMS and airtime recharge requests.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" className={buttonClass} disabled={loading} onClick={load}>Refresh</button>
        </div>
      </div>
      <div role="tablist" aria-label="Recharge services" className="mb-6 inline-flex flex-wrap rounded-full bg-gray-200 p-1">
        {services.map((item, index) => (
          <button
            key={item.value}
            id={`request-tab-${item.value}`}
            type="button"
            role="tab"
            aria-selected={service === item.value}
            aria-controls="recharge-requests-panel"
            tabIndex={service === item.value ? 0 : -1}
            onClick={() => changeService(item.value)}
            onKeyDown={(event) => {
              const next = { ArrowRight: (index + 1) % services.length, ArrowLeft: (index + services.length - 1) % services.length, Home: 0, End: services.length - 1 }[event.key];
              if (next === undefined) return;
              event.preventDefault();
              changeService(services[next].value);
              event.currentTarget.parentElement.querySelectorAll('[role="tab"]')[next]?.focus();
            }}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${service === item.value ? "bg-white text-gray-900 shadow-sm" : "text-gray-700 hover:bg-gray-100"}`}
          >{item.label}</button>
        ))}
      </div>
      {error && <p role="alert" className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {loadError && <p role="alert" className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{loadError} Refresh the list before approving requests.</p>}
      {success && <p role="status" className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>}
      <section id="recharge-requests-panel" role="tabpanel" aria-labelledby={`request-tab-${service}`} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-gray-200 px-6 py-5">
          <div>
            <h2 className="text-[22px] font-semibold text-gray-900">{serviceLabel} recharge requests</h2>
            <p className="mt-1 text-sm text-gray-500">Approve an existing request to credit its organization.</p>
          </div>
          <div className="flex w-full min-w-0 flex-wrap items-end gap-3">
            <div>
              <label htmlFor="approval-status" className="mb-1 block text-sm text-gray-600">Status</label>
              <select id="approval-status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="h-10 rounded-xl border border-gray-200 px-3 text-sm">
                <option value="ALL">All statuses</option><option value="PENDING">Pending</option><option value="APPROVED">Approved</option>
              </select>
            </div>
            <div>
              <label htmlFor="approval-date-from" className="mb-1 block text-sm text-gray-600">From date</label>
              <input id="approval-date-from" type="date" value={dateFrom} max={dateTo || undefined} onChange={(event) => { setDateFrom(event.target.value); setPage(1); }} className="h-10 rounded-xl border border-gray-200 px-3 text-sm" />
            </div>
            <div>
              <label htmlFor="approval-date-to" className="mb-1 block text-sm text-gray-600">To date</label>
              <input id="approval-date-to" type="date" value={dateTo} min={dateFrom || undefined} onChange={(event) => { setDateTo(event.target.value); setPage(1); }} className="h-10 rounded-xl border border-gray-200 px-3 text-sm" />
            </div>
            <div className="min-w-0 max-w-full">
              <label htmlFor="approval-search" className="mb-1 block text-sm text-gray-600">Created by</label>
              <input id="approval-search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Requester" className="h-10 w-72 max-w-full rounded-xl border border-gray-200 px-4 text-sm" />
            </div>
            <button type="button" className={buttonClass} onClick={() => { setStatus("ALL"); setDateFrom(""); setDateTo(""); setSearch(""); setPage(1); }}>Clear filters</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full" aria-busy={loading}>
            <thead><tr>{["Request ID", "Organization / Account", "Service", "Package", "Requested units / amount", "Requested by", "Date & time", "Status", "Action"].map((heading) => <th key={heading} scope="col" className="border-b border-gray-200 px-6 py-4 text-left text-sm font-medium text-gray-500">{heading}</th>)}</tr></thead>
            <tbody>
              {loading && !requests.length ? <tr><td colSpan={9} className="px-6 py-12 text-center text-sm text-gray-500">Loading recharge requests…</td></tr> : !rows.length ? <tr><td colSpan={9} className="px-6 py-10 text-center text-sm text-gray-500">{loadError ? "Recharge requests are unavailable. Refresh to try again." : "No matching recharge requests."}</td></tr> : rows.map((request, index) => {
                const id = rechargeRequestId(request);
                const key = rechargeRequestKey(request);
                const requestStatus = confirmed.has(key) ? "APPROVED" : rechargeRequestStatus(request);
                return <tr key={id == null ? `${key}:${index}` : key}>
                  <td className="border-b border-gray-100 px-6 py-5 text-sm font-semibold text-gray-900">{id ?? "Unavailable"}</td>
                  <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-900">{organizationName(request)}</td>
                  <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">{rechargeRequestService(request)}</td>
                  <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">{request.package || "—"}</td>
                  <td className="border-b border-gray-100 px-6 py-5 text-sm font-semibold text-gray-900">{amount(request)}</td>
                  <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">{request.created_by || request.createdby || "—"}</td>
                  <td className="border-b border-gray-100 px-6 py-5 text-sm text-gray-600">{requestDate(request.created_at || request.createdat)}</td>
                  <td className="border-b border-gray-100 px-6 py-5 text-sm"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${requestStatus === "PENDING" ? "bg-orange-100 text-orange-700" : requestStatus === "APPROVED" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"}`}>{requestStatus}</span></td>
                  <td className="border-b border-gray-100 px-6 py-5 text-sm">{canApproveRechargeRequest(request) && !confirmed.has(key) ? <button type="button" aria-label={`Approve ${rechargeRequestService(request).toLowerCase()} request ${id}`} disabled={loading || !!loadError || approving.has(key)} onClick={() => approve(request)} className="rounded-xl bg-[#02051d] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{approving.has(key) ? "Approving…" : "Approve"}</button> : requestStatus === "PENDING" ? <span className="text-gray-500">Request details unavailable</span> : "—"}</td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-6 py-4">
          <p className="text-sm text-gray-500">{total} request(s) · Page {currentPage} of {pages}</p>
          <div className="flex gap-2">
            <button type="button" className={buttonClass} disabled={loading || currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button>
            <button type="button" className={buttonClass} disabled={loading || currentPage >= pages} onClick={() => setPage(currentPage + 1)}>Next</button>
          </div>
        </div>
      </section>
    </div>
  );
}
