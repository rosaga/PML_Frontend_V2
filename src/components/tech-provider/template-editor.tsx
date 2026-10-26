"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/whatsapp/ui/card";
import { Button } from "@/components/whatsapp/ui/button";
import { Input } from "@/components/whatsapp/ui/input";
import { Textarea } from "@/components/whatsapp/ui/textarea";
import { WhatsAppPreview } from "@/components/whatsapp/templates/whatsapp-preview";
import type { Template, TemplateButton } from "@/lib/whatsapp/whatsapp-api";
import { Choice, Field, PendingButton } from "./preview-ui";

export function TemplateEditor() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Marketing");
  const [headerType, setHeaderType] = useState("No Header");
  const [headerText, setHeaderText] = useState("");
  const [body, setBody] = useState("");
  const [footer, setFooter] = useState("");
  const [buttons, setButtons] = useState<TemplateButton[]>([]);
  const effectiveFooter = category === "Marketing" ? "reply STOP to opt out" : footer;
  const template: Template = {
    name, category: category.toUpperCase() as Template["category"], language: "en_US",
    components: [
      ...(headerType === "No Header" ? [] : [{ type: "HEADER" as const, format: headerType.toUpperCase() as "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT", text: headerType === "Text" ? headerText : undefined }]),
      { type: "BODY", text: body || "Your message preview will appear here." },
      ...(effectiveFooter ? [{ type: "FOOTER" as const, text: effectiveFooter }] : []),
      ...(buttons.length ? [{ type: "BUTTONS" as const, buttons }] : []),
    ],
  };

  const updateButton = (index: number, patch: Partial<TemplateButton>) => setButtons((previous) => previous.map((button, i) => i === index ? { ...button, ...patch } : button));

  return <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
    <div className="space-y-6">
      <Card><CardHeader><CardTitle>Basic Information</CardTitle><CardDescription>Configure your template name, category, and language</CardDescription></CardHeader><CardContent className="space-y-4">
        <Field label="Template Name" hint="Use lowercase letters, numbers, and underscores."><Input aria-label="Template Name" placeholder="e.g. order_confirmation" value={name} onChange={(event) => setName(event.target.value)} /></Field>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Category"><Choice label="Category" options={["Marketing", "Utility", "Authentication"]} value={category} onChange={setCategory} /></Field><Field label="Language"><Choice label="Language" options={["English (US)", "English", "Swahili"]} /></Field></div>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Header (Optional)</CardTitle></CardHeader><CardContent className="space-y-4">
        <Field label="Header Type"><Choice label="Header Type" options={["No Header", "Text", "Image", "Video", "Document"]} value={headerType} onChange={setHeaderType} /></Field>
        {headerType === "Text" && <Field label="Header Text"><Input aria-label="Header Text" value={headerText} onChange={(event) => setHeaderText(event.target.value)} placeholder="Enter header text" /></Field>}
        {["Image", "Video", "Document"].includes(headerType) && <Field label={`${headerType} file`} hint="Media uploads will be available once connected."><Input type="file" aria-label={`${headerType} file`} accept={headerType === "Image" ? "image/*" : headerType === "Video" ? "video/*" : ".pdf"} /></Field>}
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Message Body</CardTitle></CardHeader><CardContent className="space-y-3"><Textarea aria-label="Message Body" placeholder="Enter your message. Use {{1}} for variables." rows={6} value={body} onChange={(event) => setBody(event.target.value)} /><Button variant="outline" size="sm" onClick={() => setBody((previous) => `${previous} {{${(previous.match(/\{\{\d+\}\}/g)?.length || 0) + 1}}}`)}>Add Variable</Button></CardContent></Card>
      <Card><CardHeader><CardTitle>Footer ({category === "Marketing" ? "Required" : "Optional"})</CardTitle></CardHeader><CardContent><Input aria-label="Footer" value={effectiveFooter} readOnly={category === "Marketing"} onChange={(event) => setFooter(event.target.value)} placeholder="Add a short footer" /></CardContent></Card>
      <Card><CardHeader><div className="flex items-center justify-between gap-3"><CardTitle>Buttons (Optional)</CardTitle><Button variant="outline" size="sm" disabled={buttons.length >= 3} onClick={() => setButtons((previous) => [...previous, { type: "QUICK_REPLY", text: "" }])}><Plus className="h-4 w-4" />Add Button</Button></div></CardHeader><CardContent className="space-y-4">
        {!buttons.length && <p className="text-sm text-muted-foreground">Add quick replies or calls to action to your template.</p>}
        {buttons.map((button, index) => <div key={index} className="space-y-3 rounded-lg border p-4"><div className="flex items-center justify-between"><p className="text-sm font-medium">Button {index + 1}</p><Button variant="ghost" size="icon" aria-label={`Remove button ${index + 1}`} onClick={() => setButtons((previous) => previous.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4" /></Button></div><Choice label={`Button ${index + 1} type`} options={["QUICK_REPLY", "URL", "PHONE_NUMBER"]} value={button.type} onChange={(value) => updateButton(index, { type: value as TemplateButton["type"] })} /><Input aria-label={`Button ${index + 1} text`} placeholder="Button text" value={button.text} onChange={(event) => updateButton(index, { text: event.target.value })} />{button.type === "URL" && <Input aria-label={`Button ${index + 1} URL`} placeholder="https://example.com" value={button.url || ""} onChange={(event) => updateButton(index, { url: event.target.value })} />}{button.type === "PHONE_NUMBER" && <Input aria-label={`Button ${index + 1} phone`} placeholder="254712345678" value={button.phone_number || ""} onChange={(event) => updateButton(index, { phone_number: event.target.value })} />}</div>)}
      </CardContent></Card>
      <PendingButton>Create Template</PendingButton>
    </div>
    <Card className="xl:sticky xl:top-6"><CardHeader><CardTitle>Live Preview</CardTitle><CardDescription>Preview only — this message is not sent.</CardDescription></CardHeader><CardContent><WhatsAppPreview template={template} /></CardContent></Card>
  </div>;
}
