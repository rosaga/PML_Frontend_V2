"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useConfig } from "@/lib/whatsapp/config-context";
import { getToken } from "@/lib/whatsapp/auth";
import { DashboardLayout } from "@/components/whatsapp/dashboard/layout";
import { Header } from "@/components/whatsapp/dashboard/header";
import { Card } from "@/components/whatsapp/ui/card";
import { Button } from "@/components/whatsapp/ui/button";
import { Input } from "@/components/whatsapp/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/whatsapp/ui/table";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  RefreshCw,
  Plus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/whatsapp/ui/dialog";
import { CampaignForm } from "@/components/whatsapp/messages/campaign-form";

interface Campaign {
  id: number;
  name: string;
  group_id: number;
  group_name: string;
  contacts_count: number;
  total_messages: number;
  failed_count: number;
  sent_count: number;
  delivered_count: number;
  campaign_read_count: number;
  button_click_count: number;
  cost: number;
  created_at: string;
}

interface CampaignPage {
  data: Campaign[];
  total: number;
  page: number;
  limit: number;
}

function formatDate(dateString: string) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function CampaignsContent() {
  const { organizationExternalId, isLoading: contextLoading, isVerifying, signalPmlUnauthorized } = useConfig();

  const [result, setResult] = useState<CampaignPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ search: "", groupId: "", page: 1 });
  const [revision, setRevision] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const limit = 10;

  const campaigns = result?.data ?? [];
  const total = result?.total ?? 0;
  const page = result?.page ?? filters.page;
  const totalPages = Math.max(1, Math.ceil(total / (result?.limit ?? limit)));
  const busy = loading || contextLoading || isVerifying || search.trim() !== filters.search;
  const refresh = () => setRevision((value) => value + 1);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFilters((current) => current.search === search.trim() ? current : { ...current, search: search.trim(), page: 1 });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (contextLoading || isVerifying) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setResult(null);

    async function loadCampaigns() {
      try {
        if (!organizationExternalId) throw new Error("Select and configure an organization to view campaigns.");
        const token = getToken();
        if (!token) {
          signalPmlUnauthorized();
          throw new Error("Sign in again to load campaigns.");
        }
        const params = new URLSearchParams({ organizationExternalId, page: String(filters.page), limit: String(limit) });
        if (filters.search) params.set("search", filters.search);
        if (filters.groupId) params.set("group_id", filters.groupId);
        const response = await fetch(`/api/whatsapp/peakdata/campaign/stats?${params}`, {
          cache: "no-store", headers: { "x-auth-token": token }, signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        if (response.status === 401) {
          signalPmlUnauthorized();
          throw new Error("Sign in again to load campaigns.");
        }
        if (!response.ok) throw new Error("Unable to load campaigns. Please try again.");
        const data: CampaignPage = await response.json();
        if (!Array.isArray(data?.data) || !Number.isInteger(data.total) || data.total < 0 || !Number.isInteger(data.page) || data.page < 1 || !Number.isInteger(data.limit) || data.limit < 1) {
          throw new Error("Unable to load campaigns. Please try again.");
        }
        if (controller.signal.aborted) return;
        const lastPage = Math.max(1, Math.ceil(data.total / data.limit));
        if (data.page > lastPage) setFilters((current) => ({ ...current, page: lastPage }));
        else setResult(data);
      } catch (err) {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Unable to load campaigns.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadCampaigns();
    return () => controller.abort();
  }, [contextLoading, isVerifying, organizationExternalId, filters.page, filters.search, filters.groupId, revision, signalPmlUnauthorized]);

  return (
    <div className="min-h-screen">
      <Header
        title="Campaigns"
        description="View all WhatsApp campaign performance and delivery stats"
      />

      <div className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <p className="text-sm text-muted-foreground">
            {!busy && !error && `${total} campaign${total !== 1 ? "s" : ""}`}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={busy}
            >
              <RefreshCw className={`h-4 w-4 mr-1.5 ${busy ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setShowCreate(true)} disabled={contextLoading || isVerifying || !organizationExternalId}>
              <Plus className="h-4 w-4 mr-1.5" />
              Create Campaign
            </Button>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap items-end gap-3">
          <label className="w-full max-w-md text-sm">Campaign name
            <Input className="mt-1.5" type="search" placeholder="Search campaigns..." value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
          <label className="w-full text-sm sm:w-48">Group ID (optional)
            <Input className="mt-1.5" type="number" min="1" step="1" placeholder="All groups" value={filters.groupId} onChange={(event) => { const groupId = event.target.value; setFilters((current) => ({ ...current, groupId, page: 1 })); }} />
          </label>
        </div>

        <Dialog
          open={showCreate}
          onOpenChange={(open) => {
            setShowCreate(open);
            if (!open) refresh();
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Campaign</DialogTitle>
            </DialogHeader>
            <CampaignForm onSuccess={() => { setShowCreate(false); refresh(); }} />
          </DialogContent>
        </Dialog>

        {busy ? (
          <div role="status" className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading campaigns...
          </div>
        ) : error ? (
          <Card>
            <div role="alert" className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="text-sm text-red-600">{error}</p>
              <Button variant="outline" size="sm" onClick={refresh}>Retry</Button>
            </div>
          </Card>
        ) : campaigns.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <Megaphone className="h-10 w-10 opacity-30" />
              <p className="text-sm">{filters.search || filters.groupId ? "No campaigns match these filters" : "No campaigns found"}</p>
            </div>
          </Card>
        ) : (
          <>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead className="text-center">Contacts</TableHead>
                    <TableHead className="text-center">Total Messages</TableHead>
                    <TableHead className="text-center">Sent</TableHead>
                    <TableHead className="text-center">Delivered</TableHead>
                    <TableHead className="text-center">Read</TableHead>
                    <TableHead className="text-center">Failed</TableHead>
                    <TableHead className="text-center">Button Clicks</TableHead>
                    <TableHead className="text-right">Cost (USD)</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium"><Link href={`/apps/whatsapp/campaigns/${c.id}`} className="hover:underline">{c.name}</Link></TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {c.group_name || "—"}
                      </TableCell>
                      <TableCell className="text-center">{c.contacts_count?.toLocaleString() ?? "—"}</TableCell>
                      <TableCell className="text-center">{c.total_messages?.toLocaleString() ?? "—"}</TableCell>
                      <TableCell className="text-center">{c.sent_count?.toLocaleString() ?? "—"}</TableCell>
                      <TableCell className="text-center">{c.delivered_count?.toLocaleString() ?? "—"}</TableCell>
                      <TableCell className="text-center">{c.campaign_read_count?.toLocaleString() ?? "—"}</TableCell>
                      <TableCell className="text-center text-red-600">{c.failed_count?.toLocaleString() ?? "—"}</TableCell>
                      <TableCell className="text-center">{c.button_click_count?.toLocaleString() ?? "—"}</TableCell>
                      <TableCell className="text-right">{c.cost?.toLocaleString(undefined, { style: "currency", currency: "USD" }) ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(c.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters((current) => ({ ...current, page: Math.max(1, page - 1) }))}
                    disabled={busy || page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters((current) => ({ ...current, page: Math.min(totalPages, page + 1) }))}
                    disabled={busy || page >= totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function CampaignsPage() {
  const { organizationExternalId } = useConfig();
  return (
    <DashboardLayout>
      <CampaignsContent key={organizationExternalId} />
    </DashboardLayout>
  );
}
