const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function load(filename, context = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, "..", filename), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, Error, URL, Blob, AbortController, AbortSignal, ...context });
  return exports;
}
const draftApi = load("src/lib/tech-provider/message-draft.ts", { require: () => load("src/lib/tech-provider/template-draft.ts") });
const native = (value) => JSON.parse(JSON.stringify(value));
const draft = (patch = {}) => ({ ...draftApi.emptyMessageDraft(), to: "+254700000001", body: "Hello Alex", ...patch });
const approved = {
  id: "template-a", name: "order_ready", language: "en_US", category: "UTILITY", status: "APPROVED", parameter_format: "POSITIONAL",
  components: [{ type: "BODY", text: "Hello {{1}}, order {{2}} is ready.", example: { body_text: [["SAMPLE", "SAMPLE-ORDER"]] } }],
};
function api(fetch, token = "session-token") {
  return load("src/lib/tech-provider/messages-api.ts", {
    fetch,
    require(name) {
      if (name === "@/utils/auth") return { getToken: () => token };
      if (name === "./config") return { TECH_PROVIDER_API_BASE_URL: "https://provider.example" };
      if (name === "./message-draft") return draftApi;
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
}

test("text payload normalizes recipient, preserves body/reply, and validates Unicode character limits", () => {
  assert.deepEqual(native(draftApi.buildMessagePayload(draft({ previewUrl: true, replyTo: "wamid.original" }), null, null)), { to: "254700000001", type: "text", text: { body: "Hello Alex", preview_url: true }, context: { message_id: "wamid.original" } });
  for (const to of ["0700000001", "254 700000001", "254-700000001", "123456", "1234567890123456", " +254700000001"]) assert.throws(() => draftApi.buildMessagePayload(draft({ to }), null, null), /recipient number/);
  draftApi.buildMessagePayload(draft({ body: "🙂".repeat(4096) }), null, null);
  for (const body of ["   ", "🙂".repeat(4097)]) assert.throws(() => draftApi.buildMessagePayload(draft({ body }), null, null), /4096/);
});

test("approved templates use actual positional/named parameters and omit creation fields and unused components", () => {
  const input = draft({ kind: "template", values: { "body:2": "A123", "body:1": "Alex" } });
  const payload = draftApi.buildMessagePayload(input, approved, null);
  assert.deepEqual(native(payload.template), { name: "order_ready", language: { code: "en_US" }, components: [{ type: "body", parameters: [{ type: "text", text: "Alex" }, { type: "text", text: "A123" }] }] });
  assert.doesNotMatch(JSON.stringify(payload), /SAMPLE|example|category/);
  const named = { ...approved, parameter_format: "NAMED", components: [{ type: "HEADER", format: "TEXT", text: "Hello {{customer}}" }, { type: "BODY", text: "Order {{order}}" }] };
  const parameters = draftApi.buildMessagePayload(draft({ kind: "template", values: { "header:customer": "Alex", "body:order": "A123" } }), named, null).template.components;
  assert.equal(parameters[0].parameters[0].parameter_name, "customer");
  assert.equal(parameters[1].parameters[0].parameter_name, "order");
  assert.equal(draftApi.buildMessagePayload(input, { ...approved, components: [{ type: "BODY", text: "Hello" }] }, null).template.components, undefined);
  assert.throws(() => draftApi.buildMessagePayload(input, { ...approved, status: "PENDING" }, null), /approved template/);
  assert.throws(() => draftApi.buildMessagePayload(draft({ kind: "template" }), approved, null), /actual body value/);
});

test("local media templates use delivery URLs and DOC filenames, never review handles", () => {
  const file = { name: "receipt.pdf", type: "application/pdf", size: 100 };
  const template = { ...approved, components: [{ type: "HEADER", format: "DOCUMENT", example: { header_handle: ["4:review-only"] } }, { type: "BODY", text: "Order {{1}}" }] };
  const input = draft({ kind: "template", values: { "body:1": "A123" } });
  const payload = draftApi.buildMessagePayload(input, template, file, "https://cdn.example/receipt.pdf");
  assert.deepEqual(native(payload.template.components[0]), { type: "header", parameters: [{ type: "document", document: { link: "https://cdn.example/receipt.pdf", filename: "receipt.pdf" } }] });
  assert.doesNotMatch(JSON.stringify(payload), /header_handle|4:review-only|category|caption/);
  assert.throws(() => draftApi.buildMessagePayload(input, template, file), /Upload the selected/);
});

test("native parameters preserve buttons and carousel cards, while rejecting creation schemas and review handles", () => {
  const components = [
    { type: "body", parameters: [{ type: "text", parameter_name: "name", text: "Alex" }] },
    { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: "order-123" }] },
    { type: "carousel", cards: [{ card_index: 0, components: [{ type: "header", parameters: [{ type: "image", image: { link: "https://cdn.example/photo.png" } }] }] }] },
  ];
  const input = draft({ kind: "template", templateSource: "manual", templateName: "native_template", templateLanguage: "sw", nativeComponents: JSON.stringify(components) });
  const payload = draftApi.buildMessagePayload(input, approved, null);
  assert.equal(payload.template.name, "native_template", "Manual identity must not reuse a previously selected template");
  assert.deepEqual(native(payload.template.components), components);
  for (const value of ["{}", "invalid", '[{"type":"BODY"}]', '[{"type":"body","text":"custom body"}]', '[{"type":"header","parameters":[{"header_handle":"4:review"}]}]']) assert.throws(() => draftApi.parseNativeSendComponents(value));
});

test("attachment validation enforces MIME/size, filenames and public URL/media-ID contracts", () => {
  for (const [type, size] of [["image/jpeg", 5242880], ["image/png", 5242880], ["video/mp4", 16777216], ["application/pdf", 16777216]]) {
    draftApi.validateAttachment({ name: "sample", type, size });
    assert.throws(() => draftApi.validateAttachment({ name: "sample", type, size: size + 1 }), /at most/);
  }
  for (const file of [{ name: "bad/path", type: "image/png", size: 1 }, { name: "file", type: "image/png", size: 0 }, { name: "file.gif", type: "image/gif", size: 1 }]) assert.throws(() => draftApi.validateAttachment(file));
  for (const mediaUrl of ["data:image/png;base64,abc", "https://user:secret@example.com/file", "https://cdn.example/file#fragment"]) assert.throws(() => draftApi.buildMessagePayload(draft({ kind: "image", mediaSource: "url", mediaUrl }), null, null));
  const payload = draftApi.buildMessagePayload(draft({ kind: "document", mediaSource: "id", mediaId: "1234567890", filename: "invoice.docx", caption: "Your invoice" }), null, null);
  assert.deepEqual(native(payload.document), { id: "1234567890", filename: "invoice.docx", caption: "Your invoice" });
  assert.throws(() => draftApi.buildMessagePayload(draft({ kind: "document", mediaSource: "id", mediaId: "4:review" }), null, null), /delivery-media IDs/);
  assert.throws(() => draftApi.buildMessagePayload(draft({ kind: "image", mediaSource: "url", mediaUrl: "https://cdn.example/file", caption: "🙂".repeat(1025) }), null, null), /1024/);
  assert.throws(() => draftApi.buildMessagePayload(draft({ kind: "document", mediaSource: "id", mediaId: "123", filename: "é".repeat(128) }), null, null), /255 bytes/);
});

test("API uploads raw bytes with encoded filename, then sends correct routes with session bearer headers", async () => {
  const calls = [];
  const file = Object.assign(new Blob(["pdf bytes"], { type: "application/pdf" }), { name: "invoice + copy.pdf" });
  const client = api(async (url, options) => {
    calls.push({ url, options });
    assert.equal(options.headers.Authorization, "Bearer session-token");
    if (url.includes("/template-assets")) {
      assert.equal(new URL(url).searchParams.get("filename"), file.name);
      assert.equal(options.body, file);
      assert.equal(options.headers["Content-Type"], "application/pdf");
      return Response.json({ asset: { secure_url: "https://cdn.example/invoice.pdf", resource_type: "raw", public_id: "stored-asset" } }, { status: 201 });
    }
    assert.equal(options.headers["Content-Type"], "application/json");
    return Response.json({ messaging_product: "whatsapp", messages: [{ id: "wamid.accepted" }] }, { status: 202, headers: { "X-Request-ID": "send-request" } });
  });
  const asset = await client.uploadMessageAsset("org/connection", file);
  const payload = draftApi.buildMessagePayload(draft({ kind: "document" }), null, file, asset.secure_url);
  const receipt = await client.sendTechProviderMessage("org/connection", payload);
  assert.equal(calls[1].url, "https://provider.example/api/v2/meta/connections/org%2Fconnection/messages");
  assert.equal(receipt.id, "wamid.accepted");
  assert.equal(receipt.requestId, "send-request");
  assert.equal(receipt.messageStatus, undefined);
  await client.sendTechProviderMessage("connection", draftApi.buildMessagePayload(draft({ kind: "template", values: { "body:1": "Alex", "body:2": "A123" } }), approved, null));
  assert.ok(calls[2].url.endsWith("/messages/template"));
});

test("send failures retain diagnostics and never retry; upload failures are never treated as uncertain sends", async () => {
  for (const response of [
    () => { throw new TypeError("Failed to fetch"); },
    () => Response.json({ data: { messages: [{ id: "wrong-wrapper" }] } }, { status: 202 }),
    () => new Response("Malformed receipt", { status: 202, headers: { "X-Request-ID": "malformed" } }),
    () => Response.json({ error: { code: "META_REQUEST_FAILED", message: "Upstream unavailable" }, request_id: "upstream" }, { status: 502 }),
    () => Response.json({ error: { code: "MESSAGE_OUTCOME_UNKNOWN", message: "Check outcome" } }, { status: 409 }),
  ]) {
    let requests = 0;
    const client = api(async () => { requests++; return response(); });
    await assert.rejects(client.sendTechProviderMessage("connection", { to: "254700000001", type: "text", text: { body: "Hello", preview_url: false } }), (error) => error.outcomeUnknown && error.phase === "send");
    assert.equal(requests, 1);
  }
  const file = Object.assign(new Blob(["png"], { type: "image/png" }), { name: "file.png" });
  const upload = api(async () => Response.json({ error: { code: "ASSET_STORAGE_NOT_CONFIGURED", message: "Storage unavailable" }, request_id: "storage" }, { status: 503 }));
  await assert.rejects(upload.uploadMessageAsset("connection", file), (error) => !error.outcomeUnknown && error.phase === "upload" && error.code === "ASSET_STORAGE_NOT_CONFIGURED" && error.requestId === "storage");
  const closed = api(async () => Response.json({ error: { code: "CUSTOMER_SERVICE_WINDOW_CLOSED", message: "Use a template" } }, { status: 409 }));
  await assert.rejects(closed.sendTechProviderMessage("connection", {}), (error) => !error.outcomeUnknown && error.code === "CUSTOMER_SERVICE_WINDOW_CLOSED");
});

test("missing sessions/connections and oversized JSON cannot produce sends", async () => {
  const noFetch = () => assert.fail("Must not request");
  await assert.rejects(api(noFetch, null).sendTechProviderMessage("connection", {}), /sign in again/);
  await assert.rejects(api(noFetch).sendTechProviderMessage("", {}), /Meta connection/);
  await assert.rejects(api(noFetch).sendTechProviderMessage("connection", { text: { body: "x".repeat(1048576) } }), /1 MiB/);
});

function composerHarness(respond = {}) {
  const slots = [], effects = [], requests = [], revoked = [], timers = new Map();
  let cursor = 0, selectedAccount = "org-a", nextTimer = 0;
  const jsx = (type, props, key) => ({ type, props, key });
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial;
      return [slots[index], (next) => { slots[index] = typeof next === "function" ? next(slots[index]) : next; }];
    },
    useRef(initial) { const index = cursor++; if (!(index in slots)) slots[index] = { current: initial }; return slots[index]; },
    useEffect(effect, deps) {
      const index = cursor++;
      if (!slots[index] || deps.some((dep, i) => dep !== slots[index].deps[i])) {
        slots[index]?.cleanup?.(); slots[index] = { deps };
        effects.push(() => { slots[index].cleanup = effect(); });
      }
    },
  };
  const MessageApiError = api(noNetwork).MessageApiError;
  const TemplateApiError = load("src/lib/tech-provider/templates-api.ts", { require: (name) => name === "./template-draft" ? load("src/lib/tech-provider/template-draft.ts") : {}, fetch: noNetwork }).TemplateApiError;
  const methods = { MessageApiError, TemplateApiError };
  function noNetwork() { assert.fail("Use mocked API methods"); }
  for (const name of ["fetchTemplateConnection", "fetchTechProviderTemplates", "uploadMessageAsset", "sendTechProviderMessage"]) {
    methods[name] = async (...args) => {
      requests.push({ name, args });
      if (respond[name]) return respond[name](...args);
      if (name === "fetchTemplateConnection") return { status: "ACTIVE", restart_signup: false };
      if (name === "fetchTechProviderTemplates") return { templates: [approved], paging: { has_next: false, has_previous: false } };
      if (name === "uploadMessageAsset") return { secure_url: "https://cdn.example/photo.png", public_id: "retained-asset", resource_type: "image" };
      return { id: "wamid.accepted", requestId: "request-123" };
    };
  }
  const { SingleMessageComposer } = load("src/components/tech-provider/single-message-composer.tsx", {
    URL: { createObjectURL: (file) => `blob:${file.name}`, revokeObjectURL: (url) => revoked.push(url) },
    window: { localStorage: { getItem: () => selectedAccount }, setTimeout: (callback) => { const id = ++nextTimer; timers.set(id, callback); return id; }, clearTimeout: (id) => timers.delete(id) },
    require(name) {
      if (name === "react") return react;
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx, Fragment: "fragment" };
      if (name.endsWith("/message-draft")) return draftApi;
      if (name.endsWith("/messages-api") || name.endsWith("/templates-api")) return methods;
      if (name === "./navigation") return { TECH_PROVIDER_BASE: "/apps/tech-provider" };
      return new Proxy({}, { get: (_target, key) => key });
    },
  });
  const nodes = (node) => !node || typeof node !== "object" ? [] : [node, ...[node.props?.children].flat(Infinity).flatMap(nodes)];
  const text = (node) => typeof node === "string" || typeof node === "number" ? String(node) : node && typeof node === "object" ? [node.props?.children].flat(Infinity).map(text).join(" ") : "";
  const render = () => {
    cursor = 0;
    let tree = SingleMessageComposer({ connectionId: "connection-a", externalId: "org-a" });
    if (effects.length) {
      effects.splice(0).forEach((effect) => effect()); cursor = 0;
      tree = SingleMessageComposer({ connectionId: "connection-a", externalId: "org-a" });
    }
    return tree;
  };
  const field = (label) => nodes(render()).find((node) => node.props?.["aria-label"] === label || node.type === "Choice" && node.props.label === label);
  return {
    requests, revoked, methods, render,
    text: () => text(render()),
    input: (label, value) => field(label).props.onChange({ target: { value } }),
    choice: (label, value) => field(label).props.onChange(value),
    type: (type) => nodes(render()).find((node) => node.type === "Tabs").props.onValueChange(type),
    file: (file) => field("Attachment file").props.onChange({ target: { files: [file] } }),
    submit: () => nodes(render()).find((node) => node.type === "form").props.onSubmit({ preventDefault() {} }),
    submitButton: () => nodes(render()).find((node) => node.type === "Button" && node.props.type === "submit"),
    button: (label) => nodes(render()).find((node) => node.type === "Button" && text(node).trim() === label),
    value: (label) => field(label).props.value,
    expireCooldown: () => [...timers.values()].forEach((callback) => callback()),
    selectOrganization: (id) => { selectedAccount = id; },
    unmount: () => slots.forEach((slot) => slot?.cleanup?.()),
  };
}
const flush = async () => { for (let i = 0; i < 5; i++) await new Promise(setImmediate); };
const sends = (h) => h.requests.filter((request) => request.name === "sendTechProviderMessage");
const uploads = (h) => h.requests.filter((request) => request.name === "uploadMessageAsset");
async function readyComposer(h) {
  h.render(); await flush();
  h.input("Recipient Phone Number", "+254700000001"); h.input("Message", "Hello Alex");
}

