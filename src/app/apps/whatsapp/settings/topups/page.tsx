"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useConfig } from "@/lib/whatsapp/config-context";
import { DashboardLayout } from "@/components/whatsapp/dashboard/layout";
import { Header } from "@/components/whatsapp/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/whatsapp/ui/card";
import { Button } from "@/components/whatsapp/ui/button";
import { Input } from "@/components/whatsapp/ui/input";
import { Label } from "@/components/whatsapp/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/whatsapp/ui/dialog";
import {
  Wallet,
  TrendingUp,
  CheckCircle2,
  KeyRound,
  MessageCircle,
  Plus,
  Loader2,
  Gift,
  Receipt,
  RefreshCw,
  AlertTriangle,
  Clock,
  HelpCircle,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/whatsapp/ui/table";
import { Badge } from "@/components/whatsapp/ui/badge";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const API_BASE = "https://peakdata-jja4kcvvdq-ez.a.run.app";

// ---------------------------------------------------------------------------
// Types (match the Go JSON in services/whatsapp_billing.go)
// ---------------------------------------------------------------------------

interface TopUp {
  id: number;
  amount: number;
  status: string;
  transaction_id: string;
  MSISDN: string;
  created_at: string;
}

interface CostLine {
  source: string;
  billing_category: string;
  messages: number;
  billable: number;
  free: number;
  cost: number;
}

interface SourceTotal {
  source: string;
  messages: number;
  billable: number;
  free: number;
  cost: number;
}

interface CampaignCost {
  campaign_id: number;
  campaign_name: string;
  source: string;
  messages: number;
  billable: number;
  free: number;
  cost: number;
}

interface BillingSummary {
  from: string;
  to: string;
  currency: string;
  total_cost: number;
  total_messages: number;
  billable_messages: number;
  free_messages: number;
  unpriced_messages: number;
  by_source: SourceTotal[];
  by_campaign: CampaignCost[];
  lines: CostLine[];
}

interface FreeTierSource {
  source: string;
  free_used: number;
  billed: number;
  billed_cost: number;
}

interface FreeTierUsage {
  month: string;
  allowance: number;
  free_used: number;
  free_remaining: number;
  billed: number;
  billed_cost: number;
  currency: string;
  by_source: FreeTierSource[];
}

type Interval = "day" | "week" | "month";

interface UsagePoint {
  period: string;
  messages: number;
  billable: number;
  free: number;
  cost: number;
  campaign_cost: number;
  bulk_cost: number;
  single_cost: number;
  flow_cost: number;
}

interface UsageSeries {
  from: string;
  to: string;
  interval: Interval;
  currency: string;
  total_cost: number;
  points: UsagePoint[];
}

type PeriodKind = "this_month" | "last_month" | "last_30" | "custom";

// ---------------------------------------------------------------------------
// Display constants
// ---------------------------------------------------------------------------

const CATEGORIES = [
  {
    key: "marketing",
    name: "Marketing",
    icon: TrendingUp,
    color: "text-amber-600",
    card: "bg-amber-50 border-amber-200",
  },
  {
    key: "utility",
    name: "Utility",
    icon: CheckCircle2,
    color: "text-green-600",
    card: "bg-green-50 border-green-200",
  },
  {
    key: "authentication",
    name: "Authentication",
    icon: KeyRound,
    color: "text-red-600",
    card: "bg-red-50 border-red-200",
  },
  {
    key: "service",
    name: "Service (free-form)",
    icon: MessageCircle,
    color: "text-sky-600",
    card: "bg-sky-50 border-sky-200",
  },
] as const;

// Meta category names that belong on an existing card. Pinbot sends marketing
// templates through Meta's Marketing Messages Lite API, so they arrive as
// "marketing_lite" (charged at the normal marketing rate).
const CATEGORY_ALIASES: Record<string, string> = {
  marketing_lite: "marketing",
  authentication_international: "authentication",
  "authentication-international": "authentication",
};

// Shown only when Meta sends a category none of the cards above know about,
// so charged messages are never hidden.
const OTHER_CATEGORY = {
  key: "other",
  name: "Other categories",
  icon: HelpCircle,
  color: "text-gray-500",
  card: "bg-gray-50 border-gray-200",
};

// Channels in chart/stack order. `usageKey` is the per-channel field in a usage point.
const CHANNELS = [
  { key: "CAMPAIGN", name: "Campaigns", bar: "bg-blue-500", usageKey: "campaign_cost" },
  { key: "BULK", name: "Bulk", bar: "bg-violet-500", usageKey: "bulk_cost" },
  { key: "SINGLE", name: "Single", bar: "bg-emerald-500", usageKey: "single_cost" },
  { key: "FLOW", name: "Flows", bar: "bg-amber-500", usageKey: "flow_cost" },
] as const;

function channelName(source: string): string {
  return CHANNELS.find((c) => c.key === source)?.name ?? "Other";
}

function channelBar(source: string): string {
  return CHANNELS.find((c) => c.key === source)?.bar ?? "bg-gray-400";
}

/** Formats a USD amount. Costs per message are fractions of a cent, so small amounts get 4 decimals. */
function money(usd: number): string {
  const digits = Math.abs(usd) > 0 && Math.abs(usd) < 1 ? 4 : 2;
  return `$${usd.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

// ---------------------------------------------------------------------------
// Date helpers. All dates are YYYY-MM-DD in Nairobi time, like the backend.
// ---------------------------------------------------------------------------

function todayInNairobi(): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Nairobi" }).format(new Date());
}

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

function periodRange(kind: PeriodKind, customFrom: string, customTo: string): { from: string; to: string } {
  const today = todayInNairobi();
  const monthStart = `${today.slice(0, 7)}-01`;
  switch (kind) {
    case "last_month": {
      const lastMonthEnd = addDays(monthStart, -1);
      return { from: `${lastMonthEnd.slice(0, 7)}-01`, to: lastMonthEnd };
    }
    case "last_30":
      return { from: addDays(today, -29), to: today };
    case "custom":
      return { from: customFrom, to: customTo };
    default:
      return { from: monthStart, to: today };
  }
}

// Parses YYYY-MM-DD without shifting it through the browser's time zone.
function localDate(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function formatPeriod(period: string, interval: Interval): string {
  const d = localDate(period);
  if (interval === "month") return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
  const label = d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  return interval === "week" ? `w/c ${label}` : label;
}

function formatMonth(month: string): string {
  return localDate(`${month}-01`).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function formatRange(from: string, to: string): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
  return `${localDate(from).toLocaleDateString(undefined, opts)} – ${localDate(to).toLocaleDateString(undefined, opts)}`;
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function getJSON<T>(url: string, token: string | undefined, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal,
  });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      message = body.error || body.message || message;
    } catch {
      // not JSON
    }
    throw new ApiError(response.status, message);
  }
  return response.json();
}

function describeError(err: unknown): string {
  if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
    return `Not authorised to view costs (${err.status}). Check that this organization's WhatsApp API key is correct.`;
  }
  return err instanceof Error ? err.message : "Something went wrong";
}

