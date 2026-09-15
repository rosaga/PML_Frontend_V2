"use client";

import React from "react";
import { DashboardLayout } from "@/components/whatsapp/dashboard/layout";
import { AutomationsLayout } from "@/components/whatsapp/automations/automations-layout";

export default function AutomationsPage() {
  return (
    <DashboardLayout>
      <AutomationsLayout />
    </DashboardLayout>
  );
}