test("composer disables during sends, prevents double clicks and displays accepted rather than delivered status", async () => {
  let resolve;
  const h = composerHarness({ sendTechProviderMessage: () => new Promise((done) => { resolve = done; }) });
  assert.equal(h.submitButton().props.disabled, true);
  await readyComposer(h);
  h.submit(); h.submit(); await flush();
  assert.equal(sends(h).length, 1); assert.equal(uploads(h).length, 0);
  assert.equal(h.submitButton().props.disabled, true);
  resolve({ id: "wamid.accepted", requestId: "request-123" }); await flush();
  assert.match(h.text(), /Accepted by WhatsApp.*wamid.accepted.*request-123/);
  assert.match(h.text(), /does not confirm delivery/);
  assert.equal(h.submitButton().props.disabled, true);
});

test("attachment failure keeps the file; known send failure keeps the uploaded asset for a manual retry", async () => {
  let sendCount = 0;
  const h = composerHarness({ sendTechProviderMessage: async () => {
    if (sendCount++ === 0) throw new h.methods.MessageApiError("Check recipient", "send", "MESSAGE_UNDELIVERABLE", 422, "failed-send");
    return { id: "wamid.second", requestId: "second-request" };
  } });
  await readyComposer(h); h.type("image"); h.file({ name: "photo.png", type: "image/png", size: 100 });
  h.input("Caption", "Your photo"); h.submit(); h.submit(); await flush();
  assert.equal(uploads(h).length, 1); assert.equal(sends(h).length, 1);
  assert.match(h.text(), /MESSAGE_UNDELIVERABLE.*failed-send/);
  assert.equal(h.value("Caption"), "Your photo");
  h.submit(); await flush();
  assert.equal(uploads(h).length, 1, "Manual retry reuses the retained upload URL");
  assert.equal(sends(h).length, 2);
  assert.equal(sends(h)[1].args[1].image.link, "https://cdn.example/photo.png");
  const failedUpload = composerHarness({ uploadMessageAsset: async () => { throw new failedUpload.methods.MessageApiError("Storage unavailable", "upload", "ASSET_STORAGE_NOT_CONFIGURED", 503, "upload-request"); } });
  await readyComposer(failedUpload); failedUpload.type("image"); failedUpload.file({ name: "photo.png", type: "image/png", size: 100 });
  failedUpload.submit(); await flush();
  assert.equal(sends(failedUpload).length, 0);
  assert.match(failedUpload.text(), /Attachment upload failed.*upload-request/);
  failedUpload.submit(); await flush();
  assert.equal(uploads(failedUpload).length, 2, "The local file survives an upload failure");
});

