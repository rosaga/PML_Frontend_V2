"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useConfig } from "@/lib/whatsapp/config-context";
import { DashboardLayout } from "@/components/whatsapp/dashboard/layout";
import { Header } from "@/components/whatsapp/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/whatsapp/ui/card";
import { Badge } from "@/components/whatsapp/ui/badge";
import { Button } from "@/components/whatsapp/ui/button";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import {
  ArrowLeft,
  Loader2,
  Users,
  Send,
  MessageSquare,
  Calendar,
  Layers,
} from "lucide-react";

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
  return new Date(dateString).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start gap-3">
          <div
            className="rounded-lg p-2 mt-0.5"
            style={{ backgroundColor: color ? `${color}15` : "#6366f115" }}
          >
            <Icon className="h-5 w-5" style={{ color: color ?? "#6366f1" }} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
            <p className="text-2xl font-semibold leading-none">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function pct(n: number, total: number) {
  if (!total) return "0%";
  return `${((n / total) * 100).toFixed(1)}%`;
}

function DeliveryBar({ campaign }: { campaign: Campaign }) {
  const total = campaign.total_messages;
  if (total === 0) return null;

  const segments = [
    { label: "Delivered", count: campaign.delivered_count, color: "bg-emerald-500" },
    { label: "Sent", count: campaign.sent_count, color: "bg-amber-400" },
  ];

  return (
    <div className="space-y-4">
      {segments.map(({ label, count, color }) => {
        const pctVal = total ? (count / total) * 100 : 0;
        return (
          <div key={label} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${color} inline-block`} />
                {label}
              </span>
              <span className="text-muted-foreground tabular-nums">
                {count.toLocaleString()} <span className="text-xs">({pctVal.toFixed(1)}%)</span>
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full ${color} transition-all`}
                style={{ width: `${pctVal}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Success rate, Failure rate
const CHART_COLORS = ["#10b981", "#ef4444"];

function CampaignDetailContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { organizationId, isLoading: contextLoading } = useConfig();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (contextLoading || !organizationId) return;

    async function load() {
      setLoading(true);
      try {
        // Fetch all campaigns (use high limit) to find by ID
        const res = await fetch(
          `/api/whatsapp/peakdata/campaign/stats?organizationId=${encodeURIComponent(organizationId)}&page=1&limit=100`,
          { cache: "no-store" }
        );
        const data = await res.json();
        if (Array.isArray(data?.data)) {
          const found = data.data.find((c: Campaign) => String(c.id) === String(id));
          if (found) {
            setCampaign(found);
          } else {
            setNotFound(true);
          }
        }
      } catch (err) {
        console.error("[campaign detail] error:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [contextLoading, organizationId, id]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header title="Campaign Details" description="" />
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Loading campaign...
        </div>
      </div>
    );
  }

  if (notFound || !campaign) {
    return (
      <div className="min-h-screen">
        <Header title="Campaign Details" description="" />
        <div className="p-6">
          <p className="text-muted-foreground text-sm">Campaign not found.</p>
          <Button variant="ghost" size="sm" onClick={() => router.push("/apps/whatsapp/campaigns")} className="mt-3">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Campaigns
          </Button>
        </div>
      </div>
    );
  }

  const pieData = [
    { name: "Success", value: campaign.success_rate },
    { name: "Failed", value: campaign.failure_rate },
  ].filter((d) => d.value > 0);

  const sentTotal = campaign.sent_count + campaign.delivered_count;

  const isCompleted =
    campaign.total_messages > 0 &&
    campaign.success_count + campaign.failed_count >= campaign.total_messages;

  return (
    <div className="min-h-screen">
      <Header
        title={campaign.name}
        description={`Campaign delivered to group: ${campaign.group_name}`}
      />

      <div className="p-6 space-y-6">
        {/* Back + status */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/apps/whatsapp/campaigns")}
            className="text-muted-foreground -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            All Campaigns
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {formatDate(campaign.created_at)}
            <Badge
              className={
                isCompleted
                  ? "bg-green-100 text-green-800 hover:bg-green-100 ml-2"
                  : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 ml-2"
              }
            >
              {isCompleted ? "Completed" : "In Progress"}
            </Badge>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard
            icon={Users}
            label="Total Messages"
            value={campaign.total_messages.toLocaleString()}
            sub={`${campaign.contacts_count} recipients`}
            color="#6366f1"
          />
          <StatCard
            icon={Send}
            label="Sent Messages"
            value={sentTotal.toLocaleString()}
            sub={pct(sentTotal, campaign.total_messages) + " of total"}
            color="#10b981"
          />
          <StatCard
            icon={MessageSquare}
            label="Failed Messages"
            value={campaign.failed_count.toLocaleString()}
            sub={pct(campaign.failed_count, campaign.total_messages) + " of total"}
            color="#ef4444"
          />
        </div>

        {/* Delivery progress bar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              Delivery Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DeliveryBar campaign={campaign} />
          </CardContent>
        </Card>

        {/* Pie chart */}
        {pieData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Delivery Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) =>
                      `${name} ${(value as number).toFixed(1)}%`
                    }
                    labelLine={false}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: unknown, name: unknown) => [
                      typeof value === "number" ? `${value.toFixed(1)}%` : String(value),
                      String(name),
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Campaign info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Campaign Info</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Campaign ID</dt>
                <dd className="font-mono mt-0.5">{campaign.id}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Group</dt>
                <dd className="mt-0.5">{campaign.group_name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Created</dt>
                <dd className="mt-0.5">{formatDate(campaign.created_at)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Last Updated</dt>
                <dd className="mt-0.5">{formatDate(campaign.updated_at)}</dd>
              </div>
              {campaign.created_by && (
                <div>
                  <dt className="text-muted-foreground">Created By</dt>
                  <dd className="mt-0.5">{campaign.created_by}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function CampaignDetailPage() {
  return (
    <DashboardLayout>
      <CampaignDetailContent />
    </DashboardLayout>
  );
}
