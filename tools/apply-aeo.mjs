// Inject the AI-citation (AEO) layer into the static site.
// Idempotent: re-running only rewrites the blocks it owns (marked with AEO:*).
//
// Usage: ELECTRON_RUN_AS_NODE=1 "<DeepSeek Harness.exe>" tools/apply-aeo.mjs .
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ORIGIN, BRAND, AUTHOR, AUTHOR_ROLE, AUTHOR_PROFILES, TOOL_ANSWERS, TOOL_FAQS, TOOL_META, BLOG_SCHEMA_EXTRA } from "./aeo-config.mjs";

const ROOT = process.argv[2] ?? ".";
const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };

const STYLE = `
  /* AEO blocks: answer-first paragraph + FAQ */
  .aeo-answer {
    margin: 18px 0 0; padding: 18px 20px; border-left: 3px solid var(--accent, #6366f1);
    background: rgba(99, 102, 241, 0.08); border-radius: 8px;
    color: #e2e8f0; font-size: 1.02rem; line-height: 1.65; text-align: left;
  }
  .aeo-faq { margin-top: 28px; }
  .aeo-faq h2 { font-size: 1.3rem; margin-bottom: 16px; }
  .aeo-faq h3 { font-size: 1.02rem; margin: 18px 0 6px; color: #f1f5f9; }
  .aeo-faq p { color: #cbd5e1; font-size: 0.97rem; }
  .aeo-source { color: #94a3b8; font-size: 0.85rem; margin-top: 8px; }
`;

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const ld = (obj) => `<script type="application/ld+json">\n${JSON.stringify(obj, null, 2)}\n</script>`;

function read(p) {
  return readFileSync(p, "utf8");
}
function save(p, s) {
  writeFileSync(p, s, "utf8");
}

function hasHeadLink(html) {
  return html.includes('href="/llms-full.txt"');
}
function addHead(html, toolPath = "") {
  let out = html;
  if (!out.includes("/* AEO blocks")) {
    out = out.replace("</style>", `</style>\n  <style>${STYLE}  </style>`);
  }
  if (!hasHeadLink(out)) {
    out = out.replace(
      "</head>",
      `  <link rel="alternate" type="text/plain" href="/llms-full.txt" title="Full site content for AI agents">\n</head>`
    );
  }
  if (!/rel="me"/.test(out) && toolPath) {
    // no-op placeholder kept for clarity
  }
  return out;
}

function addLd(html, obj) {
  const block = ld(obj);
  if (html.includes(block.slice(0, 60))) return html;
  return html.replace("</head>", `${block}\n</head>`);
}

// Remove the @graph blocks this script previously injected, so config changes
// (author name, FAQ copy, features) propagate instead of being skipped by the
// idempotency check. Original hand-written blocks are plain objects, not @graph.
function stripAeoLd(html) {
  return html.replace(
    /<script type="application\/ld\+json">\s*\{\s*"@context": "https:\/\/schema\.org",\s*"@graph": \[[\s\S]*?<\/script>\n?/g,
    ""
  );
}

function breadcrumb(items) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: ORIGIN + it.path })),
  };
}

// ---------- tool pages ----------
const toolFiles = readdirSync(ROOT).filter((f) => {
  if (!f.endsWith(".html")) return false;
  const slug = f.replace(/\.html$/, "");
  return Boolean(TOOL_ANSWERS[slug]);
});

