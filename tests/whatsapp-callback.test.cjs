const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");
const vm = require("node:vm");

function loadRoute(fetch) {
  const filename = path.join(__dirname, "../src/app/api/whatsapp/account/callback/route.ts");
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(source, { exports, require, fetch, URL });
  return exports;
}

function request(body, token = "session-token", externalId = "org-1") {
  return {
    headers: new Headers(token ? { "x-auth-token": token } : {}),
    nextUrl: new URL(`http://localhost/api/whatsapp/account/callback?external_id=${encodeURIComponent(externalId)}`),
    json: async () => body,
  };
}

test("loading returns the saved callback without exposing account credentials", async () => {
  const route = loadRoute(async (url, options) => {
    assert.equal(url.searchParams.get("organization_external_id"), "org-1");
    assert.equal(options.headers.Authorization, "Bearer session-token");
    assert.equal(options.cache, "no-store");
    return Response.json({ status: "success", data: { callback_url: "https://example.com/callback", APIKey: "private-key", AccessToken: "private-token" } });
  });
  const response = await route.GET(request());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(await response.json(), { data: { callback_url: "https://example.com/callback" } });
});

test("accounts without a callback load an empty setting", async () => {
  const route = loadRoute(async () => Response.json({ status: "success", data: { callback_url: null } }));
  assert.deepEqual(await (await route.GET(request())).json(), { data: { callback_url: "" } });
});

test("saving uses the session bearer token, selected organization, and trimmed URL", async () => {
  const route = loadRoute(async (url, options) => {
    assert.equal(url, "https://peakdata-1048592730476.europe-west4.run.app/api/v2/whatsapp/account/callback");
    assert.equal(options.method, "POST");
    assert.equal(options.headers.Authorization, "Bearer session-token");
    assert.equal(options.headers["Content-Type"], "application/json");
    assert.deepEqual(JSON.parse(options.body), { external_id: "org-2", callback_url: "https://example.com/callback" });
    return Response.json({ data: {} });
  });
  const response = await route.POST(request({ external_id: " org-2 ", callback_url: " https://example.com/callback " }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { data: { external_id: "org-2", callback_url: "https://example.com/callback" } });
});

test("removing a callback sends an explicit empty string", async () => {
  const route = loadRoute(async (_url, options) => {
    assert.deepEqual(JSON.parse(options.body), { external_id: "org-1", callback_url: "" });
    return new Response(null, { status: 204 });
  });
  const response = await route.POST(request({ external_id: "org-1", callback_url: "" }));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).data.callback_url, "");
});

test("requests without a session or organization never reach the upstream API", async () => {
  const route = loadRoute(() => assert.fail("Unexpected upstream request"));
  assert.equal((await route.GET(request(undefined, ""))).status, 401);
  assert.equal((await route.POST(request({}, ""))).status, 401);
  assert.equal((await route.GET(request(undefined, "token", ""))).status, 400);
  for (const body of [null, {}, { external_id: "" }, { external_id: "org-1" }, { external_id: "org-1", callback_url: null }]) {
    assert.equal((await route.POST(request(body))).status, 400);
  }
  const invalid = request();
  invalid.json = async () => { throw new SyntaxError("Invalid JSON"); };
  assert.equal((await route.POST(invalid)).status, 400);
});

test("invalid URLs are rejected before sending a request", async () => {
  const route = loadRoute(() => assert.fail("Unexpected upstream request"));
  for (const callback_url of ["example.com", "/relative", "ftp://example.com", "https://user:password@example.com", "https://example.com/#fragment", "https://example.com/\npath"]) {
    assert.equal((await route.POST(request({ external_id: "org-1", callback_url }))).status, 400, callback_url);
  }
});

test("upstream authorization and account errors retain their status", async () => {
  for (const status of [401, 403, 404, 500]) {
    const route = loadRoute(async () => new Response("Upstream detail", { status }));
    for (const response of [await route.GET(request()), await route.POST(request({ external_id: "org-1", callback_url: "" }))]) {
      assert.equal(response.status, status);
      assert.ok(!(await response.text()).includes("Upstream detail"));
    }
  }
});

test("backend validation errors remain visible to the user", async () => {
  const route = loadRoute(async () => Response.json({ error: "callback_url must use a public address" }, { status: 400 }));
  const response = await route.POST(request({ external_id: "org-1", callback_url: "http://127.0.0.1" }));
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "callback_url must use a public address");
});

test("network failures and invalid account responses do not report success", async () => {
  const route = loadRoute(async () => { throw new Error("Network unavailable"); });
  assert.equal((await route.GET(request())).status, 502);
  assert.equal((await route.POST(request({ external_id: "org-1", callback_url: "" }))).status, 502);
  const invalid = loadRoute(async () => Response.json({ status: "error" }));
  assert.equal((await invalid.GET(request())).status, 502);
});
