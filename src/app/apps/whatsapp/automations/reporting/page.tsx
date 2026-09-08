"use client";

import React from "react";
import { DashboardLayout } from "@/components/whatsapp/dashboard/layout";
import { ReportingLayout } from "@/components/whatsapp/automations/reporting-layout";

export default function ReportingPage() {
  return (
    <DashboardLayout>
      <ReportingLayout />
    </DashboardLayout>
  );
}