for (const f of toolFiles) {
  const p = join(ROOT, f);
  const slug = f.replace(/\.html$/, "");
  let html = stripAeoLd(read(p));
  const canonical = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1] || `${ORIGIN}/${slug}`;
  const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1]?.replace(/<[^>]+>/g, "").trim() || slug;
  const desc = (html.match(/<meta name="description" content="([^"]+)"/) || [])[1] || "";
  const meta = TOOL_META[slug] || { features: [] };

  html = addHead(html);

  const app = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${canonical}#app`,
        name: h1,
        url: canonical,
        description: desc,
        applicationCategory: "DesignApplication",
        operatingSystem: "Any modern web browser",
        browserRequirements: "Requires JavaScript",
        isAccessibleForFree: true,
        inLanguage: "en",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        featureList: meta.features,
        publisher: { "@id": `${ORIGIN}/#organization` },
      },
      breadcrumb([
        { name: "Home", path: "/" },
        { name: h1, path: `/${slug}` },
      ]),
    ],
  };

  const faq = TOOL_FAQS[slug];
  if (faq) {
    app["@graph"].push({
      "@type": "FAQPage",
      mainEntity: faq.map(([q, a]) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    });
  }
  html = addLd(html, app);

  // answer block inside the page header (right under the H1 + subtitle)
  if (!html.includes("<!-- AEO:answer -->")) {
    const answer = `<!-- AEO:answer -->\n        <p class="aeo-answer">${esc(TOOL_ANSWERS[slug])}</p>`;
    const m = html.match(/<div class="page-header">[\s\S]*?<\/div>/);
    if (m) {
      html = html.replace(m[0], m[0].replace(/<\/div>$/, `  ${answer}\n      </div>`));
    }
  }

  // FAQ section before the footer
  if (faq && !html.includes("<!-- AEO:faq -->")) {
    const items = faq
      .map(([q, a]) => `        <h3>${esc(q)}</h3>\n        <p>${esc(a)}</p>`)
      .join("\n");
    const block = `    <div class="aeo-faq">\n      <!-- AEO:faq -->\n      <h2>Frequently asked questions</h2>\n${items}\n    </div>\n\n    `;
    html = html.replace(/<footer>/, `${block}<footer>`);
  }

  // footer: About link + last-updated line
  if (!html.includes("<!-- AEO:about -->")) {
    html = html.replace(
      /(<a href="contact">Contact<\/a>)/,
      `$1 · <a href="about">About</a><!-- AEO:about -->`
    );
  }

  save(p, html);
  console.log(`tool  ${f}`);
}

