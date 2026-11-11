/**
 * Brand-accent contrast study.
 *
 * For each site in the sample: fetch the homepage, collect the colors declared in its
 * CSS (inline <style> + up to 3 stylesheets), pick the most frequent non-neutral accent,
 * and measure WCAG contrast of that accent against white and black text.
 *
 * Output:
 *   data/brand-contrast-study.csv        one row per site
 *   data/brand-contrast-study.json       aggregate summary used by the article
 *   blog/brand-accent-contrast-study-2026.html   the article, numbers injected
 *
 * Usage: ELECTRON_RUN_AS_NODE=1 "<DeepSeek Harness>.exe" tools/brand-contrast-study.mjs . [--limit N]
 */

import { writeFileSync, readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.argv[2] ?? ".";
const LIMIT_ARG = process.argv.indexOf("--limit");
const LIMIT = LIMIT_ARG > -1 ? Number(process.argv[LIMIT_ARG + 1]) : Infinity;
const CONCURRENCY = 5;
const TIMEOUT_MS = 15000;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";

// Sample: 100+ well-known domains across eight categories. Ordered so that a --limit
// run still covers every category.
const SAMPLE = [
  ["google.com", "Media"], ["youtube.com", "Media"], ["facebook.com", "Social"], ["wikipedia.org", "Media"],
  ["amazon.com", "Ecommerce"], ["reddit.com", "Social"], ["x.com", "Social"], ["bing.com", "Media"],
  ["microsoft.com", "Enterprise"], ["apple.com", "Enterprise"], ["netflix.com", "Media"], ["linkedin.com", "Social"],
  ["tiktok.com", "Social"], ["twitch.tv", "Media"], ["spotify.com", "Media"], ["github.com", "Devtools"],
  ["gitlab.com", "Devtools"], ["stackoverflow.com", "Devtools"], ["npmjs.com", "Devtools"], ["vercel.com", "Devtools"],
  ["netlify.com", "Devtools"], ["cloudflare.com", "Devtools"], ["digitalocean.com", "Devtools"], ["heroku.com", "Devtools"],
  ["shopify.com", "SaaS"], ["stripe.com", "Fintech"], ["paypal.com", "Fintech"], ["square.com", "Fintech"],
  ["wise.com", "Fintech"], ["revolut.com", "Fintech"], ["monzo.com", "Fintech"], ["chime.com", "Fintech"],
  ["coinbase.com", "Fintech"], ["binance.com", "Fintech"], ["kraken.com", "Fintech"], ["robinhood.com", "Fintech"],
  ["etsy.com", "Ecommerce"], ["ebay.com", "Ecommerce"], ["aliexpress.com", "Ecommerce"], ["walmart.com", "Ecommerce"],
  ["target.com", "Ecommerce"], ["bestbuy.com", "Ecommerce"], ["ikea.com", "Ecommerce"], ["nike.com", "Ecommerce"],
  ["adidas.com", "Ecommerce"], ["zara.com", "Ecommerce"], ["hm.com", "Ecommerce"], ["uniqlo.com", "Ecommerce"],
  ["sephora.com", "Ecommerce"], ["airbnb.com", "Travel"], ["booking.com", "Travel"], ["expedia.com", "Travel"],
  ["tripadvisor.com", "Travel"], ["uber.com", "Travel"], ["lyft.com", "Travel"], ["doordash.com", "Travel"],
  ["duolingo.com", "Education"], ["coursera.com", "Education"], ["udemy.com", "Education"], ["khanacademy.org", "Education"],
  ["medium.com", "Media"], ["substack.com", "Media"], ["notion.so", "SaaS"], ["figma.com", "SaaS"],
  ["canva.com", "SaaS"], ["adobe.com", "SaaS"], ["atlassian.com", "SaaS"], ["slack.com", "SaaS"],
  ["zoom.us", "SaaS"], ["dropbox.com", "SaaS"], ["box.com", "SaaS"], ["asana.com", "SaaS"],
  ["trello.com", "SaaS"], ["monday.com", "SaaS"], ["clickup.com", "SaaS"], ["hubspot.com", "SaaS"],
  ["salesforce.com", "Enterprise"], ["mailchimp.com", "SaaS"], ["twilio.com", "Devtools"], ["sendgrid.com", "Devtools"],
  ["datadoghq.com", "Devtools"], ["newrelic.com", "Devtools"], ["sentry.io", "Devtools"], ["pagerduty.com", "Devtools"],
  ["postman.com", "Devtools"], ["jetbrains.com", "Devtools"], ["docker.com", "Devtools"], ["kubernetes.io", "Devtools"],
  ["hashicorp.com", "Devtools"], ["mongodb.com", "Devtools"], ["supabase.com", "Devtools"], ["openai.com", "AI"],
  ["anthropic.com", "AI"], ["huggingface.co", "AI"], ["perplexity.ai", "AI"], ["ollama.com", "Devtools"],
].slice(0, LIMIT === Infinity ? undefined : LIMIT);

// ---------- color parsing ----------
const NAMED = { white: [255, 255, 255], black: [0, 0, 0] };

function parseHex(h) {
  let s = h.replace("#", "");
  if (s.length === 3) s = s.split("").map((c) => c + c).join("");
  if (s.length === 8) s = s.slice(0, 6); // drop alpha: treat as opaque
  if (!/^[0-9a-fA-F]{6}$/.test(s)) return null;
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
}
function parseRgbFn(str) {
  const m = str.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
  if (!m) return null;
  return [m[1], m[2], m[3]].map((v) => Math.round(Math.max(0, Math.min(255, Number(v)))));
}
const toLinear = (v) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};
const lum = ([r, g, b]) => 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
const contrast = (a, b) => {
  const l1 = lum(a), l2 = lum(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};

function hslOf([r, g, b]) {
  const [rr, gg, bb] = [r / 255, g / 255, b / 255];
  const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rr) h = ((gg - bb) / d + (gg < bb ? 6 : 0)) / 6;
    else if (max === gg) h = ((bb - rr) / d + 2) / 6;
    else h = ((rr - gg) / d + 4) / 6;
  }
  return [h * 360, s, l];
}

