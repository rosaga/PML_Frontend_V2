const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

// Exercise the page's actual SDK callbacks without loading Meta or exchanging real codes.
const source = ts.transpileModule(
  fs.readFileSync(path.join(__dirname, "../src/components/tech-provider/embedded-signup.jsx"), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } },
).outputText;
const organization = "5bf6749b-881c-4fe2-94d2-977a6796e9bd";
const assets = { business_id: "111", waba_id: "222", phone_number_id: "333" };
const flush = async () => { for (let i = 0; i < 5; i++) await new Promise(setImmediate); };

function harness(respond) {
  const slots = [];
  const effects = [];
  const requests = [];
  const timers = new Map();
  let cursor = 0;
  let timerId = 0;
  let listener;
  let login;
  let selectedAccount = organization;
  const router = { replace() {}, push() {} };
  const jsx = (type, props) => ({ type, props });
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [slots[index], (next) => { slots[index] = typeof next === "function" ? next(slots[index]) : next; }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { current: initial };
      return slots[index];
    },
    useEffect(effect) {
      const index = cursor++;
      if (!(index in slots)) { slots[index] = true; effects.push(effect); }
    },
    useMemo(factory) { return factory(); },
  };
  const exports = {};
  const context = {
    exports, URL, AbortSignal, process: { env: {} },
    setTimeout(callback, delay) { const id = ++timerId; timers.set(id, { callback, delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    window: {
      localStorage: { getItem: () => selectedAccount },
      FB: { init() {}, login(callback) { login = callback; } },
      addEventListener(type, callback) { listener = callback; },
      removeEventListener() { listener = null; },
    },
    fetch: async (url, options) => {
      const request = { url, body: JSON.parse(options.body), headers: options.headers };
      requests.push(request);
      const result = respond?.(request) || {};
      return {
        ok: result.status ? result.status < 400 : true,
        status: result.status || 200,
        headers: { get: (name) => name === "content-type" ? "application/json" : result.requestId || null },
        json: async () => result.body || (url.endsWith("/complete")
          ? { status: "active", connection: { status: "ACTIVE" } } : { accepted: true }),
      };
    },
    require(name) {
      if (name === "react") return react;
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx, Fragment: "fragment" };
      if (name === "next/navigation") return { useRouter: () => router };
      if (name === "@/utils/auth") return { getToken: () => "test-access-token" };
      if (name === "@/components/whatsapp/ui/button") return { Button: "button" };
      if (name === "./navigation") return { TECH_PROVIDER_ORGANIZATION_ID: organization };
      return {};
    },
  };
  vm.runInNewContext(source, context);
  const render = () => { cursor = 0; return exports.EmbeddedSignup(); };
  const nodes = (node) => !node || typeof node !== "object" ? []
    : [node, ...[node.props?.children].flat(Infinity).flatMap(nodes)];
  const texts = (node) => typeof node === "string" ? node : node && typeof node === "object"
    ? [node.props?.children].flat(Infinity).map(texts).join(" ") : "";
  render();
  const cleanups = effects.map((effect) => effect());
  const button = () => nodes(render()).find((node) => node.type === "button" && /Connect WhatsApp|WhatsApp Connected/.test(texts(node)));
  return {
    requests,
    completions: () => requests.filter((request) => request.url.endsWith("/complete")),
    launch: () => button().props.onClick(),
    button,
    end: () => nodes(render()).find((node) => node.type === "button" && texts(node) === "End signup attempt").props.onClick(),
    authorize: (code = "test-one-time-code") => login({ authResponse: { code } }),
    loginCallback: () => login,
    event: (event = "FINISH", data = assets, origin = "https://www.facebook.com") => listener({ origin, data: JSON.stringify({ type: "WA_EMBEDDED_SIGNUP", event, data }) }),
    raw: (data) => listener({ origin: "https://www.facebook.com", data }),
    text: () => texts(render()),
    expire: () => { for (const { callback, delay } of [...timers.values()]) if (delay === 30000) callback(); },
    changeOrganization: () => { selectedAccount = "another-organization"; },
    unmount: () => cleanups.forEach((cleanup) => cleanup?.()),
  };
}

for (const order of ["code-first", "event-first"]) {
  test(`completes once with ${order} callbacks, without exposing the code`, async () => {
    const h = harness();
    h.launch();
    if (order === "code-first") { h.authorize(); await h.event(); }
    else { await h.event(); h.authorize(); }
    await flush();
    await h.event();
    h.authorize();
    await flush();
    assert.equal(h.completions().length, 1);
    assert.deepEqual(h.completions()[0].body, {
      organization_id: organization, code: "test-one-time-code",
      configuration_id: "1085280167192120", data: assets,
    });
    assert.equal(h.completions()[0].headers.Authorization, "Bearer test-access-token");
    assert.match(h.text(), /connected successfully/);
    assert.doesNotMatch(h.text(), /test-one-time-code|test-access-token/);
  });
}

for (const callback of ["code", "event"]) {
  test(`missing ${callback} callback times out without calling completion and permits a fresh attempt`, async () => {
    const h = harness();
    h.launch();
    const oldLogin = h.loginCallback();
    if (callback === "code") await h.event(); else h.authorize();
    h.expire();
    assert.equal(h.completions().length, 0);
    assert.match(h.text(), callback === "code" ? /did not return the authorization code/ : /did not return the account details/);
    assert.equal(h.button().props.disabled, false);
    h.launch();
    oldLogin({ authResponse: { code: "stale-code" } });
    await h.event();
    assert.equal(h.completions().length, 0);
    h.authorize("fresh-code");
    await flush();
    assert.equal(h.completions()[0].body.code, "fresh-code");
  });
}

for (const event of ["FINISH_ONLY_WABA", "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING", "CANCEL", "ERROR"]) {
  test(`${event} reports diagnostics and ends waiting without exchanging a code`, async () => {
    const h = harness();
    h.launch();
    h.authorize();
    await h.event(event, { waba_id: "222" });
    await flush();
    assert.equal(h.completions().length, 0);
    assert.equal(h.requests[0].body.event, event);
    assert.equal(h.button().props.disabled, false);
    assert.match(h.text(), /No completion request was sent/);
  });
}

test("invalid SDK messages and untrusted origins do not disrupt signup", async () => {
  const h = harness();
  h.launch();
  const before = h.text();
  await h.raw("SDK message that is not JSON");
  await h.event("FINISH", assets, "https://facebook.com.attacker.example");
  await h.event("FINISH", assets, "http://www.facebook.com");
  assert.equal(h.text(), before);
  assert.equal(h.requests.length, 0);
  h.authorize();
  await h.event();
  assert.equal(h.completions().length, 1);
});

test("missing phone prevents exchange and event reporting strips unrelated data", async () => {
  const h = harness();
  h.launch();
  h.authorize();
  await h.event("FINISH", { business_id: "111", waba_id: "222", code: "never-report-this" });
  assert.equal(h.completions().length, 0);
  assert.match(h.text(), /phone_number_id/);
  assert.doesNotMatch(JSON.stringify(h.requests), /never-report-this/);
});

test("event reporting failure remains visible while completion succeeds", async () => {
  const h = harness(({ url }) => url.endsWith("-events")
    ? { status: 503, body: { error: { code: "UNAVAILABLE", message: "Event reporting unavailable" } }, requestId: "request-123" } : null);
  h.launch();
  h.authorize();
  await h.event();
  await flush();
  assert.equal(h.completions().length, 1);
  assert.match(h.text(), /connected successfully/);
  assert.match(h.text(), /Event reporting unavailable.*request-123/);
});

test("lost completion response is not replayed by duplicate callbacks", async () => {
  const h = harness(({ url }) => { if (url.endsWith("/complete")) throw new TypeError("Failed to fetch"); });
  h.launch();
  h.authorize();
  await h.event();
  await flush();
  await h.event();
  h.authorize();
  await flush();
  assert.equal(h.completions().length, 1);
  assert.match(h.text(), /No response from the WhatsApp API/);
  assert.doesNotMatch(h.text(), /connected successfully/);
});

test("organization changes prevent sending the authorization code", async () => {
  const h = harness();
  h.launch();
  h.authorize();
  h.changeOrganization();
  await h.event();
  assert.equal(h.completions().length, 0);
  assert.match(h.text(), /selected organization changed/);
});

test("unmount clears the callback timeout and ignores late SDK callbacks", async () => {
  const h = harness();
  h.launch();
  h.authorize();
  h.unmount();
  h.expire();
  h.authorize();
  assert.equal(h.requests.length, 0);
});

test("a stalled Meta window can be ended even if neither callback arrives", async () => {
  const h = harness();
  h.launch();
  h.end();
  h.authorize();
  await h.event();
  assert.equal(h.completions().length, 0);
  assert.equal(h.button().props.disabled, false);
  assert.match(h.text(), /Close the Meta window before trying again/);
});