const isAbort = (err: unknown) => err instanceof DOMException && err.name === "AbortError";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TopUpsPage() {
  const { organizationExternalId, config, displayPhoneNumber, isLoading: contextLoading } = useConfig();

  // The /api/v1 billing endpoints check this against the organization's saved
  // WhatsApp API key (authorizeWhatsAppBilling in controllers/whatsapp_billing.go).
  const apiToken: string | undefined = config.apiKey;

  // Wallet + top ups (unchanged behaviour)
  const [balance, setBalance] = useState<string | null>(null);
  const [topups, setTopups] = useState<TopUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [msisdn, setMsisdn] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Period
  const [periodKind, setPeriodKind] = useState<PeriodKind>("this_month");
  const [customFrom, setCustomFrom] = useState(() => `${todayInNairobi().slice(0, 7)}-01`);
  const [customTo, setCustomTo] = useState(() => todayInNairobi());
  // Chart interval: picked from the period length unless the user chose one for this period.
  const [intervalChoice, setIntervalChoice] = useState<{ range: string; value: Interval } | null>(null);
  const { from, to } = useMemo(() => periodRange(periodKind, customFrom, customTo), [periodKind, customFrom, customTo]);
  const rangeValid = Boolean(from && to && from <= to);
  const freeTierMonth = to.slice(0, 7);
  const rangeKey = `${from}|${to}`;
  const rangeDays = rangeValid ? daysBetween(from, to) : 0;
  // Days for up to ~3 months, weeks up to a year, months beyond that.
  const autoInterval: Interval = rangeDays > 366 ? "month" : rangeDays > 92 ? "week" : "day";
  const interval: Interval = intervalChoice?.range === rangeKey ? intervalChoice.value : autoInterval;

  // Billing data
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [freeTier, setFreeTier] = useState<FreeTierUsage | null>(null);
  const [usage, setUsage] = useState<UsageSeries | null>(null);
  const [billingLoading, setBillingLoading] = useState(true);
  const [usageLoading, setUsageLoading] = useState(true);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // -------------------------------------------------------------------------
  // Wallet + top ups
  // -------------------------------------------------------------------------

  const fetchBalance = useCallback(async () => {
    try {
      if (!displayPhoneNumber || !config.apiKey) return;

      const response = await fetch("/api/whatsapp/balance", {
        headers: {
          "x-display-phone-number": displayPhoneNumber,
          "x-api-key": config.apiKey,
        },
      });
      const data = await response.json();

      if (data.data && data.data[0]) {
        setBalance(data.data[0].balance);
      }
    } catch (err) {
      console.error("Failed to fetch balance:", err);
    }
  }, [displayPhoneNumber, config.apiKey]);

  const fetchTopUps = useCallback(async () => {
    try {
      if (!organizationExternalId || !config.apiKey) return;
      const data = await getJSON<{ data: TopUp[] }>(
        `${API_BASE}/api/v1/whatsapp/payment/${organizationExternalId}/list?eq__service=WHATSAPP&eq__status=SUCCESS`,
        config.apiKey,
      );
      setTopups(data.data || []);
    } catch (err) {
      console.error("Failed to fetch top ups:", err);
    } finally {
      setLoading(false);
    }
  }, [organizationExternalId, config.apiKey]);

  useEffect(() => {
    if (contextLoading) return;
    fetchBalance();
    fetchTopUps();
  }, [contextLoading, fetchBalance, fetchTopUps, refreshKey]);

  // -------------------------------------------------------------------------
  // Billing: summary + free tier (reload when the period changes)
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (contextLoading) return;
    if (!organizationExternalId || !apiToken || !rangeValid) {
      setBillingLoading(false);
      return;
    }
    const controller = new AbortController();
    const base = `${API_BASE}/api/v1/organization/${organizationExternalId}/whatsapp/billing`;
    setBillingLoading(true);
    setBillingError(null);

    Promise.all([
      getJSON<{ data: BillingSummary }>(`${base}/summary?from=${from}&to=${to}`, apiToken, controller.signal),
      getJSON<{ data: FreeTierUsage }>(`${base}/free-tier?month=${freeTierMonth}`, apiToken, controller.signal),
    ])
      .then(([summaryRes, freeTierRes]) => {
        setSummary(summaryRes.data);
        setFreeTier(freeTierRes.data);
      })
      .catch((err) => {
        if (isAbort(err)) return;
        console.error("Failed to fetch WhatsApp billing:", err);
        setBillingError(describeError(err));
        setSummary(null);
        setFreeTier(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setBillingLoading(false);
      });

    return () => controller.abort();
  }, [contextLoading, organizationExternalId, apiToken, from, to, freeTierMonth, rangeValid, refreshKey]);

  // Usage series (reload on period or interval change)
  useEffect(() => {
    if (contextLoading) return;
    if (!organizationExternalId || !apiToken || !rangeValid) {
      setUsageLoading(false);
      return;
    }
    const controller = new AbortController();
    setUsageLoading(true);
    getJSON<{ data: UsageSeries }>(
      `${API_BASE}/api/v1/organization/${organizationExternalId}/whatsapp/billing/usage?from=${from}&to=${to}&interval=${interval}`,
      apiToken,
      controller.signal,
    )
      .then((res) => setUsage(res.data))
      .catch((err) => {
        if (isAbort(err)) return;
        console.error("Failed to fetch WhatsApp usage:", err);
        setUsage(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setUsageLoading(false);
      });
    return () => controller.abort();
  }, [contextLoading, organizationExternalId, apiToken, from, to, interval, rangeValid, refreshKey]);

  // -------------------------------------------------------------------------
  // Top up (STK push) — unchanged
  // -------------------------------------------------------------------------

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!amount || !msisdn || !organizationExternalId) {
      setError("Please fill in all fields");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/api/v1/payment/${organizationExternalId}/whatsapp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          Amount: parseFloat(amount),
          MSISDN: msisdn,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to initiate top up");
      }

      setAmount("");
      setMsisdn("");
      setDialogOpen(false);
      await fetchTopUps();
      await fetchBalance();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------------------------------------------------------
  // Derived data
  // -------------------------------------------------------------------------

  // Delivered count and cost per Meta category (from Meta's pricing.category).
  const categoryTotals = useMemo(() => {
    const totals: Record<string, { messages: number; billable: number; free: number; cost: number }> = {};
    for (const c of [...CATEGORIES, OTHER_CATEGORY]) totals[c.key] = { messages: 0, billable: 0, free: 0, cost: 0 };
    for (const line of summary?.lines ?? []) {
      // marketing_lite -> marketing; anything unrecognised -> "other"
      const category = (line.billing_category ?? "").toLowerCase();
      const alias = CATEGORY_ALIASES[category] ?? category;
      const key = totals[alias] ? alias : OTHER_CATEGORY.key;
      totals[key].messages += line.messages;
      totals[key].billable += line.billable;
      totals[key].free += line.free;
      totals[key].cost += line.cost;
    }
    return totals;
  }, [summary]);

  const channelRows = useMemo(() => {
    const rows = [...(summary?.by_source ?? [])];
    const order = (s: string) => {
      const i = CHANNELS.findIndex((c) => c.key === s);
      return i === -1 ? CHANNELS.length : i;
    };
    return rows.sort((a, b) => order(a.source) - order(b.source));
  }, [summary]);

  const topCampaigns = useMemo(() => (summary?.by_campaign ?? []).slice(0, 5), [summary]);

  const refreshAll = () => setRefreshKey((k) => k + 1);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <DashboardLayout>
      <div className="min-h-screen">
        <Header title="Top Ups" description="Manage your account balance and see what your WhatsApp messages cost" />

        <div className="p-6 space-y-6">
          {/* Toolbar: period */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-wrap items-end gap-2">
              <div className="inline-flex rounded-md border bg-white p-1">
                {(
                  [
                    ["this_month", "This month"],
                    ["last_month", "Last month"],
                    ["last_30", "Last 30 days"],
                    ["custom", "Custom"],
                  ] as [PeriodKind, string][]
                ).map(([kind, label]) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => setPeriodKind(kind)}
                    className={`rounded px-3 py-1.5 text-sm transition-colors ${
                      periodKind === kind ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {periodKind === "custom" && (
                <div className="flex items-end gap-2">
                  <div>
                    <Label htmlFor="from" className="text-xs text-gray-500">
                      From
                    </Label>
                    <Input
                      id="from"
                      type="date"
                      value={customFrom}
                      max={customTo}
                      onChange={(e) => setCustomFrom(e.target.value)}
                      className="h-9 w-40"
                    />
                  </div>
                  <div>
                    <Label htmlFor="to" className="text-xs text-gray-500">
                      To
                    </Label>
                    <Input
                      id="to"
                      type="date"
                      value={customTo}
                      min={customFrom}
                      max={todayInNairobi()}
                      onChange={(e) => setCustomTo(e.target.value)}
                      className="h-9 w-40"
                    />
                  </div>
                </div>
              )}
              <Button size="sm" variant="ghost" onClick={refreshAll} title="Refresh">
                <RefreshCw className={`h-4 w-4 ${billingLoading || usageLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>

          {rangeValid ? (
            <p className="text-sm text-gray-500">{formatRange(from, to)}</p>
          ) : (
            <p className="text-sm text-red-600">Choose a start date on or before the end date.</p>
          )}

          {billingError && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Couldn&apos;t load message costs. {billingError}</span>
            </div>
          )}

          {/* Balance, spend, free tier */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Balance Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-base">Account Balance</CardTitle>
                  <CardDescription>Current credit</CardDescription>
                </div>
                <Wallet className="h-6 w-6 text-blue-500" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-2xl font-bold">
                  <span className="text-sm text-gray-600">KES </span>
                  {balance ? (parseFloat(balance) * 1.41).toFixed(2) : "0.00"}
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Top Up
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Top Up Account</DialogTitle>
                      <DialogDescription>Enter the amount and phone number to receive an STK push</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleTopUp} className="space-y-4">
                      <div>
                        <Label htmlFor="amount">Amount (KES)</Label>
                        <Input
                          id="amount"
                          type="number"
                          placeholder="10"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          disabled={submitting}
                        />
                      </div>

                      <div>
                        <Label htmlFor="msisdn">Phone Number</Label>
                        <Input
                          id="msisdn"
                          type="tel"
                          placeholder="254711438911"
                          value={msisdn}
                          onChange={(e) => setMsisdn(e.target.value)}
                          disabled={submitting}
                        />
                      </div>

                      {error && (
                        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                          {error}
                        </div>
                      )}

                      <Button type="submit" className="w-full" disabled={submitting}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {submitting ? "Processing..." : "Send STK Push"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Spend in period */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-base">WhatsApp Spend</CardTitle>
                  <CardDescription>Meta charges (USD) for the selected period</CardDescription>
                </div>
                <Receipt className="h-6 w-6 text-gray-500" />
              </CardHeader>
              <CardContent className="space-y-2">
                {billingLoading && !summary ? (
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{money(summary?.total_cost ?? 0)}</div>
                    <p className="text-sm text-gray-600">
                      {(summary?.total_messages ?? 0).toLocaleString()} delivered ·{" "}
                      {(summary?.billable_messages ?? 0).toLocaleString()} charged ·{" "}
                      {(summary?.free_messages ?? 0).toLocaleString()} free
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Free tier */}
            <FreeTierCard usage={freeTier} loading={billingLoading && !freeTier} month={freeTierMonth} />
          </div>

          {/* Category cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...CATEGORIES, ...(categoryTotals.other.messages > 0 ? [OTHER_CATEGORY] : [])].map((category) => {
              const Icon = category.icon;
              const totals = categoryTotals[category.key];
              return (
                <Card key={category.key} className={`border ${category.card}`}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <div>
                      <CardTitle className="text-base">Delivered</CardTitle>
                      <CardDescription>{category.name}</CardDescription>
                    </div>
                    <Icon className={`h-6 w-6 ${category.color}`} />
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="text-2xl font-bold">{totals.messages.toLocaleString()}</div>
                    <div className="text-sm font-medium text-gray-800">{money(totals.cost)}</div>
                    <p className="text-xs text-gray-500">
                      {totals.billable.toLocaleString()} charged · {totals.free.toLocaleString()} free
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Spend over time */}
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Spend Over Time</CardTitle>
                <CardDescription>What each channel cost per {interval}</CardDescription>
              </div>
              <div className="inline-flex self-start rounded-md border bg-white p-1">
                {(["day", "week", "month"] as Interval[]).map((value) => {
                  const disabled = value === "day" && rangeDays > 366;
                  return (
                    <button
                      key={value}
                      type="button"
                      disabled={disabled}
                      onClick={() => setIntervalChoice({ range: rangeKey, value })}
                      className={`rounded px-3 py-1 text-sm capitalize transition-colors disabled:opacity-40 ${
                        interval === value ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </CardHeader>
            <CardContent>
              <UsageChart series={usage} loading={usageLoading} />
            </CardContent>
          </Card>

          {/* Channels + campaigns */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Cost by Channel</CardTitle>
                <CardDescription>Campaigns, bulk sends, single messages and flows</CardDescription>
              </CardHeader>
              <CardContent>
                {channelRows.length === 0 ? (
                  <EmptyState loading={billingLoading} text="No delivered messages in this period" />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Channel</TableHead>
                          <TableHead className="text-right">Delivered</TableHead>
                          <TableHead className="text-right">Charged</TableHead>
                          <TableHead className="text-right">Free</TableHead>
                          <TableHead className="text-right">Cost</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {channelRows.map((row) => {
                          const share = summary && summary.total_cost > 0 ? (row.cost / summary.total_cost) * 100 : 0;
                          return (
                            <TableRow key={row.source}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className={`h-2.5 w-2.5 rounded-sm ${channelBar(row.source)}`} />
                                  <span className="font-medium">{channelName(row.source)}</span>
                                </div>
                                <div className="mt-1.5 h-1 w-full rounded bg-gray-100">
                                  <div
                                    className={`h-1 rounded ${channelBar(row.source)}`}
                                    style={{ width: `${Math.min(100, share)}%` }}
                                  />
                                </div>
                              </TableCell>
                              <TableCell className="text-right">{row.messages.toLocaleString()}</TableCell>
                              <TableCell className="text-right">{row.billable.toLocaleString()}</TableCell>
                              <TableCell className="text-right">{row.free.toLocaleString()}</TableCell>
                              <TableCell className="text-right font-medium">{money(row.cost)}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Most Expensive Campaigns</CardTitle>
                <CardDescription>Campaigns and bulk sends in this period</CardDescription>
              </CardHeader>
              <CardContent>
                {topCampaigns.length === 0 ? (
                  <EmptyState loading={billingLoading} text="No campaign messages delivered in this period" />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Campaign</TableHead>
                          <TableHead className="text-right">Delivered</TableHead>
                          <TableHead className="text-right">Per message</TableHead>
                          <TableHead className="text-right">Cost</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topCampaigns.map((campaign) => (
                          <TableRow key={campaign.campaign_id}>
                            <TableCell>
                              <div className="font-medium">
                                {campaign.campaign_name || `Campaign #${campaign.campaign_id}`}
                              </div>
                              <Badge variant="outline" className="mt-1 text-xs font-normal">
                                {channelName(campaign.source)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">{campaign.messages.toLocaleString()}</TableCell>
                            <TableCell className="text-right text-gray-600">
                              {campaign.messages > 0 ? money(campaign.cost / campaign.messages) : "—"}
                            </TableCell>
                            <TableCell className="text-right font-medium">{money(campaign.cost)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {summary && summary.unpriced_messages > 0 && (
            <div className="flex items-start gap-2 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
              <Clock className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {summary.unpriced_messages.toLocaleString()} message{summary.unpriced_messages === 1 ? " is" : "s are"}{" "}
                still waiting for a delivery receipt from Meta, so{" "}
                {summary.unpriced_messages === 1 ? "it isn't" : "they aren't"} in these totals yet.
              </span>
            </div>
          )}

          {/* Top Ups History */}
          <Card>
            <CardHeader>
              <CardTitle>Top Up History</CardTitle>
              <CardDescription>Recent successful top ups</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : topups.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-gray-500">No top ups yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Phone Number</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topups.map((topup) => (
                        <TableRow key={topup.id}>
                          <TableCell className="text-sm">{new Date(topup.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="font-mono text-sm">{topup.MSISDN}</TableCell>
                          <TableCell className="font-bold">KES {Number(topup.amount).toLocaleString()}</TableCell>
                          <TableCell className="font-mono text-sm">{topup.transaction_id}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                              {topup.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

function EmptyState({ loading, text }: { loading: boolean; text: string }) {
  return (
    <div className="flex items-center justify-center py-8 text-sm text-gray-500">
      {loading ? <Loader2 className="h-5 w-5 animate-spin text-gray-400" /> : text}
    </div>
  );
}

function FreeTierCard({ usage, loading, month }: { usage: FreeTierUsage | null; loading: boolean; month: string }) {
  const allowance = usage?.allowance ?? 1000;
  const used = Math.min(usage?.free_used ?? 0, allowance);
  const exhausted = Boolean(usage && (usage.free_remaining === 0 || usage.billed > 0));
  const percent = allowance > 0 ? (exhausted ? 100 : (used / allowance) * 100) : 0;
  const barColor = exhausted ? "bg-red-500" : percent >= 80 ? "bg-amber-500" : "bg-emerald-500";
  const channels = (usage?.by_source ?? []).filter((s) => s.free_used > 0 || s.billed > 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-base">Free Service Messages</CardTitle>
          <CardDescription>{formatMonth(usage?.month ?? month)} · resets on the 1st</CardDescription>
        </div>
        <Gift className="h-6 w-6 text-emerald-500" />
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        ) : (
          <>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">
                {(usage?.free_used ?? 0).toLocaleString()}
                <span className="text-sm font-normal text-gray-500"> / {allowance.toLocaleString()} used</span>
              </div>
              <span className={`text-sm ${exhausted ? "text-red-600" : "text-gray-600"}`}>
                {exhausted ? "Used up" : `${(usage?.free_remaining ?? allowance).toLocaleString()} left`}
              </span>
            </div>
            <div
              className="h-2 w-full rounded-full bg-gray-100"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={allowance}
              aria-valuenow={used}
            >
              <div className={`h-2 rounded-full ${barColor}`} style={{ width: `${percent}%` }} />
            </div>
            {usage && usage.billed > 0 && (
              <p className="text-xs text-red-600">
                {usage.billed.toLocaleString()} service message{usage.billed === 1 ? "" : "s"} charged after the free
                tier ran out ({money(usage.billed_cost)})
              </p>
            )}
            {channels.length > 0 && (
              <ul className="space-y-1 text-xs text-gray-600">
                {channels.map((s) => (
                  <li key={s.source} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-sm ${channelBar(s.source)}`} />
                      {channelName(s.source)}
                    </span>
                    <span>
                      {s.free_used.toLocaleString()} free
                      {s.billed > 0 && ` · ${s.billed.toLocaleString()} charged`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-gray-400">
              Replies sent from other tools on this number also use the free tier.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/** Stacked bar chart of cost per period, one colour per channel. Plain divs, no chart library. */
function UsageChart({ series, loading }: { series: UsageSeries | null; loading: boolean }) {
  const [active, setActive] = useState<number | null>(null);
  const points = series?.points ?? [];
  const interval = series?.interval ?? "day";

  if (loading && points.length === 0) return <EmptyState loading text="" />;
  if (points.length === 0) return <EmptyState loading={false} text="No usage in this period" />;

  const max = Math.max(...points.map((p) => p.cost), 0);
  const labelEvery = Math.max(1, Math.ceil(points.length / 8));
  const focused = active !== null ? points[active] : null;
  const totalMessages = points.reduce((sum, p) => sum + p.messages, 0);

  return (
    <div className="space-y-3">
      {/* Readout: the hovered bar, or totals for the whole range */}
      <div className="flex min-h-[40px] flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
        <span className="font-medium text-gray-900">
          {focused ? formatPeriod(focused.period, interval) : "Whole period"}
        </span>
        <span className="text-lg font-semibold">{money(focused ? focused.cost : (series?.total_cost ?? 0))}</span>
        <span className="text-gray-500">{(focused ? focused.messages : totalMessages).toLocaleString()} delivered</span>
        {focused &&
          CHANNELS.map((c) => {
            const value = focused[c.usageKey];
            return value > 0 ? (
              <span key={c.key} className="flex items-center gap-1 text-gray-600">
                <span className={`h-2 w-2 rounded-sm ${c.bar}`} />
                {c.name} {money(value)}
              </span>
            ) : null;
          })}
      </div>

      <div className="flex gap-2">
        {/* Y axis */}
        <div className="flex h-48 w-20 shrink-0 flex-col justify-between text-right text-[11px] text-gray-400">
          <span>{money(max)}</span>
          <span>{money(max / 2)}</span>
          <span>{money(0)}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div
            className="relative flex h-48 items-end gap-[2px] border-b border-l border-gray-200"
            onMouseLeave={() => setActive(null)}
          >
            <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-gray-100" />
            {points.map((point, index) => {
              const height = max > 0 ? (point.cost / max) * 100 : 0;
              const other = Math.max(
                0,
                point.cost - point.campaign_cost - point.bulk_cost - point.single_cost - point.flow_cost,
              );
              return (
                <button
                  key={point.period}
                  type="button"
                  className={`relative flex h-full flex-1 flex-col justify-end focus:outline-none ${
                    active === index ? "bg-gray-50" : ""
                  }`}
                  onMouseEnter={() => setActive(index)}
                  onFocus={() => setActive(index)}
                  onBlur={() => setActive(null)}
                  aria-label={`${formatPeriod(point.period, interval)}: ${money(point.cost)}`}
                >
                  <div
                    className="flex w-full flex-col-reverse overflow-hidden rounded-t-sm"
                    style={{ height: `${height}%` }}
                  >
                    {CHANNELS.map((c) => {
                      const value = point[c.usageKey];
                      return value > 0 ? (
                        <div key={c.key} className={c.bar} style={{ height: `${(value / point.cost) * 100}%` }} />
                      ) : null;
                    })}
                    {other > 0 && <div className="bg-gray-400" style={{ height: `${(other / point.cost) * 100}%` }} />}
                  </div>
                </button>
              );
            })}
          </div>
          {/* X axis labels */}
          <div className="mt-1 flex gap-[2px] overflow-hidden text-[11px] text-gray-400">
            {points.map((point, index) => (
              <div key={point.period} className="min-w-0 flex-1 overflow-visible whitespace-nowrap">
                {index % labelEvery === 0 ? formatPeriod(point.period, interval) : ""}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-600">
        {CHANNELS.map((c) => (
          <span key={c.key} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-sm ${c.bar}`} />
            {c.name}
          </span>
        ))}
      </div>
    </div>
  );
}