// tool pages that ship no <footer>: add one, then the About link
for (const f of toolFiles) {
  const p = join(ROOT, f);
  let html = read(p);
  if (/<footer[\s>]/.test(html) && html.includes("<!-- AEO:about -->")) continue;
  if (!/<footer[\s>]/.test(html)) {
    const footer = `    <footer>\n      <!-- AEO:footer -->\n      <p>© 2026 ${BRAND} · <a href="index">Home</a> · <a href="blog">Blog</a> · <a href="about">About</a> · <a href="privacy">Privacy</a> · <a href="terms">Terms</a> · <a href="contact">Contact</a></p>\n    </footer>\n\n  `;
    html = html.replace(/(<script src="ads\.js)/, `${footer}$1`);
  }
  if (!html.includes("<!-- AEO:about -->")) {
    if (/<a href="contact">Contact<\/a>/.test(html)) {
      html = html.replace(/(<a href="contact">Contact<\/a>)/, `$1 · <a href="about">About</a><!-- AEO:about -->`);
    } else if (html.includes("<!-- AEO:footer -->")) {
      html = html.replace("<!-- AEO:footer -->", "<!-- AEO:about -->");
    }
  }
  save(p, html);
  console.log(`tool  ${f} (footer/about)`);
}

// ---------- blog posts ----------
const blogDir = join(ROOT, "blog");
for (const f of readdirSync(blogDir).filter((x) => x.endsWith(".html"))) {
  const p = join(blogDir, f);
  const slug = f.replace(/\.html$/, "");
  let html = stripAeoLd(read(p));
  const canonical = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1] || `${ORIGIN}/blog/${slug}`;
  const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1]?.replace(/<[^>]+>/g, "").trim() || slug;
  const desc = (html.match(/<meta name="description" content="([^"]+)"/) || [])[1] || "";
  const metaLine = (html.match(/<div class="meta">([\s\S]*?)<\/div>/) || [])[1] || "";
  const dm = metaLine.match(/([A-Z][a-z]{2})[a-z]*\s+(\d{1,2}),\s+(\d{4})/);
  let iso = null;
  if (dm && MONTHS[dm[1]] !== undefined) {
    const m = String(MONTHS[dm[1]] + 1).padStart(2, "0");
    iso = `${dm[3]}-${m}-${String(dm[2]).padStart(2, "0")}`;
  }

  html = addHead(html);

  // byline: author + machine-readable date, keeping the rest of the meta line
  if (html.includes("<!-- AEO:byline -->")) {
    // already present: refresh the author name when the config changes
    html = html.replace(/(<!-- AEO:byline -->By <a href="\.\.\/about">)[^<]*(<\/a>)/, `$1${AUTHOR}$2`);
  } else if (iso) {
    const rest = metaLine
      .replace(dm[0], "")
      .replace(/^[\s·]+/, "")
      .trim();
    const newMeta = `<!-- AEO:byline -->By <a href="../about">${AUTHOR}</a> · <time datetime="${iso}">${dm[0]}</time>${rest ? ` · ${rest}` : ""}`;
    html = html.replace(/<div class="meta">[\s\S]*?<\/div>/, `<div class="meta">${newMeta}</div>`);
  }

  const extra = BLOG_SCHEMA_EXTRA[slug] || {};
  const graph = [
    {
      "@type": "BlogPosting",
      "@id": `${canonical}#article`,
      headline: h1,
      description: desc,
      url: canonical,
      mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
      inLanguage: "en",
      isAccessibleForFree: true,
      datePublished: iso || undefined,
      dateModified: iso || undefined,
      author: {
        "@type": "Person",
        name: AUTHOR,
        url: `${ORIGIN}/about`,
        jobTitle: AUTHOR_ROLE,
        sameAs: AUTHOR_PROFILES,
      },
      publisher: { "@id": `${ORIGIN}/#organization` },
      image: `${ORIGIN}/assets/og-image.png`,
    },
    breadcrumb([
      { name: "Home", path: "/" },
      { name: "Blog", path: "/blog" },
      { name: h1, path: `/blog/${slug}` },
    ]),
  ];
  if (extra.about) graph[0].about = extra.about.map((n) => ({ "@type": "Thing", name: n }));
  if (extra.citation) {
    graph[0].citation = {
      "@type": "CreativeWork",
      name: extra.citation.name,
      url: extra.citation.url,
      author: { "@type": "Organization", name: extra.citation.author },
      datePublished: extra.citation.datePublished,
    };
  }
  html = addLd(html, { "@context": "https://schema.org", "@graph": graph });

  if (!html.includes("<!-- AEO:about -->")) {
    html = html.replace(/(<a href="\.\.\/contact">Contact<\/a>)/, `$1 · <a href="../about">About</a><!-- AEO:about -->`);
  }

  save(p, html);
  console.log(`blog  ${f} ${iso ?? "(no date)"}`);
}

// ---------- blog index ----------
{
  const p = join(ROOT, "blog.html");
  if (existsSync(p)) {
    let html = stripAeoLd(read(p));
    html = addHead(html);
    html = addLd(html, {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          "@id": `${ORIGIN}/blog#page`,
          name: "Color Design Blog",
          url: `${ORIGIN}/blog`,
          description: "Articles on color theory, accessibility, palettes, and design systems from HexColor Pro.",
          inLanguage: "en",
          isPartOf: { "@id": `${ORIGIN}/#website` },
          publisher: { "@id": `${ORIGIN}/#organization` },
        },
        breadcrumb([
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
        ]),
      ],
    });
    if (!html.includes("<!-- AEO:about -->")) {
      html = html.replace(/(<a href="contact">Contact<\/a>)/, `$1 · <a href="about">About</a><!-- AEO:about -->`);
    }
    save(p, html);
    console.log("page  blog.html");
  }
}

