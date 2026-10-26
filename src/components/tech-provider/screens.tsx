"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  ArrowLeft, ArrowRight, BarChart3, BookUser, CheckCheck, CircleAlert, ClipboardList,
  FileText, GitBranch, Inbox, Megaphone, MessageSquare, Plus, Send, Settings,
  Tag, Users, Wallet, Zap,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/whatsapp/ui/card";
import { Button } from "@/components/whatsapp/ui/button";
import { Badge } from "@/components/whatsapp/ui/badge";
import { Input } from "@/components/whatsapp/ui/input";
import { Textarea } from "@/components/whatsapp/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/whatsapp/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/whatsapp/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/whatsapp/ui/accordion";
import { TechProviderHeader, useTechProviderWorkspace } from "./dashboard-shell";
import { quickstartFeatures, TECH_PROVIDER_BASE as BASE } from "./navigation";
import { Choice, EmptyTable, Field, PendingButton, PreviewNotice, SearchToolbar } from "./preview-ui";
import { TemplateEditor } from "./template-editor";
import { CampaignComposer, MessageComposer } from "./message-composer";
import { AutomationEditor } from "./automation-editor";

function Page({ title, description, children, live = false }: { title: string; description: string; children: ReactNode; live?: boolean }) {
  return <><TechProviderHeader title={title} description={description} /><div className="space-y-6 p-4 sm:p-6">{!live && <PreviewNotice />}{children}</div></>;
}

