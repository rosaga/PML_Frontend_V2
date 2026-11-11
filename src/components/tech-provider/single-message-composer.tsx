"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Loader2, Send } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/whatsapp/ui/card";
import { Button } from "@/components/whatsapp/ui/button";
import { Input } from "@/components/whatsapp/ui/input";
import { Textarea } from "@/components/whatsapp/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/whatsapp/ui/tabs";
import { WhatsAppPreview } from "@/components/whatsapp/templates/whatsapp-preview";
import type { Template } from "@/lib/whatsapp/whatsapp-api";
import { fetchTemplateConnection, fetchTechProviderTemplates, TemplateApiError, type TechProviderTemplate, type TemplateConnection, type TemplatePaging } from "@/lib/tech-provider/templates-api";
import { MessageApiError, sendTechProviderMessage, uploadMessageAsset, type MessageAsset, type MessageReceipt } from "@/lib/tech-provider/messages-api";
import { buildMessagePayload, emptyMessageDraft, requiredMediaKind, templateKey, templateRequirements, validateAttachment, validateMessageDraft, validatePublicMediaUrl, type MessageDraft, type MessageKind } from "@/lib/tech-provider/message-draft";
import { TECH_PROVIDER_BASE } from "./navigation";
import { Choice, Field } from "./preview-ui";

const ready = (connection: TemplateConnection | null) => connection?.status === "ACTIVE" && connection.restart_signup === false;
type SendError = { message: string; code: string; requestId: string; status: number; phase?: string };

