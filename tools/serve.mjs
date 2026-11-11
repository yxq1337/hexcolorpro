// Minimal static server for local checks: mimics Cloudflare Pages clean URLs.
// Usage: ELECTRON_RUN_AS_NODE=1 "<DeepSeek Harness.exe>" tools/serve.mjs . 4173
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname } from "node:path";

const ROOT = process.argv[2] ?? ".";
const PORT = Number(process.argv[3] ?? 4173);
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
};

async function resolve(pathname) {
  const clean = decodeURIComponent(pathname.split("?")[0]);
  const candidates = [];
  if (clean === "/") candidates.push("index.html");
  else {
    candidates.push(clean.replace(/^\//, ""));
    if (!extname(clean)) candidates.push(clean.replace(/^\//, "") + ".html", clean.replace(/^\//, "") + "/index.html");
  }
  for (const c of candidates) {
    try {
      const s = await stat(join(ROOT, c));
      if (s.isFile()) return c;
    } catch {}
  }
  return null;
}

createServer(async (req, res) => {
  const found = await resolve(req.url ?? "/");
  if (!found) {
    res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
    res.end("<h1>404</h1>");
    return;
  }
  const buf = await readFile(join(ROOT, found));
  const type = TYPES[extname(found)] ?? "application/octet-stream";
  res.writeHead(200, { "content-type": type, "cache-control": "no-cache" });
  res.end(buf);
}).listen(PORT, "127.0.0.1", () => console.log(`serving ${ROOT} on http://127.0.0.1:${PORT}`));
