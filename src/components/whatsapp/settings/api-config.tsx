"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/whatsapp/ui/button";
import { Input } from "@/components/whatsapp/ui/input";
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
import { getToken } from "@/utils/auth";
import { hasRole } from "@/utils/decodeToken";
import { CheckCircle, Loader2, RefreshCw, Circle, Search } from "lucide-react";

interface AccountDetails {
  apiKey: string;
  wabaId: string;
  phoneNumberId: string;
  displayPhoneNumber: string;
  organizationExternalId: string;
}

export function ApiConfigSettings() {
  const {
    config,
    setConfig,
    isConfigured,
    isLoading,
    organizationId: savedOrgId,
    setOrganizationId: setSavedOrgId,
    organizationExternalId: savedOrgExternalId,
    setOrganizationExternalId: setSavedOrgExternalId,
    displayPhoneNumber: savedDisplayPhoneNumber,
    setDisplayPhoneNumber: setSavedDisplayPhoneNumber,
  } = useConfig();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [overrideOrgId, setOverrideOrgId] = useState("");

  const handleVerifyAndSave = useCallback(async (orgId: string) => {
    if (!orgId.trim()) return;
    setLoading(true);
    try {
      const peakResponse = await fetch(
        `https://peakdata-1048592730476.europe-west4.run.app/whatsapp/account?organization_external_id=${orgId.trim()}`,
        { method: "GET", headers: { "Content-Type": "application/json" } }
      );
      const peakData = await peakResponse.json();
      if (!peakResponse.ok || peakData.status !== "success" || !peakData.data) {
        toast({ title: "Organization Not Found", description: "Could not find WhatsApp account for this organization.", variant: "destructive" });
        return;
      }
      const account = peakData.data;
      const apiKey = account.APIKey;

      const verifyResponse = await fetch("/api/whatsapp/whatsapp-internal/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });
      const verifyData = await verifyResponse.json();
      if (!verifyResponse.ok) {
        toast({ title: "Verification Failed", description: "Failed to verify WhatsApp account. Please contact support.", variant: "destructive" });
        return;
      }
      const userData = verifyData.data?.[0];
      if (!userData?.whatsapp_business_account_id || !userData?.phone_number_id) {
        toast({ title: "Error", description: "Could not retrieve account details. Please contact support.", variant: "destructive" });
        return;
      }

      setAccountDetails({
        apiKey,
        wabaId: userData.whatsapp_business_account_id,
        phoneNumberId: userData.phone_number_id,
        displayPhoneNumber: account.DisplayPhoneNumber || "",
        organizationExternalId: account.OrganizationExternalID || "",
      });
      setConfig({ apiKey, wabaId: userData.whatsapp_business_account_id, phoneNumberId: userData.phone_number_id });
      setSavedOrgId(orgId.trim());
      setSavedOrgExternalId(account.OrganizationExternalID || "");
      setSavedDisplayPhoneNumber(account.DisplayPhoneNumber || "");
      toast({ title: "Connected", description: "WhatsApp account configured successfully." });
    } catch {
      toast({ title: "Error", description: "Failed to connect. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [setConfig, setSavedOrgId, setSavedOrgExternalId, setSavedDisplayPhoneNumber, toast]);

  useEffect(() => {
    setIsSuperAdmin(hasRole(getToken(), "SuperAdmin"));
  }, []);

  // Populate account details from stored config on load
  useEffect(() => {
    if (!isLoading && config.apiKey && config.wabaId && config.phoneNumberId) {
      setAccountDetails({
        apiKey: config.apiKey,
        wabaId: config.wabaId,
        phoneNumberId: config.phoneNumberId,
        displayPhoneNumber: savedDisplayPhoneNumber || "",
        organizationExternalId: savedOrgExternalId || "",
      });
    }
  }, [config, isLoading, savedDisplayPhoneNumber, savedOrgExternalId]);

  // Auto-verify when org ID arrives but WhatsApp isn't configured yet
  useEffect(() => {
    if (!isLoading && savedOrgId && !isConfigured) {
      handleVerifyAndSave(savedOrgId);
    }
  }, [isLoading, savedOrgId, isConfigured, handleVerifyAndSave]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>WhatsApp Connection</CardTitle>
            <CardDescription>
              Automatically configured from your PeakMobile account
            </CardDescription>
          </div>
          <Badge
            variant={isLoading || loading ? "outline" : isConfigured ? "default" : "secondary"}
            className="flex items-center gap-1.5"
          >
            {isLoading || loading ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" />{loading ? "Connecting..." : "Loading..."}</>
            ) : isConfigured ? (
              <><CheckCircle className="h-3.5 w-3.5" />Connected</>
            ) : (
              <><Circle className="h-3.5 w-3.5" />Not Connected</>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConfigured && !loading && (
          <p className="text-sm text-muted-foreground">
            Your WhatsApp account will be configured automatically when you open this app from PeakMobile. If you are seeing this, please return to PeakMobile and reopen the app from there.
          </p>
        )}

        {accountDetails && (
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              Account Details
            </h4>
            <div className="grid gap-3 text-sm">
              {accountDetails.organizationExternalId && (
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground text-xs">Organization ID</span>
                  <span className="font-mono text-xs break-all">{accountDetails.organizationExternalId}</span>
                </div>
              )}
              {accountDetails.displayPhoneNumber && (
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground text-xs">WhatsApp Number</span>
                  <span className="font-mono text-xs">{accountDetails.displayPhoneNumber}</span>
                </div>
              )}
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs">WABA ID</span>
                <span className="font-mono text-xs">{accountDetails.wabaId}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs">Phone Number ID</span>
                <span className="font-mono text-xs">{accountDetails.phoneNumberId}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => handleVerifyAndSave(savedOrgId)}
            disabled={loading || !savedOrgId}
            className="flex items-center gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {loading ? "Connecting..." : "Re-verify Connection"}
          </Button>
        </div>

        {isSuperAdmin && (
          <div className="pt-4 border-t border-border space-y-3">
            <div>
              <h4 className="text-sm font-medium text-foreground">Switch Organisation Account</h4>
              <p className="text-xs text-muted-foreground mt-1">
                As a Super Admin you can configure any organisation's WhatsApp account by entering their org UUID below.
              </p>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Paste organisation UUID..."
                value={overrideOrgId}
                onChange={(e) => setOverrideOrgId(e.target.value)}
                className="font-mono text-sm"
              />
              <Button
                onClick={() => handleVerifyAndSave(overrideOrgId)}
                disabled={loading || !overrideOrgId.trim()}
                className="flex items-center gap-2 shrink-0"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {loading ? "Verifying..." : "Verify & Apply"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
