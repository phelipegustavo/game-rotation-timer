// Service worker: precaches the whole app so it works offline.
// There is no build step (docs/adr/0002-no-build-step.md), so when you add, rename or change
// a file, update PRECACHE and bump CACHE_VERSION.

const CACHE_VERSION = 'v2';
const CACHE_NAME = `rotation-timer-${CACHE_VERSION}`;

const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './styles/tokens.css',
  './styles/base.css',
  './styles/components.css',
  './fonts/press-start-2p-latin.woff2',
  './fonts/vt323-latin.woff2',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './src/main.js',
  './src/strings.js',
  './src/domain/game.js',
  './src/domain/roster.js',
  './src/domain/settings.js',
  './src/platform/audio.js',
  './src/platform/haptics.js',
  './src/platform/storage.js',
  './src/platform/wake-lock.js',
  './src/ui/confetti.js',
  './src/ui/dom.js',
  './src/ui/icons.js',
  './src/ui/overlays.js',
  './src/ui/pixel-clock.js',
  './src/ui/screens/game.js',
  './src/ui/screens/settings.js',
  './src/ui/screens/setup.js',
  './src/ui/screens/standings.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      // `cache: 'reload'` bypasses the HTTP cache, so a new version never precaches stale files.
      .then((cache) => cache.addAll(PRECACHE.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

// Cache first: everything the app needs is precached and versioned.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cached) => cached ?? fetch(event.request)),
  );
});
