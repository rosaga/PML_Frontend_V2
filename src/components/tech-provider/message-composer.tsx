"use client";

import { useState } from "react";
import Link from "next/link";
import { Send, MessageSquare, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/whatsapp/ui/card";
import { Input } from "@/components/whatsapp/ui/input";
import { Textarea } from "@/components/whatsapp/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/whatsapp/ui/tabs";
import { Switch } from "@/components/whatsapp/ui/switch";
import { Label } from "@/components/whatsapp/ui/label";
import { Button } from "@/components/whatsapp/ui/button";
import { Choice, Field, PendingButton, PreviewNotice } from "./preview-ui";
import { useTechProviderWorkspace } from "./dashboard-shell";
import { SingleMessageComposer } from "./single-message-composer";
import { TECH_PROVIDER_BASE } from "./navigation";

export function CampaignComposer() {
  const [audience, setAudience] = useState("existing");
  const [scheduled, setScheduled] = useState(false);
  const [batches, setBatches] = useState(false);
  return <div className="space-y-5">
    <Tabs value={audience} onValueChange={setAudience}><TabsList className="grid w-full grid-cols-2"><TabsTrigger value="existing">Existing Group</TabsTrigger><TabsTrigger value="new">New Group</TabsTrigger></TabsList></Tabs>
    <Card><CardHeader><CardTitle>{audience === "existing" ? "Send to Existing Group" : "Create Group & Send"}</CardTitle><CardDescription>Create a WhatsApp campaign for your audience</CardDescription></CardHeader><CardContent className="space-y-5">
      {audience === "existing" ? <Field label="Select Group"><Choice label="Group" options={[]} placeholder="Select a group" /></Field> : <><Field label="Group Name"><Input aria-label="Group Name" placeholder="Enter a group name" /></Field><Field label="Recipients CSV" hint="Choose a CSV file containing recipient phone numbers."><Input type="file" accept=".csv" aria-label="Recipients CSV" /></Field></>}
      <Field label="Campaign Name"><Input aria-label="Campaign Name" placeholder="e.g. October product launch" /></Field>
      <Field label="WhatsApp Template"><Choice label="Template" options={[]} placeholder="Select a template" /></Field>
      <Field label="Template Parameters"><Textarea aria-label="Template Parameters" placeholder="Enter template parameter values" /></Field>
      <div className="flex items-center gap-3"><Switch id="tp-schedule" checked={scheduled} onCheckedChange={setScheduled} /><Label htmlFor="tp-schedule">Schedule for later</Label></div>
      {scheduled && <div className="grid gap-4 sm:grid-cols-2"><Field label="Date"><Input type="date" aria-label="Schedule date" /></Field><Field label="Time"><Input type="time" aria-label="Schedule time" /></Field></div>}
      <div className="flex items-center gap-3"><Switch id="tp-batches" checked={batches} onCheckedChange={setBatches} /><Label htmlFor="tp-batches">Send in daily batches</Label></div>
      {batches && <Field label="Messages per day"><Input type="number" min={1} defaultValue={100} aria-label="Messages per day" /></Field>}
      <PendingButton><Send className="h-4 w-4" />Create Campaign</PendingButton>
    </CardContent></Card>
  </div>;
}

export function MessageComposer({ initialTab = "single" }: { initialTab?: string }) {
  const [mode, setMode] = useState(["single", "bulk", "campaigns"].includes(initialTab) ? initialTab : "single");
  const { account, accountLoading, accountError, refreshAccount } = useTechProviderWorkspace();
  let single;
  if (accountLoading) single = <p role="status" className="py-12 text-center text-muted-foreground">Loading WhatsApp account…</p>;
  else if (accountError) single = <div role="alert" className="space-y-3 rounded-lg border p-4 text-sm"><p>{accountError}</p><Button variant="outline" onClick={refreshAccount}>Retry account details</Button></div>;
  else if (!account?.meta_connection_id?.trim()) single = <Card><CardContent className="space-y-4 py-6"><p>Connect WhatsApp Business for this organization before sending messages.</p><Button asChild><Link href={`${TECH_PROVIDER_BASE}/embedded-signup`}>Connect WhatsApp</Link></Button><Button variant="outline" onClick={refreshAccount}>Refresh account details</Button></CardContent></Card>;
  else single = <SingleMessageComposer key={`${account.external_id}:${account.meta_connection_id}`} connectionId={account.meta_connection_id} externalId={account.external_id} />;
  return <Tabs value={mode} onValueChange={setMode}>
    <TabsList className="mb-6 flex h-auto w-fit max-w-full flex-wrap"><TabsTrigger value="single"><Send className="mr-2 h-4 w-4" />Send Single</TabsTrigger><TabsTrigger value="bulk"><MessageSquare className="mr-2 h-4 w-4" />Send Bulk</TabsTrigger><TabsTrigger value="campaigns"><Users className="mr-2 h-4 w-4" />Campaigns</TabsTrigger></TabsList>
    <TabsContent value="single" forceMount hidden={mode !== "single"}>{single}</TabsContent>
    <TabsContent value="campaigns" className="max-w-3xl space-y-6"><PreviewNotice /><CampaignComposer /></TabsContent>
    <TabsContent value="bulk" className="max-w-3xl space-y-6"><PreviewNotice /><Card><CardHeader><CardTitle>Bulk Message</CardTitle><CardDescription>Bulk sending is coming soon. Use Send Single to message one recipient.</CardDescription></CardHeader><CardContent className="space-y-5"><Field label="Recipients CSV"><Input type="file" accept=".csv" aria-label="Recipients CSV" /></Field><Field label="Or enter recipients"><Textarea aria-label="Recipients" rows={5} placeholder={"254712345678\n254723456789"} /></Field><Field label="Message"><Textarea aria-label="Bulk message" rows={6} /></Field><PendingButton>Send Bulk Messages</PendingButton></CardContent></Card></TabsContent>
  </Tabs>;
}
