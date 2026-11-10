"use client";

import { useState } from "react";
import { Send, MessageSquare, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/whatsapp/ui/card";
import { Input } from "@/components/whatsapp/ui/input";
import { Textarea } from "@/components/whatsapp/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/whatsapp/ui/tabs";
import { Switch } from "@/components/whatsapp/ui/switch";
import { Label } from "@/components/whatsapp/ui/label";
import { WhatsAppPreview } from "@/components/whatsapp/templates/whatsapp-preview";
import { Choice, Field, PendingButton } from "./preview-ui";

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
  const [messageType, setMessageType] = useState("text");
  const [body, setBody] = useState("");
  const [caption, setCaption] = useState("");
  const [recipient, setRecipient] = useState("");
  return <Tabs value={mode} onValueChange={(value) => {
    setMode(value);
    if (value === "bulk" && !["text", "template"].includes(messageType)) setMessageType("text");
  }}>
    <TabsList className="mb-6 flex h-auto w-fit max-w-full flex-wrap"><TabsTrigger value="single"><Send className="mr-2 h-4 w-4" />Send Single</TabsTrigger><TabsTrigger value="bulk"><MessageSquare className="mr-2 h-4 w-4" />Send Bulk</TabsTrigger><TabsTrigger value="campaigns"><Users className="mr-2 h-4 w-4" />Campaigns</TabsTrigger></TabsList>
    <TabsContent value="campaigns" className="max-w-3xl"><CampaignComposer /></TabsContent>
    {mode !== "campaigns" && <TabsContent value={mode}><div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Card><CardHeader><CardTitle>{mode === "bulk" ? "Bulk Message" : "Send Message"}</CardTitle><CardDescription>{mode === "bulk" ? "Send WhatsApp messages to multiple recipients" : "Send a single WhatsApp message to a recipient"}</CardDescription></CardHeader><CardContent className="space-y-6">
        {mode === "bulk" ? <><Field label="Recipients CSV"><Input type="file" accept=".csv" aria-label="Recipients CSV" /></Field><Field label="Or enter recipients" hint="One phone number per line, including country code."><Textarea aria-label="Recipients" rows={5} placeholder={"254712345678\n254723456789"} /></Field></> : <Field label="Recipient Phone Number" hint="Include country code without + (e.g. 254712345678 for Kenya)."><Input aria-label="Recipient Phone Number" placeholder="254712345678" value={recipient} onChange={(event) => setRecipient(event.target.value)} /></Field>}
        <Tabs value={messageType} onValueChange={setMessageType}>
          <TabsList className="flex h-auto w-full flex-wrap">{(mode === "bulk" ? ["text", "template"] : ["text", "image", "document", "template", "meta-flow"]).map((type) => <TabsTrigger key={type} value={type} className="flex-1 capitalize">{type === "meta-flow" ? "Meta Flows" : type}</TabsTrigger>)}</TabsList>
          <div className="space-y-4 pt-5">
            {messageType === "text" && <Field label="Message"><Textarea aria-label="Message" placeholder="Type your WhatsApp message..." rows={6} value={body} onChange={(event) => setBody(event.target.value)} /></Field>}
            {["image", "document"].includes(messageType) && <><Field label={messageType === "image" ? "Image" : "Document"} hint="Files stay in this browser; uploads are not connected yet."><Input type="file" aria-label="Media file" accept={messageType === "image" ? "image/*" : ".pdf,.doc,.docx"} /></Field><Field label="Media URL"><Input aria-label="Media URL" type="url" placeholder="https://example.com/media" /></Field><Field label="Caption"><Textarea aria-label="Caption" value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Add a caption" /></Field></>}
            {messageType === "template" && <><Field label="Template"><Choice label="Template" options={[]} placeholder="Select a template" /></Field><Field label="Language"><Choice label="Language" options={["English (US)", "English", "Swahili"]} /></Field><p className="text-sm text-muted-foreground">Approved templates and their parameters will appear once connected.</p></>}
            {messageType === "meta-flow" && <><Field label="Meta Flow"><Choice label="Meta Flow" options={[]} placeholder="Select a Meta Flow" /></Field><Field label="Call to Action"><Input aria-label="Call to Action" placeholder="OPEN FORM" /></Field><Field label="Body Text"><Textarea aria-label="Flow body text" placeholder="Please complete this form" /></Field></>}
          </div>
        </Tabs>
        <PendingButton><Send className="h-4 w-4" />{mode === "bulk" ? "Send Bulk Messages" : "Send Message"}</PendingButton>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Message Preview</CardTitle><CardDescription>Preview only — this message is not sent.</CardDescription></CardHeader><CardContent><WhatsAppPreview template={{ name: "preview", category: "UTILITY", components: [{ type: "BODY", text: (messageType === "text" ? body : caption) || "Your message preview will appear here." }] }} /></CardContent></Card>
    </div></TabsContent>}
  </Tabs>;
}
