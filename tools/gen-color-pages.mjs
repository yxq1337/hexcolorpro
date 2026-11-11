/**
 * Generate the CSS named-color reference pages (/colors/<keyword>) plus a hub page,
 * and sync sitemap.xml + llms.txt. Idempotent: rewrites only the blocks it owns.
 *
 * Usage: ELECTRON_RUN_AS_NODE=1 "<DeepSeek Harness>.exe" tools/gen-color-pages.mjs . [--dry]
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.argv[2] ?? ".";
const DRY = process.argv.includes("--dry");
const ORIGIN = "https://hexcolorpro.pages.dev";
const BRAND = "HexColor Pro";

// ---------- data ----------
const RAW = JSON.parse(readFileSync(join(ROOT, "data/css-named-colors.json"), "utf8"));
const keywords = Object.keys(RAW).sort();

// Display names: greedy word split from a token list, with explicit fixes.
const TOKENS = [
  "alice","antique","aqua","aquamarine","azure","beige","bisque","black","blanched","almond",
  "blue","violet","brown","burly","wood","cadet","chartreuse","chocolate","coral","cornflower",
  "cornsilk","crimson","cyan","dark","deep","dim","dodger","fire","brick","floral","white",
  "forest","fuchsia","gainsboro","ghost","gold","goldenrod","gray","grey","green","yellow",
  "honeydew","hot","pink","indian","red","indigo","ivory","khaki","lavender","blush","lawn",
  "lemon","chiffon","light","lime","linen","magenta","maroon","medium","midnight","mint",
  "misty","rose","moccasin","navajo","navy","old","lace","olive","drab","orange","orchid",
  "pale","turquoise","papaya","whip","peach","puff","peru","plum","powder","purple","rebecca",
  "rosy","royal","saddle","salmon","sandy","sea","shell","sienna","silver","sky","slate",
  "snow","spring","steel","tan","teal","thistle","tomato","wheat","smoke","violet","sibling",
].sort((a, b) => b.length - a.length);
const TOKEN_SET = new Set(TOKENS);
const NAME_FIX = {
  gray: "Gray", grey: "Grey", tan: "Tan", teal: "Teal", peru: "Peru", orchid: "Orchid",
  linen: "Linen", ivory: "Ivory", khaki: "Khaki", plum: "Plum", snow: "Snow", sienna: "Sienna",
  thistle: "Thistle", tomato: "Tomato", wheat: "Wheat", silver: "Silver", aquamarine: "Aquamarine",
  chartreuse: "Chartreuse", chocolate: "Chocolate", crimson: "Crimson", fuchsia: "Fuchsia",
  gainsboro: "Gainsboro", indigo: "Indigo", magenta: "Magenta", maroon: "Maroon",
  moccasin: "Moccasin", navajo: "Navajo", turquoise: "Turquoise", papaya: "Papaya",
  rebecca: "Rebecca", sienna: "Sienna", black: "Black", white: "White", red: "Red",
  blue: "Blue", green: "Green", yellow: "Yellow", orange: "Orange", purple: "Purple",
  pink: "Pink", brown: "Brown", gray: "Gray", grey: "Grey", cyan: "Cyan", lime: "Lime",
  teal: "Teal", navy: "Navy", olive: "Olive", maroon: "Maroon", aqua: "Aqua", coral: "Coral",
  gold: "Gold", peru: "Peru", beige: "Beige", bisque: "Bisque", azure: "Azure", coral: "Coral",
  burlywood: "Burlywood", seashell: "Seashell", firebrick: "Firebrick", cornsilk: "Cornsilk",
  honeydew: "Honeydew", gainsboro: "Gainsboro", sienna: "Sienna", thistle: "Thistle",
  tomato: "Tomato", wheat: "Wheat", silver: "Silver", chartreuse: "Chartreuse",
  aquamarine: "Aquamarine", turquoise: "Turquoise", rebeccapurple: "Rebecca Purple",
};

function splitName(keyword) {
  const words = [];
  let i = 0;
  while (i < keyword.length) {
    let matched = null;
    for (const t of TOKENS) {
      if (keyword.startsWith(t, i)) { matched = t; break; }
    }
    if (!matched) { matched = keyword.slice(i); }
    words.push(matched);
    i += matched.length;
  }
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
const displayName = (kw) => NAME_FIX[kw] ?? splitName(kw);

// ---------- color math ----------
const hexToRgb = (hex) => {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
const rgbToHex = (rgb) =>
  "#" + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("").toUpperCase();

function rgbToHsl([r, g, b]) {
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
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

const srgbToLinear = (c) => {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};
const luminance = ([r, g, b]) =>
  0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);

const contrast = (l1, l2) => {
  const a = Math.max(l1, l2), b = Math.min(l1, l2);
  return (a + 0.05) / (b + 0.05);
};

const rgbToLab = ([r, g, b]) => {
  const [R, G, B] = [r, g, b].map(srgbToLinear);
  let x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  let y = (R * 0.2126 + G * 0.7152 + B * 0.0722) / 1.0;
  let z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  [x, y, z] = [f(x), f(y), f(z)];
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
};
const deltaE76 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

const mix = (hex, target, ratio) => {
  const c = hexToRgb(hex);
  return rgbToHex(c.map((v, i) => v + (target[i] - v) * ratio));
};

const colors = keywords.map((kw) => {
  const hex = RAW[kw].toUpperCase();
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb);
  const lum = luminance(rgb);
  return {
    kw, hex, rgb, hsl, lum,
    lab: rgbToLab(rgb),
    onWhite: contrast(lum, luminance([255, 255, 255])),
    onBlack: contrast(lum, luminance([0, 0, 0])),
  };
});

const byKw = new Map(colors.map((c) => [c.kw, c]));
for (const c of colors) {
  c.neighbors = colors
    .filter((o) => o.kw !== c.kw)
    .map((o) => ({ o, d: deltaE76(c.lab, o.lab) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 3)
    .map((x) => x.o);
  // 9-step ramp: 4 tints toward white, base, 4 shades toward black
  c.ramp = [0.85, 0.65, 0.4, 0.18].map((r) => mix(c.hex, [255, 255, 255], r))
    .concat([c.hex])
    .concat([0.15, 0.32, 0.5, 0.68].map((r) => mix(c.hex, [0, 0, 0], r)));
}

if (DRY) {
  const bad = colors.filter((c) => displayName(c.kw).includes(" ") === false && c.kw.length > 8);
  console.log(`hair >2 words: ${colors.filter((c) => displayName(c.kw).split(" ").length > 3).length}`);
  for (const c of colors) console.log(`${c.kw.padEnd(22)} ${displayName(c.kw)}`);
  process.exit(0);
}

// ---------- page template ----------
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  :root {
    --bg: #0f172a; --surface: #1e293b; --surface-light: #334155;
    --text: #f1f5f9; --text-muted: #94a3b8; --accent: #6366f1; --radius: 12px;
  }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: var(--bg); color: var(--text); line-height: 1.6; min-height: 100vh; }
  .container { max-width: 900px; margin: 0 auto; padding: 20px; }
  nav { display: flex; justify-content: space-between; align-items: center; padding: 16px 0; margin-bottom: 20px; }
  .logo { font-size: 1.3rem; font-weight: 700;
    background: linear-gradient(135deg, #6366f1, #ec4899);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    text-decoration: none; }
  .nav-links { display: flex; gap: 18px; }
  .nav-links a { color: var(--text-muted); text-decoration: none; font-size: 0.95rem; }
  .nav-links a:hover { color: var(--text); }
  .breadcrumb { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 16px; }
  .breadcrumb a { color: var(--accent); text-decoration: none; }
  h1 { font-size: 2rem; line-height: 1.25; margin-bottom: 10px; }
  h1 .code { font-family: 'Courier New', monospace; }
  .swatch { height: 160px; border-radius: var(--radius); border: 1px solid var(--surface-light); margin: 18px 0; }
  .aeo-answer { margin: 18px 0; padding: 16px 18px; border-left: 3px solid var(--accent);
    background: rgba(99,102,241,0.08); border-radius: 8px; font-size: 1rem; }
  h2 { font-size: 1.25rem; margin: 28px 0 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 0.95rem; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--surface-light); }
  th { color: var(--text-muted); font-weight: 600; }
  td code { font-family: 'Courier New', monospace; }
  .pass { color: #10b981; } .fail { color: #ef4444; }
  .ramp { display: flex; gap: 6px; margin: 12px 0; flex-wrap: wrap; }
  .ramp figure { flex: 1 1 70px; margin: 0; }
  .ramp .chip { height: 64px; border-radius: 8px; border: 1px solid var(--surface-light); }
  .ramp figcaption { font-size: 0.72rem; color: var(--text-muted); font-family: 'Courier New', monospace; }
  .aeo-faq h3 { font-size: 1rem; margin: 16px 0 6px; }
  .aeo-faq p { color: #cbd5e1; font-size: 0.95rem; }
  .related { display: flex; gap: 10px; flex-wrap: wrap; margin: 10px 0; }
  .related a { color: var(--accent); text-decoration: none; border: 1px solid var(--surface-light);
    padding: 6px 12px; border-radius: 999px; font-size: 0.9rem; }
  footer { margin-top: 48px; padding: 24px 0; border-top: 1px solid var(--surface-light);
    color: var(--text-muted); font-size: 0.9rem; }
  footer a { color: var(--accent); text-decoration: none; }
`;

function page(c) {
  const name = displayName(c.kw);
  const [r, g, b] = c.rgb;
  const [h, s, l] = c.hsl;
  const aa = c.onWhite >= c.onBlack;
  const bestRatio = Math.max(c.onWhite, c.onBlack);
  const url = `${ORIGIN}/colors/${c.kw}`;
  const prev = colors[(colors.indexOf(c) - 1 + colors.length) % colors.length];
  const next = colors[(colors.indexOf(c) + 1) % colors.length];

  const faq = [
    [`What is the hex code for ${c.kw}?`, `${c.kw} is ${c.hex}, which is rgb(${r}, ${g}, ${b}) and hsl(${h}, ${s}%, ${l}%). It is one of the 148 CSS named colors defined by the CSS Color Module Level 4.`],
    [
      `Is ${c.kw} light or dark?`,
      `${name} has a relative luminance of ${c.lum.toFixed(3)} on a 0–1 scale, so it is ${c.lum > 0.5 ? "a light" : "a dark"} color. Against white it scores ${c.onWhite.toFixed(2)}:1; against black, ${c.onBlack.toFixed(2)}:1.`,
    ],
    [
      `Can I use ${c.kw} for text?`,
      `${c.kw} reaches ${bestRatio.toFixed(2)}:1 against ${aa ? "white" : "black"}, which ${
        bestRatio >= 4.5
          ? "clears WCAG 2.2 AA for normal text (4.5:1) at any size"
          : bestRatio >= 3
            ? "clears AA only for large text (3:1) — body copy at 4.5:1 would fail"
            : "fails AA at every size: 4.5:1 is required for body text and 3:1 for large text"
      }.`,
    ],
  ];

  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#page`,
        url,
        name: `${c.hex} ${name} — hex code, RGB and HSL values`,
        description: `${name} is the CSS named color ${c.hex}: rgb(${r}, ${g}, ${b}), hsl(${h}, ${s}%, ${l}%). Contrast ${c.onWhite.toFixed(2)}:1 on white, ${c.onBlack.toFixed(2)}:1 on black.`,
        inLanguage: "en",
        isPartOf: { "@id": `${ORIGIN}/#website` },
        about: { "@type": "Thing", name: `${name} (CSS color)` },
        publisher: { "@id": `${ORIGIN}/#organization` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${ORIGIN}/` },
          { "@type": "ListItem", position: 2, name: "CSS colors", item: `${ORIGIN}/colors` },
          { "@type": "ListItem", position: 3, name, item: url },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faq.map(([q, a]) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      },
    ],
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${c.hex} ${name} — Hex Code, RGB &amp; HSL | ${BRAND}</title>
  <meta name="description" content="${name} is the CSS color ${c.hex}: rgb(${r}, ${g}, ${b}), hsl(${h}, ${s}%, ${l}%). Contrast ${c.onWhite.toFixed(2)}:1 on white and ${c.onBlack.toFixed(2)}:1 on black, with tints and shades.">
  <link rel="canonical" href="${url}">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="alternate" type="text/plain" href="/llms-full.txt" title="Full site content for AI agents">
  <style>${CSS}</style>
  <script type="application/ld+json">
${JSON.stringify(ld, null, 2)}
  </script>
</head>
<body>
  <div class="container">
    <nav>
      <a href="/index" class="logo">🎨 ${BRAND}</a>
      <div class="nav-links">
        <a href="/colors">All CSS colors</a>
        <a href="/blog">Blog</a>
      </div>
    </nav>

    <div class="breadcrumb">
      <a href="/index">Home</a> / <a href="/colors">CSS colors</a> / ${name}
    </div>

    <h1><span class="code">${c.hex}</span> — ${name}</h1>
    <p class="aeo-answer">${name} is the CSS named color <strong>${c.hex}</strong> — rgb(${r}, ${g}, ${b}), hsl(${h}, ${s}%, ${l}%). Its relative luminance is ${c.lum.toFixed(3)}, giving ${c.onWhite.toFixed(2)}:1 against white and ${c.onBlack.toFixed(2)}:1 against black, so ${bestRatio >= 4.5 ? "it works as a text color on " + (aa ? "white" : "black") : "it is best used as a surface rather than as text"}.</p>

    <div class="swatch" style="background:${c.hex}" role="img" aria-label="Swatch of ${name} ${c.hex}"></div>

    <h2>${name} in every notation</h2>
    <table>
      <tbody>
        <tr><th>HEX</th><td><code>${c.hex}</code></td></tr>
        <tr><th>RGB</th><td><code>rgb(${r}, ${g}, ${b})</code></td></tr>
        <tr><th>HSL</th><td><code>hsl(${h}, ${s}%, ${l}%)</code></td></tr>
        <tr><th>Relative luminance</th><td>${c.lum.toFixed(4)}</td></tr>
        <tr><th>Contrast on white</th><td>${c.onWhite.toFixed(2)}:1 <span class="${c.onWhite >= 4.5 ? "pass" : "fail"}">${c.onWhite >= 4.5 ? "AA pass" : c.onWhite >= 3 ? "large text only" : "AA fail"}</span></td></tr>
        <tr><th>Contrast on black</th><td>${c.onBlack.toFixed(2)}:1 <span class="${c.onBlack >= 4.5 ? "pass" : "fail"}">${c.onBlack >= 4.5 ? "AA pass" : c.onBlack >= 3 ? "large text only" : "AA fail"}</span></td></tr>
      </tbody>
    </table>

    <h2>Tints and shades of ${c.kw}</h2>
    <div class="ramp">
${c.ramp.map((x) => `      <figure><div class="chip" style="background:${x}"></div><figcaption>${x}</figcaption></figure>`).join("\n")}
    </div>
    <p>Built by mixing ${c.kw} toward white (four steps) and toward black (four steps) while keeping the hue. Use the <a href="/color-shades-generator">shades generator</a> for a different step count or to add harmony sets.</p>

    <h2>Similar CSS colors</h2>
    <div class="related">
${c.neighbors.map((n) => `      <a href="/colors/${n.kw}">${n.hex} ${displayName(n.kw)}</a>`).join("\n")}
    </div>
    <p>Closest by CIELAB distance (ΔE76). For perceptual matching in a design system, compare in OKLab before locking a token.</p>

    <div class="aeo-faq">
      <h2>Frequently asked questions</h2>
${faq.map(([q, a]) => `      <h3>${esc(q)}</h3>\n      <p>${esc(a)}</p>`).join("\n")}
    </div>

    <nav class="related" aria-label="Previous and next color">
      <a href="/colors/${prev.kw}">← ${prev.hex} ${displayName(prev.kw)}</a>
      <a href="/colors/${next.kw}">${next.hex} ${displayName(next.kw)} →</a>
    </nav>

    <footer>
      <p>© 2026 ${BRAND} · <a href="/index">Home</a> · <a href="/colors">All CSS colors</a> · <a href="/blog">Blog</a> · <a href="/about">About</a> · <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a> · <a href="/contact">Contact</a></p>
    </footer>
  </div>
</body>
</html>
`;
}

// ---------- hub page ----------
const FAMILIES = [
  ["Light / white", (c) => c.lum > 0.85],
  ["Grays", (c) => Math.max(...c.rgb) - Math.min(...c.rgb) < 12],
  ["Red / pink", (c) => (c.hsl[0] >= 330 || c.hsl[0] < 20) && c.lum <= 0.85],
  ["Orange / brown", (c) => c.hsl[0] >= 20 && c.hsl[0] < 55 && c.lum <= 0.85],
  ["Yellow / olive", (c) => c.hsl[0] >= 55 && c.hsl[0] < 75 && c.lum <= 0.85],
  ["Green", (c) => c.hsl[0] >= 75 && c.hsl[0] < 165 && c.lum <= 0.85],
  ["Cyan / teal", (c) => c.hsl[0] >= 165 && c.hsl[0] < 200 && c.lum <= 0.85],
  ["Blue", (c) => c.hsl[0] >= 200 && c.hsl[0] < 260 && c.lum <= 0.85],
  ["Purple / violet", (c) => c.hsl[0] >= 260 && c.hsl[0] < 330 && c.lum <= 0.85],
];

function hubPage() {
  const used = new Set();
  const sections = FAMILIES.map(([label, test]) => {
    const list = colors.filter((c) => !used.has(c.kw) && test(c));
    list.forEach((c) => used.add(c.kw));
    if (!list.length) return "";
    return `    <h2>${label} <span style="color:#94a3b8;font-weight:400;font-size:.9rem">(${list.length})</span></h2>
    <ul class="colorlist">
${list.map((c) => `      <li><a href="/colors/${c.kw}"><span class="dot" style="background:${c.hex}"></span><strong>${displayName(c.kw)}</strong><code>${c.hex}</code></a></li>`).join("\n")}
    </ul>`;
  }).join("\n");

  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${ORIGIN}/colors#page`,
        url: `${ORIGIN}/colors`,
        name: "All 148 CSS named colors — hex, RGB and HSL values",
        description: "A complete reference of the 148 CSS named colors with hex, RGB, HSL, contrast ratios, tints and shades.",
        inLanguage: "en",
        isPartOf: { "@id": `${ORIGIN}/#website` },
        publisher: { "@id": `${ORIGIN}/#organization` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${ORIGIN}/` },
          { "@type": "ListItem", position: 2, name: "CSS colors", item: `${ORIGIN}/colors` },
        ],
      },
    ],
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>All 148 CSS Named Colors — Hex, RGB &amp; HSL Reference | ${BRAND}</title>
  <meta name="description" content="Every CSS named color with its hex code, RGB and HSL values, contrast ratio on black and white, tints and shades. 148 keywords, searchable by name.">
  <link rel="canonical" href="${ORIGIN}/colors">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="alternate" type="text/plain" href="/llms-full.txt" title="Full site content for AI agents">
  <style>${CSS}
  .colorlist { list-style: none; display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 8px; }
  .colorlist a { display: flex; align-items: center; gap: 8px; text-decoration: none; color: var(--text);
    border: 1px solid var(--surface-light); border-radius: 8px; padding: 6px 10px; font-size: .9rem; }
  .colorlist a:hover { border-color: var(--accent); }
  .dot { width: 16px; height: 16px; border-radius: 4px; border: 1px solid rgba(255,255,255,.25); flex: 0 0 auto; }
  .colorlist code { margin-left: auto; color: var(--text-muted); font-size: .8rem; }
  </style>
  <script type="application/ld+json">
${JSON.stringify(ld, null, 2)}
  </script>
</head>
<body>
  <div class="container">
    <nav>
      <a href="/index" class="logo">🎨 ${BRAND}</a>
      <div class="nav-links">
        <a href="/color-names">Name finder</a>
        <a href="/contrast-checker">Contrast</a>
        <a href="/blog">Blog</a>
      </div>
    </nav>
    <div class="breadcrumb"><a href="/index">Home</a> / CSS colors</div>
    <h1>All 148 CSS named colors</h1>
    <p class="aeo-answer">CSS defines 148 named colors — keywords such as rebeccapurple, chartreuse, and lightgoldenrodyellow — each mapping to one exact sRGB value. Every entry below lists its hex code, RGB and HSL values, WCAG contrast on black and white, and a nine-step tint-and-shade ramp.</p>
    <p style="color:#94a3b8;margin-top:12px">Grouped by hue. Names are case-insensitive in CSS: <code>RebeccaPurple</code> and <code>rebeccapurple</code> are the same color.</p>
${sections}
    <footer>
      <p>© 2026 ${BRAND} · <a href="/index">Home</a> · <a href="/blog">Blog</a> · <a href="/about">About</a> · <a href="/contrast-checker">Contrast checker</a></p>
    </footer>
  </div>
</body>
</html>
`;
}

// ---------- write ----------
if (!DRY) {
  mkdirSync(join(ROOT, "colors"), { recursive: true });
  for (const c of colors) writeFileSync(join(ROOT, "colors", `${c.kw}.html`), page(c), "utf8");
  writeFileSync(join(ROOT, "colors.html"), hubPage(), "utf8");
  console.log(`wrote ${colors.length} color pages + colors.html`);
}

// ---------- sitemap ----------
{
  const smPath = join(ROOT, "sitemap.xml");
  let sm = readFileSync(smPath, "utf8");
  sm = sm.replace(/\n?  <!-- COLOR-PAGES-BEGIN -->[\s\S]*?<!-- COLOR-PAGES-END -->/g, "");
  const entries = colors
    .map(
      (c) => `    <url>
        <loc>${ORIGIN}/colors/${c.kw}</loc>
        <lastmod>2026-11-11</lastmod>
        <changefreq>yearly</changefreq>
        <priority>0.5</priority>
    </url>`
    )
    .join("\n");
  const block = `  <!-- COLOR-PAGES-BEGIN -->
${entries}
    <url>
        <loc>${ORIGIN}/colors</loc>
        <lastmod>2026-11-11</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>
  <!-- COLOR-PAGES-END -->
`;
  sm = sm.replace(/<\/urlset>/, `${block}</urlset>`);
  writeFileSync(smPath, sm, "utf8");
  console.log(`sitemap: ${(sm.match(/<loc>/g) || []).length} urls`);
}

// ---------- llms.txt ----------
{
  const p = join(ROOT, "llms.txt");
  let t = readFileSync(p, "utf8");
  t = t.replace(/\n## CSS colors[\s\S]*?(?=\n## |\s*$)/, "");
  const block = `
## CSS colors

- [All 148 CSS named colors](${ORIGIN}/colors): one page per keyword with hex, RGB, HSL, contrast ratios and a tint/shade ramp. Pattern: ${ORIGIN}/colors/{keyword}, e.g. ${ORIGIN}/colors/rebeccapurple, ${ORIGIN}/colors/chartreuse, ${ORIGIN}/colors/lightgoldenrodyellow.
`;
  t = t.replace(/\n## Optional/, `${block}\n## Optional`);
  writeFileSync(p, t, "utf8");
  console.log("llms.txt updated");
}
