import type { TechProviderTemplate } from "./templates-api";
import { mediaRules } from "./template-draft";

export type MessageKind = "text" | "image" | "video" | "document" | "template";
export type MediaKind = "image" | "video" | "document";
export type MediaReference = { link: string; id?: never; filename?: string } | { id: string; link?: never; filename?: string };
export interface MessageDraft {
  to: string;
  kind: MessageKind;
  body: string;
  previewUrl: boolean;
  caption: string;
  replyTo: string;
  mediaSource: "file" | "url" | "id";
  mediaUrl: string;
  mediaId: string;
  filename: string;
  templateSource: "browse" | "manual";
  templateKey: string;
  templateName: string;
  templateLanguage: string;
  values: Record<string, string>;
  advanced: boolean;
  nativeComponents: string;
}
export interface MessagePayload {
  to: string;
  context?: { message_id: string };
  type?: "text" | MediaKind;
  text?: { body: string; preview_url: boolean };
  image?: MediaReference & { caption?: string };
  video?: MediaReference & { caption?: string };
  document?: MediaReference & { caption?: string };
  template?: { name: string; language: { code: string }; components?: NativeSendComponent[] };
}
export interface NativeSendComponent { type: string; [key: string]: unknown }
interface DefinitionComponent {
  type: string;
  format?: string;
  text?: string;
  buttons?: Array<{ type: string; url?: string }>;
}
export interface TemplateValueField { key: string; variable: string; section: "header" | "body"; named: boolean }

export const emptyMessageDraft = (): MessageDraft => ({
  to: "", kind: "text", body: "", previewUrl: false, caption: "", replyTo: "", mediaSource: "file", mediaUrl: "", mediaId: "", filename: "",
  templateSource: "browse", templateKey: "", templateName: "", templateLanguage: "en_US", values: {}, advanced: false, nativeComponents: "",
});
export const templateKey = (template: TechProviderTemplate) => `${template.id}:${template.language}`;

export function templateRequirements(template: TechProviderTemplate | null) {
  const fields: TemplateValueField[] = [];
  let mediaKind: MediaKind | undefined;
  let requiresAdvanced = false;
  for (const component of (template?.components || []) as DefinitionComponent[]) {
    if (component.type === "HEADER" && ["IMAGE", "VIDEO", "DOCUMENT"].includes(component.format || "")) mediaKind = component.format!.toLowerCase() as MediaKind;
    else if (component.type === "HEADER" && component.format !== "TEXT") requiresAdvanced = true;
    if (["HEADER", "BODY"].includes(component.type)) {
      const variables = Array.from(new Set(Array.from((component.text || "").matchAll(/\{\{([^{}]+)\}\}/g), (match) => match[1])));
      const named = template?.parameter_format === "NAMED" || variables.some((variable) => !/^\d+$/.test(variable));
      if (!named) variables.sort((a, b) => Number(a) - Number(b));
      if (!named && variables.some((variable, index) => variable !== String(index + 1))) requiresAdvanced = true;
      for (const variable of variables) {
        const section = component.type.toLowerCase() as "header" | "body";
        fields.push({ key: `${section}:${variable}`, variable, section, named });
      }
    }
    if (component.type === "BUTTONS" && component.buttons?.some((button) => !["QUICK_REPLY", "PHONE_NUMBER", "URL"].includes(button.type) || button.url?.includes("{{"))) requiresAdvanced = true;
    if (!["HEADER", "BODY", "FOOTER", "BUTTONS"].includes(component.type)) requiresAdvanced = true;
  }
  return { fields, mediaKind, requiresAdvanced };
}

export function validateRecipient(value: string) {
  if (!/^\+?[1-9][0-9]{6,14}$/.test(value)) throw new Error("Enter a recipient number with country code: 7–15 digits, optionally starting with +, without spaces or punctuation.");
  return value.replace(/^\+/, "");
}

