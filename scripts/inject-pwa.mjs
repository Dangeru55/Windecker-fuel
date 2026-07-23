// Post-export step: Expo's web export only emits a <link rel="icon"> favicon,
// so "Add to Home Screen" on iOS/Android has no proper icon to use. This copies
// the PWA/Apple icons + manifest into dist/ and injects the required <link>/meta
// tags into the generated index.html. Runs in the Docker build after
// `expo export`, so it re-applies on every rebuild (the generated HTML is
// overwritten each time and cannot be hand-edited).

import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const pwa = join(root, 'pwa');

const assets = [
  'apple-touch-icon.png',
  'pwa-192.png',
  'pwa-512.png',
  'pwa-maskable-512.png',
  'manifest.webmanifest',
  // `serve` (the Dockerfile's static server) reads this from the served
  // directory to set Cache-Control per file. Without it, index.html has no
  // caching directive at all, and iOS caches a standalone (home-screen) app's
  // shell aggressively -- a redeploy can go unseen for a long time because
  // there's no browser reload affordance to force a refetch. The hashed JS/CSS
  // bundles are safe to cache forever; only the un-hashed index.html that
  // references them needs to always be fetched fresh.
  'serve.json',
];

for (const f of assets) copyFileSync(join(pwa, f), join(dist, f));

const indexPath = join(dist, 'index.html');
let html = readFileSync(indexPath, 'utf8');

// Idempotent: bail if we've already injected (defensive against double-runs).
if (!html.includes('apple-touch-icon')) {
  const tags = [
    '<link rel="apple-touch-icon" href="/apple-touch-icon.png" />',
    '<link rel="manifest" href="/manifest.webmanifest" />',
    '<meta name="apple-mobile-web-app-capable" content="yes" />',
    '<meta name="apple-mobile-web-app-status-bar-style" content="default" />',
    '<meta name="apple-mobile-web-app-title" content="Windecker Fuel" />',
    '<meta name="theme-color" content="#0C8686" />',
    // Belt-and-suspenders alongside serve.json's Cache-Control header — some
    // caching layers key off this meta tag independently of HTTP headers.
    '<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />',
  ].join('');
  html = html.replace('</head>', tags + '</head>');
  writeFileSync(indexPath, html);
  console.log('inject-pwa: added apple-touch-icon + manifest to index.html');
} else {
  console.log('inject-pwa: tags already present, skipped');
}

// Expo's viewport tag has no viewport-fit=cover, so `env(safe-area-inset-*)`
// resolves to 0 everywhere -- including in standalone (home-screen) mode on
// iOS, where the bottom tab bar sits under the home-indicator area and the app
// can't tell. Without this, the safe-area padding in RootNavigator does nothing.
const oldViewport = /<meta name="viewport"[^>]*>/;
const newViewport =
  '<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />';
if (oldViewport.test(html) && !html.includes('viewport-fit=cover')) {
  html = html.replace(oldViewport, newViewport);
  writeFileSync(indexPath, html);
  console.log('inject-pwa: added viewport-fit=cover');
}
