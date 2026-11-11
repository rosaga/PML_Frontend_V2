"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/utils/auth";
import { CheckCircle2, Loader2, MessageCircle, PlugZap, ShieldCheck, Smartphone } from "lucide-react";
import { TechProviderHeader, useTechProviderWorkspace } from "./dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/whatsapp/ui/card";
import { Button } from "@/components/whatsapp/ui/button";
import { Badge } from "@/components/whatsapp/ui/badge";
import { TECH_PROVIDER_ORGANIZATION_ID as ALLOWED_ORGANIZATION_ID } from "./navigation";

const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || "1768412394357109";
const FACEBOOK_GRAPH_API_VERSION = process.env.NEXT_PUBLIC_FACEBOOK_GRAPH_API_VERSION || "v26.0";
const WHATSAPP_CONFIG_ID =
  process.env.NEXT_PUBLIC_WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID || "1085280167192120";
const API_BASE_URL =
  (process.env.NEXT_PUBLIC_PEAKWHATSAPP_API_BASE_URL ||
    "https://peakwhatsappdev-1048592730476.europe-west4.run.app").replace(/\/+$/, "");
const CALLBACK_WAIT_MS = 30000;
const SIGNUP_EVENTS = new Set([
  "FINISH", "CANCEL", "ERROR", "FINISH_ONLY_WABA", "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING",
]);
const emptyProgress = {
  authorization: "Not received",
  event: "Not received",
  completion: "Not sent",
  telemetry: "Not sent",
};

const setupSteps = [
  "Confirm Meta Business access",
  "Connect or create a WhatsApp Business Account",
  "Add a phone number for messaging",
  "Securely complete the connection",
];

