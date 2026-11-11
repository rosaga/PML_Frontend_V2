"use client";

import Link from "next/link";
import { Loader2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/whatsapp/ui/badge";
import { Button } from "@/components/whatsapp/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/whatsapp/ui/card";
import { useTechProviderWorkspace } from "./dashboard-shell";
import { TECH_PROVIDER_BASE } from "./navigation";

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function AccountDetails() {
  const { account, accountLoading, accountError, refreshAccount } = useTechProviderWorkspace();
  const details = account ? [
    ["Organization ID", account.external_id],
    ["Verified Name", account.verified_name],
    ["Display Phone Number", account.display_phone],
    ["Business ID", account.business_id],
    ["WABA ID", account.waba_id],
    ["Phone Number ID", account.phone_number_id],
    ["Meta Connection ID", account.meta_connection_id],
    ["Meta App ID", account.meta_app_id],
    ["Meta Configuration ID", account.meta_configuration_id],
    ["Meta Assets Verified", account.meta_assets_verified == null ? "—" : account.meta_assets_verified ? "Yes" : "No"],
    ["Meta Lifecycle Status", account.meta_lifecycle_status],
    ["Created At", formatDate(account.created_at)],
    ["Updated At", formatDate(account.updated_at)],
    ["Created By", account.created_by],
  ] : [];

  return <Card>
    <CardHeader>
      <div className="flex flex-wrap items-center justify-between gap-3"><CardTitle>Account Information</CardTitle><Button variant="outline" size="sm" disabled={accountLoading} onClick={refreshAccount} aria-label="Refresh account details"><RefreshCw className={`h-4 w-4 ${accountLoading ? "animate-spin" : ""}`} />Refresh</Button></div>
      <CardDescription>WhatsApp account details for your selected organization</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {accountLoading ? <div role="status" className="flex items-center gap-2 py-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading account details…</div>
        : accountError ? <div role="alert" className="space-y-3 text-sm"><p className="text-destructive">{accountError}</p><Button variant="outline" onClick={refreshAccount}>Retry account details</Button></div>
          : account ? <><Badge variant="outline" className={account.is_active ? "border-green-200 bg-green-50 text-green-700" : undefined}>{account.is_active ? "Active" : "Inactive"}</Badge><dl className="space-y-3">{details.map(([label, value]) => <div key={label} className="flex flex-col gap-1 border-b pb-3 text-sm sm:flex-row sm:justify-between sm:gap-4"><dt className="shrink-0 font-medium">{label}</dt><dd className="break-all text-muted-foreground sm:text-right">{value || "—"}</dd></div>)}</dl></>
            : <div className="space-y-3"><p className="text-sm text-muted-foreground">No WhatsApp account connected to this organization.</p><Button asChild><Link href={`${TECH_PROVIDER_BASE}/embedded-signup`}>Connect WhatsApp</Link></Button></div>}
    </CardContent>
  </Card>;
}
