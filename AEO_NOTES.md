# AEO layer — what was added and how to maintain it

This repository is a static site (no build step). The AI-citation work below is plain HTML
plus four small scripts in `tools/`. Everything is idempotent: re-running the scripts updates the
blocks they own instead of duplicating them.

## What changed

| Change | Where | Why |
|---|---|---|
| `llms.txt` | repo root → served at `/llms.txt` | Site description + curated index for ChatGPT / Claude / Perplexity. |
| `llms-full.txt` | repo root → served at `/llms-full.txt` | All 36 pages as one plain-text file, so an agent gets everything in one request. |
| Answer-first paragraph (`.aeo-answer`) | 13 tool pages + home page | A 40–60 word definition directly under the H1. This is the passage an assistant can quote on its own. |
| FAQ block + `FAQPage` JSON-LD | all 13 tool pages (43 questions) | Answers the "how do I…" / "what is…" prompts on-page; text and JSON-LD are generated from the same config, so they cannot drift. |
| `WebApplication` + `BreadcrumbList` JSON-LD | all 13 tool pages | Tells engines what each page *is* (a free tool, category, features), not just what it says. |
| `BlogPosting` + `BreadcrumbList` JSON-LD | all 16 blog posts | `datePublished` / `dateModified`, author, publisher, `citation` on the WCAG article. |
| Visible byline with `<time datetime>` | all 16 blog posts | The page already showed "Nov 8, 2026" as plain text; now it is machine-readable and has an author. |
| `Organization` + `WebApplication` graph | home page (legacy `SoftwareApplication` block removed) | Establishes the brand entity that other snippets reference by `@id`. |
| `AboutPage` + `Organization` | new `about.html` | E-E-A-T needs a real place to point at. Linked from every footer and every byline. |
| `<link rel="alternate" type="text/plain" href="/llms-full.txt">` | every page `<head>` | Agents find `llms.txt` / `llms-full.txt` by following links far more often than by guessing paths. |
| Footer added to 5 tool pages | `color-mixer`, `color-shades-generator`, `color-temperature`, `random-color-generator`, `text-color-generator` | Those pages shipped no footer at all, so they had no internal links back into the site. |
| `sitemap.xml` | 36 URLs, `lastmod` 2026-11-11 | New `/about` entry, refreshed dates. |

## Author identity (already set)

`tools/aeo-config.mjs` holds the identity used everywhere:

```js
export const AUTHOR = "Yao Xiangqian";
export const AUTHOR_ROLE = "Design-systems developer and maintainer of HexColor Pro";
export const AUTHOR_PROFILES = ["https://github.com/yxq1337"];
```

Changing `AUTHOR` and re-running `apply-aeo.mjs` updates blog bylines, `BlogPosting.author`,
`Organization.founder`, and the home-page entity in one pass. The About page carries the same name in
its visible copy and its `Person` node — if you rename there, update `about.html` too (it is hand-written
so it does not get overwritten by the script).

The Background section of `about.html` states the credential the schema also carries:

> …behind it sit ten years of design-system work: component libraries and color systems where a token that
> fails contrast is a bug, not a taste difference.

Keep that sentence true. If the number changes, update it in three places: the visible paragraph,
`Person.description` in `about.html`, and `AUTHOR_ROLE` / `Person.knowsAbout` expectations.

Still worth adding when you have them:

1. **More `sameAs` profiles.** Right now only GitHub is listed. Adding X, Product Hunt, Dev.to, Uneed or
   AlternativeTo gives engines more places to confirm the same entity.
2. **Dates.** Blog `datePublished` values are parsed from each post's visible `.meta` date — no dates were
   invented. If a post went live earlier, fix the visible date and re-run; the schema follows it.
3. **A representative project** (optional). Naming one real design system or component library you built
   would strengthen the E-E-A-T claim further — omit it rather than invent one.

## Scripts

```bash
# 1. inject/refresh schema, answer blocks, FAQs, bylines, footers
node tools/apply-aeo.mjs .

# 2. check JSON-LD parses and the AEO invariants hold
node tools/validate-aeo.mjs .

# 3. regenerate llms-full.txt after content edits
node tools/gen-llms-full.mjs .

# 4. regenerate the 148 CSS named-color pages + hub, and sync sitemap/llms.txt
node tools/gen-color-pages.mjs .
#    dry run (prints the 148 display names, writes nothing):
node tools/gen-color-pages.mjs . --dry

# 5. crawl the 100-site sample and rebuild the study article
node tools/brand-contrast-study.mjs .   # writes data/*.csv + data/*.json
node tools/gen-study-article.mjs .      # rebuilds blog/brand-accent-contrast-study-2026.html

# 6. local preview with Cloudflare-Pages-style clean URLs
node tools/serve.mjs "$PWD" 4173     # pass an absolute path: the runtime changes cwd
```

