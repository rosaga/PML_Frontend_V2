const INSUFFICIENT_BALANCE_ERROR = "insufficient balance";
const INSUFFICIENT_AIRTIME_BALANCE_ERROR = "insufficient airtime balance";

const getErrorMessages = (value, depth = 0) => {
  if (typeof value === "string") {
    return [value];
  }

  if (depth >= 3 || value == null || typeof value !== "object") {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => getErrorMessages(item, depth + 1));
  }

  return ["errors", "error", "message", "_error"].flatMap((key) =>
    getErrorMessages(value[key], depth + 1)
  );
};

export const isInsufficientBalanceError = (error) => {
  const responseData = error?.response?.data ?? error?.data ?? error;

  return getErrorMessages(responseData).some((message) => {
    const normalizedMessage = message.trim().toLowerCase();

    return (
      normalizedMessage.includes(INSUFFICIENT_BALANCE_ERROR) ||
      normalizedMessage.includes(INSUFFICIENT_AIRTIME_BALANCE_ERROR)
    );
  });
};
