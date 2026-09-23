"use client";

import Script from "next/script";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Home,
  KeyRound,
  Loader2,
  MessageCircle,
  PhoneCall,
  PlugZap,
  QrCode,
  Settings,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

const ALLOWED_ORGANIZATION_ID = "58045135-f272-4879-be0f-2559d836fdba";
const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || "1768412394357109";
const FACEBOOK_GRAPH_API_VERSION = process.env.NEXT_PUBLIC_FACEBOOK_GRAPH_API_VERSION || "v26.0";
const WHATSAPP_CONFIG_ID =
  process.env.NEXT_PUBLIC_WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID || "1085280167192120";
const API_BASE_URL =
  process.env.NEXT_PUBLIC_FLOWBOT_API_BASE_URL ||
  "https://flowbot-1048592730476.europe-west4.run.app";

const sidebarItems = [
  { label: "Overview", icon: Home, active: true },
  { label: "Embedded Signup", icon: PlugZap, active: false },
  { label: "Numbers", icon: PhoneCall, active: false },
  { label: "Templates", icon: MessageCircle, active: false },
  { label: "Settings", icon: Settings, active: false },
];

const setupSteps = [
  "Confirm Meta Business access",
  "Connect or create a WhatsApp Business Account",
  "Add a phone number for messaging",
  "Securely complete the connection",
];