export function validatePublicMediaUrl(value: string) {
  let url;
  try { url = new URL(value); } catch { throw new Error("Enter a public HTTP or HTTPS attachment URL."); }
  if (!/^https?:\/\//i.test(value) || !["http:", "https:"].includes(url.protocol) || url.username || url.password || value.includes("#")) throw new Error("Attachment URLs must use HTTP or HTTPS without embedded credentials or fragments.");
}

function validateFilename(filename: string) {
  if (/[\\/\u0000-\u001f\u007f]/.test(filename) || new Blob([filename]).size > 255) throw new Error("Document filenames must be at most 255 bytes without directory separators or control characters.");
}

export function validateAttachment(file: Pick<File, "name" | "type" | "size">, expectedKind?: MediaKind) {
  const rule = mediaRules[file.type as keyof typeof mediaRules];
  if (!rule) throw new Error("Choose a JPEG, PNG, MP4, or PDF attachment.");
  const kind = rule.format.toLowerCase() as MediaKind;
  if (expectedKind && kind !== expectedKind) throw new Error(`Choose a file matching the ${expectedKind} message or template header.`);
  if (!file.size || file.size > rule.maxBytes) throw new Error(`The attachment must be nonempty and at most ${rule.maxBytes / 1048576} MiB.`);
  if (!file.name || /[\\/\u0000-\u001f\u007f]/.test(file.name)) throw new Error("Attachment filenames cannot contain directory separators or control characters.");
  if (kind === "document") validateFilename(file.name);
  return { kind, resourceType: kind === "document" ? "raw" : kind };
}

function validateMedia(reference: Record<string, unknown>, kind: string) {
  if (Boolean(reference.link) === Boolean(reference.id)) throw new Error("Each attachment requires exactly one public URL or WhatsApp delivery-media ID.");
  if (reference.link) validatePublicMediaUrl(String(reference.link));
  if (reference.id && !/^\d+$/.test(String(reference.id))) throw new Error("WhatsApp delivery-media IDs must contain only digits.");
  if (reference.filename !== undefined) {
    if (kind !== "document") throw new Error("Only document attachments can include a filename.");
    validateFilename(String(reference.filename));
  }
}

export function parseNativeSendComponents(value: string): NativeSendComponent[] {
  let components;
  try { components = JSON.parse(value || "[]"); } catch { throw new Error("Template parameters must be valid JSON containing an array of send components."); }
  if (!Array.isArray(components)) throw new Error("Template parameters must be an array of send components.");
  for (const component of components) {
    if (!component || typeof component !== "object" || !["header", "body", "button", "carousel"].includes(component.type)) throw new Error("Send component types must be lowercase: header, body, button, or carousel.");
    if (["category", "example", "text"].some((key) => key in component)) throw new Error("Use actual send parameters, rather than template creation fields or examples.");
  }
  const visit = (value: unknown) => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) { value.forEach(visit); return; }
    const object = value as Record<string, unknown>;
    if ("header_handle" in object) throw new Error("Review sample handles cannot be used as delivery media. Use a link or delivery-media ID.");
    for (const [key, nested] of Object.entries(object)) {
      if (["image", "video", "document"].includes(key) && nested && typeof nested === "object") validateMedia(nested as Record<string, unknown>, key);
      visit(nested);
    }
  };
  visit(components);
  return components;
}

export function requiredMediaKind(draft: MessageDraft, template: TechProviderTemplate | null): MediaKind | undefined {
  if (["image", "video", "document"].includes(draft.kind)) return draft.kind as MediaKind;
  if (draft.kind === "template" && draft.templateSource === "browse" && !draft.advanced && !templateRequirements(template).requiresAdvanced) return templateRequirements(template).mediaKind;
}