test("unknown send outcomes block repeated requests until explicitly unlocked, retaining draft and upload", async () => {
  const h = composerHarness({ sendTechProviderMessage: async () => { throw new h.methods.MessageApiError("Response lost", "send", "MESSAGE_OUTCOME_UNKNOWN", 409, "uncertain-request", true); } });
  await readyComposer(h); h.type("image"); h.file({ name: "photo.png", type: "image/png", size: 100 });
  h.submit(); await flush(); h.submit(); await flush();
  assert.equal(sends(h).length, 1); assert.equal(uploads(h).length, 1);
  assert.match(h.text(), /Send outcome unknown/); assert.match(h.text(), /uncertain-request/);
  assert.equal(h.submitButton().props.disabled, true);
  h.button("Outcome resolved — unlock draft").props.onClick();
  assert.equal(sends(h).length, 1, "Unlock itself must not send");
  h.submit(); await flush();
  assert.equal(sends(h).length, 2); assert.equal(uploads(h).length, 1);
});

test("approved templates load with filters and send actual values in the selected language", async () => {
  const h = composerHarness();
  await readyComposer(h); h.type("template"); h.render(); await flush();
  const request = h.requests.find((request) => request.name === "fetchTechProviderTemplates");
  assert.equal(request.args[0], "connection-a"); assert.equal(request.args[1].status, "APPROVED");
  h.input("Approved template", "template-a:en_US");
  h.input("Template body:1", "Alex"); h.input("Template body:2", "A123");
  h.submit(); await flush();
  assert.equal(uploads(h).length, 0);
  assert.deepEqual(native(sends(h)[0].args[1].template), { name: "order_ready", language: { code: "en_US" }, components: [{ type: "body", parameters: [{ type: "text", text: "Alex" }, { type: "text", text: "A123" }] }] });
});

