const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

// Exercise the actual event handlers with sidebar controls and result area
// represented separately, as they are in sidebarPageLayout.js.
class Element {
  constructor(name = "", value = "", checked = false) {
    Object.assign(this, { name, value, checked, innerHTML: "", listeners: {} });
  }
  addEventListener(type, handler) { this.listeners[type] = handler; }
  matches(selector) { return selector === `input[name="${this.name}"]`; }
}

async function check(directory) {
  let language = "en";
  const elements = Object.fromEntries(["docsSidebar", "search", "searchTxt", "searchBtn", "resultTbl"].map((id) => [id, new Element()]));
  const foods = [new Element("foodcode", "01_0106"), new Element("foodcode", "01_0105")];
  const categories = [new Element("nutrition", "proximates", true), new Element("nutrition", "minerals", true)];
  const document = {
    getElementById: (id) => elements[id],
    querySelectorAll: (selector) => (selector.includes('"foodcode"') ? foods : categories).filter((el) => el.checked),
  };
  const context = vm.createContext({ document, HTMLElement: Element, localStorage: { getItem: () => language, setItem: (_, value) => { language = value; } } });
  const modules = new Map();
  function load(file) {
    const id = path.resolve(file);
    if (!modules.has(id)) modules.set(id, new vm.SourceTextModule(fs.readFileSync(id, "utf8"), { context, identifier: id }));
    return modules.get(id);
  }
  const main = load(`${directory}/js/fn/foodSearchEvents.js`);
  await main.link((specifier, ref) => load(path.resolve(path.dirname(ref.identifier), specifier)));
  await main.evaluate();
  const data = JSON.parse(fs.readFileSync(`${directory}/data/nutritionsEnMn.json`, "utf8"));
  main.namespace.initNutritionData(data);
  main.namespace.bindSearchEvents();
  assert.equal(typeof elements.docsSidebar.listeners.change, "function", "Checkbox listener must be attached to sidebar, not the results section");
  const change = (control) => elements.docsSidebar.listeners.change({ target: control });
  const result = () => elements.resultTbl.innerHTML;

  foods[0].checked = true;
  change(foods[0]);
  assert(result().includes(data[0].food_name.en));
  assert(!result().includes(data[1].food_name.en));
  categories[1].checked = false;
  change(categories[1]);
  assert(!result().includes("Calcium (mg)"));
  foods[0].checked = false;
  change(foods[0]);
  assert(result().includes(data[1].food_name.en));
  assert(!result().includes("Calcium (mg)"), "Clearing food selection must preserve nutrition categories");

  elements.searchTxt.value = "  BARLEY   FLOUR  ";
  elements.searchBtn.listeners.click();
  assert(result().includes(data[0].food_name.en), "Multiword search must match");
  elements.searchTxt.value = "no-such-food";
  elements.searchTxt.listeners.keydown({ key: "Enter", preventDefault() {} });
  assert(result().includes("No match found"));
  language = "mn";
  elements.searchTxt.value = "Арвайн эслэгт";
  elements.searchBtn.listeners.click();
  assert(result().includes(data[0].food_name.mn));
  categories[0].checked = false;
  change(categories[0]);
  assert(result().includes("Ядаж нэг"));
  console.log(`PASS ${directory}: food selection, category changes, clearing selection, multiword English/Mongolian search, Enter and empty results`);
}

(async () => { await check("src"); await check("docs"); })().catch((error) => { console.error(error); process.exitCode = 1; });