export function SingleMessageComposer({ connectionId, externalId }: { connectionId: string; externalId: string }) {
  const [draft, setDraft] = useState<MessageDraft>(emptyMessageDraft);
  const [connection, setConnection] = useState<TemplateConnection | null>(null);
  const [checking, setChecking] = useState(true);
  const [connectionRevision, setConnectionRevision] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [asset, setAsset] = useState<MessageAsset | null>(null);
  const [localPreview, setLocalPreview] = useState("");
  const [stage, setStage] = useState("");
  const [receipt, setReceipt] = useState<MessageReceipt | null>(null);
  const [unknown, setUnknown] = useState(false);
  const [error, setError] = useState<SendError | null>(null);
  const [retryAt, setRetryAt] = useState(0);
  const [templates, setTemplates] = useState<TechProviderTemplate[]>([]);
  const [templatePaging, setTemplatePaging] = useState<TemplatePaging | null>(null);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templateError, setTemplateError] = useState("");
  const [templateCursor, setTemplateCursor] = useState<string | undefined>();
  const [templateRevision, setTemplateRevision] = useState(0);
  const lock = useRef(false);
  const operation = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const selected = draft.templateSource === "browse" ? templates.find((item) => templateKey(item) === draft.templateKey) || null : null;
  const requirements = templateRequirements(selected);
  const mediaKind = requiredMediaKind(draft, selected);
  const native = draft.advanced || draft.templateSource === "manual" || requirements.requiresAdvanced;
  const patch = (values: Partial<MessageDraft>) => setDraft((previous) => ({ ...previous, ...values }));

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; operation.current?.abort(); };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setChecking(true); setConnection(null);
    fetchTemplateConnection(connectionId, AbortSignal.any([controller.signal, AbortSignal.timeout(35000)]))
      .then((result) => { if (!controller.signal.aborted) setConnection(result); })
      .catch((reason) => {
        if (!controller.signal.aborted) {
          setError({ message: reason instanceof Error ? reason.message : "Could not check the WhatsApp connection.", code: reason instanceof TemplateApiError ? reason.code : "", requestId: reason instanceof TemplateApiError ? reason.requestId : "", status: reason instanceof TemplateApiError ? reason.status : 0 });
          if (reason instanceof TemplateApiError && reason.status === 429) setRetryAt(Date.now() + (reason.retryAfterMs || 30000));
        }
      })
      .finally(() => { if (!controller.signal.aborted) setChecking(false); });
    return () => controller.abort();
  }, [connectionId, connectionRevision]);

  useEffect(() => {
    if (draft.kind !== "template" || draft.templateSource !== "browse") return;
    const controller = new AbortController();
    setTemplatesLoading(true); setTemplateError("");
    if (!templateCursor) setTemplates([]);
    fetchTechProviderTemplates(connectionId, { status: "APPROVED", after: templateCursor, signal: AbortSignal.any([controller.signal, AbortSignal.timeout(35000)]) })
      .then((result) => {
        if (controller.signal.aborted) return;
        const approved = result.templates.filter((item) => item.status === "APPROVED");
        setTemplates((previous) => templateCursor ? [...previous, ...approved.filter((item) => !previous.some((existing) => templateKey(existing) === templateKey(item)))] : approved);
        setTemplatePaging(result.paging);
      })
      .catch((reason) => {
        if (!controller.signal.aborted) {
          const requestId = reason instanceof TemplateApiError ? reason.requestId : "";
          setTemplateError(`${reason instanceof Error ? reason.message : "Could not load approved templates."}${requestId ? ` (Request ID: ${requestId})` : ""}`);
          if (reason instanceof TemplateApiError && reason.status === 429) setRetryAt(Date.now() + (reason.retryAfterMs || 30000));
        }
      })
      .finally(() => { if (!controller.signal.aborted) setTemplatesLoading(false); });
    return () => controller.abort();
  }, [connectionId, draft.kind, draft.templateSource, templateCursor, templateRevision]);

  useEffect(() => {
    if (!file) { setLocalPreview(""); return; }
    const url = URL.createObjectURL(file);
    setLocalPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!retryAt) return;
    const timer = window.setTimeout(() => setRetryAt(0), Math.max(0, retryAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [retryAt]);

  const refreshTemplates = () => { setTemplateCursor(undefined); setTemplateRevision((value) => value + 1); };
  const clearAttachment = () => { setFile(null); setAsset(null); };
  const changeType = (kind: string) => {
    if (lock.current || unknown || receipt) return;
    patch({ kind: kind as MessageKind }); clearAttachment(); setError(null);
  };
  const selectFile = (next: File | null) => {
    clearAttachment(); setError(null);
    if (!next) return;
    try { validateAttachment(next, mediaKind); setFile(next); }
    catch (reason) { setError({ message: reason instanceof Error ? reason.message : "Invalid attachment.", code: "", status: 0, requestId: "" }); }
  };
  const applyError = (reason: unknown) => {
    const apiError = reason instanceof MessageApiError || reason instanceof TemplateApiError;
    setError({ message: reason instanceof Error ? reason.message : "The message could not be sent.", code: apiError ? reason.code : "", requestId: apiError ? reason.requestId : "", status: apiError ? reason.status : 0, ...(reason instanceof MessageApiError ? { phase: reason.phase } : {}) });
    if (reason instanceof MessageApiError && reason.outcomeUnknown) setUnknown(true);
    if (apiError && reason.status === 429) setRetryAt(Date.now() + (reason.retryAfterMs || 30000));
    if (apiError && ["CONNECTION_NOT_ACTIVE", "REAUTHORIZATION_REQUIRED", "ACCOUNT_ACTION_REQUIRED"].includes(reason.code)) setConnection({ status: reason.code, restart_signup: reason.code === "REAUTHORIZATION_REQUIRED" });
  };
  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (lock.current || unknown || receipt || retryAt || checking || !ready(connection) || (draft.kind === "template" && draft.templateSource === "browse" && templatesLoading)) return;
    try { validateMessageDraft(draft, selected, file); }
    catch (reason) { applyError(reason); return; }
    lock.current = true;
    const controller = new AbortController();
    operation.current = controller;
    const signal = (timeout = 35000) => AbortSignal.any([controller.signal, AbortSignal.timeout(timeout)]);
    const current = () => mounted.current && !controller.signal.aborted && window.localStorage.getItem("selectedAccountId") === externalId;
    setStage("checking"); setError(null);
    try {
      const latest = await fetchTemplateConnection(connectionId, signal());
      if (!current()) return;
      setConnection(latest);
      if (!ready(latest)) throw new TemplateApiError("The WhatsApp connection cannot send messages. Complete onboarding or resolve its restrictions.", latest.restart_signup ? "REAUTHORIZATION_REQUIRED" : "CONNECTION_NOT_ACTIVE", 409);
      let uploaded = asset;
      if (mediaKind && draft.mediaSource === "file" && !uploaded) {
        setStage("uploading");
        uploaded = await uploadMessageAsset(connectionId, file!, signal(60000));
        if (!current()) return;
        // Keep this asset even if the following send fails, so a manual retry reuses it.
        setAsset(uploaded);
      }
      const payload = buildMessagePayload(draft, selected, file, uploaded?.secure_url);
      if (!current()) return;
      setStage("sending");
      const result = await sendTechProviderMessage(connectionId, payload, signal());
      if (current()) setReceipt(result);
    } catch (reason) { if (current()) applyError(reason); }
    finally { lock.current = false; if (mounted.current) setStage(""); }
  };
  const reset = () => {
    if (lock.current) return;
    setDraft(emptyMessageDraft()); clearAttachment(); setReceipt(null); setUnknown(false); setError(null);
  };

  let previewUrl = "";
  if (draft.mediaSource === "file") previewUrl = localPreview;
  else if (draft.mediaSource === "url" && draft.mediaUrl) { try { validatePublicMediaUrl(draft.mediaUrl); previewUrl = draft.mediaUrl; } catch {} }
  const preview: Template = selected && draft.kind === "template" ? {
    ...selected,
    components: selected.components.map((component) => ({ ...component, example: undefined, ...(component.type === "HEADER" && mediaKind && previewUrl ? { example: { header_handle: [previewUrl] } } : {}), ...(component.text ? { text: component.text.replace(/\{\{([^{}]+)\}\}/g, (placeholder, key) => draft.values[`${component.type.toLowerCase()}:${key}`] || placeholder) } : {}) })),
  } : { name: "preview", category: "UTILITY", components: [
    ...(mediaKind ? [{ type: "HEADER" as const, format: mediaKind.toUpperCase() as "IMAGE" | "VIDEO" | "DOCUMENT", ...(previewUrl ? { example: { header_handle: [previewUrl] } } : {}) }] : []),
    { type: "BODY", text: (draft.kind === "text" ? draft.body : draft.kind === "template" ? "Template preview appears when you select an approved template." : draft.caption) || "Your message preview will appear here." },
  ] };
  const locked = Boolean(stage || unknown || receipt);

  return <div className="space-y-6">
    <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 text-sm"><p>{checking ? "Checking WhatsApp connection…" : ready(connection) ? "WhatsApp connection is ready to send." : "This connection cannot send messages. Check its status or complete onboarding."}</p><div className="flex gap-3"><Button type="button" variant="outline" size="sm" disabled={Boolean(stage || checking || retryAt)} onClick={() => { setConnectionRevision((value) => value + 1); }}>Check connection</Button>{!checking && !ready(connection) && <Button asChild variant="outline" size="sm"><Link href={`${TECH_PROVIDER_BASE}/embedded-signup`}>Open Embedded Signup</Link></Button>}</div></div>
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <form className="space-y-5" onSubmit={(event) => { void send(event); }}>
        <Card><CardHeader><CardTitle>Send Message</CardTitle><CardDescription>Send one message to one WhatsApp recipient</CardDescription></CardHeader><CardContent className="space-y-5">
          <fieldset disabled={locked} className="min-w-0 space-y-5">
            <Field label="Recipient Phone Number" hint="7–15 digits including country code; an optional leading + is accepted."><Input aria-label="Recipient Phone Number" type="tel" placeholder="+254712345678" value={draft.to} onChange={(event) => patch({ to: event.target.value })} /></Field>
            <Tabs value={draft.kind} onValueChange={changeType}><TabsList className="flex h-auto w-full flex-wrap">{["text", "image", "video", "document", "template"].map((type) => <TabsTrigger key={type} value={type} disabled={locked} className="flex-1 capitalize">{type}</TabsTrigger>)}</TabsList></Tabs>
            {draft.kind === "text" && <><Field label="Message" hint={`${Array.from(draft.body).length}/4096 characters`}><Textarea aria-label="Message" rows={6} value={draft.body} onChange={(event) => patch({ body: event.target.value })} placeholder="Type your WhatsApp message..." /></Field><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.previewUrl} onChange={(event) => patch({ previewUrl: event.target.checked })} />Request link preview</label></>}
            {draft.kind === "template" && <div className="space-y-4">
              <Field label="Template source"><Choice label="Template source" value={draft.templateSource} options={["browse", "manual"]} onChange={(value) => { patch({ templateSource: value as "browse" | "manual", templateKey: "", values: {}, nativeComponents: "" }); clearAttachment(); }} /></Field>
              {draft.templateSource === "browse" ? <><Field label="Approved template"><select aria-label="Approved template" disabled={templatesLoading || locked} value={draft.templateKey} onChange={(event) => { patch({ templateKey: event.target.value, values: {}, nativeComponents: "", advanced: false }); clearAttachment(); }} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">Select a template and language</option>{templates.map((template) => <option key={templateKey(template)} value={templateKey(template)}>{template.name} ({template.language})</option>)}</select></Field>{templatesLoading && <p role="status" className="text-sm text-muted-foreground">Loading approved templates…</p>}{templateError && <p role="alert" className="text-sm text-destructive">{templateError}</p>}{!templatesLoading && !templates.length && !templateError && <p className="text-sm text-muted-foreground">No approved templates found on this page.</p>}<div className="flex flex-wrap gap-3"><Button type="button" variant="outline" size="sm" disabled={templatesLoading || Boolean(retryAt)} onClick={refreshTemplates}>Refresh templates</Button>{templatePaging?.has_next && templatePaging.after && <Button type="button" variant="outline" size="sm" disabled={templatesLoading || Boolean(retryAt)} onClick={() => setTemplateCursor(templatePaging.after)}>Load more templates</Button>}</div></> : <><Field label="Approved template name"><Input aria-label="Template name" value={draft.templateName} onChange={(event) => patch({ templateName: event.target.value })} /></Field><Field label="Meta language code"><Input aria-label="Template language" value={draft.templateLanguage} onChange={(event) => patch({ templateLanguage: event.target.value })} /></Field><p className="text-sm text-muted-foreground">Enter an already approved template. Meta validates its language and eligibility.</p></>}
              {selected && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={native} disabled={requirements.requiresAdvanced} onChange={(event) => { patch({ advanced: event.target.checked }); clearAttachment(); }} />Use native component parameters</label>}
              {native ? <Field label="Native send components (JSON)" hint="Use lowercase component types and actual values. Include button or carousel parameters here; use delivery media URLs or IDs, never review sample handles."><Textarea aria-label="Native send components" rows={8} value={draft.nativeComponents} onChange={(event) => patch({ nativeComponents: event.target.value })} placeholder={'[{"type":"body","parameters":[{"type":"text","text":"Alex"}]}]'} /></Field> : requirements.fields.map((field) => <Field key={field.key} label={`${field.section === "body" ? "Body" : "Header"} {{${field.variable}}}`} hint="Enter the actual value to send."><Input aria-label={`Template ${field.key}`} value={draft.values[field.key] || ""} onChange={(event) => patch({ values: { ...draft.values, [field.key]: event.target.value } })} /></Field>)}
            </div>}
            {mediaKind && <div className="space-y-4"><Field label={draft.kind === "template" ? `${mediaKind} template header` : "Attachment source"}><Choice label="Attachment source" options={["file", "url", "id"]} value={draft.mediaSource} onChange={(value) => { patch({ mediaSource: value as MessageDraft["mediaSource"] }); clearAttachment(); }} /></Field>
              {draft.mediaSource === "file" ? <><Field label={`${mediaKind} attachment`} hint={mediaKind === "image" ? "JPEG or PNG, up to 5 MiB. Uploaded when you press Send." : mediaKind === "video" ? "MP4, up to 16 MiB. Uploaded when you press Send." : "PDF, up to 16 MiB. Uploaded when you press Send."}><Input key={`${draft.kind}:${draft.templateKey}:${mediaKind}`} aria-label="Attachment file" type="file" accept={mediaKind === "image" ? "image/jpeg,image/png" : mediaKind === "video" ? "video/mp4" : "application/pdf"} onChange={(event) => selectFile(event.target.files?.[0] || null)} /></Field>{asset && <p role="status" className="text-sm text-muted-foreground">Attachment uploaded. Another send attempt will reuse this attachment.</p>}</> : draft.mediaSource === "url" ? <Field label="Public attachment URL" hint="Meta must be able to fetch this URL without signing in."><Input aria-label="Media URL" type="url" value={draft.mediaUrl} onChange={(event) => patch({ mediaUrl: event.target.value })} /></Field> : <Field label="WhatsApp delivery-media ID"><Input aria-label="Media ID" value={draft.mediaId} onChange={(event) => patch({ mediaId: event.target.value })} placeholder="Existing decimal delivery-media ID" /></Field>}
              {mediaKind === "document" && draft.mediaSource !== "file" && <Field label="Document filename (optional)"><Input aria-label="Document filename" value={draft.filename} onChange={(event) => patch({ filename: event.target.value })} /></Field>}
              {draft.kind !== "template" && <Field label="Caption (optional)" hint={`${Array.from(draft.caption).length}/1024 characters`}><Textarea aria-label="Caption" value={draft.caption} onChange={(event) => patch({ caption: event.target.value })} /></Field>}
            </div>}
            <Field label="Reply to message ID (optional)"><Input aria-label="Reply message ID" placeholder="wamid.ORIGINAL_MESSAGE_ID" value={draft.replyTo} onChange={(event) => patch({ replyTo: event.target.value })} /></Field>
          </fieldset>
          {draft.kind !== "template" && <p className="text-sm text-muted-foreground">Free-form messages require an open 24-hour customer service window. Outside that window, use an approved template.</p>}
          {error && <div role="alert" className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm"><p>{error.phase === "upload" ? "Attachment upload failed: " : ""}{error.message}</p>{error.code && <p className="text-xs">Code: {error.code}</p>}{error.requestId && <p className="break-all text-xs">Request ID: {error.requestId}</p>}{error.status === 401 && <Link href="/signin" className="underline">Sign in again</Link>}{error.code === "CUSTOMER_SERVICE_WINDOW_CLOSED" && <Button type="button" variant="outline" size="sm" disabled={locked} onClick={() => changeType("template")}>Use an approved template</Button>}{error.code === "PERMISSION_REQUIRED" && <p>Resolve this WhatsApp account&apos;s permissions through onboarding. File uploads also need template-write access.</p>}</div>}
          {retryAt > 0 && <p role="status" className="text-sm text-muted-foreground">The service is rate limited. Please wait before retrying.</p>}
          {unknown && <div role="status" className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><p className="font-medium">Send outcome unknown</p><p>The message may already have been sent. Resolve the outcome outside this app before deciding to retry. There is no delivery-status lookup here.</p><Button type="button" variant="outline" disabled={Boolean(stage || retryAt)} onClick={() => { setUnknown(false); setError(null); }}>Outcome resolved — unlock draft</Button></div>}
          {receipt && <div role="status" className="space-y-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-950"><p className="font-medium">Accepted by WhatsApp</p><p className="break-all">Message ID: {receipt.id}</p>{receipt.requestId && <p className="break-all text-xs">Request ID: {receipt.requestId}</p>}<p>Acceptance does not confirm delivery or read status.</p><Button type="button" variant="outline" onClick={reset}>Compose another message</Button></div>}
          <Button type="submit" disabled={locked || checking || !ready(connection) || Boolean(retryAt) || (draft.kind === "template" && draft.templateSource === "browse" && templatesLoading)}>{stage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{stage === "uploading" ? "Uploading…" : stage === "sending" ? "Sending…" : stage === "checking" ? "Checking connection…" : "Send Message"}</Button>
        </CardContent></Card>
      </form>
      <Card className="xl:sticky xl:top-6"><CardHeader><CardTitle>Message Preview</CardTitle><CardDescription>{draft.kind === "template" && native ? "Native parameters are validated by Meta; this preview may omit advanced content." : "Review your message before sending."}</CardDescription></CardHeader><CardContent><WhatsAppPreview template={preview} chatOnly />{file && <p className="mt-3 break-all text-xs text-muted-foreground">{file.name}</p>}</CardContent></Card>
    </div>
  </div>;
}
