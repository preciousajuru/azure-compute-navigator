import test, { before } from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative, sep } from "node:path";
import { buildSite, headingId, listFiles, output, prepareArticleMarkdown, renderMarkdown, root, validateSite } from "../scripts/build.mjs";
import { projectConfig } from "../src/data/config.js";
import { services } from "../src/data/services.js";

let build;
before(async () => { build = await buildSite(); });

test("the public artifact contains rendered reading pages but no drafts, tests or dependencies", async () => {
  const files = (await listFiles(output)).map((file) => relative(output, file).split(sep).join("/"));
  assert.equal(build.pages, 4);
  for (const file of ["index.html", "article/choosing-azure-compute.html", "references.html", "content-license.html", "LICENSE"]) {
    assert.ok(files.includes(file), `Missing public file: ${file}`);
  }
  assert.ok(files.every((file) => /^(index\.html|src\/|assets\/|article\/|references\.html|content-license\.html|LICENSE$)/.test(file)));
  assert.ok(files.every((file) => !/\.md$|\.env|package|node_modules|drafts|tests|\.github/.test(file)));
});

test("all seven service links resolve to actual article headings, including Virtual Machines", async () => {
  const html = await readFile(join(output, "article", "choosing-azure-compute.html"), "utf8");
  for (const service of services) {
    assert.ok(html.includes(`id="${service.articleSection}"`), service.name);
  }
  assert.equal(build.serviceAnchors, 7);
  assert.equal(projectConfig.articleUrl, "./article/choosing-azure-compute.html");
});

