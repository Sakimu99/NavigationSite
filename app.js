// 站点公共脚本：目前只负责把页脚年份更新为当前年份。
// 抽成外部文件是为了让 CSP 可以去掉 script-src 'unsafe-inline'。
document.querySelectorAll('[data-year]').forEach((node) => {
  node.textContent = String(new Date().getFullYear());
});
