import axios from "axios";
import apiUrl from "@/app/api/utils/apiUtils/apiUrl";
import { authHeaders } from "@/app/api/utils/headers/headers";
import type { PermissionRequest } from "./types";

export class OrganizationAccessError extends Error {
  constructor(message: string, public status = 0, public savedRoleId?: string) {
    super(message);
    this.name = "OrganizationAccessError";
  }
}

function errorDetail(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(errorDetail).filter(Boolean).join("; ");
  if (value && typeof value === "object") {
    const detail = value as Record<string, unknown>;
    if (detail.message || detail.msg) return errorDetail(detail.message || detail.msg);
    return Object.entries(detail).map(([field, message]) => `${field}: ${errorDetail(message)}`).join("; ");
  }
  return "";
}

// Reuse the application's headers and token lifecycle; do not store or refresh tokens here.
export const organizationPermissionRequest: PermissionRequest = async <T,>(method: string, path: string, body?: unknown): Promise<T> => {
  const config = await authHeaders();
  const authorization = config?.headers?.Authorization;
  if (!authorization || authorization === "Bearer null" || authorization === "Bearer undefined") {
    throw new OrganizationAccessError("Please sign in to manage organization access.", 401);
  }
  try {
    const response = await axios.request<T>({
      ...config,
      method,
      url: `${apiUrl.GET_ACCOUNTS}${path.slice("/api/v2/organization".length)}`,
      ...(body !== undefined ? { data: body } : {}),
    });
    return response.data;
  } catch (error) {
    if (!axios.isAxiosError(error)) throw error;
    const status = error.response?.status ?? 0;
    const payload = error.response?.data;
    const detail = errorDetail(payload?.detail || payload?.errors || payload?.error || payload?.message);
    const fallback = status === 403 ? "You do not have permission to perform this action. Only the organization owner can change user access."
      : status === 401 ? "Your session is no longer authorized. Please sign in again."
      : status === 400 || status === 422 ? "Check the selected roles, permissions, and form fields."
      : "Unable to reach the organization service. Please try again.";
    throw new OrganizationAccessError(status === 403 ? `Access denied (403). ${detail || fallback}` : detail || fallback, status);
  }
};