function Quickstart() {
  const { connected } = useTechProviderWorkspace();
  return <Page title="Dashboard" description="WhatsApp Business Messaging Platform" live>
    <Card className="border-warning/50 bg-warning/5"><CardContent className="flex flex-wrap items-center gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warning/20"><Settings className="h-5 w-5 text-warning" /></div>
      <div className="min-w-0 flex-1"><h3 className="font-medium">{connected ? "WhatsApp Connected" : "Connect WhatsApp Business"}</h3><p className="mt-1 text-sm text-muted-foreground">{connected ? "Embedded signup completed during this visit. Explore your Tech Provider workspace below." : "Connect your business directly through Meta embedded signup."}</p></div>
      <Link href={`${BASE}/embedded-signup`} className="inline-flex items-center gap-1 text-sm font-medium text-primary">{connected ? "View Connection" : "Connect Now"}<ArrowRight className="h-4 w-4" /></Link>
    </CardContent></Card>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{quickstartFeatures.map((feature) => <Link key={feature.path} href={`${BASE}/${feature.path}`}><Card className="h-full transition-all hover:border-primary/50 hover:shadow-md"><CardHeader><div className={`flex h-12 w-12 items-center justify-center rounded-lg ${feature.color}`}><feature.icon className="h-6 w-6" /></div><CardTitle className="mt-4">{feature.name}</CardTitle><CardDescription>{feature.description}</CardDescription></CardHeader><CardContent><span className="flex items-center text-sm text-primary">{feature.path === "embedded-signup" ? "Connect" : "Open"}<ArrowRight className="ml-1 h-4 w-4" /></span></CardContent></Card></Link>)}</div>
    <div role="note" className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">Embedded signup is available. Other features are in preview; sending, saving, and payments are coming soon.</div>
    <Accordion type="single" collapsible defaultValue="getting-started"><AccordionItem value="getting-started"><AccordionTrigger>Getting Started with WhatsApp</AccordionTrigger><AccordionContent className="space-y-4">
      <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800"><h4 className="font-semibold">Prerequisites</h4><p>You need administrator access to the Meta business portfolio and a phone number eligible for the signup flow.</p></div>
      <ol className="space-y-3">{["Open Embedded Signup and sign in to Meta.", "Select your existing business portfolio, then create or select a WhatsApp Business Account.", "Complete phone verification and finish Meta signup.", "Explore templates, messages, contacts, and automations as the remaining features become available."].map((step, index) => <li key={step} className="flex items-start gap-3 text-sm"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">{index + 1}</span><span className="text-muted-foreground">{step}</span></li>)}</ol>
    </AccordionContent></AccordionItem></Accordion>
  </Page>;
}

function Analytics() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const cards = [
    { label: "Balance", sub: "Available balance", icon: Wallet, color: "border-l-amber-500 text-amber-600 bg-amber-50" },
    { label: "Total Sent", sub: "Outbound messages", icon: Send, color: "border-l-blue-500 text-blue-600 bg-blue-50" },
    { label: "Total Received", sub: "Inbound messages", icon: MessageSquare, color: "border-l-purple-500 text-purple-600 bg-purple-50" },
    { label: "Success Rate", sub: "Message delivery", icon: CheckCheck, color: "border-l-green-500 text-green-600 bg-green-50" },
    { label: "Failed", sub: "Failed messages", icon: CircleAlert, color: "border-l-red-500 text-red-600 bg-red-50" },
  ];
  return <Page title="Message Analytics" description="WhatsApp message statistics with advanced filtering">
    <div className="flex flex-wrap items-center gap-3"><Input className="w-auto max-w-full" type="datetime-local" aria-label="Analytics start date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /><span className="text-muted-foreground">to</span><Input className="w-auto max-w-full" type="datetime-local" aria-label="Analytics end date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /><PendingButton>Apply</PendingButton><Button variant="ghost" onClick={() => { setStartDate(""); setEndDate(""); }}>Clear</Button></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{cards.map((card) => <Card key={card.label} className={`border-l-4 bg-card shadow-md ${card.color.split(" ")[0]}`}><CardContent className="flex items-center justify-between gap-3"><div><p className="mb-2 text-sm font-medium text-muted-foreground">{card.label}</p><p className={`text-3xl font-bold ${card.color.split(" ")[1]}`}>—</p><p className="mt-1 text-xs text-muted-foreground">{card.sub}</p></div><div className={`rounded-full p-3 ${card.color.split(" ").slice(1).join(" ")}`}><card.icon className="h-6 w-6" /></div></CardContent></Card>)}</div>
    <div className="grid gap-6 lg:grid-cols-2"><Card><CardHeader><CardTitle>Status Breakdown</CardTitle><CardDescription>Detailed message count by status</CardDescription></CardHeader><CardContent className="space-y-3">{["Sent", "Delivered", "Read", "Queued", "Failed"].map((status, index) => <div key={status} className={`flex justify-between rounded-lg border p-3 text-sm ${["border-blue-200 bg-blue-50", "border-green-200 bg-green-50", "border-purple-200 bg-purple-50", "border-amber-200 bg-amber-50", "border-red-200 bg-red-50"][index]}`}><span>{status}</span><span>—</span></div>)}</CardContent></Card>
      <Card><CardHeader><CardTitle>Message Status Distribution</CardTitle><CardDescription>Count by delivery status</CardDescription></CardHeader><CardContent className="flex min-h-64 flex-col items-center justify-center gap-4 text-muted-foreground"><div className="flex h-32 w-32 items-center justify-center rounded-full border-[18px] border-muted"><BarChart3 className="h-7 w-7" /></div><p className="text-sm">Analytics will appear once connected.</p></CardContent></Card>
      {[{ title: "Message Categories", values: ["Utility", "Marketing", "Authentication"] }, { title: "Message Types", values: ["Notification", "Feedback", "Response"] }].map((group) => <Card key={group.title}><CardHeader><CardTitle>{group.title}</CardTitle></CardHeader><CardContent className="space-y-3">{group.values.map((value) => <div key={value} className="flex justify-between border-b pb-3 text-sm"><span>{value}</span><span className="text-muted-foreground">—</span></div>)}</CardContent></Card>)}
    </div>
  </Page>;
}

function InboxScreen() {
  const [filter, setFilter] = useState("all");
  return <Page title="Inbox" description="View and chat with all your WhatsApp conversations">
    <SearchToolbar placeholder="Search by name or mobile number..."><div className="w-40"><Choice label="Tag filter" options={["All tags"]} /></div></SearchToolbar>
    <Tabs value={filter} onValueChange={setFilter}><TabsList><TabsTrigger value="all">All</TabsTrigger><TabsTrigger value="unread">Unread</TabsTrigger><TabsTrigger value="read">Read</TabsTrigger></TabsList></Tabs>
    <EmptyTable columns={["Name", "Mobile Number", "Messages", "Last Message", "Last Activity", "Actions"]} title={filter === "unread" ? "No unread conversations" : "No conversations yet"} icon={Inbox} previewHref={`${BASE}/inbox/preview`} previewLabel="Preview conversation" />
  </Page>;
}

function Templates() {
  const [view, setView] = useState("list");
  return <Page title="Message Templates" description="Create and manage your WhatsApp message templates">
    <Tabs value={view} onValueChange={setView}><div className="mb-6 flex flex-wrap items-center justify-between gap-3"><TabsList><TabsTrigger value="list">All Templates</TabsTrigger><TabsTrigger value="create"><Plus className="mr-2 h-4 w-4" />Create New</TabsTrigger></TabsList>{view === "list" && <Button onClick={() => setView("create")}><Plus className="h-4 w-4" />New Template</Button>}</div>
      <TabsContent value="list" className="space-y-5"><SearchToolbar placeholder="Search by name..."><div className="w-40"><Choice label="Status" options={["All Statuses", "Approved", "Pending", "Rejected", "Paused", "Disabled"]} /></div><div className="w-40"><Choice label="Category" options={["All Categories", "Marketing", "Utility", "Authentication"]} /></div></SearchToolbar><EmptyTable columns={["Name", "Category", "Language", "Status", "Actions"]} title="No Templates" icon={FileText} /></TabsContent>
      <TabsContent value="create"><TemplateEditor /></TabsContent>
    </Tabs>
  </Page>;
}

function Campaigns() {
  const [create, setCreate] = useState(false);
  return <Page title="Campaigns" description="View all WhatsApp campaign performance and delivery stats">
    <div className="flex items-center justify-between gap-3"><span className="text-sm text-muted-foreground">Campaign performance</span><Button onClick={() => setCreate(true)}><Plus className="h-4 w-4" />Create Campaign</Button></div>
    <EmptyTable columns={["Campaign", "Group", "Created By", "Total Messages", "Sent", "Failed", "Date"]} title="No campaigns found" icon={Megaphone} previewHref={`${BASE}/campaigns/preview`} />
    <Dialog open={create} onOpenChange={setCreate}><DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>Create Campaign</DialogTitle><DialogDescription>Explore campaign setup. Sending and scheduling are coming soon.</DialogDescription></DialogHeader><CampaignComposer /></DialogContent></Dialog>
  </Page>;
}

function Contacts() {
  const [tab, setTab] = useState("active");
  return <Page title="Contacts" description="View and manage your WhatsApp contacts">
    <Tabs value={tab} onValueChange={setTab}><TabsList className="mb-5"><TabsTrigger value="active">Active Contacts</TabsTrigger><TabsTrigger value="opted-out">Opted Out</TabsTrigger></TabsList></Tabs>
    <SearchToolbar placeholder="Search by name or number..."><div className="w-40"><Choice label="Contact tags" options={["All tags"]} /></div><PendingButton variant="outline">Export</PendingButton></SearchToolbar>
    <EmptyTable columns={tab === "active" ? ["Name", "Mobile", "Tags", "Messages", "Last Active", "Actions"] : ["Mobile Number", "Opted Out At", "Actions"]} title={tab === "active" ? "No contacts found" : "No opted-out contacts"} icon={BookUser} previewHref={tab === "active" ? `${BASE}/contacts/preview` : undefined} />
  </Page>;
}

function Groups() {
  const [create, setCreate] = useState(false);
  return <Page title="Groups" description="Organise contacts into groups for targeted messaging">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">Your Groups</h2><Button onClick={() => setCreate(true)}><Plus className="h-4 w-4" />Create Group</Button></div>
    <SearchToolbar placeholder="Search groups..." /><EmptyTable columns={["Name", "Description", "Contacts", "Status", "Created", "Actions"]} title="No Groups" icon={Users} previewHref={`${BASE}/groups/preview`} />
    <Dialog open={create} onOpenChange={setCreate}><DialogContent><DialogHeader><DialogTitle>Create Group</DialogTitle><DialogDescription>Set up a contact group. Saving will be available once connected.</DialogDescription></DialogHeader><Field label="Group Name"><Input aria-label="Group Name" placeholder="e.g. Customers" /></Field><Field label="Description"><Textarea aria-label="Group Description" placeholder="Describe this group" /></Field><Field label="Contacts CSV"><Input type="file" accept=".csv" aria-label="Contacts CSV" /></Field><div className="flex justify-end gap-3"><Button variant="outline" onClick={() => setCreate(false)}>Cancel</Button><PendingButton>Create Group</PendingButton></div></DialogContent></Dialog>
  </Page>;
}

function Tags() {
  const [create, setCreate] = useState(false);
  const [color, setColor] = useState("#3b82f6");
  return <Page title="Tags" description="Organise contacts into custom tags for targeted messaging">
    <div className="flex justify-end"><Button onClick={() => setCreate(true)}><Plus className="h-4 w-4" />Create Tag</Button></div>
    <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]"><Card><CardHeader><CardTitle>Your Tags</CardTitle></CardHeader><CardContent className="flex flex-col items-center gap-3 py-12 text-sm text-muted-foreground"><Tag className="h-8 w-8 opacity-40" /><p>No tags yet</p></CardContent></Card><EmptyTable columns={["Mobile Number", "Messages", "Last Message", "Last Activity", "Tags", "Actions"]} title="Select a tag to view contacts" icon={Tag} /></div>
    <Dialog open={create} onOpenChange={setCreate}><DialogContent><DialogHeader><DialogTitle>Create Tag</DialogTitle><DialogDescription>Choose a name and colour. Saving will be available once connected.</DialogDescription></DialogHeader><Field label="Tag Name"><Input aria-label="Tag Name" placeholder="e.g. VIP, Hot Lead" /></Field><Field label="Colour"><div className="flex flex-wrap gap-3">{["#3b82f6", "#22c55e", "#ef4444", "#f97316", "#a855f7", "#ec4899"].map((value) => <button key={value} type="button" aria-label={`Select ${value}`} aria-pressed={color === value} onClick={() => setColor(value)} className={`h-8 w-8 rounded-full border-2 ring-offset-2 ${value === color ? "ring-2 ring-foreground" : ""}`} style={{ backgroundColor: value }} />)}</div></Field><div className="flex justify-end gap-3"><Button variant="outline" onClick={() => setCreate(false)}>Cancel</Button><PendingButton>Create Tag</PendingButton></div></DialogContent></Dialog>
  </Page>;
}

