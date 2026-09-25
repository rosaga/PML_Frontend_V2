"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/whatsapp/ui/badge";
import { Button } from "@/components/whatsapp/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/whatsapp/ui/dialog";
import { Input } from "@/components/whatsapp/ui/input";
import { Label } from "@/components/whatsapp/ui/label";
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
import { useToast } from "@/hooks/whatsapp/use-toast";
import {
  getMetaFlowSubmissions,
  type MetaFlowSubmission,
} from "@/lib/whatsapp/meta-flows-api";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, RefreshCw, Search, X } from "lucide-react";

interface MetaFlowSubmissionsProps {
  flowId: string;
  flowName?: string;
  metaFlowId?: string;
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function humanizeResponseKey(key: string) {
  return key
    .replace(/^screen_\d+_/i, "")
    .replace(/_\d+$/i, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatAnswerValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (Array.isArray(value)) return value;
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function formatArrayItem(value: unknown) {
  if (value !== null && typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return String(value).replace(/^\d+_/, "").replace(/_/g, " ");
}

function ResponseJsonView({ response }: { response?: Record<string, unknown> }) {
  const entries = useMemo(
    () => Object.entries(response || {}).filter(([key]) => key !== "flow_token"),
    [response]
  );

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No response data available.</p>;
  }

  return (
    <div className="space-y-3">
      {entries.map(([key, value]) => {
        const formattedValue = formatAnswerValue(value);
        return (
          <div key={key} className="rounded-md border border-border p-3">
            <div className="text-xs font-medium uppercase text-muted-foreground">
              {humanizeResponseKey(key)}
            </div>
            {Array.isArray(formattedValue) ? (
              <div className="mt-2 space-y-2">
                {formattedValue.map((item, index) => (
                  item !== null && typeof item === "object" ? (
                    <pre key={`${key}-${index}`} className="overflow-auto rounded-md bg-muted p-3 text-xs">
                      {formatArrayItem(item)}
                    </pre>
                  ) : (
                    <Badge key={`${key}-${index}`} variant="secondary">
                      {formatArrayItem(item)}
                    </Badge>
                  )
                ))}
              </div>
            ) : (
              <div className="mt-1 whitespace-pre-wrap break-words text-sm">
                {String(formattedValue).replace(/^\d+_/, "").replace(/_/g, " ")}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function MetaFlowSubmissions({ flowId, flowName, metaFlowId }: MetaFlowSubmissionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<MetaFlowSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<MetaFlowSubmission | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ limit: 20, page: 1, total_pages: 1 });
  const [filters, setFilters] = useState({
    mobile_no: "",
    submitted_from: "",
    submitted_to: "",
    limit: "20",
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  const displayFlowName = flowName || selectedSubmission?.flow_name || metaFlowId || flowId;

  const fetchSubmissions = useCallback(async (targetPage: number) => {
    setLoading(true);
    const result = await getMetaFlowSubmissions(flowId, {
      page: targetPage,
      limit: Number(appliedFilters.limit) || 20,
      mobile_no: appliedFilters.mobile_no.trim() || undefined,
      submitted_from: appliedFilters.submitted_from || undefined,
      submitted_to: appliedFilters.submitted_to || undefined,
    });
    setLoading(false);

    if (result.success && result.data) {
      setSubmissions(result.data.data || []);
      setMeta(result.data.meta || { limit: Number(appliedFilters.limit) || 20, page: targetPage, total_pages: 1 });
      setPage(result.data.meta?.page || targetPage);
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to fetch submissions.",
        variant: "destructive",
      });
    }
  }, [appliedFilters, flowId, toast]);

  useEffect(() => {
    fetchSubmissions(1);
  }, [fetchSubmissions]);

  const handleSearch = () => {
    setPage(1);
    setAppliedFilters(filters);
  };

  const clearFilters = () => {
    const emptyFilters = {
      mobile_no: "",
      submitted_from: "",
      submitted_to: "",
      limit: "20",
    };
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPage(1);
  };

  const openSubmission = (submission: MetaFlowSubmission) => {
    setSelectedSubmission(submission);
    setDetailOpen(true);
  };

  const hasActiveFilters = Boolean(filters.mobile_no || filters.submitted_from || filters.submitted_to);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" onClick={() => router.push("/apps/whatsapp/meta-flows")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Meta Flows &amp; Catalogues
          </Button>
          <h2 className="mt-3 text-xl font-semibold">{displayFlowName}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Record ID: {flowId}{metaFlowId ? ` - Flow ID: ${metaFlowId}` : ""}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4">
        <div className="min-w-[180px] flex-1 space-y-2">
          <Label htmlFor="submission-mobile">Mobile Number</Label>
          <Input
            id="submission-mobile"
            placeholder="254711438911"
            value={filters.mobile_no}
            onChange={(e) => setFilters({ ...filters, mobile_no: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="submitted-from">Submitted From</Label>
          <Input
            id="submitted-from"
            type="date"
            value={filters.submitted_from}
            onChange={(e) => setFilters({ ...filters, submitted_from: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="submitted-to">Submitted To</Label>
          <Input
            id="submitted-to"
            type="date"
            value={filters.submitted_to}
            onChange={(e) => setFilters({ ...filters, submitted_to: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Limit</Label>
          <Select value={filters.limit} onValueChange={(limit: string) => setFilters({ ...filters, limit })}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleSearch} disabled={loading}>
          <Search className="mr-2 h-4 w-4" />
          Search
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters}>
            <X className="mr-2 h-4 w-4" />
            Clear
          </Button>
        )}
        <Button variant="outline" onClick={() => fetchSubmissions(page)} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {submissions.length} submission{submissions.length !== 1 ? "s" : ""} found
        </p>
        <p className="text-sm text-muted-foreground">
          Page {meta.page} of {meta.total_pages || 1}
        </p>
      </div>

      {loading && submissions.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h3 className="text-lg font-medium text-foreground">No Submissions</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            No submissions match this flow and filter set.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contact ID</TableHead>
                <TableHead>Mobile Number</TableHead>
                <TableHead>Flow Token</TableHead>
                <TableHead>Submitted At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((submission) => (
                <TableRow
                  key={submission.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => openSubmission(submission)}
                >
                  <TableCell className="font-medium">{submission.contact_id}</TableCell>
                  <TableCell>{submission.mobile_no}</TableCell>
                  <TableCell className="max-w-[220px] truncate">{submission.flow_token || "-"}</TableCell>
                  <TableCell>{formatDateTime(submission.submitted_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={loading || page <= 1}
          onClick={() => fetchSubmissions(page - 1)}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={loading || page >= meta.total_pages}
          onClick={() => fetchSubmissions(page + 1)}
        >
          Next
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="left-auto right-0 top-0 h-full max-h-screen w-full max-w-xl translate-x-0 translate-y-0 overflow-y-auto rounded-none sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
            <DialogDescription>
              {selectedSubmission?.mobile_no || "Loading submission"}
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission ? (
            <div className="space-y-6">
              <div className="grid gap-3 rounded-lg border border-border p-4 text-sm sm:grid-cols-2">
                <div>
                  <div className="text-xs text-muted-foreground">Contact ID</div>
                  <div className="font-medium">{selectedSubmission.contact_id}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Mobile Number</div>
                  <div className="font-medium">{selectedSubmission.mobile_no}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Item Name</div>
                  <div className="font-medium">{selectedSubmission.flow_name || flowName || "-"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Submitted At</div>
                  <div className="font-medium">{formatDateTime(selectedSubmission.submitted_at)}</div>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold">Responses</h3>
                <ResponseJsonView response={selectedSubmission.response_json} />
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold">Raw JSON</h3>
                <pre className="max-h-72 overflow-auto rounded-md bg-muted p-3 text-xs">
                  {JSON.stringify(selectedSubmission.response_json || {}, null, 2)}
                </pre>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
