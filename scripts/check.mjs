// 一致性检查：把 README 里「要手动记住」的约定变成可以自动跑的检查。
// 只读不写，零依赖。用法：npm run check（有问题时以非 0 退出，方便接 CI）
import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { PUBLIC, SITEMAP_EXCLUDE, findHtml, toRoute } from './lib.mjs';
import { stamp } from './stamp-assets.mjs';

const problems = [];
const report = (file, message) => problems.push(`${relative(PUBLIC, file)}：${message}`);

const pages = findHtml().map((file) => ({ file, route: toRoute(file), html: readFileSync(file, 'utf8') }));

// 1. 页头、页脚在所有页面里必须一致（导航高亮项除外）
function block(html, tag) {
  const m = html.match(new RegExp(`<${tag}[\\s>][\\s\\S]*?</${tag}>`));
  return m ? m[0].replace(/ class="is-active" aria-current="page"/g, '').replace(/\s+/g, ' ') : null;
}
for (const tag of ['header', 'footer']) {
  const base = block(pages[0].html, tag);
  for (const p of pages) {
    const current = block(p.html, tag);
    if (!current) report(p.file, `缺少 <${tag}>`);
    else if (current !== base) report(p.file, `<${tag}> 与 ${relative(PUBLIC, pages[0].file)} 不一致`);
  }
}

// 2. 当前页的导航高亮只能有一处
for (const p of pages) {
  const count = (p.html.match(/aria-current="page"/g) || []).length;
  if (count > 2) report(p.file, `aria-current="page" 出现了 ${count} 次`);
}

// 3. JSON-LD 的 WebPage.name 必须与 <title> 完全一致
for (const p of pages) {
  const title = p.html.match(/<title>([^<]*)<\/title>/)?.[1];
  const ld = p.html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  if (!ld) continue;
  let data;
  try {
    data = JSON.parse(ld);
  } catch (err) {
    report(p.file, `JSON-LD 解析失败：${err.message}`);
    continue;
  }
  for (const node of data['@graph'] || [data]) {
    if (node['@type'] === 'WebPage' && node.name !== title) {
      report(p.file, `WebPage.name「${node.name}」≠ <title>「${title}」`);
    }
  }
}

// 4. CSP 禁止内联脚本和内联样式
for (const p of pages) {
  if (/<script(?![^>]*\b(src=|type="application\/ld\+json"))[^>]*>/.test(p.html)) report(p.file, '存在内联 <script>');
  if (/\sstyle="/.test(p.html) || /<style[\s>]/.test(p.html)) report(p.file, '存在内联样式');
}

// 5. CSS / JS 的版本号是否最新
for (const p of pages) {
  if (stamp(p.html) !== p.html) report(p.file, '资源版本号过期，请运行 npm run stamp');
}

// 6. sitemap 覆盖所有页面
const sitemap = readFileSync(join(PUBLIC, 'sitemap.xml'), 'utf8');
for (const p of pages) {
  if (SITEMAP_EXCLUDE.has(p.route)) continue;
  if (!sitemap.includes(`<loc>https://sakimu.com${p.route}</loc>`)) report(p.file, '不在 sitemap.xml 里，请运行 npm run sitemap');
}

// 7. 每个工具子页都要链接到其他所有工具
const tools = pages.filter((p) => /^\/tools\/[^/]+\/$/.test(p.route));
for (const p of tools) {
  for (const other of tools) {
    if (other !== p && !p.html.includes(`href="${other.route}"`)) report(p.file, `「其他工具」缺少 ${other.route}`);
  }
}

// 8. 颜色只能写在 :root 变量区里，否则暗色模式会出白块
const css = readFileSync(join(PUBLIC, 'styles.css'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/:root\s*\{[^}]*\}/g, '');
for (const m of css.matchAll(/#[0-9a-fA-F]{3,8}\b|rgba?\(/g)) {
  const line = css.slice(0, m.index).split('\n').length;
  problems.push(`styles.css：变量区之外写死了颜色 ${m[0]}（去掉 :root 后的第 ${line} 行附近）`);
}

if (problems.length) {
  console.error(`发现 ${problems.length} 个问题：`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}
console.log(`检查通过：${pages.length} 个页面，页头页脚、结构化数据、CSP、版本号、sitemap、工具互链、颜色变量均无问题。`);
