"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { getActiveOrganizationId, subscribeToOrganization } from "./organization";

export function useActiveOrganization() {
  return useSyncExternalStore(subscribeToOrganization, getActiveOrganizationId, () => null);
}

// Airtime uses local React state; scope every result and invalidate late reads.
export function useOrganizationQuery<T>(
  load: (orgId: string) => Promise<T>,
  { events = "", pollInterval = 0 }: { events?: string; pollInterval?: number } = {},
) {
  const orgId = useActiveOrganization();
  const sequence = useRef({ version: 0 });
  const [result, setResult] = useState<{ orgId: string | null; data: T | null; error: string; loading: boolean }>({
    orgId: null, data: null, error: "", loading: true,
  });

  const refresh = useCallback(async () => {
    const request = ++sequence.current.version;
    if (!orgId) return;
    setResult((previous) => ({ orgId, data: previous.orgId === orgId ? previous.data : null, error: "", loading: true }));
    const current = () => request === sequence.current.version && getActiveOrganizationId() === orgId;
    try {
      const data = await load(orgId);
      if (current()) setResult({ orgId, data, error: "", loading: false });
    } catch (error) {
      if (current()) setResult((previous) => ({ ...previous, error: error instanceof Error ? error.message : "Unable to load airtime account data.", loading: false }));
    }
  }, [orgId, load]);

  useEffect(() => {
    const counter = sequence.current;
    refresh();
    const eventNames = events.split(" ").filter(Boolean);
    const onRefresh = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (!detail?.orgId || detail.orgId === orgId) refresh();
    };
    window.addEventListener("focus", onRefresh);
    eventNames.forEach((event) => window.addEventListener(event, onRefresh));
    const timer = pollInterval ? window.setInterval(refresh, pollInterval) : null;
    return () => {
      ++counter.version;
      window.removeEventListener("focus", onRefresh);
      eventNames.forEach((event) => window.removeEventListener(event, onRefresh));
      if (timer !== null) window.clearInterval(timer);
    };
  }, [refresh, events, pollInterval, orgId]);

  const active = result.orgId === orgId && !!orgId;
  return { orgId, data: active ? result.data : null, error: active ? result.error : "", loading: !!orgId && (!active || result.loading), refresh };
}
