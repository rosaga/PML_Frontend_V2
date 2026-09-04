"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import type { ApiConfig } from "./whatsapp-api";

// Reads PML auth directly from localStorage — no postMessage needed since
// the WhatsApp module now lives inside the PML application.
function getPmlToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("token") || "";
}

function getPmlOrgId(): string {
  if (typeof window === "undefined") return "";
  // PML stores the selected org as selectedAccountId
  return localStorage.getItem("selectedAccountId") || localStorage.getItem("orgId") || "";
}

function isPmlTokenExpired(): boolean {
  const expiry = localStorage.getItem("tokenExpiration");
  if (!expiry) return false;
  return Date.now() > parseInt(expiry, 10);
}

interface ConfigContextType {
  config: ApiConfig;
  setConfig: (config: ApiConfig) => void;
  isConfigured: boolean;
  isLoading: boolean;
  organizationId: string;
  setOrganizationId: (id: string) => void;
  pmlOrganizationId: string;
  organizationExternalId: string;
  setOrganizationExternalId: (id: string) => void;
  displayPhoneNumber: string;
  setDisplayPhoneNumber: (number: string) => void;
  pmlTokenExpired: boolean;
  signalPmlUnauthorized: () => void;
  pmlLoginUrl: () => string;
  signOut: () => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

// All cache keys are scoped to the PML org ID so switching accounts
// never bleeds one org's WhatsApp config into another org's session.
const STORAGE_KEY_PREFIX = "whatsapp-api-config";
const ORG_EXTERNAL_ID_KEY_PREFIX = "whatsapp-external-id";
const DISPLAY_PHONE_NUMBER_KEY_PREFIX = "whatsapp-phone";

function orgKey(prefix: string, pmlOrgId: string) {
  return `${prefix}-${pmlOrgId}`;
}

// Legacy non-scoped keys — cleared on first load to avoid stale cross-org data.
const LEGACY_KEYS = [
  "whatsapp-api-config",
  "whatsapp-organization-id",
  "whatsapp-organization-external-id",
  "whatsapp-display-phone-number",
];

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<ApiConfig>({
    apiKey: "",
    wabaId: "",
    phoneNumberId: "",
    accessToken: undefined,
  });
  const [organizationId, setOrganizationIdState] = useState("");
  const [pmlOrganizationId, setPmlOrganizationIdState] = useState("");
  const [organizationExternalId, setOrganizationExternalIdState] = useState("");
  const [displayPhoneNumber, setDisplayPhoneNumberState] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pmlTokenExpired, setPmlTokenExpired] = useState(false);
  const lastActivityRef = useRef<number>(Date.now());
  const INACTIVITY_MS = 20 * 60 * 1000;

  const signOut = useCallback(() => {
    const pmlOrgId = getPmlOrgId();
    if (pmlOrgId) {
      localStorage.removeItem(orgKey(STORAGE_KEY_PREFIX, pmlOrgId));
      localStorage.removeItem(orgKey(ORG_EXTERNAL_ID_KEY_PREFIX, pmlOrgId));
      localStorage.removeItem(orgKey(DISPLAY_PHONE_NUMBER_KEY_PREFIX, pmlOrgId));
    }
    LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
    window.location.href = "/signin";
  }, []);

  useEffect(() => {
    // Clear legacy non-scoped keys on first load — prevents cross-org bleed.
    LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));

    const pmlOrgId = getPmlOrgId();

    if (!pmlOrgId) {
      setIsLoading(false);
      return;
    }

    // Read config scoped to the current PML org — a different org will find nothing here.
    const stored = localStorage.getItem(orgKey(STORAGE_KEY_PREFIX, pmlOrgId));
    const storedOrgExternalId = localStorage.getItem(orgKey(ORG_EXTERNAL_ID_KEY_PREFIX, pmlOrgId));
    const storedDisplayPhone = localStorage.getItem(orgKey(DISPLAY_PHONE_NUMBER_KEY_PREFIX, pmlOrgId));

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.apiKey && parsed.wabaId && parsed.phoneNumberId) {
          setConfigState(parsed);
          setIsConfigured(true);
        } else {
          setIsConfigured(false);
        }
      } catch {
        setIsConfigured(false);
      }
    } else {
      setIsConfigured(false);
    }

    setOrganizationIdState(pmlOrgId);
    setPmlOrganizationIdState(pmlOrgId);
    if (storedOrgExternalId) setOrganizationExternalIdState(storedOrgExternalId);
    if (storedDisplayPhone) setDisplayPhoneNumberState(storedDisplayPhone);

    setIsLoading(false);
  }, []);

  // Track user activity
  useEffect(() => {
    const onActivity = () => { lastActivityRef.current = Date.now(); };
    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, onActivity));
  }, []);

  // Token expiry check every minute — only fires after 20 minutes of inactivity
  useEffect(() => {
    const interval = setInterval(() => {
      const inactive = Date.now() - lastActivityRef.current;
      if (inactive >= INACTIVITY_MS && isPmlTokenExpired()) {
        setPmlTokenExpired(true);
      }
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [INACTIVITY_MS]);

  // Auto-verify WhatsApp config when org ID is available
  useEffect(() => {
    if (isLoading || isConfigured || !organizationId) return;
    let cancelled = false;

    const autoVerify = async () => {
      try {
        const peakResponse = await fetch(
          `https://peakdata-1048592730476.europe-west4.run.app/whatsapp/account?organization_external_id=${organizationId.trim()}`,
          { method: "GET", headers: { "Content-Type": "application/json" } }
        );
        const peakData = await peakResponse.json();
        if (!peakResponse.ok || peakData.status !== "success" || !peakData.data) return;

        const account = peakData.data;
        const apiKey = account.APIKey;

        const verifyResponse = await fetch("/api/whatsapp/whatsapp-internal/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey }),
        });
        const verifyData = await verifyResponse.json();
        if (!verifyResponse.ok) return;

        const userData = verifyData.data?.[0];
        if (!userData?.whatsapp_business_account_id || !userData?.phone_number_id) return;

        if (cancelled) return;

        const pmlOrgId = getPmlOrgId();
        const newConfig = {
          apiKey,
          wabaId: userData.whatsapp_business_account_id,
          phoneNumberId: userData.phone_number_id,
          accessToken: account.AccessToken,
        };
        setConfigState(newConfig);
        if (pmlOrgId) localStorage.setItem(orgKey(STORAGE_KEY_PREFIX, pmlOrgId), JSON.stringify(newConfig));
        setIsConfigured(true);

        if (account.OrganizationExternalID) {
          setOrganizationExternalIdState(account.OrganizationExternalID);
          if (pmlOrgId) localStorage.setItem(orgKey(ORG_EXTERNAL_ID_KEY_PREFIX, pmlOrgId), account.OrganizationExternalID);
        }
        if (account.DisplayPhoneNumber) {
          setDisplayPhoneNumberState(account.DisplayPhoneNumber);
          if (pmlOrgId) localStorage.setItem(orgKey(DISPLAY_PHONE_NUMBER_KEY_PREFIX, pmlOrgId), account.DisplayPhoneNumber);
        }
      } catch {
        // Silently fail — user can configure manually in settings
      }
    };

    autoVerify();
    return () => { cancelled = true; };
  }, [isLoading, isConfigured, organizationId]);

  const setConfig = useCallback((newConfig: ApiConfig) => {
    setConfigState(newConfig);
    const pmlOrgId = getPmlOrgId();
    if (pmlOrgId) localStorage.setItem(orgKey(STORAGE_KEY_PREFIX, pmlOrgId), JSON.stringify(newConfig));
    setIsConfigured(!!newConfig.apiKey && !!newConfig.wabaId && !!newConfig.phoneNumberId);
  }, []);

  const setOrganizationId = useCallback((id: string) => {
    // org ID always comes from PML's selectedAccountId — no separate localStorage entry needed
    setOrganizationIdState(id);
  }, []);

  const setOrganizationExternalId = useCallback((id: string) => {
    setOrganizationExternalIdState(id);
    const pmlOrgId = getPmlOrgId();
    if (pmlOrgId) {
      if (id) localStorage.setItem(orgKey(ORG_EXTERNAL_ID_KEY_PREFIX, pmlOrgId), id);
      else localStorage.removeItem(orgKey(ORG_EXTERNAL_ID_KEY_PREFIX, pmlOrgId));
    }
  }, []);

  const setDisplayPhoneNumber = useCallback((number: string) => {
    setDisplayPhoneNumberState(number);
    const pmlOrgId = getPmlOrgId();
    if (pmlOrgId) {
      if (number) localStorage.setItem(orgKey(DISPLAY_PHONE_NUMBER_KEY_PREFIX, pmlOrgId), number);
      else localStorage.removeItem(orgKey(DISPLAY_PHONE_NUMBER_KEY_PREFIX, pmlOrgId));
    }
  }, []);

  const signalPmlUnauthorized = useCallback(() => {
    setPmlTokenExpired(true);
  }, []);

  return (
    <ConfigContext.Provider value={{
      config, setConfig, isConfigured, isLoading,
      organizationId, setOrganizationId,
      pmlOrganizationId,
      organizationExternalId, setOrganizationExternalId,
      displayPhoneNumber, setDisplayPhoneNumber,
      pmlTokenExpired, signalPmlUnauthorized,
      pmlLoginUrl: () => "/signin",
      signOut,
    }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return context;
}
