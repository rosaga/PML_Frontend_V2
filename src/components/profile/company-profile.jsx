"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Building2, Mail, UserRound, Files, ExternalLink, ArrowLeft, RefreshCw } from "lucide-react";
import { GetAccounts } from "@/app/api/actions/accounts/accounts";
import { getToken } from "@/utils/auth";
import { getUserInfo } from "@/utils/decodeToken";
import { POLICIES } from "@/lib/policies";
import styles from "./company-profile.module.css";

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
        const account = response.data.find((item) => String(item.id) === accountId);
        if (!account) throw new Error("This company account is no longer available. Please select another account.");
        if (!cancelled) setCompany(account);
      } catch (err) {
        if (!cancelled) setError(err.message || "Unable to load company details. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadCompany();
    return () => { cancelled = true; };
  }, [router, attempt]);

  const attributes = company?.attributes || {};
  const details = [
    ["Company name", displayValue(company?.name)],
    ["Account ID", displayValue(company?.id)],
    ["Company email", displayValue(attributes.emails)],
    ["Description", displayValue(attributes.description)],
  ];

  return (
    <div className={`${styles.page} ${withinDashboard ? "" : styles.withSidebar}`}>
      <div className={styles.container}>
        <Link href={backHref} className={styles.back}><ArrowLeft size={16} /> {product ? "Back to dashboard" : "Back to products"}</Link>
        <header className={styles.heading}>
          <h1>Company profile</h1>
          <p>Your company details and documents, in one place.</p>
        </header>

        <section className={styles.companyBanner} aria-label="Current company">
          <div className={styles.companyIcon}><Building2 size={27} strokeWidth={1.6} /></div>
          <div>
            <span className={styles.eyebrow}>YOUR COMPANY</span>
            <h2>{loading ? "Loading company..." : company?.name || "Company account"}</h2>
          </div>
          <Link href="/user-orgs" className={styles.switchAccount}>Switch account <ArrowLeft size={15} className={styles.switchArrow} /></Link>
        </section>

        <div className={styles.overview}>
          <section className={styles.card} aria-labelledby="company-details-title" aria-busy={loading}>
            <header className={styles.cardHeading}><Building2 size={19} /><h2 id="company-details-title">Company details</h2></header>
            {loading ? <p className={styles.notice} role="status">Loading company details...</p> : error ? (
              <div className={styles.notice} role="alert">
                <p>{error}</p>
                <button className={styles.retry} onClick={() => setAttempt((value) => value + 1)}><RefreshCw size={15} /> Try again</button>
                <Link href="/user-orgs" className={styles.retry}>Select account</Link>
              </div>
            ) : (
              <dl className={styles.details}>
                {details.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || <span className={styles.empty}>Not provided</span>}</dd></div>)}
              </dl>
            )}
          </section>
          <section className={styles.card} aria-labelledby="your-profile-title">
            <header className={styles.cardHeading}><UserRound size={19} /><h2 id="your-profile-title">Your profile</h2></header>
            <div className={styles.userInfo}>
              <div className={styles.avatar} aria-hidden="true">{user?.name?.trim().charAt(0).toUpperCase() || <UserRound size={24} />}</div>
              <h3>{user?.name || "Account user"}</h3>
              <p><Mail size={15} /> {user?.email || "Not provided"}</p>
            </div>
          </section>
        </div>

        <section className={styles.documents} aria-labelledby="documents-title">
          <header className={styles.documentsHeading}>
            <div><h2 id="documents-title"><Files size={21} /> Documents</h2><p>Access the terms and policies for your Peak Mobile account.</p></div>
            <span className={styles.documentCount}>{POLICIES.length} documents</span>
          </header>
          <div className={styles.documentGrid}>
            {POLICIES.map((document) => {
              const Icon = document.icon;
              return (
                <article key={document.id} className={styles.documentCard}>
                  <div className={styles.documentTop}><span className={styles.documentIcon}><Icon size={23} strokeWidth={1.6} /></span><span className={styles.fileType}>PDF</span></div>
                  <h3>{document.title}</h3>
                  <p>{document.description}</p>
                  <a href={document.href} target="_blank" rel="noopener noreferrer" aria-label={`Open ${document.title} in a new tab`}>Read document <ExternalLink size={15} /></a>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
