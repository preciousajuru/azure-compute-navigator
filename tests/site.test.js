import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

test("the adaptive hosting assessment is the default and the service explorer remains available", () => {
  assert.match(html, /Find My Hosting Options/);
  assert.match(html, /Explore Azure Services/);
  assert.match(html, /id="tab-assessment"[^>]*aria-selected="true"[^>]*data-mode="assessment"/);
  assert.match(html, /assessment/);
  assert.match(html, /Independent educational guidance/);
  assert.match(html, /not an official Microsoft tool/i);
  assert.match(html, /Technical information last reviewed/);
});

test("the workbench provides a connected map, contextual brief, and requirement summary", () => {
  for (const id of ["architecture-map", "map-connections", "service-detail", "answer-summary"]) {
    assert.ok(html.includes(`id="${id}"`), `Missing workbench region: ${id}`);
  }
  assert.doesNotMatch(html, /class="hero"|hero-art|orbit-/);
  assert.match(html, /id="theme-toggle".*aria-pressed="false"/);
  assert.match(html, /data-theme="light"/);
});

test("both themes use restrained surfaces without decorative gradients", async () => {
  const css = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
  assert.match(css, /\[data-theme="dark"\]/);
  assert.match(css, /prefers-reduced-motion/);
  assert.doesNotMatch(css, /(?:linear|radial)-gradient|backdrop-filter/);
});

test("the original event branding and unsupported endorsement labels are removed", () => {
  assert.doesNotMatch(html, /Microsoft AI Tour London|Microsoft Frontier Tour London|AI Tour Top Pick/i);
});

test("the app does not load an external runtime framework or styling CDN", () => {
  assert.doesNotMatch(html, /cdn\.tailwindcss\.com|cdnjs\.cloudflare\.com|fonts\.googleapis\.com/i);
  assert.match(html, /type="module" src="\.\/src\/app\.js"/);
});

test("the project includes PNG captures of both themes at every review width", async () => {
  for (const name of [
    ...["light", "dark"].flatMap((theme) =>
      [375, 768, 1024, 1440].map((width) => `azure-compute-navigator-${theme}-${width}.png`)),
    "azure-compute-navigator-assessment.png",
    "azure-compute-navigator-assessment-mobile-dark.png",
  ]) {
    const file = new URL(`../assets/screenshots/${name}`, import.meta.url);
    const [image, metadata] = await Promise.all([readFile(file), stat(file)]);
    assert.deepEqual(image.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    assert.ok(metadata.size > 10_000);
  }
});
