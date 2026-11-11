"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Plus, RefreshCw, Search } from "lucide-react";
import { Badge } from "@/components/whatsapp/ui/badge";
import { Button } from "@/components/whatsapp/ui/button";
import { Card } from "@/components/whatsapp/ui/card";
import { Input } from "@/components/whatsapp/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/whatsapp/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/whatsapp/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/whatsapp/ui/dialog";
import { WhatsAppPreview } from "@/components/whatsapp/templates/whatsapp-preview";
import { fetchTechProviderTemplates, type TechProviderTemplate, type TemplatesResponse } from "@/lib/tech-provider/templates-api";
import { TechProviderHeader } from "./dashboard-shell";
import { Choice, PreviewNotice } from "./preview-ui";
import { TemplateEditor } from "./template-editor";

export function TemplatesScreen() {
  const [view, setView] = useState("list");
  const [data, setData] = useState<TemplatesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All Statuses");
  const [category, setCategory] = useState("All Categories");
  const [cursor, setCursor] = useState<{ after?: string; before?: string; page: number }>({ page: 1 });
  const [refresh, setRefresh] = useState(0);
  const [selected, setSelected] = useState<TechProviderTemplate | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setData(null);
    fetchTechProviderTemplates({ ...cursor, signal: controller.signal })
      .then((result) => { if (!controller.signal.aborted) setData(result); })
      .catch((reason) => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Could not load templates. Please try again.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [cursor, refresh]);

  const templates = data?.templates.filter((template) =>
    template.name.toLowerCase().includes(search.trim().toLowerCase()) &&
    (status === "All Statuses" || template.status.toUpperCase() === status.toUpperCase()) &&
    (category === "All Categories" || template.category.toUpperCase() === category.toUpperCase()),
  ) || [];

  return <>
    <TechProviderHeader title="Message Templates" description="Create and manage your WhatsApp message templates" />
    <div className="space-y-6 p-4 sm:p-6">
      <Tabs value={view} onValueChange={setView}>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <TabsList><TabsTrigger value="list">All Templates</TabsTrigger><TabsTrigger value="create"><Plus className="mr-2 h-4 w-4" />Create New</TabsTrigger></TabsList>
          {view === "list" && <Button onClick={() => setView("create")}><Plus className="h-4 w-4" />New Template</Button>}
        </div>
        <TabsContent value="list" className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-0 flex-1 basis-60"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Search templates by name" placeholder="Search by name..." className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
            <div className="w-40"><Choice label="Status" options={["All Statuses", "Approved", "Pending", "Rejected", "Paused", "Disabled"]} value={status} onChange={setStatus} /></div>
            <div className="w-40"><Choice label="Category" options={["All Categories", "Marketing", "Utility", "Authentication"]} value={category} onChange={setCategory} /></div>
            <Button variant="outline" size="icon" disabled={loading} aria-label="Refresh templates" onClick={() => setRefresh((value) => value + 1)}><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></Button>
          </div>
          <p className="text-xs text-muted-foreground">Search and filters apply to the current page of templates.</p>
          {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm"><p>{error}</p><Button variant="outline" size="sm" onClick={() => setRefresh((value) => value + 1)}>Try again</Button></div>}
          <Card className="gap-0 overflow-hidden py-0">
            <Table aria-label="Message templates" aria-busy={loading}>
              <TableHeader><TableRow>{["Name", "Category", "Language", "Status", "Actions"].map((column) => <TableHead key={column} className="whitespace-nowrap px-5">{column}</TableHead>)}</TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={5}><div role="status" className="flex items-center justify-center gap-2 py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Loading templates…</div></TableCell></TableRow>
                  : error ? <TableRow><TableCell colSpan={5} className="py-16 text-center text-muted-foreground">Templates could not be loaded.</TableCell></TableRow>
                    : templates.length ? templates.map((template) => <TableRow key={`${template.id}:${template.language}`}>
                      <TableCell className="px-5 font-medium">{template.name}</TableCell><TableCell className="px-5">{template.category}</TableCell><TableCell className="px-5">{template.language}</TableCell>
                      <TableCell className="px-5"><Badge variant="outline" className={template.status === "APPROVED" ? "border-green-200 bg-green-50 text-green-700" : undefined}>{template.status}</Badge></TableCell>
                      <TableCell className="px-5"><Button size="sm" variant="outline" aria-label={`View ${template.name}`} onClick={() => setSelected(template)}>View</Button></TableCell>
                    </TableRow>)
                      : <TableRow><TableCell colSpan={5} className="py-16 text-center text-muted-foreground">{data?.templates.length ? "No templates match your filters." : "No templates found."}</TableCell></TableRow>}
              </TableBody>
            </Table>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3 text-sm text-muted-foreground">
              <span>Page {cursor.page}{data && ` · ${templates.length} of ${data.templates.length} templates on this page`}</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" disabled={loading || !data?.paging.has_previous || !data.paging.before} aria-label="Previous page" onClick={() => setCursor({ before: data?.paging.before, page: Math.max(1, cursor.page - 1) })}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" disabled={loading || !data?.paging.has_next || !data.paging.after} aria-label="Next page" onClick={() => setCursor({ after: data?.paging.after, page: cursor.page + 1 })}><ChevronRight className="h-4 w-4" /></Button>
                {cursor.page > 1 && <Button variant="ghost" size="sm" disabled={loading} onClick={() => setCursor({ page: 1 })}>First page</Button>}
              </div>
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="create" className="space-y-5"><PreviewNotice /><TemplateEditor /></TabsContent>
      </Tabs>
    </div>
    <Dialog open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null); }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader><DialogTitle>{selected?.name || "Template details"}</DialogTitle><DialogDescription>{selected && `${selected.category} · ${selected.language} · ${selected.status}`}</DialogDescription></DialogHeader>
        {selected && <><WhatsAppPreview template={selected} chatOnly /><dl className="space-y-2 break-words text-sm"><div><dt className="font-medium">Template ID</dt><dd className="text-muted-foreground">{selected.id}</dd></div>{selected.parameter_format && <div><dt className="font-medium">Parameter format</dt><dd className="text-muted-foreground">{selected.parameter_format}</dd></div>}{selected.rejected_reason && selected.rejected_reason !== "NONE" && <div><dt className="font-medium">Rejection reason</dt><dd className="text-muted-foreground">{selected.rejected_reason}</dd></div>}</dl></>}
      </DialogContent>
    </Dialog>
  </>;
}
