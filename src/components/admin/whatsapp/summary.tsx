"use client";

import { useEffect, useState } from "react";
import { Building2, CalendarClock, CircleAlert, ShieldCheck } from "lucide-react";
import { getWhatsAppSubscriptions, licenseErrorMessage, type WhatsAppSubscription } from "@/app/api/actions/admin/whatsapp-licenses";
import { AdminMetric, secondaryButtonClass } from "./ui";

export default function WhatsAppSummary() {
  const [subscriptions, setSubscriptions] = useState<WhatsAppSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    async function load() {
      try {
        const rows = await getWhatsAppSubscriptions({}, controller.signal);
        if (!controller.signal.aborted) setSubscriptions(rows);
      } catch (err) {
        if (!controller.signal.aborted) setError(licenseErrorMessage(err, "Unable to load the WhatsApp summary."));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [revision]);

  const value = (count: number) => loading ? "..." : error ? "—" : count.toLocaleString("en-KE");

  return <section className="mb-6" aria-label="WhatsApp overview" aria-busy={loading}>
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-sm font-semibold text-gray-700">Overview</h2>
      <button type="button" className={secondaryButtonClass} disabled={loading} onClick={() => setRevision((current) => current + 1)}>{loading ? "Loading Summary..." : "Refresh Summary"}</button>
    </div>
    {error && <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error} Use Refresh Summary to try again.</p>}
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-live="polite">
      <AdminMetric title="WhatsApp Organizations" value={value(subscriptions.length)} subtitle="Organizations using WhatsApp" icon={<Building2 size={22} />} />
      <AdminMetric title="Active Licenses" value={value(subscriptions.filter((row) => row.license?.status === "ACTIVE").length)} subtitle="Licenses currently active" icon={<ShieldCheck size={22} />} />
      <AdminMetric title="Expiring Licenses" value={value(subscriptions.filter((row) => row.license?.status === "EXPIRING").length)} subtitle="Licenses approaching renewal" icon={<CalendarClock size={22} />} />
      <AdminMetric title="Expired Licenses" value={value(subscriptions.filter((row) => row.license?.status === "EXPIRED").length)} subtitle="Licenses needing renewal" icon={<CircleAlert size={22} />} />
    </div>
  </section>;
}
