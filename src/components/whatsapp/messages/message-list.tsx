"use client";

import { useState, useEffect, useCallback } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/whatsapp/ui/card";
import { Input } from "@/components/whatsapp/ui/input";
import { Button } from "@/components/whatsapp/ui/button";
import { Badge } from "@/components/whatsapp/ui/badge";
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
import { Label } from "@/components/whatsapp/ui/label";
import { useConfig } from "@/lib/whatsapp/config-context";
import { getTemplates } from "@/lib/whatsapp/whatsapp-api";
import {
  Search,
  RefreshCw,
  Filter,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Download,
  ChevronDown,
} from "lucide-react";

interface Message {
  id: number;
  organization_external_id: string;
  contact_id: number | null;
  mobile_no: string;
  waba_number: string;
  direction: "INBOUND" | "OUTBOUND";
  type: "NOTIFICATION" | "FEEDBACK" | "RESPONSE";
  category: "UTILITY" | "MARKETING" | "AUTHENTICATION";
  content: string;
  template_id: string | null;
  template_name: string | null;
  language: string | null;
  campaign_name: string | null;
  message_id: string | null;
  status: "QUEUED" | "SENT" | "DELIVERED" | "READ" | "FAILED";
  expires_at: string | null;
  metadata: Record<string, unknown> | null;
  error_code: string | null;
  error_description: string | null;
  created_at: string;
  updated_at: string;
}

interface MessagesResponse {
  data: Message[];
  total: number;
  page: number;
  limit: number;
}

interface Filters {
  mobile_no: string;
  category: string;
  template_name: string;
  campaign_name: string;
  status: string;
  start_date: string;
  end_date: string;
}

interface Template {
  id: string;
  name: string;
}

