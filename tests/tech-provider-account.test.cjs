const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");
const vm = require("node:vm");

function loadModule(filename, context) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, "..", filename), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, Error, URL, AbortController, ...context });
  return exports;
}

const account = {
  external_id: "org-a", phone_number_id: "1410377462158272", waba_id: "1773534807196946",
  display_phone: "+1 555-365-6084", created_at: "2026-10-26T07:40:42.377648Z",
  updated_at: "2026-11-04T14:28:23.89042Z", created_by: "creator-id", is_active: true,
  meta_app_id: "1768412394357109", meta_configuration_id: "1085280167192120",
  business_id: "1639599601220023", verified_name: "Rubedo Limited", meta_assets_verified: true,
  meta_lifecycle_status: "", meta_connection_id: "connection-a",
};

function api(fetch, token = "session-token") {
  return loadModule("src/lib/tech-provider/account-api.ts", {
    fetch,
    require(name) {
      if (name === "@/utils/auth") return { getToken: () => token };
      if (name === "./config") return { TECH_PROVIDER_API_BASE_URL: "https://provider.example" };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  }).fetchTechProviderAccount;
}

test("account lookup uses the selected external ID and current bearer token, preserving returned details", async () => {
  const controller = new AbortController();
  const fetchAccount = api(async (url, options) => {
    assert.equal(url, "https://provider.example/api/v2/accounts/org-a");
    assert.equal(options.headers.Authorization, "Bearer session-token");
    assert.equal(options.cache, "no-store");
    assert.equal(options.signal, controller.signal);
    return Response.json({ data: account });
  });
  assert.deepEqual(await fetchAccount("org-a", { signal: controller.signal }), account);
});

test("external IDs are encoded and each organization returns its own Meta connection", async () => {
  const fetchAccount = api(async (url) => {
    const id = decodeURIComponent(new URL(url).pathname.split("/").at(-1));
    assert.equal(new URL(url).pathname, `/api/v2/accounts/${encodeURIComponent(id)}`);
    return Response.json({ data: { ...account, external_id: id, meta_connection_id: `connection-${id}` } });
  });
  for (const id of ["org-a", "org-b", "org/with special?chars"]) {
    assert.equal((await fetchAccount(id)).meta_connection_id, `connection-${id}`);
  }
});

test("unconnected accounts are empty while authentication, server, and malformed-response errors remain errors", async () => {
  assert.equal(await api(async () => new Response(null, { status: 404 }))("org-a"), null);
  assert.equal(await api(async () => Response.json({ data: null }))("org-a"), null);
  for (const [body, status, message] of [
    [{ error: { message: "Account access denied" } }, 403, /Account access denied/],
    [{ message: "Session expired" }, 401, /Session expired/],
    ["Gateway unavailable", 502, /status 502/],
    [{ data: { ...account, external_id: "another-organization" } }, 200, /invalid response/],
    [{ data: {} }, 200, /invalid response/],
  ]) {
    await assert.rejects(api(async () => typeof body === "string" ? new Response(body, { status }) : Response.json(body, { status }))("org-a"), message);
  }
  const noFetch = () => assert.fail("Must not request without organization and session");
  await assert.rejects(api(noFetch)(""), /Select an organization/);
  await assert.rejects(api(noFetch, null)("org-a"), /sign in again/);
});

// Exercise real hooks/effects without a browser or live credentials.
function hooks() {
  const slots = [];
  let cursor = 0;
  const effects = [];
  const react = {
    createContext: () => ({ Provider: "WorkspaceProvider" }),
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [slots[index], (next) => { slots[index] = typeof next === "function" ? next(slots[index]) : next; }];
    },
    useCallback(callback, deps) {
      const index = cursor++;
      if (!slots[index] || deps.some((dep, i) => dep !== slots[index].deps[i])) slots[index] = { callback, deps };
      return slots[index].callback;
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
  return {
    react,
    render(callback, runEffects = true) {
      cursor = 0;
      const result = callback();
      if (!runEffects || !effects.length) return result;
      effects.splice(0).forEach((effect) => effect());
      cursor = 0;
      return callback();
    },
    unmount: () => slots.forEach((slot) => slot?.cleanup?.()),
  };
}
const flush = async () => { for (let i = 0; i < 4; i++) await new Promise(setImmediate); };

function accountHarness() {
  const h = hooks();
  const requests = [];
  let selected = "org-a";
  const { useTechProviderAccount } = loadModule("src/lib/tech-provider/use-account.ts", {
    window: { localStorage: { getItem: () => selected } },
    require(name) {
      if (name === "react") return h.react;
      if (name === "./account-api") return { fetchTechProviderAccount: (externalId, options) => new Promise((resolve, reject) => requests.push({ externalId, options, resolve, reject })) };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return {
    requests,
    render: (runEffects) => h.render(() => useTechProviderAccount(selected), runEffects),
    select: (id) => { selected = id; },
    unmount: h.unmount,
  };
}

test("account state clears immediately on organization changes and ignores stale account responses", async () => {
  const h = accountHarness();
  assert.equal(h.render().accountLoading, true);
  h.requests[0].resolve(account);
  await flush();
  assert.equal(h.render().account.verified_name, "Rubedo Limited");
  h.render().refreshAccount();
  h.render();
  h.select("org-b");
  const switching = h.render(false);
  assert.equal(switching.account, null);
  assert.equal(switching.accountLoading, true);
  h.render();
  assert.equal(h.requests[1].options.signal.aborted, true);
  h.requests[1].resolve(account);
  h.requests[2].resolve({ ...account, external_id: "org-b", meta_connection_id: "connection-b" });
  await flush();
  assert.equal(h.render().account.meta_connection_id, "connection-b");
  assert.equal(h.render().account.external_id, "org-b");
});

test("account refresh recovers errors, clears old connections, and aborts on unmount", async () => {
  const h = accountHarness();
  h.render();
  h.requests[0].reject(new Error("Account access denied"));
  await flush();
  assert.equal(h.render().accountError, "Account access denied");
  assert.equal(h.render().accountLoading, false);
  const refresh = h.render().refreshAccount;
  refresh();
  assert.equal(h.render().refreshAccount, refresh);
  h.requests[1].resolve(account);
  await flush();
  assert.equal(h.render().accountError, "");
  refresh();
  assert.equal(h.render().account, null);
  h.requests[2].resolve(null);
  await flush();
  assert.equal(h.render().account, null);
  assert.equal(h.render().accountLoading, false);
  refresh();
  h.render();
  h.unmount();
  assert.equal(h.requests[3].options.signal.aborted, true);
  h.requests[3].resolve(account);
  await flush();
  assert.equal(h.render().account, null);
});

const jsx = (type, props, key) => ({ type, props, key });
const nodes = (node) => !node || typeof node !== "object" ? [] : [node, ...[node.props?.children].flat(Infinity).flatMap(nodes)];
const text = (node) => typeof node === "string" ? node : node && typeof node === "object" ? [node.props?.children].flat(Infinity).map(text).join(" ") : "";

function accountViews(workspace) {
  const context = {
    require(name) {
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx, Fragment: "fragment" };
      if (name === "./dashboard-shell") return { useTechProviderWorkspace: () => workspace, TechProviderHeader: "Header" };
      if (name === "./navigation") return { TECH_PROVIDER_BASE: "/apps/tech-provider" };
      return new Proxy({}, { get: (_target, key) => key });
    },
  };
  return {
    ...loadModule("src/components/tech-provider/templates-screen.tsx", context),
    ...loadModule("src/components/tech-provider/account-details.tsx", context),
  };
}

test("templates wait for account details, handle missing connections, and remount for each organization's connection", () => {
  const workspace = { account: null, accountLoading: true, accountError: "", refreshAccount() {} };
  const { TemplatesScreen, TemplateBrowser } = accountViews(workspace);
  const browser = () => nodes(TemplatesScreen()).find((node) => node.type === TemplateBrowser);
  assert.match(text(TemplatesScreen()), /Loading WhatsApp account/);
  assert.equal(browser(), undefined);
  workspace.accountLoading = false;
  workspace.accountError = "Account access denied";
  assert.match(text(TemplatesScreen()), /Account access denied/);
  assert.equal(browser(), undefined);
  workspace.accountError = "";
  assert.match(text(TemplatesScreen()), /No WhatsApp account connected/);
  assert.equal(browser(), undefined);
  workspace.account = { ...account, meta_connection_id: null };
  assert.match(text(TemplatesScreen()), /No Meta connection available/);
  assert.equal(browser(), undefined);
  workspace.account = account;
  assert.equal(browser().props.connectionId, "connection-a");
  const firstKey = browser().key;
  workspace.account = { ...account, external_id: "org-b", meta_connection_id: "connection-b" };
  assert.equal(browser().props.connectionId, "connection-b");
  assert.notEqual(browser().key, firstKey);
});

test("Account section renders API details, active and verification flags, refresh, and empty/error states", () => {
  let refreshes = 0;
  const workspace = { account, accountLoading: false, accountError: "", refreshAccount: () => refreshes++ };
  const { AccountDetails } = accountViews(workspace);
  assert.match(text(AccountDetails()), /Rubedo Limited/);
  assert.match(text(AccountDetails()), /\+1 555-365-6084/);
  assert.match(text(AccountDetails()), /Meta Connection ID.*connection-a/);
  assert.match(text(AccountDetails()), /Meta Assets Verified.*Yes/);
  assert.match(text(AccountDetails()), /Active/);
  nodes(AccountDetails()).find((node) => node.props?.["aria-label"] === "Refresh account details").props.onClick();
  assert.equal(refreshes, 1);
  workspace.account = { ...account, is_active: false, meta_assets_verified: false };
  assert.match(text(AccountDetails()), /Inactive/);
  assert.match(text(AccountDetails()), /Meta Assets Verified.*No/);
  workspace.accountLoading = true;
  assert.match(text(AccountDetails()), /Loading account details/);
  assert.doesNotMatch(text(AccountDetails()), /Rubedo Limited/);
  workspace.accountLoading = false;
  workspace.account = null;
  workspace.accountError = "Connection error";
  assert.match(text(AccountDetails()), /Connection error/);
  workspace.accountError = "";
  assert.match(text(AccountDetails()), /No WhatsApp account connected/);
});

test("workspace uses persisted account status, refreshes after signup, and resets its provider on account switches", () => {
  const h = hooks();
  const listeners = new Map();
  let selected = "org-a";
  let refreshes = 0;
  const refresh = () => refreshes++;
  const storage = { getItem: () => selected };
  const router = { replace() {} };
  const { TechProviderShell } = loadModule("src/components/tech-provider/dashboard-shell.tsx", {
    localStorage: storage,
    window: {
      addEventListener: (name, handler) => listeners.set(name, handler),
      removeEventListener: (name) => listeners.delete(name),
    },
    require(name) {
      if (name === "react") return h.react;
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx, Fragment: "fragment" };
      if (name === "next/navigation") return { usePathname: () => "/apps/tech-provider", useRouter: () => router };
      if (name === "@/utils/auth") return { getToken: () => "session-token" };
      if (name === "./navigation") return { navigationGroups: [], TECH_PROVIDER_BASE: "/apps/tech-provider" };
      if (name === "@/lib/whatsapp/utils") return { cn: (...values) => values.join(" ") };
      if (name === "@/lib/tech-provider/use-account") return {
        useTechProviderAccount: (id) => ({ account: id === "org-a" ? account : null, accountLoading: false, accountError: "", refreshAccount: refresh }),
      };
      return new Proxy({}, { get: (_target, key) => key });
    },
  });
  const render = () => h.render(() => TechProviderShell({ children: "workspace" }));
  const first = render();
  assert.equal(first.key, "org-a");
  assert.equal(first.props.value.connected, true);
  first.props.value.markConnected();
  assert.equal(refreshes, 1);
  selected = "org-b";
  listeners.get("storage")();
  const next = render();
  assert.equal(next.key, "org-b");
  assert.equal(next.props.value.account, null);
  assert.equal(next.props.value.connected, false);
  h.unmount();
});
