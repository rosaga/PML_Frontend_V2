"use client";

import React, { useState, useEffect, useCallback } from "react";
import { FLOWBOT_BASE_URL, flowbotHeaders } from "@/lib/whatsapp/flowbot-api";
import { useConfig } from "@/lib/whatsapp/config-context";
import { useFlows } from "@/lib/whatsapp/use-flows";
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
import { RefreshCw, Search, MessageSquare, Phone, Key, Bot } from "lucide-react";

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

const PAGE_SIZE = 15;

export function FlowReports() {
  const { organizationExternalId } = useConfig();
  const { flows, loading: flowsLoading } = useFlows(organizationExternalId);

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
      const res = await fetch(`${FLOWBOT_BASE_URL}/flows/${flowId}/responses`, {
        headers: flowbotHeaders,
      });
      if (!res.ok) throw new Error("Failed to fetch responses");
      const data = await res.json();
      setResponses(Array.isArray(data) ? data : []);
      setPage(1);
    } catch (err) {
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

  const getBotResponseType = (response: string) => {
    if (response.startsWith("END"))
      return { label: "END", className: "bg-red-100 text-red-800" };
    if (response.startsWith("CON"))
      return { label: "CON", className: "bg-blue-100 text-blue-800" };
    return { label: "MSG", className: "bg-gray-100 text-gray-700" };
  };

  const stripPrefix = (response: string) =>
    response.replace(/^(END|CON)\s*/, "");

  const uniqueSessions = new Set(responses.map((r) => r.session_id)).size;
  const uniqueNumbers = new Set(responses.map((r) => r.mobile_no)).size;

  return (
    <div className="space-y-6">
      {/* Controls row */}
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
            <Button
              variant="outline"
              size="icon"
              onClick={() => fetchResponses(selectedFlowId)}
              disabled={loading}
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </>
        )}
      </div>

      {/* No flow selected */}
      {!selectedFlowId && (
        <Card className="p-12 text-center">
          <MessageSquare className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Select a flow to view its response data.</p>
        </Card>
      )}

      {/* Error state */}
      {error && (
        <Card className="p-4 bg-red-50 text-red-900 border-red-200 text-sm">{error}</Card>
      )}

      {/* Stats row */}
      {selectedFlowId && !loading && responses.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: MessageSquare, label: "Total Responses", value: responses.length },
            { icon: Phone, label: "Unique Numbers", value: uniqueNumbers },
            { icon: Key, label: "Sessions", value: uniqueSessions },
            {
              icon: Bot,
              label: "End Sessions",
              value: responses.filter((r) => r.bot_response.startsWith("END")).length,
            },
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

      {/* Loading skeleton */}
      {loading && (
        <Card className="p-8 text-center text-muted-foreground text-sm">Loading responses...</Card>
      )}

      {/* Empty results */}
      {!loading && selectedFlowId && responses.length === 0 && !error && (
        <Card className="p-8 text-center text-muted-foreground text-sm">
          No responses found for this flow.
        </Card>
      )}

      {/* Table */}
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
                const type = getBotResponseType(r.bot_response);
                return (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{r.mobile_no}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">#{r.session_id}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-normal">
                        {r.trigger_key}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm max-w-[160px] truncate" title={r.user_input}>
                      {r.user_input}
                    </TableCell>
                    <TableCell className="text-sm max-w-[240px]">
                      <div className="flex items-start gap-1.5">
                        <Badge className={`text-[10px] px-1.5 py-0 shrink-0 ${type.className}`}>
                          {type.label}
                        </Badge>
                        <span className="truncate text-muted-foreground" title={stripPrefix(r.bot_response)}>
                          {stripPrefix(r.bot_response)}
                        </span>
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
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  Previous
                </Button>
                <span className="text-sm">Page {page} of {totalPages}</span>
                <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
