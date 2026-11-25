import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';
import {
  PUBLIC_SEO_ROUTES,
  generateRobotsTxt,
  generateSitemapXml,
  renderRouteHtmlWithSeo,
  resolveCanonicalOrigin,
} from './src/utils/seo';

export default defineConfig(() => {
  const configuredBuildSiteUrl = process.env.VITE_SITE_URL || process.env.URL || '';

  return {
    define: {
      __NETLIFY_SITE_URL__: JSON.stringify(configuredBuildSiteUrl),
    },
    plugins: [
      react(),
      tailwindcss(),
      // Copies src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." (e.g. generate_image output) still resolve
      // in production builds. Do not remove.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const srcAssets = path.resolve(__dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }
        },
      },
      // Generates production sitemap.xml, robots.txt, and per-route static HTML files
      // (including noindex protection on /admin) using VITE_SITE_URL or Netlify's built-in URL.
      {
        name: 'generate-seo-artifacts',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const indexHtmlPath = path.resolve(distDir, 'index.html');
          if (!fs.existsSync(distDir) || !fs.existsSync(indexHtmlPath)) {
            return;
          }

          const siteOrigin = resolveCanonicalOrigin(configuredBuildSiteUrl);
          const buildDate = new Date().toISOString().slice(0, 10);

          fs.writeFileSync(
            path.resolve(distDir, 'sitemap.xml'),
            generateSitemapXml(siteOrigin, buildDate),
            'utf8'
          );
          fs.writeFileSync(
            path.resolve(distDir, 'robots.txt'),
            generateRobotsTxt(siteOrigin),
            'utf8'
          );

          const baseHtml = fs.readFileSync(indexHtmlPath, 'utf8');
          fs.writeFileSync(
            indexHtmlPath,
            renderRouteHtmlWithSeo(baseHtml, '/', siteOrigin),
            'utf8'
          );

          for (const entry of PUBLIC_SEO_ROUTES) {
            if (entry.route === '/') continue;
            const slug = entry.route.replace(/^\/+/, '');
            const routeDir = path.resolve(distDir, slug);
            fs.mkdirSync(routeDir, {recursive: true});
            fs.writeFileSync(
              path.resolve(routeDir, 'index.html'),
              renderRouteHtmlWithSeo(baseHtml, entry.route, siteOrigin),
              'utf8'
            );
          }

          // Emit /admin/index.html with explicit noindex, nofollow, noarchive metadata
          const adminDir = path.resolve(distDir, 'admin');
          fs.mkdirSync(adminDir, {recursive: true});
          fs.writeFileSync(
            path.resolve(adminDir, 'index.html'),
            renderRouteHtmlWithSeo(baseHtml, '/admin', siteOrigin),
            'utf8'
          );
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
