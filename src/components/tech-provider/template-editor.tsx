"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/whatsapp/ui/card";
import { Button } from "@/components/whatsapp/ui/button";
import { Badge } from "@/components/whatsapp/ui/badge";
import { Input } from "@/components/whatsapp/ui/input";
import { Textarea } from "@/components/whatsapp/ui/textarea";
import { WhatsAppPreview } from "@/components/whatsapp/templates/whatsapp-preview";
import type { Template, TemplateButton } from "@/lib/whatsapp/whatsapp-api";
import { buildTemplatePayload, emptyTemplateDraft, positionalVariables, validateSampleFile, type HeaderType, type TemplateCreationPayload, type TemplateDraft } from "@/lib/tech-provider/template-draft";
import { createTechProviderTemplate, fetchTemplateConnection, findTechProviderTemplate, TemplateApiError, uploadTemplateSample, type TemplateConnection, type TemplateSample, type TemplateSubmission } from "@/lib/tech-provider/templates-api";
import { TECH_PROVIDER_BASE } from "./navigation";
import { Choice, Field } from "./preview-ui";

type EditorError = { message: string; code: string; requestId: string; status: number };
const isReady = (connection: TemplateConnection | null) => connection?.status === "ACTIVE" && connection.restart_signup === false;
const describeError = (reason: unknown): EditorError => ({
  message: reason instanceof Error ? reason.message : "The request failed. Please try again.",
  code: reason instanceof TemplateApiError ? reason.code : "",
  requestId: reason instanceof TemplateApiError ? reason.requestId : "",
  status: reason instanceof TemplateApiError ? reason.status : 0,
});

