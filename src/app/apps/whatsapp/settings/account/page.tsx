"use client";

import { DashboardLayout } from "@/components/whatsapp/dashboard/layout";
import { Header } from "@/components/whatsapp/dashboard/header";
import { ApiConfigSettings } from "@/components/whatsapp/settings/api-config";
import { BusinessNameCard } from "@/components/whatsapp/settings/business-name";
import { CallbackUrlSettings } from "@/components/whatsapp/settings/callback-url";

function AccountContent() {
  return (
    <div className="min-h-screen">
      <Header
        title="Account Settings"
        description="View your WhatsApp account details and configure your callback URL"
      />

      <div className="p-6 max-w-2xl space-y-6">
        <BusinessNameCard />
        <ApiConfigSettings />
        <CallbackUrlSettings />
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <DashboardLayout>
      <AccountContent />
    </DashboardLayout>
  );
}
