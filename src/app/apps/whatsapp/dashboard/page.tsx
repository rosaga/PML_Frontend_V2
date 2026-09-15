"use client";

import { useState, useEffect } from "react";
import { useConfig } from "@/lib/whatsapp/config-context";
import { DashboardLayout } from "@/components/whatsapp/dashboard/layout";
import { Header } from "@/components/whatsapp/dashboard/header";
import { BalanceCard } from "@/components/whatsapp/dashboard/balance-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/whatsapp/ui/card";
import { Badge } from "@/components/whatsapp/ui/badge";
import { Input } from "@/components/whatsapp/ui/input";
import { Button } from "@/components/whatsapp/ui/button";
import { Send, CheckCircle2, AlertCircle, Clock, TrendingUp, MessageSquare, CheckCheck } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface Stats {
  total: number;
  totalSent: number;
  totalReceived: number;
  sent: number;
  delivered: number;
  read: number;
  queued: number;
  failed: number;
  outboundTotal: number;
  outboundSent: number;
  outboundDelivered: number;
  outboundRead: number;
  outboundFailed: number;
  notification: number;
  feedback: number;
  response: number;
  utility: number;
  marketing: number;
  authentication: number;
}

const STATUS_COLORS = {
  SENT: "#3b82f6",
  DELIVERED: "#10b981",
  READ: "#8b5cf6",
  QUEUED: "#f59e0b",
  FAILED: "#ef4444",
};

const TYPE_COLORS = {
  NOTIFICATION: "#3b82f6",
  FEEDBACK: "#8b5cf6",
  RESPONSE: "#ec4899",
};

const CATEGORY_COLORS = {
  UTILITY: "#10b981",
  MARKETING: "#f59e0b",
  AUTHENTICATION: "#ef4444",
};

