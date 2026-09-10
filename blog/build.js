/**
 * microCMS の blogs API（または fixtures）から静的ブログ HTML / sitemap を生成する。
 *
 * 環境変数:
 *   MICROCMS_SERVICE_DOMAIN  例: hakamairidaikou
 *   MICROCMS_API_KEY         APIキー
 *
 * 未設定時は blog/fixtures/posts.json を使用します。
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const BLOG_DIR = path.join(ROOT, "blog");
const FIXTURES = path.join(BLOG_DIR, "fixtures", "posts.json");
const CONFIG_PATH = path.join(ROOT, "site.config.json");

const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
const SITE_URL = String(config.siteUrl || "").replace(/\/$/, "");
const SITE_NAME = config.siteName || "墓守の民";
const ENDPOINT = config.microcmsEndpoint || "blogs";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/\n/g, " ");
}

function formatDateJa(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}年${m}月${day}日`;
}

function toIsoDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

function absoluteUrl(pathname) {
  if (!SITE_URL) return pathname;
  return `${SITE_URL}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

function slugify(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^\w\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizePost(raw) {
  const slug = slugify(raw.slug || raw.id);
  if (!slug) return null;
  return {
    id: raw.id || slug,
    title: String(raw.title || "").trim() || "無題",
    slug,
    description: String(raw.description || "").trim(),
    body: String(raw.body || ""),
    publishedAt: toIsoDate(raw.publishedAt || raw.createdAt || Date.now()),
  };
}

async function fetchFromMicroCMS() {
  const domain = process.env.MICROCMS_SERVICE_DOMAIN;
  const apiKey = process.env.MICROCMS_API_KEY;
  if (!domain || !apiKey) return null;

  const contents = [];
  let offset = 0;
  const limit = 100;

  for (;;) {
    const url = `https://${domain}.microcms.io/api/v1/${ENDPOINT}?limit=${limit}&offset=${offset}&orders=-publishedAt`;
    const res = await fetch(url, {
      headers: { "X-MICROCMS-API-KEY": apiKey },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`microCMS API error ${res.status}: ${text}`);
    }
    const data = await res.json();
    const batch = Array.isArray(data.contents) ? data.contents : [];
    contents.push(...batch);
    if (contents.length >= (data.totalCount || contents.length) || batch.length === 0) {
      break;
    }
    offset += limit;
  }

  console.log(`Fetched ${contents.length} posts from microCMS (${domain}).`);
  return contents;
}

function loadFixtures() {
  const raw = JSON.parse(fs.readFileSync(FIXTURES, "utf8"));
  console.log(`Using ${raw.length} fixture posts (microCMS env not set or empty).`);
  return raw;
}

function leafSvg(transform) {
  return `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" fill="none">
        <g transform="${transform}">
          <path d="M40 72V22" stroke="#d5e4c4" stroke-width="2" stroke-linecap="round"/>
          <path d="M40 58c-9 .5-17 5-21 12 7 1.5 15-.5 21-4z" fill="#8fbc6a"/>
          <path d="M40 58c9 .5 17 5 21 12-7 1.5-15-.5-21-4z" fill="#6f9a52"/>
          <path d="M40 46c-10-1-18 3-23 11 8 2.5 16 .5 23-4z" fill="#9cc876"/>
          <path d="M40 46c10-1 18 3 23 11-8 2.5-16 .5-23-4z" fill="#7eab5e"/>
          <path d="M40 34c-9-2.5-16 1-20 8 6 3.5 13 3 20-1z" fill="#abd484"/>
          <path d="M40 34c9-2.5 16 1 20 8-6 3.5-13 3-20-1z" fill="#8fbc6a"/>
          <path d="M40 24c-6-4-10-3-12 1 3 4 8 5 12 2z" fill="#bee098"/>
          <path d="M40 24c6-4 10-3 12 1-3 4-8 5-12 2z" fill="#9cc876"/>
          <path d="M40 16c-3-6-2-11 2-12 4 3 5 8 2 14-1-.5-3-1-4-2z" fill="#d0ecad"/>
        </g>
      </svg>`;
}

function renderHeader({ active } = {}) {
  const blogClass = active === "blog" ? ' aria-current="page"' : "";
  return `<header class="site-header" id="top">
    <span class="header-leaf header-leaf--tl" aria-hidden="true">${leafSvg("rotate(-38 40 40)")}</span>
    <span class="header-leaf header-leaf--tr" aria-hidden="true">${leafSvg("rotate(38 40 40)")}</span>
    <span class="header-leaf header-leaf--bl" aria-hidden="true">${leafSvg("rotate(-38 40 40)")}</span>
    <span class="header-leaf header-leaf--br" aria-hidden="true">${leafSvg("rotate(38 40 40)")}</span>
    <div class="header-inner">
      <a class="logo" href="../index.html">
        <span class="logo-ornament" aria-hidden="true"></span>
        <span class="logo-text">${escapeHtml(SITE_NAME)}</span>
        <span class="logo-ornament" aria-hidden="true"></span>
      </a>
      <button class="nav-toggle" type="button" aria-label="メニューを開く" aria-expanded="false" aria-controls="site-nav">
        <span></span><span></span>
      </button>
      <nav class="site-nav" id="site-nav" aria-label="メインメニュー">
        <a href="../index.html#about"><span class="nav-num">01</span>お墓参り代行とは</a>
        <a href="../index.html#message"><span class="nav-num">02</span>メッセージ</a>
        <a href="../index.html#service"><span class="nav-num">03</span>サービス</a>
        <a href="../index.html#price"><span class="nav-num">04</span>料金</a>
        <a href="../index.html#contact"><span class="nav-num">05</span>お問合せ</a>
        <a href="./index.html"${blogClass}><span class="nav-num">06</span>ブログ</a>
      </nav>
    </div>
  </header>`;
}

function renderFooter() {
  return `<footer class="site-footer">
    <div class="footer-inner">
      <p class="footer-brand">${escapeHtml(SITE_NAME)}</p>
      <p class="footer-meta">岐阜県長良市長良丘1-2</p>
      <p class="footer-meta"><a href="tel:09034571149">090-3457-1149</a></p>
      <p class="footer-note">&copy; <span id="year"></span> ${escapeHtml(SITE_NAME)}. All rights reserved.</p>
    </div>
  </footer>`;
}

function headCommon({ title, description, canonicalPath, type, jsonLd }) {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title}｜${SITE_NAME}`;
  const desc = description || `${SITE_NAME}のお墓参り代行に関する情報をお届けします。`;
  const canonical = absoluteUrl(canonicalPath);
  const ogUrl = canonical;
  const canonicalTag = SITE_URL
    ? `<link rel="canonical" href="${escapeAttr(canonical)}" />`
    : "";
  const ogUrlTag = SITE_URL
    ? `<meta property="og:url" content="${escapeAttr(ogUrl)}" />`
    : "";

  return `<meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(fullTitle)}</title>
  <meta name="description" content="${escapeAttr(desc)}" />
  ${canonicalTag}
  <meta property="og:type" content="${escapeAttr(type)}" />
  <meta property="og:title" content="${escapeAttr(fullTitle)}" />
  <meta property="og:description" content="${escapeAttr(desc)}" />
  <meta property="og:site_name" content="${escapeAttr(SITE_NAME)}" />
  <meta property="og:locale" content="${escapeAttr(config.locale || "ja_JP")}" />
  ${ogUrlTag}
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;500;600&family=Zen+Kaku+Gothic+New:wght@400;500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../styles.css" />
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;
}

function renderListPage(posts) {
  const listUrl = absoluteUrl("/blog/");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `${SITE_NAME} ブログ`,
    description: `${SITE_NAME}のお墓参り代行に関するお役立ち情報。`,
    url: listUrl || undefined,
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      description: p.description,
      datePublished: p.publishedAt,
      url: absoluteUrl(`/blog/${p.slug}.html`) || undefined,
    })),
  };

  const items = posts.length
    ? posts
        .map(
          (p) => `<li>
          <a class="blog-item" href="./${escapeAttr(p.slug)}.html">
            <time class="blog-item-date" datetime="${escapeAttr(p.publishedAt)}">${escapeHtml(formatDateJa(p.publishedAt))}</time>
            <span class="blog-item-title">${escapeHtml(p.title)}</span>
            <span class="blog-item-lead">${escapeHtml(p.description)}</span>
          </a>
        </li>`
        )
        .join("\n        ")
    : `<li class="blog-empty">記事はまだありません。microCMS で公開すると、ここに表示されます。</li>`;

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  ${headCommon({
    title: `ブログ｜${SITE_NAME}`,
    description: `${SITE_NAME}のお墓参り代行に関するお役立ち情報・お知らせ。`,
    canonicalPath: "/blog/",
    type: "website",
    jsonLd,
  })}
</head>
<body class="page-blog">
  ${renderHeader({ active: "blog" })}
  <main>
    <section class="section blog-hero">
      <div class="section-inner">
        <p class="section-label">Blog</p>
        <h1>ブログ</h1>
        <p class="section-lead">お墓参り代行や供養に関する情報をお届けします。</p>
      </div>
    </section>
    <section class="section blog-list-section">
      <div class="section-inner">
        <ul class="blog-list">
        ${items}
        </ul>
      </div>
    </section>
  </main>
  ${renderFooter()}
  <script src="../script.js"></script>
</body>
</html>
`;
}

function renderPostPage(post, allPosts) {
  const pageUrl = absoluteUrl(`/blog/${post.slug}.html`);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    mainEntityOfPage: pageUrl || undefined,
    author: {
      "@type": "Organization",
      name: SITE_NAME,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
    },
  };

  const others = allPosts
    .filter((p) => p.slug !== post.slug)
    .slice(0, 3)
    .map(
      (p) =>
        `<li><a href="./${escapeAttr(p.slug)}.html">${escapeHtml(p.title)}</a></li>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  ${headCommon({
    title: post.title,
    description: post.description,
    canonicalPath: `/blog/${post.slug}.html`,
    type: "article",
    jsonLd,
  })}
  <meta property="article:published_time" content="${escapeAttr(post.publishedAt)}" />
</head>
<body class="page-blog page-blog-post">
  ${renderHeader({ active: "blog" })}
  <main>
    <article class="section blog-article">
      <div class="section-inner blog-article-inner">
        <p class="section-label">Blog</p>
        <p class="blog-article-meta">
          <time datetime="${escapeAttr(post.publishedAt)}">${escapeHtml(formatDateJa(post.publishedAt))}</time>
        </p>
        <h1>${escapeHtml(post.title)}</h1>
        <div class="blog-article-body">
          ${post.body}
        </div>
        <p class="blog-back"><a href="./index.html">ブログ一覧へ戻る</a></p>
        ${
          others
            ? `<aside class="blog-related" aria-label="ほかの記事">
          <h2>ほかの記事</h2>
          <ul>${others}</ul>
        </aside>`
            : ""
        }
      </div>
    </article>
  </main>
  ${renderFooter()}
  <script src="../script.js"></script>
</body>
</html>
`;
}

function renderSitemap(posts) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    { loc: absoluteUrl("/") || "/", lastmod: today, priority: "1.0" },
    { loc: absoluteUrl("/blog/") || "/blog/", lastmod: today, priority: "0.8" },
    ...posts.map((p) => ({
      loc: absoluteUrl(`/blog/${p.slug}.html`) || `/blog/${p.slug}.html`,
      lastmod: p.publishedAt.slice(0, 10),
      priority: "0.7",
    })),
  ];

  const body = urls
    .map(
      (u) => `  <url>
    <loc>${escapeHtml(u.loc)}</loc>
    <lastmod>${escapeHtml(u.lastmod)}</lastmod>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

function clearGeneratedPosts(keepSlugs) {
  const files = fs.readdirSync(BLOG_DIR);
  for (const file of files) {
    if (!file.endsWith(".html")) continue;
    if (file === "index.html") continue;
    const slug = file.replace(/\.html$/, "");
    if (!keepSlugs.has(slug)) {
      fs.unlinkSync(path.join(BLOG_DIR, file));
    }
  }
}

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  try {
    fs.copyFileSync(src, dest);
  } catch (err) {
    if (err.code === "EPERM" || err.code === "EACCES") {
      const data = fs.readFileSync(src);
      fs.writeFileSync(dest, data);
      return;
    }
    throw err;
  }
}

function copyDirHtml(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const file of fs.readdirSync(srcDir)) {
    if (!file.endsWith(".html")) continue;
    copyFile(path.join(srcDir, file), path.join(destDir, file));
  }
}

/** Vercel は outputDirectory=public を配信する */
function syncPublic() {
  const pub = path.join(ROOT, "public");
  try {
    fs.rmSync(pub, { recursive: true, force: true });
  } catch (err) {
    console.warn(`Could not fully clear public/ (${err.code || err.message}). Overwriting instead.`);
  }

  try {
    fs.mkdirSync(pub, { recursive: true });

    for (const file of ["index.html", "styles.css", "script.js", "robots.txt", "sitemap.xml"]) {
      const src = path.join(ROOT, file);
      if (fs.existsSync(src)) copyFile(src, path.join(pub, file));
    }

    const blogOut = path.join(pub, "blog");
    fs.mkdirSync(blogOut, { recursive: true });
    for (const file of fs.readdirSync(blogOut)) {
      if (!file.endsWith(".html")) continue;
      try {
        fs.unlinkSync(path.join(blogOut, file));
      } catch {
        /* ignore locked files */
      }
    }
    copyDirHtml(BLOG_DIR, blogOut);
    console.log("Synced site files to public/ for Vercel.");
  } catch (err) {
    console.warn(
      `Skipped local public/ sync (${err.code || err.message}). Vercel build will regenerate public/.`
    );
  }
}

async function main() {
  let rawPosts = await fetchFromMicroCMS();
  if (!rawPosts || rawPosts.length === 0) {
    if (process.env.MICROCMS_SERVICE_DOMAIN && process.env.MICROCMS_API_KEY) {
      console.warn("microCMS returned 0 posts. Falling back to fixtures.");
    }
    rawPosts = loadFixtures();
  }

  const posts = rawPosts
    .map(normalizePost)
    .filter(Boolean)
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  const keep = new Set(posts.map((p) => p.slug));
  clearGeneratedPosts(keep);

  fs.writeFileSync(path.join(BLOG_DIR, "index.html"), renderListPage(posts), "utf8");
  for (const post of posts) {
    fs.writeFileSync(
      path.join(BLOG_DIR, `${post.slug}.html`),
      renderPostPage(post, posts),
      "utf8"
    );
  }

  fs.writeFileSync(path.join(ROOT, "sitemap.xml"), renderSitemap(posts), "utf8");

  if (SITE_URL) {
    const robots = `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
    fs.writeFileSync(path.join(ROOT, "robots.txt"), robots, "utf8");
  }

  syncPublic();
  console.log(`Generated blog list + ${posts.length} posts + sitemap.xml`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
