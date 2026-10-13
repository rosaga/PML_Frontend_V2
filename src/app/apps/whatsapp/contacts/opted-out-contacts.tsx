"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, RefreshCw, Search } from "lucide-react";
import { useConfig } from "@/lib/whatsapp/config-context";
import { Badge } from "@/components/whatsapp/ui/badge";
import { Button } from "@/components/whatsapp/ui/button";
import { Card } from "@/components/whatsapp/ui/card";
import { Input } from "@/components/whatsapp/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/whatsapp/ui/table";

interface OptedOutContact {
  mobile_no: string;
  opted_out: boolean;
  changed_at: string;
  source: string;
}

export function OptedOutContacts() {
  const { organizationId, organizationExternalId, isLoading: contextLoading, signalPmlUnauthorized } = useConfig();
  const externalId = organizationExternalId || organizationId;
  const [contacts, setContacts] = useState<OptedOutContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (contextLoading) return;
    const controller = new AbortController();
    setContacts([]);
    setPage(1);
    setError("");
    setLoading(true);

    const loadContacts = async () => {
      try {
        if (!externalId) throw new Error("Select an organization to view opted-out contacts.");
        const token = localStorage.getItem("token") || "";
        if (!token) {
          signalPmlUnauthorized();
          throw new Error("Sign in again to load opted-out contacts.");
        }
        const response = await fetch(
          `/api/whatsapp/opted-out-numbers?external_id=${encodeURIComponent(externalId)}`,
          { headers: { "x-auth-token": token }, signal: controller.signal, cache: "no-store" },
        );
        if (response.status === 401) {
          signalPmlUnauthorized();
          throw new Error("Sign in again to load opted-out contacts.");
        }
        if (!response.ok) throw new Error("Unable to load opted-out contacts. Please try again.");
        const result = await response.json();
        if (!Array.isArray(result?.data) || result.data.some((contact: OptedOutContact) =>
          !contact || typeof contact.mobile_no !== "string" || typeof contact.opted_out !== "boolean" ||
          typeof contact.changed_at !== "string" || typeof contact.source !== "string",
        )) {
          throw new Error("Unable to load opted-out contacts. Please try again.");
        }
        if (!controller.signal.aborted) {
          setContacts(result.data.filter((contact: OptedOutContact) => contact.opted_out));
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "Unable to load opted-out contacts.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadContacts();
    return () => controller.abort();
  }, [contextLoading, externalId, refresh, signalPmlUnauthorized]);

  const filtered = contacts.filter((contact) => contact.mobile_no.includes(searchQuery.trim()));
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            aria-label="Search opted-out contacts by number"
            placeholder="Search by number..."
            value={searchQuery}
            onChange={(event) => { setSearchQuery(event.target.value); setPage(1); }}
            className="pl-10"
          />
        </div>
        <span className="text-sm text-muted-foreground" aria-live="polite">
          {!loading && !error && `${filtered.length} contact${filtered.length !== 1 ? "s" : ""}`}
        </span>
        <Button
          variant="outline" size="sm" className="ml-auto h-9 w-9 p-0"
          title="Refresh opted-out contacts" aria-label="Refresh opted-out contacts"
          disabled={loading} onClick={() => setRefresh((value) => value + 1)}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div role="status" className="flex items-center justify-center py-16 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Loading opted-out contacts...
        </div>
      ) : error ? (
        <div role="alert" className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-sm text-red-600">{error}</p>
          <Button variant="outline" size="sm" onClick={() => setRefresh((value) => value + 1)}>
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          {searchQuery.trim() ? "No matching opted-out contacts" : "No opted-out contacts found"}
        </div>
      ) : (
        <>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Opted Out At</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((contact) => {
                  const date = new Date(contact.changed_at);
                  return (
                    <TableRow key={contact.mobile_no}>
                      <TableCell className="font-mono text-sm">{contact.mobile_no}</TableCell>
                      <TableCell><Badge variant="secondary">Opted out</Badge></TableCell>
                      <TableCell className="text-gray-500 text-sm whitespace-nowrap">
                        {Number.isNaN(date.getTime()) ? "N/A" : <time dateTime={contact.changed_at}>{date.toLocaleString()}</time>}
                      </TableCell>
                      <TableCell className="text-sm capitalize">{contact.source.replace(/_/g, " ") || "N/A"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <p>Page {currentPage} of {totalPages}</p>
              <label className="flex items-center gap-1.5">
                Per page:
                <select
                  value={pageSize}
                  onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}
                  className="border border-border rounded px-1.5 py-0.5 text-sm bg-background"
                >
                  {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
                </select>
              </label>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" title="Previous page" aria-label="Previous page"
                  onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" title="Next page" aria-label="Next page"
                  onClick={() => setPage(currentPage + 1)} disabled={currentPage === totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
