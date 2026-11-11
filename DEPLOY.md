# Netlify 部署指南（3分钟上线）

## 方法一：Netlify Drop（最快，推荐）

1. 打开 https://app.netlify.com/drop
2. 把 colortool.zip 解压后的文件夹（或直接把整个文件夹）拖拽到页面中间的虚线框里
3. 等待 10 秒，网站就上线了！
4. 你会得到一个随机域名，类似 `https://random-words-12345.netlify.app`

## 方法二：用 GitHub 仓库（后续更新更方便）

1. 在 GitHub 创建一个新仓库（public 或 private 都可以）
2. 把 colortool 文件夹里的所有文件 push 到仓库
3. 打开 Netlify → Add new site → Import an existing project
4. 选择你的 GitHub 仓库
5. Build command 留空，Publish directory 填 `.` 或仓库根目录
6. 点击 Deploy site

## 绑定自定义域名（强烈推荐）

有了自定义域名后，申请 AdSense、做 SEO、品牌感都会好很多。

1. 在 Netlify 后台进入你的网站 → Domain settings → Add custom domain
2. 输入你买的域名（比如 hexcolorpro.com）
3. Netlify 会告诉你去域名注册商改 DNS
4. DNS 生效后（几分钟到几小时），Netlify 会自动配 HTTPS 证书

### 推荐域名注册商
- Namecheap（便宜，首年常打折）
- GoDaddy
- Cloudflare Registrar

### 域名建议
- `hexcolorpro.com`（我用了这个当示例）
- `colorpickerpro.com`
- `colorpalette.app`
- `palettegen.com`
- 尽量选 .com，.app 也可以（更有工具感）

## 验证部署成功

部署完成后访问你的域名，应该能看到：
- 首页颜色取色器正常显示
- 切换颜色时数值实时变化
- 点击配色板 Tab 能切换
- 点击任意颜色块显示"Copied!"

## 接下来做什么

部署上线后，下一个关键步骤是：
1. 注册 Google Search Console，提交 sitemap
2. 注册 Ezoic / Google AdSense，接入广告
3. 开始做内容引流

详见 README.md 的完整路线图。