export function MessageList() {
  const { organizationId, isLoading: contextLoading, config, isConfigured } = useConfig();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [size] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    mobile_no: "",
    category: "",
    template_name: "",
    campaign_name: "",
    status: "",
    start_date: "",
    end_date: "",
  });
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [mobileDebounceTimer, setMobileDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [campaignDebounceTimer, setCampaignDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const buildFilterParams = useCallback((overrides: Record<string, string> = {}) => {
    const params = new URLSearchParams(overrides);
    params.set("orderby", "id DESC");
    if (filters.mobile_no) params.append("ilike__mobile_no", filters.mobile_no);
    if (filters.category) params.append("eq__category", filters.category);
    if (filters.template_name) params.append("eq__template_name", filters.template_name);
    if (filters.campaign_name) params.append("ilike__campaign_name", filters.campaign_name);
    if (filters.status) params.append("eq__status", filters.status);
    if (filters.start_date) params.append("gte__created_at", `${filters.start_date}T00:00:00.000Z`);
    if (filters.end_date) params.append("lte__created_at", `${filters.end_date}T23:59:59.999Z`);
    return params;
  }, [filters]);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!organizationId) {
        setError("Organization ID not found. Please configure it in Settings first.");
        setLoading(false);
        return;
      }

      const params = buildFilterParams({ page: page.toString(), size: size.toString() });

      const response = await fetch(`/api/whatsapp/whatsapp-internal/messages/list?${params.toString()}`, {
        headers: {
          "x-organization-id": organizationId,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to fetch messages");
      }

      // Handle response format
      if (Array.isArray(data)) {
        setMessages(data);
        setTotal(data.length);
      } else if (data.data) {
        setMessages(data.data);
        // Use count from API response, or estimate based on page
        setTotal(data.count || data.total || (data.data.length === size ? page * size + 1 : page * size));
      } else {
        setMessages([]);
        setTotal(0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch messages");
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [page, size, organizationId, buildFilterParams]);

  const fetchTemplates = useCallback(async () => {
    if (!isConfigured) return;
    
    try {
      setLoadingTemplates(true);
      // Fetch all templates with a high limit to ensure we get all of them
      const result = await getTemplates(config, { limit: 1000 });
      
      if (result.success && result.data?.data) {
        // Map all templates to the dropdown format using their name
        setTemplates(result.data.data.map((t) => ({ id: t.name, name: t.name })));
      }
    } catch (err) {
      console.error("Failed to fetch templates", err);
    } finally {
      setLoadingTemplates(false);
    }
  }, [config, isConfigured]);

  useEffect(() => {
    // Only fetch when context is loaded
    if (!contextLoading) {
      fetchMessages();
      fetchTemplates();
    }
  }, [fetchMessages, fetchTemplates, contextLoading]);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filtering
  };

  const handleFilterChangeWithDebounce = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);

    // Clear existing timers
    if (key === "mobile_no" && mobileDebounceTimer) {
      clearTimeout(mobileDebounceTimer);
    }
    if (key === "campaign_name" && campaignDebounceTimer) {
      clearTimeout(campaignDebounceTimer);
    }
  };

  const clearFilters = () => {
    setFilters({
      mobile_no: "",
      category: "",
      template_name: "",
      campaign_name: "",
      status: "",
      start_date: "",
      end_date: "",
    });
    setPage(1);
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  const downloadCSV = useCallback(async (format: "csv" | "xlsx" | "pdf" = "csv") => {
    if (!organizationId) return;
    setIsDownloading(true);
    try {

      const params = buildFilterParams();
      params.set("format", format);
      params.set("orderby", "created_at DESC");

      const response = await fetch(`/api/whatsapp/whatsapp-internal/messages/export?${params.toString()}`, {
        headers: {
          "x-organization-id": organizationId,
          "x-auth-token": localStorage.getItem("token") ?? "",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error?.message || "Failed to export messages");
      }

      const blob = await response.blob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const mobilePart = filters.mobile_no ? `_${filters.mobile_no}` : "";
      const statusPart = filters.status ? `_${filters.status}` : "";
      const datePart = filters.start_date ? `_from_${filters.start_date}` : "";
      const dateEndPart = filters.end_date ? `_to_${filters.end_date}` : "";
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename=(?:"([^"]+)"|([^;]+))/i);
      a.href = url;

      a.download =
        filenameMatch?.[1] ||
        filenameMatch?.[2]?.trim() ||
        `messages${mobilePart}${statusPart}${datePart}${dateEndPart}_export.${format}`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export messages");
    } finally {
      setIsDownloading(false);
    }
  }, [organizationId, buildFilterParams, filters]);

  const getStatusBadge = (status: string) => {
    const normalizedStatus = status.toUpperCase();
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
      QUEUED: { variant: "secondary", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
      SENT: { variant: "outline", className: "border-green-300 text-green-700 bg-green-50" },
      DELIVERED: { variant: "default", className: "bg-blue-600 hover:bg-blue-700" },
      READ: { variant: "default", className: "bg-green-600 hover:bg-green-700" },
      FAILED: { variant: "destructive", className: "bg-red-600 hover:bg-red-700" },
    };
    const config = variants[normalizedStatus] || { variant: "secondary" };
    return (
      <Badge variant={config.variant} className={config.className}>
        {normalizedStatus}
      </Badge>
    );
  };

  const getDirectionIcon = (direction: string) => {
    if (direction === "OUTBOUND") {
      return <ArrowUpRight className="h-4 w-4 text-blue-500" />;
    }
    return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const totalPages = Math.ceil(total / size);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Messages
            </CardTitle>
            <CardDescription>
              View and filter your WhatsApp message history
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={hasActiveFilters ? "border-primary" : ""}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2">
                  {Object.values(filters).filter((v) => v !== "").length}
                </Badge>
              )}
            </Button>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <Button variant="outline" size="sm" disabled={isDownloading || loading}>
                  <Download className={`mr-2 h-4 w-4 ${isDownloading ? "animate-bounce" : ""}`} />
                  {isDownloading ? "Downloading..." : "Export"}
                  {!isDownloading && <ChevronDown className="ml-2 h-4 w-4" />}
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={4}
                  className="z-50 min-w-[140px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
                >
                  <DropdownMenu.Item
                    onSelect={() => downloadCSV("csv")}
                    className="cursor-pointer rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground"
                  >
                    Export as CSV
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    onSelect={() => downloadCSV("xlsx")}
                    className="cursor-pointer rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground"
                  >
                    Export as Excel
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    onSelect={() => downloadCSV("pdf")}
                    className="cursor-pointer rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground"
                  >
                    Export as PDF
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
            <Button variant="outline" size="sm" onClick={fetchMessages} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        {showFilters && (
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-medium">Filter Messages</h4>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="mr-1 h-3 w-3" />
                  Clear all
                </Button>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="filter-mobile">Mobile Number (min 3 chars)</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="filter-mobile"
                    placeholder="e.g., 254..."
                    className="pl-8"
                    value={filters.mobile_no}
                    onChange={(e) => handleFilterChangeWithDebounce("mobile_no", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-category">Category</Label>
                <Select
                  value={filters.category || "ALL"}
                  onValueChange={(value) => handleFilterChangeWithDebounce("category", value === "ALL" ? "" : value)}
                >
                  <SelectTrigger id="filter-category">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All categories</SelectItem>
                    <SelectItem value="UTILITY">Utility</SelectItem>
                    <SelectItem value="MARKETING">Marketing</SelectItem>
                    <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-template">Template Name</Label>
                <Select
                  value={filters.template_name || "ALL"}
                  onValueChange={(value) => handleFilterChangeWithDebounce("template_name", value === "ALL" ? "" : value)}
                >
                  <SelectTrigger id="filter-template" disabled={loadingTemplates}>
                    <SelectValue placeholder="All templates" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All templates</SelectItem>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.name}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-campaign">Campaign Name (min 3 chars)</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="filter-campaign"
                    placeholder="Search campaign..."
                    className="pl-8"
                    value={filters.campaign_name}
                    onChange={(e) => handleFilterChangeWithDebounce("campaign_name", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-status">Status</Label>
                <Select
                  value={filters.status || "ALL"}
                  onValueChange={(value) => handleFilterChangeWithDebounce("status", value === "ALL" ? "" : value)}
                >
                  <SelectTrigger id="filter-status">
                    <SelectValue placeholder="All status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All status</SelectItem>
                    <SelectItem value="DELIVERED">Delivered</SelectItem>
                    <SelectItem value="SENT">Sent</SelectItem>
                    <SelectItem value="READ">Read</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-start-date">From Date</Label>
                <Input
                  id="filter-start-date"
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => handleFilterChange("start_date", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-end-date">To Date</Label>
                <Input
                  id="filter-end-date"
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => handleFilterChange("end_date", e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Dir</TableHead>
                <TableHead>Mobile No</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <RefreshCw className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : messages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    No messages found
                  </TableCell>
                </TableRow>
              ) : (
                messages.map((message) => (
                  <TableRow key={message.id}>
                    <TableCell>{getDirectionIcon(message.direction)}</TableCell>
                    <TableCell className="font-mono text-sm">{message.mobile_no}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={message.content}>
                      {message.content || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {message.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {message.template_name || "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {message.campaign_name || "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(message.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(message.created_at)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {!loading && messages.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {messages.length === 0 ? 0 : (page - 1) * size + 1} to {Math.min(page * size, total)} of {total}+ messages
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={messages.length < size || loading}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