export function validateMessageDraft(draft: MessageDraft, template: TechProviderTemplate | null, file: File | null) {
  if (draft.templateSource === "manual") template = null;
  validateRecipient(draft.to);
  if (draft.replyTo && !draft.replyTo.trim()) throw new Error("Enter a reply message ID or leave the field empty.");
  if (draft.kind === "text" && (!draft.body.trim() || Array.from(draft.body).length > 4096)) throw new Error("Enter a nonempty text message of at most 4096 characters.");
  if (["image", "video", "document"].includes(draft.kind) && Array.from(draft.caption).length > 1024) throw new Error("Keep the attachment caption within 1024 characters.");
  if (draft.kind === "template") {
    if (draft.templateSource === "browse") {
      if (!template || template.status !== "APPROVED") throw new Error("Select an approved template in the required language.");
    } else if (!/^[a-z0-9_]{1,512}$/.test(draft.templateName.trim()) || !draft.templateLanguage.trim()) throw new Error("Enter the approved template name and its Meta language code.");
    const requirements = templateRequirements(template);
    if (draft.advanced || draft.templateSource === "manual" || requirements.requiresAdvanced) {
      const components = parseNativeSendComponents(draft.nativeComponents);
      if (requirements.requiresAdvanced && !components.length) throw new Error("This template needs native send parameters for its buttons or advanced layout.");
    } else for (const field of requirements.fields) {
      if (!draft.values[field.key]?.trim()) throw new Error(`Enter the actual ${field.section} value for {{${field.variable}}}.`);
    }
  }
  const kind = requiredMediaKind(draft, template);
  if (kind) {
    if (draft.mediaSource === "file") {
      if (!file) throw new Error("Choose an attachment to upload and send.");
      validateAttachment(file, kind);
    } else validateMedia(draft.mediaSource === "url" ? { link: draft.mediaUrl } : { id: draft.mediaId }, kind);
    if (kind === "document" && draft.mediaSource !== "file" && draft.filename) validateFilename(draft.filename);
  }
}

export function buildMessagePayload(draft: MessageDraft, template: TechProviderTemplate | null, file: File | null, uploadedUrl?: string): MessagePayload {
  if (draft.templateSource === "manual") template = null;
  validateMessageDraft(draft, template, file);
  const payload: MessagePayload = { to: validateRecipient(draft.to), ...(draft.replyTo ? { context: { message_id: draft.replyTo.trim() } } : {}) };
  if (draft.kind === "text") return { ...payload, type: "text", text: { body: draft.body, preview_url: draft.previewUrl } };
  const mediaKind = requiredMediaKind(draft, template);
  let media: MediaReference | undefined;
  if (mediaKind) {
    if (draft.mediaSource === "file" && !uploadedUrl) throw new Error("Upload the selected attachment before sending.");
    media = draft.mediaSource === "id" ? { id: draft.mediaId } : { link: draft.mediaSource === "file" ? uploadedUrl! : draft.mediaUrl };
    if (mediaKind === "document") {
      const filename = draft.mediaSource === "file" ? file!.name : draft.filename;
      if (filename) media.filename = filename;
    }
    validateMedia(media as Record<string, unknown>, mediaKind);
  }
  if (draft.kind !== "template") return { ...payload, type: draft.kind, [draft.kind]: { ...media, ...(draft.caption ? { caption: draft.caption } : {}) } };
  const requirements = templateRequirements(template);
  let components: NativeSendComponent[];
  if (draft.advanced || draft.templateSource === "manual" || requirements.requiresAdvanced) components = parseNativeSendComponents(draft.nativeComponents);
  else {
    components = [];
    if (mediaKind && media) components.push({ type: "header", parameters: [{ type: mediaKind, [mediaKind]: media }] });
    for (const section of ["header", "body"] as const) {
      const fields = requirements.fields.filter((field) => field.section === section);
      if (fields.length) components.push({ type: section, parameters: fields.map((field) => ({ type: "text", text: draft.values[field.key], ...(field.named ? { parameter_name: field.variable } : {}) })) });
    }
  }
  return { ...payload, template: { name: template?.name || draft.templateName.trim(), language: { code: template?.language || draft.templateLanguage.trim() }, ...(components.length ? { components } : {}) } };
}
