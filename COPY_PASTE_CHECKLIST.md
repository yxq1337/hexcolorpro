# HexColor Pro 复制粘贴发布清单

按优先级排序，从上到下依次发布。

---

## 📌 掘金（3 篇）

### 掘金 1：工具合集（先发这篇）

**标题：**
纯前端实现 11 个颜色工具，我把设计师常用的颜色操作都集成在了一个站

**正文：**
> 大家好，我是搞副业的独立开发者。最近做了一个纯前端的颜色工具站，把设计师和前端平时经常要用的 11 种颜色操作全部集成到了一个地方，全部免费、无需注册、没有弹窗。

## 为什么要做这个

每次做 UI 设计或者写 CSS 的时候，我都要来回切好几个网站：
- 取个 hex 颜色 → 去 colorpicker.com
- 转成 hsl → 再开一个
- 检查对比度 → 再开一个
- 生成色板 → 又一个

这些网站的共同问题：广告弹窗多、UI 老、有的还要注册。所以我干脆自己做了一套。

## 都有哪些工具

**🎨 基础类**
- Color Picker — 完整取色器，支持 hex/rgb/hsl/hsv/cmyk
- Color Converter — 批量转换 7 种颜色格式
- Color Name Finder — 给颜色起名字（1400+ 命名色）

**🎯 设计类**
- Palette Generator — 生成 7 种经典配色方案
- Color Shades Generator — 生成 21 级明暗色阶（设计系统神器）
- Gradient Generator — 线性/径向/锥形渐变
- Color Mixer — 两种颜色任意比例混合
- Random Color Generator — 随机颜色灵感

**♿ 可用性类**
- Contrast Checker — WCAG AA/AAA 对比度检测，带计算公式
- Text Color Generator — 自动算出背景色上最可读的文字颜色

**🌡️ 特殊类**
- Color Temperature — hex ↔ 开尔文色温互转
- Box Shadow Generator — CSS 阴影生成器

## 技术实现

全部用 **原生 JavaScript** 写的，没有用任何框架：
- 所有颜色计算都在浏览器端完成（零后端）
- 支持复制到剪贴板
- 支持深色模式
- 响应式布局
- 部署在 Cloudflare Pages

