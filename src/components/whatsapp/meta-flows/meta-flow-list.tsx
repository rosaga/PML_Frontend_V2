"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/whatsapp/ui/badge";
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
import { useToast } from "@/hooks/whatsapp/use-toast";
import { useConfig } from "@/lib/whatsapp/config-context";
import { getMetaFlows, type MetaFlow } from "@/lib/whatsapp/meta-flows-api";
import { FileText, Loader2, RefreshCw, Search, X } from "lucide-react";

interface MetaFlowListProps {
  refreshTrigger?: number;
}

export function MetaFlowList({ refreshTrigger }: MetaFlowListProps) {
  const { organizationExternalId, organizationId, isLoading } = useConfig();
  const { toast } = useToast();
  const [flows, setFlows] = useState<MetaFlow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchName, setSearchName] = useState("");

  const effectiveOrganizationId = organizationExternalId || organizationId;

  const fetchFlows = useCallback(async () => {
    if (!effectiveOrganizationId || isLoading) return;

    setLoading(true);
    const result = await getMetaFlows(effectiveOrganizationId);
    setLoading(false);

    if (result.success && result.data) {
      setFlows(result.data.data || []);
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to fetch Meta Flows.",
        variant: "destructive",
      });
    }
  }, [effectiveOrganizationId, isLoading, toast]);

  useEffect(() => {
    fetchFlows();
  }, [fetchFlows, refreshTrigger]);

  const filteredFlows = useMemo(() => {
    const term = searchName.trim().toLowerCase();
    if (!term) return flows;
    return flows.filter((flow) =>
      [flow.flow_name, flow.flow_id, flow.default_cta, flow.default_screen, flow.status]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [flows, searchName]);

  const getStatusBadgeVariant = (status?: string) => {
    switch (status?.toUpperCase()) {
      case "ACTIVE":
      case "LIVE":
        return "default";
      case "DRAFT":
      case "PENDING":
        return "secondary";
      case "DEPRECATED":
      case "INACTIVE":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (!effectiveOrganizationId && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-medium text-foreground">Not Configured</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Organization ID not found. Please configure it in Settings.
        </p>
      </div>
    );
  }

  const hasActiveFilters = Boolean(searchName);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search Meta Flows..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="pl-9"
          />
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={() => setSearchName("")}>
            <X className="mr-2 h-4 w-4" />
            Clear
          </Button>
        )}

        <Button variant="outline" size="sm" onClick={fetchFlows} disabled={loading || isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredFlows.length} Meta Flow{filteredFlows.length !== 1 ? "s" : ""} found
          {hasActiveFilters && " (filtered)"}
        </p>
      </div>

      {loading && flows.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredFlows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium text-foreground">No Meta Flows</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {hasActiveFilters ? "No Meta Flows match your search." : "Add your first Meta Flow to get started."}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Flow ID</TableHead>
                <TableHead>CTA</TableHead>
                <TableHead>Default Screen</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFlows.map((flow) => (
                <TableRow key={flow.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/apps/whatsapp/meta-flows/${encodeURIComponent(String(flow.id))}/submissions?flowName=${encodeURIComponent(flow.flow_name)}&flowId=${encodeURIComponent(flow.flow_id)}`}
                      className="text-primary hover:underline"
                    >
                      {flow.flow_name}
                    </Link>
                  </TableCell>
                  <TableCell>{flow.flow_id}</TableCell>
                  <TableCell>{flow.default_cta}</TableCell>
                  <TableCell>{flow.default_screen}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(flow.status)}>
                      {flow.status || "Unknown"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {flow.created_at ? new Date(flow.created_at).toLocaleDateString() : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
