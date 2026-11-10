const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const componentRoot = path.join(root, "src/components/tech-provider");
const sourceFile = (filename) => ts.createSourceFile(filename, fs.readFileSync(filename, "utf8"), ts.ScriptTarget.Latest, true, filename.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
const resolveLocal = (specifier, importer) => {
  const base = specifier.startsWith("@/") ? path.join(root, "src", specifier.slice(2)) : path.resolve(path.dirname(importer), specifier);
  return [base, ...[".tsx", ".ts", ".jsx", ".js"].map((extension) => base + extension)].find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
};

test("preview screens and all their local runtime imports contain no API transports or Bulk WhatsApp providers", () => {
  const visited = new Set();
  function audit(filename) {
    if (visited.has(filename)) return;
    visited.add(filename);
    const source = sourceFile(filename);
    function visit(node) {
      if (ts.isImportDeclaration(node)) {
        if (node.importClause?.isTypeOnly) return;
        const bindings = node.importClause?.namedBindings;
        if (!node.importClause?.name && bindings && ts.isNamedImports(bindings) && bindings.elements.every((element) => element.isTypeOnly)) return;
        const specifier = node.moduleSpecifier.text;
        assert.ok(!/axios|config-context|message-context|tags-context|websocket-provider|embedded-signup/.test(specifier), `${filename} imports live feature dependency ${specifier}`);
        if (specifier.startsWith("@/") || specifier.startsWith(".")) {
          if (!specifier.endsWith(".css")) {
            const target = resolveLocal(specifier, filename);
            assert.ok(target, `Cannot resolve ${specifier} from ${filename}`);
            audit(target);
          }
        }
      }
      if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
        const expression = node.expression.getText(source);
        assert.ok(!/(^|\.)(fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)$/.test(expression), `Unexpected API transport ${expression} in ${filename}`);
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  audit(path.join(componentRoot, "screens.tsx"));
  audit(path.join(componentRoot, "dashboard-shell.tsx"));
  audit(path.join(componentRoot, "detail-screens.tsx"));
  assert.ok(visited.size > 15, "Audit should include shared rendering components, not only preview files");
});

test("every feature in the sidebar and Quickstart has a Tech Provider route", () => {
  const filename = path.join(componentRoot, "navigation.ts");
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  vm.runInNewContext(source, { exports, require: () => ({}) });
  const cases = new Set();
  function visit(node) {
    if (ts.isCaseClause(node) && ts.isStringLiteral(node.expression)) cases.add(node.expression.text);
    ts.forEachChild(node, visit);
  }
  visit(sourceFile(path.join(componentRoot, "screens.tsx")));
  for (const route of exports.previewRoutes) assert.ok(cases.has(route), `Missing screen for ${route}`);
  const paths = [...exports.navigationGroups.flatMap((group) => group.items.map((item) => item.path)), ...exports.quickstartFeatures.map((feature) => feature.path.split("?")[0])];
  for (const route of paths) {
    assert.ok(exports.previewRoutes.includes(route) || route === "embedded-signup", `Missing route ${route}`);
    assert.ok(!route.startsWith("/apps/whatsapp"), "Tech Provider navigation must stay in its own workspace");
  }
  assert.ok(fs.existsSync(path.join(root, "src/app/apps/tech-provider/embedded-signup/page.jsx")));
  for (const section of ["inbox", "recipients", "contacts", "groups", "campaigns"]) assert.ok(exports.resolveDetailRoute([section, "preview"]));
  assert.equal(exports.resolveDetailRoute(["meta-flows", "preview", "submissions"]).kind, "submissions");
  assert.equal(exports.resolveDetailRoute(["unknown", "preview"]), null);
  assert.equal(exports.resolveDetailRoute(["__proto__", "preview"]), null);
  assert.equal(exports.resolveDetailRoute(["inbox", "preview", "unknown"]), null);
});
