"use client";

import React, { useState, useEffect } from "react";
import { useConfig } from "@/lib/whatsapp/config-context";
import { useChannels } from "@/lib/whatsapp/use-channels";
import { useFlows } from "@/lib/whatsapp/use-flows";
import { FLOWBOT_BASE_URL, flowbotHeaders } from "@/lib/whatsapp/flowbot-api";
import { Button } from "@/components/whatsapp/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/whatsapp/ui/card";
import { Label } from "@/components/whatsapp/ui/label";
import { Input } from "@/components/whatsapp/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/whatsapp/ui/select";
import { Badge } from "@/components/whatsapp/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/whatsapp/ui/table";
import { Plus, Trash2 } from "lucide-react";

export function KeywordManager() {
  const { organizationExternalId } = useConfig();
  const { channels } = useChannels(organizationExternalId);
  const { flows } = useFlows(organizationExternalId);

  const [keywords, setKeywords] = useState<any[]>([]);
  const [keywordsLoading, setKeywordsLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<string>("");

  useEffect(() => {
    const fetchKeywords = async () => {
      try {
        const params = new URLSearchParams({
          orderby: "id DESC",
          "eq__organization_id": organizationExternalId,
          "eq__is_active": "true",
        });
        const response = await fetch(`${FLOWBOT_BASE_URL}/channel-keywords?${params}`, { headers: flowbotHeaders });
        if (response.ok) {
          const data = await response.json();
          setKeywords(data.results || []);
        }
      } catch (err) {
        console.error("Failed to fetch keywords:", err);
      } finally {
        setKeywordsLoading(false);
      }
    };
    if (organizationExternalId) fetchKeywords();
  }, [organizationExternalId]);
  const [selectedFlow, setSelectedFlow] = useState<string>("");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getFlowName = (flowId: number | string) => {
    const flow = flows.find((f: any) => f.id === Number(flowId));
    return flow ? flow.name : "—";
  };

  const handleAddKeyword = async () => {
    setError(null);

    if (!selectedChannel || !selectedFlow || !keyword.trim()) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${FLOWBOT_BASE_URL}/channel-keywords`, {
        method: "POST",
        headers: flowbotHeaders,
        body: JSON.stringify({
          channel_id: parseInt(selectedChannel),
          flow_id: parseInt(selectedFlow),
          keyword: keyword.trim(),
          is_default: false,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add keyword");
      }

      // Re-fetch the full list to get server-assigned IDs and linked data
      const listParams = new URLSearchParams({ orderby: "id DESC", "eq__organization_id": organizationExternalId, "eq__is_active": "true" });
      const listResponse = await fetch(`${FLOWBOT_BASE_URL}/channel-keywords?${listParams}`, { headers: flowbotHeaders });
      if (listResponse.ok) {
        const data = await listResponse.json();
        setKeywords(data.results || []);
      }
      setKeyword("");
      setSelectedChannel("");
      setSelectedFlow("");
      alert("Keyword added successfully!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add keyword";
      setError(message);
      console.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Flow Triggers</h3>
        <p className="text-sm text-muted-foreground">
          Add keywords that trigger specific flows
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add New Keyword</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Channel</Label>
              <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select channel" />
                </SelectTrigger>
                <SelectContent>
                  {channels.map((channel: any) => (
                    <SelectItem key={channel.id} value={channel.id.toString()}>
                      {channel.shortcode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Flow</Label>
              <Select value={selectedFlow} onValueChange={setSelectedFlow}>
                <SelectTrigger>
                  <SelectValue placeholder="Select flow" />
                </SelectTrigger>
                <SelectContent>
                  {flows.map((flow: any) => (
                    <SelectItem key={flow.id} value={flow.id.toString()}>
                      {flow.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Keyword</Label>
              <Input
                placeholder="e.g., LOAN, SUPPORT"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value.toUpperCase())}
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleAddKeyword}
                disabled={loading}
                className="w-full gap-2"
              >
                <Plus className="w-4 h-4" />
                {loading ? "Adding..." : "Add"}
              </Button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-900 rounded border border-red-200 text-sm">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        {keywordsLoading ? (
          <div className="p-6 text-center text-sm text-muted-foreground">Loading keywords...</div>
        ) : keywords.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">No keywords configured yet</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Keyword</TableHead>
                <TableHead>Channel ID</TableHead>
                <TableHead>Flow ID</TableHead>
                <TableHead>Flow Name</TableHead>
                <TableHead>Default</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keywords.map((kw: any) => (
                <TableRow key={kw.id}>
                  <TableCell className="font-medium">{kw.keyword}</TableCell>
                  <TableCell>{kw.channel_id}</TableCell>
                  <TableCell>{kw.flow_id}</TableCell>
                  <TableCell>{getFlowName(kw.flow_id)}</TableCell>
                  <TableCell>
                    {kw.is_default ? (
                      <Badge variant="default">Default</Badge>
                    ) : (
                      <Badge variant="outline">Optional</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        try {
                          const response = await fetch(`${FLOWBOT_BASE_URL}/trigger/${kw.id}/deactivate`, {
                            method: "PUT",
                            headers: flowbotHeaders,
                          });
                          if (response.ok) {
                            setKeywords(keywords.filter((k) => k.id !== kw.id));
                          }
                        } catch (err) {
                          console.error("Failed to deactivate keyword:", err);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}