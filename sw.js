// Fibraco Field: keeps the app on the phone so it opens with no signal.
const CACHE = "fibraco-field-1794462795";
const SHELL = ["./", "./index.html", "./app.css?v=1794462795", "./js/store.js?v=1794462795", "./js/app.js?v=1794462795", "./js/live.js?v=1794462795", "./js/pdf.js?v=1794462795", "./js/lib/html2canvas.min.js?v=1794462795", "./js/lib/jspdf.umd.min.js?v=1794462795", "./manifest.webmanifest", "./setup.bin", "./icons/logo.png", "./icons/icon-192.png", "./icons/icon-512.png"];
// Wanro 29 Oct: Bioseco's example photos and report pictures are kept on the phone too, so they show at a turbine with no signal
const BPS_PICS = ["cover", "drawA", "drawB", "logo", "wiring", "ex-p1", "ex-p6", "ex-p7", "ex-p8", "ex-p11", "ex-p12", "ex-p15", "ex-p16", "ex-pc", "ex-s1", "ex-s2", "ex-s3", "ex-s4", "ex-s14"].map(n => `./icons/bps/${n}.jpg`);
// Wanro 8 Nov: an update always takes the app fresh from the server, never the phone's own 10 minute copy. Two updates close
// together had left phones on the older app. If the page that comes back is not this version, the update waits and tries again.
self.addEventListener("install", e => e.waitUntil((async () => {
  const c = await caches.open(CACHE);
  await c.addAll(SHELL.map(u => new Request(u, { cache: "reload" })));
  const v = CACHE.replace("fibraco-field-", ""), page = await (await c.match("./index.html")).text();
  if (!page.includes("v=" + v)) { await caches.delete(CACHE); throw new Error("old page came back, try again later"); }
  await Promise.all(BPS_PICS.map(u => c.add(u).catch(() => {})));
  await self.skipWaiting();
})()));
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("fibraco-field-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  // voice engine (about 100 MB): its own cache that survives app updates, so it downloads only once
  if (u.pathname.includes("/voice/")) { e.respondWith(caches.open("fibraco-voice-1").then(c => c.match(e.request).then(hit => hit || fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => new Response("", { status: 404 }))))); return; }
  // setup file: fresh when online, cached copy when offline
  if (u.pathname.endsWith("/setup.bin")) { e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put("./setup.bin", c)); return r; }).catch(() => caches.match("./setup.bin"))); return; }
  const net = e.request.mode === "navigate" ? e.request : new Request(e.request, { cache: "no-cache" }); // anything not kept yet: ask the server, never an old copy
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(net).then(r => { if (r.ok && !u.pathname.includes("/d/")) { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); } return r; }).catch(() => caches.match("./index.html"))));
});
