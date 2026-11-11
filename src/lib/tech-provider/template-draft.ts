import type { Template, TemplateButton } from "@/lib/whatsapp/whatsapp-api";

export type HeaderType = "No Header" | "Text" | "Image" | "Video" | "Document";
export interface TemplateDraft {
  name: string;
  language: string;
  category: Template["category"];
  headerType: HeaderType;
  headerText: string;
  headerExamples: Record<string, string>;
  body: string;
  bodyExamples: Record<string, string>;
  footer: string;
  buttons: TemplateButton[];
  securityRecommendation: boolean;
  expirationMinutes: string;
  copyCodeText: string;
}

export interface TemplateCreationPayload {
  name: string;
  language: string;
  category: Template["category"];
  parameter_format?: "POSITIONAL" | "NAMED";
  components: Array<{ type: string; [key: string]: unknown }>;
}

export const emptyTemplateDraft = (): TemplateDraft => ({
  name: "", language: "en_US", category: "MARKETING", headerType: "No Header", headerText: "",
  headerExamples: {}, body: "", bodyExamples: {}, footer: "", buttons: [],
  securityRecommendation: true, expirationMinutes: "5", copyCodeText: "Copy code",
});

export function positionalVariables(text: string): string[] {
  return Array.from(new Set(Array.from(text.matchAll(/\{\{(\d+)\}\}/g), (match) => match[1]))).sort((a, b) => Number(a) - Number(b));
}

function examples(text: string, values: Record<string, string>, label: string) {
  const variables = positionalVariables(text);
  const remainder = text.replace(/\{\{\d+\}\}/g, "");
  if (remainder.includes("{{") || remainder.includes("}}")) throw new Error(`${label} variables must use {{1}}, {{2}}, and so on.`);
  variables.forEach((variable, index) => {
    if (variable !== String(index + 1)) throw new Error(`${label} variables must start at {{1}} with no gaps.`);
    if (!values[variable]?.trim()) throw new Error(`Enter a ${label.toLowerCase()} sample for {{${variable}}}.`);
  });
  return variables.map((variable) => values[variable].trim());
}

export function buildTemplatePayload(draft: TemplateDraft, sample?: { header_handle: string; format: string } | null): TemplateCreationPayload {
  const name = draft.name.trim();
  if (!/^[a-z0-9_]{1,512}$/.test(name)) throw new Error("Template name must contain 1–512 lowercase letters, numbers, or underscores.");
  if (!draft.language.trim()) throw new Error("Enter a Meta language code, such as en_US.");
  const payload: TemplateCreationPayload = { name, language: draft.language.trim(), category: draft.category, components: [] };

  if (draft.category === "AUTHENTICATION") {
    if (!draft.copyCodeText.trim()) throw new Error("Enter the copy-code button text.");
    payload.components.push({ type: "BODY", add_security_recommendation: draft.securityRecommendation });
    if (draft.expirationMinutes) {
      const minutes = Number(draft.expirationMinutes);
      if (!Number.isInteger(minutes) || minutes <= 0) throw new Error("Code expiration must be a positive whole number of minutes.");
      payload.components.push({ type: "FOOTER", code_expiration_minutes: minutes });
    }
    payload.components.push({ type: "BUTTONS", buttons: [{ type: "OTP", otp_type: "COPY_CODE", text: draft.copyCodeText.trim() }] });
    return payload;
  }

  payload.parameter_format = "POSITIONAL";
  if (draft.headerType === "Text") {
    if (!draft.headerText.trim()) throw new Error("Enter header text or choose No Header.");
    const samples = examples(draft.headerText, draft.headerExamples, "Header");
    payload.components.push({ type: "HEADER", format: "TEXT", text: draft.headerText, ...(samples.length ? { example: { header_text: samples } } : {}) });
  } else if (draft.headerType !== "No Header") {
    const format = draft.headerType.toUpperCase();
    if (!sample?.header_handle || sample.format !== format) throw new Error(`Upload ${draft.headerType === "Image" ? "an" : "a"} ${draft.headerType.toLowerCase()} review sample before submitting.`);
    payload.components.push({ type: "HEADER", format, example: { header_handle: [sample.header_handle] } });
  }
  if (!draft.body.trim()) throw new Error("Enter the message body.");
  const samples = examples(draft.body, draft.bodyExamples, "Body");
  payload.components.push({ type: "BODY", text: draft.body, ...(samples.length ? { example: { body_text: [samples] } } : {}) });
  if (draft.footer.trim()) payload.components.push({ type: "FOOTER", text: draft.footer });
  if (draft.buttons.length) {
    const buttons = draft.buttons.map((button, index) => {
      if (!button.text.trim()) throw new Error(`Enter text for button ${index + 1}.`);
      const base = { type: button.type, text: button.text.trim() };
      if (button.type === "URL") {
        let url;
        try { url = new URL(button.url || ""); } catch { throw new Error(`Enter a valid URL for button ${index + 1}.`); }
        if (!["https:", "http:"].includes(url.protocol) || (button.url || "").includes("{{")) throw new Error("URL buttons require a complete HTTP or HTTPS URL without variables.");
        return { ...base, url: button.url!.trim() };
      }
      if (button.type === "PHONE_NUMBER") {
        if (!/^\+?[1-9]\d{6,14}$/.test(button.phone_number || "")) throw new Error(`Enter a phone number with country code for button ${index + 1}.`);
        return { ...base, phone_number: button.phone_number };
      }
      return base;
    });
    payload.components.push({ type: "BUTTONS", buttons });
  }
  return payload;
}

export const mediaRules = {
  "image/jpeg": { format: "IMAGE", maxBytes: 5242880 },
  "image/png": { format: "IMAGE", maxBytes: 5242880 },
  "video/mp4": { format: "VIDEO", maxBytes: 16777216 },
  "application/pdf": { format: "DOCUMENT", maxBytes: 16777216 },
} as const;

export function validateSampleFile(file: Pick<File, "name" | "type" | "size">, expectedFormat?: string) {
  if (!file.name || /[\\/\u0000-\u001f\u007f]/.test(file.name)) throw new Error("Sample filenames cannot contain directory separators or control characters.");
  const rule = mediaRules[file.type as keyof typeof mediaRules];
  if (!rule) throw new Error("Choose a JPEG, PNG, MP4, or PDF review sample.");
  if (expectedFormat && rule.format !== expectedFormat) throw new Error(`Choose a file matching the ${expectedFormat.toLowerCase()} header.`);
  if (!file.size || file.size > rule.maxBytes) throw new Error(`The review sample must be nonempty and no larger than ${rule.maxBytes / 1048576} MiB.`);
  return rule;
}
