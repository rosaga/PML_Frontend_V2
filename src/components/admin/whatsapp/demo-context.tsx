"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  demoOrganizations, demoCampaigns, demoProvisions, demoFailedDispatches,
  DEMO_PEAK_WALLET_BALANCE, type WhatsAppOrganization, type WhatsAppProvision,
} from "./demo-data";

type DemoState = {
  organizations: WhatsAppOrganization[];
  provisions: WhatsAppProvision[];
  peakWalletBalance: number;
};

type DemoContextValue = DemoState & {
  campaigns: typeof demoCampaigns;
  failedDispatches: typeof demoFailedDispatches;
  getOrganization: (id: string, name: string) => WhatsAppOrganization;
  provisionCredit: (organizationId: string, amount: number) => void;
};

const WhatsAppDemoContext = createContext<DemoContextValue | null>(null);

export function WhatsAppDemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>({
    organizations: demoOrganizations,
    provisions: demoProvisions,
    peakWalletBalance: DEMO_PEAK_WALLET_BALANCE,
  });

  const getOrganization = useCallback((id: string, name: string): WhatsAppOrganization => (
    state.organizations.find((organization) => organization.id === id) ?? {
      id, name, status: "Active", connectedAt: "2026-09-05T09:00:00+03:00",
      nextRenewal: "2026-11-05", balance: 3500,
    }
  ), [state.organizations]);

  const provisionCredit = useCallback((organizationId: string, amount: number) => {
    if (!Number.isFinite(amount) || amount <= 0 || Math.abs(Math.round(amount * 100) - amount * 100) > 0.000001) {
      throw new Error("Enter a positive credit amount with up to two decimal places.");
    }
    if (!state.organizations.some((organization) => organization.id === organizationId)) {
      throw new Error("Select a WhatsApp customer.");
    }
    if (amount > state.peakWalletBalance) {
      throw new Error("The credit amount exceeds the available Peak wallet balance.");
    }

    const id = `WA-PRV-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const createdAt = new Date().toISOString();
    setState((current) => {
      const organization = current.organizations.find((item) => item.id === organizationId);
      if (!organization || amount > current.peakWalletBalance) return current;
      const balanceAfter = Math.round((organization.balance + amount) * 100) / 100;
      return {
        organizations: current.organizations.map((item) => item.id === organizationId ? { ...item, balance: balanceAfter } : item),
        peakWalletBalance: Math.round((current.peakWalletBalance - amount) * 100) / 100,
        provisions: [{ id, organizationId, amount, admin: "Admin", createdAt, balanceAfter }, ...current.provisions],
      };
    });
  }, [state.organizations, state.peakWalletBalance]);

  const value = useMemo(() => ({
    ...state, campaigns: demoCampaigns, failedDispatches: demoFailedDispatches,
    getOrganization, provisionCredit,
  }), [state, getOrganization, provisionCredit]);

  return <WhatsAppDemoContext.Provider value={value}>{children}</WhatsAppDemoContext.Provider>;
}

export function useWhatsAppDemo() {
  const context = useContext(WhatsAppDemoContext);
  if (!context) throw new Error("WhatsApp demo components must be inside WhatsAppDemoProvider.");
  return context;
}
