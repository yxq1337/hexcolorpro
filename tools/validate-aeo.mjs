// Validate JSON-LD blocks and AEO invariants across the static site.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.argv[2] ?? ".";
const files = [];
for (const f of readdirSync(ROOT)) if (f.endsWith(".html")) files.push(f);
for (const f of readdirSync(join(ROOT, "blog"))) if (f.endsWith(".html")) files.push("blog/" + f);
for (const f of readdirSync(join(ROOT, "colors"))) if (f.endsWith(".html")) files.push("colors/" + f);

let problems = 0;
const counts = { pages: 0, blocks: 0, types: {} };

for (const f of files.sort()) {
  const p = join(ROOT, f);
  const html = readFileSync(p, "utf8");
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  counts.pages++;
  for (const b of blocks) {
    try {
      const obj = JSON.parse(b[1]);
      counts.blocks++;
      const walk = (o) => {
        if (Array.isArray(o)) return o.forEach(walk);
        if (o && typeof o === "object") {
          if (o["@type"]) counts.types[o["@type"]] = (counts.types[o["@type"]] || 0) + 1;
          Object.values(o).forEach(walk);
        }
      };
      walk(obj);
    } catch (e) {
      problems++;
      console.log(`BAD JSON-LD  ${f}: ${e.message}`);
    }
  }
  // AEO invariants
  const isBio = f === "privacy.html" || f === "terms.html" || f === "contact.html" || f === "404.html";
  const isWidget = f === "embed/contrast-checker.html";
  const isGenerated = f.startsWith("colors/") || f === "colors.html";
  if (!isBio && !isWidget) {
    if (!html.includes('href="/llms-full.txt"')) {
      problems++;
      console.log(`missing llms-full link  ${f}`);
    }
    if (!html.includes("<!-- AEO:about -->") && !isGenerated && f !== "embed.html") {
      problems++;
      console.log(`missing About link      ${f}`);
    }
  }
  if (f.startsWith("blog/") && !/<time datetime="\d{4}-\d{2}-\d{2}"/.test(html)) {
    problems++;
    console.log(`missing <time datetime> ${f}`);
  }
  if (/class="aeo-answer"/.test(html) && !/<!-- AEO:answer -->/.test(html) && !isGenerated) {
    problems++;
    console.log(`answer block without marker ${f}`);
  }
  if (f.startsWith("colors/") && !/"@type": "FAQPage"/.test(html)) {
    problems++;
    console.log(`color page without FAQPage ${f}`);
  }
  const dup = (html.match(/<!-- AEO:faq -->/g) || []).length;
  if (dup > 1) {
    problems++;
    console.log(`duplicate FAQ block ${f} x${dup}`);
  }
}

console.log(JSON.stringify(counts, null, 2));
console.log(problems === 0 ? "ALL CHECKS PASSED" : `${problems} PROBLEM(S)`);
process.exit(problems === 0 ? 0 : 1);