function DashboardContent() {
  const { organizationExternalId, isLoading: contextLoading } = useConfig();
  const [stats, setStats] = useState<Stats>({
    total: 0, totalSent: 0, totalReceived: 0,
    sent: 0, delivered: 0, read: 0, queued: 0, failed: 0,
    outboundTotal: 0, outboundSent: 0, outboundDelivered: 0, outboundRead: 0, outboundFailed: 0,
    notification: 0, feedback: 0, response: 0,
    utility: 0, marketing: 0, authentication: 0,
  });
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchStats = async (start?: string, end?: string) => {
    if (!organizationExternalId) return;
    setLoading(true);
    try {
      const formatDate = (d: string) => d ? new Date(d).toISOString() : "";
      const buildQuery = (filter: string) => {
        let q = `?page=1&size=2`;
        if (filter) q += `&${filter}`;
        if (start) q += `&gte__created_at=${encodeURIComponent(formatDate(start))}`;
        if (end) q += `&lte__created_at=${encodeURIComponent(formatDate(end))}`;
        return q;
      };
      const headers = { "x-organization-external-id": organizationExternalId };
      const base = "/api/whatsapp/whatsapp-internal/messages/list";

      const responses = await Promise.all([
        fetch(`${base}${buildQuery("")}`, { headers }),
        fetch(`${base}${buildQuery("ilike__direction=OUTBOUND")}`, { headers }),
        fetch(`${base}${buildQuery("ilike__direction=INBOUND")}`, { headers }),
        fetch(`${base}${buildQuery("ilike__status=SENT")}`, { headers }),
        fetch(`${base}${buildQuery("ilike__status=DELIVERED")}`, { headers }),
        fetch(`${base}${buildQuery("ilike__status=READ")}`, { headers }),
        fetch(`${base}${buildQuery("ilike__status=QUEUED")}`, { headers }),
        fetch(`${base}${buildQuery("ilike__status=FAILED")}`, { headers }),
        fetch(`${base}${buildQuery("ilike__direction=OUTBOUND&ilike__status=SENT")}`, { headers }),
        fetch(`${base}${buildQuery("ilike__direction=OUTBOUND&ilike__status=DELIVERED")}`, { headers }),
        fetch(`${base}${buildQuery("ilike__direction=OUTBOUND&ilike__status=READ")}`, { headers }),
        fetch(`${base}${buildQuery("ilike__direction=OUTBOUND&ilike__status=FAILED")}`, { headers }),
        fetch(`${base}${buildQuery("ilike__type=NOTIFICATION")}`, { headers }),
        fetch(`${base}${buildQuery("ilike__type=FEEDBACK")}`, { headers }),
        fetch(`${base}${buildQuery("ilike__type=RESPONSE")}`, { headers }),
        fetch(`${base}${buildQuery("ilike__category=UTILITY")}`, { headers }),
        fetch(`${base}${buildQuery("ilike__category=MARKETING")}`, { headers }),
        fetch(`${base}${buildQuery("ilike__category=AUTHENTICATION")}`, { headers }),
      ]);

      const data = await Promise.all(responses.map((r) => r.json()));
      setStats({
        total: data[0].count || 0,
        totalSent: data[1].count || 0,
        totalReceived: data[2].count || 0,
        sent: data[3].count || 0,
        delivered: data[4].count || 0,
        read: data[5].count || 0,
        queued: data[6].count || 0,
        failed: data[7].count || 0,
        outboundTotal: data[1].count || 0,
        outboundSent: data[8].count || 0,
        outboundDelivered: data[9].count || 0,
        outboundRead: data[10].count || 0,
        outboundFailed: data[11].count || 0,
        notification: data[12].count || 0,
        feedback: data[13].count || 0,
        response: data[14].count || 0,
        utility: data[15].count || 0,
        marketing: data[16].count || 0,
        authentication: data[17].count || 0,
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!contextLoading && organizationExternalId) fetchStats();
  }, [organizationExternalId, contextLoading]);

  const statusData = [
    { name: "Sent", value: stats.sent, fill: STATUS_COLORS.SENT },
    { name: "Delivered", value: stats.delivered, fill: STATUS_COLORS.DELIVERED },
    { name: "Read", value: stats.read, fill: STATUS_COLORS.READ },
    { name: "Queued", value: stats.queued, fill: STATUS_COLORS.QUEUED },
    { name: "Failed", value: stats.failed, fill: STATUS_COLORS.FAILED },
  ].filter((d) => d.value > 0);

  const typeData = [
    { name: "Notification", value: stats.notification, fill: TYPE_COLORS.NOTIFICATION },
    { name: "Feedback", value: stats.feedback, fill: TYPE_COLORS.FEEDBACK },
    { name: "Response", value: stats.response, fill: TYPE_COLORS.RESPONSE },
  ].filter((d) => d.value > 0);

  const categoryData = [
    { name: "Utility", value: stats.utility, fill: CATEGORY_COLORS.UTILITY },
    { name: "Marketing", value: stats.marketing, fill: CATEGORY_COLORS.MARKETING },
    { name: "Authentication", value: stats.authentication, fill: CATEGORY_COLORS.AUTHENTICATION },
  ].filter((d) => d.value > 0);

  const successRate = stats.outboundTotal > 0
    ? Math.round(((stats.outboundSent + stats.outboundDelivered + stats.outboundRead) / stats.outboundTotal) * 100)
    : 0;
  const failureRate = stats.outboundTotal > 0
    ? Math.round((stats.outboundFailed / stats.outboundTotal) * 100)
    : 0;

  return (
    <div className="min-h-screen">
      <Header title="Message Analytics" description="Real-time WhatsApp message statistics with advanced filtering" />

      <div className="p-6 space-y-6">
        {/* Date Filters */}
        <div className="flex items-center gap-3 pb-4">
          <Input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={loading} className="w-auto text-sm" />
          <span className="text-gray-400">to</span>
          <Input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={loading} className="w-auto text-sm" />
          <Button onClick={() => fetchStats(startDate, endDate)} disabled={loading} className="bg-[#001F3D] hover:bg-[#003366] text-sm px-4">
            {loading ? "Loading..." : "Apply"}
          </Button>
          <Button onClick={() => { setStartDate(""); setEndDate(""); fetchStats(); }} disabled={loading} variant="ghost" className="text-sm">
            Clear
          </Button>
        </div>

        {/* Hero Stat Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <BalanceCard />

          {[
            { label: "Total Sent", value: stats.totalSent, sub: "Outbound messages", color: "blue", icon: Send },
            { label: "Total Received", value: stats.totalReceived, sub: "Inbound messages", color: "purple", icon: MessageSquare },
            { label: "Success Rate", value: `${successRate}%`, sub: `${stats.outboundSent + stats.outboundDelivered + stats.outboundRead} of ${stats.outboundTotal} outbound`, color: "green", icon: CheckCheck },
            { label: "Failed", value: stats.failed, sub: `${failureRate}% failure rate`, color: "red", icon: AlertCircle },
          ].map(({ label, value, sub, color, icon: Icon }) => (
            <Card key={label} className={`border-l-4 border-l-${color}-500 shadow-md hover:shadow-lg transition-shadow overflow-hidden`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className={`text-sm font-medium text-gray-600 mb-2`}>{label}</p>
                    <div className={`text-3xl font-bold text-${color}-600`}>{value}</div>
                    <p className="text-xs text-gray-500 mt-1">{sub}</p>
                  </div>
                  <div className={`bg-${color}-100 p-4 rounded-full`}>
                    <Icon className={`h-8 w-8 text-${color}-600`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Status Breakdown */}
        <div className="grid gap-6 md:grid-cols-2">
          {statusData.length > 0 && (
            <Card className="shadow-md">
              <CardHeader><CardTitle>Message Status Distribution</CardTitle><CardDescription>Count by delivery status</CardDescription></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} dataKey="value">
                      {statusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip formatter={(v) => `${v}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-md">
            <CardHeader><CardTitle>Status Breakdown</CardTitle><CardDescription>Detailed message count by status</CardDescription></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: "Sent", value: stats.sent, bg: "blue", icon: Send },
                  { label: "Delivered", value: stats.delivered, bg: "green", icon: CheckCircle2 },
                  { label: "Read", value: stats.read, bg: "purple", icon: TrendingUp },
                  { label: "Queued", value: stats.queued, bg: "amber", icon: Clock },
                  { label: "Failed", value: stats.failed, bg: "red", icon: AlertCircle },
                ].map(({ label, value, bg, icon: Icon }) => (
                  <div key={label} className={`flex items-center justify-between p-3 rounded-lg bg-${bg}-50 border border-${bg}-200`}>
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 text-${bg}-600`} />
                      <span className="font-medium text-sm">{label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-${bg}-600`}>{value}</span>
                      {stats.total > 0 && <Badge variant="outline">{Math.round((value / stats.total) * 100)}%</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Message Types */}
        <div className="grid gap-6 md:grid-cols-2">
          {typeData.length > 0 && (
            <Card className="shadow-md">
              <CardHeader><CardTitle>Message Types Distribution</CardTitle><CardDescription>Count by message type</CardDescription></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={typeData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} dataKey="value">
                      {typeData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip formatter={(v) => `${v}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-md">
            <CardHeader><CardTitle>Message Types</CardTitle><CardDescription>Breakdown by type</CardDescription></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "Notification", value: stats.notification, color: TYPE_COLORS.NOTIFICATION },
                  { name: "Feedback", value: stats.feedback, color: TYPE_COLORS.FEEDBACK },
                  { name: "Response", value: stats.response, color: TYPE_COLORS.RESPONSE },
                ].map((t) => (
                  <div key={t.name} className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: `${t.color}40`, backgroundColor: `${t.color}08` }}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                      <span className="font-medium text-sm">{t.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold" style={{ color: t.color }}>{t.value}</span>
                      {stats.total > 0 && <Badge variant="outline">{Math.round((t.value / stats.total) * 100)}%</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Message Categories */}
        <div className="grid gap-6 md:grid-cols-2">
          {categoryData.length > 0 && (
            <Card className="shadow-md">
              <CardHeader><CardTitle>Message Categories Distribution</CardTitle><CardDescription>Count by category</CardDescription></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} dataKey="value">
                      {categoryData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip formatter={(v) => `${v}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-md">
            <CardHeader><CardTitle>Message Categories</CardTitle><CardDescription>Breakdown by category</CardDescription></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "Utility", value: stats.utility, color: CATEGORY_COLORS.UTILITY },
                  { name: "Marketing", value: stats.marketing, color: CATEGORY_COLORS.MARKETING },
                  { name: "Authentication", value: stats.authentication, color: CATEGORY_COLORS.AUTHENTICATION },
                ].map((c) => (
                  <div key={c.name} className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: `${c.color}40`, backgroundColor: `${c.color}08` }}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className="font-medium text-sm">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold" style={{ color: c.color }}>{c.value}</span>
                      {stats.total > 0 && <Badge variant="outline">{Math.round((c.value / stats.total) * 100)}%</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}
