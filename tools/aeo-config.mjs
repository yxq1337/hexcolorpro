// Copy + schema config for the AI-citation (AEO) layer.
// Every entry here is rendered into the static HTML by tools/apply-aeo.mjs.

export const ORIGIN = "https://hexcolorpro.pages.dev";
export const BRAND = "HexColor Pro";
// Site maintainer: appears in blog bylines, BlogPosting.author, Organization.founder
// and the About page. Change it here and re-run tools/apply-aeo.mjs.
export const AUTHOR = "Yao Xiangqian";
export const AUTHOR_ROLE = "Design-systems developer and maintainer of HexColor Pro";
export const AUTHOR_PROFILES = ["https://github.com/yxq1337"];

// Answer-first definition blocks (40-60 words) placed directly under the H1.
export const TOOL_ANSWERS = {
  "color-picker":
    "A color picker lets you choose a color visually or by typing a code, then copy it in any format you need. HexColor Pro returns HEX, RGB, HSL, HSV, and CMYK for the same color and updates every field the moment you edit one of them.",
  "gradient-generator":
    "A CSS gradient generator turns a set of color stops into a linear, radial, or conic gradient and writes the CSS for you. In HexColor Pro you add or move stops, watch the result live, and copy the finished background declaration — it stays pure CSS, so it scales without image files.",
  "contrast-checker":
    "The WCAG contrast ratio measures the luminance difference between text and its background on a scale from 1:1 to 21:1. WCAG 2.2 Level AA requires 4.5:1 for normal text and 3:1 for large text; Level AAA raises those thresholds to 7:1 and 4.5:1.",
  "palette-generator":
    "A palette generator derives colors that work together from a single base color. HexColor Pro applies seven harmony rules — complementary, analogous, triadic, split-complementary, tetradic, monochromatic, and shades — and returns ready-to-copy HEX values for each palette.",
  "color-schemes":
    "A color scheme generator applies classical color-wheel relationships to one base color: complementary sits opposite it, analogous beside it, triadic at 120° intervals. HexColor Pro shows six of these schemes side by side so you can compare them before copying any HEX code.",
  "color-converter":
    "HEX is a six-digit hexadecimal notation for sRGB color — #RRGGBB, where each pair runs from 00 to FF. RGB states the same color as three decimal channels, HSL restates it as hue, saturation, and lightness, and CMYK describes it for print. All four describe one color in different notations.",
  "color-names":
    "A color name finder matches a hex code to the closest named color. HexColor Pro compares your value against a database of 600+ named colors, including the CSS named colors, and returns the nearest match with its name, hex, and RGB values.",
  "shadow-generator":
    "A box-shadow generator builds the CSS box-shadow property from four parameters — offset X, offset Y, blur, and spread — plus a color. HexColor Pro previews the shadow live, including the inset variant, and copies the finished declaration in one click.",
  "random-color-generator":
    "A random color generator produces a color with no input or seed. HexColor Pro returns the HEX, RGB, and HSL values for every result, and can generate a whole random palette when you need several colors at once.",
  "color-mixer":
    "A color mixer blends two colors at a chosen ratio and reports the result. HexColor Pro interpolates channel by channel — a 50/50 mix lands halfway in RGB — and shows the intermediate steps, which makes it easy to build a smooth ramp between two brand colors.",
  "color-shades-generator":
    "A shades generator derives tints (mixed toward white) and shades (mixed toward black) from a base color, usually as a stepped ramp. HexColor Pro outputs the full ramp plus harmony sets, so one token can produce hover, active, and disabled states that stay in step.",
  "color-temperature":
    "Color temperature converts a Kelvin value into an RGB or HEX color, based on the light a black body emits at that temperature: roughly 1,000K reads as candlelight, 6,500K as daylight, and 10,000K as clear blue sky. HexColor Pro maps Kelvin to hex for lighting and UI references.",
  "text-color-generator":
    "A text color generator picks the most readable text color for a given background. HexColor Pro tests light and dark candidates against the background, returns the pair with the highest contrast ratio, and reports whether that pair clears the WCAG AA threshold.",
};

