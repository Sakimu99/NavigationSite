# NavigationSite 项目说明

## 1. 项目简介

这是一个基于 **原生 HTML + CSS** 搭建的静态导航站项目，主要用于展示：

- 首页导航入口
- 工具索引页 + 4 个可用的在线工具子页
- 投喂页内容
- 404 页面

项目没有使用前端框架，**页面内容全部写死在 HTML 里**，不依赖运行时 JavaScript 渲染。
这样做的好处是：首屏内容随 HTML 一起到达，JS 被拦截也能正常显示，搜索引擎也能直接抓到内容。

工具页的**交互逻辑**由 `tools/tools.js` 提供，但工具的说明文字、FAQ 等所有可见内容
依然写死在 HTML 里，JS 只负责按钮响应。

本地开发命令：

```bash
npm run dev        # 实际执行 npx wrangler pages dev .
```

项目面向 **Cloudflare Pages** 一类的静态托管环境。

---

## 2. 项目核心文件结构

```text
NavigationSite/
├─ index.html                 # 首页（含首页入口卡片）
├─ 404.html                   # 404 页面
├─ styles.css                 # 全站公共样式（含亮色 / 暗色主题变量）
├─ app.js                     # 全站公共脚本（目前只更新页脚年份）
├─ manifest.webmanifest       # PWA 清单
├─ favicon.ico                # 站点图标（16/32/48 多尺寸）
├─ apple-touch-icon.png       # iOS 添加到主屏图标 180×180
├─ icon-192.png               # PWA 图标 192×192
├─ icon-512.png               # PWA 图标 512×512
├─ icon-maskable-512.png      # PWA maskable 图标（内容缩至 80% 安全区）
├─ icon-mark-64.webp          # 导航栏品牌标记（显示 26px）
├─ avatar-256.webp            # 首页 hero 头像（显示 116px）
├─ og-image.jpg               # 社交分享缩略图 1200×630
├─ package.json               # 本地开发脚本
├─ _headers                   # 缓存策略 + 安全响应头
├─ robots.txt                 # 搜索引擎抓取规则
├─ sitemap.xml                # 站点地图（由脚本生成，不要手改）
├─ scripts/
│  └─ build-sitemap.mjs       # 扫描页面生成 sitemap，lastmod 取自 git 提交日期
├─ tools/
│  ├─ index.html              # 工具索引页（只列卡片，不放工具本体）
│  ├─ tools.js                # 4 个工具的交互逻辑（全部本地运行）
│  ├─ json/index.html         # JSON 格式化与校验
│  ├─ codec/index.html        # Base64 与 URL 编码转换
│  ├─ regex/index.html        # 正则表达式在线测试
│  └─ timestamp/index.html    # Unix 时间戳转换
├─ donate/
│  ├─ index.html              # 投喂页
│  ├─ zhifubao-donate.webp    # 收款码海报 820w（WebP，主用）
│  ├─ zhifubao-donate-560.webp# 收款码海报 560w（WebP，主用）
│  ├─ zhifubao-donate.jpg     # 收款码海报 820w（JPEG 降级）
│  └─ zhifubao-donate-560.jpg # 收款码海报 560w（JPEG 降级）
└─ .gitignore
```

---

## 3. 各核心文件作用说明

### 3.1 页面 HTML（共 8 个）
每个页面文件各自负责：

- 页面完整结构与**全部可见内容**
- SEO 元信息（description / canonical / Open Graph / Twitter Card）
- **JSON-LD 结构化数据**（见下方约定）
- 图标与 PWA 清单引用

所有页面共用 `styles.css` 与 `app.js`，工具子页额外引用 `tools/tools.js`，没有其他外部依赖。

> **重要约定**：页面里**不要写内联 `<script>` 和内联 `style` 属性**。
> CSP 已收紧为 `script-src 'self'; style-src 'self'`，内联代码会被浏览器直接拦掉。
> 需要脚本就加到 `app.js` 或 `tools/tools.js`。
> （`<script type="application/ld+json">` 不受影响，它是数据块，不会被当作脚本执行。）

各页面的 JSON-LD 组合：

| 页面 | 结构化数据类型 |
| --- | --- |
| `index.html` | `WebSite` + `Person` + `WebPage` + `ItemList` |
| `tools/index.html` | `BreadcrumbList` + `CollectionPage` + `ItemList` |
| `tools/*/index.html` | `BreadcrumbList` + `WebPage` + `SoftwareApplication` + `FAQPage` |
| `donate/index.html` | `BreadcrumbList` + `WebPage` |

