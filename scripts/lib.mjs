// 脚本共用的小工具：定位 public/、扫描页面、把文件路径映射为站点路由。
import { readdirSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

// 不该进 sitemap 的页面
export const SITEMAP_EXCLUDE = new Set(['/404.html']);

export function findHtml(dir = PUBLIC) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...findHtml(full));
    else if (entry.name.endsWith('.html')) found.push(full);
  }
  return found.sort();
}

export function toRoute(file) {
  const rel = '/' + relative(PUBLIC, file).split('\\').join('/');
  return rel.endsWith('/index.html') ? rel.slice(0, -'index.html'.length) : rel;
}
