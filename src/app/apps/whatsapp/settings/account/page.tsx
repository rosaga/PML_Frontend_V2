"use client";

import { DashboardLayout } from "@/components/whatsapp/dashboard/layout";
import { Header } from "@/components/whatsapp/dashboard/header";
import { ApiConfigSettings } from "@/components/whatsapp/settings/api-config";
import { BusinessNameCard } from "@/components/whatsapp/settings/business-name";

function AccountContent() {
  return (
    <div className="min-h-screen">
      <Header
        title="Account Settings"
        description="Configure your API credentials and preferences"
      />

      <div className="p-6 max-w-2xl space-y-6">
        <BusinessNameCard />
        <ApiConfigSettings />
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
