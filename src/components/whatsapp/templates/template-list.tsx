"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/whatsapp/ui/button";
import { Badge } from "@/components/whatsapp/ui/badge";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/whatsapp/ui/alert-dialog";
import { useToast } from "@/hooks/whatsapp/use-toast";
import { useConfig } from "@/lib/whatsapp/config-context";
import { getTemplates, deleteTemplate, type Template, type TemplateFilters, type PagingCursors } from "@/lib/whatsapp/whatsapp-api";
import { Trash2, RefreshCw, FileText, Loader2, Eye, ChevronLeft, ChevronRight, Search, X } from "lucide-react";

interface TemplateListProps {
  onSelect?: (template: Template) => void;
  refreshTrigger?: number;
}

export function TemplateList({ onSelect, refreshTrigger }: TemplateListProps) {
  const { config, isConfigured } = useConfig();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  
  // Pagination state
  const [paging, setPaging] = useState<PagingCursors | null>(null);
  const [pageSize, setPageSize] = useState(10);
  
  // Filter state
  const [searchName, setSearchName] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const fetchTemplates = useCallback(async (filters?: TemplateFilters) => {
    if (!isConfigured) return;
    
    setLoading(true);
    
    const queryFilters: TemplateFilters = {
      limit: pageSize,
      ...filters,
    };
    
    // Apply filters only if they have values
    if (searchName) queryFilters.name = searchName;
    if (statusFilter && statusFilter !== "all") queryFilters.status = statusFilter as TemplateFilters["status"];
    if (categoryFilter && categoryFilter !== "all") queryFilters.category = categoryFilter as TemplateFilters["category"];
    
    const result = await getTemplates(config, queryFilters);
    setLoading(false);

    if (result.success && result.data) {
      setTemplates(result.data.data || []);
      setPaging(result.data.paging?.cursors || null);
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to fetch templates.",
        variant: "destructive",
      });
    }
  }, [config, isConfigured, toast, pageSize, searchName, statusFilter, categoryFilter]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates, refreshTrigger]);

  const handleNextPage = () => {
    if (paging?.after) {
      fetchTemplates({ after: paging.after });
    }
  };

  const handlePrevPage = () => {
    if (paging?.before) {
      fetchTemplates({ before: paging.before });
    }
  };

  const handleSearch = () => {
    fetchTemplates();
  };

  const clearFilters = () => {
    setSearchName("");
    setStatusFilter("all");
    setCategoryFilter("all");
    fetchTemplates();
  };

  const handleDelete = async (templateName: string) => {
    setDeleting(templateName);
    const result = await deleteTemplate(config, templateName);
    setDeleting(null);

    if (result.success) {
      toast({
        title: "Success",
        description: "Template deleted successfully.",
      });
      fetchTemplates();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete template.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status?: string) => {
    switch (status?.toUpperCase()) {
      case "APPROVED":
        return "default";
      case "PENDING":
        return "secondary";
      case "REJECTED":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "MARKETING":
        return "bg-chart-1/20 text-chart-1";
      case "UTILITY":
        return "bg-chart-2/20 text-chart-2";
      case "AUTHENTICATION":
        return "bg-chart-3/20 text-chart-3";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (!isConfigured) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-medium text-foreground">Not Configured</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Please configure your API settings to view templates.
        </p>
      </div>
    );
  }

  const hasActiveFilters = searchName || statusFilter !== "all" || categoryFilter !== "all";

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9"
            />
          </div>
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="MARKETING">Marketing</SelectItem>
            <SelectItem value="UTILITY">Utility</SelectItem>
            <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
          </SelectContent>
        </Select>

        <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(parseInt(v))}>
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="Limit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="default" size="sm" onClick={handleSearch}>
          <Search className="mr-2 h-4 w-4" />
          Search
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-2 h-4 w-4" />
            Clear
          </Button>
        )}

        <Button variant="outline" size="sm" onClick={() => fetchTemplates()} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Results info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {templates.length} template{templates.length !== 1 ? "s" : ""} found
          {hasActiveFilters && " (filtered)"}
        </p>
      </div>

      {loading && templates.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium text-foreground">No Templates</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {hasActiveFilters ? "No templates match your filters." : "Create your first template to get started."}
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow
                    key={template.id || template.name}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onSelect?.(template)}
                  >
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getCategoryColor(template.category)}`}>
                        {template.category}
                      </span>
                    </TableCell>
                    <TableCell>{template.language || "en_US"}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(template.status)}>
                        {template.status || "Unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelect?.(template);
                          }}
                          title="View template"
                        >
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => e.stopPropagation()}
                              title="Delete template"
                            >
                              {deleting === template.name ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4 text-destructive" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Template</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete &quot;{template.name}&quot;? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(template.name)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {paging && (paging.before || paging.after) && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={!paging.before || loading}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={!paging.after || loading}
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