// FAQ sets (rendered on-page + as FAQPage JSON-LD so the two can never drift).
export const TOOL_FAQS = {
  "contrast-checker": [
    [
      "What is a good contrast ratio for body text?",
      "For body text, aim for at least 4.5:1, the WCAG 2.2 AA minimum for normal-size text. Many accessibility teams target 7:1 for long-form reading. A ratio of 3:1 is not enough for paragraph text — it only satisfies the large-text and UI-component rules.",
    ],
    [
      "Does a 4.5:1 ratio apply to buttons and borders?",
      "No. Buttons, borders, icons, and other essential UI graphics fall under WCAG 1.4.11, which requires 3:1 against adjacent colors. The 4.5:1 requirement in 1.4.3 covers text; large text may use 3:1.",
    ],
    [
      "Is contrast ratio always the same as perceived readability?",
      "Close, but not identical. The ratio uses relative luminance and ignores font weight, letter spacing, and ambient light. A 4.5:1 pair in a thin 12px typeface can read worse than a 4:1 pair in a heavy 20px one, so treat the minimum as a floor.",
    ],
    [
      "Why does black on white score 21:1 and not 100:1?",
      "The scale is capped by the formula (L1 + 0.05) / (L2 + 0.05). With black at luminance 0 and white at 1, the result is 1.05 / 0.05 = 21. There is no higher value in WCAG, which is why 21:1 is the practical maximum.",
    ],
    [
      "Do transparency and opacity affect the ratio?",
      "Yes. WCAG is evaluated on the final rendered colors, so a 60% opaque overlay over a background must be resolved to one solid color first. Blend the alpha channel over the layer beneath it, then test the resulting pair.",
    ],
  ],
  "color-converter": [
    [
      "Is HEX the same as RGB?",
      "Yes — they are two encodings of the same sRGB value. #FF0000 and rgb(255, 0, 0) are identical, since hex FF is decimal 255. Converting between them is exact arithmetic with no color shift.",
    ],
    [
      "Why does CMYK look different from RGB?",
      "CMYK is a subtractive ink model tied to a specific printer and paper, while RGB is an additive light model tied to a screen. A conversion gives a mathematical match, not a visual one, so proof print-critical colors against the actual press profile.",
    ],
    [
      "What is HSV used for if HSL exists?",
      "HSV and HSL describe the same color family with different axes. HSV keeps full saturation at the top of its value axis, which suits pickers and scrubbing, while HSL's lightness axis maps more directly onto mixing a color with white or black in CSS.",
    ],
    [
      "Does converting HEX to HSL lose precision?",
      "No. Both are three-channel encodings of the same sRGB value, so the conversion itself is lossless. Rounding only appears in the displayed numbers, which are usually shown as whole percentages for readability.",
    ],
  ],
  "color-picker": [
    [
      "What is a hex color code?",
      "A hex code is a six-digit hexadecimal notation for an sRGB color, written #RRGGBB. Each pair runs from 00 to FF, so #FF0000 means red 255, green 0, blue 0. Three-digit shorthand such as #F00 expands to #FF0000.",
    ],
    [
      "How many colors can a color picker represent?",
      "An 8-bit-per-channel picker covers 256 × 256 × 256 = 16,777,216 colors, usually written as 16.7 million. Adding an alpha channel multiplies that by 256 for transparency levels.",
    ],
    [
      "Should I use HEX or HSL in CSS?",
      "Both are valid. HEX is compact and universally supported; HSL is easier to reason about when you need lighter, darker, or desaturated variants of one hue. Pick one convention per project and convert only when you need to share a value.",
    ],
    [
      "Why do the same HEX values look different on my phone?",
      "Screens differ in gamma, white point, calibration, and brightness, so identical codes render differently. Check critical colors on a calibrated display, and never judge contrast by eye alone — measure the ratio instead.",
    ],
  ],
  "gradient-generator": [
    [
      "What is the difference between linear, radial, and conic gradients?",
      "Linear blends colors along a straight line at a set angle, radial blends outward from a center point, and conic sweeps colors around a center like a clock face. CSS exposes them as linear-gradient(), radial-gradient(), and conic-gradient(), all supported in current browsers.",
    ],
    [
      "How many color stops should a gradient have?",
      "Two stops are the minimum and stay predictable across browsers; three or four let you control the midpoint. Past about six stops a gradient starts to band on 8-bit displays, so add noise or interpolate in a wider color space instead of adding more stops.",
    ],
    [
      "Why does my gradient look banded?",
      "Banding comes from 8-bit color steps: a slow transition between similar colors shows visible stripes. Shorten the transition distance, add a subtle noise overlay, or interpolate in a wider color space such as oklab with CSS color interpolation.",
    ],
  ],
  "palette-generator": [
    [
      "What makes a color palette harmonious?",
      "Harmony comes from a consistent relationship on the color wheel plus a deliberate contrast budget. Complementary, analogous, and triadic schemes each fix one kind of relationship; a usable palette then adds one accent and enough lightness separation for text and UI states.",
    ],
    [
      "How many colors should a website palette have?",
      "Most production interfaces settle on five to seven: one or two neutrals for surfaces and text, one primary, one accent, and one or two semantic colors for success and error. A larger token set is fine, but the visible colors on one screen stay small.",
    ],
    [
      "What is the 60-30-10 rule?",
      "It is a proportion guideline: 60% of the visual area in a dominant color, 30% in a secondary, 10% in an accent. It keeps a palette from feeling evenly weighted, and it maps cleanly onto CSS custom properties for background, surface, and accent.",
    ],
  ],
  "color-schemes": [
    [
      "What are the classic color schemes?",
      "Complementary (opposite on the wheel), analogous (adjacent), triadic (three colors evenly spaced), split-complementary (opposite plus its two neighbors), tetradic (two complementary pairs), and monochromatic (one hue at several lightness levels).",
    ],
    [
      "Which color scheme is best for a website?",
      "Analogous and monochromatic schemes read as calm and are easiest to keep accessible; complementary and triadic give stronger contrast but need more discipline. Most sites use one dominant scheme plus a complementary accent rather than a pure scheme throughout.",
    ],
    [
      "Do color schemes work the same in dark mode?",
      "No. Dark surfaces change perceived saturation and contrast: the same hue looks brighter against #0f172a than against white. Re-derive lightness for the dark theme and re-check contrast ratios instead of reusing the light-mode hex values.",
    ],
  ],
  "color-names": [
    [
      "What is the difference between a named color and a hex code?",
      "A named color is a human label mapped to a specific value — CSS defines 148 keywords such as rebeccapurple and tomato. A hex code is the exact value. Names help communication; hex guarantees the color.",
    ],
    [
      "How does a color name finder pick the nearest name?",
      "It converts both colors to a distance metric and returns the smallest. RGB distance is fast and common; perceptual spaces such as CIELAB or OKLab better match what the eye calls close, which matters for muted and dark colors.",
    ],
    [
      "Why does my hex code have no exact name?",
      "Named colors cover a few hundred specific values out of the 16.7 million possible hex codes, so almost every code falls between two names. The nearest-name match is an approximation, not an identity.",
    ],
  ],
  "shadow-generator": [
    [
      "What do the four box-shadow values mean?",
      "offset-x and offset-y move the shadow, blur-radius softens its edge, and spread-radius grows or shrinks the shadow before blurring. Positive spread expands it, negative spread contracts it. An optional inset keyword draws the shadow inside the element.",
    ],
    [
      "Why does my CSS shadow look cheap?",
      "Usually too much opacity and too little blur. Real light produces soft, low-contrast shadows: opacity around 0.08–0.15 with a large blur and a slight vertical offset reads as natural, while pure black at 0.5 reads as a sticker.",
    ],
    [
      "Can I layer multiple shadows?",
      "Yes. box-shadow accepts a comma-separated list, and layering two or three shadows — a tight contact shadow plus a wide ambient one — is the usual way to get realistic elevation without filters.",
    ],
  ],
  "random-color-generator": [
    [
      "Is a random color generator truly random?",
      "It uses the browser's pseudo-random number generator (Math.random or crypto.getRandomValues), which is unpredictable in practice but not suitable for secrets. For design work the difference does not matter.",
    ],
    [
      "What is the difference between a random color and a random palette?",
      "A random color is one value drawn from the 16.7 million hex space, so it is usually saturated and rarely usable in UI. A random palette constrains hue, saturation, and lightness to keep the set coherent.",
    ],
    [
      "How do I reproduce a random color later?",
      "You cannot reproduce a value drawn from an unseeded generator. If you need repeatability, record the hex code, or use a seeded generator so the same seed always yields the same sequence.",
    ],
  ],
  "color-mixer": [
    [
      "How is a color mix calculated?",
      "By interpolating each channel: mixing two colors at 50% gives ((R1+R2)/2, (G1+G2)/2, (B1+B2)/2) for an RGB mix. Mixing in a perceptual space such as OKLab instead produces a result closer to how the blend appears to the eye.",
    ],
    [
      "Why does mixing two colors give a muddy result?",
      "RGB mixing passes through desaturated midpoints, so mixing complementary hues lands near grey. That is a property of the color model, not a bug; add a third color, or mix in a perceptual space to keep chroma.",
    ],
    [
      "What is the difference between mixing light and mixing paint?",
      "Light is additive: red plus green gives yellow. Paint is subtractive: red plus green gives a dark brown. Screens mix light, so an RGB mixer follows the additive rule.",
    ],
  ],
  "color-shades-generator": [
    [
      "What is the difference between tints, shades, and tones?",
      "A tint mixes the base color with white, a shade mixes it with black, and a tone mixes it with grey. Tints step toward pastel, shades toward deep and dark, tones toward muted.",
    ],
    [
      "How many steps should a color ramp have?",
      "Ten steps is the usual default because it maps cleanly onto 50–900 token naming. Fewer than five gives too little control over hover and disabled states; more than twelve rarely earns its maintenance cost.",
    ],
    [
      "Should a shade ramp be linear in lightness?",
      "Not necessarily. Linear mixing in sRGB compresses perceived lightness at the dark end, so many design systems space the steps perceptually using OKLCH or HSL lightness, so that 500 and 600 look evenly separated.",
    ],
  ],
  "color-temperature": [
    [
      "What does color temperature measure?",
      "It describes the color of light on the Kelvin scale, from about 1,800K for candlelight through 6,500K for daylight to over 10,000K for clear sky. Lower values read warm and orange, higher values cool and blue.",
    ],
    [
      "Why does 6,500K look different on my screen than in a photo?",
      "Camera white balance, display calibration, and surrounding colors all shift perception. The Kelvin value describes the light source objectively; it does not guarantee how a particular screen renders it.",
    ],
    [
      "How do I use color temperature in UI design?",
      "Use warm tints for calm, ambient surfaces and cool tints for technical or focus-heavy ones, and keep the shift consistent across a theme. Re-check contrast after shifting temperature, since luminance changes with it.",
    ],
  ],
  "text-color-generator": [
    [
      "How do I choose the best text color for a background?",
      "Pick the candidate that maximizes contrast ratio: black text on light backgrounds, white on dark, computed with the WCAG relative-luminance formula. Then verify the ratio clears 4.5:1 for body text rather than trusting the choice by eye.",
    ],
    [
      "Is black or white always the best choice?",
      "No. Near-black (#111827) and near-white (#f8fafc) usually read softer than the pure values and avoid the harsh edge pure black and white produce on large text areas. Both still need a measured contrast check.",
    ],
    [
      "What about text over images or gradients?",
      "Contrast is judged against the worst-case pixel behind each glyph. Add a scrim or solid overlay, or test the lightest and darkest regions separately; a single average value hides the failures.",
    ],
  ],
};

