"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, CircleAlert, MessageCircle, TrendingUp, Users } from "lucide-react";
import { useWhatsAppDemo } from "./demo-context";
import { DEMO_REPORT_DATE, type WhatsAppCampaign, type WhatsAppOrganization } from "./demo-data";
import {
  AdminCard, AdminMetric, AdminTable, DemoNotice, StatusBadge,
  formatDate, formatDateTime, inputClass, secondaryButtonClass, type TableColumn,
} from "./ui";

type Tab = "campaigns" | "subscriptions" | "usage";
type CampaignRow = WhatsAppCampaign & { organization: string };
type UsageRow = { id: string; organization: string; campaignCount: number; totalSent: number; delivered: number; failed: number; successRate: number };

const campaignColumns: TableColumn<CampaignRow>[] = [
  { key: "id", label: "Campaign ID", render: (row) => <span className="whitespace-nowrap font-semibold">{row.id}</span> },
  { key: "name", label: "Name" },
  { key: "organization", label: "Organization" },
  { key: "totalSent", label: "Total Sent", render: (row) => row.totalSent.toLocaleString("en-KE") },
  { key: "delivered", label: "Delivered", render: (row) => row.delivered.toLocaleString("en-KE") },
  { key: "failed", label: "Failed", render: (row) => <span className={row.failed ? "text-rose-600" : ""}>{row.failed.toLocaleString("en-KE")}</span> },
  { key: "sentAt", label: "Date & Time (EAT)", render: (row) => <span className="whitespace-nowrap text-gray-600">{formatDateTime(row.sentAt)}</span> },
  { key: "deliverySeconds", label: "Delivery Time", render: (row) => <span className="whitespace-nowrap">{row.deliverySeconds} sec</span> },
];

