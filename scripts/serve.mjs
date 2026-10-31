import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const directory = fileURLToPath(new URL("../_site/", import.meta.url));
const port = 8001;
const prefix = "/azure-compute-navigator/";
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};

try {
  await stat(join(directory, "article", "choosing-azure-compute.html"));
} catch (error) {
  console.error("Preview requires a built site. Run npm run build first.", error.message);
  process.exit(1);
}

createServer(async (request, response) => {
  if (!["GET", "HEAD"].includes(request.method)) {
    response.writeHead(405, { Allow: "GET, HEAD" }).end("Method not allowed");
    return;
  }
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  } catch {
    response.writeHead(400).end("Invalid request URL");
    return;
  }
  if (pathname === "/" || pathname === prefix.slice(0, -1)) {
    response.writeHead(302, { Location: prefix }).end();
    return;
  }
  if (!pathname.startsWith(prefix)) {
    response.writeHead(404).end("Not found");
    return;
  }
  const file = resolve(directory, pathname.slice(prefix.length) || "index.html");
  if (!file.startsWith(`${resolve(directory)}${sep}`)) {
    response.writeHead(403).end("Forbidden");
    return;
  }
  try {
    const contents = await readFile(file);
    response.writeHead(200, {
      "Content-Type": types[extname(file)] ?? "text/plain; charset=utf-8",
      "Content-Length": contents.length,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    response.end(request.method === "HEAD" ? undefined : contents);
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "EISDIR") {
      response.writeHead(404).end("Not found");
    } else {
      console.error(`Preview failed for ${pathname}:`, error);
      response.writeHead(500).end("Preview server error");
    }
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Local-only Pages preview: http://127.0.0.1:${port}${prefix}`);
}).on("error", (error) => {
  console.error("Could not start the preview server:", error.message);
  process.exitCode = 1;
});
