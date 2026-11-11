# 部署指南（零基础版）

这个站是**纯静态站**：没有构建步骤、没有 npm 依赖，`netlify.toml` 和 `_headers` 都是可选项。
把文件放上去就算发布。下面三条路径，按你的情况选一条。

---

## 先搞清楚你现在是哪种部署

打开 Cloudflare 控制台 → **Workers & Pages** → 点你的 `hexcolorpro` 项目 → 看 **Settings → Build**：

- 如果看到 **Git repository**（连接了 `yxq1337/hexcolorpro`）→ 走 **路径 A**。以后每次推代码自动上线。
- 如果显示 **Direct Upload**（没有 Git 连接）→ 走 **路径 B**。

两种都要保证仓库根目录有这些文件（模板里已经有了，别删）：

```
index.html  llms.txt  llms-full.txt  sitemap.xml  robots.txt
_headers    data/     colors/        blog/         embed/
```

---

## 路径 A：Git 已连接（推荐，一次搞定，以后自动）

### A1. 装 GitHub Desktop（图形界面，不需要命令行）

1. 下载 <https://desktop.github.com>，装好，用你的 GitHub 账号登录。
2. `File → Clone repository` → 选你 fork 或克隆的仓库 → 选本地目录 → Clone。
3. 我已经把改好的文件放在：
   `D:\Users\HUAWEI\Documents\deepseek-harness\default-workspace\hexcolorpro-repo\yxq1337-hexcolorpro-87d62cd`
4. 在资源管理器里把**这个文件夹里的所有内容**复制，覆盖到上一步 Clone 出来的目录（同名覆盖）。
5. 回到 GitHub Desktop：左下角会显示几百个改动，填一句 Summary（例如 `add AEO layer, color pages, embed widget, study`），点 **Commit to main**，再点 **Push origin**。
6. 等 1–3 分钟，Cloudflare 自动构建。控制台 **Deployments** 里出现绿色的 `Success` 就上线了。

### A2. 或者完全不装软件（网页上传）

1. 打开 <https://github.com/yxq1337/hexcolorpro>。
2. 点 **Add file → Upload files**。
3. 把本地文件夹里的内容**拖进浏览器**（支持拖文件夹，会保留子目录）。
4. 底部点 **Commit changes**，等 Cloudflare 自动部署。

> 缺点：网页上传只能整批覆盖，冲突时不好处理；文件多时慢。一次性用没问题。

---

## 路径 B：Direct Upload（Git 没连接）

1. Cloudflare 控制台 → Workers & Pages → 你的项目 → **Create deployment**。
2. 选择 **Upload assets**，把本地文件夹整体拖进去（或上传 zip 后解压目录）。
3. **Deploy**。Cloudflare 会给你一个新部署 URL，正式域名自动指向最新部署。
4. 建议顺手在 **Settings → Build** 里连接 GitHub 仓库，之后就不用每次手动传了。

---

## 部署后 5 分钟验收（照抄检查）

打开浏览器无痕窗口，逐条访问，确认返回 `200`：

| 地址 | 期望 | 说明 |
|---|---|---|
| `/` | 200 HTML | 首页 |
| `/about` | 200 HTML | 作者页（个人信息） |
| `/colors` | 200 HTML | 148 色汇总 |
| `/colors/rebeccapurple` | 200 HTML | 单个色页 |
| `/dark-mode-color-scheme-guide`（任意博客） | 200 HTML | 单篇 |
| `/blog/brand-accent-contrast-study-2026` | 200 HTML | 数据研究 |
| `/embed` | 200 HTML | 嵌入说明页 |
| `/embed/contrast-checker` | 200 HTML | 小组件本体 |
| `/llms.txt` | 200 `text/plain` | AI 说明书 |
| `/llms-full.txt` | 200 `text/plain` | 全站纯文本（约 420 KB） |
| `/sitemap.xml` | 200 `application/xml` | 应含 187 个 `<loc>` |
| `/data/brand-contrast-study.csv` | 200 `text/csv` | 研究数据 |

再抽查两条旧链接没坏：`/contrast-checker`、`/color-converter`。

**常见问题**

- **打开是 404**：确认上传的是文件夹**内容**而不是把文件夹套了一层（例如 `hexcolorpro/index.html` 是错的，必须是 `index.html` 在根）。
- **`llms.txt` 被当成下载**：检查根目录有没有 `_headers` 文件（里面已设 `text/plain`）。
- **改了没生效**：Cloudflare 有缓存，按 `Ctrl+F5`；或看 Deployments 里最新一次是不是 `Success`。

---

## 上线后立刻做：Google Search Console（唯一必须的 SEO 工具）

1. 打开 <https://search.google.com/search-console>，用你的 Google 账号登录。
2. **添加资源** → 选 **网址前缀** → 填 `https://hexcolorpro.pages.dev`。
3. 验证方式选 **HTML 标记**：首页 `<head>` 里已经有
   `<meta name="google-site-verification" content="Dy4Y-5n_...">`，直接点验证即可。
4. 左侧 **索引 → 站点地图** → 输入 `sitemap.xml` → 提交。
5. 48 小时后回来看 **索引 → 网页**：重点看「已发现 – 尚未编入索引」和「已编入索引」的数量。
   187 个 URL 不可能一次全收，正常节奏是每周几十个。

顺便也提交一次 Bing：<https://www.bing.com/webmasters>（支持从 GSC 直接导入）。

---

## 本次上线带上去的新东西（部署时可核对）

- 36 → **187 个 URL**：148 个 CSS 命名色页 + `/colors` 汇总页 + `/embed` + 新文章
- `llms.txt` / `llms-full.txt`：给 AI 引擎的站点说明书
- 全站结构化数据：`WebApplication`、`BlogPosting`、`FAQPage`（161 个）、`Dataset`、`Person`、`Organization`
- 148 个色页各带 40–60 词答案块 + 3 条 FAQ + 色阶 + 最近色
- `ads.js`：广告位提前占位、空闲时才加载（修 CLS）
- `_headers`：CSV / llms 文件的正确 Content-Type
- 研究数据：`/data/brand-contrast-study.csv` + 文章 `/blog/brand-accent-contrast-study-2026`

---

## 以后每次改内容的标准动作

```bash
# 改完 HTML 后，按需跑（需要 Node 20+，本机用 DSH 内置运行时）
node tools/apply-aeo.mjs .        # 刷新答案块/FAQ/schema/byline
node tools/validate-aeo.mjs .     # 校验 JSON-LD 与不变式
node tools/gen-color-pages.mjs .  # 只在改了色页数据时需要
node tools/gen-llms-full.mjs .    # 重新生成 llms-full.txt（必跑）
```

然后 commit + push。`llms-full.txt` 忘了重跑不会报错，但 AI 引擎会读到旧内容——这是唯一容易漏的一步。
