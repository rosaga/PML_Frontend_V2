"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchTechProviderAccount, type TechProviderAccount } from "./account-api";

export function useTechProviderAccount(externalId: string) {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    externalId: string;
    account: TechProviderAccount | null;
    loading: boolean;
    error: string;
  }>({ externalId: "", account: null, loading: false, error: "" });
  const refreshAccount = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    if (!externalId) return;
    const controller = new AbortController();
    const isCurrent = () => !controller.signal.aborted && window.localStorage.getItem("selectedAccountId") === externalId;
    setResult({ externalId, account: null, loading: true, error: "" });
    fetchTechProviderAccount(externalId, { signal: controller.signal })
      .then((account) => {
        if (isCurrent()) setResult({ externalId, account, loading: false, error: "" });
      })
      .catch((reason) => {
        if (isCurrent()) setResult({ externalId, account: null, loading: false, error: reason instanceof Error ? reason.message : "Could not load your WhatsApp account. Please try again." });
      });
    return () => controller.abort();
  }, [externalId, revision]);

  const current = Boolean(externalId) && result.externalId === externalId;
  return {
    account: current ? result.account : null,
    accountLoading: Boolean(externalId) && (!current || result.loading),
    accountError: current ? result.error : "",
    refreshAccount,
  };
}
