const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");
const vm = require("node:vm");

function loadModule(filename, context) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, "..", filename), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(source, { exports, URL, Error, ...context });
  return exports;
}

const template = {
  id: "1903787810901941", name: "rubedo_template", language: "en", category: "MARKETING",
  status: "APPROVED", parameter_format: "POSITIONAL", rejected_reason: "NONE",
  components: [{ type: "HEADER", format: "TEXT", text: "Rubedo Test" }, { type: "BODY", text: "This is an initial rubedo test template" }],
};

function api(fetch, { token = "current-session-token", env = {}, connectionId = "account-meta-connection" } = {}) {
  const config = loadModule("src/lib/tech-provider/config.ts", { process: { env } });
  const draft = loadModule("src/lib/tech-provider/template-draft.ts", {});
  const client = loadModule("src/lib/tech-provider/templates-api.ts", {
    fetch,
    require(name) {
      if (name === "@/utils/auth") return { getToken: () => token };
      if (name === "./config") return config;
      if (name === "./template-draft") return draft;
      throw new Error(`Unexpected runtime dependency: ${name}`);
    },
  });
  return (options) => client.fetchTechProviderTemplates(connectionId, options);
}

test("loads the account's connection templates with the current session token and preserves components", async () => {
  const fetchTemplates = api(async (url, options) => {
    assert.equal(url, "https://peakwhatsappdev-1048592730476.europe-west4.run.app/api/v2/meta/connections/account-meta-connection/templates?limit=25");
    assert.equal(options.headers.Authorization, "Bearer current-session-token");
    assert.equal(options.cache, "no-store");
    return Response.json({ templates: [template], paging: { before: "first", after: "last", has_next: false, has_previous: false } });
  });
  const result = await fetchTemplates();
  assert.deepEqual(result.templates, [template]);
  assert.equal(result.paging.has_next, false);
});

test("supports forward and backward opaque cursors, cancellation, and configured API settings", async () => {
  const controller = new AbortController();
  const cursors = [{ after: "next+/=&" }, { before: "previous+/=&" }];
  let index = 0;
  const fetchTemplates = api(async (input, options) => {
    const url = new URL(input);
    assert.equal(url.origin, "https://provider.example");
    assert.equal(url.pathname, "/api/v2/meta/connections/configured-connection/templates");
    assert.equal(options.signal, controller.signal);
    const [key, value] = Object.entries(cursors[index++])[0];
    assert.equal(url.searchParams.get(key), value);
    assert.equal(url.searchParams.has(key === "after" ? "before" : "after"), false);
    return Response.json({ templates: [], paging: { has_next: false, has_previous: true } });
  }, { connectionId: "configured-connection", env: { NEXT_PUBLIC_PEAKWHATSAPP_API_BASE_URL: "https://provider.example///" } });
  for (const cursor of cursors) await fetchTemplates({ ...cursor, signal: controller.signal });
  assert.equal(index, 2);
});

test("missing sessions prevent requests", async () => {
  await assert.rejects(api(() => assert.fail("Must not request without a session"), { token: null })(), /sign in again/);
});

test("a missing connection never falls back to another organization's connection", async () => {
  await assert.rejects(api(() => assert.fail("Must not request without a connection"), { connectionId: "" })(), /does not have a Meta connection/);
});

test("API errors, invalid responses, network failures, and cancellation are not treated as empty lists", async () => {
  for (const [body, status, message] of [
    [{ error: { message: "Connection access denied" } }, 403, /Connection access denied/],
    [{ message: "Session expired" }, 401, /Session expired/],
    ["Gateway unavailable", 502, /status 502/],
    [{ data: [] }, 200, /invalid response/],
  ]) {
    await assert.rejects(api(async () => typeof body === "string" ? new Response(body, { status }) : Response.json(body, { status }))(), message);
  }
  await assert.rejects(api(async () => { throw new TypeError("Failed to fetch"); })(), /Failed to fetch/);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(api(async (_url, options) => { options.signal.throwIfAborted(); })({ signal: controller.signal }), { name: "AbortError" });
});