function MetaFlows() {
  const [type, setType] = useState("META_FLOW");
  const [create, setCreate] = useState(false);
  const catalogue = type === "CATALOGUE";
  return <Page title="Meta Flows & Catalogues" description="Create and manage your WhatsApp Meta Flows and catalogues">
    {create ? <><Button variant="ghost" onClick={() => setCreate(false)}><ArrowLeft className="h-4 w-4" />Back to {catalogue ? "Catalogues" : "Meta Flows"}</Button><Card className="max-w-3xl"><CardHeader><CardTitle>New {catalogue ? "Catalogue" : "Meta Flow"}</CardTitle></CardHeader><CardContent className="space-y-5"><Field label="Type"><Choice label="Asset Type" options={["META_FLOW", "CATALOGUE"]} value={type} onChange={setType} /></Field><Field label={`${catalogue ? "Catalogue" : "Flow"} Name`}><Input aria-label="Asset Name" placeholder="Enter a name" /></Field><Field label={`${catalogue ? "Catalogue" : "Meta Flow"} ID`}><Input aria-label="Meta Asset ID" placeholder="Enter the Meta asset ID" /></Field><Field label="Description"><Textarea aria-label="Asset Description" placeholder="Describe this item" /></Field>{!catalogue && <><Field label="Default CTA"><Input aria-label="Default CTA" defaultValue="Start Form" /></Field><Field label="Default Screen"><Input aria-label="Default Screen" placeholder="e.g. WELCOME_SCREEN" /></Field></>}<PendingButton>Create {catalogue ? "Catalogue" : "Meta Flow"}</PendingButton></CardContent></Card></> : <>
      <Tabs value={type} onValueChange={setType}><div className="flex flex-wrap items-center justify-between gap-3"><TabsList><TabsTrigger value="META_FLOW">Meta Flows</TabsTrigger><TabsTrigger value="CATALOGUE">Catalogues</TabsTrigger></TabsList><Button onClick={() => setCreate(true)}><Plus className="h-4 w-4" />New Item</Button></div></Tabs>
      <SearchToolbar placeholder={`Search ${catalogue ? "catalogues" : "Meta Flows"}...`} /><EmptyTable columns={["Name", "Type", catalogue ? "Catalogue ID" : "Meta Flow ID", "CTA", "Default Screen", "Status", "Created"]} title={`No ${catalogue ? "Catalogues" : "Meta Flows"}`} icon={GitBranch} previewHref={catalogue ? undefined : `${BASE}/meta-flows/preview/submissions`} previewLabel="Preview submissions" />
    </>}
  </Page>;
}

