"use client";

import { useState } from "react";
import Link from "next/link";
import WhatsAppLicenses from "./licenses";
import WhatsAppCampaigns from "./campaigns";
import WhatsAppUsage from "./usage";
import WhatsAppSummary from "./summary";
import { secondaryButtonClass } from "./ui";

type Tab = "campaigns" | "subscriptions" | "usage";

export default function WhatsAppServices() {
  const [tab, setTab] = useState<Tab>("campaigns");
  const tabs: { id: Tab; label: string }[] = [{ id: "campaigns", label: "Campaigns" }, { id: "subscriptions", label: "Subscriptions" }, { id: "usage", label: "Usage" }];

  return <div className="lg:ml-64 min-h-screen bg-gray-50 p-5 sm:p-6">
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="text-[30px] font-semibold leading-tight text-gray-900">WhatsApp Management</h1><p className="mt-2 text-sm text-gray-600">Monitor organization campaigns, subscriptions, and usage.</p></div>
      <Link href="/apps/admin/accounts?tab=whatsapp" className={secondaryButtonClass}>WhatsApp Wallets</Link>
    </div>
    <WhatsAppSummary />
    <div className="mb-5 overflow-x-auto pb-1">
      <div className="inline-flex rounded-full bg-gray-200 p-1" aria-label="WhatsApp sections">
        {tabs.map((item) => <button key={item.id} type="button" aria-pressed={tab === item.id} onClick={() => setTab(item.id)} className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-[#001F3D] ${tab === item.id ? "bg-white text-gray-900 shadow-[0_0_0_2px_rgba(0,0,0,0.25),0_2px_6px_rgba(0,0,0,0.12)]" : "text-gray-900 hover:bg-gray-100"}`}>{item.label}</button>)}
      </div>
    </div>
    {tab === "campaigns" && <WhatsAppCampaigns />}
    {tab === "subscriptions" && <WhatsAppLicenses />}
    {tab === "usage" && <WhatsAppUsage />}
  </div>;
}
