"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/whatsapp/dashboard/header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/whatsapp/ui/tabs";
import { Card } from "@/components/whatsapp/ui/card";
import { Badge } from "@/components/whatsapp/ui/badge";
import { Button } from "@/components/whatsapp/ui/button";
import { Input } from "@/components/whatsapp/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/whatsapp/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/whatsapp/ui/table";
import { FLOWBOT_BASE_URL, flowbotHeaders } from "@/lib/whatsapp/flowbot-api";
import { useConfig } from "@/lib/whatsapp/config-context";
import { useFlows } from "@/lib/whatsapp/use-flows";
import {
  RefreshCw,
  Search,
  MessageSquare,
  Phone,
  Key,
  Bot,
  Users,
  TrendingUp,
  CheckCircle,
  Activity,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface FlowResponse {
  id: number;
  created_at: string;
  mobile_no: string;
  trigger_key: string;
  user_input: string;
  bot_response: string;
  session_id: number;
  flow_id: number;
  flow_name: string;
}

interface FlowAnalytics {
  flow_id: number;
  flow_name: string;
  total_users: number;
  total_responses: number;
  completed_users: number;
  completion_rate: number;
  avg_responses_per_user: number;
}

interface Contact {
  id: number;
  mobile_no: string;
  status: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

const PAGE_SIZE = 10;

// ── Contacts Tab ─────────────────────────────────────────────────────────

function ContactsTab() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchContacts = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${FLOWBOT_BASE_URL}/contacts?page=${p}&size=${PAGE_SIZE}`,
        { headers: flowbotHeaders }
      );
      if (res.ok) {
        const data = await res.json();
        setContacts(data.results || []);
        setTotal(data.count || 0);
      }
    } catch (err) {
      console.error("[v0] Failed to fetch contacts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchContacts(page); }, [page, fetchContacts]);

  const filtered = contacts.filter((c) =>
    c.mobile_no.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="icon" onClick={() => fetchContacts(page)} title="Refresh">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
        <div className="ml-auto text-sm text-muted-foreground">
          {total} total contacts
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading contacts...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No contacts found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Phone Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Added</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-sm">{c.mobile_no}</TableCell>
                  <TableCell>
                    <Badge
                      variant={c.status === "ACTIVE" ? "default" : "outline"}
                      className={c.status === "ACTIVE" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                    >
                      {c.status || "Unknown"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages} &mdash; {total} contacts
            </p>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                Previous
              </Button>
              <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Analytics Tab ─────────────────────────────────────────────────────────

function AnalyticsTab({ flows, flowsLoading }: { flows: any[]; flowsLoading: boolean }) {
  const [selectedFlowId, setSelectedFlowId] = useState<string>("");
  const [analytics, setAnalytics] = useState<FlowAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (flowId: string) => {
    if (!flowId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${FLOWBOT_BASE_URL}/flows/${flowId}/analytics`, {
        headers: flowbotHeaders,
      });
      if (!res.ok) throw new Error("Failed to fetch analytics");
      setAnalytics(await res.json());
    } catch {
      setError("Could not load analytics. Please try again.");
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedFlowId) fetchAnalytics(selectedFlowId);
  }, [selectedFlowId, fetchAnalytics]);

  const statCards = analytics
    ? [
        { icon: Users, label: "Total Users", value: analytics.total_users, color: "text-blue-600" },
        { icon: MessageSquare, label: "Total Responses", value: analytics.total_responses, color: "text-purple-600" },
        { icon: CheckCircle, label: "Completed Users", value: analytics.completed_users, color: "text-green-600" },
        {
          icon: TrendingUp,
          label: "Completion Rate",
          value: `${(analytics.completion_rate * 100).toFixed(1)}%`,
          color: "text-orange-600",
        },
        {
          icon: Activity,
          label: "Avg Responses / User",
          value: analytics.avg_responses_per_user.toFixed(2),
          color: "text-rose-600",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Select value={selectedFlowId} onValueChange={setSelectedFlowId}>
          <SelectTrigger className="w-72">
            <SelectValue placeholder={flowsLoading ? "Loading flows..." : "Select a flow"} />
          </SelectTrigger>
          <SelectContent>
            {flows.map((f) => (
              <SelectItem key={f.id} value={String(f.id)}>
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedFlowId && (
          <Button variant="outline" size="icon" onClick={() => fetchAnalytics(selectedFlowId)} title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        )}
      </div>

      {!selectedFlowId && (
        <Card className="p-12 text-center">
          <TrendingUp className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Select a flow to view its analytics.</p>
        </Card>
      )}

      {error && (
        <Card className="p-4 bg-red-50 text-red-900 border-red-200 text-sm">{error}</Card>
      )}

      {loading && (
        <Card className="p-8 text-center text-sm text-muted-foreground">Loading analytics...</Card>
      )}

      {!loading && analytics && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {statCards.map(({ icon: Icon, label, value, color }) => (
              <Card key={label} className="p-5">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <span className="text-xs font-medium">{label}</span>
                </div>
                <p className="text-3xl font-semibold tracking-tight">{value}</p>
              </Card>
            ))}
          </div>

          {analytics.completion_rate !== undefined && (
            <Card className="p-5">
              <p className="text-sm font-medium text-muted-foreground mb-3">Completion Rate</p>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all"
                  style={{ width: `${Math.min(100, analytics.completion_rate * 100)}%` }}
                />
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {analytics.completed_users} of {analytics.total_users} users completed the flow
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// ── Responses Tab ─────────────────────────────────────────────────────────

function ResponsesTab({ flows, flowsLoading }: { flows: any[]; flowsLoading: boolean }) {
  const [selectedFlowId, setSelectedFlowId] = useState<string>("");
  const [responses, setResponses] = useState<FlowResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const fetchResponses = useCallback(async (flowId: string) => {
    if (!flowId) return;
    setLoading(true);
    setError(null);
    try {
      const url = `${FLOWBOT_BASE_URL}/flows/${flowId}/responses`;
      const res = await fetch(url, { headers: flowbotHeaders });
      if (!res.ok) throw new Error("Failed to fetch responses");
      const data = await res.json();
      setResponses(Array.isArray(data) ? data : []);
      setPage(1);
    } catch {
      setError("Could not load responses. Please try again.");
      setResponses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedFlowId) fetchResponses(selectedFlowId);
  }, [selectedFlowId, fetchResponses]);

  const filtered = responses.filter(
    (r) =>
      r.mobile_no.includes(search) ||
      r.user_input.toLowerCase().includes(search.toLowerCase()) ||
      r.trigger_key.toLowerCase().includes(search.toLowerCase()) ||
      r.session_id.toString().includes(search)
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const getBotType = (response: string) => {
    if (response.startsWith("END")) return { label: "END", cls: "bg-red-100 text-red-800" };
    if (response.startsWith("CON")) return { label: "CON", cls: "bg-blue-100 text-blue-800" };
    return { label: "MSG", cls: "bg-gray-100 text-gray-700" };
  };

  const uniqueSessions = new Set(responses.map((r) => r.session_id)).size;
  const uniqueNumbers = new Set(responses.map((r) => r.mobile_no)).size;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={selectedFlowId} onValueChange={setSelectedFlowId}>
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue placeholder={flowsLoading ? "Loading flows..." : "Select a flow"} />
          </SelectTrigger>
          <SelectContent>
            {flows.map((f) => (
              <SelectItem key={f.id} value={String(f.id)}>
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedFlowId && (
          <>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by phone, input or session..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => fetchResponses(selectedFlowId)} title="Refresh">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </>
        )}
      </div>

      {!selectedFlowId && (
        <Card className="p-12 text-center">
          <MessageSquare className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Select a flow to view its response data.</p>
        </Card>
      )}

      {error && <Card className="p-4 bg-red-50 text-red-900 border-red-200 text-sm">{error}</Card>}

      {selectedFlowId && !loading && responses.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: MessageSquare, label: "Total Responses", value: responses.length },
            { icon: Phone, label: "Unique Numbers", value: uniqueNumbers },
            { icon: Key, label: "Sessions", value: uniqueSessions },
            { icon: Bot, label: "End Sessions", value: responses.filter((r) => r.bot_response.startsWith("END")).length },
          ].map(({ icon: Icon, label, value }) => (
            <Card key={label} className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Icon className="w-3.5 h-3.5" />
                <span className="text-xs">{label}</span>
              </div>
              <p className="text-2xl font-semibold">{value}</p>
            </Card>
          ))}
        </div>
      )}

      {loading && <Card className="p-8 text-center text-sm text-muted-foreground">Loading responses...</Card>}

      {!loading && selectedFlowId && responses.length === 0 && !error && (
        <Card className="p-8 text-center text-sm text-muted-foreground">No responses found for this flow.</Card>
      )}

      {!loading && paged.length > 0 && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Session</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>User Input</TableHead>
                <TableHead>Bot Response</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((r) => {
                const type = getBotType(r.bot_response);
                const body = r.bot_response.replace(/^(END|CON)\s*/, "");
                return (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{r.mobile_no}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">#{r.session_id}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-normal">{r.trigger_key}</Badge>
                    </TableCell>
                    <TableCell className="text-sm max-w-[160px] truncate" title={r.user_input}>
                      {r.user_input}
                    </TableCell>
                    <TableCell className="text-sm max-w-[240px]">
                      <div className="flex items-start gap-1.5">
                        <Badge className={`text-[10px] px-1.5 py-0 shrink-0 ${type.cls}`}>{type.label}</Badge>
                        <span className="truncate text-muted-foreground" title={body}>{body}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">
                {(page - 1) * PAGE_SIZE + 1}&ndash;{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                <span className="text-sm">Page {page} of {totalPages}</span>
                <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// ── Main Layout ───────────────────────────────────────────────────────────

export function ReportingLayout() {
  const { organizationExternalId } = useConfig();
  const { flows, loading: flowsLoading } = useFlows(organizationExternalId);

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        title="Reporting"
        description="View contacts, survey analytics and flow response data"
      />
      <div className="p-6 flex-1">
        <Tabs defaultValue="contacts">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="analytics">Survey Analytics</TabsTrigger>
            <TabsTrigger value="responses">Survey Responses</TabsTrigger>
          </TabsList>

          <TabsContent value="contacts">
            <ContactsTab />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsTab flows={flows} flowsLoading={flowsLoading} />
          </TabsContent>

          <TabsContent value="responses">
            <ResponsesTab flows={flows} flowsLoading={flowsLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
