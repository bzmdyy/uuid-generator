import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const out = path.join(root, 'dist');
const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

export function siteOrigin(env = process.env) {
  const value = env.SITE_URL || (env.VERCEL_PROJECT_PRODUCTION_URL && `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`) || (env.VERCEL_URL && `https://${env.VERCEL_URL}`) || 'http://localhost:3000';
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('SITE_URL must be a complete origin, such as https://example.com (no path, credentials, query or hash).');
  if (url.protocol !== 'https:' && url.hostname !== 'localhost') throw new Error('Public SITE_URL must use HTTPS.');
  return url.origin;
}

const content = {
  en: {
    lang: 'en', title: 'UUID Generator — Free Random UUID v4 & Bulk Copy',
    description: 'Generate random UUID v4 identifiers instantly. Create 1–100 UUIDs at once and copy one or all. Free, private, and generated in your browser.',
    eyebrow: 'SMALL TOOL. ENDLESS POSSIBILITIES.', heading: 'UUID generator.<br><span>Zero effort.</span>',
    intro: 'A simple, free UUID generator. Create random version 4 UUIDs, one at a time or a hundred at once.',
    quantity: 'How many UUIDs?', range: '1–100 at a time', generate: 'Generate UUIDs', results: 'YOUR UUIDS', copy: 'Copy all',
    private: 'Generated in your browser. Your UUIDs never leave this page.',
    features: [['↻', 'Random by design', 'Version 4 UUIDs, created with your browser’s cryptographically secure random generator.'], ['≡', 'One or one hundred', 'Generate a fresh batch in one click. Copy a single UUID or the entire list.'], ['◇', 'Private by default', 'No account, no saved history, no tracking. Just the identifiers you need.']],
    aboutTitle: 'What is a UUID?', about: 'A UUID (Universally Unique Identifier) is a 128-bit identifier, usually written as 32 hexadecimal characters in five groups separated by hyphens. Developers use UUIDs for database records, test data, and other items that need independent identifiers.',
    about2: 'This tool creates version 4 UUIDs. Each has 122 random bits; the remaining bits identify its version and variant. UUIDs are extremely unlikely to collide, but uniqueness is not an absolute guarantee.',
    faqTitle: 'Good to know', faqs: [['How do I generate a UUID?', 'Choose a quantity from 1 to 100, then click Generate UUIDs. Use Copy beside a result or Copy all to copy the batch, with one UUID per line. Generating again replaces the current results.'], ['Are these UUIDs saved anywhere?', 'No. Generation happens in your browser, and the tool does not send UUIDs to a server or save them. Refreshing or switching languages creates a new list. Copying uses your device’s clipboard.'], ['Can I use UUIDs as passwords?', 'Use this tool for identifiers, not passwords, API keys, or access tokens. For secrets, use a tool designed for that purpose.']],
    footer: 'A little utility for your next big idea.', noScript: 'Please enable JavaScript to generate and copy UUIDs. The guide below is still available.',
    notFound: 'Page not found', back: 'Back to UUID Generator'
  },
  zh: {
    lang: 'zh-CN', title: 'UUID Generator — 免费随机 UUID v4 批量生成器',
    description: '免费生成随机 UUID v4，每次支持 1–100 个，可复制单个或一键复制全部。在浏览器内生成，无需注册，不保存生成记录。',
    eyebrow: '小工具，无限可能。', heading: 'UUID 生成器，<br><span>一键生成。</span>',
    intro: '简单、免费的 UUID 生成器。生成随机 UUID v4，每次一个，或一次生成一百个。',
    quantity: '生成多少个 UUID？', range: '每次 1–100 个', generate: '生成 UUID', results: '生成结果', copy: '复制全部',
    private: '在你的浏览器内生成，UUID 不会发送到服务器。',
    features: [['↻', '安全随机生成', '使用浏览器提供的安全随机功能，生成标准的 UUID v4。'], ['≡', '单个或批量生成', '一键生成新的 UUID，可复制单个，也可一次复制整份列表。'], ['◇', '默认保护隐私', '无需账号，不保存历史记录，不添加追踪工具。专注于生成标识。']],
    aboutTitle: '什么是 UUID？', about: 'UUID 是“通用唯一标识符”的缩写，是一种 128 位标识，通常由 32 个十六进制字符组成，并用短横线分成五组。开发者常用它来标记数据库记录、生成测试数据，或为不同项目分配独立编号。',
    about2: '本工具生成的是 UUID v4，其中 122 位是随机位，其余位用于标记版本和类型。重复的概率极低，但不代表绝对不会重复。',
    faqTitle: '使用小提示', faqs: [['如何生成 UUID？', '输入 1 到 100 之间的整数，然后点击“生成 UUID”。点击结果旁的“复制”可复制单个，点击“复制全部”可复制整份列表，每行一个。重新生成会替换当前结果。'], ['网站会保存生成记录吗？', '不会。UUID 在你的浏览器中生成，工具不会把 UUID 发送到服务器，也不会保存它们。刷新页面或切换语言会生成新列表。复制功能会使用你设备的剪贴板。'], ['可以把 UUID 当作密码吗？', '请将本工具用于生成标识符，不要用它生成密码、接口密钥或访问凭证。需要这些内容时，请使用专门的工具。']],
    footer: '一个小工具，助你开始下一个想法。', noScript: '请启用 JavaScript 后再生成或复制 UUID。下方说明仍可阅读。',
    notFound: '找不到这个页面', back: '返回 UUID 生成器'
  }
};

