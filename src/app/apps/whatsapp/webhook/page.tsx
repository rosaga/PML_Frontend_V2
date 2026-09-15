"use client";

import { DashboardLayout } from "@/components/whatsapp/dashboard/layout";
import { Header } from "@/components/whatsapp/dashboard/header";
import { WebhookSettings } from "@/components/whatsapp/settings/webhook-settings";

function WebhookContent() {
  return (
    <div className="min-h-screen">
      <Header
        title="Webhook Configuration"
        description="Configure webhooks to receive message callbacks"
      />

      <div className="p-6 max-w-4xl">
        <WebhookSettings />
      </div>
    </div>
  );
}

export default function WebhookPage() {
  return (
    <DashboardLayout>
      <WebhookContent />
    </DashboardLayout>
  );
}