function Automations() {
  const [tab, setTab] = useState("flows");
  const [editor, setEditor] = useState(false);
  const [trigger, setTrigger] = useState(false);
  return <Page title="Automations" description="Create and manage WhatsApp flow automations and triggers">
    {editor ? <AutomationEditor onBack={() => setEditor(false)} /> : <>
      <Tabs value={tab} onValueChange={setTab}><TabsList className="grid w-full grid-cols-2"><TabsTrigger value="flows">Flows</TabsTrigger><TabsTrigger value="keywords">Triggers</TabsTrigger></TabsList></Tabs>
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">{tab === "flows" ? "Your Flows" : "Keyword Triggers"}</h2><Button onClick={() => tab === "flows" ? setEditor(true) : setTrigger(true)}><Plus className="h-4 w-4" />{tab === "flows" ? "Create Flow" : "Add Trigger"}</Button></div>
      <SearchToolbar placeholder={tab === "flows" ? "Search flows..." : "Search triggers..."} /><EmptyTable columns={tab === "flows" ? ["Name", "Status", "Nodes", "Created", "Actions"] : ["Keyword", "Match Type", "Flow", "Status", "Actions"]} title={tab === "flows" ? "No flows yet" : "No triggers yet"} icon={GitBranch} />
    </>}
    <Dialog open={trigger} onOpenChange={setTrigger}><DialogContent><DialogHeader><DialogTitle>Add Trigger</DialogTitle><DialogDescription>Link a keyword to an automation flow. Saving is coming soon.</DialogDescription></DialogHeader><Field label="Keyword"><Input aria-label="Keyword" placeholder="e.g. hello" /></Field><Field label="Match Type"><Choice label="Match Type" options={["Exact match", "Contains", "Starts with"]} /></Field><Field label="Flow"><Choice label="Automation Flow" options={[]} placeholder="Select a flow" /></Field><div className="flex justify-end gap-3"><Button variant="outline" onClick={() => setTrigger(false)}>Cancel</Button><PendingButton>Save Trigger</PendingButton></div></DialogContent></Dialog>
  </Page>;
}

