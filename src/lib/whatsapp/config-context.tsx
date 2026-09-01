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

const STORAGE_KEY = "whatsapp-api-config";
const ORG_ID_KEY = "whatsapp-organization-id";
const ORG_EXTERNAL_ID_KEY = "whatsapp-organization-external-id";
const DISPLAY_PHONE_NUMBER_KEY = "whatsapp-display-phone-number";

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
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ORG_ID_KEY);
    localStorage.removeItem(ORG_EXTERNAL_ID_KEY);
    localStorage.removeItem(DISPLAY_PHONE_NUMBER_KEY);
    // Redirect to PML sign-in page
    window.location.href = "/signin";
  }, []);

  useEffect(() => {
    // Pull auth directly from PML's localStorage
    const orgId = getPmlOrgId();
    const stored = localStorage.getItem(STORAGE_KEY);
    const storedOrgId = localStorage.getItem(ORG_ID_KEY);
    const storedOrgExternalId = localStorage.getItem(ORG_EXTERNAL_ID_KEY);
    const storedDisplayPhone = localStorage.getItem(DISPLAY_PHONE_NUMBER_KEY);

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

    const effectiveOrgId = storedOrgId || orgId;
    if (effectiveOrgId) {
      setOrganizationIdState(effectiveOrgId);
      setPmlOrganizationIdState(effectiveOrgId);
      if (!storedOrgId) localStorage.setItem(ORG_ID_KEY, effectiveOrgId);
    }
    if (orgId) setPmlOrganizationIdState(orgId);
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

        const newConfig = {
          apiKey,
          wabaId: userData.whatsapp_business_account_id,
          phoneNumberId: userData.phone_number_id,
          accessToken: account.AccessToken,
        };
        setConfigState(newConfig);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
        setIsConfigured(true);

        if (account.OrganizationExternalID) {
          setOrganizationExternalIdState(account.OrganizationExternalID);
          localStorage.setItem(ORG_EXTERNAL_ID_KEY, account.OrganizationExternalID);
        }
        if (account.DisplayPhoneNumber) {
          setDisplayPhoneNumberState(account.DisplayPhoneNumber);
          localStorage.setItem(DISPLAY_PHONE_NUMBER_KEY, account.DisplayPhoneNumber);
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    setIsConfigured(!!newConfig.apiKey && !!newConfig.wabaId && !!newConfig.phoneNumberId);
  }, []);

  const setOrganizationId = useCallback((id: string) => {
    setOrganizationIdState(id);
    if (id) localStorage.setItem(ORG_ID_KEY, id);
    else localStorage.removeItem(ORG_ID_KEY);
  }, []);

  const setOrganizationExternalId = useCallback((id: string) => {
    setOrganizationExternalIdState(id);
    if (id) localStorage.setItem(ORG_EXTERNAL_ID_KEY, id);
    else localStorage.removeItem(ORG_EXTERNAL_ID_KEY);
  }, []);

  const setDisplayPhoneNumber = useCallback((number: string) => {
    setDisplayPhoneNumberState(number);
    if (number) localStorage.setItem(DISPLAY_PHONE_NUMBER_KEY, number);
    else localStorage.removeItem(DISPLAY_PHONE_NUMBER_KEY);
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
