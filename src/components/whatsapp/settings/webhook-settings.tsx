"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/whatsapp/ui/button";
import { Input } from "@/components/whatsapp/ui/input";
import { Label } from "@/components/whatsapp/ui/label";
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
import { getWebhook, setWebhook } from "@/lib/whatsapp/whatsapp-api";
import { Webhook, RefreshCw, Save, Loader2, Plus, Trash2, CheckCircle, XCircle } from "lucide-react";

interface WebhookHeader {
  key: string;
  value: string;
}

export function WebhookSettings() {
  const { config, isConfigured } = useConfig();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentWebhook, setCurrentWebhook] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    webhookUrl: "",
    headers: [] as WebhookHeader[],
  });

  const fetchWebhook = useCallback(async () => {
    if (!isConfigured) return;

    setLoading(true);
    const result = await getWebhook(config);
    setLoading(false);

    if (result.success && result.data) {
      setCurrentWebhook(result.data.webhook_url || null);
      setFormData({
        webhookUrl: result.data.webhook_url || "",
        headers: result.data.headers
          ? Object.entries(result.data.headers).map(([key, value]) => ({
              key,
              value: value as string,
            }))
          : [],
      });
    }
  }, [config, isConfigured]);

  useEffect(() => {
    fetchWebhook();
  }, [fetchWebhook]);

  const handleSave = async () => {
    if (!isConfigured) {
      toast({
        title: "Configuration Required",
        description: "Please configure your API settings first.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.webhookUrl) {
      toast({
        title: "Validation Error",
        description: "Webhook URL is required.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    const headers: Record<string, string> = {};
    for (const header of formData.headers) {
      if (header.key && header.value) {
        headers[header.key] = header.value;
      }
    }

    const result = await setWebhook(config, {
      webhook_url: formData.webhookUrl,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
    });

    setSaving(false);

    if (result.success) {
      toast({
        title: "Success",
        description: "Webhook configuration saved successfully.",
      });
      setCurrentWebhook(formData.webhookUrl);
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to save webhook configuration.",
        variant: "destructive",
      });
    }
  };

  const addHeader = () => {
    setFormData((prev) => ({
      ...prev,
      headers: [...prev.headers, { key: "", value: "" }],
    }));
  };

  const updateHeader = (index: number, field: "key" | "value", value: string) => {
    const newHeaders = [...formData.headers];
    newHeaders[index] = { ...newHeaders[index], [field]: value };
    setFormData((prev) => ({ ...prev, headers: newHeaders }));
  };

  const removeHeader = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      headers: prev.headers.filter((_, i) => i !== index),
    }));
  };

  if (!isConfigured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Webhook Configuration</CardTitle>
          <CardDescription>Configure your API settings to manage webhooks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Webhook className="h-12 w-12 text-muted-foreground/50" />
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
      {/* Current Webhook Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Current Webhook</CardTitle>
            <CardDescription>Your active webhook configuration</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchWebhook} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : currentWebhook ? (
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-success" />
                <div>
                  <p className="text-sm font-medium">Webhook Active</p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{currentWebhook}</p>
                </div>
              </div>
              <Badge className="bg-success/10 text-success border-success/30">Active</Badge>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">No Webhook Configured</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Configure a webhook to receive message callbacks
                  </p>
                </div>
              </div>
              <Badge variant="secondary">Inactive</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhook Form */}
      <Card>
        <CardHeader>
          <CardTitle>Configure Webhook</CardTitle>
          <CardDescription>
            Set up a webhook URL to receive delivery reports and incoming messages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="webhookUrl">Webhook URL</Label>
            <Input
              id="webhookUrl"
              placeholder="https://your-domain.com/webhook"
              value={formData.webhookUrl}
              onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Enter the URL where you want to receive webhook callbacks
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Custom Headers (Optional)</Label>
              <Button type="button" variant="outline" size="sm" onClick={addHeader}>
                <Plus className="mr-2 h-4 w-4" />
                Add Header
              </Button>
            </div>
            
            {formData.headers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No custom headers configured. Add headers for authentication or other purposes.
              </p>
            ) : (
              <div className="space-y-3">
                {formData.headers.map((header, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Input
                      placeholder="Header Name"
                      value={header.key}
                      onChange={(e) => updateHeader(index, "key", e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Header Value"
                      value={header.value}
                      onChange={(e) => updateHeader(index, "value", e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeHeader(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Webhook Configuration
          </Button>
        </CardContent>
      </Card>

      {/* Webhook Info */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook Events</CardTitle>
          <CardDescription>Events that will be sent to your webhook</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              { name: "Message Sent", description: "When a message is successfully sent" },
              { name: "Message Delivered", description: "When a message is delivered to the recipient" },
              { name: "Message Read", description: "When a message is read by the recipient" },
              { name: "Message Failed", description: "When a message fails to send" },
              { name: "Incoming Message", description: "When you receive a message from a user" },
              { name: "Status Update", description: "Message status updates" },
            ].map((event) => (
              <div key={event.name} className="rounded-lg border border-border p-3">
                <p className="text-sm font-medium">{event.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{event.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
