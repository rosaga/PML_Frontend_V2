"use client";

import { DashboardLayout } from "@/components/whatsapp/dashboard/layout";
import { Header } from "@/components/whatsapp/dashboard/header";
import { BulkMessageForm } from "@/components/whatsapp/messages/bulk-message-form";

function BulkContent() {
  return (
    <div className="min-h-screen">
      <Header
        title="Bulk Message"
        description="Send templated messages to multiple recipients"
      />

      <div className="p-6 max-w-4xl">
        <BulkMessageForm />
      </div>
    </div>
  );
}

export default function BulkPage() {
  return (
    <DashboardLayout>
      <BulkContent />
    </DashboardLayout>
  );
}