function render(c, origin, language, missing = false) {
  const page = language === 'zh' ? '/zh/' : '/';
  return `<!doctype html>
<html lang="${c.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${missing ? c.notFound : c.title}</title><meta name="description" content="${c.description}">
${missing ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${escape(origin + page)}"><link rel="alternate" hreflang="en" href="${escape(origin)}/"><link rel="alternate" hreflang="zh-CN" href="${escape(origin)}/zh/"><link rel="alternate" hreflang="x-default" href="${escape(origin)}/">`}
<meta property="og:title" content="${c.title}"><meta property="og:description" content="${c.description}"><meta property="og:type" content="website"><meta property="og:url" content="${escape(origin + page)}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="stylesheet" href="/styles.css">${missing ? '' : '<script type="module" src="/app.mjs"></script>'}</head>
<body><div class="wrap"><header class="header"><a class="brand" href="${page}" aria-label="UUID Generator ${language === 'zh' ? '首页' : 'home'}"><span class="brand-icon" aria-hidden="true">{ }</span> UUID Generator</a><nav class="language" aria-label="${language === 'zh' ? '语言' : 'Language'}"><a lang="en" href="/" ${language === 'en' ? 'class="active" aria-current="page"' : ''}>EN</a><span aria-hidden="true">/</span><a lang="zh-CN" href="/zh/" ${language === 'zh' ? 'class="active" aria-current="page"' : ''}>简体中文</a></nav></header>
${missing ? `<main class="not-found"><h1>${c.notFound}</h1><a href="/">${c.back}</a></main>` : `<main>
<section class="hero"><div class="eyebrow"><span class="dot" aria-hidden="true"></span>${c.eyebrow}</div><h1>${c.heading}</h1><p class="intro">${c.intro}</p></section>
<noscript><p>${c.noScript}</p></noscript>
<section class="generator-card" aria-label="UUID ${language === 'zh' ? '生成器' : 'generator'}"><form id="generator" novalidate><div class="controls"><div class="quantity"><label for="quantity">${c.quantity}</label><div class="input-line"><input id="quantity" name="quantity" type="number" min="1" max="100" step="1" value="1" inputmode="numeric" aria-describedby="quantity-hint error"><small id="quantity-hint">${c.range}</small></div></div><button class="primary" type="submit">${c.generate}<span aria-hidden="true">↗</span></button></div><p id="error" class="error" role="alert"></p></form>
<div class="results-heading"><h2>${c.results}</h2><div class="result-meta"><span id="result-count">0 UUIDs</span><button id="copy-all" class="copy-all" type="button" disabled>${c.copy}</button></div></div><ol id="results" aria-label="${c.results}"></ol><div class="card-footer"><span class="dot" aria-hidden="true"></span>${c.private}</div></section>
<p id="status" class="status" role="status" aria-live="polite" aria-atomic="true"></p>
<section class="features" aria-label="${language === 'zh' ? '功能特点' : 'Features'}">${c.features.map(([icon, title, text]) => `<article><div class="feature-icon" aria-hidden="true">${icon}</div><h3>${title}</h3><p>${text}</p></article>`).join('')}</section>
<section class="learn"><article><h2>${c.aboutTitle}</h2><p>${c.about}</p><p>${c.about2}</p></article><article><h2>${c.faqTitle}</h2>${c.faqs.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</article></section></main>`}
<footer class="footer"><p>© ${new Date().getUTCFullYear()} UUID Generator</p><p>${c.footer}</p></footer></div></body></html>`;
}

export async function build() {
  const origin = siteOrigin();
  await mkdir(path.join(out, 'zh'), { recursive: true });
  for (const file of ['app.mjs', 'uuid.mjs', 'styles.css', 'favicon.svg']) await copyFile(path.join(root, 'src', file), path.join(out, file));
  await writeFile(path.join(out, 'index.html'), render(content.en, origin, 'en'));
  await writeFile(path.join(out, 'zh/index.html'), render(content.zh, origin, 'zh'));
  await writeFile(path.join(out, '404.html'), render(content.en, origin, 'en', true));
  await writeFile(path.join(out, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
  await writeFile(path.join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${escape(origin)}/</loc></url>\n  <url><loc>${escape(origin)}/zh/</loc></url>\n</urlset>\n`);
  console.log(`Built English and Chinese pages in dist/ (site: ${origin})`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await build();
