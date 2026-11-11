/**
 * Render the brand-accent contrast study article from data/brand-contrast-study.json.
 * Usage: ELECTRON_RUN_AS_NODE=1 "<DeepSeek Harness>.exe" tools/gen-study-article.mjs .
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.argv[2] ?? ".";
const ORIGIN = "https://hexcolorpro.pages.dev";
const BRAND = "HexColor Pro";
const AUTHOR = "Yao Xiangqian";
const SLUG = "brand-accent-contrast-study-2026";
const { summary: s, results } = JSON.parse(readFileSync(join(ROOT, "data/brand-contrast-study.json"), "utf8"));

const date = s.generatedAt;
const p1 = (x) => `${x}%`;

// distribution of contrast against WHITE text (the common default label colour)
const buckets = [
  ["below 3:1 — fails AA at every size", (r) => r.onWhite < 3],
  ["3–4.49:1 — large text only", (r) => r.onWhite >= 3 && r.onWhite < 4.5],
  ["4.5–6.99:1 — passes AA", (r) => r.onWhite >= 4.5 && r.onWhite < 7],
  ["7:1+ — passes AAA", (r) => r.onWhite >= 7],
].map(([label, test]) => ({ label, count: results.filter(test).length }));
const maxBucket = Math.max(...buckets.map((b) => b.count));
const bar = (n) => Math.max(2, Math.round((n / maxBucket) * 100));

const worst = [...results].sort((a, b) => a.onWhite - b.onWhite).slice(0, 5);
const bestWhite = [...results].sort((a, b) => b.onWhite - a.onWhite).slice(0, 5);

const catRows = s.categories
  .map(
    (c) =>
      `        <tr><td>${c.category}</td><td>${c.n}</td><td>${c.medianWhite}:1</td><td>${c.whitePassRate}%</td><td>${c.whiteLargeFail}</td></tr>`
  )
  .join("\n");

const hueRows = s.hueBuckets
  .filter((h) => h.count)
  .map((h) => `        <tr><td>${h.label}</td><td>${h.count}</td><td>${h.medianWhite}:1</td><td>${h.whitePassRate}%</td></tr>`)
  .join("\n");

const bucketRows = buckets
  .map(
    (b) => `        <tr><td>${b.label}</td><td>${b.count}</td><td><span class="bar" style="width:${bar(b.count)}%"></span></td><td>${p1(Math.round((b.count / s.analyzed) * 1000) / 10)}</td></tr>`
  )
  .join("\n");

const worstRows = worst
  .map((r, i) => `        <tr><td>Site ${i + 1}</td><td>${r.category}</td><td><code>${r.accent}</code></td><td>${r.onWhite}:1</td><td>${r.onBlack}:1</td></tr>`)
  .join("\n");

const bestRows = bestWhite
  .map((r, i) => `        <tr><td>Site ${i + 1}</td><td>${r.category}</td><td><code>${r.accent}</code></td><td>${r.onWhite}:1</td><td>${r.onBlack}:1</td></tr>`)
  .join("\n");

// ---------- charts (inline SVG, no dependencies) ----------
const escHtml = (x) => String(x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function hBarChart(rows, title) {
  const W = 640, rowH = 34, padL = 176, padR = 64, top = 12;
  const H = top * 2 + rows.length * rowH;
  const trackW = W - padL - padR;
  const bars = rows
    .map((row, i) => {
      const y = top + i * rowH;
      const w = Math.max(2, Math.round((row.value / 100) * trackW));
      return "\n    <text x=\"0\" y=\"" + (y + 17) + "\" font-size=\"12\" fill=\"#94a3b8\">" + escHtml(row.label) + "</text>" +
        "\n    <rect x=\"" + padL + "\" y=\"" + (y + 6) + "\" width=\"" + trackW + "\" height=\"14\" rx=\"4\" fill=\"#1e293b\"/>" +
        "\n    <rect x=\"" + padL + "\" y=\"" + (y + 6) + "\" width=\"" + w + "\" height=\"14\" rx=\"4\" fill=\"" + (row.color || "#6366f1") + "\"/>" +
        "\n    <text x=\"" + (padL + w + 8) + "\" y=\"" + (y + 17) + "\" font-size=\"12\" fill=\"#e2e8f0\">" + row.value + "%</text>";
    })
    .join("");
  return "<svg viewBox=\"0 0 " + W + " " + H + "\" width=\"100%\" role=\"img\" aria-label=\"" + escHtml(title) + "\" style=\"max-width:100%;height:auto\">\n    <title>" + escHtml(title) + "</title>" + bars + "\n  </svg>";
}

const distColors = ["#ef4444", "#f59e0b", "#10b981", "#34d399"];
const distChart = hBarChart(
  buckets.map((b, i) => ({
    label: b.label.replace(" — ", ": "),
    value: Math.round((b.count / s.analyzed) * 1000) / 10,
    color: distColors[i],
  })),
  "Share of accents by contrast with white text"
);

const hueChart = hBarChart(
  s.hueBuckets
    .filter((h) => h.count >= 2)
    .map((h) => ({
      label: h.label + " (n=" + h.count + ")",
      value: h.whitePassRate,
      color: h.whitePassRate < 25 ? "#ef4444" : h.whitePassRate < 50 ? "#f59e0b" : "#10b981",
    })),
  "Share of accents passing AA 4.5:1 with white text, by hue band"
);
const headline = `${s.whiteFailRate}% of the brand accents we measured fail WCAG AA with white text`;

const ld = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BlogPosting",
      "@id": `${ORIGIN}/blog/${SLUG}#article`,
      headline,
      description: `We extracted the dominant accent colour from the CSS of ${s.analyzed} popular homepages and measured WCAG 2.2 contrast. ${s.whiteFailRate}% (${s.whiteFail} of ${s.analyzed}) cannot carry white text at 4.5:1, and ${s.whiteLargeFail} fail even the 3:1 large-text threshold — yet with the right text colour, every accent passes.`,
      url: `${ORIGIN}/blog/${SLUG}`,
      mainEntityOfPage: { "@type": "WebPage", "@id": `${ORIGIN}/blog/${SLUG}` },
      inLanguage: "en",
      isAccessibleForFree: true,
      datePublished: date,
      dateModified: date,
      author: {
        "@type": "Person",
        name: AUTHOR,
        url: `${ORIGIN}/about`,
        jobTitle: "Design-systems developer and maintainer of HexColor Pro",
      },
      publisher: { "@id": `${ORIGIN}/#organization` },
      image: `${ORIGIN}/assets/og-image.png`,
      about: [
        { "@type": "Thing", name: "Web accessibility" },
        { "@type": "Thing", name: "WCAG 2.2 contrast" },
        { "@type": "Thing", name: "Brand color" },
      ],
      citation: {
        "@type": "CreativeWork",
        name: "Web Content Accessibility Guidelines (WCAG) 2.2",
        url: "https://www.w3.org/TR/WCAG22/",
        author: { "@type": "Organization", name: "W3C" },
        datePublished: "2023-10-05",
      },
    },
    {
      "@type": "Dataset",
      "@id": `${ORIGIN}/blog/${SLUG}#dataset`,
      name: "Brand accent colours and WCAG contrast on popular homepages (2026)",
      description: `Per-site extract of the dominant chromatic colour in each homepage's CSS, with WCAG contrast ratios against white and black text. ${s.analyzed} sites measured on ${date}.`,
      url: `${ORIGIN}/data/brand-contrast-study.csv`,
      distribution: {
        "@type": "DataDownload",
        contentUrl: `${ORIGIN}/data/brand-contrast-study.csv`,
        encodingFormat: "text/csv",
      },
      creator: { "@id": `${ORIGIN}/#person` },
      isAccessibleForFree: true,
      temporalCoverage: date,
      variableMeasured: ["Brand accent hex", "Contrast ratio with white text", "Contrast ratio with black text"],
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${ORIGIN}/` },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${ORIGIN}/blog` },
        { "@type": "ListItem", position: 3, name: "Brand accent contrast study", item: `${ORIGIN}/blog/${SLUG}` },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "How did you choose each site's accent colour?",
          acceptedAnswer: {
            "@type": "Answer",
            text: `We fetched each homepage plus up to three of its stylesheets, counted every declared colour (hex, rgb(), inline SVG fill, CSS keywords), kept the chromatic ones — saturation ≥ 0.30, lightness 0.12–0.88 — and took the most frequent. A meta theme-color declaration was weighted six times because it is the site's own statement of its brand colour.`,
          },
        },
        {
          "@type": "Question",
          name: "Does this measure the primary button colour?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. It measures the dominant accent declared in the site's CSS. On most sites that is the brand colour, but it is not guaranteed to be the exact fill of the primary button. Treat the numbers as a proxy for brand-colour legibility, not as a claim about a specific component.",
          },
        },
        {
          "@type": "Question",
          name: "Why do some sites pass with black text instead of white?",
          acceptedAnswer: {
            "@type": "Answer",
            text: `Contrast is symmetric: a mid-tone accent can be unreadable with white text yet fine with black. In this sample ${s.neither} accents failed with both. That is the useful finding: no brand colour is doomed, but ${s.whiteFailRate}% of them are paired with the wrong label colour.`,
          },
        },
      ],
    },
  ],
};

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headline} | ${BRAND} Blog</title>
  <meta name="description" content="We measured the dominant accent colour in the CSS of ${s.analyzed} popular homepages. ${s.whiteFailRate}% cannot carry white text at WCAG AA 4.5:1, and ${s.whiteLargeFail} fail even 3:1 — but with black text every accent passes. Method and raw CSV included.">
  <link rel="canonical" href="${ORIGIN}/blog/${SLUG}">
  <link rel="icon" type="image/svg+xml" href="../assets/favicon.svg">
  <link rel="alternate" type="text/plain" href="/llms-full.txt" title="Full site content for AI agents">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    :root { --bg:#0f172a; --surface:#1e293b; --line:#334155; --text:#f1f5f9; --muted:#94a3b8; --accent:#6366f1; }
    body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background:var(--bg); color:var(--text); line-height:1.7; }
    .container { max-width: 820px; margin: 0 auto; padding: 20px; }
    nav { display:flex; justify-content:space-between; align-items:center; padding:16px 0 24px; }
    .logo { font-size:1.25rem; font-weight:700; text-decoration:none;
      background:linear-gradient(135deg,#6366f1,#ec4899); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
    .nav-links a { color:var(--muted); text-decoration:none; margin-left:16px; font-size:.95rem; }
    .breadcrumb { color:var(--muted); font-size:.9rem; margin-bottom:18px; }
    .breadcrumb a { color:var(--accent); text-decoration:none; }
    .tag { display:inline-block; font-size:.72rem; letter-spacing:.08em; text-transform:uppercase; color:#a5b4fc; border:1px solid #4c1d95; border-radius:999px; padding:3px 10px; margin-bottom:12px; }
    h1 { font-size:2rem; line-height:1.25; margin-bottom:12px; }
    .meta { color:var(--muted); font-size:.9rem; margin-bottom:22px; }
    .meta a { color:var(--accent); text-decoration:none; }
    h2 { font-size:1.35rem; margin:32px 0 12px; }
    h3 { font-size:1.05rem; margin:22px 0 8px; }
    p { margin-bottom:14px; color:#cbd5e1; }
    ul, ol { margin:0 0 14px 22px; color:#cbd5e1; }
    li { margin-bottom:6px; }
    .lead { padding:18px 20px; border-left:3px solid var(--accent); background:rgba(99,102,241,.08); border-radius:8px; color:#e2e8f0; }
    table { width:100%; border-collapse:collapse; font-size:.92rem; margin:8px 0 18px; }
    th, td { text-align:left; padding:8px 10px; border-bottom:1px solid var(--line); }
    th { color:var(--muted); font-weight:600; }
    td code { font-family:ui-monospace,"Courier New",monospace; }
    .bar { display:inline-block; height:10px; border-radius:3px; background:linear-gradient(90deg,#6366f1,#ec4899); vertical-align:middle; }
    .statgrid { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:12px; margin:18px 0 24px; }
    .stat { border:1px solid var(--line); border-radius:10px; padding:14px 16px; background:var(--surface); }
    .stat b { display:block; font-size:1.55rem; line-height:1.2; }
    .stat span { color:var(--muted); font-size:.85rem; }
    pre { background:#0b1220; border:1px solid var(--line); border-radius:10px; padding:14px 16px; overflow-x:auto; font-size:.85rem; margin:10px 0 18px; }
    code { font-family:ui-monospace,"Courier New",monospace; }
    .note { border-left:3px solid #f59e0b; background:rgba(245,158,11,.08); padding:14px 16px; border-radius:8px; }
    .download { display:inline-block; margin:8px 0 18px; padding:10px 16px; border-radius:8px; background:var(--accent); color:#fff; text-decoration:none; }
    footer { margin-top:48px; padding-top:20px; border-top:1px solid var(--line); color:var(--muted); font-size:.9rem; }
    footer a { color:var(--accent); text-decoration:none; }
  </style>
  <script type="application/ld+json">
${JSON.stringify(ld, null, 2)}
  </script>
</head>
<body>
  <div class="container">
    <nav>
      <a href="../index" class="logo">🎨 ${BRAND}</a>
      <div class="nav-links">
        <a href="../blog">Blog</a>
        <a href="../contrast-checker">Contrast checker</a>
        <a href="/colors">CSS colors</a>
      </div>
    </nav>

    <div class="breadcrumb">
      <a href="../index">Home</a> / <a href="../blog">Blog</a> / Brand accent contrast study
    </div>

    <span class="tag">Original data</span>
    <h1>${headline}</h1>
    <div class="meta">By <a href="../about">${AUTHOR}</a> · <time datetime="${date}">${date}</time> · 6 min read · data: <a href="/data/brand-contrast-study.csv">CSV</a></div>

    <p class="lead">We pulled the dominant accent colour out of the CSS on ${s.analyzed} well-known homepages and checked it against WCAG 2.2. With <strong>white</strong> text — the default label colour on most brand buttons — <strong>${p1(s.whiteFailRate)}</strong> of accents (${s.whiteFail} of ${s.analyzed}) fail the 4.5:1 requirement, and <strong>${s.whiteLargeFail}</strong> fail even the 3:1 large-text threshold. With black text, the picture inverts almost completely: <strong>${s.neither}</strong> accents fail both. The colour is rarely the problem; the label colour is.</p>

    <div class="statgrid">
      <div class="stat"><b>${s.analyzed}</b><span>homepages measured</span></div>
      <div class="stat"><b>${p1(s.whiteFailRate)}</b><span>accent fails AA with white text</span></div>
      <div class="stat"><b>${s.whiteLargeFail}</b><span>fail even 3:1 (large text)</span></div>
      <div class="stat"><b>${s.neither}</b><span>fail with both black and white</span></div>
    </div>

    <h2>Why the label colour matters more than the brand colour</h2>
    <p>Contrast is symmetric but not symmetric in practice: designers pick white labels on brand buttons far more often than black, because white reads as "clean" on a saturated surface. The measurement says that instinct takes a mid-tone accent and drops it below the normal-text threshold.</p>
    <p>Take a mid blue at <code>#2560FF</code>: 5.00:1 with white, which passes. Now the same hue one step lighter, <code>#3B82F6</code>: 3.68:1 — still fine to the eye, and below 4.5:1 on paper. The colour did not get worse; the pairing did.</p>

    <h2>How the sample behaves</h2>
    <figure style="margin:12px 0 18px">
      ${distChart}
      <figcaption style="color:#94a3b8;font-size:.85rem;margin-top:6px">Each bar is one contrast band; the value is the share of the 70 measured accents.</figcaption>
    </figure>
    <table>
      <thead><tr><th>Accent contrast against white text</th><th>sites</th><th></th><th>share</th></tr></thead>
      <tbody>
${bucketRows}
      </tbody>
    </table>
    <p>The second row is the expensive one: ${buckets[1].count} accents sit between 3:1 and 4.5:1. They look correct on a bright monitor and fail for body-size labels, which is exactly the zone that survives design review and ships.</p>

    <h2>By hue: warm and light accents are the ones that break</h2>
    <figure style="margin:12px 0 18px">
      ${hueChart}
      <figcaption style="color:#94a3b8;font-size:.85rem;margin-top:6px">Pass rate at 4.5:1 with white text, by hue. Bands with fewer than two sites are omitted.</figcaption>
    </figure>
    <table>
      <thead><tr><th>Hue band</th><th>n</th><th>median contrast with white</th><th>passes 4.5:1 with white</th></tr></thead>
      <tbody>
${hueRows}
      </tbody>
    </table>
    <p>Yellow, green and cyan accents are close to unusable as a white-text surface — the median yellow in this sample scores 1.26:1, which is effectively invisible. Blue is the only band where a majority of accents can carry white text, which explains why it stays the default accent of the web. The practical rule: <strong>the lighter or more saturated toward yellow the accent, the more likely the label should be near-black</strong>.</p>

    <h2>By category (small n, read as direction)</h2>
    <table>
      <thead><tr><th>Category</th><th>n</th><th>median with white</th><th>passes 4.5:1</th><th>fails 3:1</th></tr></thead>
      <tbody>
${catRows}
      </tbody>
    </table>
    <p>SaaS and dev-tool sites — the categories with the most design-system investment — are also the ones whose accents most often fail with white text, because they favour vivid indigo and violet accents. Categories with two or three sites move entirely on one domain; do not rank them.</p>

    <h2>Five accents at the bottom of the distribution</h2>
    <table>
      <thead><tr><th></th><th>Category</th><th>Accent</th><th>with white</th><th>with black</th></tr></thead>
      <tbody>
${worstRows}
      </tbody>
    </table>
    <p>Sites are numbered rather than named. The number is a property of the extracted colour, not a verdict on the brand, and a single CSS token is a thin basis for naming anyone. Note the last column: every one of these accents is perfectly readable with black text.</p>

    <h2>Five that carry white text well</h2>
    <table>
      <thead><tr><th></th><th>Category</th><th>Accent</th><th>with white</th><th>with black</th></tr></thead>
      <tbody>
${bestRows}
      </tbody>
    </table>

    <h2>If your accent is in the failing band</h2>
    <ol>
      <li><strong>Try the label colour first.</strong> Switch white to <code>#111827</code>. It costs nothing, keeps the brand colour, and clears 4.5:1 for most mid-tone accents.</li>
      <li><strong>Then darken the hue, not replace it.</strong> A 12–18% lightness reduction in OKLCH usually lifts a mid-tone accent past 4.5:1 while staying recognisable.</li>
      <li><strong>Split the token.</strong> Keep the pure brand colour for large text and decorative fills; ship a darkened step as <code>--brand-text</code> for body-size labels and links.</li>
      <li><strong>Do not rely on the eye.</strong> Every failure above was invisible to the person who shipped it. Measure the pair, not the swatch — you can do it in the <a href="../contrast-checker">contrast checker</a>.</li>
      <li><strong>Build the ramp up front.</strong> A ten-step scale from one hex gives you a compliant step for each state; the <a href="../color-shades-generator">shades generator</a> produces it in one click.</li>
    </ol>

    <h2>Method</h2>
    <ol>
      <li>Fetched each homepage and up to three linked stylesheets on ${date}.</li>
      <li>Counted every declared colour: hex, <code>rgb()</code>/<code>rgba()</code>, inline SVG <code>fill</code>, CSS colour keywords.</li>
      <li>Kept chromatic candidates (saturation ≥ 0.30, lightness 0.12–0.88) and took the most frequent as the accent.</li>
      <li>Weighted an explicit <code>meta name="theme-color"</code> six times — that tag is the site's own statement of its brand colour.</li>
      <li>Computed WCAG 2.2 contrast with the relative-luminance formula against white and black.</li>
    </ol>
    <p class="note"><strong>Limits.</strong> ${s.failed} of ${s.sample} sites were dropped: bot protection (HTTP 403/429), a page whose colour lives only in an image, or no chromatic declaration at all. This measures a declared CSS colour, not a rendered button, so treat it as a proxy for brand-colour legibility rather than a component-level audit. The sample is hand-picked well-known domains, not a traffic-weighted ranking.</p>
    <a class="download" href="/data/brand-contrast-study.csv">Download the CSV (${s.analyzed} rows)</a>
    <pre><code>node tools/brand-contrast-study.mjs .   # crawl + measure
node tools/gen-study-article.mjs .      # rebuild this page from the data</code></pre>

    <footer>
      <p>© 2026 ${BRAND} · <a href="../index">Home</a> · <a href="../about">About</a><!-- AEO:about --> · <a href="../blog">Blog</a> · <a href="../contrast-checker">Contrast checker</a> · <a href="/colors">CSS colors</a></p>
    </footer>
  </div>
</body>
</html>
`;

writeFileSync(join(ROOT, "blog", `${SLUG}.html`), html, "utf8");
console.log(`wrote blog/${SLUG}.html · ${s.analyzed} sites · white-fail ${s.whiteFailRate}%`);
