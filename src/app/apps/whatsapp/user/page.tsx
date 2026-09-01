"use client";

import { DashboardLayout } from "@/components/whatsapp/dashboard/layout";
import { Header } from "@/components/whatsapp/dashboard/header";
import { UserDetailsCard } from "@/components/whatsapp/settings/user-details";

function UserContent() {
  return (
    <div className="min-h-screen">
      <Header
        title="User Details"
        description="View your WhatsApp Business account information"
      />

      <div className="p-6 max-w-4xl">
        <UserDetailsCard />
      </div>
    </div>
  );
}

export default function UserPage() {
  return (
    <DashboardLayout>
      <UserContent />
    </DashboardLayout>
  );
}
