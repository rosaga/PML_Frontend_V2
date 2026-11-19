"use client";

import { Button } from "@/components/whatsapp/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/whatsapp/ui/card";
import { useConfig } from "@/lib/whatsapp/config-context";
import { RefreshCw, Building, Loader2 } from "lucide-react";

export function BusinessNameCard() {
  const { config, setConfig, isConfigured, isVerifying: loading } = useConfig();
  const businessName = config.businessName;
  const fetchBusinessName = () => setConfig({ ...config, businessName: undefined });

  if (!isConfigured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Business Name</CardTitle>
          <CardDescription>Your WhatsApp Business account name</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Building className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm text-muted-foreground">
              Please configure your API settings to view business name
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Business Name</CardTitle>
          <CardDescription>Your WhatsApp Business account name</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={fetchBusinessName} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {loading && !businessName ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : businessName ? (
          <div className="flex items-start gap-3 rounded-lg border border-border p-4 bg-muted/30">
            <Building className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Business Name</p>
              <p className="mt-2 text-sm font-semibold">{businessName}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Business name is unavailable.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
