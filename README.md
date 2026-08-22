# NavigationSite 项目说明

## 1. 项目简介

这是一个基于 **原生 HTML + CSS** 搭建的静态导航站项目，主要用于展示：

- 首页导航入口
- 工具页工具列表
- 投喂页内容
- 404 页面

项目没有使用前端框架，**页面内容全部写死在 HTML 里**，不依赖运行时 JavaScript 渲染。
这样做的好处是：首屏内容随 HTML 一起到达，JS 被拦截也能正常显示，搜索引擎也能直接抓到内容。

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
├─ manifest.webmanifest       # PWA 清单
├─ favicon.ico                # 站点图标（16/32/48 多尺寸）
├─ apple-touch-icon.png       # iOS 添加到主屏图标 180×180
├─ icon-192.png               # PWA 图标 192×192
├─ icon-512.png               # PWA 图标 512×512
├─ og-image.jpg               # 社交分享缩略图 1200×630
├─ package.json               # 本地开发脚本
├─ _headers                   # 缓存策略 + 安全响应头
├─ robots.txt                 # 搜索引擎抓取规则
├─ sitemap.xml                # 站点地图
├─ tools/
│  └─ index.html              # 工具页（含工具卡片）
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

### 3.1 `index.html` / `tools/index.html` / `donate/index.html` / `404.html`
四个页面文件，各自负责：

- 页面完整结构与**全部可见内容**
- SEO 元信息（description / canonical / Open Graph / Twitter Card）
- 图标与 PWA 清单引用
- 页脚年份的内联脚本（页面底部 3 行，不产生额外请求）

四个页面共用 `styles.css`，没有其他外部依赖。

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

- **缓存策略**：HTML 每次校验（改完立即生效）；CSS 缓存 1 天；图片 / 图标缓存 1 年
- **安全响应头**：CSP、nosniff、X-Frame-Options、Referrer-Policy、Permissions-Policy

> CSS 没有内容哈希，所以只缓存 1 天，避免改样式后用户长期看到旧版。

### 3.4 `manifest.webmanifest`
PWA 清单，让站点可以「添加到主屏幕」。改站点名 / 主题色时需要同步这里。

### 3.5 `robots.txt` / `sitemap.xml`
搜索引擎抓取规则与站点地图。**新增页面时记得同步更新 `sitemap.xml`。**

---

## 4. 常见维护场景

### 场景 1：修改首页文案
直接改 `index.html` 里对应的 `<h1>` / `<p class="lead">`。

### 场景 2：修改首页入口卡片
改 `index.html` 中 `.card-grid` 里的 `<article class="panel card">` 块。
卡片结构模板：

```html
<article class="panel card">
  <div class="card-top">
    <span class="badge">标签</span>
    <h3>卡片标题</h3>
  </div>
  <p>卡片描述文字。</p>
  <a
    class="text-link card-cta button button--ghost"
    href="/目标地址"
    aria-label="进入卡片标题"
  >进入入口</a>
</article>
```

> `aria-label` 一定要写成具体内容，否则屏幕阅读器会读到一串一模一样的「进入入口」。

### 场景 3：新增工具页卡片
改 `tools/index.html` 中 `.card-grid` 里的内容。

**已接入的工具**用上面的 `<a>` 结构；
**还没做好的占位工具**用禁用态，不要给假链接：

```html
<article class="panel card card--disabled">
  <div class="card-top">
    <span class="badge">待接入</span>
    <h3>工具名称</h3>
  </div>
  <p>工具说明。</p>
  <span class="card-cta button card-cta--disabled" aria-disabled="true">敬请期待</span>
</article>
```

### 场景 4：新增一个站内真实工具页面
1. 新建 `tools/xxx/index.html`（可直接复制 `tools/index.html` 改）
2. 在 `tools/index.html` 加一张指向它的卡片
3. 在 `sitemap.xml` 补一条 `<url>`

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
| 首页总传输 | ~15 KB（HTML + CSS + favicon） |
| 投喂页总传输 | ~105 KB |
| 外部域请求 | **0 个**（图标已本地化） |
| 首屏内容 | 随 HTML 到达，不依赖 JS |
| 图片 CLS | 已用 `width`/`height` 占位，无抖动 |
| 暗色模式 | 跟随系统 `prefers-color-scheme` |
| 对比度 | 亮色 / 暗色均通过 WCAG AA |

具体要求：

1. **不要引入外部 CDN 资源**（字体、图标、脚本），会拖慢首屏并暴露隐私
2. **不要把首屏内容改成 JS 渲染**，会拖慢 LCP 且爬虫抓不到
3. **图片必须带 `width` / `height`**，否则会造成布局抖动
4. **新增图片先压缩**，参考场景 6 的流程
5. **颜色只写变量**，参考 3.2 的约定

---

## 6. 一句话结论

- **改内容 / 改卡片** → 直接改对应的 `index.html`
- **改样式 / 改配色** → 改 `styles.css`（亮暗两份变量都要改）
- **改缓存 / 安全头** → 改 `_headers`
- **换图片** → 先按场景 6 压缩，再替换

保持「纯静态 HTML + 单一样式表 + 零外部依赖」这个结构，站点就会一直很快喵～