> JSON-LD 里的 `WebPage.name` 必须和该页 `<title>` **完全一致**，
> 否则等于给爬虫两个互相打架的标题。

### 3.1.1 `app.js` / `tools/tools.js`
- `app.js`：全站公共脚本，目前只把页脚的 `<span data-year>` 更新为当前年份
- `tools/tools.js`：4 个工具的全部逻辑。每个工具用 `if (!input || !output) return;` 做存在性判断，
  所以同一个文件可以安全地被 4 个子页共用，各页只会激活自己那一个工具

> 工具输出一律走 `.value` 和 `.textContent`，**不要用 `innerHTML`**，避免把用户输入变成 XSS 面。

### 3.2 `styles.css`
全站唯一样式文件，负责：

- **颜色变量**：`:root` 定义亮色主题，`@media (prefers-color-scheme: dark)` 定义暗色主题
- 导航栏、卡片、按钮、投喂页、页脚的全部视觉表现
- 响应式断点：960px（卡片列数）、720px（导航栏换行）、640px（移动端）
- 无障碍：全局 `:focus-visible` 焦点环、`prefers-reduced-motion` 降级

> **重要约定**：所有颜色都必须走 CSS 变量，不要在变量区之外写死 `#xxxxxx`。
> 否则暗色模式下会出现白块。

### 3.3 `_headers`
Cloudflare Pages 响应头配置，分两部分：

- **缓存策略**：HTML 每次校验（改完立即生效）；CSS / JS 缓存 1 天；图片 / 图标缓存 1 年
- **安全响应头**：CSP、nosniff、X-Frame-Options、Referrer-Policy、Permissions-Policy

> CSS 和 JS 都没有内容哈希，所以只缓存 1 天，避免改完后用户长期看到旧版。

> **CF Pages 的坑**：同名响应头是「拼接」而不是「覆盖」。
> 所以 `/*` 段里只放安全头，`Cache-Control` 一律按文件类型单独声明，互不重叠。
> 文件顶部的注释里写了完整原因，改之前先读一遍。

### 3.4 `manifest.webmanifest`
PWA 清单，让站点可以「添加到主屏幕」。改站点名 / 主题色时需要同步这里。

### 3.5 `robots.txt` / `sitemap.xml` / `scripts/build-sitemap.mjs`
搜索引擎抓取规则与站点地图。

**`sitemap.xml` 由脚本生成，不要手改：**

```bash
npm run sitemap
```

脚本会扫描仓库里所有 `*.html`（排除 `404.html`），把路径映射成 URL，
`lastmod` 取该文件最后一次 git 提交的日期，尚未提交的新文件退回文件系统修改时间。
新增页面后跑一次即可，不用记日期。抓取频率和优先级在脚本顶部的 `RULES` 里配置。

---

## 4. 常见维护场景

### 场景 1：修改首页文案
直接改 `index.html` 里对应的 `<h1>` / `<p class="lead">`。

### 场景 2：修改首页入口卡片
改 `index.html` 中 `.card-grid` 里的 `<article class="panel card">` 块。
当前卡片结构模板：

```html
<article class="panel card">
  <div class="card-top">
    <span class="card-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
           stroke-linecap="round" stroke-linejoin="round"><!-- 图标路径 --></svg>
    </span>
    <div class="card-head">
      <h3>卡片标题</h3>
      <span class="badge">标签</span>
    </div>
  </div>
  <p>卡片描述文字。</p>
  <a class="card-link" href="/目标地址">
    去哪里的具体说法
    <svg class="card-link__arrow" width="14" height="14" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"
         aria-hidden="true"><path d="M5 12h13" /><path d="m12 5 7 7-7 7" /></svg>
  </a>
</article>
```

> 链接文案要写成**具体**的说法（「打开工具页」「前往 blog.sakimu.com」），
> 不要几张卡都写「进入入口」——那样屏幕阅读器和肉眼扫视都分不出区别。
> 因为文案本身已经足够具体，所以不再需要额外的 `aria-label`。

> 图标用**内联 SVG**，不要引图标库，也不要用图片文件：内联 SVG 零额外请求，
> 而且能通过 `currentColor` 自动跟随亮暗主题。

### 场景 3：修改工具索引页的卡片
改 `tools/index.html` 中 `.card-grid` 里的内容，结构和场景 2 完全一样。

> **工具索引页只放卡片，不要把工具本体放进去。**
> 工具本体在各自的子页里。如果两边都放，就会变成重复内容，对 SEO 有害。

