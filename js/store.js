// Fibraco Field: encrypted local store and sync.
// Everything is scrambled on the phone with the Fibraco key before it is saved or sent.
// The server only ever sees opaque ids, scrambled data and timestamps.
"use strict";
const Store = (() => {
  const enc = new TextEncoder(), dec = new TextDecoder();
  const b64 = buf => { let s = ""; const a = new Uint8Array(buf); for (let i = 0; i < a.length; i += 0x8000) s += String.fromCharCode.apply(null, a.subarray(i, i + 0x8000)); return btoa(s); };
  const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const b64url = buf => b64(buf).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const unb64url = s => unb64(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));

  let K = null, HK = null, FK = null, TOKEN = null, DEV = null, CONF = null, ME = null;
  const mem = new Map();          // id -> {obj, kind, at, dirty}
  const listeners = new Set();
  let pendingLocks = [];
  let db = null, syncing = false, lastPull = "1970-01-01T00:00:00Z", online = navigator.onLine;

  // ---------- IndexedDB ----------
  function idb() {
    if (db) return Promise.resolve(db);
    return new Promise((res, rej) => {
      const r = indexedDB.open("fibraco-field", 1);
      r.onupgradeneeded = () => { const d = r.result; d.createObjectStore("recs", { keyPath: "hid" }); d.createObjectStore("meta"); };
      r.onsuccess = () => { db = r.result; res(db); };
      r.onerror = () => rej(r.error);
    });
  }
  const tx = (store, mode, fn) => idb().then(d => new Promise((res, rej) => { const t = d.transaction(store, mode); const s = t.objectStore(store); const out = fn(s); t.oncomplete = () => res(out instanceof IDBRequest ? out.result : out); t.onerror = () => rej(t.error); }));
  const metaGet = k => tx("meta", "readonly", s => s.get(k));
  const metaSet = (k, v) => tx("meta", "readwrite", s => s.put(v, k));
  const metaDel = k => tx("meta", "readwrite", s => s.delete(k));
  const allRecs = () => tx("recs", "readonly", s => s.getAll());
  const putRec = r => tx("recs", "readwrite", s => s.put(r));

  // ---------- crypto ----------
  async function importKey(raw) {
    K = await crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
    HK = await crypto.subtle.importKey("raw", raw, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  }
  async function seal(obj) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, K, enc.encode(JSON.stringify(obj)));
    return { iv: b64(iv), data: b64(ct) };
  }
  async function open(iv, data) {
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(iv) }, K, unb64(data));
    return JSON.parse(dec.decode(pt));
  }
  async function openBytes(buf) { // project files: 12 byte iv then ciphertext, opened with the files key
    if (!FK) throw new Error("files key missing");
    const a = new Uint8Array(buf);
    return crypto.subtle.decrypt({ name: "AES-GCM", iv: a.slice(0, 12) }, FK, a.slice(12));
  }
  // files key = link key + a value the server only gives to approved devices
  async function setFiles(raw) { FK = await crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["decrypt"]); }
  async function deriveFiles(fsalt) { const raw = await crypto.subtle.sign("HMAC", HK, enc.encode("files|" + fsalt)); await setFiles(raw); await metaSet("fk", await seal(b64(raw))); }
  const newDevice = () => b64url(crypto.getRandomValues(new Uint8Array(24)));
  async function deviceLabel() {
    const ua = navigator.userAgent; let model = "";
    let osv = "";
    try { if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) { const v = await navigator.userAgentData.getHighEntropyValues(["model", "platformVersion"]); model = v.model || ""; osv = (v.platformVersion || "").split(".")[0]; } } catch (e) {}
    if (!osv) { const m = ua.match(/Android ([\d]+)/) || ua.match(/OS (\d+)_/); if (m) osv = m[1]; }
    let os = /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iPhone" : /Windows/.test(ua) ? "Windows" : /Mac OS/.test(ua) ? "Mac" : /Linux/.test(ua) ? "Linux" : "Device";
    if (osv && (os === "Android" || os === "iPhone")) os += " " + osv;
    if (!model) { const m = ua.match(/Android [\d.]+; ([^;)]+)/); if (m && m[1] !== "K") model = m[1].replace(/ Build.*/, ""); }
    const br = /Edg\//.test(ua) ? "Edge" : /SamsungBrowser/.test(ua) ? "Samsung Internet" : /Firefox/.test(ua) ? "Firefox" : /Chrome/.test(ua) ? "Chrome" : /Safari/.test(ua) ? "Safari" : "Browser";
    return [os, model, br].filter(Boolean).join(", ").slice(0, 120);
  }
  async function hid(id) { const s = await crypto.subtle.sign("HMAC", HK, enc.encode(id)); return b64url(s).slice(0, 32); }

  // PIN wraps the key and token on the phone
  async function pinKey(pin, salt) {
    const base = await crypto.subtle.importKey("raw", enc.encode(pin), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 150000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  }
  async function wrap(pin, secret) {
    const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
    const pk = await pinKey(pin, salt);
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, pk, enc.encode(JSON.stringify(secret)));
    return { salt: b64(salt), iv: b64(iv), data: b64(ct) };
  }
  async function unwrap(pin, w) {
    const pk = await pinKey(pin, unb64(w.salt));
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(w.iv) }, pk, unb64(w.data));
    return JSON.parse(dec.decode(pt));
  }

  // ---------- fingerprint ----------
  // The phone's fingerprint (a passkey in the phone's own lock) gives a secret that only comes out after a
  // successful fingerprint. That secret locks a second copy of the key and token. Without it, the PIN.
  let CUR = null;
  const BIO_SALT = crypto.subtle.digest("SHA-256", enc.encode("fibraco-field-fingerprint-v1")).then(b => new Uint8Array(b));
  async function bioKey(out) {
    const base = await crypto.subtle.importKey("raw", out, "HKDF", false, ["deriveKey"]);
    return crypto.subtle.deriveKey({ name: "HKDF", hash: "SHA-256", salt: new Uint8Array(32), info: enc.encode("fibraco bio wrap") }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  }
  async function bioGet(credId) {
    const a = await navigator.credentials.get({ publicKey: { challenge: crypto.getRandomValues(new Uint8Array(32)), allowCredentials: [{ type: "public-key", id: credId }],
      userVerification: "required", timeout: 60000, extensions: { prf: { eval: { first: await BIO_SALT } } } } });
    const r = a && a.getClientExtensionResults ? a.getClientExtensionResults() : {};
    const out = r.prf && r.prf.results && r.prf.results.first; if (!out) { const e = new Error("noprf"); e.noprf = true; throw e; }
    return out;
  }

  // ---------- server ----------
  async function rpc(fn, body) {
    const r = await fetch(`${CONF.url}/rest/v1/rpc/${fn}`, { method: "POST", headers: { "Content-Type": "application/json", apikey: CONF.anon, Authorization: `Bearer ${CONF.anon}` }, body: JSON.stringify(Object.assign({ p_token: TOKEN, p_device: DEV }, body)) });
    if (!r.ok) { const t = await r.text(); const e = new Error(`${fn} ${r.status}: ${t.slice(0, 200)}`); e.status = r.status; throw e; }
    return r.status === 204 ? null : r.json();
  }

  // ---------- public ----------
  const api = {
    online: () => online,
    me: () => ME,
    hasLink() { const h = new URLSearchParams(location.hash.slice(1)); return h.get("k") && h.get("t"); },
    async hasSaved() { return !!(await metaGet("wrapped")); },
    // first open from the personal link: remember key and token behind a PIN
    async setupFromLink(pin) {
      const h = new URLSearchParams(location.hash.slice(1));
      // the device id survives a PIN reset on the same phone, so it stays approved
      let d = await metaGet("dev"); if (!d) { d = newDevice(); await metaSet("dev", d); }
      const secret = { k: h.get("k"), t: h.get("t"), d };
      await metaSet("wrapped", await wrap(pin, secret)); await metaDel("bio").catch(() => {});
      history.replaceState(null, "", location.pathname + location.search);
      return api.unlockWith(secret);
    },
    async unlock(pin) {
      const w = await metaGet("wrapped");
      let secret;
      try { secret = await unwrap(pin, w); } catch (e) { const n = ((await metaGet("fails")) || 0) + 1; await metaSet("fails", n); return n; }
      await metaSet("fails", 0);
      if (!secret.d) { secret.d = (await metaGet("dev")) || newDevice(); await metaSet("dev", secret.d); await metaSet("wrapped", await wrap(pin, secret)); }
      return api.unlockWith(secret);
    },
    async unlockWith(secret) {
      CUR = secret;
      await importKey(unb64url(secret.k)); TOKEN = secret.t; DEV = secret.d;
      const fk = await metaGet("fk"); if (fk) { try { await setFiles(unb64(await open(fk.iv, fk.data))); } catch (e) {} }
      // cached member info lets the app open with no signal
      const cachedMe = await metaGet("me"); if (cachedMe) ME = await open(cachedMe.iv, cachedMe.data).catch(() => null);
      lastPull = (await metaGet("lastPull")) || lastPull;
      for (const r of await allRecs()) {
        try { mem.set(await open(r.idIv, r.idData), await open(r.iv, r.data)); } catch (e) { /* not ours */ }
      }
      const lk = await metaGet("locks"); if (lk) { try { pendingLocks = (await open(lk.iv, lk.data)).filter(x => x && x.ids); } catch (e) {} }
      return true;
    },
    async forget() { await metaDel("wrapped"); },
    async bioAvailable() { try { return !!(window.PublicKeyCredential && navigator.credentials && await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()); } catch (e) { return false; } },
    async hasBio() { return !!(await metaGet("bio").catch(() => null)); },
    async bioOff() { await metaDel("bio"); },
    async bioEnroll(name) {
      if (!CUR) throw new Error("not unlocked");
      const c = await navigator.credentials.create({ publicKey: { rp: { name: "Fibraco Field" }, user: { id: crypto.getRandomValues(new Uint8Array(16)), name: name, displayName: name },
        challenge: crypto.getRandomValues(new Uint8Array(32)), pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
        authenticatorSelection: { authenticatorAttachment: "platform", residentKey: "preferred", userVerification: "required" }, timeout: 60000,
        extensions: { prf: { eval: { first: await BIO_SALT } } } } });
      const r = c.getClientExtensionResults ? c.getClientExtensionResults() : {};
      if (!r.prf || r.prf.enabled === false) { const e = new Error("noprf"); e.noprf = true; throw e; }
      const out = (r.prf.results && r.prf.results.first) || await bioGet(c.rawId);
      const key = await bioKey(out), iv = crypto.getRandomValues(new Uint8Array(12));
      const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(JSON.stringify(CUR)));
      await metaSet("bio", { cred: b64(c.rawId), iv: b64(iv), data: b64(ct) });
      return true;
    },
    async bioUnlock() {
      const b = await metaGet("bio"); if (!b) return false;
      const key = await bioKey(await bioGet(unb64(b.cred)));
      const secret = JSON.parse(dec.decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(b.iv) }, key, unb64(b.data))));
      await metaSet("fails", 0);
      return api.unlockWith(secret);
    },
    async changePin(oldPin, newPin) {
      let secret; try { secret = await unwrap(oldPin, await metaGet("wrapped")); } catch (e) { return false; }
      await metaSet("wrapped", await wrap(newPin, secret)); return true;
    },
    async loadSetup(url) {
      // encrypted setup file shipped with the app: projects, teams, documents
      const r = await fetch(url, { cache: "no-cache" }).catch(() => null);
      let buf;
      if (r && r.ok) { buf = await r.arrayBuffer(); await metaSet("setup", b64(buf)); }
      else { const s = await metaGet("setup"); if (!s) throw new Error("setup unavailable"); buf = unb64(s).buffer; }
      return JSON.parse(dec.decode(await openBytes(buf)));
    },
    async fileURL(url, type) { // encrypted drawing or document from the app folder
      const cache = await caches.open("fibraco-enc").catch(() => null);
      let res = cache && await cache.match(url);
      if (!res) { res = await fetch(url); if (cache && res.ok) await cache.put(url, res.clone()); }
      const pt = await openBytes(await res.arrayBuffer());
      return URL.createObjectURL(new Blob([pt], { type: type || "image/jpeg" }));
    },
    // keep drawings on the phone ahead of time, so they open with no signal (still encrypted in the cache)
    async prefetch(urls) {
      const cache = await caches.open("fibraco-enc").catch(() => null); if (!cache) return 0;
      let n = 0;
      for (const u of urls) { try { if (await cache.match(u)) { n++; continue; } if (!navigator.onLine) continue; const r = await fetch(u); if (r.ok) { await cache.put(u, r); n++; } } catch (e) {} }
      return n;
    },
    async cachedCount(urls) { const cache = await caches.open("fibraco-enc").catch(() => null); if (!cache) return 0; let n = 0; for (const u of urls) if (await cache.match(u).catch(() => null)) n++; return n; },
    config(c) { CONF = c; },
    hasFiles: () => !!FK,
    async whoami() {
      const r = await rpc("whoami", { p_label: await deviceLabel() });
      const row = Array.isArray(r) ? r[0] : r;
      if (!row) throw new Error("link not active");
      ME = { member: row.member_id, write: row.can_write, admin: row.is_admin, status: row.status };
      if (row.status === "active" && row.fsalt) await deriveFiles(row.fsalt);
      if (row.status === "active") await metaSet("me", await seal(ME));
      return ME;
    },
    // wipe everything this app kept on the device (used when the office removes a device)
    async wipe(keepDevice) {
      const dev = keepDevice ? await metaGet("dev").catch(() => null) : null;
      mem.clear(); K = HK = FK = TOKEN = DEV = ME = null;
      try { if (db) db.close(); db = null; } catch (e) {}
      await new Promise(res => { const r = indexedDB.deleteDatabase("fibraco-field"); r.onsuccess = r.onerror = r.onblocked = () => res(); });
      try { for (const k of await caches.keys()) await caches.delete(k); } catch (e) {}
      if (dev) await metaSet("dev", dev); // same phone stays approved when the man sets it up again
    },
    // office only
    listDevices: () => rpc("list_devices", {}),
    setDevice: (member, dev, status) => rpc("set_device", { p_member: member, p_dev: dev, p_status: status }),
    // kept on this phone only, scrambled, never sent to the server
    async keepLocal(k, v) { await metaSet("loc_" + k, v == null ? null : await seal(v)); },
    async readLocal(k) { const b = await metaGet("loc_" + k).catch(() => null); if (!b) return null; try { return await open(b.iv, b.data); } catch (e) { return null; } },
    isDirty(id) { const v = mem.get(id); return !!(v && v.dirty); },
    removeDevice: (member, dev) => rpc("remove_device", { p_member: member, p_dev: dev }),
    // reports to the client: the phone hands the PDFs to the server's send-report piece, which emails them from reports@fibraco.co.za
    async sendReport(body) {
      const r = await fetch(`${CONF.url}/functions/v1/send-report`, { method: "POST", headers: { "Content-Type": "application/json", apikey: CONF.anon, Authorization: `Bearer ${CONF.anon}` }, body: JSON.stringify(Object.assign({ token: TOKEN, device: DEV }, body)) });
      const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch (e) {}
      if (!r.ok) { const e = new Error((j && j.error) || `send-report ${r.status}`); e.status = r.status; throw e; }
      return j;
    },
    setMember: (member, active) => rpc("set_member", { p_member: member, p_active: active }),
    get(id) { const v = mem.get(id); return v ? v.obj : undefined; },
    list(prefix) { const out = []; for (const [id, v] of mem) if (id.startsWith(prefix)) out.push([id, v.obj]); return out; },
    metaFor: null, // set by the app: who may see this record, and whether others may update it
    async put(id, obj, kind = "r", meta) {
      const at = new Date().toISOString();
      meta = meta || (api.metaFor ? api.metaFor(id, obj, kind) : null) || {};
      mem.set(id, { obj, kind, at, dirty: 1, meta });
      const box = await seal({ obj, kind, at, dirty: 1, meta }), idBox = await seal(id);
      await putRec({ hid: await hid(id), id: undefined, idIv: idBox.iv, idData: idBox.data, iv: box.iv, data: box.data, kind, dirty: 1 });
      api.kick();
    },
    async photo(id) { // photos are pulled only when someone opens them
      const v = mem.get(id); if (v) return v.obj;
      if (!online) return null;
      const rows = await rpc("get_by_ids", { p_ids: [await hid(id)] }).catch(() => []);
      for (const r of rows || []) { const o = await open(r.iv, r.data); mem.set(id, { obj: o.obj, kind: o.kind, at: o.at, dirty: 0 }); return o.obj; }
      return null;
    },
    on(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    async lock(ids, op = "lock") { pendingLocks.push({ op, ids }); await metaSet("locks", await seal(pendingLocks)); api.kick(); },
    // check the PIN without changing anything (used when he signs with his saved signature)
    async checkPin(pin) {
      try { await unwrap(pin, await metaGet("wrapped")); await metaSet("fails", 0); return true; }
      catch (e) { const n = ((await metaGet("fails")) || 0) + 1; await metaSet("fails", n); return n; }
    },
    pending() { let n = 0; for (const v of mem.values()) if (v.dirty) n++; return n; },
    async unsentLocked() { try { return (await allRecs()).filter(r => r.dirty).length; } catch (e) { return 0; } },
    kick() { clearTimeout(api._t); api._t = setTimeout(() => api.sync().catch(() => {}), 400); },
    async sync() {
      if (syncing || !CONF || !TOKEN) return;
      if (!navigator.onLine) { online = false; return; }
      syncing = true;
      try {
        // push what this phone changed
        const recs = (await allRecs()).filter(r => r.dirty);
        const refused = [];
        for (let i = 0; i < recs.length; i += 20) {
          const batch = recs.slice(i, i + 20);
          const rows = [], sentAt = new Map();
          for (const r of batch) {
            const id = await open(r.idIv, r.idData), v = mem.get(id);
            if (!v) continue;
            sentAt.set(r.hid, v.at);
            const box = await seal({ id, obj: v.obj, kind: v.kind, at: v.at });
            const meta = v.meta || {};
            const tags = meta.tags ? await Promise.all(meta.tags.map(t => hid("tag|" + t))) : null;
            rows.push({ id: r.hid, kind: v.kind === "ph" ? "ph" : v.kind === "fb" ? "fb" : "r", iv: box.iv, data: box.data, shared: !!meta.shared, tags });
          }
          const res = rows.length ? await rpc("put_records", { p_rows: rows }) : null;
          const rejected = new Set((res && res.rejected) || []);
          for (const r of batch) {
            const id = await open(r.idIv, r.idData), v = mem.get(id); if (!v) continue;
            // typed again while this send was on its way: keep it waiting to send, never mark the newer edit as sent
            if (!sentAt.has(r.hid) || v.at !== sentAt.get(r.hid) || !v.dirty) { if (rejected.has(r.hid)) refused.push([r.hid, id]); continue; }
            v.dirty = 0; const box = await seal({ obj: v.obj, kind: v.kind, at: v.at, dirty: 0, meta: v.meta });
            await putRec(Object.assign(r, { iv: box.iv, data: box.data, dirty: 0 }));
            if (rejected.has(r.hid)) refused.push([r.hid, id]);
          }
        }
        let changed = [];
        // the server refused a change (signed and locked, or not this man's work): take the server's copy back
        if (refused.length) {
          const rows = await rpc("get_by_ids", { p_ids: refused.slice(0, 50).map(x => x[0]) }).catch(() => []);
          for (const row of rows || []) {
            let o; try { o = await open(row.iv, row.data); } catch (e) { continue; }
            mem.set(o.id, { obj: o.obj, kind: o.kind, at: o.at, dirty: 0 });
            const box = await seal({ obj: o.obj, kind: o.kind, at: o.at, dirty: 0 }), idBox = await seal(o.id);
            await putRec({ hid: row.id, idIv: idBox.iv, idData: idBox.data, iv: box.iv, data: box.data, kind: o.kind, dirty: 0 });
            changed.push(o.id);
          }
          listeners.forEach(fn => fn([], "refused", refused.map(x => x[1])));
        }
        // locks and unlocks, in the order they were asked for
        while (pendingLocks.length) {
          const x = pendingLocks[0], fn = { lock: "lock_records", own: "lock_own_records", unlock: "unlock_records" }[x.op] || "lock_records";
          try { await rpc(fn, { p_ids: await Promise.all(x.ids.map(hid)) }); }
          catch (e) { if (!e.status || e.status >= 500) break; } // no signal: try again next time. Refused: drop it, so it never blocks the sync.
          pendingLocks.shift(); await metaSet("locks", await seal(pendingLocks));
        }
        // pull what others changed
        for (;;) {
          const rows = await rpc("get_records", { p_since: lastPull, p_kinds: ME && ME.admin ? ["r", "fb"] : ["r"] });
          if (!rows || !rows.length) break;
          for (const r of rows) {
            lastPull = r.updated_at > lastPull ? r.updated_at : lastPull;
            let o; try { o = await open(r.iv, r.data); } catch (e) { continue; }
            const local = mem.get(o.id);
            if (local && local.at > o.at) continue; // this phone has a newer copy (sent or still waiting): it wins
            if (local && local.dirty) continue; // a change on this phone still waiting to send: it goes first, the server decides
            if (local && local.at === o.at) continue; // the same version we already have (often our own save coming back)
            mem.set(o.id, { obj: o.obj, kind: o.kind, at: o.at, dirty: 0 });
            const box = await seal({ obj: o.obj, kind: o.kind, at: o.at, dirty: 0 }), idBox = await seal(o.id);
            await putRec({ hid: r.id, idIv: idBox.iv, idData: idBox.data, iv: box.iv, data: box.data, kind: o.kind, dirty: 0 });
            changed.push(o.id);
          }
          await metaSet("lastPull", lastPull);
          if (rows.length < 500) break;
        }
        online = true;
        if (changed.length) listeners.forEach(fn => fn(changed));
        listeners.forEach(fn => fn([], "synced"));
      } catch (e) {
        online = navigator.onLine;
        listeners.forEach(fn => fn([], /device not approved|not allowed/.test(e.message) ? "denied" : "error", e));
      } finally { syncing = false; }
    },
    // admin only: the office
    dump() { const o = {}; for (const [id, v] of mem) if (v.kind !== "ph") o[id] = v.obj; return o; },
    _b64: { b64, unb64, b64url, unb64url }
  };
  addEventListener("online", () => { online = true; api.kick(); });
  addEventListener("offline", () => { online = false; listeners.forEach(fn => fn([], "offline")); });
  return api;
})();
