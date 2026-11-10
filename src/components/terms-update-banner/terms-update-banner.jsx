"use client";

import { useEffect, useState } from "react";
import { FileText, X } from "lucide-react";
import { POLICY_EFFECTIVE_DATE, PRIVACY_DOCUMENT_HREF, TERMS_PAGE_HREF, TERMS_UPDATE_VERSION } from "@/lib/policies";
import styles from "./terms-update-banner.module.css";

const DISMISSAL_KEY = "peak-terms-update-dismissed";

export default function TermsUpdateBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(localStorage.getItem(DISMISSAL_KEY) !== TERMS_UPDATE_VERSION);
    } catch {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISSAL_KEY, TERMS_UPDATE_VERSION);
    } catch {
      // The notice can still be dismissed when browser storage is unavailable.
    }
  };

  if (!visible) return null;

  return (
    <section className={styles.banner} aria-label="Terms and privacy policy update">
      <FileText className={styles.icon} size={20} aria-hidden="true" />
      <p className={styles.message}>
        We&apos;ve updated our{" "}
        <a className={styles.link} href={TERMS_PAGE_HREF} target="_blank" rel="noopener noreferrer">
          Terms and Conditions<span className="sr-only"> (opens in a new tab)</span>
        </a>
        {" and "}
        <a className={styles.link} href={PRIVACY_DOCUMENT_HREF} target="_blank" rel="noopener noreferrer">
          Privacy Policy<span className="sr-only"> (opens in a new tab)</span>
        </a>
        , effective {POLICY_EFFECTIVE_DATE}.
      </p>
      <button
        type="button"
        className={styles.close}
        onClick={dismiss}
        aria-label="Dismiss policy update notice"
      >
        <X size={18} aria-hidden="true" />
      </button>
    </section>
  );
}