(On this machine `node` is the harness runtime: set `ELECTRON_RUN_AS_NODE=1` and run
`"<DeepSeek Harness>.exe" tools/apply-aeo.mjs .`; any Node 20+ works the same.)

## Adding a new tool page

1. Add the answer sentence to `TOOL_ANSWERS` and the features to `TOOL_META` in `tools/aeo-config.mjs`.
2. Add it to `TOOLS` in `tools/gen-llms-full.mjs` and to `llms.txt`.
3. Add it to `sitemap.xml`.
4. Run `apply-aeo.mjs` and `validate-aeo.mjs`.

## Tool pages, color pages, embed (v2)

| Addition | Where | Notes |
|---|---|---|
| 148 CSS named-color pages | `colors/<keyword>.html`, hub at `colors.html` → `/colors` | Generated from `data/css-named-colors.json`. Each page has hex/RGB/HSL, relative luminance, WCAG contrast on black and white, a 9-step tint-and-shade ramp, 3 nearest colors by ΔE76, 3 FAQs, and `WebPage` + `BreadcrumbList` + `FAQPage` JSON-LD. Regenerate with `tools/gen-color-pages.mjs`. |
| Embeddable widget | `embed/contrast-checker.html` → `/embed/contrast-checker` | `noindex` on purpose; self-contained light-theme widget, ~6 KB, no ads, attribution link back to `/contrast-checker`. |
| Embed landing page | `embed.html` → `/embed` | Live preview + copy-paste iframe snippet. This is the link-building asset. |
| Ad CLS fix | `ads.js` | Space is reserved at DOM-ready from the unit dimensions (`min-height`), and the Adsterra script is only fetched after `load` + `requestIdleCallback`. Ads also skip on `saveData` / 2G. Renders each slot once. |

**Why the color pages are not "scaled content abuse":** the set is bounded at 148 (the size of the CSS
keyword list), it is reference data rather than paraphrased prose, every page carries unique computed
values, and each has FAQ answers that differ in their numbers. Do **not** extend this pattern to arbitrary
hex values — 16.7M generated pages is exactly what Google's spam policy targets.

## Original research (the link-building asset)

`tools/brand-contrast-study.mjs` fetches ~96 well-known homepages, extracts the dominant accent colour
from declared CSS (plus `theme-color`, weighted ×6), and measures WCAG 2.2 contrast against white and
black text. Output: `data/brand-contrast-study.csv` (per site) and `data/brand-contrast-study.json`
(aggregates). `tools/gen-study-article.mjs` renders `blog/brand-accent-contrast-study-2026.html` from
that JSON, so every number in the article is generated rather than typed.

Latest run (2026-11-11): 70 of 96 sites measured, 26 dropped (HTTP 403/429 bot protection, image-only
colour, or no chromatic declaration). **37.1% of accents fail WCAG AA with white text**, 14 fail even
3:1, and 0 fail with both white and black.

`_headers` sets `text/csv` for `/data/*.csv` and `text/plain` for the llms files on Cloudflare Pages.

Guardrails if you re-run it: keep the UA honest, keep concurrency at ~5, do not publish per-domain
failures as claims about a brand — the CSV is a measurement of one CSS token, and the article says so.

## Verification performed

- 182 JSON-LD blocks across 184 pages parse as valid JSON (`FAQPage` × 161, 487 Q&A).
- All public pages carry the `llms-full.txt` alternate link; BlogPosting/WebApplication/WebPage nodes all
  reference the same `#organization` entity.
- All 16 blog posts expose `<time datetime="…">` and a byline naming the maintainer.
- 148/148 color pages carry a `FAQPage`; hub page lists all 148 grouped by hue.
- `apply-aeo.mjs` is idempotent: a second run changes 0 bytes.
- `llms.txt` (6 KB) and `llms-full.txt` (430 KB, 186 pages) served as `text/plain`.
- Local serve: `/colors`, `/colors/rebeccapurple`, `/colors/lightgoldenrodyellow`, `/embed`,
  `/embed/contrast-checker`, `/llms-full.txt`, `/sitemap.xml` all `200`.

## Not done here (deliberately)

- No changes to `robots.txt` beyond what was already there: `User-agent: *` + `Allow: /` is the correct
  default, and an allowlist of named AI crawlers would quietly exclude agent search APIs.
- No third-party presence work (directories, Reddit, Product Hunt, Dev.to). That is marketing, not code,
  and it is what earns *recommendations* rather than citations.
- No custom domain migration. `*.pages.dev` cannot carry a brand entity long term.