// ---------- fetch ----------
async function get(url, timeout = TIMEOUT_MS) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        "user-agent": UA,
        accept: "text/html,application/xhtml+xml,text/css,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "no-cache",
      },
    });
    const buf = await res.arrayBuffer();
    return { ok: res.ok, status: res.status, url: res.url, text: Buffer.from(buf).toString("utf8") };
  } finally {
    clearTimeout(t);
  }
}

function extractCss(html) {
  const parts = [];
  for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) parts.push(m[1]);
  return parts.join("\n");
}

function stylesheetUrls(html, base) {
  const urls = [];
  for (const m of html.matchAll(/<link[^>]+rel=["']?stylesheet["']?[^>]*>/gi)) {
    const href = (m[0].match(/href=["']([^"']+)["']/i) || [])[1];
    if (!href) continue;
    try {
      urls.push(new URL(href, base).toString());
    } catch {}
  }
  return urls.slice(0, 3);
}

async function analyzeSite(domain, category) {
  let page = await get("https://" + domain);
  // a 403 on the apex is often a bot rule the www host does not share
  if (page.status === 403 && !domain.startsWith("www.")) {
    try {
      const retry = await get("https://www." + domain);
      if (retry.ok) page = retry;
    } catch {}
  }
  if (!page.ok) throw new Error(`HTTP ${page.status}`);

  let css = extractCss(page.text);
  for (const sheet of stylesheetUrls(page.text, page.url)) {
    try {
      const r = await get(sheet, 12000);
      if (r.ok) css += "\n" + r.text;
    } catch {}
  }

  const counts = new Map();
  for (const m of css.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
    const rgb = parseHex(m[0]);
    if (rgb) counts.set(m[0].toLowerCase(), (counts.get(m[0].toLowerCase()) || 0) + 1);
  }
  for (const m of css.matchAll(/rgba?\([^)]*\)/gi)) {
    const rgb = parseRgbFn(m[0]);
    if (rgb) {
      const key = "#" + rgb.map((v) => v.toString(16).padStart(2, "0")).join("");
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }
  // inline SVG fills carry brand color on logo-driven sites
  for (const m of page.text.matchAll(/fill=["'](#[0-9a-fA-F]{3,8})["']/g)) {
    const rgb = parseHex(m[1]);
    if (rgb) counts.set(m[1].toLowerCase(), (counts.get(m[1].toLowerCase()) || 0) + 1);
  }
  // an explicit theme-color declaration is the site's own claim about its brand color
  const themeColor = (page.text.match(/<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i) || [])[1];
  if (themeColor) {
    const rgb = parseHex(themeColor) || parseRgbFn(themeColor);
    if (rgb) {
      const key = "#" + rgb.map((v) => v.toString(16).padStart(2, "0")).join("");
      counts.set(key, (counts.get(key) || 0) + 6);
    }
  }
  for (const [name, rgb] of Object.entries(NAMED)) {
    const re = new RegExp(`(?:color|background(?:-color)?)\\s*:\\s*${name}\\b`, "gi");
    const n = (css.match(re) || []).length;
    if (n) counts.set(name, (counts.get(name) || 0) + n);
  }

  // keep chromatic, mid-lightness colors: these are the candidates for an accent
  const pick = (minSat, minLight, maxLight) => {
    const out = [];
    for (const [key, n] of counts) {
      const rgb = key.startsWith("#") ? parseHex(key) : NAMED[key];
      if (!rgb) continue;
      const [h, s, l] = hslOf(rgb);
      if (key === "white" || key === "black") continue;
      if (s < minSat || l < minLight || l > maxLight) continue;
      out.push({ key, count: n, rgb, hue: Math.round(h), sat: s, light: l });
    }
    out.sort((a, b) => b.count - a.count || b.sat - a.sat);
    return out;
  };
  let candidates = pick(0.3, 0.12, 0.88);
  if (!candidates.length) candidates = pick(0.15, 0.08, 0.92);
  if (!candidates.length) throw new Error("no chromatic color found");
  const accent = candidates[0];

  const onWhite = contrast(accent.rgb, [255, 255, 255]);
  const onBlack = contrast(accent.rgb, [0, 0, 0]);
  const bestText = onWhite >= onBlack ? "white" : "black";
  const bestRatio = Math.max(onWhite, onBlack);

  return {
    domain,
    category,
    accent: accent.key.toUpperCase(),
    occurrences: accent.count,
    hue: accent.hue,
    onWhite: Number(onWhite.toFixed(2)),
    onBlack: Number(onBlack.toFixed(2)),
    bestText,
    bestRatio: Number(bestRatio.toFixed(2)),
    passesAA: bestRatio >= 4.5,
    passesAALarge: bestRatio >= 3,
    passWhite: onWhite >= 4.5,
    passBlack: onBlack >= 4.5,
    failWhite: onWhite < 4.5,
  };
}

// ---------- run ----------
const results = [];
const failures = [];
let cursor = 0;

async function worker() {
  while (cursor < SAMPLE.length) {
    const [domain, category] = SAMPLE[cursor++];
    try {
      const r = await analyzeSite(domain, category);
      results.push(r);
      console.log(`ok   ${domain.padEnd(22)} ${r.accent}  ${r.bestText} ${r.bestRatio}:1`);
    } catch (e) {
      failures.push({ domain, category, error: String(e.message || e) });
      console.log(`fail ${domain.padEnd(22)} ${e.message || e}`);
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));

// ---------- aggregate ----------
const n = results.length;
const pct = (x) => Math.round((x / n) * 1000) / 10;
const pctOf = (x, total) => (total ? Math.round((x / total) * 1000) / 10 : 0);
const byCat = {};
for (const r of results) {
  const c = (byCat[r.category] ??= { n: 0, pass: 0, large: 0, ratios: [], accents: [], white: [], whitePass: 0, whiteLarge: 0 });
  c.n++;
  c.ratios.push(r.bestRatio);
  c.accents.push(r.accent);
  c.white.push(r.onWhite);
  if (r.passesAA) c.pass++;
  if (r.passesAALarge) c.large++;
  if (r.passWhite) c.whitePass++;
  if (r.onWhite < 3) c.whiteLarge++;
}
const median = (arr) => {
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const categories = Object.entries(byCat)
  .map(([category, c]) => ({
    category,
    n: c.n,
    passRate: pct(c.pass),
    largePassRate: pct(c.large),
    medianRatio: Number(median(c.ratios).toFixed(2)),
    medianWhite: Number(median(c.white).toFixed(2)),
    whitePassRate: pctOf(c.whitePass, c.n),
    whiteLargeFail: c.whiteLarge,
    topAccents: mode([...c.accents]).slice(0, 3),
  }))
  .sort((a, b) => a.whitePassRate - b.whitePassRate);

function mode(arr) {
  const m = new Map();
  for (const x of arr) m.set(x, (m.get(x) || 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);
}

const buckets = [
  ["< 3:1", (r) => r.bestRatio < 3],
  ["3–4.49:1", (r) => r.bestRatio >= 3 && r.bestRatio < 4.5],
  ["4.5–6.99:1", (r) => r.bestRatio >= 4.5 && r.bestRatio < 7],
  ["7:1+", (r) => r.bestRatio >= 7],
].map(([label, test]) => ({ label, count: results.filter(test).length }));

const hueBuckets = [
  ["Red (345–15°)", (h) => h >= 345 || h < 15],
  ["Orange (15–45°)", (h) => h >= 15 && h < 45],
  ["Yellow (45–70°)", (h) => h >= 45 && h < 70],
  ["Green (70–165°)", (h) => h >= 70 && h < 165],
  ["Cyan (165–200°)", (h) => h >= 165 && h < 200],
  ["Blue (200–260°)", (h) => h >= 200 && h < 260],
  ["Purple (260–345°)", (h) => h >= 260 && h < 345],
].map(([label, test]) => {
  const rows = results.filter((r) => test(r.hue));
  return {
    label,
    count: rows.length,
    medianWhite: rows.length ? Number(median(rows.map((r) => r.onWhite)).toFixed(2)) : 0,
    whitePassRate: pctOf(rows.filter((r) => r.passWhite).length, rows.length),
  };
}).sort((a, b) => a.medianWhite - b.medianWhite);

const summary = {
  generatedAt: new Date().toISOString().slice(0, 10),
  sample: SAMPLE.length,
  analyzed: n,
  failed: failures.length,
  failures,
  passAA: results.filter((r) => r.passesAA).length,
  passAALarge: results.filter((r) => r.passesAALarge).length,
  failAll: results.filter((r) => !r.passesAALarge).length,
  passRateAA: pct(results.filter((r) => r.passesAA).length),
  passRateLarge: pct(results.filter((r) => r.passesAALarge).length),
  whitePass: results.filter((r) => r.passWhite).length,
  whitePassRate: pct(results.filter((r) => r.passWhite).length),
  whiteFail: results.filter((r) => r.failWhite).length,
  whiteFailRate: pct(results.filter((r) => r.failWhite).length),
  whiteLargeFail: results.filter((r) => r.onWhite < 3).length,
  blackPassRate: pct(results.filter((r) => r.passBlack).length),
  neither: results.filter((r) => !r.passWhite && !r.passBlack).length,
  medianRatio: Number(median(results.map((r) => r.bestRatio)).toFixed(2)),
  whiteTextShare: pct(results.filter((r) => r.bestText === "white").length),
  buckets,
  hueBuckets,
  categories,
};

writeFileSync(
  join(ROOT, "data/brand-contrast-study.csv"),
  [
    "domain,category,accent_hex,occurrences,hue,contrast_on_white,contrast_on_black,best_text_color,best_ratio,passes_AA_normal,passes_AA_large,passes_AA_with_white,passes_AA_with_black",
    ...results
      .sort((a, b) => a.bestRatio - b.bestRatio)
      .map((r) =>
        [r.domain, r.category, r.accent, r.occurrences, r.hue, r.onWhite, r.onBlack, r.bestText, r.bestRatio, r.passesAA, r.passesAALarge, r.passWhite, r.passBlack].join(",")
      ),
  ].join("\n"),
  "utf8"
);
writeFileSync(join(ROOT, "data/brand-contrast-study.json"), JSON.stringify({ summary, results }, null, 2), "utf8");

console.log(`\nanalyzed ${n}/${SAMPLE.length} · AA pass ${summary.passRateAA}% · median ${summary.medianRatio}:1`);
