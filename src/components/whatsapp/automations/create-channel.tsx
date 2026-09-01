"use client";

import React, { useState } from "react";
import { useConfig } from "@/lib/whatsapp/config-context";
import { FLOWBOT_BASE_URL, flowbotHeaders } from "@/lib/whatsapp/flowbot-api";
import { Button } from "@/components/whatsapp/ui/button";
import { Input } from "@/components/whatsapp/ui/input";
import { Label } from "@/components/whatsapp/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/whatsapp/ui/card";
import { ArrowLeft, Plus } from "lucide-react";

interface CreateChannelProps {
  onBack: () => void;
  onSuccess: () => void;
}

export function CreateChannel({ onBack, onSuccess }: CreateChannelProps) {
  const { organizationExternalId } = useConfig();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!phoneNumber.trim()) {
      setError("Phone number is required");
      return;
    }

    if (!organizationExternalId) {
      setError("Organization ID not found");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${FLOWBOT_BASE_URL}/channels`, {
        method: "POST",
        headers: flowbotHeaders,
        body: JSON.stringify({
          shortcode: phoneNumber,
          type: "WHATSAPP",
          organization_id: organizationExternalId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create channel");
      }

      alert("Channel created successfully!");
      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create channel";
      setError(message);
      console.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Channels
      </button>

      <Card>
        <CardHeader>
          <CardTitle>Create WhatsApp Channel</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="e.g., 254704965946"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter your WhatsApp business phone number including country code
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-900 rounded border border-red-200">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="gap-2">
                <Plus className="w-4 h-4" />
                {loading ? "Creating..." : "Create Channel"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