export function TemplateEditor({ connectionId, onCreated }: { connectionId: string; onCreated?: () => void }) {
  const [draft, setDraft] = useState<TemplateDraft>(emptyTemplateDraft);
  const [connection, setConnection] = useState<TemplateConnection | null>(null);
  const [checking, setChecking] = useState(true);
  const [connectionRevision, setConnectionRevision] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [sample, setSample] = useState<TemplateSample | null>(null);
  const [mediaPreview, setMediaPreview] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState<EditorError | null>(null);
  const [submission, setSubmission] = useState<TemplateSubmission | null>(null);
  const [pending, setPending] = useState<TemplateCreationPayload | null>(null);
  const [lookupNote, setLookupNote] = useState("");
  const [canRetry, setCanRetry] = useState(false);
  const [retryAt, setRetryAt] = useState(0);
  const lock = useRef(false);
  const operation = useRef<AbortController | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; operation.current?.abort(); };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setChecking(true);
    setConnection(null);
    fetchTemplateConnection(connectionId, AbortSignal.any([controller.signal, AbortSignal.timeout(35000)]))
      .then((result) => { if (!controller.signal.aborted) setConnection(result); })
      .catch((reason) => {
        if (!controller.signal.aborted) {
          setError(describeError(reason));
          if (reason instanceof TemplateApiError && reason.status === 429) setRetryAt(Date.now() + (reason.retryAfterMs || 30000));
        }
      })
      .finally(() => { if (!controller.signal.aborted) setChecking(false); });
    return () => controller.abort();
  }, [connectionId, connectionRevision]);

  useEffect(() => {
    if (!file) { setMediaPreview(""); return; }
    const url = URL.createObjectURL(file);
    setMediaPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!retryAt) return;
    const timer = window.setTimeout(() => setRetryAt(0), Math.max(0, retryAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [retryAt]);

  const patch = (values: Partial<TemplateDraft>) => setDraft((previous) => ({ ...previous, ...values }));
  const updateButton = (index: number, values: Partial<TemplateButton>) => setDraft((previous) => ({ ...previous, buttons: previous.buttons.map((button, i) => i === index ? { ...button, ...values } : button) }));
  const applyError = (reason: unknown) => {
    setError(describeError(reason));
    if (reason instanceof TemplateApiError) {
      if (reason.status === 429) setRetryAt(Date.now() + (reason.retryAfterMs || 30000));
      if (["CONNECTION_NOT_ACTIVE", "REAUTHORIZATION_REQUIRED", "ACCOUNT_ACTION_REQUIRED"].includes(reason.code)) {
        setConnection({ status: reason.code, restart_signup: reason.code === "REAUTHORIZATION_REQUIRED" });
      }
    }
  };
  const begin = (action: string) => {
    lock.current = true;
    setBusy(action);
    const controller = new AbortController();
    operation.current = controller;
    return AbortSignal.any([controller.signal, AbortSignal.timeout(35000)]);
  };
  const current = () => mounted.current && !operation.current?.signal.aborted;
  const finish = () => { lock.current = false; if (mounted.current) setBusy(""); };
  const recordSubmission = (result: TemplateSubmission) => {
    setSubmission(result); setPending(null); setCanRetry(false); setError(null); setLookupNote("");
    onCreated?.();
  };
  const reconcile = async (payload: TemplateCreationPayload, signal: AbortSignal) => {
    const found = await findTechProviderTemplate(connectionId, payload.name, payload.language, signal);
    if (!current()) return true;
    if (found) { recordSubmission(found); return true; }
    setCanRetry(true);
    setLookupNote("No matching template was found. You can check again, or deliberately retry this submission.");
    return false;
  };

  const submit = async (event?: FormEvent, retry = false) => {
    event?.preventDefault();
    if (lock.current || checking || !isReady(connection) || submission || retryAt || (pending && !retry)) return;
    let payload;
    try { payload = pending || buildTemplatePayload(draft, sample); }
    catch (reason) { applyError(reason); return; }
    const signal = begin("submit");
    setError(null); setLookupNote("");
    try {
      // An explicit retry first checks whether Meta already accepted the previous POST.
      if (retry && await reconcile(payload, signal)) return;
      const latest = await fetchTemplateConnection(connectionId, signal);
      if (!current()) return;
      setConnection(latest);
      if (!isReady(latest)) throw new TemplateApiError("This connection cannot submit templates. Complete onboarding or resolve its account restrictions.", latest.restart_signup ? "REAUTHORIZATION_REQUIRED" : "CONNECTION_NOT_ACTIVE", 409);
      const result = await createTechProviderTemplate(connectionId, payload, signal);
      if (!current()) return;
      recordSubmission(result);
      try {
        const full = await findTechProviderTemplate(connectionId, payload.name, payload.language, signal);
        if (current() && full) setSubmission(full);
      } catch (reason) {
        if (current()) { setLookupNote("Submitted successfully. Review status could not be refreshed yet."); applyError(reason); }
      }
    } catch (reason) {
      if (!current()) return;
      applyError(reason);
      if (reason instanceof TemplateApiError && reason.outcomeUnknown) {
        setPending(payload); setCanRetry(false);
        try { await reconcile(payload, signal.aborted ? AbortSignal.any([operation.current!.signal, AbortSignal.timeout(35000)]) : signal); }
        catch (lookupError) {
          if (current()) {
            const detail = describeError(lookupError);
            if (lookupError instanceof TemplateApiError && lookupError.status === 429) setRetryAt(Date.now() + (lookupError.retryAfterMs || 30000));
            setLookupNote(`Status lookup failed: ${detail.message}${detail.requestId ? ` (Request ID: ${detail.requestId})` : ""}. Check again before retrying.`);
          }
        }
      }
    } finally { finish(); }
  };

  const checkSubmission = async () => {
    if (lock.current || retryAt || (!pending && !submission)) return;
    const signal = begin("lookup");
    setCanRetry(false);
    try {
      if (pending) await reconcile(pending, signal);
      else if (submission) {
        const found = await findTechProviderTemplate(connectionId, submission.name, submission.language, signal);
        if (current()) {
          if (found) { setSubmission(found); setError(null); setLookupNote(""); onCreated?.(); }
          else setLookupNote("The submitted template is not visible yet. Refresh its review status again shortly.");
        }
      }
    } catch (reason) { if (current()) applyError(reason); }
    finally { finish(); }
  };

  const uploadSample = async () => {
    if (lock.current || !file || !isReady(connection) || checking || retryAt || pending || submission) return;
    const signal = begin("upload");
    setError(null); setSample(null);
    try {
      validateSampleFile(file, draft.headerType.toUpperCase());
      const result = await uploadTemplateSample(connectionId, file, signal);
      if (current()) setSample(result);
    } catch (reason) { if (current()) applyError(reason); }
    finally { finish(); }
  };
  const selectFile = (next: File | null) => {
    setSample(null); setFile(null); setError(null);
    if (!next) return;
    try { validateSampleFile(next, draft.headerType.toUpperCase()); setFile(next); }
    catch (reason) { applyError(reason); }
  };
  const reset = () => {
    if (lock.current) return;
    setDraft(emptyTemplateDraft()); setFile(null); setSample(null); setSubmission(null); setPending(null); setError(null); setLookupNote(""); setCanRetry(false);
  };

  const authentication = draft.category === "AUTHENTICATION";
  const preview: Template = {
    name: draft.name, category: draft.category, language: draft.language,
    components: authentication ? [
      { type: "BODY", text: `{{1}} is your verification code.${draft.securityRecommendation ? " For your security, do not share this code." : ""}` },
      ...(draft.expirationMinutes ? [{ type: "FOOTER" as const, text: `This code expires in ${draft.expirationMinutes} minutes.` }] : []),
      { type: "BUTTONS", buttons: [{ type: "COPY_CODE", text: draft.copyCodeText }] },
    ] : [
      ...(draft.headerType === "No Header" ? [] : [{ type: "HEADER" as const, format: draft.headerType.toUpperCase() as "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT", ...(draft.headerType === "Text" ? { text: draft.headerText } : mediaPreview ? { example: { header_handle: [mediaPreview] } } : {}) }]),
      { type: "BODY", text: draft.body || "Your message preview will appear here." },
      ...(draft.footer ? [{ type: "FOOTER" as const, text: draft.footer }] : []),
      ...(draft.buttons.length ? [{ type: "BUTTONS" as const, buttons: draft.buttons }] : []),
    ],
  };
  const locked = Boolean(busy || pending || submission);

  return <div className="space-y-6">
    <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 text-sm">
      <p>{checking ? "Checking WhatsApp connection…" : isReady(connection) ? "WhatsApp connection is ready for template submission." : `Templates cannot be submitted. ${connection ? `Connection status: ${connection.status}.` : "Check your WhatsApp connection."}`}</p>
      <div className="flex flex-wrap gap-3"><Button type="button" variant="outline" size="sm" disabled={Boolean(busy || checking || retryAt)} onClick={() => { setError(null); setConnectionRevision((value) => value + 1); }}>Check connection</Button>{!checking && !isReady(connection) && <Button asChild variant="outline" size="sm"><Link href={`${TECH_PROVIDER_BASE}/embedded-signup`}>Open Embedded Signup</Link></Button>}</div>
    </div>
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <form className="space-y-6" onSubmit={(event) => { void submit(event); }}>
        <fieldset disabled={locked} className="min-w-0 space-y-6">
          <Card><CardHeader><CardTitle>Basic Information</CardTitle><CardDescription>Configure your template name, category, and language</CardDescription></CardHeader><CardContent className="space-y-4">
            <Field label="Template Name" hint="1–512 lowercase letters, numbers, or underscores."><Input aria-label="Template Name" maxLength={512} value={draft.name} onChange={(event) => patch({ name: event.target.value })} placeholder="e.g. order_ready" /></Field>
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Category"><Choice label="Category" options={["MARKETING", "UTILITY", "AUTHENTICATION"]} value={draft.category} onChange={(category) => patch({ category: category as Template["category"] })} /></Field><Field label="Language" hint="Use a Meta language code, such as en_US, en, or sw."><Input aria-label="Language" value={draft.language} onChange={(event) => patch({ language: event.target.value })} /></Field></div>
          </CardContent></Card>
          {authentication ? <Card><CardHeader><CardTitle>Authentication Code</CardTitle><CardDescription>Meta generates the message body. A copy-code button is included.</CardDescription></CardHeader><CardContent className="space-y-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.securityRecommendation} onChange={(event) => patch({ securityRecommendation: event.target.checked })} />Include security recommendation</label>
            <Field label="Code expiration (minutes)" hint="Leave empty to omit the expiration footer."><Input type="number" min={1} step={1} aria-label="Code expiration" value={draft.expirationMinutes} onChange={(event) => patch({ expirationMinutes: event.target.value })} /></Field>
            <Field label="Copy-code button text"><Input aria-label="Copy-code button text" value={draft.copyCodeText} onChange={(event) => patch({ copyCodeText: event.target.value })} /></Field>
          </CardContent></Card> : <>
            <Card><CardHeader><CardTitle>Header (Optional)</CardTitle></CardHeader><CardContent className="space-y-4">
              <Field label="Header Type"><Choice label="Header Type" options={["No Header", "Text", "Image", "Video", "Document"]} value={draft.headerType} onChange={(type) => { patch({ headerType: type as HeaderType }); setFile(null); setSample(null); }} /></Field>
              {draft.headerType === "Text" && <><Field label="Header Text"><Input aria-label="Header Text" value={draft.headerText} onChange={(event) => patch({ headerText: event.target.value })} placeholder="Enter header text" /></Field>{positionalVariables(draft.headerText).map((variable) => <Field key={variable} label={`Header sample {{${variable}}}`}><Input aria-label={`Header sample ${variable}`} value={draft.headerExamples[variable] || ""} onChange={(event) => patch({ headerExamples: { ...draft.headerExamples, [variable]: event.target.value } })} /></Field>)}</>}
              {["Image", "Video", "Document"].includes(draft.headerType) && <><Field label={`${draft.headerType} review sample`} hint={draft.headerType === "Image" ? "JPEG or PNG, up to 5 MiB. This sample is reviewed by Meta." : draft.headerType === "Video" ? "MP4, up to 16 MiB. This sample is reviewed by Meta." : "PDF, up to 16 MiB. This sample is reviewed by Meta."}><Input key={draft.headerType} type="file" aria-label="Header review sample" accept={draft.headerType === "Image" ? "image/jpeg,image/png" : draft.headerType === "Video" ? "video/mp4" : "application/pdf"} onChange={(event) => selectFile(event.target.files?.[0] || null)} /></Field><Button type="button" variant="outline" disabled={!file || checking || !isReady(connection) || Boolean(retryAt)} onClick={() => { void uploadSample(); }}><Upload className="h-4 w-4" />Upload review sample</Button>{sample && <p role="status" className="text-sm text-green-700">Review sample uploaded for the {sample.format.toLowerCase()} header.</p>}</>}
            </CardContent></Card>
            <Card><CardHeader><CardTitle>Message Body</CardTitle></CardHeader><CardContent className="space-y-4"><Textarea aria-label="Message Body" placeholder="Hello {{1}}, your order {{2}} is ready." rows={6} value={draft.body} onChange={(event) => patch({ body: event.target.value })} /><Button type="button" variant="outline" size="sm" onClick={() => patch({ body: `${draft.body} {{${Math.max(0, ...positionalVariables(draft.body).map(Number)) + 1}}}` })}>Add Variable</Button>{positionalVariables(draft.body).map((variable) => <Field key={variable} label={`Body sample {{${variable}}}`} hint="Use an example value for Meta review."><Input aria-label={`Body sample ${variable}`} value={draft.bodyExamples[variable] || ""} onChange={(event) => patch({ bodyExamples: { ...draft.bodyExamples, [variable]: event.target.value } })} /></Field>)}</CardContent></Card>
            <Card><CardHeader><CardTitle>Footer (Optional)</CardTitle></CardHeader><CardContent><Input aria-label="Footer" value={draft.footer} onChange={(event) => patch({ footer: event.target.value })} placeholder="Add a short footer" /></CardContent></Card>
            <Card><CardHeader><div className="flex items-center justify-between gap-3"><CardTitle>Buttons (Optional)</CardTitle><Button type="button" variant="outline" size="sm" disabled={draft.buttons.length >= 3} onClick={() => patch({ buttons: [...draft.buttons, { type: "QUICK_REPLY", text: "" }] })}><Plus className="h-4 w-4" />Add Button</Button></div></CardHeader><CardContent className="space-y-4">
              {draft.buttons.map((button, index) => <div key={index} className="space-y-3 rounded-lg border p-4"><div className="flex items-center justify-between"><p className="text-sm font-medium">Button {index + 1}</p><Button type="button" variant="ghost" size="icon" aria-label={`Remove button ${index + 1}`} onClick={() => patch({ buttons: draft.buttons.filter((_, i) => i !== index) })}><Trash2 className="h-4 w-4" /></Button></div><Choice label={`Button ${index + 1} type`} options={["QUICK_REPLY", "URL", "PHONE_NUMBER"]} value={button.type} onChange={(type) => updateButton(index, { type: type as TemplateButton["type"], url: undefined, phone_number: undefined })} /><Input aria-label={`Button ${index + 1} text`} value={button.text} placeholder="Button text" onChange={(event) => updateButton(index, { text: event.target.value })} />{button.type === "URL" && <Input aria-label={`Button ${index + 1} URL`} placeholder="https://example.com" value={button.url || ""} onChange={(event) => updateButton(index, { url: event.target.value })} />}{button.type === "PHONE_NUMBER" && <Input aria-label={`Button ${index + 1} phone`} placeholder="+254712345678" value={button.phone_number || ""} onChange={(event) => updateButton(index, { phone_number: event.target.value })} />}</div>)}
            </CardContent></Card>
          </>}
        </fieldset>
        {error && <div role="alert" className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm"><p>{error.message}</p>{error.code && <p className="text-xs">Code: {error.code}</p>}{error.requestId && <p className="break-all text-xs">Request ID: {error.requestId}</p>}{error.status === 401 && <Link href="/signin" className="underline">Sign in again</Link>}{error.code === "PERMISSION_REQUIRED" && <p>Resolve the WhatsApp account permissions through onboarding.</p>}</div>}
        {retryAt > 0 && <p role="status" className="text-sm text-muted-foreground">The service is rate limited. Please wait before retrying.</p>}
        {pending && <div role="status" className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><p>The outcome for {pending.name} ({pending.language}) is unconfirmed. Check its status before another submission.</p><div className="flex flex-wrap gap-3"><Button type="button" variant="outline" disabled={Boolean(busy || retryAt)} onClick={() => { void checkSubmission(); }}>Check submission status</Button>{canRetry && <Button type="button" variant="outline" disabled={Boolean(busy || checking || retryAt) || !isReady(connection)} onClick={() => { void submit(undefined, true); }}>Retry submission</Button>}</div></div>}
        {submission && <div role="status" className="space-y-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-950"><p className="font-medium">Template submitted: {submission.name} ({submission.language})</p><Badge variant="outline">{submission.status}</Badge><p>Template ID: {submission.id}. Submission does not imply approval.</p>{submission.rejected_reason && submission.rejected_reason !== "NONE" && <p>Rejection reason: {submission.rejected_reason}</p>}<div className="flex flex-wrap gap-3"><Button type="button" variant="outline" disabled={Boolean(busy || retryAt)} onClick={() => { void checkSubmission(); }}>Refresh review status</Button><Button type="button" variant="outline" disabled={Boolean(busy)} onClick={reset}>Create another template</Button></div></div>}
        {lookupNote && <p role="status" className="text-sm text-muted-foreground">{lookupNote}</p>}
        <Button type="submit" disabled={locked || checking || !isReady(connection) || Boolean(retryAt)}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}{busy === "upload" ? "Uploading sample…" : busy === "submit" ? "Submitting…" : busy === "lookup" ? "Checking review status…" : "Submit Template"}</Button>
      </form>
      <Card className="xl:sticky xl:top-6"><CardHeader><CardTitle>Live Preview</CardTitle><CardDescription>{authentication ? "Authentication text is generated by Meta; this preview is illustrative." : "Review your draft before submitting it to Meta."}</CardDescription></CardHeader><CardContent><WhatsAppPreview template={preview} headerParams={authentication ? [] : positionalVariables(draft.headerText).map((key) => draft.headerExamples[key] || "")} bodyParams={authentication ? ["123456"] : positionalVariables(draft.body).map((key) => draft.bodyExamples[key] || "")} /></CardContent></Card>
    </div>
  </div>;
}
