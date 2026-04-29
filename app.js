const config = window.SITE_CONFIG || {};

const setText = (selector, value) => {
  const node = document.querySelector(selector);
  if (node && value) {
    node.textContent = value;
  }
};

const createCard = ({ title, description, url, badge, actionLabel }) => {
  const article = document.createElement('article');
  article.className = 'panel card';

  const safeUrl = url || '#';
  const isExternal = /^https?:\/\//.test(safeUrl);
  const actionText = actionLabel || '查看';
  const badgeHtml = badge ? `<span class="badge">${badge}</span>` : '';

  article.innerHTML = `
    <div class="card-top">
      ${badgeHtml}
      <h3>${title}</h3>
    </div>
    <p>${description || ''}</p>
    <a
      class="text-link"
      href="${safeUrl}"
      ${isExternal ? 'target="_blank" rel="noreferrer"' : ''}
    >${actionText}</a>
  `;

  return article;
};

const renderList = (selector, items, options = {}) => {
  const container = document.querySelector(selector);
  if (!container || !Array.isArray(items)) {
    return;
  }

  const limit = options.limit || items.length;
  const actionLabel = options.actionLabel;
  const fragment = document.createDocumentFragment();

  items.slice(0, limit).forEach((item) => {
    fragment.appendChild(createCard({ ...item, actionLabel: item.actionLabel || actionLabel }));
  });

  container.innerHTML = '';
  container.appendChild(fragment);
};

const initCommon = () => {
  setText('#hero-title', config.title);
  setText('#hero-subtitle', config.subtitle);

  const yearNodes = document.querySelectorAll('[data-year]');
  yearNodes.forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });
};

const initHome = () => {
  renderList('#quick-links', config.quickLinks, { actionLabel: '进入入口' });
};

const initTools = () => {
  renderList('#tools-grid', config.tools, { actionLabel: '查看工具' });
};

const page = document.body.dataset.page;

initCommon();

if (page === 'home') {
  initHome();
}

if (page === 'tools') {
  initTools();
}