// Run the real screen's callbacks and effects, with UI primitives represented as nodes.
function screenHarness() {
  const slots = [];
  const effects = [];
  const requests = [];
  let cursor = 0;
  const jsx = (type, props) => ({ type, props });
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [slots[index], (next) => { slots[index] = typeof next === "function" ? next(slots[index]) : next; }];
    },
    useEffect(effect, deps) {
      const index = cursor++;
      const previous = slots[index];
      if (!previous || deps.some((dep, index) => dep !== previous.deps[index])) {
        previous?.cleanup?.();
        slots[index] = { deps };
        effects.push(() => { slots[index].cleanup = effect(); });
      }
    },
  };
  const { TemplateBrowser } = loadModule("src/components/tech-provider/templates-screen.tsx", {
    AbortController,
    require(name) {
      if (name === "react") return react;
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx, Fragment: "fragment" };
      if (name === "@/lib/tech-provider/templates-api") return {
        fetchTechProviderTemplates(connectionId, options) {
          return new Promise((resolve, reject) => requests.push({ connectionId, options, resolve, reject }));
        },
      };
      return new Proxy({}, { get: (_target, key) => key });
    },
  });
  const nodes = (node) => !node || typeof node !== "object" ? [] : [node, ...[node.props?.children].flat(Infinity).flatMap(nodes)];
  const text = (node) => typeof node === "string" || typeof node === "number" ? String(node) : node && typeof node === "object" ? [node.props?.children].flat(Infinity).map(text).join(" ") : "";
  const render = () => {
    cursor = 0;
    let tree = TemplateBrowser({ connectionId: "selected-account-connection" });
    if (effects.length) {
      effects.splice(0).forEach((effect) => effect());
      cursor = 0;
      tree = TemplateBrowser({ connectionId: "selected-account-connection" });
    }
    return tree;
  };
  return {
    requests,
    render,
    text: () => text(render()),
    find: (label) => nodes(render()).find((node) => node.props?.["aria-label"] === label),
    node: (type) => nodes(render()).find((node) => node.type === type),
    unmount: () => slots.forEach((slot) => slot?.cleanup?.()),
  };
}
const flush = async () => { for (let i = 0; i < 4; i++) await new Promise(setImmediate); };

test("template screen renders results, filters, previews components, and follows cursor paging", async () => {
  const h = screenHarness();
  assert.match(h.text(), /Loading templates/);
  assert.equal(h.requests[0].connectionId, "selected-account-connection");
  h.requests[0].resolve({ templates: [template], paging: { after: "next-cursor", has_next: true, has_previous: false } });
  await flush();
  assert.match(h.text(), /rubedo_template.*MARKETING.*en.*APPROVED/);
  assert.equal(h.find("Previous page").props.disabled, true);
  h.find("View rubedo_template").props.onClick();
  assert.deepEqual(h.node("WhatsAppPreview").props.template.components, template.components);
  h.find("Search templates by name").props.onChange({ target: { value: "missing" } });
  assert.match(h.text(), /No templates match your filters/);
  h.find("Search templates by name").props.onChange({ target: { value: "RUBEDO" } });
  assert.match(h.text(), /rubedo_template/);
  h.node("Choice").props.onChange("Rejected");
  assert.match(h.text(), /No templates match your filters/);
  h.node("Choice").props.onChange("All Statuses");
  h.find("Next page").props.onClick();
  h.render();
  assert.equal(h.requests[0].options.signal.aborted, true);
  assert.equal(h.requests[1].options.after, "next-cursor");
  h.requests[1].resolve({ templates: [], paging: { before: "previous-cursor", has_previous: true, has_next: false } });
  await flush();
  assert.match(h.text(), /No templates found/);
  assert.equal(h.find("Next page").props.disabled, true);
  h.find("Previous page").props.onClick();
  h.render();
  assert.equal(h.requests[2].options.before, "previous-cursor");
  h.unmount();
  assert.equal(h.requests[2].options.signal.aborted, true);
});

test("template screen retries errors and ignores stale responses after refresh or unmount", async () => {
  const h = screenHarness();
  h.render();
  h.requests[0].reject(new Error("Connection access denied"));
  await flush();
  assert.match(h.text(), /Connection access denied/);
  assert.doesNotMatch(h.text(), /No templates found/);
  // Locate the retry button by its children, as the other buttons have accessible icon labels.
  const walk = (node) => !node || typeof node !== "object" ? [] : [node, ...[node.props?.children].flat(Infinity).flatMap(walk)];
  walk(h.render()).find((node) => node.type === "Button" && node.props.children === "Try again").props.onClick();
  h.render();
  h.requests[1].resolve({ templates: [template], paging: {} });
  await flush();
  assert.doesNotMatch(h.text(), /Connection access denied/);
  h.find("Refresh templates").props.onClick();
  h.render();
  h.unmount();
  h.requests[2].resolve({ templates: [{ ...template, name: "stale-template" }], paging: {} });
  await flush();
  assert.doesNotMatch(h.text(), /stale-template/);
});
