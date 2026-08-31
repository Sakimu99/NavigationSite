// 从仓库里实际存在的页面生成 sitemap.xml。
// lastmod 取该文件最后一次提交的日期，避免手写日期随时间腐化。
// 用法：npm run sitemap
import { execFileSync } from 'node:child_process';
import { readdirSync, writeFileSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://sakimu.com';

// 每条路由的抓取提示。没列到的页面按默认值处理。
const RULES = [
  { match: /^\/$/, changefreq: 'weekly', priority: '1.0' },
  { match: /^\/tools\/$/, changefreq: 'weekly', priority: '0.9' },
  { match: /^\/tools\/[^/]+\/$/, changefreq: 'monthly', priority: '0.8' },
  { match: /^\/donate\/$/, changefreq: 'monthly', priority: '0.5' },
];
const DEFAULT_RULE = { changefreq: 'monthly', priority: '0.5' };

// 不该进 sitemap 的页面
const EXCLUDE = new Set(['/404.html']);

function findPages(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'scripts') {
      continue;
    }
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...findPages(full));
    } else if (entry.name.endsWith('.html')) {
      found.push(full);
    }
  }
  return found;
}

function toRoute(file) {
  const rel = '/' + relative(ROOT, file).split('\\').join('/');
  return rel.endsWith('/index.html') ? rel.slice(0, -'index.html'.length) : rel;
}

function lastModified(file) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', file], {
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

const entries = findPages(ROOT)
  .map((file) => ({ route: toRoute(file), file }))
  .filter(({ route }) => !EXCLUDE.has(route))
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
