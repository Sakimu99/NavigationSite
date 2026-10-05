// 从仓库里实际存在的页面生成 sitemap.xml。
// lastmod 取该文件最后一次提交的日期，避免手写日期随时间腐化。
// 用法：npm run sitemap
import { execFileSync } from 'node:child_process';
import { writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { PUBLIC as ROOT, SITEMAP_EXCLUDE, findHtml, toRoute } from './lib.mjs';

const ORIGIN = 'https://sakimu.com';

// 每条路由的抓取提示。没列到的页面按默认值处理。
const RULES = [
  { match: /^\/$/, changefreq: 'weekly', priority: '1.0' },
  { match: /^\/tools\/$/, changefreq: 'weekly', priority: '0.9' },
  { match: /^\/tools\/[^/]+\/$/, changefreq: 'monthly', priority: '0.8' },
  { match: /^\/donate\/$/, changefreq: 'monthly', priority: '0.5' },
];
const DEFAULT_RULE = { changefreq: 'monthly', priority: '0.5' };

function lastModified(file) {
  try {
    // --follow 追过重命名，--diff-filter=AM 跳过纯搬家的提交，lastmod 才反映真实的内容改动
    const out = execFileSync('git', ['log', '-1', '--follow', '--diff-filter=AM', '--format=%cs', '--', file], {
      cwd: ROOT,
      encoding: 'utf8',
    }).trim();
    if (out) return out;
  } catch {
    // 不在 git 仓库里，或该文件还没有提交记录
  }
  // 尚未提交的新页面退回文件系统修改时间
  return statSync(file).mtime.toISOString().slice(0, 10);
}

const entries = findHtml()
  .map((file) => ({ route: toRoute(file), file }))
  .filter(({ route }) => !SITEMAP_EXCLUDE.has(route))
  .map(({ route, file }) => {
    const rule = RULES.find((r) => r.match.test(route)) ?? DEFAULT_RULE;
    return { route, lastmod: lastModified(file), ...rule };
  })
  .sort((a, b) => Number(b.priority) - Number(a.priority) || a.route.localeCompare(b.route));

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) => `  <url>
    <loc>${ORIGIN}${e.route}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

writeFileSync(join(ROOT, 'sitemap.xml'), xml);
console.log(`sitemap.xml 已生成，共 ${entries.length} 条：`);
for (const e of entries) console.log(`  ${e.priority}  ${e.lastmod}  ${e.route}`);