// Per-tool structured-data extras.
export const TOOL_META = {
  "color-picker": { features: ["Pick a color visually or by code", "Show HEX, RGB, HSL, HSV, and CMYK for one color", "Copy any format with one click"] },
  "gradient-generator": { features: ["Build linear, radial, and conic CSS gradients", "Add, move, and remove color stops", "Copy the finished CSS background declaration"] },
  "contrast-checker": { features: ["Compute the WCAG 2.2 contrast ratio for any two colors", "Show AA and AAA pass or fail for normal and large text", "Suggest adjustments that reach the target ratio"] },
  "palette-generator": { features: ["Generate seven palette types from one base color", "Preview complementary, analogous, triadic, and tetradic sets", "Copy HEX values for every swatch"] },
  "color-schemes": { features: ["Show six classical color harmony schemes at once", "Recalculate every scheme from a single base color", "Copy HEX codes per swatch"] },
  "color-converter": { features: ["Convert between HEX, RGB, HSL, HSV, and CMYK", "Edit any field and see the others update instantly", "Copy the value in the format you need"] },
  "color-names": { features: ["Match a hex code to the nearest named color", "Search 600+ named colors, including CSS names", "See name, hex, and RGB for each match"] },
  "shadow-generator": { features: ["Compose box-shadow from offset, blur, spread, and color", "Preview the shadow live, including inset", "Copy the CSS declaration"] },
  "random-color-generator": { features: ["Generate a random color on demand", "Get HEX, RGB, and HSL for every result", "Generate a random palette when you need several colors"] },
  "color-mixer": { features: ["Blend two colors at an adjustable ratio", "See the intermediate steps of the blend", "Copy the mixed HEX value"] },
  "color-shades-generator": { features: ["Derive a tint and shade ramp from a base color", "Generate harmony sets alongside the ramp", "Copy any step as HEX"] },
  "color-temperature": { features: ["Convert Kelvin to RGB and HEX", "Cover candlelight through daylight to blue sky", "Use the result for lighting and UI references"] },
  "text-color-generator": { features: ["Pick the most readable text color for a background", "Compare light and dark candidates by contrast ratio", "Report whether the pair passes WCAG AA"] },
};

// Blog post takeaways shown as a short, extractable summary at the top.
// Keyed by slug; only posts where a standalone summary is safe to assert.
export const BLOG_SCHEMA_EXTRA = {
  "wcag-contrast-ratio-guide": {
    about: ["Web Content Accessibility Guidelines", "Contrast ratio"],
    citation: { name: "Web Content Accessibility Guidelines (WCAG) 2.2", url: "https://www.w3.org/TR/WCAG22/", author: "W3C", datePublished: "2023-10-05" },
  },
  "hex-to-rgb-conversion-guide": { about: ["HEX color code", "RGB color model"] },
  "what-is-hsl-color": { about: ["HSL and HSV", "CSS color"] },
  "how-many-hex-colors-are-there": { about: ["HEX color code", "RGB color model"] },
};