> 也不要再放「敬请期待」的占位卡。占位卡对访客没用，对搜索引擎则是典型的
> thin content。工具没做好就先不要在索引页列出来。

### 场景 4：新增一个工具子页
1. **写逻辑**：在 `tools/tools.js` 里加一个 IIFE，开头用 `if (!input || !output) return;`
   做存在性判断，这样它不会影响其他子页
2. **建页面**：新建 `tools/xxx/index.html`，直接复制一个现有子页改，需要改的部分是：
   - `<title>` / `description` / `canonical` / OG 与 Twitter 字段
   - JSON-LD 里的 `BreadcrumbList`、`WebPage`、`SoftwareApplication`、`FAQPage`
     （注意 `WebPage.name` 要和 `<title>` 一字不差）
   - `.breadcrumb` 面包屑的最后一节
   - `<h1>`、`.tool-page__lead`、工具本体、「怎么用」、「常见问题」
   - 页面底部 `.tool-siblings` 的兄弟工具链接，**其他 4 个子页也要各加一条指向新页的链接**
3. **上索引**：在 `tools/index.html` 加一张卡片
4. **更新站点地图**：`npm run sitemap`

> 每个子页都要有真实的「怎么用」和「常见问题」内容。
> 这不是为了凑字数——工具页只有一个输入框的话，既帮不到访客，
> 也拿不到任何长尾搜索流量。FAQ 同时会通过 `FAQPage` 结构化数据暴露给搜索引擎。

### 场景 5：调整视觉
改 `styles.css`。改颜色优先改 `:root` 的变量，并记得**同步改暗色那一份**。

### 场景 6：更换收款码图片
不要直接丢一张大图进去。按下面流程处理（原图 2.1MB → 现在 89KB）：

```bash
python3 -m venv /tmp/imgvenv && /tmp/imgvenv/bin/pip install pillow
/tmp/imgvenv/bin/python - <<'PY'
from PIL import Image
im = Image.open('新收款码.png').convert('RGB')
for w in (560, 820):
    h = round(im.height * w / im.width)
    r = im.resize((w, h), Image.LANCZOS)
    name = 'zhifubao-donate' + ('' if w == 820 else f'-{w}')
    r.save(f'donate/{name}.webp', 'WEBP', quality=88, method=6)
    r.save(f'donate/{name}.jpg', 'JPEG', quality=85, optimize=True,
           progressive=True, subsampling=0)
PY
```

然后确认 `donate/index.html` 里 `<img>` 的 `width` / `height` 和新图比例一致。

---

## 5. 性能与质量约定

这些是当前已经做到的状态，改动时请不要破坏：

| 项目 | 当前状态 |
| --- | --- |
| 首页传输 | 文本 gzip 后约 7.5 KB + 图像约 20 KB |
| 工具子页传输 | 文本 gzip 后约 10 KB（含 tools.js） |
| 投喂页总传输 | ~105 KB |
| 外部域请求 | **0 个**（图标已本地化） |
| 首屏内容 | 随 HTML 到达，不依赖 JS |
| 内联脚本 / 样式 | **0 处**，CSP 已收紧到 `script-src 'self'` |
| 图片 CLS | 已用 `width`/`height` 占位，无抖动 |
| 暗色模式 | 跟随系统 `prefers-color-scheme` |
| 对比度 | 亮色 / 暗色正文均 ≥ 4.5:1，通过 WCAG AA |

具体要求：

1. **不要引入外部 CDN 资源**（字体、图标、脚本），会拖慢首屏并暴露隐私
2. **不要把首屏内容改成 JS 渲染**，会拖慢 LCP 且爬虫抓不到
3. **图片必须带 `width` / `height`**，否则会造成布局抖动
4. **新增图片先压缩**，参考场景 6 的流程
5. **颜色只写变量**，参考 3.2 的约定
6. **不要写内联 `<script>` 或 `style` 属性**，会被 CSP 拦掉，参考 3.1 的约定
7. **调整 `--muted` / `--subtle` 时先算对比度**，这两个值目前刚好卡在 4.5:1 上方，
   往浅了调就会掉出 WCAG AA

---

## 6. 一句话结论

- **改内容 / 改卡片** → 直接改对应的 `index.html`
- **改样式 / 改配色** → 改 `styles.css`（亮暗两份变量都要改）
- **改缓存 / 安全头** → 改 `_headers`
- **换图片** → 先按场景 6 压缩，再替换
- **加页面** → 建 HTML、上索引卡片、跑 `npm run sitemap`

保持「纯静态 HTML + 单一样式表 + 零外部依赖」这个结构，站点就会一直很快喵～