test("customer-service errors offer template switching and rate-limit errors enforce a cooldown", async () => {
  const h = composerHarness({ sendTechProviderMessage: async () => { throw new h.methods.MessageApiError("Use a template", "send", "CUSTOMER_SERVICE_WINDOW_CLOSED", 409); } });
  await readyComposer(h); h.submit(); await flush();
  h.button("Use an approved template").props.onClick(); h.render(); await flush();
  assert.ok(h.requests.some((request) => request.name === "fetchTechProviderTemplates"));
  const limited = composerHarness({ sendTechProviderMessage: async () => { throw new limited.methods.MessageApiError("Wait", "send", "META_RATE_LIMITED", 429, "rate-request", false, 45000); } });
  await readyComposer(limited); limited.submit(); await flush();
  assert.equal(limited.submitButton().props.disabled, true);
  limited.expireCooldown(); assert.equal(limited.submitButton().props.disabled, false);
});

test("invalid drafts cannot upload or send, and inactive/revoked connections block sending", async () => {
  const h = composerHarness(); await readyComposer(h);
  h.input("Recipient Phone Number", "254 700000001"); h.submit(); await flush();
  assert.equal(sends(h).length, 0);
  let checks = 0;
  const revoked = composerHarness({ fetchTemplateConnection: async () => (++checks === 1 ? { status: "ACTIVE", restart_signup: false } : { status: "RESTRICTED", restart_signup: false }) });
  await readyComposer(revoked); revoked.submit(); await flush();
  assert.equal(sends(revoked).length, 0); assert.match(revoked.text(), /CONNECTION_NOT_ACTIVE/);
});

test("organization changes/unmount while uploading cannot send or update the new account, and previews are revoked", async () => {
  let resolve;
  const h = composerHarness({ uploadMessageAsset: () => new Promise((done) => { resolve = done; }) });
  await readyComposer(h); h.type("image"); h.file({ name: "photo.png", type: "image/png", size: 100 }); h.render();
  h.submit(); await flush();
  const signal = uploads(h)[0].args[2];
  h.selectOrganization("org-b"); h.unmount();
  assert.equal(signal.aborted, true); assert.ok(h.revoked.includes("blob:photo.png"));
  resolve({ secure_url: "https://cdn.example/photo.png", resource_type: "image", public_id: "asset" }); await flush();
  assert.equal(sends(h).length, 0);
});