export function EmbeddedSignup({ onConnected } = {}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [sdkReady, setSdkReady] = useState(false);
  const [signupStatus, setSignupStatus] = useState("Waiting for WhatsApp connection");
  const [isCompleting, setIsCompleting] = useState(false);
  const [connectionComplete, setConnectionComplete] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [signupProgress, setSignupProgress] = useState(emptyProgress);
  const signupCodeRef = useRef("");
  const signupDataRef = useRef(null);
  const signupOrganizationRef = useRef("");
  const signupActiveRef = useRef(false);
  const signupAttemptRef = useRef(0);
  const completionInFlightRef = useRef(false);
  const completeSignupRef = useRef(null);
  const callbackTimerRef = useRef(null);
  const waitForCallbackRef = useRef(null);
  const isConfigured = Boolean(FACEBOOK_APP_ID && WHATSAPP_CONFIG_ID && FACEBOOK_GRAPH_API_VERSION);

  useEffect(() => {
    const organizationId = window.localStorage.getItem("selectedAccountId");

    if (organizationId !== ALLOWED_ORGANIZATION_ID) {
      router.replace("/miniapp");
      return;
    }

    setAuthorized(true);
    setCheckingAccess(false);
  }, [router]);

  useEffect(() => {
    const postJson = async (path, body) => {
      const token = getToken();
      if (!token) throw new Error("Please sign in again to connect WhatsApp.");

      let response;
      try {
        response = await fetch(`${API_BASE_URL}${path}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(35000),
        });
      } catch {
        throw new Error("No response from the WhatsApp API. Check the browser network request and the API's allowed frontend origins. Check connection status before starting signup again.");
      }

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const message = errorBody?.error?.message || `Request failed with status ${response.status}`;
        const requestId = response.headers.get("x-request-id");
        const detail = errorBody?.error?.code ? `${message} (${errorBody.error.code})` : message;
        throw new Error(`${detail}${requestId ? ` — Request ID: ${requestId}` : ""}`);
      }

      const contentType = response.headers.get("content-type") || "";
      return contentType.includes("application/json") ? response.json() : null;
    };

    const stopWaiting = (message) => {
      clearTimeout(callbackTimerRef.current);
      signupActiveRef.current = false;
      signupCodeRef.current = "";
      signupDataRef.current = null;
      setIsSigningUp(false);
      setSignupStatus(message);
    };

    waitForCallbackRef.current = () => {
      if (callbackTimerRef.current !== null) return;
      const attempt = signupAttemptRef.current;
      callbackTimerRef.current = setTimeout(() => {
        if (attempt !== signupAttemptRef.current || !signupActiveRef.current || completionInFlightRef.current) return;
        const missing = signupCodeRef.current ? "account details (FINISH event)" : "authorization code";
        stopWaiting(`Meta did not return the ${missing}. No completion request was sent. Close the Meta window, then run signup again using the existing business portfolio. Create or select a WhatsApp account as needed.`);
      }, CALLBACK_WAIT_MS);
    };

    const completeSignup = async () => {
      const code = signupCodeRef.current;
      const data = signupDataRef.current;

      if (!signupActiveRef.current || !code || !data || completionInFlightRef.current) return;

      clearTimeout(callbackTimerRef.current);
      completionInFlightRef.current = true;
      setIsCompleting(true);
      setSignupStatus("Completing WhatsApp connection");

      try {
        const organizationId = signupOrganizationRef.current;
        if (window.localStorage.getItem("selectedAccountId") !== organizationId) {
          throw new Error("Your selected organization changed. Start WhatsApp signup again.");
        }

        // A signup code may be consumed even when the HTTP response is lost.
        signupCodeRef.current = "";
        setSignupProgress((previous) => ({ ...previous, completion: "Sending" }));
        const result = await postJson("/api/v2/meta/embedded-signup/complete", {
          organization_id: organizationId,
          code,
          configuration_id: WHATSAPP_CONFIG_ID,
          data: {
            phone_number_id: data.phone_number_id,
            waba_id: data.waba_id,
            business_id: data.business_id,
          },
        });
        if (result?.status !== "active" || result?.connection?.status !== "ACTIVE") {
          throw new Error("WhatsApp connection is not active yet. Check the connection status before trying again.");
        }
        setConnectionComplete(true);
        onConnected?.();
        setSignupProgress((previous) => ({ ...previous, completion: "Active" }));
        setSignupStatus("WhatsApp Business connected successfully");
      } catch (error) {
        setSignupProgress((previous) => ({ ...previous, completion: "Failed — check connection status before retrying" }));
        setSignupStatus(error instanceof Error ? error.message : "Could not complete WhatsApp connection");
      } finally {
        signupActiveRef.current = false;
        signupCodeRef.current = "";
        signupDataRef.current = null;
        setIsSigningUp(false);
        setIsCompleting(false);
      }
    };
    completeSignupRef.current = completeSignup;

    const initializeFacebook = () => {
      if (!FACEBOOK_APP_ID) {
        setSignupStatus("Add NEXT_PUBLIC_FACEBOOK_APP_ID to enable signup");
        return;
      }

      window.FB.init({
        appId: FACEBOOK_APP_ID,
        autoLogAppEvents: true,
        xfbml: true,
        version: FACEBOOK_GRAPH_API_VERSION,
      });

      setSdkReady(true);
      if (!signupOrganizationRef.current) setSignupStatus("Ready to connect WhatsApp");
    };

    window.fbAsyncInit = initializeFacebook;
    if (window.FB) initializeFacebook();

    const handleSignupMessage = async (event) => {
      let hostname;
      try {
        hostname = new URL(event.origin).hostname;
      } catch {
        return;
      }

      if (!event.origin.startsWith("https://") ||
          (hostname !== "facebook.com" && !hostname.endsWith(".facebook.com"))) return;
      if (!signupOrganizationRef.current) return;

      let message;
      try {
        message = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      } catch {
        // The SDK also posts messages that are not signup JSON.
        return;
      }

      try {
        if (message?.type !== "WA_EMBEDDED_SIGNUP" || !SIGNUP_EVENTS.has(message.event)) return;

        const attempt = signupAttemptRef.current;
        setSignupProgress((previous) => ({ ...previous, event: message.event, telemetry: "Sending" }));

        // Reporting is independent of completion, including when it fails or stalls.
        void postJson("/api/v2/meta/embedded-signup-events", {
          type: message.type,
          event: message.event,
          organization_id: signupOrganizationRef.current,
          data: {
            ...Object.fromEntries(["business_id", "waba_id", "phone_number_id"].flatMap((key) =>
              typeof message.data?.[key] === "string" && /^\d{1,64}$/.test(message.data[key])
                ? [[key, message.data[key]]] : [],
            )),
          },
        }).then(() => {
          if (attempt === signupAttemptRef.current) {
            setSignupProgress((previous) => ({ ...previous, telemetry: "Accepted" }));
          }
        }).catch((error) => {
          if (attempt === signupAttemptRef.current) {
            setSignupProgress((previous) => ({ ...previous, telemetry: error.message }));
          }
        });

        if (!signupActiveRef.current || completionInFlightRef.current) return;

        if (message.event === "FINISH") {
          const missingAssets = ["business_id", "waba_id", "phone_number_id"].filter(
            (key) => typeof message.data?.[key] !== "string" || !/^\d{1,64}$/.test(message.data[key]),
          );
          if (missingAssets.length) {
            stopWaiting(`Meta did not return all required account details: ${missingAssets.join(", ")}. No completion request was sent. Run signup again using the existing business portfolio, create or select a WhatsApp account, and complete the phone-number step.`);
            return;
          }
          signupDataRef.current = message.data;
          setSignupStatus("Account details received; waiting for Meta authorization");
          waitForCallbackRef.current?.();
          await completeSignup();
        } else if (message.event === "FINISH_ONLY_WABA") {
          stopWaiting("Meta connected a WABA without completing phone-number setup. No completion request was sent. Run signup again, select the existing business and WABA, and finish connecting a phone number.");
        } else if (message.event === "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING") {
          stopWaiting("Meta returned WhatsApp Business app onboarding. This API supports standard Cloud API signup only. No completion request was sent.");
        } else if (message.event === "CANCEL" || message.event === "ERROR") {
          stopWaiting(message.event === "CANCEL"
            ? "WhatsApp signup was cancelled. No completion request was sent. Any business or WABA already created in Meta may still exist."
            : "Meta could not complete signup. No completion request was sent. Run signup again using the existing business portfolio and create or select a WhatsApp account as needed.");
        }
      } catch (error) {
        setSignupStatus(error instanceof Error ? error.message : "Could not process signup event");
      }
    };

    window.addEventListener("message", handleSignupMessage);
    return () => {
      completeSignupRef.current = null;
      waitForCallbackRef.current = null;
      clearTimeout(callbackTimerRef.current);
      callbackTimerRef.current = null;
      signupActiveRef.current = false;
      signupCodeRef.current = "";
      signupDataRef.current = null;
      window.removeEventListener("message", handleSignupMessage);
    };
  }, [onConnected]);

  const launchWhatsAppSignup = () => {
    if (!authorized || signupActiveRef.current || connectionComplete) return;
    if (!window.FB || !sdkReady || !isConfigured) {
      setSignupStatus("Facebook SDK or signup configuration is not ready yet");
      return;
    }

    const organizationId = window.localStorage.getItem("selectedAccountId");
    if (organizationId !== ALLOWED_ORGANIZATION_ID) {
      router.replace("/miniapp");
      return;
    }
    if (!getToken()) return;

    signupCodeRef.current = "";
    signupDataRef.current = null;
    signupOrganizationRef.current = organizationId;
    completionInFlightRef.current = false;
    signupActiveRef.current = true;
    const attempt = ++signupAttemptRef.current;
    clearTimeout(callbackTimerRef.current);
    callbackTimerRef.current = null;
    setSignupProgress(emptyProgress);
    setIsSigningUp(true);
    setSignupStatus("Complete WhatsApp signup in the Meta window");

    try {
      window.FB.login(
        // The Facebook SDK rejects AsyncFunction callbacks.
        (response) => {
          if (attempt !== signupAttemptRef.current || !signupActiveRef.current || completionInFlightRef.current) return;
          if (response?.authResponse?.code) {
            const code = response.authResponse.code;
            signupCodeRef.current = code || "";
            setSignupProgress((previous) => ({ ...previous, authorization: "Received" }));
            setSignupStatus("Authorization received; waiting for Meta account details");
            waitForCallbackRef.current?.();
            void completeSignupRef.current?.();
          } else {
            clearTimeout(callbackTimerRef.current);
            setSignupProgress((previous) => ({ ...previous, authorization: "Not returned" }));
            signupActiveRef.current = false;
            signupCodeRef.current = "";
            signupDataRef.current = null;
            setIsSigningUp(false);
            setSignupStatus("Meta did not return an authorization code. No completion request was sent. Any business or WABA already created in Meta may still exist.");
          }
        },
        {
          config_id: WHATSAPP_CONFIG_ID,
          response_type: "code",
          override_default_response_type: true,
          extras: {
            setup: {},
          },
        },
      );
    } catch {
      signupActiveRef.current = false;
      setIsSigningUp(false);
      setSignupStatus("Could not open Meta signup. Please try again.");
    }
  };

  const endSignupAttempt = () => {
    if (!signupActiveRef.current || completionInFlightRef.current) return;
    ++signupAttemptRef.current;
    clearTimeout(callbackTimerRef.current);
    callbackTimerRef.current = null;
    signupActiveRef.current = false;
    signupCodeRef.current = "";
    signupDataRef.current = null;
    setIsSigningUp(false);
    setSignupStatus("Signup attempt ended. No completion request was sent. Close the Meta window before trying again, then select the existing business portfolio and create or select a WhatsApp account as needed.");
  };

  const readinessItems = [
    { label: "Facebook SDK", ready: sdkReady },
    { label: "App ID", ready: Boolean(FACEBOOK_APP_ID) },
    { label: "Configuration ID", ready: Boolean(WHATSAPP_CONFIG_ID) },
  ];

  if (checkingAccess) return <div className="flex min-h-80 items-center justify-center gap-2 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Checking access</div>;
  if (!authorized) return null;

  return <>
    <Script async defer crossOrigin="anonymous" src="https://connect.facebook.net/en_US/sdk.js" strategy="afterInteractive" />
    <TechProviderHeader title="Embedded Signup" description="Connect your WhatsApp Business Account directly through Meta" />
    <div className="grid items-start gap-6 p-4 sm:p-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]">
      <div className="space-y-6">
        <Card>
          <CardHeader><div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10"><MessageCircle className="h-6 w-6 text-primary" /></div><CardTitle className="text-2xl">Connect WhatsApp Business</CardTitle><CardDescription>Launch Meta embedded signup to connect your business portfolio, WhatsApp account, and phone number.</CardDescription></CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border bg-muted/40 p-4" role="status"><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Connection Status</p><p className="font-medium">{signupStatus}</p></div>
            <div className="grid gap-3 sm:grid-cols-3">{readinessItems.map((item) => <div key={item.label} className="rounded-lg border p-3"><div className="flex items-center justify-between gap-2"><p className="text-sm font-medium">{item.label}</p><CheckCircle2 className={`h-4 w-4 ${item.ready ? "text-green-600" : "text-muted-foreground"}`} /></div><p className="mt-2 text-xs text-muted-foreground">{item.ready ? "Ready" : "Needs configuration"}</p></div>)}</div>
            <div className="flex flex-wrap items-center gap-3 border-t pt-5">
              <Button type="button" onClick={launchWhatsAppSignup} disabled={!sdkReady || !isConfigured || isSigningUp || isCompleting || connectionComplete} className="bg-[#1877f2] text-white hover:bg-[#0f66d4]">{isCompleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}{connectionComplete ? "WhatsApp Connected" : isCompleting ? "Connecting" : "Connect WhatsApp"}</Button>
              {isSigningUp && !isCompleting && <Button type="button" variant="outline" onClick={endSignupAttempt}>End signup attempt</Button>}
            </div>
          </CardContent>
        </Card>
        <Card><CardHeader><CardTitle>Signup Path</CardTitle></CardHeader><CardContent className="space-y-4">{setupSteps.map((step, index) => <div key={step} className="flex items-center gap-3 text-sm"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">{index + 1}</span><span>{step}</span></div>)}</CardContent></Card>
      </div>
      <div className="space-y-6">
        <Card><CardHeader><CardTitle>Connection Progress</CardTitle><CardDescription>Follow Meta signup and the API handoff</CardDescription></CardHeader><CardContent>
          <dl className="space-y-4 text-sm" aria-live="polite">{[["Meta authorization", signupProgress.authorization], ["Meta signup event", signupProgress.event], ["API completion", signupProgress.completion], ["Event reporting", signupProgress.telemetry]].map(([label, value]) => <div key={label} className="border-b pb-3"><dt className="font-medium">{label}</dt><dd className="mt-1 break-words text-muted-foreground">{value}</dd></div>)}</dl>
          <details className="mt-4 text-xs text-muted-foreground"><summary className="cursor-pointer font-medium">Configured API</summary><p className="mt-2 break-all">{API_BASE_URL}/api/v2/meta/embedded-signup/complete</p><p className="mt-2">Completion is sent after Meta returns authorization and the business, WABA, and phone-number IDs. Event reporting does not exchange the code.</p></details>
        </CardContent></Card>
        <Card><CardHeader><div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /><CardTitle>Direct Meta Connection</CardTitle></div></CardHeader><CardContent className="space-y-4 text-sm text-muted-foreground"><p>Meta may create a business portfolio before signup finishes. If signup fails, select that portfolio when retrying and create or select a WhatsApp account as needed.</p><Badge variant="outline"><PlugZap className="mr-1 h-3 w-3" />Embedded signup available</Badge></CardContent></Card>
      </div>
    </div>
  </>;
}

export default function EmbeddedSignupPage() {
  const { markConnected } = useTechProviderWorkspace();
  return <EmbeddedSignup onConnected={markConnected} />;
}
