// Dump metadata for every page in the static site, to drive schema/content injection.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.argv[2] ?? ".";
const files = readdirSync(ROOT).filter((f) => f.endsWith(".html") && f !== "404.html");
const blogDir = join(ROOT, "blog");
let blog = [];
try {
  blog = readdirSync(blogDir).filter((f) => f.endsWith(".html"));
} catch {}

const strip = (s) => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const pick = (html, re) => {
  const m = html.match(re);
  return m ? strip(m[1]) : null;
};

for (const f of files.sort()) {
  const html = readFileSync(join(ROOT, f), "utf8");
  const hasHeader = /<div class="page-header">/.test(html);
  console.log(
    JSON.stringify({
      file: f,
      url: "/" + f.replace(/\.html$/, ""),
      title: pick(html, /<title>([\s\S]*?)<\/title>/),
      h1: pick(html, /<h1[^>]*>([\s\S]*?)<\/h1>/),
      subtitle: pick(html, /<div class="page-header">[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/),
      headerDiv: hasHeader,
      ldjson: (html.match(/application\/ld\+json/g) || []).length,
    })
  );
}

for (const f of blog.sort()) {
  const html = readFileSync(join(blogDir, f), "utf8");
  console.log(
    JSON.stringify({
      file: "blog/" + f,
      url: "/blog/" + f.replace(/\.html$/, ""),
      title: pick(html, /<title>([\s\S]*?)<\/title>/),
      h1: pick(html, /<h1[^>]*>([\s\S]*?)<\/h1>/),
      tag: pick(html, /<span class="tag">([\s\S]*?)<\/span>/),
      meta: pick(html, /<div class="meta">([\s\S]*?)<\/div>/),
      ldjson: (html.match(/application\/ld\+json/g) || []).length,
    })
  );
}