function AutomationReporting() {
  const [tab, setTab] = useState("contacts");
  return <Page title="Reporting" description="View automation contacts, survey analytics, and responses">
    <Tabs value={tab} onValueChange={setTab}><TabsList className="flex h-auto w-fit max-w-full flex-wrap"><TabsTrigger value="contacts">Contacts</TabsTrigger><TabsTrigger value="analytics">Survey Analytics</TabsTrigger><TabsTrigger value="responses">Survey Responses</TabsTrigger></TabsList></Tabs>
    {tab === "contacts" ? <><SearchToolbar placeholder="Search by phone number..." /><EmptyTable columns={["Phone Number", "Status", "Added"]} title="No automation contacts" icon={Users} /></> : <><div className="max-w-sm"><Choice label="Survey Flow" options={[]} placeholder="Select a flow" /></div>{tab === "responses" ? <><SearchToolbar placeholder="Search by phone, input or session..." /><EmptyTable columns={["Time", "Phone", "Session", "Trigger", "User Input", "Bot Response"]} title="No survey responses" icon={ClipboardList} /></> : <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-muted-foreground"><BarChart3 className="h-10 w-10 opacity-40" /><p>Select a flow to view survey analytics.</p></CardContent></Card>}</>}
  </Page>;
}

function Reports() {
  const [filters, setFilters] = useState(false);
  return <Page title="Message History" description="View and search your WhatsApp messages">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">Message Reports</h2><div className="flex gap-3"><Button variant="outline" onClick={() => setFilters(!filters)} aria-expanded={filters}>Filters</Button><PendingButton variant="outline">Export</PendingButton></div></div>
    {filters && <Card><CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><Field label="Mobile Number"><Input aria-label="Report Mobile Number" placeholder="Search mobile number" /></Field><Field label="Category"><Choice label="Report Category" options={["All Categories", "Marketing", "Utility", "Authentication"]} /></Field><Field label="Status"><Choice label="Message Status" options={["All Statuses", "Sent", "Delivered", "Read", "Queued", "Failed"]} /></Field><Field label="Template Name"><Input aria-label="Report Template Name" placeholder="Template name" /></Field><Field label="Campaign Name"><Input aria-label="Report Campaign Name" placeholder="Campaign name" /></Field><Field label="From Date"><Input type="datetime-local" aria-label="Reports from date" /></Field><Field label="To Date"><Input type="datetime-local" aria-label="Reports to date" /></Field><div className="self-end"><PendingButton>Apply Filters</PendingButton></div></CardContent></Card>}
    <SearchToolbar placeholder="Search messages..." /><EmptyTable columns={["Mobile Number", "Direction", "Type", "Content", "Category", "Status", "Date"]} title="No messages found" icon={MessageSquare} />
  </Page>;
}

function WebhookSettings() {
  const [headers, setHeaders] = useState<number[]>([]);
  return <div className="max-w-3xl space-y-6"><Card><CardHeader><CardTitle>Configure Webhook</CardTitle><CardDescription>Receive updates for your WhatsApp messages</CardDescription></CardHeader><CardContent className="space-y-5"><Field label="Webhook URL"><Input type="url" aria-label="Webhook URL" placeholder="https://your-domain.com/webhook" /></Field><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-medium">Custom Headers</h3><Button variant="outline" size="sm" onClick={() => setHeaders((previous) => [...previous, (previous.at(-1) ?? 0) + 1])}><Plus className="h-4 w-4" />Add Header</Button></div>{headers.map((id) => <div key={id} className="flex gap-2"><Input aria-label={`Header ${id} name`} placeholder="Header Name" /><Input aria-label={`Header ${id} value`} placeholder="Header Value" /><Button variant="ghost" onClick={() => setHeaders((previous) => previous.filter((item) => item !== id))} aria-label={`Remove header ${id}`}>Remove</Button></div>)}<PendingButton>Save Webhook</PendingButton></CardContent></Card><Card><CardHeader><CardTitle>Webhook Events</CardTitle></CardHeader><CardContent className="space-y-3">{["Incoming messages", "Message status updates", "Template status updates", "Account updates"].map((event) => <div key={event} className="flex justify-between gap-3 border-b pb-3 text-sm"><span>{event}</span><Badge variant="outline">Coming soon</Badge></div>)}</CardContent></Card></div>;
}

function AccountSettings() {
  return <div className="max-w-2xl space-y-6"><Card><CardHeader><CardTitle>Business Information</CardTitle><CardDescription>Manage your WhatsApp business profile</CardDescription></CardHeader><CardContent className="space-y-5"><Field label="Business Name"><Input aria-label="Business Name" placeholder="Enter business name" /></Field><Field label="About"><Input aria-label="Business About" placeholder="A short introduction to your business" /></Field><Field label="Description"><Textarea aria-label="Business Description" placeholder="Describe your business" /></Field><Field label="Business Email"><Input type="email" aria-label="Business Email" placeholder="hello@example.com" /></Field><Field label="Website"><Input type="url" aria-label="Business Website" placeholder="https://example.com" /></Field><PendingButton>Save Changes</PendingButton></CardContent></Card>
    <Card><CardHeader><CardTitle>WhatsApp Connection</CardTitle><CardDescription>Connect directly to Meta using embedded signup</CardDescription></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">Connect your business portfolio, WhatsApp Business Account, and phone number through Meta.</p><Button asChild><Link href={`${BASE}/embedded-signup`}>Open Embedded Signup<ArrowRight className="h-4 w-4" /></Link></Button></CardContent></Card>
    <Card><CardHeader><CardTitle>Account Information</CardTitle></CardHeader><CardContent className="space-y-3">{["Business ID", "WABA ID", "Phone Number ID", "Display Phone Number", "Verified Name"].map((label) => <div key={label} className="flex items-center justify-between gap-3 border-b pb-3 text-sm"><span>{label}</span><span className="text-muted-foreground">—</span></div>)}<p className="text-xs text-muted-foreground">Account details will be available when account management is connected.</p></CardContent></Card>
  </div>;
}

function TopUps() {
  const [open, setOpen] = useState(false);
  return <Page title="Top Ups" description="Manage your WhatsApp balance and payment history">
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Card className="border-l-4 border-l-green-500"><CardHeader><CardDescription>Available Balance</CardDescription><CardTitle className="text-3xl">—</CardTitle></CardHeader><CardContent><Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Top Up</Button></CardContent></Card>{["Marketing", "Utility", "Authentication"].map((category) => <Card key={category}><CardHeader><CardDescription>{category} Messages</CardDescription><CardTitle className="text-3xl">—</CardTitle></CardHeader><CardContent className="text-xs text-muted-foreground">Usage will appear once connected.</CardContent></Card>)}</div>
    <h2 className="font-semibold">Top Up History</h2><EmptyTable columns={["Amount", "Status", "Transaction ID", "Phone Number", "Date"]} title="No top ups yet" icon={Wallet} />
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Top Up Balance</DialogTitle><DialogDescription>Payments are coming soon. No payment will be requested.</DialogDescription></DialogHeader><Field label="Amount (KES)"><Input aria-label="Top up amount" type="number" min={1} placeholder="Enter amount" /></Field><Field label="M-Pesa Phone Number"><Input aria-label="M-Pesa Phone Number" placeholder="254712345678" /></Field><div className="flex justify-end gap-3"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><PendingButton>Pay with M-Pesa</PendingButton></div></DialogContent></Dialog>
  </Page>;
}

export function TechProviderScreen({ page, initialTab }: { page: string; initialTab?: string }) {
  switch (page) {
    case "quickstart": return <Quickstart />;
    case "dashboard": return <Analytics />;
    case "inbox": case "recipients": return <InboxScreen />;
    case "templates": return <Templates />;
    case "send": case "bulk": return <Page title="Send Messages" description="Send individual or bulk WhatsApp messages"><MessageComposer initialTab={page === "bulk" ? "bulk" : initialTab} /></Page>;
    case "campaigns": return <Campaigns />;
    case "meta-flows": return <MetaFlows />;
    case "messages": return <Reports />;
    case "contacts": return <Contacts />;
    case "tags": return <Tags />;
    case "groups": return <Groups />;
    case "automations": return <Automations />;
    case "automations/reporting": return <AutomationReporting />;
    case "settings/topups": return <TopUps />;
    case "webhook": return <Page title="Webhook Configuration" description="Configure webhook notifications for your WhatsApp account"><WebhookSettings /></Page>;
    case "settings": return <Page title="Settings" description="Manage your account and WhatsApp preferences"><Tabs defaultValue="account"><TabsList className="mb-6"><TabsTrigger value="account">Account</TabsTrigger><TabsTrigger value="webhook">Webhooks</TabsTrigger></TabsList><TabsContent value="account"><AccountSettings /></TabsContent><TabsContent value="webhook"><WebhookSettings /></TabsContent></Tabs></Page>;
    case "user": case "settings/account": return <Page title="Account Settings" description="Configure your WhatsApp account and business profile"><AccountSettings /></Page>;
    default: return null;
  }
}
