"use client";

import CompanyProfile from "@/components/profile/company-profile";
import { DashboardLayout } from "@/components/whatsapp/dashboard/layout";
import { Header } from "@/components/whatsapp/dashboard/header";

export default function ProfilePage() {
  return (
    <DashboardLayout>
      <Header title="Profile" />
      <CompanyProfile withinDashboard />
    </DashboardLayout>
  );
}
