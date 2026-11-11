const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");
const vm = require("node:vm");

function load(filename, context = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, "..", filename), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, Error, URL, Blob, AbortController, AbortSignal, ...context });
  return exports;
}
const draftApi = load("src/lib/tech-provider/template-draft.ts");
function client(fetch) {
  return load("src/lib/tech-provider/templates-api.ts", {
    fetch,
    require(name) {
      if (name === "@/utils/auth") return { getToken: () => "session-token" };
      if (name === "./config") return { TECH_PROVIDER_API_BASE_URL: "https://provider.example" };
      if (name === "./template-draft") return draftApi;
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
}
const native = (value) => JSON.parse(JSON.stringify(value));
const textDraft = () => ({
  ...draftApi.emptyTemplateDraft(), name: "order_ready", category: "UTILITY", body: "Hello {{1}}, your order {{2}} is ready.",
  bodyExamples: { 2: "A123", 1: "Alex" },
});

test("builder creates only contract fields with ordered positional examples and clean optional buttons", () => {
  const payload = draftApi.buildTemplatePayload({
    ...textDraft(), headerType: "Text", headerText: "Order update", footer: "Thank you for shopping with us",
    buttons: [{ type: "QUICK_REPLY", text: "Contact support", url: "stale-ui-value" }],
  });
  assert.deepEqual(native(payload), {
    name: "order_ready", language: "en_US", category: "UTILITY", parameter_format: "POSITIONAL",
    components: [
      { type: "HEADER", format: "TEXT", text: "Order update" },
      { type: "BODY", text: "Hello {{1}}, your order {{2}} is ready.", example: { body_text: [["Alex", "A123"]] } },
      { type: "FOOTER", text: "Thank you for shopping with us" },
      { type: "BUTTONS", buttons: [{ type: "QUICK_REPLY", text: "Contact support" }] },
    ],
  });
  for (const patch of [{ name: "Invalid Name" }, { name: "a".repeat(513) }, { body: "" }, { language: "" }, { bodyExamples: {} }, { body: "Hello {{2}}" }, { body: "Hello {{name}}" }]) {
    assert.throws(() => draftApi.buildTemplatePayload({ ...textDraft(), ...patch }));
  }
  const header = draftApi.buildTemplatePayload({ ...textDraft(), headerType: "Text", headerText: "Hi {{1}}", headerExamples: { 1: "Alex" } }).components[0];
  assert.deepEqual(native(header.example), { header_text: ["Alex"] });
});

test("authentication uses generated BODY and OTP schema without leaking the custom body, header, or footer", () => {
  const payload = draftApi.buildTemplatePayload({ ...textDraft(), category: "AUTHENTICATION", headerType: "Image", footer: "stale footer" });
  assert.deepEqual(native(payload.components), [
    { type: "BODY", add_security_recommendation: true },
    { type: "FOOTER", code_expiration_minutes: 5 },
    { type: "BUTTONS", buttons: [{ type: "OTP", otp_type: "COPY_CODE", text: "Copy code" }] },
  ]);
  assert.equal(payload.parameter_format, undefined);
});

test("media headers require matching review handles and uploads validate MIME, size, and filename", () => {
  for (const [headerType, format] of [["Image", "IMAGE"], ["Video", "VIDEO"], ["Document", "DOCUMENT"]]) {
    const draft = { ...textDraft(), headerType };
    assert.throws(() => draftApi.buildTemplatePayload(draft), /Upload an? .* review sample/);
    const payload = draftApi.buildTemplatePayload(draft, { header_handle: "4:sample-handle", format });
    assert.deepEqual(native(payload.components[0]), { type: "HEADER", format, example: { header_handle: ["4:sample-handle"] } });
  }
  for (const [type, max] of [["image/png", 5242880], ["image/jpeg", 5242880], ["video/mp4", 16777216], ["application/pdf", 16777216]]) {
    draftApi.validateSampleFile({ name: "sample", type, size: max });
    assert.throws(() => draftApi.validateSampleFile({ name: "sample", type, size: max + 1 }), /no larger/);
  }
  assert.throws(() => draftApi.validateSampleFile({ name: "../sample.png", type: "image/png", size: 1 }), /filenames/);
  assert.throws(() => draftApi.validateSampleFile({ name: "bad\nname.png", type: "image/png", size: 1 }), /filenames/);
  assert.throws(() => draftApi.validateSampleFile({ name: "sample.gif", type: "image/gif", size: 1 }), /Choose a JPEG/);
  assert.throws(() => draftApi.validateSampleFile({ name: "sample.png", type: "image/png", size: 1 }, "VIDEO"), /matching/);
});

test("API uses connection lookup, raw sample bytes and JSON POST; sparse creation results keep draft identity", async () => {
  const payload = draftApi.buildTemplatePayload(textDraft());
  const file = Object.assign(new Blob(["png bytes"], { type: "image/png" }), { name: "sample + review.png" });
  const api = client(async (input, options) => {
    const url = new URL(input);
    assert.equal(options.headers.Authorization, "Bearer session-token");
    if (url.pathname.endsWith("/template-media")) {
      assert.equal(url.searchParams.get("filename"), file.name);
      assert.equal(options.headers["Content-Type"], "image/png");
      assert.equal(options.body, file, "Send the actual File/Blob, without FormData or base64");
      return Response.json({ header_handle: "4:handle", format: "IMAGE", content_type: "image/png", file_size: file.size }, { status: 201 });
    }
    if (url.pathname.endsWith("/templates")) {
      assert.equal(options.method, "POST");
      assert.equal(options.headers["Content-Type"], "application/json");
      assert.deepEqual(JSON.parse(options.body), native(payload));
      return Response.json({ template: { id: "444", category: "UTILITY", status: "PENDING" } }, { status: 201 });
    }
    assert.equal(url.pathname, "/api/v2/meta/connections/selected-connection");
    assert.equal(options.cache, "no-store");
    return Response.json({ connection: { status: "ACTIVE", restart_signup: false } });
  });
  assert.equal((await api.fetchTemplateConnection("selected-connection")).status, "ACTIVE");
  assert.equal((await api.uploadTemplateSample("selected-connection", file)).header_handle, "4:handle");
  assert.deepEqual(native(await api.createTechProviderTemplate("selected-connection", payload)), { id: "444", category: "UTILITY", status: "PENDING", name: "order_ready", language: "en_US" });
});

test("creation preserves error codes/request IDs and marks network, 5xx, and malformed success as uncertain without retries", async () => {
  const payload = draftApi.buildTemplatePayload(textDraft());
  for (const response of [
    () => { throw new TypeError("Failed to fetch"); },
    () => Response.json({ template: {} }, { status: 201 }),
    () => Response.json({ error: { code: "META_REQUEST_FAILED", message: "Meta unavailable" }, request_id: "request-1" }, { status: 502 }),
    () => Response.json({ error: { code: "TEMPLATE_OUTCOME_UNKNOWN", message: "Check status" } }, { status: 409 }),
  ]) {
    let requests = 0;
    const api = client(async () => { requests++; return response(); });
    await assert.rejects(api.createTechProviderTemplate("selected-connection", payload), (error) => error.outcomeUnknown === true);
    assert.equal(requests, 1);
  }
  const api = client(async () => Response.json({ error: { code: "META_RATE_LIMITED", message: "Wait" }, request_id: "request-2" }, { status: 429, headers: { "Retry-After": "45" } }));
  await assert.rejects(api.createTechProviderTemplate("selected-connection", payload), (error) => error.code === "META_RATE_LIMITED" && error.requestId === "request-2" && error.retryAfterMs === 45000 && !error.outcomeUnknown);
});

test("safe reconciliation retains name/language filters across pages and never posts", async () => {
  let requests = 0;
  const api = client(async (input, options) => {
    const url = new URL(input);
    assert.equal(options.method, undefined);
    assert.equal(url.searchParams.get("name"), "order_ready");
    assert.equal(url.searchParams.get("language"), "en_US");
    if (requests++ === 0) return Response.json({ templates: [], paging: { has_next: true, after: "cursor" } });
    assert.equal(url.searchParams.get("after"), "cursor");
    return Response.json({ templates: [{ id: "444", name: "order_ready", language: "en_US", category: "UTILITY", status: "PENDING" }], paging: { has_next: false } });
  });
  assert.equal((await api.findTechProviderTemplate("selected-connection", "order_ready", "en_US")).id, "444");
  assert.equal(requests, 2);
});

test("oversized JSON is rejected before posting and failed sample uploads preserve API diagnostics", async () => {
  const oversized = draftApi.buildTemplatePayload({ ...textDraft(), body: "a".repeat(1048576) });
  await assert.rejects(client(() => assert.fail("Oversized payload must not be posted")).createTechProviderTemplate("selected-connection", oversized), /1 MiB/);
  const file = Object.assign(new Blob(["not-a-real-png"], { type: "image/png" }), { name: "sample.png" });
  const api = client(async () => Response.json({ error: { code: "MEDIA_TYPE_MISMATCH", message: "Invalid signature" } }, { status: 400, headers: { "X-Request-ID": "upload-request" } }));
  await assert.rejects(api.uploadTemplateSample("selected-connection", file), (error) => error.code === "MEDIA_TYPE_MISMATCH" && error.requestId === "upload-request");
});

function editorHarness(respond = {}) {
  const slots = [];
  const effects = [];
  const requests = [];
  const timers = new Map();
  let cursor = 0;
  let timerId = 0;
  let notifications = 0;
  const jsx = (type, props, key) => ({ type, props, key });
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial;
      return [slots[index], (next) => { slots[index] = typeof next === "function" ? next(slots[index]) : next; }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { current: initial };
      return slots[index];
    },
    useEffect(effect, deps) {
      const index = cursor++;
      if (!slots[index] || deps.some((dep, i) => dep !== slots[index].deps[i])) {
        slots[index]?.cleanup?.();
        slots[index] = { deps };
        effects.push(() => { slots[index].cleanup = effect(); });
      }
    },
  };
  const realApi = client(() => assert.fail("Use mocked API methods in the editor"));
  const methods = { TemplateApiError: realApi.TemplateApiError };
  for (const name of ["fetchTemplateConnection", "createTechProviderTemplate", "findTechProviderTemplate", "uploadTemplateSample"]) {
    methods[name] = async (...args) => {
      requests.push({ name, args });
      if (respond[name]) return respond[name](...args);
      if (name === "fetchTemplateConnection") return { status: "ACTIVE", restart_signup: false };
      if (name === "createTechProviderTemplate") return { id: "444", category: args[1].category, status: "PENDING", name: args[1].name, language: args[1].language };
      if (name === "uploadTemplateSample") return { header_handle: "4:uploaded", format: "IMAGE" };
      return null;
    };
  }
  const { TemplateEditor } = load("src/components/tech-provider/template-editor.tsx", {
    URL: { createObjectURL: () => "blob:local-preview", revokeObjectURL() {} },
    window: { setTimeout: (callback) => { const id = ++timerId; timers.set(id, callback); return id; }, clearTimeout: (id) => timers.delete(id) },
    require(name) {
      if (name === "react") return react;
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx, Fragment: "fragment" };
      if (name === "@/lib/tech-provider/template-draft") return draftApi;
      if (name === "@/lib/tech-provider/templates-api") return methods;
      if (name === "./navigation") return { TECH_PROVIDER_BASE: "/apps/tech-provider" };
      return new Proxy({}, { get: (_target, key) => key });
    },
  });
  const nodes = (node) => !node || typeof node !== "object" ? [] : [node, ...[node.props?.children].flat(Infinity).flatMap(nodes)];
  const text = (node) => typeof node === "string" || typeof node === "number" ? String(node) : node && typeof node === "object" ? [node.props?.children].flat(Infinity).map(text).join(" ") : "";
  const render = () => {
    cursor = 0;
    let tree = TemplateEditor({ connectionId: "selected-connection", onCreated: () => notifications++ });
    if (effects.length) {
      effects.splice(0).forEach((effect) => effect());
      cursor = 0;
      tree = TemplateEditor({ connectionId: "selected-connection", onCreated: () => notifications++ });
    }
    return tree;
  };
  const field = (label) => nodes(render()).find((node) => node.props?.["aria-label"] === label || node.type === "Choice" && node.props.label === label);
  return {
    requests, methods, render,
    text: () => text(render()),
    input: (label, value) => field(label).props.onChange({ target: { value } }),
    choice: (label, value) => field(label).props.onChange(value),
    file: (file) => field("Header review sample").props.onChange({ target: { files: [file] } }),
    submit: () => nodes(render()).find((node) => node.type === "form").props.onSubmit({ preventDefault() {} }),
    submitButton: () => nodes(render()).find((node) => node.type === "Button" && node.props.type === "submit"),
    button: (label) => nodes(render()).find((node) => node.type === "Button" && text(node).trim() === label),
    notifications: () => notifications,
    unmount: () => slots.forEach((slot) => slot?.cleanup?.()),
    expireCooldown: () => { for (const callback of [...timers.values()]) callback(); },
  };
}
const flush = async () => { for (let i = 0; i < 5; i++) await new Promise(setImmediate); };
async function ready(h) {
  h.render(); await flush();
  h.input("Template Name", "order_ready");
  h.input("Message Body", "Your order is ready.");
}
const posts = (h) => h.requests.filter((request) => request.name === "createTechProviderTemplate");

test("editor gates connection status and ignores double clicks while a POST is in flight", async () => {
  let resolve;
  const h = editorHarness({ createTechProviderTemplate: () => new Promise((done) => { resolve = done; }) });
  assert.equal(h.submitButton().props.disabled, true);
  await ready(h);
  h.submit(); h.submit();
  await flush();
  assert.equal(posts(h).length, 1);
  assert.equal(h.submitButton().props.disabled, true);
  resolve({ id: "444", name: "order_ready", language: "en_US", status: "PENDING", category: "MARKETING" });
  await flush();
  assert.match(h.text(), /Template submitted:.*order_ready.*PENDING/);
  assert.equal(h.notifications(), 1);
  assert.equal(h.submitButton().props.disabled, true);
  for (const connection of [{ status: "FAILED", restart_signup: false }, { status: "ACTIVE", restart_signup: true }]) {
    const blocked = editorHarness({ fetchTemplateConnection: async () => connection });
    await ready(blocked); blocked.submit(); await flush();
    assert.equal(posts(blocked).length, 0);
    assert.equal(blocked.submitButton().props.disabled, true);
  }
});

test("lost POST response reconciles once by name/language and never submits automatically again", async () => {
  const h = editorHarness({
    createTechProviderTemplate: async () => { throw new h.methods.TemplateApiError("Response lost", "TEMPLATE_OUTCOME_UNKNOWN"); },
    findTechProviderTemplate: async (_connection, name, language) => ({ id: "accepted", name, language, status: "PENDING", category: "MARKETING" }),
  });
  await ready(h); h.submit(); await flush();
  assert.equal(posts(h).length, 1);
  assert.match(h.text(), /Template submitted:.*order_ready.*PENDING/);
  assert.equal(h.notifications(), 1);
  assert.equal(h.requests.filter((request) => request.name === "findTechProviderTemplate").length, 1);
});

test("connection is checked again at submission and authentication does not require a custom message body", async () => {
  let checks = 0;
  const revoked = editorHarness({ fetchTemplateConnection: async () => (++checks === 1 ? { status: "ACTIVE", restart_signup: false } : { status: "RESTRICTED", restart_signup: false }) });
  await ready(revoked); revoked.submit(); await flush();
  assert.equal(posts(revoked).length, 0);
  assert.match(revoked.text(), /CONNECTION_NOT_ACTIVE/);
  const auth = editorHarness();
  auth.render(); await flush();
  auth.input("Template Name", "login_code"); auth.choice("Category", "AUTHENTICATION");
  auth.submit(); await flush();
  assert.equal(posts(auth).length, 1);
  assert.equal(posts(auth)[0].args[1].components[0].text, undefined);
  assert.equal(posts(auth)[0].args[1].components[2].buttons[0].type, "OTP");
});

test("a successful empty lookup permits only an explicit retry, which checks again before posting", async () => {
  const h = editorHarness({ createTechProviderTemplate: async () => { throw new h.methods.TemplateApiError("Response lost", "TEMPLATE_OUTCOME_UNKNOWN"); } });
  await ready(h); h.submit(); await flush();
  assert.equal(posts(h).length, 1);
  assert.ok(h.button("Retry submission"));
  h.button("Retry submission").props.onClick(); await flush();
  assert.equal(posts(h).length, 2);
  await flush();
  assert.equal(posts(h).length, 2, "No repeated POST after the retry is also uncertain");
});

test("uncertain submissions block retries after failed lookups and recheck before an explicit retry", async () => {
  let lookupFails = true;
  let found = false;
  const h = editorHarness({
    createTechProviderTemplate: async () => { throw new h.methods.TemplateApiError("Response lost", "TEMPLATE_OUTCOME_UNKNOWN"); },
    findTechProviderTemplate: async (_connection, name, language) => {
      if (lookupFails) throw new Error("Lookup unavailable");
      return found ? { id: "already-created", name, language, status: "PENDING", category: "MARKETING" } : null;
    },
  });
  await ready(h); h.submit(); await flush();
  assert.match(h.text(), /Lookup unavailable/);
  assert.equal(h.button("Retry submission"), undefined);
  assert.equal(h.submitButton().props.disabled, true);
  lookupFails = false;
  h.button("Check submission status").props.onClick(); await flush();
  assert.ok(h.button("Retry submission"));
  found = true;
  h.button("Retry submission").props.onClick(); await flush();
  assert.equal(posts(h).length, 1, "Retry reconciles a newly visible template instead of POSTing twice");
  assert.match(h.text(), /already-created/);
});

test("validation/server errors retain drafts, surface request IDs, and honor rate-limit cooldowns", async () => {
  const h = editorHarness({ createTechProviderTemplate: async () => { throw new h.methods.TemplateApiError("Correct the template", "INVALID_TEMPLATE", 400, "request-123"); } });
  await ready(h);
  h.input("Message Body", "Hello {{1}}");
  h.submit(); await flush();
  assert.equal(posts(h).length, 0);
  assert.match(h.text(), /Enter a body sample/);
  h.input("Body sample 1", "Alex");
  h.submit(); await flush();
  assert.equal(posts(h).length, 1);
  assert.match(h.text(), /INVALID_TEMPLATE.*request-123/);
  h.methods.createTechProviderTemplate = async () => { throw new h.methods.TemplateApiError("Wait", "META_RATE_LIMITED", 429, "rate-request", 45000); };
  h.submit(); await flush();
  assert.equal(h.submitButton().props.disabled, true);
  assert.match(h.text(), /rate limited/);
  h.expireCooldown();
  assert.equal(h.submitButton().props.disabled, false);
});

test("media submission requires upload and uses only its Meta handle, then clears samples when header type changes", async () => {
  const h = editorHarness();
  await ready(h);
  h.choice("Header Type", "Image");
  h.file({ name: "sample.png", type: "image/png", size: 100 });
  h.submit(); await flush();
  assert.equal(posts(h).length, 0);
  assert.match(h.text(), /Upload an image review sample/);
  h.button("Upload review sample").props.onClick(); await flush();
  assert.match(h.text(), /Review sample uploaded/);
  h.submit(); await flush();
  assert.equal(posts(h)[0].args[1].components[0].example.header_handle[0], "4:uploaded");
  assert.doesNotMatch(JSON.stringify(posts(h)[0].args[1]), /blob:local-preview/);
  h.button("Create another template").props.onClick();
  h.input("Template Name", "other"); h.input("Message Body", "Hi"); h.choice("Header Type", "Video");
  h.submit(); await flush();
  assert.equal(posts(h).length, 1);
});

test("unmount aborts in-flight operations and late success cannot refresh another organization's list", async () => {
  let resolve;
  const h = editorHarness({ createTechProviderTemplate: () => new Promise((done) => { resolve = done; }) });
  await ready(h); h.submit(); await flush();
  const signal = posts(h)[0].args[2];
  h.unmount();
  assert.equal(signal.aborted, true);
  resolve({ id: "late", name: "order_ready", language: "en_US", status: "PENDING", category: "MARKETING" });
  await flush();
  assert.equal(h.notifications(), 0);
});
