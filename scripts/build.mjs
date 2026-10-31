import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { Marked, Renderer } from "marked";
import { services } from "../src/data/services.js";
import { projectConfig } from "../src/data/config.js";

export const root = fileURLToPath(new URL("../", import.meta.url));
export const output = join(root, "_site");

export function escapeHtml(text) {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

export function headingId(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
}

export function prepareArticleMarkdown(markdown) {
  const siteRoot = projectConfig.publicSiteUrl.replace(/\/$/, "");
  const prepared = markdown
    .replaceAll(`${siteRoot}/assets/`, "../assets/")
    .replaceAll(`${siteRoot}/#assessment`, "../index.html#assessment");
  if (/PUBLIC_(?:SITE|APP)_URL_REQUIRED|PLACEHOLDER|_REQUIRED/i.test(prepared)) {
    throw new Error("Unresolved publication placeholder in the article.");
  }
  return prepared;
}

export function renderMarkdown(markdown) {
  const headings = [];
  const usedIds = new Set();
  const renderer = new Renderer();
  const table = renderer.table;
  const image = renderer.image;
  const link = renderer.link;
  const publishedDocuments = {
    "../docs/references.md": "../references.html",
    "../CONTENT-LICENSE.md": "../content-license.html",
  };
  renderer.link = function (token) {
    return link.call(this, { ...token, href: publishedDocuments[token.href] ?? token.href });
  };
  renderer.heading = function ({ text, depth, tokens }) {
    const base = headingId(text);
    let id = base;
    for (let suffix = 2; usedIds.has(id); suffix++) id = `${base}-${suffix}`;
    usedIds.add(id);
    headings.push({ depth, text, id });
    return `<h${depth} id="${id}">${this.parser.parseInline(tokens)}</h${depth}>\n`;
  };
  renderer.table = function (token) {
    return `<p class="table-hint">Swipe or scroll horizontally to read the full table.</p><div class="table-scroll" role="region" aria-label="Comparison table; scroll horizontally if needed" tabindex="0">${table.call(this, token)}</div>\n`;
  };
  renderer.image = function (token) {
    return `<a class="image-link" href="${escapeHtml(token.href)}">${image.call(this, token).replace("<img ", '<img loading="lazy" decoding="async" ')}</a>`;
  };
  const html = new Marked({ renderer, gfm: true }).parse(markdown, { async: false });
  const title = headings.find(({ depth }) => depth === 1)?.text;
  if (!title) throw new Error("Every document must have a level-one heading.");
  const contents = headings.filter(({ depth }) => depth === 2);
  const navigation = contents.length
    ? `<details class="contents"><summary>On this page</summary><ol>${contents.map(({ id, text }) =>
      `<li><a href="#${id}">${escapeHtml(text)}</a></li>`).join("")}</ol></details>`
    : "";
  return { html, title, navigation, headings };
}

export async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Publication must not include symlinks: ${path}`);
    return entry.isDirectory() ? listFiles(path) : [path];
  }));
  return nested.flat();
}

export async function validateSite(directory) {
  const files = await listFiles(directory);
  const fileSet = new Set(files.map((file) => resolve(file)));
  const documents = new Map(await Promise.all(files.filter((file) => file.endsWith(".html"))
    .map(async (file) => [file, await readFile(file, "utf8")])));
  const problems = [];
  for (const [file, html] of documents) {
    for (const match of html.matchAll(/\b(?:href|src)="([^"]*)"/g)) {
      const link = match[1].replaceAll("&amp;", "&");
      if (/^(https?:|data:)/i.test(link)) continue;
      if (/^[a-z][a-z0-9+.-]*:|^\/\//i.test(link)) {
        problems.push(`${relative(directory, file)}: unsupported URL ${link}`);
        continue;
      }
      if (link.startsWith("/")) {
        problems.push(`${relative(directory, file)}: root-relative link breaks project Pages: ${link}`);
        continue;
      }
      const url = new URL(link, `https://preview.invalid/${relative(directory, file).split(sep).join("/")}`);
      const pathname = url.pathname.endsWith("/") ? `${url.pathname}index.html` : url.pathname;
      const target = resolve(directory, `.${decodeURIComponent(pathname)}`);
      if (!fileSet.has(target)) {
        problems.push(`${relative(directory, file)}: missing file ${link}`);
        continue;
      }
      if (url.hash && documents.has(target)) {
        const id = decodeURIComponent(url.hash.slice(1));
        if (!documents.get(target).includes(`id="${escapeHtml(id)}"`)) {
          problems.push(`${relative(directory, file)}: missing anchor ${link}`);
        }
      }
    }
  }
  const articlePath = join(directory, "article", "choosing-azure-compute.html");
  const article = documents.get(articlePath);
  for (const service of services) {
    if (!article?.includes(`id="${service.articleSection}"`)) {
      problems.push(`Missing article target for ${service.name}: ${service.articleSection}`);
    }
  }
  if (problems.length) throw new Error(`Publication link validation failed:\n${problems.join("\n")}`);
  return { files: files.length, pages: documents.size, serviceAnchors: services.length };
}

export async function buildSite() {
  const template = await readFile(join(root, "article", "template.html"), "utf8");
  await rm(output, { recursive: true, force: true });
  await mkdir(join(output, "article"), { recursive: true });
  // Copy only public assets, never the repository root or dependency directory.
  await Promise.all(["index.html", "src", "assets", "LICENSE"].map((path) =>
    cp(join(root, path), join(output, path), { recursive: true, dereference: false })));
  await cp(join(root, "article", "article.css"), join(output, "article", "article.css"));
  const documents = [
    { source: "article/choosing-azure-compute.md", destination: "article/choosing-azure-compute.html", prefix: "../" },
    { source: "docs/references.md", destination: "references.html", prefix: "./" },
    { source: "CONTENT-LICENSE.md", destination: "content-license.html", prefix: "./" },
  ];
  for (const document of documents) {
    let markdown = await readFile(join(root, document.source), "utf8");
    if (document.source === "article/choosing-azure-compute.md") {
      markdown = prepareArticleMarkdown(markdown);
    }
    const rendered = renderMarkdown(markdown);
    const values = {
      title: escapeHtml(rendered.title),
      body: rendered.html,
      contents: rendered.navigation,
      prefix: document.prefix,
      author: escapeHtml(projectConfig.authorName),
    };
    const html = template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      if (!(key in values)) throw new Error(`Unknown template field: ${key}`);
      return values[key];
    });
    await writeFile(join(output, document.destination), html);
  }
  const result = await validateSite(output);
  return result;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await buildSite();
  console.log(`Built ${result.pages} HTML pages and ${result.files} files into _site; all local links and ${result.serviceAnchors} service article anchors verified.`);
}
