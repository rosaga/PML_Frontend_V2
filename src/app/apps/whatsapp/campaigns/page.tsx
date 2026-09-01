"use client";

import { useState, useEffect, useCallback } from "react";
import { useConfig } from "@/lib/whatsapp/config-context";
import { DashboardLayout } from "@/components/whatsapp/dashboard/layout";
import { Header } from "@/components/whatsapp/dashboard/header";
import { Card } from "@/components/whatsapp/ui/card";
import { Badge } from "@/components/whatsapp/ui/badge";
import { Button } from "@/components/whatsapp/ui/button";
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
  ArrowRight,
  Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";
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
  success_count: number;
  failed_count: number;
  sent_count: number;
  delivered_count: number;
  campaign_read_count: number;
  response_count: number;
  interactive_count: number;
  notification_count: number;
  text_count: number;
  success_rate: number;
  failure_rate: number;
  created_at: string;
  updated_at: string;
  created_by: string;
}

function formatDate(dateString: string) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function DeliveryBadge({ campaign }: { campaign: Campaign }) {
  const processed = campaign.delivered_count + campaign.sent_count + campaign.failed_count;
  if (campaign.total_messages === 0) {
    return <Badge variant="secondary">Pending</Badge>;
  }
  if (processed >= campaign.total_messages) {
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
  }
  return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">In Progress</Badge>;
}

function pct(n: number, total: number) {
  if (!total) return "0%";
  return `${((n / total) * 100).toFixed(0)}%`;
}

function CampaignsContent() {
  const router = useRouter();
  const { organizationId, isLoading: contextLoading } = useConfig();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const limit = 10;

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const fetchCampaigns = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/whatsapp/peakdata/campaign/stats?organizationId=${encodeURIComponent(organizationId)}&page=${page}&limit=${limit}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (Array.isArray(data?.data)) {
        setCampaigns(data.data);
        setTotal(data.total ?? data.data.length);
      }
    } catch (err) {
      console.error("[campaigns] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [organizationId, page]);

  useEffect(() => {
    if (!contextLoading && organizationId) fetchCampaigns();
  }, [contextLoading, organizationId, fetchCampaigns]);

  return (
    <div className="min-h-screen">
      <Header
        title="Campaigns"
        description="View all WhatsApp campaign performance and delivery stats"
      />

      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-muted-foreground">
            {total > 0 ? `${total} campaign${total !== 1 ? "s" : ""}` : ""}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCampaigns}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Create Campaign
            </Button>
          </div>
        </div>

        <Dialog
          open={showCreate}
          onOpenChange={(open) => {
            setShowCreate(open);
            if (!open) fetchCampaigns();
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Campaign</DialogTitle>
            </DialogHeader>
            <CampaignForm onSuccess={() => { setShowCreate(false); fetchCampaigns(); }} />
          </DialogContent>
        </Dialog>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading campaigns...
          </div>
        ) : campaigns.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <Megaphone className="h-10 w-10 opacity-30" />
              <p className="text-sm">No campaigns found</p>
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
                    <TableHead>Created By</TableHead>
                    <TableHead className="text-center">Total Messages</TableHead>
                    <TableHead className="text-center">Sent</TableHead>
                    <TableHead className="text-center">Failed</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((c) => {
                    const sentTotal = c.sent_count + c.delivered_count;
                    return (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/campaigns/${c.id}`)}
                    >
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {c.group_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {c.created_by || "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        {c.total_messages.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center leading-tight">
                          <span className="font-medium text-emerald-700">{sentTotal.toLocaleString()}</span>
                          <span className="text-xs text-muted-foreground">{pct(sentTotal, c.total_messages)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center leading-tight">
                          <span className="font-medium text-red-600">{c.failed_count.toLocaleString()}</span>
                          <span className="text-xs text-muted-foreground">{pct(c.failed_count, c.total_messages)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(c.created_at)}
                      </TableCell>
                      <TableCell>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                    );
                  })}
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
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
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
  return (
    <DashboardLayout>
      <CampaignsContent />
    </DashboardLayout>
  );
}