// ---------- home page ----------
{
  const p = join(ROOT, "index.html");
  let html = stripAeoLd(read(p));
  html = addHead(html);
  html = addLd(html, {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${ORIGIN}/#organization`,
        name: BRAND,
        url: `${ORIGIN}/`,
        description:
          "Free browser-based color tools for designers and developers: color picker, gradient generator, WCAG contrast checker, palette generator, and color converters.",
        logo: { "@type": "ImageObject", url: `${ORIGIN}/assets/favicon.svg` },
        founder: {
          "@type": "Person",
          name: AUTHOR,
          url: `${ORIGIN}/about`,
          jobTitle: AUTHOR_ROLE,
          sameAs: AUTHOR_PROFILES,
        },
        sameAs: AUTHOR_PROFILES,
      },
      {
        "@type": "WebApplication",
        "@id": `${ORIGIN}/#app`,
        name: BRAND,
        url: `${ORIGIN}/`,
        applicationCategory: "DesignApplication",
        operatingSystem: "Any modern web browser",
        isAccessibleForFree: true,
        inLanguage: "en",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        featureList: [
          "13 free color tools: picker, gradients, contrast, palettes, converters",
          "Runs client-side in the browser with no account",
          "Copy HEX, RGB, HSL, HSV, and CMYK values",
        ],
        publisher: { "@id": `${ORIGIN}/#organization` },
      },
    ],
  });
  if (!html.includes("<!-- AEO:answer -->")) {
    html = html.replace(
      /<\/header>/,
      `      <p class="aeo-answer" style="margin-top:16px">HexColor Pro is a free color toolkit for designers and developers: pick colors, generate CSS gradients and palettes, check WCAG contrast, convert HEX to RGB, HSL, or CMYK, and look up color names. All 13 tools run in the browser — no signup, no install, no usage limit.</p>\n    </header><!-- AEO:answer -->`
    );
  }
  if (!html.includes("<!-- AEO:about -->")) {
    html = html.replace(/(<a href="contact">Contact<\/a>)/, `$1 · <a href="about">About</a><!-- AEO:about -->`);
  }
  save(p, html);
  console.log("page  index.html");
}

// ---------- remaining pages (guide, privacy, terms, contact, and tool pages without a footer) ----------
const handled = new Set([...toolFiles, "index.html", "blog.html"]);
for (const f of readdirSync(ROOT).filter((x) => x.endsWith(".html"))) {
  if (handled.has(f) || f === "404.html") continue;
  const p = join(ROOT, f);
  let html = read(p);
  html = addHead(html);

  // pages that ship no footer at all: append one, so internal links (incl. About) exist
  if (!/<footer[\s>]/.test(html) && !html.includes("<!-- AEO:footer -->")) {
    const footer = `  <footer>\n    <!-- AEO:footer -->\n    <p>© 2026 ${BRAND} · <a href="index">Home</a> · <a href="blog">Blog</a> · <a href="about">About</a> · <a href="privacy">Privacy</a> · <a href="terms">Terms</a> · <a href="contact">Contact</a></p>\n  </footer>\n\n  `;
    html = html.replace(/(<script src="ads\.js)/, `${footer}$1`);
  }

  if (!html.includes("<!-- AEO:about -->")) {
    if (/<a href="contact">Contact<\/a>/.test(html)) {
      html = html.replace(/(<a href="contact">Contact<\/a>)/, `$1 · <a href="about">About</a><!-- AEO:about -->`);
    } else if (html.includes("<!-- AEO:footer -->")) {
      html = html.replace("<!-- AEO:footer -->", "<!-- AEO:about -->");
    }
  }

  save(p, html);
  console.log(`page  ${f}`);
}

// ---------- de-duplicate the legacy SoftwareApplication block on the home page ----------
{
  const p = join(ROOT, "index.html");
  let html = read(p);
  const before = (html.match(/application\/ld\+json/g) || []).length;
  html = html.replace(
    /<script type="application\/ld\+json">\s*\{\s*"@context": "https:\/\/schema\.org",\s*"@type": "SoftwareApplication"[\s\S]*?<\/script>\s*/,
    ""
  );
  const after = (html.match(/application\/ld\+json/g) || []).length;
  if (after !== before) {
    save(p, html);
    console.log(`index.html: removed legacy SoftwareApplication block (${before} -> ${after})`);
  }
}
