import axios from "axios";
import apiUrl from "@/app/api/utils/apiUtils/apiUrl";
import { authHeaders } from "@/app/api/utils/headers/headers";
import { hasRole } from "@/utils/decodeToken";
import { GetRecharges as GetDataRecharges } from "@/app/api/actions/reward/reward";
import { GetAirtimeRecharges } from "@/app/api/actions/airtimeReward/airtimeReward";
import { GetRecharges as GetSmsRecharges } from "@/app/api/actions/senderId/senderId";

export class RechargeApprovalError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export function approvalErrorMessage(error, fallback = "Unable to load recharge requests.") {
  const body = error?.response?.data;
  for (const value of [body?.error, body?.message]) {
    if (typeof value === "string" && value.trim()) return value;
  }
  const status = error?.response?.status ?? error?.status;
  if (status === 401) return "Your session is no longer authorized. Please sign in again.";
  if (status === 403) return "SuperAdmin permission is required to approve recharge requests.";
  if (status === 404) return "This recharge request could not be found. Refresh the list.";
  if (status === 409) return "This recharge request has already been processed. Refresh the list.";
  return error instanceof RechargeApprovalError ? error.message : fallback;
}

async function approvalHeaders() {
  const config = await authHeaders();
  const token = config?.headers?.Authorization?.replace(/^Bearer /, "");
  if (!token || token === "null" || token === "undefined") throw new RechargeApprovalError("Sign in to review recharge requests.", 401);
  if (!hasRole(token, "SuperAdmin")) throw new RechargeApprovalError("SuperAdmin permission is required to approve recharge requests.", 403);
  return config;
}

export function rechargeRequestStatus(request) {
  const value = rechargeRequestService(request) === "SMS"
    ? request?.status_code || request?.status
    : request?.status || request?.status_code;
  const status = String(value || "UNKNOWN").trim().toUpperCase();
  return { RCG200: "APPROVED", RCG202: "PENDING" }[status] || status;
}

export function rechargeRequestService(request) {
  return String(request?.service || request?.account?.service || "").trim().toUpperCase();
}

export function isAirtimeRechargeRequest(request) {
  return rechargeRequestService(request) === "AIRTIME";
}

export function rechargeRequestId(request) {
  return request?.id ?? request?.recharge_id;
}

export function rechargeRequestKey(request) {
  return `${rechargeRequestService(request)}:${rechargeRequestId(request)}`;
}

export function rechargeRequestUnits(request) {
  return Number(request?.units ?? request?.quantity ?? request?.airtime_amount);
}

export function canApproveRechargeRequest(request) {
  const id = rechargeRequestId(request);
  const units = rechargeRequestUnits(request);
  return ["DATA", "SMS", "AIRTIME"].includes(rechargeRequestService(request)) && rechargeRequestStatus(request) === "PENDING" &&
    (typeof id === "string" ? !!id.trim() : typeof id === "number" && Number.isSafeInteger(id) && id > 0) &&
    Number.isFinite(units) && units > 0;
}

function rechargePage(payload) {
  const candidates = [payload?.data?.items, payload?.data?.recharges, payload?.data?.records, payload?.data?.results,
    payload?.items, payload?.recharges, payload?.records, payload?.results, payload?.data, payload];
  const rows = candidates.find(Array.isArray);
  if (!rows) throw new RechargeApprovalError("The recharge request response is invalid. Refresh the list.");
  const pagination = payload?.pagination || payload?.data?.pagination;
  const count = [payload?.count, payload?.total, payload?.data?.count, payload?.data?.total, pagination?.total]
    .find((value) => typeof value === "number" && Number.isSafeInteger(value) && value >= 0);
  return { rows, count: count ?? rows.length };
}

export async function getRechargeRequests(orgId, page = 1, pageSize = 10, searchParams = {}, signal, service = "DATA") {
  await approvalHeaders();
  signal?.throwIfAborted();
  if (!["DATA", "SMS", "AIRTIME"].includes(service)) throw new RechargeApprovalError("Select a valid recharge service.");
  if (service !== "SMS" && !orgId) throw new RechargeApprovalError("Select an account to view recharge requests.");
  const getRecharges = service === "AIRTIME" ? GetAirtimeRecharges : GetDataRecharges;
  // Match SMS Units: SuperAdmins use its existing admin list. Data and Airtime
  // use the selected organization's existing paged product actions.
  const response = service === "SMS"
    ? await GetSmsRecharges("admin")
    : await getRecharges(orgId, page, pageSize, searchParams);
  signal?.throwIfAborted();
  if (response?.errors) throw new RechargeApprovalError(response.errors._error || "Unable to load recharge requests.");
  const result = rechargePage(response?.data);
  if (service !== "SMS") return result;

  // The SMS product returns its full list. Filter and paginate that response
  // locally, as its product page does, without changing the SMS API.
  const rows = result.rows.map((request) => ({ ...request, service: "SMS" })).filter((request) => {
    if (searchParams.eq__status && rechargeRequestStatus(request) !== searchParams.eq__status) return false;
    const requester = String(request.createdby || request.created_by || "").toLowerCase();
    if (searchParams.ilike__created_by && !requester.includes(searchParams.ilike__created_by.toLowerCase())) return false;
    const created = Date.parse(request.createdat || request.created_at);
    if (searchParams.gte__created_at && (!Number.isFinite(created) || created < Date.parse(searchParams.gte__created_at))) return false;
    if (searchParams.lte__created_at && (!Number.isFinite(created) || created > Date.parse(searchParams.lte__created_at))) return false;
    return true;
  });
  return { rows: rows.slice((page - 1) * pageSize, page * pageSize), count: rows.length };
}

export async function approveRechargeRequest(request) {
  if (!canApproveRechargeRequest(request)) throw new RechargeApprovalError("Only a pending recharge request with a valid ID and amount can be approved.", 400);
  const config = await approvalHeaders();
  const sms = rechargeRequestService(request) === "SMS";
  const url = sms ? apiUrl.APPROVE_SMS_UNITS : apiUrl.APPROVE_UNITS;
  const response = await axios.put(`${url}/${encodeURIComponent(rechargeRequestId(request))}`, sms ? null : {}, config);
  const body = response.data;
  if (body?.error || body?.status === "FAILED") {
    throw new RechargeApprovalError(typeof body.error === "string" ? body.error : "The recharge request could not be approved.");
  }
  // Match the existing service recharge approval workflows (HTTP 202).
  if (![200, 202].includes(response.status)) throw new RechargeApprovalError("Approval could not be confirmed. Refresh the request status before trying again.");
  return body;
}

export async function approveAirtimeRechargeRequest(request) {
  if (!isAirtimeRechargeRequest(request) || !canApproveRechargeRequest(request)) throw new RechargeApprovalError("Only a pending airtime recharge request with a valid ID and amount can be approved.", 400);
  return approveRechargeRequest(request);
}