test("the article renders four scenarios, one comparison table and its genuine screenshot", async () => {
  const html = await readFile(join(output, "article", "choosing-azure-compute.html"), "utf8");
  assert.equal((html.match(/<h3 id="a-conventional-rest-api|<h3 id="an-api-with-background-processing|<h3 id="kubernetes-native-software|<h3 id="wordpress-moving-from-linux-with-mariadb/g) ?? []).length, 4);
  assert.equal((html.match(/<table>/g) ?? []).length, 1);
  assert.equal((html.match(/<img [^>]+src="[^"]+\.svg"/g) ?? []).length, 0);
  assert.equal((html.match(/<img [^>]+src="[^"]+\.png"/g) ?? []).length, 1);
  assert.match(html, /src="\.\.\/assets\/screenshots\/azure-compute-navigator-assessment\.png"/);
  assert.match(html, /href="\.\.\/index\.html#assessment"/);
  assert.doesNotMatch(html, /PUBLIC_(?:SITE|APP)_URL_REQUIRED/);
  assert.match(html, /aria-label="Reading controls"/);
  assert.match(html, /<details class="contents">/);
  assert.match(html, /lang="en-GB"/);
  assert.doesNotMatch(html, /```|<pre><code class="language-mermaid"|^\|---/m);
});

test("the article uses British English and contains no editorial placeholders", async () => {
  const markdown = await readFile(join(root, "article", "choosing-azure-compute.md"), "utf8");
  const prose = markdown.replace(/\]\([^)]*\)/g, "]");
  assert.doesNotMatch(prose, /\b(?:behavior|containerized|customization|modernization|favor|organization|color|optimize|authorization)\b/i);
  assert.doesNotMatch(prose, /in today's rapidly evolving|unlock the power|game-changing|embark on a journey/i);
  assert.doesNotMatch(prose, /PUBLIC_(?:SITE|APP)_URL_REQUIRED|placeholder|replace this explicit placeholder|local preview/i);
  assert.equal(projectConfig.repositoryUrl, "https://github.com/preciousajuru/azure-compute-navigator");
  assert.equal(projectConfig.publicSiteUrl, "https://preciousajuru.github.io/azure-compute-navigator/");
  assert.equal(projectConfig.authorName, "Precious Ajuru");
});

test("rendering produces stable unique heading IDs and native HTML without a diagram CDN", () => {
  const rendered = renderMarkdown("# Guide\n\n## AKS Automatic\n\n## AKS Automatic\n\n**Plain HTML**");
  assert.equal(headingId("Azure Virtual Machines: when OS control is a requirement"), "azure-virtual-machines-when-os-control-is-a-requirement");
  assert.match(rendered.html, /id="aks-automatic"/);
  assert.match(rendered.html, /id="aks-automatic-2"/);
  assert.match(rendered.html, /<strong>Plain HTML<\/strong>/);
  assert.throws(() => renderMarkdown("No title"), /level-one heading/);
});

test("the portable article uses canonical public URLs while the project site resolves local assets", async () => {
  const markdown = await readFile(join(root, "article", "choosing-azure-compute.md"), "utf8");
  assert.match(markdown, /https:\/\/preciousajuru\.github\.io\/azure-compute-navigator\/assets\/screenshots\/azure-compute-navigator-assessment\.png/);
  assert.match(markdown, /https:\/\/preciousajuru\.github\.io\/azure-compute-navigator\/#assessment/);
  const prepared = prepareArticleMarkdown(markdown);
  const { html } = renderMarkdown(prepared);
  assert.match(html, /src="\.\.\/assets\/screenshots\/azure-compute-navigator-assessment\.png"/);
  assert.match(html, /href="\.\.\/index\.html#assessment"/);
  assert.doesNotMatch(html, /PUBLIC_(?:SITE|APP)_URL_REQUIRED|PLACEHOLDER|_REQUIRED|href="[^"]+\.md"/);
  assert.throws(() => prepareArticleMarkdown("https://PUBLIC_APP_URL_REQUIRED"), /Unresolved publication placeholder/);
});

test("the single-source article stays within the requested word range and keeps its service anchors", async () => {
  const markdown = await readFile(join(root, "article", "choosing-azure-compute.md"), "utf8");
  const text = markdown
    .replace(/^# .+$/m, "")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_>|#]/g, " ");
  const wordCount = text.match(/\b[\p{L}\p{N}]+(?:['’.-][\p{L}\p{N}]+)*\b/gu)?.length ?? 0;
  assert.ok(wordCount >= 1800 && wordCount <= 2200, `Article has ${wordCount} words`);
  assert.match(markdown, /## Azure App Service:/);
  assert.match(markdown, /## Azure Container Apps:/);
  assert.match(markdown, /## AKS:/);
  assert.match(markdown, /## WordPress moving from Linux with MariaDB/);
  assert.match(markdown, /## Final thoughts/);
});

test("the site links remain valid when the publication is served from a project subpath", async () => {
  const base = "https://preview.invalid/azure-compute-navigator/";
  for (const [file, link] of [
    ["index.html", projectConfig.articleUrl],
    ["article/choosing-azure-compute.html", "../index.html#assessment"],
    ["article/choosing-azure-compute.html", "../assets/screenshots/azure-compute-navigator-assessment.png"],
  ]) {
    assert.ok(new URL(link, `${base}${file}`).href.startsWith(base));
  }
  assert.deepEqual(await validateSite(output), build);
});

test("publication validation rejects broken files, anchors, root paths and unsafe link schemes", async () => {
  const directory = await mkdtemp(join(tmpdir(), "azure-navigator-links-"));
  try {
    await mkdir(join(directory, "article"));
    await writeFile(join(directory, "index.html"), '<a href="./missing.html">Missing</a><a href="./article/choosing-azure-compute.html#absent">Anchor</a><a href="/src/app.js">Root</a><a href="javascript:void(0)">Scheme</a>');
    await writeFile(join(directory, "article", "choosing-azure-compute.html"), "<h1>Article</h1>");
    await assert.rejects(validateSite(directory), (error) => {
      for (const message of ["missing file", "missing anchor", "root-relative link", "unsupported URL", "Missing article target for Azure Virtual Machines"]) {
        assert.ok(error.message.includes(message), message);
      }
      return true;
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("licensing identifies the author and distinguishes original content from code", async () => {
  const [mit, content] = await Promise.all(["LICENSE", "CONTENT-LICENSE.md"].map((file) => readFile(join(root, file), "utf8")));
  assert.match(mit, /Copyright \(c\) 2026 Precious Ajuru/);
  assert.match(content, /Precious Ajuru/);
  assert.match(content, /CC BY 4\.0/);
  assert.match(content, /Generated pages combine MIT-licensed presentation code with CC BY 4\.0/);
  assert.match(content, /Third-party packages retain their own licences/);
});

test("the deploy workflow is manual-only and uploads the Node-built public artifact", async () => {
  const workflow = await readFile(join(root, ".github", "workflows", "pages.yml"), "utf8");
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /\bpush:|pull_request:|jekyll-build/);
  assert.match(workflow, /runs-on: ubuntu-24\.04/);
  assert.match(workflow, /actions\/checkout@v7/);
  assert.match(workflow, /actions\/setup-node@v7\.1\.0/);
  assert.match(workflow, /actions\/configure-pages@v6/);
  assert.match(workflow, /actions\/upload-pages-artifact@v5/);
  assert.match(workflow, /actions\/deploy-pages@v5\.0\.1/);
  assert.match(workflow, /npm ci --ignore-scripts/);
  assert.match(workflow, /npm run build/);
  assert.match(workflow, /path: \.\/_site/);
  assert.match(workflow, /needs: build/);
  assert.match(workflow, /github\.ref == 'refs\/heads\/main'/);
});
