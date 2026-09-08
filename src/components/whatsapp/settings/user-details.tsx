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
import { Badge } from "@/components/whatsapp/ui/badge";
import { useToast } from "@/hooks/whatsapp/use-toast";
import { useConfig } from "@/lib/whatsapp/config-context";
import { getUserDetails, getWabaInfo } from "@/lib/whatsapp/whatsapp-api";
import { RefreshCw, User, Building, Phone, Hash, Loader2 } from "lucide-react";

interface UserInfo {
  id?: string;
  name?: string;
  phone_number?: string;
  waba_id?: string;
  business_name?: string;
  [key: string]: unknown;
}

interface WabaInfo {
  id?: string;
  name?: string;
  message_template_namespace?: string;
  timezone_id?: string;
  [key: string]: unknown;
}

export function UserDetailsCard() {
  const { config, isConfigured } = useConfig();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [wabaInfo, setWabaInfo] = useState<WabaInfo | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!isConfigured) return;

    setLoading(true);

    const [userResult, wabaResult] = await Promise.all([
      getUserDetails(config),
      getWabaInfo(config),
    ]);

    setLoading(false);

    if (userResult.success && userResult.data) {
      setUserInfo(userResult.data as UserInfo);
    } else {
      toast({
        title: "Error",
        description: userResult.error || "Failed to fetch user details.",
        variant: "destructive",
      });
    }

    if (wabaResult.success && wabaResult.data) {
      setWabaInfo(wabaResult.data as WabaInfo);
    }
  }, [config, isConfigured, toast]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  if (!isConfigured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Details</CardTitle>
          <CardDescription>Configure your API settings to view account details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <User className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm text-muted-foreground">
              Please configure your API settings first.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your WhatsApp Business API account details</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchDetails} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </CardHeader>
        <CardContent>
          {loading && !userInfo ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : userInfo ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3 rounded-lg border border-border p-4">
                <User className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">User ID</p>
                  <p className="mt-1 font-mono text-sm">{userInfo.id || "N/A"}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 rounded-lg border border-border p-4">
                <Building className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Business Name</p>
                  <p className="mt-1 text-sm">{userInfo.business_name || userInfo.name || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-border p-4">
                <Phone className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                  <p className="mt-1 font-mono text-sm">{userInfo.phone_number || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-border p-4">
                <Hash className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">WABA ID</p>
                  <p className="mt-1 font-mono text-sm">{userInfo.waba_id || config.wabaId}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Unable to fetch user details. Please check your API configuration.
            </p>
          )}
        </CardContent>
      </Card>

      {wabaInfo && (
        <Card>
          <CardHeader>
            <CardTitle>WABA Information</CardTitle>
            <CardDescription>WhatsApp Business Account details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(wabaInfo)
                .filter(([key]) => !key.startsWith("_"))
                .map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                    <span className="text-sm text-muted-foreground capitalize">
                      {key.replace(/_/g, " ")}
                    </span>
                    <Badge variant="secondary" className="font-mono">
                      {typeof value === "object" ? JSON.stringify(value) : String(value)}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