export default function TechProviderPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [sdkReady, setSdkReady] = useState(false);
  const [signupStatus, setSignupStatus] = useState("Waiting for WhatsApp connection");
  const [pin, setPin] = useState("");
  const [isCompleting, setIsCompleting] = useState(false);
  const [connectionComplete, setConnectionComplete] = useState(false);
  const signupCodeRef = useRef("");
  const signupDataRef = useRef(null);
  const pinRef = useRef("");
  const completionInFlightRef = useRef(false);
  const completeSignupRef = useRef(null);
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
      const response = await fetch(`${API_BASE_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(errorBody || `Request failed with status ${response.status}`);
      }

      const contentType = response.headers.get("content-type") || "";
      return contentType.includes("application/json") ? response.json() : null;
    };

    const completeSignup = async () => {
      const code = signupCodeRef.current;
      const data = signupDataRef.current;
      const currentPin = pinRef.current;

      if (!code || !data || !/^\d{6}$/.test(currentPin) || completionInFlightRef.current) return;

      completionInFlightRef.current = true;
      setIsCompleting(true);
      setSignupStatus("Completing WhatsApp connection");

      try {
        await postJson("/api/v1/meta/embedded-signup/complete", {
          organization_id: ALLOWED_ORGANIZATION_ID,
          code,
          pin: currentPin,
          configuration_id: WHATSAPP_CONFIG_ID,
          data: {
            phone_number_id: data.phone_number_id,
            waba_id: data.waba_id,
            business_id: data.business_id,
          },
        });
        setConnectionComplete(true);
        setSignupStatus("WhatsApp Business connected successfully");
        signupCodeRef.current = "";
      } catch (error) {
        completionInFlightRef.current = false;
        setSignupStatus(error instanceof Error ? error.message : "Could not complete WhatsApp connection");
      } finally {
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
      setSignupStatus("Ready to connect WhatsApp");
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

      if (hostname !== "facebook.com" && !hostname.endsWith(".facebook.com")) return;

      try {
        const message = typeof event.data === "string" ? JSON.parse(event.data) : event.data;

        if (message?.type !== "WA_EMBEDDED_SIGNUP") return;

        await postJson("/api/v1/meta/embedded-signup-events", message);

        if (message.event === "FINISH") {
          signupDataRef.current = message.data;
          setSignupStatus("Signup details received");
          await completeSignup();
        } else if (message.event === "CANCEL") {
          setSignupStatus("WhatsApp signup was cancelled");
        } else {
          setSignupStatus(`Embedded signup event: ${message.event || "received"}`);
        }
      } catch (error) {
        setSignupStatus(error instanceof Error ? error.message : "Could not process signup event");
      }
    };

    window.addEventListener("message", handleSignupMessage);
    return () => {
      completeSignupRef.current = null;
      window.removeEventListener("message", handleSignupMessage);
    };
  }, []);

  const launchWhatsAppSignup = () => {
    if (!/^\d{6}$/.test(pin)) {
      setSignupStatus("Enter a valid six-digit PIN before connecting");
      return;
    }

    if (!window.FB || !sdkReady || !isConfigured) {
      setSignupStatus("Facebook SDK or signup configuration is not ready yet");
      return;
    }

    window.FB.login(
      async (response) => {
        if (response.authResponse) {
          const code = response.authResponse.code;
          signupCodeRef.current = code || "";
          setSignupStatus("Authorization received; completing connection");
          await completeSignupRef.current?.();
        } else {
          setSignupStatus("Signup was cancelled or did not return authorization");
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
  };

  const handlePinChange = (event) => {
    const nextPin = event.target.value.replace(/\D/g, "").slice(0, 6);
    pinRef.current = nextPin;
    setPin(nextPin);
  };

  const readinessItems = useMemo(
    () => [
      { label: "Facebook SDK", ready: sdkReady },
      { label: "App ID", ready: Boolean(FACEBOOK_APP_ID) },
      { label: "Configuration ID", ready: Boolean(WHATSAPP_CONFIG_ID) },
    ],
    [sdkReady],
  );

  if (checkingAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5fbf7] text-[#0b3d2e]">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#25D366]" />
        Checking access
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <>
      <Script async defer crossOrigin="anonymous" src="https://connect.facebook.net/en_US/sdk.js" strategy="afterInteractive" />

      <div className="min-h-screen bg-[#f5fbf7] text-[#13382c]">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-[#d9eee3] bg-white lg:block">
          <div className="flex h-full flex-col">
            <div className="border-b border-[#d9eee3] px-6 py-6">
              <button
                type="button"
                onClick={() => router.push("/miniapp")}
                className="mb-6 inline-flex h-9 w-9 items-center justify-center rounded-full text-[#61756d] transition hover:bg-[#e7f8ef] hover:text-[#0b7a43]"
                aria-label="Back to services"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#25D366] text-white shadow-sm shadow-[#25D366]/30">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.14em] text-[#0b7a43]">WhatsApp</div>
                  <h1 className="text-xl font-bold text-[#12382c]">Tech Provider</h1>
                </div>
              </div>
            </div>

            <nav className="flex-1 space-y-1 px-4 py-5">
              {sidebarItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition ${
                    item.active
                      ? "bg-[#0b7a43] text-white shadow-sm"
                      : "text-[#587067] hover:bg-[#e7f8ef] hover:text-[#0b7a43]"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="m-4 rounded-lg border border-[#ccebd8] bg-[#f4fff8] p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#0b7a43]">
                <ShieldCheck className="h-4 w-4" />
                Restricted Access
              </div>
              <p className="text-xs leading-5 text-[#61756d]">
                Visible only for the enabled organization.
              </p>
            </div>
          </div>
        </aside>

        <main className="lg:pl-72">
          <header className="border-b border-[#d9eee3] bg-white/85 px-5 py-4 backdrop-blur lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0b7a43]">Embedded Signup</p>
                <h2 className="mt-1 text-2xl font-bold text-[#12382c]">Connect WhatsApp Business</h2>
              </div>
              <button
                type="button"
                onClick={() => router.push("/miniapp")}
                className="inline-flex items-center gap-2 rounded-lg border border-[#d9eee3] bg-white px-3 py-2 text-sm font-semibold text-[#375348] transition hover:border-[#25D366] hover:text-[#0b7a43] lg:hidden"
              >
                <ArrowLeft className="h-4 w-4" />
                Services
              </button>
            </div>
          </header>

          <section className="grid gap-6 px-5 py-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)] lg:px-8">
            <div className="rounded-lg border border-[#d9eee3] bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                <div className="max-w-2xl">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#e7f8ef] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#0b7a43]">
                    <Activity className="h-4 w-4" />
                    Provider onboarding
                  </div>
                  <h3 className="text-3xl font-bold leading-tight text-[#12382c]">
                    Launch Meta embedded signup from Peak Mobile.
                  </h3>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-[#61756d]">
                    Start the WhatsApp Business onboarding flow, capture the returned authorization code, and prepare the account for messaging.
                  </p>
                </div>

                <div className="flex min-h-40 w-full max-w-sm flex-col justify-between rounded-lg bg-[#0b3d2e] p-5 text-white">
                  <div className="flex items-center justify-between">
                    <MessageCircle className="h-8 w-8 text-[#25D366]" />
                    <QrCode className="h-6 w-6 text-white/60" />
                  </div>
                  <div>
                    <p className="text-sm text-white/70">Status</p>
                    <p className="mt-1 text-lg font-semibold">{signupStatus}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {readinessItems.map((item) => (
                  <div key={item.label} className="rounded-lg border border-[#d9eee3] bg-[#fbfffd] p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#375348]">{item.label}</span>
                      <CheckCircle2 className={`h-5 w-5 ${item.ready ? "text-[#25D366]" : "text-[#b8c8c0]"}`} />
                    </div>
                    <p className="mt-2 text-xs text-[#61756d]">{item.ready ? "Ready" : "Needs configuration"}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 border-t border-[#e4f1ea] pt-6">
                <label htmlFor="whatsapp-pin" className="text-sm font-semibold text-[#375348]">
                  Registration PIN
                </label>
                <div className="mt-2 flex max-w-md items-center rounded-lg border border-[#c9dfd3] bg-white px-3 focus-within:border-[#25D366] focus-within:ring-2 focus-within:ring-[#25D366]/20">
                  <KeyRound className="h-5 w-5 text-[#0b7a43]" />
                  <input
                    id="whatsapp-pin"
                    type="password"
                    inputMode="numeric"
                    autoComplete="off"
                    value={pin}
                    onChange={handlePinChange}
                    disabled={isCompleting || connectionComplete}
                    placeholder="Six-digit PIN"
                    aria-describedby="whatsapp-pin-hint"
                    className="h-11 min-w-0 flex-1 bg-transparent px-3 text-sm font-semibold tracking-widest text-[#12382c] outline-none placeholder:font-normal placeholder:tracking-normal placeholder:text-[#91a69d]"
                  />
                  <span className="text-xs font-semibold text-[#789087]">{pin.length}/6</span>
                </div>
                <p id="whatsapp-pin-hint" className="mt-2 text-xs text-[#61756d]">
                  Used to register the phone number after signup.
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={launchWhatsAppSignup}
                    disabled={!sdkReady || !isConfigured || isCompleting || connectionComplete}
                    className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#1877f2] px-5 text-sm font-bold text-white transition hover:bg-[#0f66d4] disabled:cursor-not-allowed disabled:bg-[#a9bfdc]"
                  >
                    {isCompleting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Smartphone className="h-5 w-5" />}
                    {connectionComplete ? "WhatsApp Connected" : isCompleting ? "Connecting" : "Connect WhatsApp"}
                  </button>
                  <span className="text-sm text-[#61756d]">
                    Uses Meta embedded signup with code response type.
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-lg border border-[#d9eee3] bg-white p-5 shadow-sm">
                <h3 className="text-lg font-bold text-[#12382c]">Signup Path</h3>
                <div className="mt-4 space-y-3">
                  {setupSteps.map((step, index) => (
                    <div key={step} className="flex items-start gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e7f8ef] text-xs font-bold text-[#0b7a43]">
                        {index + 1}
                      </div>
                      <div className="flex flex-1 items-center justify-between gap-3 border-b border-[#eef6f1] pb-3 text-sm font-medium text-[#375348]">
                        <span>{step}</span>
                        <ChevronRight className="h-4 w-4 text-[#9bb4aa]" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-[#d9eee3] bg-white p-5 shadow-sm">
                <h3 className="text-lg font-bold text-[#12382c]">Configuration</h3>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#61756d]">Graph API</span>
                    <span className="font-semibold text-[#12382c]">{FACEBOOK_GRAPH_API_VERSION}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#61756d]">App ID</span>
                    <span className="font-semibold text-[#12382c]">{FACEBOOK_APP_ID ? "Configured" : "Missing"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#61756d]">Config ID</span>
                    <span className="font-semibold text-[#12382c]">{WHATSAPP_CONFIG_ID ? "Configured" : "Missing"}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
