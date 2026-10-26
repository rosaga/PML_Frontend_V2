"use client";

import { useId, type ReactNode } from "react";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, RefreshCw, Inbox, type LucideIcon } from "lucide-react";
import { Button } from "@/components/whatsapp/ui/button";
import { Card } from "@/components/whatsapp/ui/card";
import { Input } from "@/components/whatsapp/ui/input";
import { Label } from "@/components/whatsapp/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/whatsapp/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/whatsapp/ui/table";

export function PreviewNotice() {
  return <div role="note" className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">This feature is in preview. Explore the interface; sending and saving are coming soon.</div>;
}

export function PendingButton({ children, variant = "default" }: { children: ReactNode; variant?: "default" | "outline" }) {
  return <Button type="button" disabled variant={variant} title="Coming soon — preview only">{children}</Button>;
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  const id = useId();
  return <div className="space-y-2"><Label id={id}>{label}</Label><div role="group" aria-labelledby={id}>{children}</div>{hint && <p className="text-xs text-muted-foreground">{hint}</p>}</div>;
}

export function Choice({ label, options, value, onChange, placeholder }: { label: string; options: string[]; value?: string; onChange?: (value: string) => void; placeholder?: string }) {
  return <Select value={value} onValueChange={onChange} defaultValue={value === undefined && !placeholder ? options[0] : undefined}>
    <SelectTrigger aria-label={label} className="w-full"><SelectValue placeholder={placeholder || label} /></SelectTrigger>
    <SelectContent>{options.length ? options.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>) : <p className="px-3 py-4 text-sm text-muted-foreground">No {label.toLowerCase()} available yet</p>}</SelectContent>
  </Select>;
}

export function SearchToolbar({ placeholder = "Search...", children }: { placeholder?: string; children?: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">
    <div className="relative min-w-0 flex-1 basis-60"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label={placeholder.replace(/\.\.\.$/, "")} placeholder={placeholder} className="pl-9" /></div>
    {children}
    <Button variant="outline" size="icon" disabled aria-label="Refresh" title="Available once connected"><RefreshCw className="h-4 w-4" /></Button>
  </div>;
}

export function EmptyTable({ columns, title, description = "Records will appear here when this feature is available.", icon: Icon = Inbox, previewHref, previewLabel = "Preview details" }: { columns: string[]; title: string; description?: string; icon?: LucideIcon; previewHref?: string; previewLabel?: string }) {
  return <Card className="gap-0 overflow-hidden py-0">
    <Table><TableHeader><TableRow>{columns.map((column) => <TableHead key={column} className="whitespace-nowrap px-5">{column}</TableHead>)}</TableRow></TableHeader>
      <TableBody><TableRow className="hover:bg-transparent"><TableCell colSpan={columns.length}>
        <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center text-muted-foreground"><Icon className="h-10 w-10 opacity-40" /><p className="font-medium text-foreground">{title}</p><p className="max-w-sm text-sm">{description}</p>{previewHref && <Button asChild variant="outline" size="sm"><Link href={previewHref}>{previewLabel}</Link></Button>}</div>
      </TableCell></TableRow></TableBody>
    </Table>
    <div className="flex items-center justify-between gap-3 border-t px-5 py-3 text-sm text-muted-foreground"><span>No records</span><div className="flex items-center gap-2"><Button variant="outline" size="icon" disabled aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></Button><Button variant="outline" size="icon" disabled aria-label="Next page"><ChevronRight className="h-4 w-4" /></Button></div></div>
  </Card>;
}
