import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";

const source = await readFile(new URL("../src/theme.js", import.meta.url), "utf8");

function themeFixture(savedTheme = null, storageBlocked = false) {
  const events = {};
  const attributes = {};
  const saved = new Map(savedTheme ? [["azure-compute-navigator-theme", savedTheme]] : []);
  const warnings = [];
  const elements = {
    "theme-toggle": {
      setAttribute: (key, value) => { attributes[key] = value; },
      addEventListener: (event, handler) => { events[event] = handler; },
    },
    "theme-label": { textContent: "" },
    "theme-status": { textContent: "" },
  };
  const meta = { content: "" };
  const document = {
    documentElement: { dataset: {} },
    querySelector: () => meta,
    getElementById: (id) => elements[id],
    addEventListener: (event, handler) => { events[event] = handler; },
  };
  runInNewContext(source, {
    document,
    window: { addEventListener: (event, handler) => { events[event] = handler; } },
    localStorage: {
      getItem: (key) => {
        if (storageBlocked) throw new Error("Storage is blocked");
        return saved.get(key) ?? null;
      },
      setItem: (key, value) => {
        if (storageBlocked) throw new Error("Storage is blocked");
        saved.set(key, value);
      },
    },
    console: { warn: (...args) => warnings.push(args) },
  });
  return { document, meta, attributes, events, elements, saved, warnings };
}

test("light is the default and a saved dark preference applies before DOM readiness", () => {
  assert.equal(themeFixture().document.documentElement.dataset.theme, "light");
  assert.equal(themeFixture("invalid").document.documentElement.dataset.theme, "light");
  const fixture = themeFixture("dark");
  assert.equal(fixture.document.documentElement.dataset.theme, "dark");
  assert.equal(fixture.meta.content, "#181a1d");
  fixture.events.DOMContentLoaded();
  assert.equal(fixture.attributes["aria-pressed"], "true");
  assert.equal(fixture.attributes["aria-label"], "Switch to light theme");
});

test("the theme toggle persists only the theme and updates its accessible state", () => {
  const fixture = themeFixture();
  fixture.events.DOMContentLoaded();
  fixture.events.click();
  assert.equal(fixture.document.documentElement.dataset.theme, "dark");
  assert.equal(fixture.saved.get("azure-compute-navigator-theme"), "dark");
  assert.equal(fixture.saved.size, 1);
  assert.equal(fixture.elements["theme-label"].textContent, "Light");
  fixture.events.click();
  assert.equal(fixture.document.documentElement.dataset.theme, "light");
  assert.equal(fixture.attributes["aria-pressed"], "false");
});

test("storage restrictions do not block switching and are reported explicitly", () => {
  const fixture = themeFixture(null, true);
  fixture.events.DOMContentLoaded();
  fixture.events.click();
  assert.equal(fixture.document.documentElement.dataset.theme, "dark");
  assert.equal(fixture.warnings.length, 2);
  assert.match(fixture.elements["theme-status"].textContent, /could not save/);
});

test("theme changes in another tab are synchronized without touching assessment state", () => {
  const fixture = themeFixture();
  fixture.events.DOMContentLoaded();
  fixture.events.storage({ key: "unrelated-setting", newValue: "dark" });
  assert.equal(fixture.document.documentElement.dataset.theme, "light");
  fixture.events.storage({ key: "azure-compute-navigator-theme", newValue: "dark" });
  assert.equal(fixture.document.documentElement.dataset.theme, "dark");
  fixture.events.storage({ key: null, newValue: null });
  assert.equal(fixture.document.documentElement.dataset.theme, "light");
});