核心颜色转换逻辑大概也就 200 行 JS，我写了一篇文章专门讲这个：[Hex 转 RGB 的完整指南](https://hexcolorpro.pages.dev/blog/hex-to-rgb-conversion-guide)

## 完整站点

🔗 **https://hexcolorpro.pages.dev/**

还有 16 篇关于颜色理论、可访问性、深色模式、SaaS 仪表盘配色的深度文章，感兴趣的可以看看。

如果觉得好用，欢迎收藏，也可以告诉我你还想要什么工具～

**标签：** 前端 / JavaScript / 设计工具 / 独立开发 / 开源

**分类：** 前端

---

### 掘金 2：技术深度（隔 3-4 天发）

**标题：**
深入 WCAG 对比度计算公式：为什么你的深色模式文字"看起来够亮"却过不了 AA

**正文：**
## 先说结论

你用 #333333 文字配 #FFFFFF 背景，对比度是 12.6:1，轻松过 AAA。
但你用 #CCCCCC 文字配 #121212 深色背景，对比度只有 5.2:1 —— 刚过 AA，但很多人感觉"不够亮"。

为什么？因为 WCAG 的对比度公式有一个已知的偏差：**在低亮度区间，它系统性地高估了对比度。**

## 对比度到底怎么算的

四步走：

### 1. sRGB → 线性 RGB
每个颜色通道（R, G, B）先从 0-255 归一化到 0-1，然后：
```js
function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
```

### 2. 计算相对亮度
```js
const L = 0.2126 * R + 0.7152 * G + 0.0722 * B;
```
权重来自人眼对不同颜色的敏感度 —— 绿色最亮，蓝色最暗。

### 3. 计算对比度
```js
const ratio = (L1 + 0.05) / (L2 + 0.05);
```
其中 L1 是更亮的颜色，L2 是更暗的。那个 `+ 0.05` 是因为显示器有眩光（flare），纯黑不是真正的纯黑。

### 4. 判断是否通过
- 正文（18px 以下）：AA ≥ 4.5:1，AAA ≥ 7:1
- 大文字（18px 以上或加粗 14px 以上）：AA ≥ 3:1，AAA ≥ 4.5:1

## 为什么我说这个公式有问题

2008 年的 WCAG 2.0 用的就是上面这个公式，到 2026 年了还在用。

问题在于：**人眼感知的亮度差和物理亮度差不是线性的。** 在深色区域，一点点亮度的增加，人眼感知到的差异比同样增量在浅色区域小得多。

WCAG 3.0 提出了 APCA（Advanced Perceptual Contrast Algorithm）来解决这个问题，但浏览器支持度还不够。

## 我做了个工具

我做了一个对比度检测器，它不仅告诉你 pass/fail，还把**每一步计算过程**都列出来了，包括线性 RGB 值、相对亮度、最终比值：

🔗 https://hexcolorpro.pages.dev/contrast-checker

还写了一篇更详细的长文：
📖 https://hexcolorpro.pages.dev/blog/wcag-contrast-ratio-guide

## 实际建议

做深色模式的时候：
1. 不要用纯黑 (#000000) 做背景，用 #121212 或 #0F172A
2. 不要用纯白 (#FFFFFF) 做文字，用 #E5E5E5 或 #F1F5F9
3. 主色调在深色模式下要**降低饱和度 15-30%**，否则刺眼
4. 永远用工具测一下对比度，别相信眼睛

**标签：** 可访问性 / 前端 / CSS / 设计 / WCAG

**分类：** 前端

---

### 掘金 3：设计系统（再隔 3-4 天发）

**标题：**
我看了 30 个顶级 SaaS 仪表盘，总结出了这套配色方法论

**正文：**
## 为什么仪表盘配色难

普通网站配色：主色 + 辅助色 + 中性色 = 搞定。
仪表盘配色：主色 + 成功/警告/错误/信息 4 种状态色 + 数据可视化 6-12 色 + 3-5 层表面色 + 边框/分割线/文字等级 = 头大。

我研究了 Linear, Stripe, Vercel, Notion, Figma, Mixpanel 等 30 个产品的仪表盘，总结了一套可落地的配色体系。

## 一、颜色系统的基础结构

一个完整的仪表盘配色需要 4 层：

### 1. Brand Color（品牌色）- 1 个
这是你的主色调，用于 CTA 按钮、选中态、重点数据。
- 推荐：蓝色系（信任、专业）或紫色系（科技、创新）
- 避开：红色（容易和错误色混淆）

### 2. Semantic Colors（语义色）- 4 个
- **Success**（成功）：绿色系，#10B981 左右
- **Warning**（警告）：橙/黄色系，#F59E0B 左右
- **Error**（错误）：红色系，#EF4444 左右
- **Info**（信息）：蓝色系，#3B82F6 左右

关键原则：**不仅靠颜色区分，还要有图标和文字辅助。** 色弱用户占男性 8%。

### 3. Data Viz Colors（数据色）- 6 到 12 个
做图表用的调色板，三大原则：
1. **同等亮度和饱和度** —— 不然有的色块会"跳出来"
2. **色相差均匀** —— 按色轮等距分布
3. **在灰度下也可区分** —— 打印出来也能看

我做了一个调色板生成器，可以一键生成仪表盘友好的数据色板：
🔗 https://hexcolorpro.pages.dev/palette-generator

### 4. Neutral Scale（中性色阶）- 10 到 14 个
不是黑白灰那么简单。一个好的中性色阶：
- 950 → 50，共 10 级（参考 Tailwind 的命名）
- 背景用 50-100，卡片用 0（白）或 50
- 边框用 200-300
- 次要文字用 500，主要文字用 900

## 二、深色模式怎么搞

直接说结论：**不要做一套浅色然后 invert，做两套独立的。**

深色模式有自己的规则：
- 背景不是纯黑，是 #0F172A 或 #121212
- 表面颜色用"越往上越亮"的原则（模拟光从上方来）
- 文字最亮也不要超过 #E2E8F0（纯白伤眼）
- 主色调在深色下要降低饱和度

我写了一篇完整的深色模式工程指南，有数学推导和具体的色值建议：
📖 https://hexcolorpro.pages.dev/blog/dark-mode-color-scheme-guide

## 三、实际案例拆解

**Linear**：紫色主色 + 极其克制的状态色 + 数据色全部同亮度
**Stripe Dashboard**：蓝色 + 极简中性色阶 + 状态色饱和度极低
**Vercel**：黑白为主 + 偶尔一个高饱和品牌色做点缀
**Mixpanel**：数据色极其丰富但都统一在同一亮度水平

## 四、工具推荐

- 🎨 配色生成：https://hexcolorpro.pages.dev/palette-generator
- 🌗 色阶生成：https://hexcolorpro.pages.dev/color-shades-generator
- ♿ 对比度检测：https://hexcolorpro.pages.dev/contrast-checker
- 📖 完整指南：https://hexcolorpro.pages.dev/blog/saas-dashboard-color-palette

你们公司的仪表盘配色是设计师拍脑袋定的，还是有完整的 design token 体系？

**标签：** 设计系统 / 前端 / SaaS / UI设计 / 配色

**分类：** 设计

---

## 📌 知乎（3 篇回答）

### 知乎 1：工具推荐回答（先找"有哪些免费好用的在线设计工具"类问题）

**开头：**
作为一个折腾了无数设计工具的独立开发者，来推荐几个真正免费、好用、不弹窗、不强制注册的在线工具。

以下全是我自己日常在用的，按使用频率排序：

**正文：**
## 1. HexColor Pro — 颜色工具合集

**网址：** https://hexcolorpro.pages.dev/

我自己做的（先自卖自夸），一个站集成了 11 个颜色工具：
- 颜色取色器 + 7 种格式转换
- WCAG 对比度检测器（带数学公式解释）
- 配色方案生成器（7 种经典模式）
- 渐变生成器（支持 3 种类型）
- 色阶生成器（做设计系统必备）
- 颜色混合器
- 随机颜色生成
- 色温转换（hex ↔ 开尔文）
- 文字颜色自动匹配
- 颜色命名（1400+ 种命名色）
- CSS 阴影生成器

**为什么推荐：** 全部纯前端，打开就用，没有任何注册登录，界面干净。

## 2. Can I Use — 浏览器兼容性查询

**网址：** https://caniuse.com

每个前端都该收藏的站。查某个 CSS 属性、JS API 在各浏览器的支持情况一目了然，还能看全球使用率统计。

## 3. TinyPNG — 图片智能压缩

**网址：** https://tinypng.com

上线前压缩图片必备。PNG 和 JPEG 都支持，压缩率很高而且肉眼几乎看不出差异。支持批量上传，免费用户每月 500 张。

## 4. RegExr — 正则表达式可视化调试

**网址：** https://regexr.com

写正则的救星。实时匹配测试，可视化展示每一组的捕获结果，还有详细的语法速查表。

## 5. Color Safe — 无障碍配色检查

**网址：** http://colorsafe.co

做产品必须考虑可访问性。输入背景色和文字色，自动计算对比度是否符合 WCAG 标准。

---

### 知乎 2：对比度回答（找"为什么UI设计要讲究色彩对比度"类问题）

**回答：**
因为**看不清 = 用不了**。

对比度是可访问性（accessibility）里最基础也是最重要的一条。全球有 2.53 亿视力障碍人士，加上在户外阳光下看手机的正常人，对比度不够的界面 = 把一部分用户直接排除了。

## 先给一个直观的概念

WCAG（Web 内容可访问性指南）规定：
- **AA 级**：正文文字对比度 ≥ 4.5:1，大文字 ≥ 3:1
- **AAA 级**：正文文字对比度 ≥ 7:1，大文字 ≥ 4.5:1

这是什么概念呢？
- #000000 配 #FFFFFF = 21:1（满分）
- #333333 配 #FFFFFF = 12.6:1（AAA 稳过）
- #666666 配 #FFFFFF = 5.7:1（AA 过，AAA 不过）
- #999999 配 #FFFFFF = 2.8:1（都不过，但很多网站还在用）

很多设计师喜欢用浅灰色文字显得"高级"，但 #999 配白底是过不了 WCAG 最低标准的。

## 对比度怎么算的？

四步：

1. **sRGB 转线性 RGB**：因为人眼感知的亮度和像素值不是线性关系
2. **算相对亮度**：L = 0.2126R + 0.7152G + 0.0722B（绿色权重最高，因为人眼对绿色最敏感）
3. **算对比度**：(L1 + 0.05) / (L2 + 0.05)
4. **对比阈值**：≥4.5 过 AA，≥7 过 AAA

我做了一个工具，可以实时看到每一步的计算过程：
https://hexcolorpro.pages.dev/contrast-checker

## 常见的对比度误区

**误区 1：深色模式下眼睛自动适应，所以可以降低标准**
错。深色模式下反而更容易出现对比度不够的问题，因为人眼在暗光下的视觉敏锐度下降。WCAG 标准对深浅模式是一样的。

**误区 2：设计师说"看起来够清楚"就行了**
错。人眼的感知会被周围环境影响。在纯白界面上看起来够亮的灰色，放到有颜色的背景上可能就不够了。用工具测，别靠感觉。

**误区 3：色弱和色盲是一回事**
不对。色盲是完全无法区分某些颜色（最常见红绿色盲），色弱是区分能力下降。8% 的男性有不同程度的色觉障碍。

## 实际建议

1. 正文永远用 AA 及以上
2. 关键操作按钮用 AAA
3. 不要只用颜色传递信息（红绿色盲分不清错误和成功）
4. 用专业工具检测，别相信眼睛

我做的对比度检测工具，免费无广告：
https://hexcolorpro.pages.dev/contrast-checker

更多关于可访问性配色的详细指南：
https://hexcolorpro.pages.dev/blog/wcag-contrast-ratio-guide

---

### 知乎 3：HSL 专栏（发专栏文章，或回答"HSL颜色模型有什么优势"类问题）

**标题：**
为什么我写 CSS 再也不用 RGB 了，全换成 HSL

**正文：**
## 先讲一个故事

刚做前端的时候，我调颜色全靠 rgb()。想要"再亮一点的蓝"？`rgb(59, 130, 246)` → 试试 `rgb(80, 150, 255)` → 不对，怎么变粉了？再试 `rgb(50, 120, 250)` → 嗯……好像更暗了。

直到我开始用 HSL，调颜色的效率至少提升了 3 倍。

## HSL 是什么

HSL = **Hue（色相）** + **Saturation（饱和度）** + **Lightness（亮度）**

- **Hue**：0-360 度，对应色轮上的位置。0 是红，120 是绿，240 是蓝。
- **Saturation**：0-100%，越高越鲜艳，0% 就是灰色。
- **Lightness**：0-100%，0% 是黑，100% 是白，50% 是"正常"颜色。

所以：
- `hsl(240, 100%, 50%)` = 纯蓝
- `hsl(240, 100%, 70%)` = 浅蓝（加白）
- `hsl(240, 60%, 50%)` = 灰蓝（去饱和）
- `hsl(250, 100%, 50%)` = 偏紫的蓝（色相 +10）

**用 HSL 调颜色，你想调什么就调什么，不用猜。**

## HSL 比 RGB 好在哪里

### 1. 直觉性
RGB 三个值互相影响，调一个值颜色的三个维度（色相、饱和度、亮度）都会变。
HSL 三个通道各管各的，你想让颜色"更亮 10%"，直接 `lightness + 10%` 就完了。

### 2. 生成配色方案变得简单
想要互补色？色相 +180 度。
想要类似色？色相 ±30 度。
想要三角色？色相 ±120 度。

用 RGB？那得算半天。

### 3. 设计系统 token 化的最佳拍档
Tailwind 的色阶（50, 100, 200, ..., 900）本质上就是同色相、同饱和度、不同亮度的一组颜色。用 HSL 生成这种色阶就是一行代码的事。

我做了一个色阶生成器，可以从任意颜色生成 21 级 tints 和 shades，底层就是 HSL 计算：
https://hexcolorpro.pages.dev/color-shades-generator

## 但 HSL 也有坑

**坑 1：HSL 的"亮度"不是感知亮度**
`hsl(0, 100%, 50%)`（纯红）和 `hsl(120, 100%, 50%)`（纯绿），HSL 说它们亮度都是 50%，但人眼看着绿色明显亮得多。

这是因为 HSL 的亮度是数学上的，不是感知上的。如果需要感知亮度一致的调色板，要用 CIELAB 或 OKLCH。

**坑 2：低饱和度下色相不准**
灰色（饱和度 0%）的色相值没有意义，但不同浏览器可能渲染出细微差异。

## 我的建议

日常写 CSS，用 HSL 就够了，效率比 RGB 高得多。

如果是做专业的设计系统、数据可视化调色板，可以研究一下 OKLCH —— 这是目前最好的感知均匀的颜色模型，Chrome/Safari/Firefox 都已经支持 `oklch()` 函数了。

工具推荐：
- 颜色格式转换（hex/rgb/hsl/hsv/cmyk 互转）：https://hexcolorpro.pages.dev/color-converter
- 色阶生成器：https://hexcolorpro.pages.dev/color-shades-generator
- 配色方案生成器：https://hexcolorpro.pages.dev/palette-generator

深度文章：
- 《HSL 颜色完全指南》：https://hexcolorpro.pages.dev/blog/what-is-hsl-color

---

## 📌 Reddit（5 个子版 × 1 篇，晚几天发）

发布顺序：r/SideProject → r/webdev → r/Frontend → r/web_design → r/design

### r/SideProject
**标题：** Show r/sideproject: I built a free color toolset with 11 tools (ad-supported, no signup)

**正文：**
Hey everyone,

I've been working on HexColor Pro for the past few weeks — a clean, fast color tool site aimed at designers and devs.

**Stats so far:**
- 11 tools (color picker, converter, contrast checker, palette generator, gradient maker, shades, mixer, random color, color temp, text color, shadow generator)
- 16 in-depth blog posts on color theory, accessibility, SaaS design, dark mode
- Built with vanilla JS — no framework, no build step, no backend
- Hosted on Cloudflare Pages (free tier)
- Monetized with Adsterra (just got approved last week)

**Why I built it:**
I kept opening 4-5 different sites every time I worked on a design project. Figured I could build one clean place with better UI, more features, and no newsletter popups.

Check it out: https://hexcolorpro.pages.dev/

Would love any feedback on:
- Tools that are missing
- UI/UX improvements
- Better monetization ideas for a tool site (Ezoic was 250k monthly sessions minimum which is way out of reach)

---

### r/webdev
**标题：** I built 11 free color tools for devs (no signup, no ads popups, open source logic)

**正文：**
Hey r/webdev,

I've been building HexColor Pro as a side project — a collection of color tools I keep reaching for but couldn't find a single clean place for.

What's there right now:
- 🎨 Color Picker with eyedropper + RGB/HSL/HSV/CMYK conversion
- 🔄 Color Converter (bulk convert between 7 color models)
- 🎲 Random Color Generator (great for placeholder states, design brainstorming)
- 🌗 Color Shades Generator (tints + shades, perfect for design system tokens)
- 📊 Contrast Checker (WCAG AA / AAA with the actual math explained)
- 🎨 Palette Generator (analogous, complementary, triadic, monochromatic)
- 🌡️ Color Temperature (hex ↔ Kelvin conversion)
- ➕ 5 more: Gradient Generator, Color Mixer, Text Color Generator, Color Name Finder, Box Shadow Generator

All of them run 100% in the browser — no server, no tracking, no account. Just color math and fast UI.

Blog has deep dives on WCAG contrast math, HSL color theory, dark mode color engineering, and SaaS dashboard color systems if that's your thing.

Check it out: https://hexcolorpro.pages.dev/

Would love feedback on what's missing or what could be better.

---

### r/Frontend
**标题：** The math behind WCAG contrast ratios (and how to calculate it in 4 lines of JS)

**正文：**
If you've ever wondered *why* the contrast checker says your colors pass or fail, here's the actual math:

1. **Convert sRGB to linear RGB**: For each channel, if value ≤ 0.04045, divide by 12.92. Otherwise, ((value + 0.055) / 1.055) ^ 2.4
2. **Calculate relative luminance**: L = 0.2126 × R + 0.7152 × G + 0.0722 × B
3. **Compute ratio**: (L1 + 0.05) / (L2 + 0.05) where L1 is the lighter color

That's it. 4.5:1 passes AA for normal text, 7:1 for AAA. 3:1 for large text.

The 0.05 offset is because WCAG assumes the display flares about 5% — so pure black in real life isn't actually 0 luminance.

I built a tool that shows the calculation step-by-step if you want to verify: https://hexcolorpro.pages.dev/contrast-checker

And wrote the full guide here: https://hexcolorpro.pages.dev/blog/wcag-contrast-ratio-guide

The wild thing? This formula hasn't changed since WCAG 2.0 in 2008, and it's known to overestimate contrast on dark colors and underestimate on light ones. WCAG 3.0 (APCA) is supposed to fix it but adoption is glacial.

What's your team using for contrast validation?

---

### r/web_design
**标题：** Free color palette generator + 10 other color tools (no signup, all client-side)

**正文：**
Hi r/web_design,

Built HexColor Pro as a side project for fellow designers who are tired of jumping between 5 different sites to pick colors.

The full toolset:
- **Palette Generator** — analogous, complementary, triadic, tetradic, monochromatic schemes from any base color
- **Color Shades Generator** — 21-step tint/shade scale, great for design tokens
- **Contrast Checker** — WCAG AA/AAA with luminance math explained
- **Gradient Generator** — linear/radial/conic with custom stops
- **Color Mixer** — blend two colors at any ratio
- **Color Converter** — hex ↔ rgb ↔ hsl ↔ hsv ↔ cmyk
- **Random Color Generator** — quick inspiration
- **Color Temperature** — Kelvin ↔ RGB conversion
- **Text Color Generator** — auto-pick readable text color for any background
- **Color Picker + Color Name Finder**

100% free, no signup, no paywalls. Everything runs in the browser.

Also wrote a bunch of in-depth guides on color theory, accessibility, SaaS dashboard palettes, dark mode engineering, etc.

Check it out: https://hexcolorpro.pages.dev/

Always open to feedback — what color tool do you wish existed?

---

### r/design
**标题：** Dark mode color schemes aren't just "invert everything" — here's the engineering behind it

**正文：**
Hey designers,

I've been doing a deep dive on dark mode color systems and the more I dig, the more it feels like engineering, not design:

1. **Surface elevation doesn't use black** — it uses *lighter* grays as surfaces rise. Google Material uses 5 elevation levels; Apple uses 4.
2. **Pure white on dark background burns eyes** — #FFFFFF on #000000 has a 21:1 ratio but causes halation. 90% white (#E5E5E5) on 10% black (#121212) is the sweet spot.
3. **Saturated colors fail contrast in dark mode** — that beautiful blue accent you use in light mode? It probably fails AA on dark backgrounds. You need to desaturate 15-30%.
4. **You can't just use the same palette inverted** — the perceptual lightness of a color doesn't scale linearly with its HSL lightness value. That's why CIELAB exists.

I wrote a full breakdown with the actual math (relative luminance formula, WCAG ratio calculation) and built a couple tools to help:
- Contrast checker that explains *why* two colors pass or fail: https://hexcolorpro.pages.dev/contrast-checker
- Color shades generator for building token systems: https://hexcolorpro.pages.dev/color-shades-generator
- Full article with dark mode system examples: https://hexcolorpro.pages.dev/blog/dark-mode-color-scheme-guide

Curious how other design teams handle this — do you have separate light/dark palettes or generate them procedurally?

---

## 发布节奏建议

| 时间 | 平台 | 内容 |
|------|------|------|
| 今天 | 掘金 | 第 1 篇（工具合集） |
| 今天 | 知乎 | 第 1 篇回答（工具推荐） |
| 第 3 天 | 掘金 | 第 2 篇（WCAG 深度） |
| 第 4 天 | 知乎 | 第 2 篇回答（对比度） |
| 第 6 天 | 掘金 | 第 3 篇（SaaS 仪表盘） |
| 第 7 天 | 知乎 | 第 3 篇专栏（HSL） |
| 第 10 天 | Reddit | r/SideProject |
| 第 12 天 | Reddit | r/webdev |
| 第 14 天 | Reddit | r/Frontend |
| 第 16 天 | Reddit | r/web_design |
| 第 18 天 | Reddit | r/design |
