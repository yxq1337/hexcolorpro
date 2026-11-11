// Generate llms-full.txt from the local static HTML files (no network needed).
// Usage: ELECTRON_RUN_AS_NODE=1 "<DeepSeek Harness.exe>" tools/gen-llms-full.mjs .
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.argv[2] ?? ".";
const OUT = join(ROOT, "llms-full.txt");

const decode = (s) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&hellip;/g, "…")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)));

const strip = (s) => {
  let out = s.replace(/<(?![a-zA-Z!/])/g, "&lt;");
  return decode(out.replace(/<[^>]+>/g, " "))
    .replace(/[ \t]+/g, " ")
    .trim();
};

function pick(html) {
  const main = html.match(/<main[\s\S]*?<\/main>/i);
  if (main) return main[0];
  const article = html.match(/<article[\s\S]*?<\/article>/i);
  if (article) return article[0];
  const body = html.match(/<body[\s\S]*?<\/body>/i);
  return body ? body[0] : html;
}

function toMarkdown(html) {
  let s = pick(html);
  s = s.replace(/<script[\s\S]*?<\/script>/gi, " ");
  s = s.replace(/<style[\s\S]*?<\/style>/gi, " ");
  s = s.replace(/<svg[\s\S]*?<\/svg>/gi, " ");
  s = s.replace(/<(nav|header|form|iframe)[\s\S]*?<\/\1>/gi, " ");
  s = s.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, n, t) =>
    "\n\n" + "#".repeat(Math.min(Number(n) + 2, 6)) + " " + strip(t) + "\n\n");
  s = s.replace(/<li[^>]*>/gi, "\n- ").replace(/<\/li>/gi, "\n");
  s = s.replace(/<tr[^>]*>([\s\S]*?)<\/tr>/gi, (_, row) => {
    const cells = [...row.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((m) => strip(m[1]));
    return cells.length ? "\n| " + cells.join(" | ") + " |" : "";
  });
  s = s.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, t) => "\n\n> " + strip(t) + "\n\n");
  s = s.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_, t) => "\n\n```\n" + strip(t) + "\n```\n\n");
  s = s.replace(/<(p|div|section|article|br|footer)[^>]*>/gi, "\n");
  s = strip(s);
  let lines = s
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trimEnd())
    .filter((l) => !/^\s*(Advertisement|POPULAR →|POPULAR|→|NEW)\s*$/.test(l));
  const firstHeading = lines.findIndex((l) => /^#{1,6} /.test(l));
  if (firstHeading > 0) lines = lines.slice(firstHeading);
  const text = lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  // re-join soft-wrapped prose (source HTML line breaks inside one paragraph)
  return text
    .split(/\n{2,}/)
    .map((block) => {
      const ls = block.split("\n");
      if (ls.some((l) => /^(#{1,6} |-|\||>|\d+\. )/.test(l))) return block;
      return ls.map((l) => l.trim()).join(" ");
    })
    .join("\n\n");
}

const ORDER = [
  "index.html",
  "about.html",
  "guide.html",
  "blog.html",
  "colors.html",
  "embed.html",
  "privacy.html",
  "terms.html",
  "contact.html",
];
const TOOLS = [
  "color-picker.html",
  "gradient-generator.html",
  "contrast-checker.html",
  "palette-generator.html",
  "color-schemes.html",
  "color-converter.html",
  "color-names.html",
  "shadow-generator.html",
  "random-color-generator.html",
  "color-mixer.html",
  "color-shades-generator.html",
  "color-temperature.html",
  "text-color-generator.html",
];
const BLOG_ORDER = [
  "wcag-contrast-ratio-guide.html",
  "hex-to-rgb-conversion-guide.html",
  "what-is-hsl-color.html",
  "how-many-hex-colors-are-there.html",
  "what-color-is-ff0000.html",
  "cmyk-to-rgb-difference.html",
  "contrast-accessibility-guide.html",
  "color-theory-basics.html",
  "web-color-palette-guide.html",
  "color-psychology-branding.html",
  "dark-mode-design-best-practices.html",
  "dark-mode-color-scheme-guide.html",
  "gradient-design-trends-2026.html",
  "saas-dashboard-color-palette.html",
  "monochromatic-color-palette-generator.html",
  "accessible-color-palette-healthcare.html",
];

const files = [
  ...ORDER,
  ...TOOLS,
  ...BLOG_ORDER.map((f) => "blog/" + f),
  ...readdirSync(join(ROOT, "blog"))
    .filter((f) => f.endsWith(".html") && !BLOG_ORDER.includes(f))
    .map((f) => "blog/" + f),
  ...(existsSync(join(ROOT, "colors"))
    ? readdirSync(join(ROOT, "colors"))
        .filter((f) => f.endsWith(".html"))
        .sort()
        .map((f) => "colors/" + f)
    : []),
].filter((f) => existsSync(join(ROOT, f)));

const out = [];
out.push("# HexColor Pro — full site content");
out.push("");
out.push(
  "> Free, client-side color tools for designers and developers. Every page below is public, " +
    "requires no signup, and is served as static HTML. Generated from the site source."
);
out.push("");
out.push(`Source: https://hexcolorpro.pages.dev · Sitemap: https://hexcolorpro.pages.dev/sitemap.xml · Pages: ${files.length}`);
out.push("");

let n = 0;
for (const f of files) {
  const html = readFileSync(join(ROOT, f), "utf8");
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? strip(titleMatch[1]) : f;
  const url = "https://hexcolorpro.pages.dev/" + f.replace(/index\.html$/, "").replace(/\.html$/, "");
  const body = toMarkdown(html);
  out.push("---");
  out.push("");
  out.push(`## ${title}`);
  out.push("");
  out.push(`URL: ${url}`);
  out.push("");
  out.push(body);
  out.push("");
  n++;
}

writeFileSync(OUT, out.join("\n"), "utf8");
console.log(`wrote llms-full.txt (${n} pages, ${(out.join("\n").length / 1024).toFixed(0)} KB)`);
