"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ArrowLeft, ClipboardList, MessageSquare, Paperclip, Plus, Send, User, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/whatsapp/ui/card";
import { Button } from "@/components/whatsapp/ui/button";
import { Input } from "@/components/whatsapp/ui/input";
import { Textarea } from "@/components/whatsapp/ui/textarea";
import { Badge } from "@/components/whatsapp/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/whatsapp/ui/dialog";
import { TechProviderHeader } from "./dashboard-shell";
import { TECH_PROVIDER_BASE as BASE } from "./navigation";
import { Choice, EmptyTable, Field, PendingButton, PreviewNotice, SearchToolbar } from "./preview-ui";

function DetailPage({ title, back, children }: { title: string; back: string; children: ReactNode }) {
  return <><TechProviderHeader title={title} description="Tech Provider workspace" /><div className="space-y-6 p-4 sm:p-6"><PreviewNotice /><Button asChild variant="ghost"><Link href={`${BASE}/${back}`}><ArrowLeft className="h-4 w-4" />Back to {back === "meta-flows" ? "Meta Flows" : back.charAt(0).toUpperCase() + back.slice(1)}</Link></Button>{children}</div></>;
}

function Conversation({ id }: { id: string }) {
  const [message, setMessage] = useState("");
  return <DetailPage title="Conversation" back="inbox"><div className="grid overflow-hidden rounded-xl border bg-card xl:grid-cols-[280px_minmax(0,1fr)]">
    <div className="hidden border-r p-4 xl:block"><h2 className="mb-4 font-semibold">Conversations</h2><Input aria-label="Search conversations" placeholder="Search conversations..." /><p className="py-12 text-center text-sm text-muted-foreground">No conversations yet</p></div>
    <div className="flex min-w-0 flex-col"><div className="flex items-center gap-3 border-b p-4"><div className="rounded-full bg-muted p-3"><User className="h-5 w-5" /></div><div><p className="font-semibold">{id === "preview" ? "Contact" : id}</p><p className="text-xs text-muted-foreground">Conversation preview</p></div><Button asChild variant="outline" className="ml-auto"><Link href={`${BASE}/contacts/${encodeURIComponent(id)}`}>Contact Details</Link></Button></div>
      <div className="flex min-h-80 flex-1 flex-col items-center justify-center gap-3 bg-[#efeae2] p-6 text-center text-muted-foreground"><MessageSquare className="h-10 w-10 opacity-40" /><p className="text-sm">Messages will appear here when the inbox is available.</p></div>
      <div className="space-y-3 border-t p-4"><Field label="Reply"><Textarea aria-label="Reply" rows={3} placeholder="Type a message..." value={message} onChange={(event) => setMessage(event.target.value)} /></Field><div className="flex flex-wrap items-center justify-between gap-3"><label className="inline-flex cursor-pointer items-center gap-2 text-sm text-muted-foreground"><Paperclip className="h-4 w-4" />Attach file<input type="file" aria-label="Attach file" className="max-w-40 text-xs" /></label><PendingButton><Send className="h-4 w-4" />Send</PendingButton></div></div>
    </div>
  </div></DetailPage>;
}

function Contact({ id }: { id: string }) {
  return <DetailPage title="Contact Details" back="contacts"><div className="grid items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
    <div className="space-y-6"><Card><CardHeader><div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-muted"><User className="h-7 w-7 text-muted-foreground" /></div><CardTitle>Contact Information</CardTitle></CardHeader><CardContent className="space-y-5"><Field label="Name"><Input aria-label="Contact name" placeholder="Contact name" /></Field><Field label="Phone Number"><Input aria-label="Contact phone number" defaultValue={id === "preview" ? "" : id} placeholder="Phone number" /></Field><Field label="Email"><Input aria-label="Contact email" type="email" placeholder="Email address" /></Field><PendingButton>Save Contact</PendingButton></CardContent></Card><Card><CardHeader><CardTitle>Tags</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">No tags assigned</CardContent></Card></div>
    <div className="space-y-6"><div className="flex justify-end"><Button asChild variant="outline"><Link href={`${BASE}/inbox/${encodeURIComponent(id)}`}><MessageSquare className="h-4 w-4" />Open Chat</Link></Button></div><EmptyTable columns={["Direction", "Message", "Status", "Date"]} title="No message history" icon={MessageSquare} /><Card><CardHeader><CardTitle>Groups</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">No groups available</CardContent></Card></div>
  </div></DetailPage>;
}