const subscriptionColumns: TableColumn<WhatsAppOrganization>[] = [
  { key: "name", label: "Organization Name", render: (row) => <span className="font-semibold">{row.name}</span> },
  { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
  { key: "connectedAt", label: "Date Connected", render: (row) => <span className="whitespace-nowrap">{formatDate(row.connectedAt)}</span> },
  { key: "nextRenewal", label: "Next Renewal", render: (row) => <span className="whitespace-nowrap">{formatDate(row.nextRenewal)}</span> },
  { key: "wallet", label: "Wallet", render: () => <Link href="/apps/admin/accounts?tab=whatsapp" className="whitespace-nowrap text-sm font-semibold text-[#001F3D] underline underline-offset-4">View Wallets</Link> },
];

const usageColumns: TableColumn<UsageRow>[] = [
  { key: "organization", label: "Organization", render: (row) => <span className="font-semibold">{row.organization}</span> },
  { key: "campaignCount", label: "Campaigns" },
  { key: "totalSent", label: "Messages Sent", render: (row) => row.totalSent.toLocaleString("en-KE") },
  { key: "delivered", label: "Successful", render: (row) => row.delivered.toLocaleString("en-KE") },
  { key: "failed", label: "Failed", render: (row) => <span className="text-rose-600">{row.failed.toLocaleString("en-KE")}</span> },
  { key: "successRate", label: "Success Rate", render: (row) => `${row.successRate.toFixed(1)}%` },
];

export default function WhatsAppServices() {
  const { organizations, campaigns } = useWhatsAppDemo();
  const [tab, setTab] = useState<Tab>("campaigns");
  const [query, setQuery] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [status, setStatus] = useState("");

  const metrics = useMemo(() => {
    const today = campaigns.filter((campaign) => campaign.sentAt.slice(0, 10) === DEMO_REPORT_DATE);
    const sent = today.reduce((total, campaign) => total + campaign.totalSent, 0);
    const failed = today.reduce((total, campaign) => total + campaign.failed, 0);
    return { sent, failed, successRate: sent ? ((sent - failed) / sent) * 100 : 0, inactive: organizations.filter((organization) => organization.status === "Inactive").length };
  }, [campaigns, organizations]);

  const campaignRows = useMemo(() => {
    const names = new Map(organizations.map((organization) => [organization.id, organization.name]));
    const search = query.trim().toLowerCase();
    return campaigns.map((campaign) => ({ ...campaign, organization: names.get(campaign.organizationId) || "—" }))
      .filter((campaign) => (!organizationId || campaign.organizationId === organizationId) && [campaign.id, campaign.name, campaign.organization].some((value) => value.toLowerCase().includes(search)))
      .sort((first, second) => new Date(second.sentAt).getTime() - new Date(first.sentAt).getTime());
  }, [organizations, campaigns, query, organizationId]);

  const subscriptionRows = useMemo(() => organizations.filter((organization) => (
    (!organizationId || organization.id === organizationId) && (!status || organization.status === status) && organization.name.toLowerCase().includes(query.trim().toLowerCase())
  )), [organizations, organizationId, status, query]);

  const usageRows = useMemo<UsageRow[]>(() => organizations.filter((organization) => (
    (!organizationId || organization.id === organizationId) && organization.name.toLowerCase().includes(query.trim().toLowerCase())
  )).map((organization) => {
    const history = campaigns.filter((campaign) => campaign.organizationId === organization.id);
    const totalSent = history.reduce((total, campaign) => total + campaign.totalSent, 0);
    const delivered = history.reduce((total, campaign) => total + campaign.delivered, 0);
    return { id: organization.id, organization: organization.name, campaignCount: history.length, totalSent, delivered, failed: history.reduce((total, campaign) => total + campaign.failed, 0), successRate: totalSent ? (delivered / totalSent) * 100 : 0 };
  }), [organizations, campaigns, organizationId, query]);

  const tabs: { id: Tab; label: string }[] = [{ id: "campaigns", label: "Campaigns" }, { id: "subscriptions", label: "Subscriptions" }, { id: "usage", label: "Usage" }];

  return <div className="lg:ml-64 min-h-screen bg-gray-50 p-5 sm:p-6">
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="text-[30px] font-semibold leading-tight text-gray-900">WhatsApp Management</h1><p className="mt-2 text-sm text-gray-600">Monitor organization campaigns, subscriptions, and usage.</p></div>
      <Link href="/apps/admin/accounts?tab=whatsapp" className={secondaryButtonClass}>WhatsApp Wallets</Link>
    </div>
    <DemoNotice>WhatsApp campaigns, subscriptions, and usage are sample data.</DemoNotice>
    <div className="mb-3 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <AdminMetric title="Messages Sent Today" value={metrics.sent.toLocaleString("en-KE")} subtitle="Across all WhatsApp organizations" icon={<MessageCircle size={22} />} />
      <AdminMetric title="Failed Messages Today" value={metrics.failed.toLocaleString("en-KE")} subtitle={<Link href="/apps/admin/failed-dispatches?product=WhatsApp" className="text-[#001F3D] underline underline-offset-4">View failed dispatches</Link>} icon={<CircleAlert size={22} />} />
      <AdminMetric title="Success Rate" value={`${metrics.successRate.toFixed(1)}%`} subtitle="Messages delivered today" icon={<TrendingUp size={22} />} />
      <AdminMetric title="Inactive Organizations" value={metrics.inactive} subtitle={`${organizations.length} connected organizations`} icon={<Users size={22} />} />
    </div>
    <p className="mb-6 flex items-center gap-2 text-xs text-gray-500"><CalendarDays size={14} aria-hidden="true" />Sample reporting date: {formatDate(DEMO_REPORT_DATE)}</p>

    <div className="mb-5 overflow-x-auto pb-1">
      <div className="inline-flex rounded-full bg-gray-200 p-1" aria-label="WhatsApp sections">
        {tabs.map((item) => <button key={item.id} type="button" aria-pressed={tab === item.id} onClick={() => { setTab(item.id); setQuery(""); setOrganizationId(""); setStatus(""); }} className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-[#001F3D] ${tab === item.id ? "bg-white text-gray-900 shadow-[0_0_0_2px_rgba(0,0,0,0.25),0_2px_6px_rgba(0,0,0,0.12)]" : "text-gray-900 hover:bg-gray-100"}`}>{item.label}</button>)}
      </div>
    </div>

    <div className="mb-5 flex flex-wrap items-end gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="min-w-0 flex-1 basis-60"><label htmlFor="whatsapp-search" className="mb-2 block text-sm font-medium text-gray-700">{tab === "campaigns" ? "Search campaigns" : "Search organizations"}</label><input id="whatsapp-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={tab === "campaigns" ? "Campaign ID, name or organization" : "Organization name"} className={inputClass} /></div>
      <div className="w-full sm:w-56"><label htmlFor="whatsapp-organization" className="mb-2 block text-sm font-medium text-gray-700">Organization</label><select id="whatsapp-organization" className={inputClass} value={organizationId} onChange={(event) => setOrganizationId(event.target.value)}><option value="">All Organizations</option>{organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}</select></div>
      {tab === "subscriptions" && <div className="w-full sm:w-40"><label htmlFor="whatsapp-status" className="mb-2 block text-sm font-medium text-gray-700">Status</label><select id="whatsapp-status" className={inputClass} value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All Statuses</option><option>Active</option><option>Inactive</option></select></div>}
      <button type="button" className={secondaryButtonClass} disabled={!query && !organizationId && !status} onClick={() => { setQuery(""); setOrganizationId(""); setStatus(""); }}>Clear Filters</button>
    </div>
    {tab === "campaigns" && <AdminCard title="WhatsApp Campaigns" description="Campaign delivery results, from newest to oldest."><AdminTable columns={campaignColumns} rows={campaignRows} emptyMessage="No campaigns match these filters." /></AdminCard>}
    {tab === "subscriptions" && <AdminCard title="WhatsApp Subscriptions" description="Connected organizations and their subscription renewal dates."><AdminTable columns={subscriptionColumns} rows={subscriptionRows} emptyMessage="No subscriptions match these filters." /></AdminCard>}
    {tab === "usage" && <AdminCard title="Organization Usage" description="Totals across all sample WhatsApp campaigns."><AdminTable columns={usageColumns} rows={usageRows} emptyMessage="No organizations match these filters." /></AdminCard>}
  </div>;
}
