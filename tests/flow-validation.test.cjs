const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const automations = path.join(__dirname, "../src/components/whatsapp/automations");
const typescriptOptions = { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } };
function load(filename, requireModule) {
  const text = fs.readFileSync(path.join(automations, filename), "utf8");
  const { outputText } = ts.transpileModule(text, typescriptOptions);
  const exports = {};
  new Function("exports", "require", outputText)(exports, requireModule);
  return exports;
}
const types = load("flow-types.ts");
const { connectionError, removeRouteOption, validateFlowGraph } = load("flow-validation.ts", (name) => {
  assert.equal(name, "./flow-types");
  return types;
});

const node = (id, node_type, labels = []) => ({
  id, name: id, node_type,
  header_text_template: { text: id },
  extra_data: { options: labels.map((value) => ({ value, target_index: null })) },
});
const edge = (source, target, sourceHandle) => ({ id: `${source}-${target}-${sourceHandle}`, source, target, sourceHandle });
const consent = node("Consent", "ROUTE", ["Yes", "No"]);
const name = node("Name", "TEXT");
const declined = node("Declined", "TEXT");
const yes = edge("Consent", "Name", "route-0");
const no = edge("Consent", "Declined", "route-1");

test("every consent option requires a valid, unique connection", () => {
  const nodes = [consent, name, declined];
  assert.equal(validateFlowGraph(nodes, [yes, no], true), undefined);
  assert.match(validateFlowGraph(nodes, [yes], true).message, /Connect option 2/);
  assert.match(validateFlowGraph(nodes, [yes, edge("Consent", "Declined", "route-0")], true).message, /more than one destination/);
  assert.match(validateFlowGraph(nodes, [yes, edge("Consent", "Declined", "route-2")], true).message, /existing option/);
  assert.match(validateFlowGraph([node("Consent", "ROUTE", ["Yes", " yes "]), name, declined], [yes, no], true).message, /unique label/);
  assert.match(validateFlowGraph([node("Consent", "ROUTE", ["Yes", " "]), name, declined], [yes, no], true).message, /Enter a label/);
});

test("deleting an option preserves the destinations of the remaining choices", () => {
  const unrelated = edge("Language", "Consent", "route-0");
  const remaining = removeRouteOption([unrelated, yes, no], "Consent", 0);
  assert.deepEqual(remaining, [unrelated, { ...no, sourceHandle: "route-0" }]);
});

test("impossible direct connections are rejected and reachable converging routes are allowed", () => {
  const nodes = [consent, name, declined, node("End", "TEXT")];
  const nameToEnd = edge("Name", "End");
  assert.match(validateFlowGraph(nodes, [yes, no], true).message, /Connect “End” to the flow/);
  assert.match(validateFlowGraph(nodes, [yes, no, nameToEnd, edge("Declined", "End")], true).message, /already has a direct parent/);
  assert.match(validateFlowGraph(nodes, [yes, no, nameToEnd, edge("Name", "Declined")], true).message, /single output/);
  const moreOptions = node("Consent", "ROUTE", ["Yes", "No", "Back"]);
  assert.equal(validateFlowGraph([moreOptions, name, declined, node("End", "TEXT")], [yes, edge("Consent", "End", "route-1"), edge("Consent", "Declined", "route-2"), nameToEnd], true), undefined);
  const back = edge("Consent", "Consent", "route-2");
  assert.equal(validateFlowGraph([moreOptions, name, declined, node("End", "TEXT")], [yes, no, back, nameToEnd], true), undefined);

  const menu = { id: "Consent", type: "ROUTE", name: "Consent", optionCount: 2 };
  const prompt = { id: "Name", type: "TEXT", name: "Name", optionCount: 0 };
  assert.match(connectionError(prompt, menu, null, "Consent", []), /back to the start node/);
});

test("SMS rejects an empty menu or a WhatsApp-only terminal node", () => {
  assert.match(validateFlowGraph([node("Menu", "LIST", ["Continue"])], [], true).message, /SMS replies can continue/);
  assert.match(validateFlowGraph([node("Menu", "BUTTONS")], [], true).message, /Add at least one option/);
  assert.match(validateFlowGraph([node("Catalogue", "CATALOGUE")], [], true).message, /SMS cannot send/);
  assert.match(validateFlowGraph([{ ...name, header_text_template: { text: " " } }], [], true).message, /Enter the SMS message/);
});

test("multiple catalogues and forms can end separate WhatsApp branches", () => {
  const menu = node("Menu", "ROUTE", ["Products", "Register", "More products", "Register again"]);
  const catalogue = { ...node("Catalogue", "CATALOGUE"), extra_data: { catalogue_id: "catalogue-1" } };
  const form = { ...node("Form", "META_FLOW"), extra_data: { meta_flow_id: "form-1" } };
  const otherCatalogue = { ...catalogue, id: "Other catalogue", name: "Other catalogue" };
  const otherForm = { ...form, id: "Other form", name: "Other form" };
  const nodes = [menu, catalogue, form, otherCatalogue, otherForm];
  const edges = nodes.slice(1).map((target, index) => edge(menu.id, target.id, `route-${index}`));

  assert.equal(validateFlowGraph(nodes, edges, false), undefined);
  assert.equal(validateFlowGraph([catalogue, menu, form, otherCatalogue, otherForm], edges, false), undefined);
  assert.deepEqual(validateFlowGraph([...nodes.slice(0, -1), { ...otherForm, extra_data: {} }], edges, false), {
    nodeId: "Other form", message: "Select a Meta Flow for “Other form”.",
  });
  for (const source of [catalogue, form]) {
    const issue = validateFlowGraph([...nodes, name], [...edges, edge(source.id, name.id)], false);
    assert.equal(issue.nodeId, source.id);
    assert.match(issue.message, /cannot have an outgoing connection/);
  }
});