function GroupContacts() {
  const [add, setAdd] = useState(false);
  return <DetailPage title="Group Contacts" back="groups"><div className="flex justify-end"><Button onClick={() => setAdd(true)}><Plus className="h-4 w-4" />Add Contacts</Button></div><SearchToolbar placeholder="Search group contacts..." /><EmptyTable columns={["Name", "Phone Number", "Status", "Added", "Actions"]} title="No Contacts" icon={Users} />
    <Dialog open={add} onOpenChange={setAdd}><DialogContent><DialogHeader><DialogTitle>Add Contacts</DialogTitle><DialogDescription>Prepare contacts for this group. Importing and saving are coming soon.</DialogDescription></DialogHeader><Field label="Name"><Input aria-label="New contact name" placeholder="Contact name" /></Field><Field label="Phone Number"><Input aria-label="New contact phone number" placeholder="254712345678" /></Field><Field label="Or import a CSV"><Input type="file" accept=".csv" aria-label="Import group contacts CSV" /></Field><div className="flex justify-end gap-3"><Button variant="outline" onClick={() => setAdd(false)}>Cancel</Button><PendingButton>Add Contacts</PendingButton></div></DialogContent></Dialog>
  </DetailPage>;
}

function CampaignDetails({ id }: { id: string }) {
  return <DetailPage title="Campaign Details" back="campaigns"><div className="flex flex-wrap items-center justify-between gap-3"><Badge variant="outline">Preview</Badge><div className="flex gap-3"><PendingButton variant="outline">Pause Campaign</PendingButton><PendingButton variant="outline">Resume Campaign</PendingButton></div></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{["Total Messages", "Sent", "Delivered", "Read", "Failed"].map((label) => <Card key={label}><CardHeader><CardDescription>{label}</CardDescription><CardTitle className="text-3xl">—</CardTitle></CardHeader></Card>)}</div>
    <Card><CardHeader><CardTitle>Campaign Info</CardTitle></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2">{[["Campaign ID", id === "preview" ? "—" : id], ["Group", "—"], ["Template", "—"], ["Created By", "—"], ["Schedule", "—"], ["Status", "Not available"]].map(([label, value]) => <div key={label} className="space-y-1 text-sm"><p className="text-muted-foreground">{label}</p><p className="break-all font-medium">{value}</p></div>)}</CardContent></Card>
    <h2 className="font-semibold">Button Clicks</h2><EmptyTable columns={["Button Text", "Payload", "Clicks", "Unique Numbers"]} title="No button click reports" icon={ClipboardList} /><SearchToolbar placeholder="Search campaign messages..."><div className="w-40"><Choice label="Delivery status" options={["All Statuses", "Sent", "Delivered", "Read", "Failed"]} /></div></SearchToolbar><EmptyTable columns={["Mobile Number", "Message", "Status", "Date"]} title="No campaign messages" icon={MessageSquare} />
  </DetailPage>;
}

export function TechProviderDetailScreen({ kind, id }: { kind: string; id: string }) {
  switch (kind) {
    case "conversation": return <Conversation id={id} />;
    case "contact": return <Contact id={id} />;
    case "group": return <GroupContacts />;
    case "campaign": return <CampaignDetails id={id} />;
    case "submissions": return <DetailPage title="Submissions" back="meta-flows"><SearchToolbar placeholder="Search submissions..." /><EmptyTable columns={["Phone Number", "Response", "Flow Token", "Submitted At"]} title="No submissions yet" icon={ClipboardList} /></DetailPage>;
    default: return null;
  }
}
