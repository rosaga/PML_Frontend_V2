"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Building2, Mail, UserRound, ExternalLink, ArrowLeft } from "lucide-react";
import CircularProgress from "@mui/material/CircularProgress";
import RefreshIcon from "@mui/icons-material/Refresh";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import PeakButton from "@/components/button/button";
import { GetAccounts, GetOrganization, UpdateOrganizationPhone } from "@/app/api/actions/accounts/accounts";
import { getToken } from "@/utils/auth";
import { getUserInfo } from "@/utils/decodeToken";
import { POLICIES } from "@/lib/policies";
import { isValidPhoneNumber, PHONE_NUMBER_ERROR } from "@/utils/phone";
import ProfileResources from "./profile-resources";

function displayValue(value) {
  if (Array.isArray(value)) return value.filter((item) => typeof item === "string").join(", ");
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

export default function CompanyProfile({ withinDashboard = false }) {
  const router = useRouter();
  const pathname = usePathname();
  const [company, setCompany] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [phoneSaved, setPhoneSaved] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  const product = pathname.split("/")[2];
  const backHref = product ? `/apps/${product}/dashboard` : "/miniapp";

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/signin");
      return;
    }
    setUser(getUserInfo(token));
    const accountId = localStorage.getItem("selectedAccountId");
    if (!accountId) {
      setLoading(false);
      setError("Select a company account to view its profile.");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");
    async function loadCompany() {
      try {
        const response = await GetAccounts();
        if (response.errors || !Array.isArray(response.data)) throw new Error("Unable to load company details. Please try again.");
        const account = response.data.find((item) => String(item.id) === accountId || item.external_id === accountId);
        if (!account) throw new Error("This company account is no longer available. Please select another account.");
        if (!account.external_id) throw new Error("The organization external ID is unavailable. Please select another account.");
        const organizationResponse = await GetOrganization(account.external_id);
        const organization = organizationResponse.data?.data ?? organizationResponse.data;
        if (!cancelled) {
          const phone = organization.phone_number || "";
          setCompany({ ...account, phone_number: phone });
          setPhoneNumber(phone);
          setPhoneError("");
          setPhoneSaved(false);
        }
      } catch (err) {
        const message = err.response?.data?.error || err.response?.data?.message || err.message;
        if (!cancelled) setError((typeof message === "string" && message) || "Unable to load company details. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadCompany();
    return () => { cancelled = true; };
  }, [router, attempt]);

  const handleSavePhone = async (event) => {
    event.preventDefault();
    if (savingPhone) return;
    setPhoneSaved(false);
    setPhoneError("");
    if (!isValidPhoneNumber(phoneNumber)) {
      setPhoneError(PHONE_NUMBER_ERROR);
      return;
    }
    if (!getToken()) return;

    const phone = phoneNumber.trim();
    setSavingPhone(true);
    try {
      const response = await UpdateOrganizationPhone(company.external_id, phone);
      const organization = response.data?.data ?? response.data;
      const savedPhone = organization?.phone_number ?? phone;
      setCompany((current) => ({ ...current, phone_number: savedPhone }));
      setPhoneNumber(savedPhone);
      setPhoneSaved(true);
    } catch (err) {
      const message = err.response?.data?.error || err.response?.data?.message || err.message;
      setPhoneError((typeof message === "string" && message) || "Unable to update the phone number. Please try again.");
    } finally {
      setSavingPhone(false);
    }
  };

  const attributes = company?.attributes || {};
  const details = [
    ["Company name", displayValue(company?.name)],
    ["Account ID", displayValue(company?.id)],
    ["Company email", displayValue(attributes.emails)],
    ["Company phone", displayValue(company?.phone_number)],
    ["Description", displayValue(attributes.description)],
  ];

  return (
    <div className={`min-h-screen p-4 text-gray-900 ${withinDashboard ? "" : "lg:ml-64"}`}>
      <div className="min-w-0 space-y-6 p-4">
        <Link href={backHref} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#E88A17] focus-visible:outline-[#E88A17]">
          <ArrowLeft size={16} /> {product ? "Back to dashboard" : "Back to products"}
        </Link>
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-medium">Company Profile</h1>
            <p className="mt-1 text-sm text-gray-500">Your company details, groups, sender names, and documents.</p>
          </div>
          <PeakButton
            buttonText="Switch Account"
            icon={SwapHorizIcon}
            className="h-10 w-fit rounded-xl bg-[#090A29] px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gray-800 focus-visible:outline-[#E88A17]"
            onClick={() => router.push("/user-orgs")}
          />
        </header>

        <div className="grid gap-4 xl:grid-cols-3">
          <section className="min-w-0 rounded-lg border-[1.5px] border-gray-200 bg-white p-6 shadow-sm xl:col-span-2" aria-labelledby="company-details-title" aria-busy={loading}>
            <header className="mb-6 flex items-center gap-2">
              <Building2 size={20} className="text-[#E88A17]" />
              <h2 id="company-details-title" className="text-lg font-medium">Company Details</h2>
            </header>
            {loading ? (
              <div className="flex min-h-[120px] items-center justify-center" role="status">
                <CircularProgress size={30} style={{ color: "#E88A17" }} />
                <span className="sr-only">Loading company details...</span>
              </div>
            ) : error ? (
              <div className="text-sm text-red-600" role="alert">
                <p>{error}</p>
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <PeakButton buttonText="Try Again" icon={RefreshIcon} className="h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus-visible:outline-[#E88A17]" onClick={() => setAttempt((value) => value + 1)} />
                  <Link href="/user-orgs" className="text-[#E88A17] hover:underline">Select account</Link>
                </div>
              </div>
            ) : (
              <>
                <dl className="grid gap-6 sm:grid-cols-2">
                  {details.map(([label, value]) => (
                    <div key={label} className="min-w-0">
                      <dt className="text-sm text-gray-500">{label}</dt>
                      <dd className="mt-2 whitespace-pre-line text-sm leading-6 break-words">{value || <span className="text-gray-400">Not provided</span>}</dd>
                    </div>
                  ))}
                </dl>
                <form onSubmit={handleSavePhone} noValidate className="mt-6 space-y-3 border-t border-gray-200 pt-6">
                  <label htmlFor="company-phone-number" className="block text-sm font-medium">Phone number (optional)</label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      id="company-phone-number"
                      name="phone_number"
                      type="tel"
                      autoComplete="tel"
                      placeholder="+254712345678"
                      value={phoneNumber}
                      disabled={savingPhone}
                      onChange={(event) => {
                        setPhoneNumber(event.target.value);
                        setPhoneError("");
                        setPhoneSaved(false);
                      }}
                      aria-invalid={!!phoneError}
                      aria-describedby={`company-phone-help${phoneError ? " company-phone-error" : ""}`}
                      className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white p-2.5 text-sm focus:border-[#E88A17] focus:outline-none focus:ring-1 focus:ring-[#E88A17] disabled:bg-gray-100"
                    />
                    <button type="submit" disabled={savingPhone || phoneNumber.trim() === company?.phone_number} className="h-10 rounded-xl bg-[#090A29] px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gray-800 focus-visible:outline-[#E88A17] disabled:cursor-not-allowed disabled:opacity-60">
                      {savingPhone ? "Saving..." : "Save phone number"}
                    </button>
                  </div>
                  <p id="company-phone-help" className="text-xs text-gray-500">Use E.164 format, e.g. +254712345678. Leave blank to clear.</p>
                  {phoneError && <p id="company-phone-error" className="text-sm text-red-600" role="alert">{phoneError}</p>}
                  {phoneSaved && <p className="text-sm text-green-700" role="status">Phone number saved.</p>}
                </form>
              </>
            )}
          </section>
          <section className="min-w-0 rounded-lg border-[1.5px] border-gray-200 bg-white p-6 shadow-sm" aria-labelledby="your-profile-title">
            <header className="mb-6 flex items-center gap-2">
              <UserRound size={20} className="text-[#E88A17]" />
              <h2 id="your-profile-title" className="text-lg font-medium">Your Profile</h2>
            </header>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-lg font-medium text-gray-600" aria-hidden="true">
              {user?.name?.trim().charAt(0).toUpperCase() || <UserRound size={24} />}
            </div>
            <h3 className="mt-4 text-sm font-medium break-words">{user?.name || "Account user"}</h3>
            <p className="mt-2 flex items-start gap-2 text-sm text-gray-500"><Mail size={16} className="mt-0.5 shrink-0" /><span className="min-w-0 break-words">{user?.email || "Not provided"}</span></p>
          </section>
        </div>

        {company && !loading && !error && <ProfileResources key={company.id} accountId={company.id} />}

        <section aria-labelledby="documents-title">
          <header className="mb-4">
            <h2 id="documents-title" className="text-lg font-medium">Documents</h2>
            <p className="mt-1 text-sm text-gray-500">Access the terms and policies for your Peak Mobile account.</p>
          </header>
          <div className="grid gap-4 md:grid-cols-2">
            {POLICIES.map((document) => {
              const Icon = document.icon;
              return (
                <article key={document.id} className="flex min-w-0 flex-col rounded-lg border-[1.5px] border-gray-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <Icon size={24} className="text-[#E88A17]" />
                    <span className="rounded bg-[#F1F2F3] px-2 py-1 text-xs text-gray-500">PDF</span>
                  </div>
                  <h3 className="font-medium">{document.title}</h3>
                  <p className="mt-2 mb-4 flex-1 text-sm leading-6 text-gray-500">{document.description}</p>
                  <a href={document.href} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-xl bg-[#090A29] px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gray-800 focus-visible:outline-[#E88A17]" aria-label={`Open ${document.title} in a new tab`}>Read Document <ExternalLink size={15} /></a>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
