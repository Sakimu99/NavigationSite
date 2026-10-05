// 给 HTML 里引用的 CSS / JS 加上内容哈希版本号：/styles.css → /styles.css?v=1a2b3c4d
// 文件名不变，但内容一变 URL 就变，浏览器和边缘节点的旧缓存自然失效。
// 用法：改完 CSS / JS 后跑 npm run stamp（npm run check 会检查有没有忘记）
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PUBLIC, findHtml } from './lib.mjs';

// 需要打版本号的资源（站点根路径）
const ASSETS = ['/styles.css', '/app.js', '/tools/tools.js'];

function versionOf(asset) {
  return createHash('sha256').update(readFileSync(join(PUBLIC, asset))).digest('hex').slice(0, 8);
}

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// 返回打好版本号的 HTML；内容没变化时原样返回
export function stamp(html) {
  let out = html;
  for (const asset of ASSETS) {
    const re = new RegExp(`((?:href|src)=")${escape(asset)}(?:\\?v=[0-9a-f]+)?(")`, 'g');
    out = out.replace(re, `$1${asset}?v=${versionOf(asset)}$2`);
  }
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  let changed = 0;
  for (const file of findHtml()) {
    const html = readFileSync(file, 'utf8');
    const next = stamp(html);
    if (next !== html) {
      writeFileSync(file, next);
      changed += 1;
    }
  }
  console.log(`版本号已更新：${changed} 个 HTML 有变化。`);
  for (const asset of ASSETS) console.log(`  ${asset}?v=${versionOf(asset)}`);
}
