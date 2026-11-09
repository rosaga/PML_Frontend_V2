const messageText = (value) => typeof value === "string" && value.trim() ? value : "";

export function apiErrorMessage(error, fallback = "Unable to complete the request.") {
  const body = error?.response?.data ?? error?.data ?? error;
  const message = messageText(body?.error) || messageText(body?.message) || messageText(body?.errors?._error);
  if (message) return message;
  switch (error?.response?.status ?? error?.status) {
    case 400: return "The request is invalid or the organization account is unavailable.";
    case 401: return "Your session is no longer authorized. Please sign in again.";
    case 402: return "Your organization's airtime balance is insufficient. Please top up the account.";
    case 403: return "You do not have access to this organization or action.";
    case 404: return "The organization or account could not be found.";
    case 500: return "A server error prevented delivery confirmation.";
    case 502: return "The airtime provider could not confirm delivery.";
    default: return fallback;
  }
}

export function airtimePayload(reward) {
  const amount = String(reward.airtime_amount ?? "").trim();
  if (typeof reward.msisdn !== "string" || !reward.msisdn.trim()) throw new Error("Enter a recipient number.");
  if (!amount || !Number.isFinite(Number(amount)) || Number(amount) < 0.01) {
    throw new Error("Enter a finite airtime amount of at least KES 0.01.");
  }
  return { ...reward, msisdn: reward.msisdn.trim(), airtime_amount: String(Number(amount)) };
}

export function interpretAirtimeResult(response) {
  const body = response?.data ?? {};
  const dispatch = body.response ?? body.details;
  const error = messageText(body.error);
  const hasError = typeof body.error === "string" ? !!body.error.trim() : !!body.error;
  const httpSuccess = response?.status >= 200 && response?.status < 300;
  if (hasError || body.status === "FAILED" || dispatch?.status === "FAILED") {
    return { outcome: "failed", message: error || messageText(dispatch?.status_desc) || apiErrorMessage(response, "Airtime dispatch failed."), topUp: response?.status === 402 };
  }
  if (httpSuccess && dispatch?.status === "SUCCESS") {
    return { outcome: "success", message: messageText(dispatch.status_desc) || "Airtime dispatched successfully.", topUp: false };
  }
  const unconfirmed = "Airtime delivery is unconfirmed. Review dispatch history before sending again.";
  return { outcome: "unconfirmed", message: httpSuccess ? unconfirmed : apiErrorMessage(response, "Unable to confirm airtime delivery.") + " " + unconfirmed, topUp: response?.status === 402 };
}
