// Fibraco Field: keeps the app on the phone so it opens with no signal.
const CACHE = "fibraco-field-1793090677";
const SHELL = ["./", "./index.html", "./app.css?v=1793090677", "./js/store.js?v=1793090677", "./js/app.js?v=1793090677", "./js/pdf.js?v=1793090677", "./js/lib/html2canvas.min.js?v=1793090677", "./js/lib/jspdf.umd.min.js?v=1793090677", "./manifest.webmanifest", "./setup.bin", "./icons/logo.png", "./icons/icon-192.png", "./icons/icon-512.png"];
self.addEventListener("install", e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("fibraco-field-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  // setup file: fresh when online, cached copy when offline
  if (u.pathname.endsWith("/setup.bin")) { e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put("./setup.bin", c)); return r; }).catch(() => caches.match("./setup.bin"))); return; }
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => { if (r.ok && !u.pathname.includes("/d/")) { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); } return r; }).catch(() => caches.match("./index.html"))));
});
