import fs from 'fs';
import path from 'path';

const root = process.cwd();
const pub = path.join(root, 'public');

if (fs.existsSync(pub)) {
  fs.rmSync(pub, { recursive: true, force: true });
}
fs.mkdirSync(pub, { recursive: true });

// 1. Copy main web app
fs.copyFileSync(path.join(root, 'winter_arc.html'), path.join(pub, 'index.html'));
fs.copyFileSync(path.join(root, 'winter_arc.html'), path.join(pub, 'arc.html'));
fs.copyFileSync(path.join(root, 'winter_arc.html'), path.join(pub, 'winter-arc.html'));

// 2. Legal pages
if (fs.existsSync(path.join(root, 'templates', 'terms.html'))) {
  fs.copyFileSync(path.join(root, 'templates', 'terms.html'), path.join(pub, 'terms.html'));
}
if (fs.existsSync(path.join(root, 'templates', 'privacy.html'))) {
  fs.copyFileSync(path.join(root, 'templates', 'privacy.html'), path.join(pub, 'privacy.html'));
}
if (fs.existsSync(path.join(root, 'templates', 'faq.html'))) {
  fs.copyFileSync(path.join(root, 'templates', 'faq.html'), path.join(pub, 'faq.html'));
}

// 3. Static assets
const pubStatic = path.join(pub, 'static');
const srcStatic = path.join(root, 'static');
if (fs.existsSync(srcStatic)) {
  fs.cpSync(srcStatic, pubStatic, { recursive: true });
  ['favicon.ico', 'icon.png', 'apple-touch-icon.png'].forEach((f) => {
    const srcFile = path.join(srcStatic, f);
    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, path.join(pub, f));
    }
  });
}

// 4. Sitemap & Robots
if (fs.existsSync(path.join(root, 'sitemap.xml'))) {
  fs.copyFileSync(path.join(root, 'sitemap.xml'), path.join(pub, 'sitemap.xml'));
}
if (fs.existsSync(path.join(root, 'robots.txt'))) {
  fs.copyFileSync(path.join(root, 'robots.txt'), path.join(pub, 'robots.txt'));
}

// 5. Cloudflare Pages headers & routes
fs.writeFileSync(
  path.join(pub, '_headers'),
  `/*\n  X-Content-Type-Options: nosniff\n  X-Frame-Options: SAMEORIGIN\n  Referrer-Policy: strict-origin-when-cross-origin\n\n/index.html\n  Cache-Control: no-cache, no-store, must-revalidate\n\n/arc.html\n  Cache-Control: no-cache, no-store, must-revalidate\n\n/static/*\n  Cache-Control: public, max-age=86400, stale-while-revalidate=604800\n`
);

fs.writeFileSync(
  path.join(pub, '_routes.json'),
  JSON.stringify(
    {
      version: 1,
      include: ['/api/*', '/auth/*', '/health', '/admin', '/admin/*'],
      exclude: ['/static/*', '/sitemap.xml', '/robots.txt', '/favicon.ico'],
    },
    null,
    2
  )
);

console.log('Successfully built clean public/ directory!');
