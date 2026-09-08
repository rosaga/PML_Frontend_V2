"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/whatsapp/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/whatsapp/ui/card";
import { useToast } from "@/hooks/whatsapp/use-toast";
import { useConfig } from "@/lib/whatsapp/config-context";
import { getUserDetails, getWabaInfo } from "@/lib/whatsapp/whatsapp-api";
import { RefreshCw, Building, Loader2 } from "lucide-react";

interface UserInfo {
  id?: string;
  name?: string;
  phone_number?: string;
  waba_id?: string;
  business_name?: string;
  [key: string]: unknown;
}

export function BusinessNameCard() {
  const { config, isConfigured } = useConfig();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [businessName, setBusinessName] = useState<string | null>(null);

  const fetchBusinessName = useCallback(async () => {
    if (!isConfigured) return;

    setLoading(true);

    const userResult = await getUserDetails(config);

    setLoading(false);

    if (userResult.success && userResult.data) {
      const userInfo = userResult.data as UserInfo;
      setBusinessName(userInfo.business_name || userInfo.name || null);
    } else {
      toast({
        title: "Error",
        description: userResult.error || "Failed to fetch business name.",
        variant: "destructive",
      });
    }
  }, [config, isConfigured, toast]);

  useEffect(() => {
    fetchBusinessName();
  }, [fetchBusinessName]);

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
            Unable to fetch business name. Please check your API configuration.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
