"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/whatsapp/dashboard/layout";
import { Header } from "@/components/whatsapp/dashboard/header";
import { ApiConfigSettings } from "@/components/whatsapp/settings/api-config";
import { BusinessNameCard } from "@/components/whatsapp/settings/business-name";
import { getToken } from "@/utils/auth";
import { hasRole } from "@/utils/decodeToken";
import { ShieldOff } from "lucide-react";

function AccountContent() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const token = getToken();
    setIsAdmin(hasRole(token, "SuperAdmin"));
  }, []);

  return (
    <div className="min-h-screen">
      <Header
        title="Account Settings"
        description="Configure your API credentials and preferences"
      />

      <div className="p-6 max-w-2xl space-y-6">
        {isAdmin === null ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : isAdmin ? (
          <>
            <BusinessNameCard />
            <ApiConfigSettings />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <ShieldOff className="h-12 w-12 text-muted-foreground" />
            <h2 className="text-xl font-semibold text-foreground">Access Denied</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              Only organisation administrators can configure WhatsApp account settings.
              Contact your admin to make changes.
            </p>
          </div>
        )}
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
