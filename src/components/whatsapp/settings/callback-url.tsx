"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2, RefreshCw, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/whatsapp/ui/button";
import { Input } from "@/components/whatsapp/ui/input";
import { Label } from "@/components/whatsapp/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/whatsapp/ui/card";
import { useConfig } from "@/lib/whatsapp/config-context";
import { useToast } from "@/hooks/whatsapp/use-toast";

export function CallbackUrlSettings() {
  const { organizationId, isLoading } = useConfig();
  // Remount on account changes so an unsaved URL cannot carry into another account.
  return <CallbackUrlForm key={organizationId} externalId={isLoading ? "" : organizationId} />;
}

function CallbackUrlForm({ externalId }: { externalId: string }) {
  const { signalPmlUnauthorized } = useConfig();
  const { toast } = useToast();
  const [callbackUrl, setCallbackUrl] = useState("");
  const [savedUrl, setSavedUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!externalId) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setLoadError("");

    async function load() {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          signalPmlUnauthorized();
          throw new Error("Sign in again to manage your callback URL.");
        }
        const response = await fetch(`/api/whatsapp/account/callback?external_id=${encodeURIComponent(externalId)}`, {
          headers: { "x-auth-token": token }, cache: "no-store", signal: controller.signal,
        });
        if (response.status === 401) signalPmlUnauthorized();
        const result = await response.json();
        if (!response.ok || typeof result.data?.callback_url !== "string") {
          throw new Error(result.error || "Unable to load the callback URL.");
        }
        if (!controller.signal.aborted) {
          setCallbackUrl(result.data.callback_url);
          setSavedUrl(result.data.callback_url);
        }
      } catch (error) {
        if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : "Unable to load the callback URL.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [externalId, refresh, signalPmlUnauthorized]);

  async function save(url: string) {
    if (saving || loading || loadError || !externalId) return;
    setSaving(true);
    setSaveError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        signalPmlUnauthorized();
        throw new Error("Sign in again to manage your callback URL.");
      }
      const response = await fetch("/api/whatsapp/account/callback", {
        method: "POST",
        headers: { "x-auth-token": token, "Content-Type": "application/json" },
        body: JSON.stringify({ external_id: externalId, callback_url: url }),
      });
      if (response.status === 401) signalPmlUnauthorized();
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save the callback URL.");
      setSavedUrl(url);
      setCallbackUrl(url);
      toast({ title: url ? "Callback URL saved" : "Callback URL removed" });
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save the callback URL. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    save(callbackUrl.trim());
  }

  const disabled = loading || saving || !!loadError || !externalId;

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Callback URL</CardTitle>
        <CardDescription>Receive WhatsApp callbacks at your own endpoint when using the API.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading callback URL...
          </p>
        ) : loadError ? (
          <div className="space-y-3">
            <p role="alert" className="text-sm text-destructive">{loadError}</p>
            <Button variant="outline" onClick={() => setRefresh((value) => value + 1)}>
              <RefreshCw className="mr-2 h-4 w-4" /> Retry
            </Button>
          </div>
        ) : !externalId ? (
          <p className="text-sm text-muted-foreground">Select an organization to manage its callback URL.</p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="account-callback-url">Callback URL</Label>
              <Input
                id="account-callback-url" type="url" placeholder="https://your-domain.com/whatsapp/callback"
                value={callbackUrl} disabled={disabled} aria-describedby="callback-url-help"
                onChange={(event) => { setCallbackUrl(event.target.value); setSaveError(""); }}
              />
              <p id="callback-url-help" className="text-xs text-muted-foreground">
                Enter a public HTTP or HTTPS URL. Clear the field and save, or choose Remove, to stop callbacks.
              </p>
            </div>
            <p className="text-sm text-muted-foreground break-all" role="status">
              {savedUrl ? `Configured URL: ${savedUrl}` : "No callback URL configured."}
            </p>
            {saveError && <p role="alert" className="text-sm text-destructive">{saveError}</p>}
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={disabled || callbackUrl.trim() === savedUrl}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {saving ? "Saving..." : "Save Callback URL"}
              </Button>
              {savedUrl && (
                <Button type="button" variant="outline" disabled={disabled} onClick={() => save("")}>
                  <Trash2 className="mr-2 h-4 w-4" /> Remove
                </Button>
              )}
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
