
(() => {
const LOGO = "icons/logo.png";
let CREW = [], USERS = [], ROLE = {}, STAFF = [], PROJECTS = [], PEOPLE = [];
const DESIGNATIONS = ["Project Manager", "Quality Control", "Site Manager", "Technician", "Assistant", "SCADA Engineer", "SCADA Assistance"];
const PLANT = ["Double Cab Pickup"];
const EQUIPMENT = ["FOC - OTDR Test Machine", "FOC - OLTS Test Machine", "FOC - Light Source / FOC", "FOC - Splicing Machine", "Hand Tools for FOC and CAT Cable"];
const STD = [["m","CABLE INSTALLATION"],["ea","GLAND INSTALLATION"],["ea","PATCH PANEL INSTALLATION"],["ea","DIN-RAIL PANEL INSTALLATION"],["ea","ROUTING OF CABLE IN CABINET"],["ea","PREPARATION OF CABLE AND CORES"],["ea","SPLICING OF CABLE"],["ea","CABLE LABEL"],["ea","PANEL LABEL"],["ea","CONTROL TESTING (INTERNAL) - ODTR"],["ea","CONTROL TESTING (INTERNAL) - OLTS"],["ea","ESKOM WITNESS TESTING - ODTR"],["ea","ESKOM WITNESS TESTING - OLTS"],["ea","TESTING REPORT"]];
let ACT = {
  "WIND MV": STD, "SOLAR MV": STD, "BESS MV": STD, "SUBSTATION": STD,
  "OHL": [["m","DOME JOINT INSTALLATION"],["m","ROUTING OF CABLE TO DOME JOINT"],["ea","PREPARATION OF CABLE AND CORES"],["ea","SPLICING OF CABLE"],["ea","CONTROL TESTING (INTERNAL) - ODTR"],["ea","CONTROL TESTING (INTERNAL) - OLTS"],["ea","ESKOM WITNESS TESTING - ODTR"],["ea","ESKOM WITNESS TESTING - OLTS"],["ea","TESTING REPORT"]],
  "DRUM TEST": [["ea","PREPARATION OF CABLE AND CORES"],["ea","SPLICING OF CABLE"],["ea","CONTROL TESTING (INTERNAL) - ODTR"],["ea","TESTING REPORT"]]
};
let AREAS = Object.keys(ACT);
const WEATHER = ["Clear", "Partly cloudy", "Overcast", "Light rain", "Heavy rain", "Windy", "Mist or fog", "Thunderstorm"];
const HAZARDS = ["Electricity", "Working at heights", "Lifting of material & equipment", "Roadside work", "HV Testing", "Excavations", "Fibre Optic Cables", "Falling objects", "Moving mobile plant", "Slippery surfaces", "Moving machinery parts", "Explosion", "Sharp objects", "Hot objects", "Confined spaces", "Cutting and welding", "Compressed gas", "Noise", "Fire", "Weather conditions", "Snakes & Bees", "Operating electrical switches"];
const PPE = ["Hard hat", "Glasses", "Ear protection", "Dust mask", "Respirator", "Face shield", "Welding helmet", "Safety harness", "Overall", "Top", "Pants", "Dust coat", "Apron", "Gloves", "Safety shoes", "Safety boots", "Gum boots"];
const MS = ["MS-FIB-001 Fibre optic installation and testing", "MS-FIB-002 CAT6a shielded data cable termination and testing", "MS-FIB-003 CAN-BUS control cable termination and testing", "MS-FIB-004 4-core 1.5 mm² shielded control cable", "MS-FIB-005 12c x 1 mm² EPO cable", "MS-FIB-006 7c x 1 mm² EPO cable", "MS-FIB-007 4c x 4 mm² power cable", "MS-FIB-008 DEHN POE Type 2 surge protection", "MS-FIB-009 DEHN Type D2 surge protection"];
const OCCUPATIONS = ["Project Manager", "Quality Control", "Site Manager", "Technician", "Technician", "Assistant"];
const TIMES = []; for (let h = 5; h <= 20; h++) for (const m of ["00", "30"]) TIMES.push(String(h).padStart(2, "0") + "h" + m);
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const S = { user: null, locked: true, project: null, date: null, month: null, done: {}, form: null, view: "users", hist: [] };
const app = document.getElementById("app");

// ---------- helpers ----------
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (v === true) el.setAttribute(k, "");
    else el.setAttribute(k, v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(kid));
  return el;
}
const today = () => { const p = new Intl.DateTimeFormat("en-ZA", { timeZone: "Africa/Johannesburg", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date()).reduce((a, x) => (a[x.type] = x.value, a), {}); return new Date(+p.year, +p.month - 1, +p.day); };
const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const nice = d => d.toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const dmy = d => `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
let uid = 0; const id = p => `${p}-${++uid}`;
function sel(options, value, onChange, placeholder, extra) {
  const s = h("select", Object.assign({ id: id("s"), "aria-label": placeholder || "Choose" }, extra || {}),
    h("option", { value: "" }, placeholder || "Tap to choose"),
    options.map(o => h("option", { value: o, selected: o === value }, o)));
  const mark = () => s.classList.toggle("empty", !s.value);
  s.addEventListener("change", () => { mark(); onChange(s.value); }); mark();
  return s;
}
function inp(type, value, onInput, ph, extra) {
  const i = h("input", Object.assign({ id: id("i"), type, placeholder: ph || "", value: value ?? "", inputmode: type === "number" ? "decimal" : null, "aria-label": ph || type }, extra || {}));
  i.addEventListener("input", () => onInput(i.value));
  return i;
}
function txt(value, onInput, ph) {
  const t = h("textarea", { id: id("t"), placeholder: ph || "", "aria-label": ph || "Notes" }); t.value = value || "";
  t.addEventListener("input", () => onInput(t.value)); return t;
}
function seg(opts, value, onPick) {
  const box = h("div", { class: "seg" });
  const draw = v => box.replaceChildren(...opts.map(([val, lab]) => h("button", { type: "button", class: (v === val ? "on " : "") + val, "aria-pressed": v === val ? "true" : "false", onclick: () => { const nv = v === val ? "" : val; onPick(nv); draw(nv); } }, lab)));
  draw(value); return box;
}
function sheet(cls, ...kids) { return h("div", { class: "sheet " + (cls || "") }, ...kids); }
function topbar(title, sub, back) {
  return h("div", { class: "bar" },
    back ? h("button", { class: "back", "aria-label": "Back", onclick: goBack }, "‹") : null,
    h("div", { class: "t" }, h("b", {}, title), sub ? h("span", {}, sub) : null),
    syncPill());
}
function go(view) { S.hist.push(S.view); S.view = view; render(); window.scrollTo(0, 0); }
function goBack() { S.view = S.hist.pop() || "projects"; render(); window.scrollTo(0, 0); }

// ---------- the phone's back button ----------
// Back goes one screen back inside the app. It never drops a man straight out of the app.
// On the main screen it takes three presses to close, with a message each time.
const FORM_VIEWS = ["check", "toolbox", "incident", "nearmiss", "jobobs", "si", "order", "diary", "dsti", "inspection", "mysection"];
const ROOT_VIEWS = ["projects", "users", "signature", "waiting", "removed"];
let backPresses = 0, backAt = 0;
function guardBack() { if (!(history.state && history.state.fib === "top")) { history.replaceState({ fib: "base" }, ""); history.pushState({ fib: "top" }, ""); } }
function toast(t) {
  document.querySelectorAll(".fib-toast").forEach(x => x.remove());
  const el = h("div", { class: "fib-toast", role: "status", style: "position:fixed;left:50%;bottom:calc(84px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);background:#15191e;color:#fff;font-weight:700;font-size:14px;padding:12px 18px;border-radius:24px;z-index:9999;max-width:88vw;text-align:center;box-shadow:0 4px 14px rgba(0,0,0,.3)" }, t);
  document.body.append(el); setTimeout(() => el.remove(), 2600);
}
function leaveFormCheck(then) {
  if (!(FORM_VIEWS.includes(S.view) && S.formDirty)) return then();
  const ov = h("div", { class: "overlay", role: "dialog", "aria-label": "Leave this page" }, h("div", { class: "modal" }, h("h2", {}, "Leave this page?"),
    h("p", {}, S.view === "mysection" ? "Your diary section is kept on the phone. You can come back to it." : "What you filled in on this form is not submitted yet. If you leave, it is lost."),
    h("div", { class: "row" }, h("button", { class: "btn-g", type: "button", onclick: () => ov.remove() }, "Stay"), h("button", { class: "btn-w", type: "button", onclick: () => { ov.remove(); S.formDirty = false; clearDraft(); then(); } }, "Leave"))));
  document.body.append(ov);
}
addEventListener("input", () => { if (FORM_VIEWS.includes(S.view)) { S.formDirty = true; saveDraft(); } }, true);
addEventListener("click", () => { if (FORM_VIEWS.includes(S.view) && S.formDirty) saveDraft(); }, true);
addEventListener("change", () => { if (FORM_VIEWS.includes(S.view)) { S.formDirty = true; saveDraft(); } }, true);
// An unfinished form is kept on the phone, so it survives the app closing (camera, WhatsApp, an update or the
// 10 minute lock). When the app opens again it offers to carry on.
const FORM_NAMES = { check: "an inspection checklist", toolbox: "a toolbox talk", incident: "an incident report", nearmiss: "a near-miss report", jobobs: "a job observation", si: "a site instruction", order: "a material order", diary: "the diary", dsti: "a DSTI", inspection: "a site inspection" };
let draftT = 0;
function saveDraft() {
  clearTimeout(draftT);
  draftT = setTimeout(() => { try {
    if (!S.form || !FORM_VIEWS.includes(S.view) || S.view === "mysection" || !Store.keepLocal) return;
    const f = Object.assign({}, S.form, { project: S.form.project ? S.form.project.id : null, date: S.form.date ? new Date(S.form.date).toISOString() : null });
    Store.keepLocal("draft", { view: S.view, at: Date.now(), f }).catch(() => {});
  } catch (e) {} }, 600);
}
function clearDraft() { clearTimeout(draftT); try { Store.keepLocal("draft", null).catch(() => {}); } catch (e) {} }
async function offerDraft() {
  let d = null; try { d = await Store.readLocal("draft"); } catch (e) {}
  if (!d || !d.f || Date.now() - d.at > 3 * 864e5) return;
  const p = d.f.project ? PROJECTS.find(x => x.id === d.f.project) : null;
  if (d.f.project && !p) return;
  const ov = h("div", { class: "overlay", role: "dialog", "aria-label": "Carry on" }, h("div", { class: "modal" }, h("h2", {}, "Carry on where you were?"),
    h("p", {}, `You were busy with ${FORM_NAMES[d.f.type] || "a form"}${p ? ` on ${p.short}` : ""} when the app closed. Everything you typed is still here.`),
    h("div", { class: "row" }, h("button", { class: "btn-g", type: "button", onclick: () => { ov.remove(); clearDraft(); } }, "Throw it away"),
      h("button", { class: "btn-w", type: "button", onclick: () => { ov.remove();
        S.form = Object.assign({}, d.f, { project: p, date: d.f.date ? new Date(d.f.date) : today() });
        if (p) S.project = p; S.date = S.form.date; S.formDirty = true; S.hist = p ? ["projects", "calendar", "menu"] : ["projects"]; S.view = d.view; render(); window.scrollTo(0, 0); } }, "Carry on"))));
  document.body.append(ov);
}
addEventListener("popstate", () => {
  if (!CFG) return;
  const ovs = document.querySelectorAll(".overlay");
  if (ovs.length) { ovs[ovs.length - 1].remove(); history.pushState({ fib: "top" }, ""); return; }
  if (!ROOT_VIEWS.includes(S.view)) { backPresses = 0; history.pushState({ fib: "top" }, ""); leaveFormCheck(goBack); return; }
  if (Date.now() - backAt > 3000) backPresses = 0;
  backPresses++; backAt = Date.now();
  if (backPresses === 1) { history.pushState({ fib: "top" }, ""); toast("Press back two more times to close Fibraco"); return; }
  // second press: stay on the bottom step, so the third press closes the app. Re-arm after 3 seconds.
  toast("Press back once more to close Fibraco");
  setTimeout(() => { if (backPresses === 2 && history.state && history.state.fib === "base") { backPresses = 0; history.pushState({ fib: "top" }, ""); } }, 3000);
});

// ---------- signature ----------
// own = the person using the phone signs: his saved signature after his PIN. Otherwise (client, attendees) a fresh drawing.
function sigCell(get, set, label, own) {
  const b = h("button", { type: "button", class: "sigbox", "aria-label": label || "Sign" });
  const draw = () => { const v = get(); b.replaceChildren(v ? h("img", { src: v, alt: "Signature" }) : own ? "Tap to sign with your PIN" : "Tap to sign"); };
  b.onclick = () => own ? mySig(v => { set(v); draw(); }) : openSig(label || "Signature", v => { set(v); draw(); });
  draw(); return b;
}
const sigId = () => `sig|${(Store.me() || {}).member}`;
const savedSig = () => { const o = Store.get(sigId()); return o && o.img && !o.reset ? o : null; };
// saved signature, stamped with name, date and time, after the PIN
function mySig(done) {
  const sg = savedSig();
  if (!sg) return setupSignature(() => { render(); mySig(done); });
  pinOverlay("Sign with your PIN", "Type your PIN to put your signature here.", pin => Store.checkPin(pin).then(async ok => {
    if (ok !== true) {
      if (10 - ok <= 0) { await Store.wipe(true); location.reload(); return "x"; }
      return `Wrong PIN. ${10 - ok} ${10 - ok === 1 ? "try" : "tries"} left.`;
    }
    const im = new Image(); im.src = sg.img; await new Promise(r => { im.onload = im.onerror = r; });
    const w = im.naturalWidth || 600, hh = im.naturalHeight || 240, c = document.createElement("canvas"); c.width = w; c.height = hh + Math.round(w / 14);
    const x = c.getContext("2d"); x.drawImage(im, 0, 0);
    const now = new Date(); x.fillStyle = "#33414f"; x.font = `${Math.round(w / 24)}px sans-serif`;
    x.fillText(`${S.user}  |  ${dmy(now)} ${now.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" }).replace(":", "h")}`, 6, c.height - Math.round(w / 40));
    done(c.toDataURL("image/png")); return true;
  }));
}
function pinOverlay(title, sub, check) {
  let v = ""; const dots = h("div", { class: "pin-dots" }), msg = h("p", { class: "pin-msg" }, sub);
  const ov = h("div", { class: "overlay", role: "dialog", "aria-label": title });
  const drawD = () => dots.replaceChildren(...[0, 1, 2, 3].map(i => h("i", { class: i < v.length ? "on" : "" })));
  const press = d => { if (d === "del") v = v.slice(0, -1); else if (v.length < 4) v += d; drawD(); if (v.length === 4) { const p = v; v = ""; setTimeout(async () => { drawD(); const r = await check(p); if (r === true || r === "x") ov.remove(); else msg.textContent = r; }, 120); } };
  drawD();
  ov.append(h("div", { class: "modal", style: "text-align:center" }, h("h2", {}, title), msg, dots,
    h("div", { class: "pin-pad" }, ...["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"].map(d => d ? h("button", { type: "button", onclick: () => press(d), "aria-label": d === "del" ? "Delete" : d }, d === "del" ? "⌫" : d) : h("span"))),
    h("div", { class: "row" }, h("button", { class: "btn-g", type: "button", onclick: () => ov.remove() }, "Cancel"))));
  document.body.append(ov);
}
// once per person: draw a signature, try again until happy, lock it in
function setupSignature(after) {
  // own view name, so changes arriving from other phones do not redraw over this screen
  const prev = S.view === "signature" ? "projects" : S.view; S.view = "signature";
  const c = h("canvas", { class: "sigpad", style: "width:100%;max-width:420px;height:200px;background:#fff;border:1.5px solid #c9ced6;border-radius:8px;touch-action:none;display:block;margin:10px auto" });
  const lockBtn = h("button", { class: "btn-w", type: "button", style: "flex:1;padding:14px;border-radius:8px;font-weight:800;opacity:.45" }, "Lock it in");
  let ctx, dirty = false, drawing = false;
  app.replaceChildren(h("div", { class: "lock", style: "min-height:auto" },
    h("img", { src: LOGO, alt: "Fibraco", style: "width:180px;max-width:60%;margin:14px auto 8px;display:block" }),
    h("h1", { class: "big", style: "text-align:center" }, "Your signature"),
    h("p", { style: "text-align:center;padding:0 16px;margin:4px 0" }, `${S.user}, sign with your finger in the white box. Try again as often as you like. When you are happy, lock it in.`),
    h("div", { class: "pin-warn", role: "note" }, h("b", { style: "color:#c8102e;font-weight:900" }, "THIS IS YOUR SIGNATURE FOR EVERY FORM."), " Each time you sign, the app asks for your PIN and puts this signature in. Only the office can change it later."),
    c,
    h("div", { style: "display:flex;gap:10px;width:100%;max-width:420px;margin:6px auto" },
      h("button", { class: "btn-g", type: "button", style: "flex:1;padding:14px;border-radius:8px;font-weight:800", onclick: () => { ctx.clearRect(0, 0, c.width, c.height); dirty = false; lockBtn.style.opacity = ".45"; } }, "Try again"),
      lockBtn)));
  lockBtn.onclick = () => {
    if (!dirty) return;
    const img = c.toDataURL("image/png"), id = sigId();
    Store.put(id, { img, at: new Date().toISOString(), name: S.user });
    Store.lock([id], "own");
    S.view = prev; after();
  };
  const r = c.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
  c.width = r.width * dpr; c.height = r.height * dpr;
  ctx = c.getContext("2d"); ctx.scale(dpr, dpr); ctx.lineWidth = 2.8; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#0b1f33";
  const pos = e => { const b = c.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
  c.addEventListener("pointerdown", e => { drawing = true; c.setPointerCapture(e.pointerId); const [x, y] = pos(e); ctx.beginPath(); ctx.moveTo(x, y); });
  c.addEventListener("pointermove", e => { if (!drawing) return; const [x, y] = pos(e); ctx.lineTo(x, y); ctx.stroke(); dirty = true; lockBtn.style.opacity = "1"; });
  ["pointerup", "pointercancel"].forEach(t => c.addEventListener(t, () => drawing = false));
}
function openSig(label, done) {
  const c = h("canvas", { class: "sigpad" });
  const ov = h("div", { class: "overlay", role: "dialog", "aria-label": label },
    h("div", { class: "modal" }, h("h2", {}, label), h("p", {}, "Sign with your finger in the white box."), c,
      h("div", { class: "row" },
        h("button", { class: "btn-g", type: "button", onclick: () => { ctx.clearRect(0, 0, c.width, c.height); dirty = false; } }, "Clear"),
        h("button", { class: "btn-g", type: "button", onclick: () => ov.remove() }, "Cancel"),
        h("button", { class: "btn-w", type: "button", onclick: () => { done(dirty ? c.toDataURL("image/png") : ""); ov.remove(); } }, "Done"))));
  document.body.append(ov);
  const r = c.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
  c.width = r.width * dpr; c.height = r.height * dpr;
  const ctx = c.getContext("2d"); ctx.scale(dpr, dpr); ctx.lineWidth = 2.6; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#0b1f33";
  let drawing = false, dirty = false;
  const pos = e => { const b = c.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
  c.addEventListener("pointerdown", e => { drawing = true; c.setPointerCapture(e.pointerId); const [x, y] = pos(e); ctx.beginPath(); ctx.moveTo(x, y); });
  c.addEventListener("pointermove", e => { if (!drawing) return; const [x, y] = pos(e); ctx.lineTo(x, y); ctx.stroke(); dirty = true; });
  ["pointerup", "pointercancel"].forEach(t => c.addEventListener(t, () => drawing = false));
}

// ---------- photos ----------
function photoBlock(list) {
  const grid = h("div", { class: "photos" });
  const draw = () => { grid.replaceChildren(...list.map((p, i) => h("figure", {},
    photoImg(p, { alt: p.caption || "Site photo " + (i + 1) }),
    h("figcaption", {}, `${p.src}  |  ${p.time}`),
    inp("text", p.caption, v => p.caption = v, "Location or caption")))); grid.hidden = !list.length; };
  const add = async (files, src) => {
    for (const f of files) {
      const time = new Date().toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" }), ph = "ph|" + Date.now().toString(36) + rid();
      const data = await shrinkPhoto(f).catch(() => null); if (!data) continue;
      PHOTO_CACHE.set(ph, data); Store.put(ph, data, "ph");
      list.push({ ph, url: data, caption: "", src, time, by: S.user });
    }
    draw(); persistSoon();
  };
  const cam = h("input", { type: "file", accept: "image/*", capture: "environment", id: id("cam"), onchange: e => add(e.target.files, "App camera") });
  const gal = h("input", { type: "file", accept: "image/*", multiple: true, id: id("gal"), onchange: e => add(e.target.files, "From gallery") });
  draw();
  return h("div", {}, h("div", { class: "photo-btns" },
    h("label", { for: cam.id }, "Take photo", cam),
    h("label", { class: "alt", for: gal.id }, "Upload from gallery", gal)), grid);
}

// ---------- GPS ----------
function gpsBlock(state, key) {
  const box = h("div", { class: "gps" });
  const draw = msg => {
    const g = state[key];
    box.replaceChildren(...[
      g ? h("div", { class: "coords" }, `X ${g.lng.toFixed(6)}   Y ${g.lat.toFixed(6)}   Z ${g.alt == null ? "n/a" : g.alt + " m"}`) : null,
      h("div", { class: "msg" }, msg || (g ? `Accuracy ±${g.acc} m` : "Stand at the spot and tap the button.")),
      h("button", { type: "button", onclick: () => {
        if (!navigator.geolocation) return draw("This phone cannot read GPS.");
        draw("Getting a GPS fix...");
        navigator.geolocation.getCurrentPosition(
          p => { state[key] = { lat: p.coords.latitude, lng: p.coords.longitude, alt: p.coords.altitude == null ? null : Math.round(p.coords.altitude), acc: Math.round(p.coords.accuracy) }; draw(); },
          () => draw("Location is switched off for this app. Allow location in the phone settings and try again."),
          { enableHighAccuracy: true, timeout: 8000 });
      } }, g ? "Log location again" : "Log my location")].filter(Boolean));
  };
  draw(); return box;
}

// ---------- screens ----------
function vUsers() {
  return [h("div", { style: "height:18px" }), h("h1", { class: "big" }, "Who is using this phone?"),
    h("div", { class: "stack" }, USERS.map(u => h("button", { class: "mbtn", onclick: () => { S.user = u; go("projects"); } }, u, h("small", {}, ROLE[u]))),
      h("button", { class: "mbtn ghost", onclick: () => showInfo("Add user", "Only the office adds users. Each person gets their own login, so every form carries their name and signature automatically.") }, "+ Add user")),
    h("p", { class: "note" }, "Done once per phone. After that the app opens straight on the projects.")];
}
// ---------- putting the app on the phone ----------
// The phone offers "install" to the app itself. The app keeps that offer and shows one big button,
// so nobody has to look for menus. Once it runs from its own icon the button disappears.
let installEvt = null;
const standalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
addEventListener("beforeinstallprompt", e => { e.preventDefault(); installEvt = e; if (CFG && S.view === "projects") render(); });
addEventListener("appinstalled", () => { installEvt = null; showInfo("Fibraco is on your phone", "From now on open Fibraco from the Fibraco icon on your phone, like WhatsApp. You can close this screen."); if (CFG && S.view === "projects") render(); });
async function installNow() {
  if (installEvt) { const e = installEvt; installEvt = null; e.prompt(); const r = await e.userChoice.catch(() => ({})); if (r.outcome !== "accepted") { installEvt = e; } render(); return; }
  showInfo("Put Fibraco on your phone", "Tap the three dots at the top right of the screen. Tap Install app (or Add to Home screen). Then tap Install. If it is already on your phone, just open it from the Fibraco icon.");
}
function installCard() {
  if (standalone()) return null;
  return h("div", { style: "margin:0 0 14px" },
    h("button", { class: "submit", type: "button", style: "font-size:17px;padding:16px", onclick: installNow }, "Put Fibraco on my phone"),
    h("p", { class: "note", style: "margin-top:6px;text-align:center" }, "One tap. After that, open Fibraco from its icon like WhatsApp."));
}
function vProjects() {
  if (TILES()) return vProjectsTiles();
  return [topbar("Fibraco", S.user, false), h("div", { class: "who" }, h("span", {}, "Signed in as ", h("b", {}, S.user), ` (${ROLE[S.user]})`), null),
    installCard(),
    isAdmin(S.user) ? h("button", { class: "mbtn", style: `background:${CH.bg};color:#fff;border-color:${CH.bg};margin-bottom:12px`, onclick: () => go("dash") }, "MY DASHBOARD", h("small", { style: "color:#c9d0d8" }, "Who is in, who is behind, colour first")) : null,
    isAdmin(S.user) ? h("button", { class: "mbtn tz-btn", onclick: timeZone }, "TIME ZONE", h("small", {}, "Snapshot of everything right now, for Claude to review")) : null,
    isAdmin(S.user) ? h("button", { class: "mbtn cl-btn", onclick: () => go("claude") }, "CLAUDE", h("small", {}, "Ask Claude anything about the app and the sites")) : null,
    ...(alertsBanner() || []),
    h("h1", { class: "big" }, "Projects"),
    h("div", { class: "stack" },
      h("button", { class: "mbtn red-text", onclick: () => { S.project = null; startForm("inspection"); } }, "Site inspection", h("small", {}, "For new work and client site visits")),
      PROJECTS.map(p => h("button", { class: "mbtn", onclick: () => { S.project = p; S.month = today(); go("calendar"); } }, p.name, h("small", {}, roleLabel(roleIn(S.user, p))))),
      PROJECTS.length ? delaysButton() : null,
      PROJECTS.length ? h("button", { class: "mbtn", onclick: frontOrder }, "MATERIAL ORDER", h("small", {}, "Order material, tools or PPE. It goes to Wanro as a PDF")) : null),
    h("p", { class: "note" }, "Only your active projects show here. When a project closes, the office removes it."),
    h("div", { style: "text-align:center;margin-top:14px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap" }, h("button", { class: "btn-g", type: "button", style: "padding:8px 14px;font-size:13px", onclick: changePin }, "Change my PIN"),
      h("button", { class: "btn-g bio-set", type: "button", style: "padding:8px 14px;font-size:13px", onclick: async () => {
        if (await Store.hasBio()) return askYesNo("Switch fingerprint off?", "Fibraco will only ask for your PIN.", "Switch off", async () => { await Store.bioOff(); showInfo("Fingerprint is off", "Fibraco asks for your PIN only."); });
        if (!(await Store.bioAvailable())) return showInfo("Not on this phone", "This phone has no fingerprint set up in its own settings. Set it up there first (Settings, Security, Fingerprints).");
        bioSetup(); } }, "Fingerprint")),
    h("p", { class: "note", style: "text-align:center;margin-top:10px" }, `App version ${verLabel()}`)];
}
const APPV = "1793021006";
function verLabel() { const n = +APPV; if (!n) return "test"; const d = new Date(n * 1000); return `${dmy(d)} ${String(d.getHours()).padStart(2, "0")}h${String(d.getMinutes()).padStart(2, "0")}`; }
function changePin() {
  let oldPin = null, first = null;
  const back = () => { render(); };
  const cancel = h("div", { style: "text-align:center;margin-top:10px" }, h("button", { class: "btn-g", type: "button", style: "padding:8px 14px", onclick: back }, "Cancel"));
  const step = (t, s, fn, w) => { pinPad(t, s, fn, w); document.querySelector(".lock").append(cancel); };
  const askOld = s => step("Type your current PIN", s, pin => { oldPin = pin; askNew(""); });
  const askNew = s => step("Choose a new PIN", s, pin => { first = pin; step("Type it again", "To make sure you remember it.", pin2 => {
    if (pin2 !== first) return askNew("The two PINs did not match. Try again.");
    Store.changePin(oldPin, first).then(ok => { if (!ok) return askOld("Wrong PIN. Try again."); back(); showInfo("PIN changed", "Use the new PIN from now on. Remember it, you type it every time you open the app."); });
  }, PIN_WARN); }, PIN_WARN);
  askOld("");
}
function vCalendar() {
  const m = S.month, first = new Date(m.getFullYear(), m.getMonth(), 1), t = today();
  const start = new Date(first); start.setDate(1 - first.getDay());
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    if (i >= 35 && d.getMonth() !== m.getMonth()) break;
    const key = S.project.id + "|" + ymd(d);
    cells.push(h("button", { class: [d.getDay() === 0 ? "sun" : "", d.getMonth() !== m.getMonth() ? "out" : "", ymd(d) === ymd(t) ? "today" : ""].join(" "), "aria-label": nice(d), onclick: () => { S.date = d; go("menu"); } }, String(d.getDate()), S.done[key] ? h("span", { class: "dot" }) : null));
  }
  const shift = n => { S.month = new Date(m.getFullYear(), m.getMonth() + n, 1); render(); };
  return [topbar(S.project.short, "Choose the day", true),
    h("div", { class: "cal-head" }, h("button", { onclick: () => shift(-1), "aria-label": "Previous month" }, "‹"), h("h1", { class: "big" }, `${MONTHS[m.getMonth()].slice(0, 3).toUpperCase()} ${m.getFullYear()}`), h("button", { onclick: () => shift(1), "aria-label": "Next month" }, "›")),
    h("div", { class: "cal" }, ["S", "M", "T", "W", "T", "F", "S"].map((d, i) => h("div", { class: "dow" + (i === 0 ? " sun" : "") }, d)), cells),
    h("div", { class: "legend" }, h("span", {}, h("i"), "Forms submitted that day"))];
}
// ---------- attendance register: each man signs in (and out) with his PIN, the register makes itself ----------
const attId = (p, d, who) => `att|${p.id}|${ymd(d)}|${who}`;
const attGet = (p, d, who) => Store.get(attId(p, d, who));
const hhmm = (t = new Date()) => `${String(t.getHours()).padStart(2, "0")}h${String(t.getMinutes()).padStart(2, "0")}`;
const attPeople = p => Object.keys(p.team || {}).filter(n => p.team[n] && p.team[n] !== "pm");
function attSummary(p, d) { const ppl = attPeople(p), n = ppl.filter(x => (attGet(p, d, x) || {}).in).length; return `${n} of ${ppl.length} signed in`; }
function gpsNow() {
  return new Promise(res => { if (!navigator.geolocation) return res(null);
    navigator.geolocation.getCurrentPosition(g => res({ lat: +g.coords.latitude.toFixed(6), lng: +g.coords.longitude.toFixed(6), acc: Math.round(g.coords.accuracy) }), () => res(null), { enableHighAccuracy: true, timeout: 7000, maximumAge: 60000 }); });
}
function attButton() {
  if (!S.project || !roleIn(S.user) || roleIn(S.user) === "pm") return null;
  const now0 = new Date(), [ch, cm] = (S.project.editUntil || "23:00").split(":").map(Number);
  const isToday = ymd(S.date) === ymd(now0) && now0.getHours() * 60 + now0.getMinutes() < ch * 60 + cm, a = attGet(S.project, S.date, S.user) || {};
  if (a.in && a.out) return h("button", { class: "mbtn att-done", type: "button", onclick: () => showInfo("Attendance register", `You signed in at ${a.in} and out at ${a.out}.`) }, `REGISTER SIGNED  |  IN ${a.in}  |  OUT ${a.out}`);
  if (!isToday) return a.in ? h("button", { class: "mbtn att-done", type: "button" }, `REGISTER  |  IN ${a.in}`) : null;
  const sign = out => mySig(async v => { if (!v) return;
    toast("Saving..."); const gps = await gpsNow(), now = new Date();
    const rec = Object.assign({ who: S.user, date: ymd(S.date) }, attGet(S.project, S.date, S.user) || {});
    if (out) Object.assign(rec, { out: hhmm(now), outAt: now.toISOString(), outSig: v, outGps: gps });
    else Object.assign(rec, { in: hhmm(now), inAt: now.toISOString(), sig: v, gps });
    Store.put(attId(S.project, S.date, S.user), rec); render(); showInfo(out ? "Signed out" : "Signed in", out ? `You signed out at ${rec.out}. Safe travels.` : `You are on the register at ${rec.in}. Sign out here when you leave site.`); });
  const unsent = a.in && Store.isDirty && Store.isDirty(attId(S.project, S.date, S.user));
  return a.in
    ? h("button", { class: "mbtn att-out", type: "button", onclick: () => sign(true) }, `SIGNED IN ${a.in}. TAP TO SIGN OUT`, h("small", {}, unsent ? "NOT SENT YET. Switch on your mobile data so the site manager gets it." : "Sent to the site manager. Sign out here when you leave site."))
    : h("button", { class: "mbtn att-in", type: "button", onclick: () => sign(false) }, "SIGN THE ATTENDANCE REGISTER", h("small", {}, "Tap when you get to site and type your PIN. Time and place are recorded."));
}
function attDoc(p, d, days) {
  if (days) { const parts = days.map(x => attDoc(p, x).html); return { html: parts.join('<div style="height:28px"></div>'), title: `FIBRACO - Attendance Register - ${p.short} (${dmy(days[0])} to ${dmy(days[days.length - 1])})` }; }
  const esc = x => String(x == null ? "" : x).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const rows = attPeople(p).map((n, i) => { const a = attGet(p, d, n) || {}; const pr = PEOPLE.find(x => x.name === n) || {};
    return `<tr><td>${i + 1}</td><td>${esc(n)}</td><td>${esc((p.titles || {})[n] || (p.team[n] === "sm" ? "Site manager" : pr.role || ""))}${p.team[n] === "sm" ? " (site manager)" : ""}</td><td>${esc(a.in || "Absent")}</td><td>${a.sig ? `<img src="${a.sig}" style="height:34px">` : ""}</td><td>${esc(a.out || "")}</td><td>${a.outSig ? `<img src="${a.outSig}" style="height:34px">` : ""}</td></tr>`; }).join("");
  const n = attPeople(p).filter(x => (attGet(p, d, x) || {}).in).length;
  const html = `<div class="pd-head"><img src="${LOGO}" alt="Fibraco"><div><h1>ATTENDANCE REGISTER</h1><div>${esc(p.name)}</div><div>${esc(nice(d))}</div></div></div>
  <table class="kv"><tr><th>Client</th><td>${esc(p.client || "")}</td></tr><tr><th>Site manager</th><td>${esc(smName(p))}</td></tr><tr><th>On site</th><td>${n} of ${attPeople(p).length}</td></tr></table>
  <h2>Register</h2><table class="g"><thead><tr><th>No</th><th>Name</th><th>Role</th><th>Time in</th><th>Signature in</th><th>Time out</th><th>Signature out</th></tr></thead><tbody>${rows}</tbody></table>
  <p class="none">Each person signed in and out on his own phone with his own PIN. Times are from the phone at the moment of signing.</p>`;
  return { html, title: `FIBRACO - Attendance Register - ${p.short} (${dmy(d)})` };
}
async function sendRegister(p, d, days) {
  if (sending) return; sending = true;
  const ov = h("div", { class: "overlay", role: "dialog", "aria-label": "Making the PDF" }, h("div", { class: "modal" }, h("h2", {}, "Making the PDF"), h("p", {}, "One moment.")));
  document.body.append(ov);
  try {
    await loadJs("./js/lib/html2canvas.min.js?v=1793021006"); await loadJs("./js/lib/jspdf.umd.min.js?v=1793021006"); await loadJs("./js/pdf.js?v=1793021006");
    const { html, title } = attDoc(p, d, days); const file = await window.FibPdf.diaryPdf(html, title);
    const m = ov.querySelector(".modal"); m.innerHTML = "";
    m.append(h("h2", {}, "Register PDF ready"), h("p", {}, file.name),
      h("div", { class: "row" }, h("button", { class: "btn-g", type: "button", onclick: () => ov.remove() }, "Close"),
        h("button", { class: "btn-w", type: "button", onclick: async () => { ov.remove(); await window.FibPdf.shareFile(file, `Fibraco attendance register, ${p.short}, ${nice(d)}`); } }, "Share")));
  } catch (e) { ov.remove(); showInfo("Could not make the PDF", "This phone could not make the PDF. Try again with signal, or use another phone."); }
  finally { sending = false; }
}
function vAttendance() {
  const p = S.project, d = S.attDate || S.date, ppl = attPeople(p);
  // every day of the project so far: the last 21 days up to today, newest first
  const days = []; for (let k = 0; k < 21; k++) { const x = new Date(); x.setHours(12, 0, 0, 0); x.setDate(x.getDate() - k); days.push(x); }
  const dayChip = x => { const n = ppl.filter(m => (attGet(p, x, m) || {}).in).length, on = ymd(x) === ymd(d), col = n === ppl.length ? "#1e8e3e" : n ? "#f29900" : "#8a8f98";
    return h("button", { type: "button", class: "att-day" + (on ? " on" : ""), onclick: () => { S.attDate = x; render(); } },
      h("div", { style: "font-size:11px;font-weight:800;letter-spacing:.05em" }, x.toLocaleDateString("en-ZA", { weekday: "short" }).toUpperCase()),
      h("div", { style: "font-size:18px;font-weight:900" }, String(x.getDate())),
      h("div", { style: `font-size:11px;font-weight:800;color:${on ? "#fff" : col}` }, `${n}/${ppl.length}`)); };
  const row = n => { const a = attGet(p, d, n) || {}, col = a.in ? (a.out ? "#1e8e3e" : "#0069aa") : "#c8102e";
    return h("div", { style: "display:flex;gap:10px;align-items:center;padding:10px 12px;border-top:1px solid var(--line)" },
      h("div", { style: `width:7px;align-self:stretch;border-radius:4px;background:${col}` }),
      h("div", { style: "flex:1;min-width:0" }, h("div", { style: "font-weight:800" }, n),
        h("div", { style: "font-size:12.5px;color:#5b6470" }, a.in ? `In ${a.in}${a.out ? `  |  Out ${a.out}` : ymd(d) === ymd(new Date()) ? "  |  Still on site" : "  |  Did not sign out"}` : "Not signed in"),
        a.gps ? h("a", { href: `https://maps.google.com/?q=${a.gps.lat},${a.gps.lng}`, target: "_blank", style: "font-size:12px" }, `Where he signed in (±${a.gps.acc} m)`) : null),
      a.sig ? h("img", { src: a.sig, alt: "Signature", style: "height:38px;max-width:110px;background:#fff" }) : null); };
  // the work week of the chosen day, Monday to Saturday, up to today
  const mon = new Date(d); mon.setHours(12, 0, 0, 0); mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
  const week = []; for (let k = 0; k < 6; k++) { const x = new Date(mon); x.setDate(mon.getDate() + k); if (ymd(x) <= ymd(new Date())) week.push(x); }
  const open = ymd(d) === ymd(new Date());
  return [topbar("Attendance register", `${p.short}  |  ${dmy(d)}`, true),
    h("p", { class: "form-sub" }, "Tap a day to see its register. Each man signs in on his own phone with his PIN when he gets to site, and out when he leaves. Signing closes at " + editUntil() + " each night."),
    h("div", { class: "att-days" }, ...days.map(dayChip)),
    sheet("", h("div", { class: "band" }, `${nice(d)}  |  ${attSummary(p, d)}${open ? "" : "  |  closed"}`), ...ppl.map(row)),
    h("button", { class: "mbtn", type: "button", onclick: () => sendRegister(p, d) }, `Send register for ${dmy(d)}`, h("small", {}, "One day as PDF. Opens WhatsApp, email and the rest")),
    week.length > 1 ? h("button", { class: "mbtn", type: "button", onclick: () => sendRegister(p, d, week) }, `Send the week (${dmy(week[0])} to ${dmy(week[week.length - 1])})`, h("small", {}, "Every day of that week in one PDF")) : null];
}

// ---------- TIME ZONE (office only): a snapshot of everything right now, for Claude to review ----------
// Makes two files: a readable PDF and the full data (JSON). Wanro saves them to OneDrive with one tap, Claude reads them there.
function tzStrip(o) { return JSON.parse(JSON.stringify(o == null ? null : o, (k, v) => typeof v === "string" && v.startsWith("data:") ? "(signature or photo on file)" : k === "photos" && Array.isArray(v) ? `${v.length} photo(s)` : v)); }
function tzData(nDays = 7) {
  const now = new Date(), out = { app: "Fibraco Field", made_by: S.user, made_at: now.toISOString(), local_time: `${dmy(now)} ${hhmm(now)}`, version: verLabel(), projects: [] };
  const saveP = S.project, saveD = S.date;
  try {
    for (const p of PROJECTS) {
      S.project = p; const pj = { id: p.id, name: p.name, client: p.client, site_manager: smName(p), days: [], tests: [], repairs: [], qc: [] };
      for (let i = nDays - 1; i >= 0; i--) {
        const d = new Date(now); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - i); S.date = d;
        const ds = ymd(d), k = p.id + "|" + ds, alloc = allocOf(k) || [];
        const secs = {}; for (const [id, o] of Store.list(`sec|${k}|`)) secs[id.slice(`sec|${k}|`.length)] = o;
        const reg = attPeople(p).map(n => { const a = attGet(p, d, n) || {}; return { who: n, in: a.in || null, out: a.out || null, gps: a.gps || null }; });
        if (!alloc.length && !Object.keys(secs).length && !reg.some(r => r.in)) continue;
        const people = [...new Set(alloc.map(a => a.who).concat(Object.keys(secs)))];
        const fin = Store.get("final|" + k);
        pj.days.push({ date: ds, diary_signed: fin ? fin.at : null, people: people.map(n => { const mine = alloc.filter(a => a.who === n), sec = secs[n] || {};
          return { who: n, status: sec.status || "not started", submitted_at: sec.at || null, hours: sec.hrs || null,
            tasks: mine.map((t, j) => { const r = (sec.rows || [])[j] || {}; return { activity: t.act, where: t.loc, target: +t.target || 0, unit: t.unit || "", critical: !!t.crit, done: r.done === undefined || r.done === "" ? null : +r.done, note: r.note || "", splice_machine: r.eq || null }; }),
            other_work: (sec.other || []).filter(o => o.act || o.what).map(o => ({ activity: o.act || "", where: o.loc || "", qty: +o.qty || 0, unit: o.unit || "", detail: o.what || "" })),
            delays: (sec.delays || []).filter(x => x.cause).map(x => ({ cause: x.cause, detail: x.what || "", hours: +x.hrs || 0 })),
            sent_back_note: sec.back || null }; }),
          site_manager_part: tzStrip(Store.get("site|" + k)), register: reg });
      }
      if (p.routes) pj.tests = tsRoutes().map(r => { const sm = tsSummary(r); return { section: r.practice ? "PRACTICE" : `${r.a} to ${r.b}`, metres: +r.m || null, cores: sm.n, cores_fully_tested: sm.tested, cores_with_problem: sm.bad, wavelengths_with_data: sm.used, issues: sm.used.flatMap(w => tsAnalyse(r, w).issues.map(x => `${w} nm: ${x.text}`)) }; });
      const byId = {}; Store.list(`issue|${p.id}|`).forEach(([, o]) => { byId[o.id] = o; }); (S.issues[p.id] || []).forEach(o => { byId[o.id] = o; });
      pj.repairs = Object.values(byId).map(x => ({ title: x.title, detail: x.detail, for: x.resp, found_by: x.found, found_on: x.foundOn, status: x.status }));
      if (p.qcSpots) pj.qc = Object.keys(QC_SHEETS).flatMap(sh => qcSpots(sh).map(sp => { const c = qcCount(sh, sp); return { sheet: sh, spot: sp, checked: c.done, of: c.total, fails: c.fail, signed: c.signed ? c.signed.at : null }; }));
      out.projects.push(pj);
    }
  } finally { S.project = saveP; S.date = saveD; }
  out.phones = (DEVS || []).filter(x => x.dev).map(x => ({ who: (PEOPLE.find(q => q.id === x.member_id) || {}).name || x.member_id, phone: x.label || "", status: x.status, first: x.first_seen || x.created_at || null, last: x.last_seen || null }));
  out.feedback = Store.list("fb|").map(([, o]) => ({ who: o.who, screen: o.view, project: o.project, text: o.text, at: o.at })).slice(-30);
  return out;
}
function tzHtml(D) {
  const e = x => String(x == null ? "" : x).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const tbl = (head, rows) => rows.length ? `<table class="g"><thead><tr>${head.map(x => `<th>${e(x)}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${e(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>` : `<p class="none">None</p>`;
  let h = `<div class="pd-head"><img src="${LOGO}" alt="Fibraco"><div><h1>TIME ZONE</h1><div>Snapshot of Fibraco Field</div><div>${e(D.local_time)}  |  app version ${e(D.version)}</div></div></div>`;
  for (const p of D.projects) {
    h += `<h2>${e(p.name.toUpperCase())}</h2>`;
    if (!p.days.length) h += `<p class="none">No work loaded in the last 7 days.</p>`;
    for (const d of p.days.slice().reverse()) {
      h += `<h3>${e(d.date)}  |  diary ${d.diary_signed ? "signed " + e(d.diary_signed) : "not signed"}  |  register ${d.register.filter(r => r.in).length} of ${d.register.length}</h3>`;
      h += tbl(["Man", "Status", "Task", "Where", "Target", "Done", "Note"], d.people.flatMap(m => m.tasks.length ? m.tasks.map((t, i) => [i ? "" : m.who, i ? "" : m.status, nice2(t.activity) + (t.critical ? " (critical)" : ""), t.where, `${t.target} ${t.unit}`, t.done == null ? "-" : t.done, t.note]) : [[m.who, m.status, "-", "", "", "", ""]]));
      const ow = d.people.flatMap(m => m.other_work.map(o => [m.who, nice2(o.activity) || o.detail, o.where, `${o.qty} ${o.unit}`, o.detail]));
      if (ow.length) h += `<p><b>Other work</b></p>` + tbl(["Man", "What", "Where", "Qty", "Detail"], ow);
      const dl = d.people.flatMap(m => m.delays.map(x => [m.who, x.cause, x.detail, x.hours]));
      if (dl.length) h += `<p><b>Delays</b></p>` + tbl(["Man", "Cause", "Detail", "Hrs"], dl);
      h += `<p><b>Hours</b> ${e(d.people.map(m => `${m.who} ${m.hours || "-"}`).join("  |  "))}</p>`;
      h += `<p><b>Register</b> ${e(d.register.map(r => `${r.who} ${r.in ? "in " + r.in + (r.out ? ", out " + r.out : "") : "not signed in"}`).join("  |  "))}</p>`;
    }
    if (p.tests.length) h += `<h3>Test sheets</h3>` + tbl(["Section", "Cores", "Tested", "Problem"], p.tests.map(t => [t.section, t.cores, t.cores_fully_tested, t.cores_with_problem]));
    h += `<h3>Repairs</h3>` + tbl(["Repair", "For", "Found by", "Status"], p.repairs.map(r => [r.title, r.for, `${r.found_by} ${r.found_on}`, r.status]));
    if (p.qc.length) h += `<h3>QC</h3>` + tbl(["Sheet", "Spot", "Checked", "Fails", "Signed"], p.qc.filter(q => q.checked).map(q => [q.sheet, q.spot, `${q.checked} of ${q.of}`, q.fails, q.signed || "-"]));
  }
  if (D.feedback.length) h += `<h2>FEEDBACK FROM THE TEAM</h2>` + tbl(["Who", "Screen", "Text"], D.feedback.map(f => [f.who, f.screen, f.text]));
  return h;
}
async function timeZone() {
  if (sending) return; sending = true;
  const ov = h("div", { class: "overlay", role: "dialog", "aria-label": "Time zone" }, h("div", { class: "modal" }, h("h2", {}, "Taking the snapshot"), h("p", {}, "Getting the latest from the server first. One moment.")));
  document.body.append(ov);
  try {
    try { Store.kick(); await refreshDevices(true); } catch (e) {}
    await new Promise(r => setTimeout(r, 1800));
    await loadJs("./js/lib/html2canvas.min.js?v=1793021006"); await loadJs("./js/lib/jspdf.umd.min.js?v=1793021006"); await loadJs("./js/pdf.js?v=1793021006");
    const D = tzData(), stamp = `${dmy(new Date())} ${hhmm()}`, name = `FIBRACO - Time Zone (${stamp})`;
    const pdf = await window.FibPdf.diaryPdf(tzHtml(D), name);
    const json = new File([JSON.stringify(D, null, 1)], name.replace(/[\\/:*?"<>|]+/g, "-") + ".json", { type: "application/json" });
    const m = ov.querySelector(".modal"); m.innerHTML = "";
    m.append(h("h2", {}, "Time zone ready"), h("p", {}, "Tap Share, choose OneDrive and save both files in the Time Zone folder. Then tell Claude \"Time zone\"."),
      h("div", { class: "row" }, h("button", { class: "btn-g", type: "button", onclick: () => ov.remove() }, "Close"),
        h("button", { class: "btn-w", type: "button", onclick: async () => { ov.remove();
          const files = [pdf, json];
          if (navigator.canShare && navigator.canShare({ files })) { try { await navigator.share({ files, title: name }); return; } catch (e) { if (e && e.name === "AbortError") return; } }
          for (const f of files) { const a = document.createElement("a"); a.href = URL.createObjectURL(f); a.download = f.name; document.body.append(a); a.click(); a.remove(); }
          showInfo("Saved", "Both files are in your Downloads."); } }, "Share")));
  } catch (e) { ov.remove(); showInfo("Could not make the snapshot", String(e && e.message || e)); }
  finally { sending = false; }
}

// ---------- CLAUDE, on Wanro's phone only ----------
// Questions go straight from this phone to Claude with the guide (tools/brain), the setup and the live data.
// The key is kept on this phone only, scrambled. The server never sees the questions or the answers.
const CL = { msgs: null, key: null, busy: false, draft: "" }, CL_MODEL = "claude-sonnet-5-5";
async function clLoad() { if (CL.msgs) return; CL.key = await Store.readLocal("claudeKey"); CL.msgs = (await Store.readLocal("claudeChat")) || []; }
function clBrief() {
  const strip = t => { const o = Object.assign({}, t); delete o.key; return o; };
  return { people: PEOPLE.map(p => ({ id: p.id, name: p.name, role: p.role, phone: p.phone || "", email: p.email || "", admin: !!p.admin })), equipment: CFG.equip || [],
    projects: CFG.projects.map(p => { const o = Object.assign({}, p); delete o.dwg;
      if (o.checklist) o.checklist = { name: o.checklist.name, doc: o.checklist.doc, sections: (o.checklist.sections || []).map(x => x.title || x.name || "") };
      if (o.plan) { o.plan = {}; for (const [d, ts] of Object.entries(p.plan)) o.plan[d] = ts.map(strip); }
      return o; }) };
}
function clText(t) { // **bold** and line breaks only
  return t.split(/(\*\*[^*]+\*\*)/g).map(x => /^\*\*[^*]+\*\*$/.test(x) ? h("b", {}, x.slice(2, -2)) : x);
}
function clCopy(text, btn) {
  const done = () => { btn.textContent = "Copied"; setTimeout(() => { btn.textContent = "Copy"; }, 1500); };
  const fall = () => { const t = h("textarea", { style: "position:fixed;opacity:0" }, text); document.body.append(t); t.select(); try { document.execCommand("copy"); } catch (e) {} t.remove(); done(); };
  try { navigator.clipboard.writeText(text).then(done, fall); } catch (e) { fall(); }
}
async function clAsk(text) {
  text = (text || "").trim(); if (!text || CL.busy) return;
  if (!Store.online()) return showInfo("No signal", "Claude needs signal. Your question is still in the box, send it again when you are connected.");
  CL.msgs.push({ role: "user", content: text, at: new Date().toISOString() }); CL.busy = true; CL.draft = ""; render(); clScroll();
  try {
    await Promise.race([Store.sync().catch(() => {}), new Promise(r => setTimeout(r, 6000))]);
    const now = new Date();
    const system = [
      { type: "text", text: (CFG.brain || "") + "\n\n# Setup data: people, projects, the full programme, equipment\n" + JSON.stringify(clBrief()), cache_control: { type: "ephemeral" } },
      { type: "text", text: `# Live data from Wanro's phone, read ${dmy(now)} ${hhmm(now)} (app version ${verLabel()})\n` + JSON.stringify(tzData(7)) }];
    const messages = CL.msgs.slice(-16).map(m => ({ role: m.role, content: m.content }));
    while (messages.length && messages[0].role !== "user") messages.shift();
    const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST",
      headers: { "content-type": "application/json", "x-api-key": CL.key, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
      body: JSON.stringify({ model: CL_MODEL, max_tokens: 12000, thinking: { type: "between_tools" }, output_config: { effort: "medium" }, system, messages }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { const m = (j.error && j.error.message) || `error ${r.status}`;
      throw new Error(r.status === 401 ? "The key was not accepted. Tap Change key and paste it again." : /credit|balance|billing/i.test(m) ? "There is no credit left on the Claude account. Load credit at console.anthropic.com." : m); }
    let ans = (j.content || []).filter(c => c.type === "text").map(c => c.text).join("\n").trim();
    if (j.stop_reason === "max_tokens") ans = (ans ? ans + "\n\n" : "") + "(The answer was too long and got cut off. Ask me to continue, or ask a narrower question.)";
    if (!ans || (j.stop_reason === "max_tokens" && ans.startsWith("(The answer"))) {
      const kinds = (j.content || []).map(c => c.type).join(", ") || "nothing", u = j.usage || {};
      ans = `Claude sent back no text. Send Claude in the main chat this line: stop ${j.stop_reason || "?"}, blocks ${kinds}, out ${u.output_tokens || "?"}, in ${u.input_tokens || "?"}, model ${j.model || CL_MODEL}.`;
    }
    CL.msgs.push({ role: "assistant", content: ans, at: new Date().toISOString() });
  } catch (e) {
    const q = CL.msgs.pop(); CL.draft = q ? q.content : "";
    showInfo("Claude did not answer", e && e.message && !/fetch|network/i.test(e.message) ? e.message : "Could not reach Claude. Check your signal and try again.");
  }
  CL.busy = false; Store.keepLocal("claudeChat", CL.msgs.slice(-60)); render(); clScroll();
}
// press and hold one of Claude's answers: it is selected and a bar offers Share (WhatsApp, email, anything) and Copy
function clSelect(b, text) {
  document.querySelectorAll(".cl-msg.sel").forEach(x => x.classList.remove("sel")); document.querySelectorAll(".cl-act").forEach(x => x.remove());
  b.classList.add("sel"); if (navigator.vibrate) try { navigator.vibrate(30); } catch (e) {}
  const plain = text.replace(/\*\*([^*]+)\*\*/g, "*$1*");
  const close = () => { b.classList.remove("sel"); bar.remove(); };
  const share = async () => {
    if (navigator.share) { try { await navigator.share({ text: plain }); close(); return; } catch (e) { if (e && e.name === "AbortError") return close(); } }
    clCopy(plain, cp); toast("Copied. Paste it in WhatsApp"); setTimeout(close, 800);
  };
  const cp = h("button", { type: "button", class: "btn-g", onclick: () => { clCopy(plain, cp); toast("Copied"); setTimeout(close, 800); } }, "Copy");
  const bar = h("div", { class: "cl-act", role: "toolbar", "aria-label": "Message actions" },
    h("button", { type: "button", class: "btn-g", onclick: close }, "Cancel"), cp, h("button", { type: "button", class: "btn-w", onclick: share }, "Share"));
  document.body.append(bar);
}
function clScroll() { setTimeout(() => { const l = document.querySelector(".cl-msgs"); if (l) window.scrollTo(0, document.body.scrollHeight); }, 30); }
function vClaude() {
  if (!isAdmin(S.user)) { S.view = "projects"; return vProjects(); }
  if (!CL.msgs) { clLoad().then(render); return [topbar("CLAUDE", "Opening...", true)]; }
  const head = topbar("CLAUDE", "Ask anything about the app and the sites", true);
  if (!CL.key) {
    const inp = h("input", { type: "password", placeholder: "sk-ant-...", autocomplete: "off", style: "width:100%;font-size:16px;padding:10px;margin:8px 0" });
    return [head, sheet("", h("div", { class: "band" }, "SET UP CLAUDE"),
      h("div", { style: "padding:12px;line-height:1.5" },
        h("p", {}, "Paste your Claude key once. It stays on this phone only, locked behind your PIN, and is never sent to the Fibraco server."),
        h("p", {}, "Get it at console.anthropic.com, API Keys, Create Key. Load some credit there first."),
        inp,
        h("button", { class: "btn-w", type: "button", style: "padding:12px 22px", onclick: async () => {
          const k = inp.value.trim(); if (!/^sk-ant-/.test(k)) return showInfo("Not a Claude key", "A Claude key starts with sk-ant-. Copy it again from console.anthropic.com.");
          CL.key = k; await Store.keepLocal("claudeKey", k); render(); } }, "Save key")))];
  }
  const ask = h("textarea", { class: "cl-in", rows: 2, placeholder: "Ask Claude...", oninput: e => { CL.draft = e.target.value; } }, CL.draft);
  const send = () => clAsk(ask.value);
  const tips = ["How is Belle River going today?", "Who has not signed the register yet?", "Who is behind on his tasks today?", "What must Francois still approve?"];
  // press and hold one of your own questions: it goes back into the box, ready to send again
  const reuse = text => { CL.draft = text; ask.value = text; ask.focus(); try { ask.setSelectionRange(text.length, text.length); } catch (e) {} if (navigator.vibrate) try { navigator.vibrate(30); } catch (e) {} toast("In the box. Tap Send"); };
  const holdable = (el, text, act) => { let t = 0; const start = () => { clearTimeout(t); t = setTimeout(() => act ? act() : reuse(text), 450); }, stop = () => clearTimeout(t);
    el.addEventListener("pointerdown", start); ["pointerup", "pointerleave", "pointercancel", "pointermove"].forEach(ev => el.addEventListener(ev, ev === "pointermove" ? (e => { if (Math.abs(e.movementY) > 6) stop(); }) : stop));
    el.addEventListener("contextmenu", e => e.preventDefault()); return el; };
  const msgs = CL.msgs.map(m => {
    const b = h("div", { class: "cl-msg " + (m.role === "user" ? "cl-me" : "cl-ai") }, h("div", { class: "cl-txt" }, ...clText(m.content)));
    if (m.role === "user") { holdable(b, m.content); b.title = "Press and hold to ask again"; }
    else holdable(b, null, () => clSelect(b, m.content));
    if (m.role === "assistant") { const c = h("button", { class: "cl-copy", type: "button" }, "Copy"); c.onclick = () => clCopy(m.content, c); b.append(c); }
    return b; });
  return [head,
    h("div", { class: "cl-msgs" },
      msgs.length ? h("p", { class: "hint", style: "text-align:center;margin:0 0 4px" }, "Press and hold a question to ask it again, or an answer to share it.") : h("div", { class: "cl-empty" }, h("p", {}, "Ask about anything in the app: who did what, who is behind, the programme, phones, how a screen works, or a WhatsApp message to one of the men."),
        ...tips.map(t => h("button", { class: "cl-tip", type: "button", onclick: () => clAsk(t) }, t))),
      ...msgs,
      CL.busy ? h("div", { class: "cl-msg cl-ai cl-wait" }, "Claude is reading the app...") : null),
    h("div", { class: "cl-bar" }, ask, h("button", { class: "btn-w cl-send", type: "button", disabled: CL.busy, onclick: send }, "Send")),
    h("div", { class: "cl-tools" },
      h("button", { class: "btn-g", type: "button", onclick: () => askYesNo("Clear the chat?", "The questions and answers on this screen are removed from this phone.", "Clear", async () => { CL.msgs = []; await Store.keepLocal("claudeChat", []); render(); }, true) }, "Clear chat"),
      h("button", { class: "btn-g", type: "button", onclick: () => askYesNo("Change the Claude key?", "You will paste a new key.", "Change", async () => { CL.key = null; await Store.keepLocal("claudeKey", null); render(); }) }, "Change key"))];
}
// ---------- one-screen tile menus (CFG.ui === "tiles"). Approved by Wanro 23 Oct 2026, goes live in one go ----------
// "tiles" for everyone, "admin" for Wanro's phone only (to try it before the crew gets it)
const TILES = () => typeof CFG !== "undefined" && CFG && (CFG.ui === "tiles" || (CFG.ui === "admin" && isAdmin(S.user)));
const TI = {
  pen: '<path d="M4 20h4l10-10-4-4L4 16z"/><path d="M14 6l4 4"/>',
  book: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/><path d="M9 8h6"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  wave: '<path d="M3 18h18"/><path d="M3 15l3-6 3 4 3-8 3 10 3-5 3 5"/>',
  doc: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/><path d="M9 13h7M9 17h5"/>',
  warn: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
  near: '<path d="M12 3l10 18H2z"/><path d="M9 15.5c1-1.4 2-1.4 3 0s2 1.4 3 0"/><path d="M12 9v2.5"/>',
  map: '<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/>',
  rams: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2"/><path d="M9 11l2 2 4-4M9 17h6"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  phone: '<path d="M5 4h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14a5 5 0 0 1 5 5"/>',
  check: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 9l2 2 4-4M8 16h8"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
  sos: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16v.5"/>',
  cart: '<path d="M3 4h2l2 12h11l2-8H6"/><circle cx="9" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/>',
  dash: '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="5" rx="1.5"/><rect x="13" y="10" width="8" height="11" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/>',
  cam: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8M8 13h5"/>',
  key: '<circle cx="8" cy="14" r="4"/><path d="M11 11l9-9M17 5l2 2M15 7l2 2"/>',
  obs: '<circle cx="10" cy="10" r="6"/><path d="M20 20l-5.5-5.5"/><path d="M7.5 10l2 2 3.5-3.5"/>',
  fb: '<path d="M4 4h16v12H8l-4 4z"/><path d="M12 7v4M12 13.5v.5"/>',
  dev: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 18h4"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  turb: '<path d="M12 12v9M9 21h6"/><path d="M12 12l-1-8 2 0z"/><path d="M12 12l7 4-1 1.7z"/><path d="M12 12l-7 4 1 1.7z"/>'
};
function ticon(name) { const sp = h("span", { class: "ti-ic", "aria-hidden": "true" }); sp.innerHTML = `<svg viewBox="0 0 24 24">${TI[name] || TI.doc}</svg>`; return sp; }
function tile(icon, label, onclick, opt = {}) {
  return h("button", { type: "button", class: "tile" + (opt.cls ? " " + opt.cls : ""), onclick, "aria-label": label.replace("\n", " ") + (opt.badge ? `, ${opt.badge}` : "") },
    opt.badge != null && opt.badge !== "" ? h("span", { class: "tbadge" + (opt.bc ? " " + opt.bc : "") }, String(opt.badge)) : null,
    ticon(icon), h("span", { class: "tl" }, ...label.split("\n").flatMap((x, i) => i ? [h("br"), x] : [x])));
}
function pinMenu() {
  const ov = h("div", { class: "overlay", role: "dialog", "aria-label": "PIN and fingerprint" }, h("div", { class: "modal" }, h("h2", {}, "PIN and fingerprint"),
    h("button", { class: "mbtn", type: "button", onclick: () => { ov.remove(); changePin(); } }, "Change my PIN"),
    h("button", { class: "mbtn", type: "button", onclick: async () => { ov.remove();
      if (await Store.hasBio()) return askYesNo("Switch fingerprint off?", "Fibraco will only ask for your PIN.", "Switch off", async () => { await Store.bioOff(); showInfo("Fingerprint is off", "Fibraco asks for your PIN only."); });
      if (!(await Store.bioAvailable())) return showInfo("Not on this phone", "This phone has no fingerprint set up in its own settings. Set it up there first (Settings, Security, Fingerprints).");
      bioSetup(); } }, "Fingerprint", h("small", {}, "Open the app with your finger instead of the PIN")),
    h("div", { class: "row" }, h("button", { class: "btn-g", type: "button", onclick: () => ov.remove() }, "Close"))));
  document.body.append(ov);
}
function frontPick(title, fn) {
  if (PROJECTS.length === 1) return fn(PROJECTS[0]);
  const ov = h("div", { class: "overlay", role: "dialog", "aria-label": title }, h("div", { class: "modal" }, h("h2", {}, title),
    ...PROJECTS.map(p => h("button", { class: "mbtn", type: "button", onclick: () => { ov.remove(); fn(p); } }, p.name)),
    h("div", { class: "row" }, h("button", { class: "btn-g", type: "button", onclick: () => ov.remove() }, "Cancel"))));
  document.body.append(ov);
}
const frontForm = type => frontPick(type === "nearmiss" ? "Near miss on which project?" : "Which project?", p => { S.project = p; S.date = today(); S.hist = []; startForm(type); });
// one line per project on the front screen: what is waiting today
function projStatus(p) {
  const keep = [S.project, S.date]; S.project = p; S.date = today();
  try {
    if (!roleIn(S.user, p) && !isAdmin(S.user)) return ["Not on this project", "#8a8f98"];
    if (projPhase(p) === "done") return ["Completed", PJ_COL.done[0]];
    if (p.start && p.start > ymd(today())) { const d = new Date(p.start + "T12:00:00"); return [`Starts ${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`, "#0069aa"]; }
    ensureDay(); const k = dayKey(), alloc = S.alloc[k] || [];
    if (isMgr(S.user)) {
      const men = [...new Set(alloc.map(a => a.who))], inn = men.filter(n => ["submitted", "approved"].includes(((S.sections[k] || {})[n] || {}).status)).length;
      if (!alloc.length) return ["No work given out today", "#8a8f98"];
      return [`${alloc.length} tasks for ${men.length} men | ${inn} of ${men.length} diaries in${S.final[k] ? " | signed" : ""}`, S.final[k] ? "#1e8e3e" : inn === men.length ? "#0069aa" : "#f29900"];
    }
    const t = myTasks(S.user), st = (((S.sections[k] || {})[S.user]) || {}).status || "draft";
    if (!t.length) return ["Nothing given to you today", "#8a8f98"];
    const stl = { draft: "diary not submitted", submitted: "diary submitted", returned: "diary SENT BACK", approved: "diary approved" }[st];
    return [`${t.length} task${t.length === 1 ? "" : "s"} today | ${stl}`, { draft: "#f29900", submitted: "#0069aa", returned: "#c8102e", approved: "#1e8e3e" }[st]];
  } catch (e) { return ["Tap to open", "#8a8f98"]; }
  finally { [S.project, S.date] = keep; }
}
// near misses and incidents of the last 7 days, for the office and the site manager (front screen, tile layout)
function safetyBanner() {
  const mine = new Set(PROJECTS.filter(p => isAdmin(S.user) || ["sm", "pm", "sup"].includes(roleIn(S.user, p))).map(p => p.id));
  if (!mine.size) return null;
  const since = Date.now() - 7 * 864e5;
  const list = Store.list("form|").map(([, o]) => o).filter(o => o && ["nearmiss", "incident"].includes(o.type) && mine.has(o.project) && Date.parse(o.savedAt || 0) > since).sort((a, b) => (b.savedAt || "").localeCompare(a.savedAt || ""));
  if (!list.length) return null;
  const pn = id => (CFG.projects.find(p => p.id === id) || {}).short || id;
  return sheet("", h("div", { class: "band", style: "background:#c76a00" }, `SAFETY REPORTS, LAST 7 DAYS (${list.length})`),
    ...list.slice(0, 4).map(o => { const pr = o.type === "nearmiss" ? nmPriority(o) : "";
      return h("button", { type: "button", style: "display:flex;gap:10px;align-items:center;width:100%;text-align:left;background:none;border:0;border-top:1px solid var(--line);padding:9px 12px;font-size:13px;color:var(--text)",
        onclick: () => showInfo(o.type === "nearmiss" ? `Near miss, ${pn(o.project)}` : `Incident, ${pn(o.project)}`, `${o.savedBy} on ${dmy(new Date(o.date + "T12:00:00"))}${o.time ? " at " + o.time : ""}. ${o.where ? "Where: " + o.where + ". " : ""}${o.what || ""}${pr ? ` Priority ${pr}.` : ""}`) },
        h("span", { style: `flex:none;font-size:10.5px;font-weight:800;color:#fff;border-radius:10px;padding:3px 8px;background:${pr ? NM_COL[pr] : "#c8102e"}` }, o.type === "nearmiss" ? (pr || "NEAR MISS").toUpperCase() : "INCIDENT"),
        h("span", { style: "min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" }, h("b", {}, o.savedBy.split(" ")[0]), ` ${pn(o.project)}: ${o.what || ""}`)); }));
}

// project colour: green while the crew is working on it, light grey before it starts, purple when it is done
const PJ_COL = { live: ["#39ff14", "#ecffe6"], future: ["#aeb6c1", "#f1f3f5"], done: ["#7b3fb5", "#f2ebfa"] };
const projPhase = p => p.done || (p.end && p.end < ymd(today())) ? "done" : p.start && p.start > ymd(today()) ? "future" : "live";
function vProjectsTiles() {
  const open = myDelays().filter(o => o.status !== "sorted"), top = open.reduce((m, o) => Math.max(m, delayLevel(o)), -1);
  const admin = isAdmin(S.user);
  return [topbar("Fibraco", S.user, false),
    h("div", { class: "tw" },
      h("div", { class: "who", style: "margin:0" }, h("span", {}, "Signed in as ", h("b", {}, S.user), ` (${ROLE[S.user]})`)),
      installCard(),
      admin ? ((alertsBanner() || [])[0] || null) : null,
      safetyBanner(),
      (() => { const ds = ymd(today()), n = dueToday().reduce((c, p) => c + checksOpen(p, S.user, ds), 0);
        return n ? h("button", { type: "button", class: "mbtn today-bar", onclick: () => go("today") }, `${n} check${n === 1 ? "" : "s"} to do today`, h("small", {}, "Tap to see them. Clear every mustard one.")) : null; })(),
      admin ? (() => { const fb = Store.list("fb|").length, waiting = (DEVS || []).filter(d => d.status === "pending").length;
        return h("div", { class: "tgrid g2" },
          tile("fb", "Feedback\nfrom the team", () => go("feedback"), { badge: fb || "", cls: "slim" }),
          tile("dev", "Devices\nand access", () => go("devices"), { badge: waiting || "", bc: "o", cls: "slim" })); })() : null,
      admin ? h("div", { class: "tgrid" },
        tile("dash", "My\ndashboard", () => go("dash"), { cls: "dark" }),
        tile("cam", "Time\nzone", timeZone, { cls: "dark" }),
        tile("chat", "Claude", () => go("claude"), { cls: "dark" })) : null,
      // Wanro: projects as tiles, three to a row. The crew keep the project cards.
      admin ? h("div", { class: "tgrid" }, ...PROJECTS.filter(p => !p.hideFrontAdmin).map(p => { const [line] = projStatus(p), [col, bg] = PJ_COL[projPhase(p)];
        return h("button", { type: "button", class: "tile tpj", style: `border-top:7px solid ${col};background:${bg};border-color:${col}${projPhase(p) === "live" ? ";box-shadow:0 0 12px rgba(57,255,20,.65)" : ""}`, "aria-label": `${p.name}. ${line}`, onclick: () => { S.project = p; S.date = today(); S.month = today(); go("menu"); } },
          h("span", { class: "tpj-n" }, p.short.toUpperCase()), h("span", { class: "tpj-c" }, (p.client || "").split(" (")[0]), h("span", { class: "tpj-s" }, line)); }))
      : h("div", { class: "tw", style: "padding:0" }, ...PROJECTS.map(p => { const [line] = projStatus(p), [col] = PJ_COL[projPhase(p)];
        return h("button", { type: "button", class: "tproj", onclick: () => { S.project = p; S.date = today(); S.month = today(); go("menu"); } },
          h("span", { class: "tdot", style: `background:${col}` }), h("span", { class: "tpt" }, h("b", {}, p.name.toUpperCase()), h("small", {}, line)), h("span", { class: "tgo", "aria-hidden": "true" }, "›")); })),
      PROJECTS.length ? null : h("p", { class: "note" }, "No active projects yet. The office adds you to a project."),
      h("div", { class: "tgrid" },
        PROJECTS.length ? tile("near", "Near\nmiss", () => frontForm("nearmiss"), { cls: "nm" }) : null,
        tile("wave", "Test\nsheets", () => go("adhoc"), { badge: adhocNew().length || "" }),
        PROJECTS.length ? tile("clock", "Internal\ndelays", () => go("delays"), { cls: "dark", badge: open.length, bc: top < 0 ? "g" : top >= 3 ? "" : "o" }) : null,
        PROJECTS.length ? tile("cart", "Material\norder", frontOrder) : null,
        tile("search", "Site\ninspection", () => { S.project = null; startForm("inspection"); }),
        tile("key", "PIN and\nfingerprint", pinMenu)),
      h("div", { class: "tfoot", style: "justify-content:center" }, h("span", {}, `App version ${verLabel()}`)),
      h("button", { type: "button", class: "tsos" + (admin ? " round" : ""), "aria-label": "Emergency", onclick: () => { if (!S.project && PROJECTS.length === 1) S.project = PROJECTS[0]; openEmergency(); } }, ticon("sos"), "EMERGENCY"))];
}
function vMenuTiles() {
  const p = S.project, d = S.date, k = (ensureDay(), dayKey()), alloc = S.alloc[k] || [], mgr = isMgr(S.user), sm = isSM(S.user) || isAdmin(S.user);
  const idle = mgr ? idleMen(p, ymd(d)) : [], rp = myRepairs(S.user);
  const open = myDelays().filter(o => o.status !== "sorted" && o.pid === p.id), top = open.reduce((m, o) => Math.max(m, delayLevel(o)), -1);
  const dl = { badge: open.length || "", bc: top >= 3 ? "" : "o", cls: "dark" };
  const tests = p.routes ? tile("wave", "Test\nsheets", () => go("tsheets")) : tile(p.kind === "turbines" ? "turb" : "wave", p.kind === "turbines" ? "Turbines" : p.kind === "opgw" ? "Joint and\ntests" : "Cable\ntests", () => go("tests"));
  const contacts = tile("phone", "Client\ncontacts", () => { const ov = h("div", { class: "overlay", role: "dialog", "aria-label": "Client contacts" }, h("div", { class: "modal" }, projCard(p), h("div", { class: "row" }, h("button", { class: "btn-g", type: "button", onclick: () => ov.remove() }, "Close")))); document.body.append(ov); });
  const red = (t, sub, fn) => h("button", { class: "mbtn tred", type: "button", onclick: fn }, t, h("small", {}, sub));
  let work, grid;
  if (mgr) {
    const men = [...new Set(alloc.map(a => a.who))], inn = men.filter(n => ["submitted", "approved"].includes(((S.sections[k] || {})[n] || {}).status)).length;
    const waiting = men.filter(n => ((S.sections[k] || {})[n] || {}).status === "submitted").length;
    const ppl = attPeople(p), notIn = ymd(d) === ymd(today()) ? ppl.filter(x => !(attGet(p, d, x) || {}).in).length : 0;
    work = h("div", { class: "twork" }, h("span", { class: "tn" }, `${inn}/${men.length}`), h("span", { class: "tpt" }, h("b", {}, "TODAY'S WORK"), h("small", {}, alloc.length ? `${alloc.length} tasks for ${men.length} men | ${inn} diaries in${S.final[k] ? " | signed " + S.final[k] : ""}` : "No work given out yet")),
      isSM(S.user) && !S.final[k] ? h("button", { type: "button", class: "tst blue", onclick: () => go("allocate") }, alloc.length ? "CHANGE" : "GIVE OUT") : null);
    const list = [tile("book", "Daily\ndiaries", () => go("review"), { cls: "hi", badge: waiting || "" }),
      tile("users", "Register", () => { S.attDate = S.date; go("attendance"); }, { badge: notIn || "", bc: "o" }),
      myTasks(S.user).length ? tile("list", "My\ntasks", () => go("mysection")) : null,
      sm && p.qcSpots ? tile("check", "QC\nsheets", () => go("qc"), { cls: "qc" }) : null,
      tests,
      tile("shield", "DSTI", () => startForm("dsti"), { cls: dstiDue(p, ymd(d)) ? "must" : "" }),
      APPT(p) ? tile("eye", "My\nchecks", () => go("mychecks"), { badge: checksOpen(p, S.user, ymd(d)) || "", cls: checksOpen(p, S.user, ymd(d)) ? "must" : "ok" }) : tile("eye", "Inspec-\ntions", () => go("inspections")),
      tile("doc", "Site\ninstruction", () => startForm("si")),
      tile("cart", "Material\norder", () => startForm("order")),
      tile("warn", "Incident", () => startForm("incident")),
      tile("near", "Near\nmiss", () => startForm("nearmiss"), { cls: "nm" }),
      tile("obs", "Job\nobservation", () => startForm("jobobs")),
      tile("map", "Drawings", () => go("drawings")),
      tile("rams", "RAMS", () => go("rams")),
      tile("clock", "Internal\ndelays", () => go("delays"), dl),
      contacts].filter(Boolean);
    if (list.length < 16) list.splice(list.length - 1, 0, tile("search", "Site\ninspection", () => startForm("inspection")));
    grid = h("div", { class: "tgrid g4" }, ...list);
  } else {
    const t = myTasks(S.user), sec = sectionOf(S.user);
    const stc = { draft: ["NOT SUBMITTED", "grey"], submitted: ["SUBMITTED", "blue"], returned: ["SENT BACK", "red"], approved: ["APPROVED", "green"] }[sec.status || "draft"];
    work = h("button", { type: "button", class: "twork", onclick: () => go("mysection") }, h("span", { class: "tn" }, String(t.length)),
      h("span", { class: "tpt" }, h("b", {}, "MY WORK TODAY"), h("small", {}, t.length ? t.map(x => `${nice2(x.act)} ${x.target}`).join(" | ") : "Nothing given to you yet. Ask the site manager.")),
      h("span", { class: "tst " + stc[1] }, stc[0]));
    grid = h("div", { class: "tgrid" },
      tile("book", "Daily\ndiary", () => go("mysection"), { cls: "hi" }),
      tile("shield", "DSTI", () => startForm("dsti"), { cls: dstiDue(p, ymd(d)) ? "must" : "" }),
      APPT(p) ? tile("eye", "My\nchecks", () => go("mychecks"), { badge: checksOpen(p, S.user, ymd(d)) || "", cls: checksOpen(p, S.user, ymd(d)) ? "must" : "ok" }) : tile("eye", "Daily\ninspections", () => go("inspections")),
      tests,
      tile("cart", "Material\norder", () => startForm("order")),
      tile("doc", "Site\ninstruction", () => startForm("si")),
      tile("warn", "Incident\nreport", () => startForm("incident")),
      tile("near", "Near\nmiss", () => startForm("nearmiss"), { cls: "nm" }),
      tile("map", "Drawings", () => go("drawings")),
      tile("rams", "RAMS", () => go("rams")),
      tile("clock", "Internal\ndelays", () => go("delays"), dl),
      contacts);
  }
  const isTodayD = ymd(d) === ymd(today());
  const tb = topbar(p.short, nice(d), true), dsp = tb.querySelector(".t span");
  if (dsp) { dsp.classList.add("tdate"); dsp.setAttribute("role", "button"); dsp.setAttribute("tabindex", "0"); dsp.textContent = nice(d) + "  ▾"; dsp.onclick = () => { S.month = new Date(d); go("calendar"); }; }
  return [tb,
    h("div", { class: "tw" },
      isTodayD ? null : h("button", { type: "button", class: "tday", onclick: () => { S.date = today(); render(); } }, `You are looking at ${nice(d)}. Tap to go back to today.`),
      h("div", { class: "treg" }, attButton()),
      rp.length ? red(`${rp.every(x => /^Splice failed/.test(x.title || "")) ? "SPLICE FAILED" : rp.every(x => /^QC failed/.test(x.title || "")) ? "QC FAILED" : "REPAIRS"}: ${rp.length} TO FIX`, "Fix it, then tap Repaired", () => go("mysection")) : null,
      idle.length ? red(`NO WORK FOR ${idle.map(n => n.split(" ")[0].toUpperCase()).join(" AND ")} TODAY`, "Tap, give him tasks and tap Send to crew", () => go("allocate")) : null,
      work, grid,
      h("button", { type: "button", class: "tsos", onclick: openEmergency }, ticon("sos"), "EMERGENCY"))];
}

function vMenu() {
  if (TILES()) return vMenuTiles();
  const d = S.date;
  const later = (name, what) => h("button", { class: "mbtn later", onclick: () => showInfo(name, what) }, name);
  const idle = isMgr(S.user) ? idleMen(S.project, ymd(d)) : [];
  return [topbar(S.project.short, nice(d), true), attButton(),
    idle.length ? h("button", { class: "mbtn", style: "background:#c8102e;color:#fff;border-color:#c8102e", onclick: () => go("allocate") }, `NO WORK FOR ${idle.map(n => n.split(" ")[0].toUpperCase()).join(" AND ")} TODAY`, h("small", { style: "color:#ffe1e1" }, "Tap, give him tasks and tap Send to crew")) : null,
    projCard(S.project), todayCard(),
    h("div", { class: "stack" },
      myRepairs(S.user).length ? (() => { const rp = myRepairs(S.user), t = rp.every(x => /^Splice failed/.test(x.title || "")) ? "SPLICE FAILED" : rp.every(x => /^QC failed/.test(x.title || "")) ? "QC FAILED" : "REPAIRS";
        return h("button", { class: "mbtn", style: "background:#c8102e;color:#fff;border-color:#c8102e", onclick: () => go("mysection") }, `${t}: ${rp.length} TO FIX`, h("small", { style: "color:#ffe1e1" }, "Fix it, then tap Repaired")); })() : null,
      isMgr(S.user) ? h("button", { class: "mbtn", onclick: () => { S.attDate = S.date; go("attendance"); } }, "Attendance register", h("small", {}, attSummary(S.project, S.date))) : null,
      isMgr(S.user) && myTasks(S.user).length ? h("button", { class: "mbtn", onclick: () => go("mysection") }, "My tasks today", h("small", {}, "Fill in what you did yourself")) : null,
      h("button", { class: "mbtn", onclick: () => isMgr(S.user) ? go("review") : go("mysection") }, "Daily diaries", h("small", {}, isSM(S.user) ? "Check the crew, add your part, sign" : isMgr(S.user) ? "See how the day is going" : "Fill in my section for today")),
      h("button", { class: "mbtn", onclick: () => startForm("dsti") }, "DSTI"),
      h("button", { class: "mbtn", onclick: () => go("inspections") }, "Daily inspections", h("small", {}, "Toolbox talk, PPE, vehicle, ladder, harness, first aid and more")),
      (isSM(S.user) || isAdmin(S.user)) && S.project.qcSpots ? h("button", { class: "mbtn", style: "background:#1b1f26;color:#fff;border-color:#1b1f26", onclick: () => go("qc") }, "QC CHECK SHEETS", h("small", { style: "color:#aeb6c1" }, "Site manager: walk every spot, Pass or Fail")) : null,
      S.project.routes ? h("button", { class: "mbtn", onclick: () => go("tsheets") }, "Test sheets", h("small", {}, "OTDR both ways and OLTS, type the losses, get the report")) : null,
      S.project.routes ? null : h("button", { class: "mbtn", onclick: () => go("tests") }, S.project.kind === "turbines" ? "Turbines" : S.project.kind === "opgw" ? "Joint repair and tests" : "Cable tests", h("small", {}, S.project.kind === "turbines" ? "Splice box, patch panel, tests and checklist per turbine" : S.project.kind === "opgw" ? "Permit, joint box, re-splice, OTDR and OLTS" : "Drum, DIT, after install, control and witness tests")),
      later("Job observation", "Next build. The behavioural observation checklist as a tap table, filed under 6. Behavioural Observations."),
      later("ITP", "Next build. Each ITP line for this project, with an RFI raised from the phone when the work is ready. Accepted or rejected signs the ITP line off."),
      h("button", { class: "mbtn", onclick: () => startForm("si") }, "Site instruction"),
      h("button", { class: "mbtn", onclick: () => startForm("order") }, "Material order"),
      h("button", { class: "mbtn", onclick: () => startForm("incident") }, "Incident report"),
      h("button", { class: "mbtn", onclick: () => go("drawings") }, "Site drawings", h("small", {}, "Layouts, manholes, trenches, SLDs and as-builts")),
      h("button", { class: "mbtn", onclick: () => go("rams") }, "RAMS", h("small", {}, "Risk assessments and method statements")),
      h("button", { class: "mbtn", onclick: () => startForm("inspection") }, "Site inspection"),
      h("button", { class: "mbtn emergency", onclick: openEmergency }, "Emergency button"),
      null),
    h("p", { class: "note" }, "Faded buttons come in a later update. Tap \"Something wrong?\" at the bottom if anything is unclear.")];
}

// ---------- forms ----------
function startForm(type, key) {
  const base = { type, key, date: S.date || today(), project: S.project, user: S.user, photos: [] };
  if (type === "check") Object.assign(base, { d: {}, outcome: "", sig: "", items: CHECKS[key].groups.map(g => g[1].map(n => ({ name: n }))) });
  if (type === "toolbox") Object.assign(base, { talk: "", talkLabel: "", att: [{ name: S.user }, {}, {}, {}], q: "" });
  if (type === "jobobs") Object.assign(base, { time: "", dur: "", area: "", seen: "", safe: "", groups: [], acts: [], other: "", good: "", state: "", unsafe: [], why: [], follow: [{}], sig: "" });
  if (type === "nearmiss") Object.assign(base, { time: "", where: "", task: "", dsti: "", what: "", cons: "", like: "", people: [{}], repeat: "", acts: [], other: "", wit: "", sig: "" });
  if (type === "incident") Object.assign(base, { time: "", types: [], acts: [], where: "", people: [{}], what: "", wit: "", sig: "" });
  if (type === "invest") Object.assign(base, { ref: "", imm: [], immTxt: "", root: "", acts: [{}, {}], lessons: "", sig: "" });
  if (type === "si") Object.assign(base, { by: "", co: "", kind: "", ref: "", text: "", cost: "", sigC: "", sigF: "" });
  if (type === "order") Object.assign(base, { need: "", reason: "", items: [{}, {}, {}], notes: "", sig: "" });
  if (type === "diary") Object.assign(base, {
    applicable: S.project && S.project.area ? S.project.area : "", start: "07h00", end: "17h00", weather: "", w: {},
    team: [{ name: S.user, hrs: "" }, {}, {}, {}, {}, {}],
    desig: Object.fromEntries(DESIGNATIONS.map(d => [d, ""])),
    plant: Object.fromEntries(PLANT.map(p => [p, ""])), equip: Object.fromEntries(EQUIPMENT.map(p => [p, ""])),
    acts: Array.from({ length: 4 }, () => ({ area: S.project && S.project.area || "" })),
    sched: "", schedWhy: "", written: "", verbal: "", mats: [{}, {}, {}], delays: [{}, {}, {}], clientRep: "", sigF: "", sigC: "" });
  if (type === "dsti") Object.assign(base, { task: "", ms: "", tbt: "", hz: {}, ppe: [], ack: OCCUPATIONS.map(o => ({ occ: o, name: "", sig: "" })), assessor: riskAssessor(S.project) || S.user, sigA: "", wind: S.project && S.project.wind ? [{ t: hhmm(new Date()) }, {}, {}, {}, {}] : [] });
  if (type === "inspection") Object.assign(base, { company: "", contact: "", number: "", email: "", acts: [{ sow: "", comments: "", photos: [] }] });
  S.form = base; S.formDirty = false; go(type);
}
function formHead(title, docNote) {
  const f = S.form;
  return [topbar(title, f.project ? `${f.project.short}  |  ${dmy(f.date)}` : `New site  |  ${dmy(f.date)}`, true),
    h("p", { class: "form-sub" }, docNote)];
}
function rowsTable(cls, head, rows, makeRow, addLabel, newRow) {
  const tb = h("tbody");
  const draw = () => tb.replaceChildren(...rows.map((r, i) => makeRow(r, i)));
  draw();
  return sheet(cls, h("table", {}, h("thead", {}, h("tr", {}, head.map(x => typeof x === "string" ? h("th", {}, x) : x))), tb),
    addLabel ? h("button", { class: "addrow", type: "button", onclick: () => { rows.push(newRow()); draw(); } }, addLabel) : null);
}

function vDiary() {
  const f = S.form;
  const tot = h("td", {}, "0");
  const recalc = () => tot.textContent = f.team.reduce((s, r) => s + (+r.hrs || 0), 0);
  const hrsOpts = []; for (let x = 0.5; x <= 14; x += 0.5) hrsOpts.push(String(x));
  const numOpts = n => Array.from({ length: n + 1 }, (_, i) => String(i));
  const team = rowsTable("team", [h("th", {}, "No"), h("th", { class: "l" }, "Project team"), h("th", {}, "Hrs")], f.team,
    (r, i) => h("tr", {}, h("td", { class: "no" }, i + 1), h("td", {}, sel(STAFF, r.name, v => r.name = v, "Choose name")), h("td", { style: "width:86px" }, sel(hrsOpts, r.hrs, v => { r.hrs = v; recalc(); }, "Hrs"))),
    "+ Add person", () => ({}));
  team.querySelector("table").append(h("tfoot", {}, h("tr", { class: "tot" }, h("td", { colspan: 2, style: "text-align:right" }, "Total hrs"), tot)));
  setTimeout(recalc);

  const areaFor = (r, cell) => {
    const actSel = () => {
      const list = (ACT[r.area] || []).map(a => a[1]);
      return sel(list, r.act, v => { r.act = v; const m = (ACT[r.area] || []).find(a => a[1] === v); r.unit = m ? m[0] : ""; unitCell.textContent = r.unit || ""; }, r.area ? "Choose activity" : "Choose area first");
    };
    const unitCell = h("td", { class: "ro", style: "text-align:center;width:52px" }, r.unit || "");
    const actTd = h("td", { style: "min-width:220px" }, actSel());
    const areaTd = h("td", { style: "min-width:130px" }, sel(AREAS, r.area, v => { r.area = v; r.act = ""; r.unit = ""; unitCell.textContent = ""; actTd.replaceChildren(actSel()); }, "Area"));
    return [areaTd, actTd, unitCell];
  };

  return [...formHead("Daily diary", "Same layout as the Fibraco daily diary. Tap any cell to fill it in. Blue tags fill themselves."),
    sheet("", h("div", { class: "band" }, "FIBRACO  |  DAILY DIARY"), h("table", {}, h("tbody", {},
      h("tr", {}, h("td", { class: "lab" }, "Diary completed by", h("span", { class: "auto" }, "auto")), h("td", { class: "ro" }, f.user)),
      h("tr", {}, h("td", { class: "lab" }, "Applicable to"), h("td", {}, sel(AREAS, f.applicable, v => f.applicable = v, "Choose area"))),
      h("tr", {}, h("td", { class: "lab" }, "Date", h("span", { class: "auto" }, "auto")), h("td", { class: "ro" }, nice(f.date))),
      h("tr", {}, h("td", { class: "lab" }, "Time started"), h("td", {}, sel(TIMES, f.start, v => f.start = v, "Start"))),
      h("tr", {}, h("td", { class: "lab" }, "Time ended"), h("td", {}, sel(TIMES, f.end, v => f.end = v, "End"))),
      h("tr", {}, h("td", { class: "lab" }, "General weather condition"), h("td", {}, sel(WEATHER, f.weather, v => f.weather = v, "Choose"))),
      ...[["Weather - Temp (°C)", "t"], ["Weather - Wind (m/s)", "wd"]].map(([lab, k]) => h("tr", {}, h("td", { class: "lab" }, lab, h("span", { class: "auto" }, "auto")),
        h("td", {}, h("div", { style: "display:grid;grid-template-columns:1fr 1fr" }, inp("number", f.w[k + "min"], v => f.w[k + "min"] = v, "Min"), inp("number", f.w[k + "max"], v => f.w[k + "max"] = v, "Max"))))),
      ...[["Weather - Humidity (%)", "hum"], ["Weather - Visibility (km)", "vis"], ["Rain (mm)", "rain"]].map(([lab, k]) => h("tr", {}, h("td", { class: "lab" }, lab, h("span", { class: "auto" }, "auto")), h("td", {}, inp("number", f.w[k], v => f.w[k] = v, ""))))))),
    h("p", { class: "hint" }, "Type the weather from the phone's weather app. Automatic weather comes in a later update."),
    team,
    sheet("desig", h("table", {}, h("thead", {}, h("tr", {}, h("th", { class: "l" }, "Designation"), h("th", {}, "QTY"))),
      h("tbody", {}, DESIGNATIONS.map(d => h("tr", {}, h("td", { style: "padding:8px;font-weight:600" }, d), h("td", { style: "width:86px" }, sel(numOpts(9), f.desig[d], v => f.desig[d] = v, "0"))))))),
    sheet("plant", h("table", {}, h("thead", {}, h("tr", {}, h("th", {}, "Plant on site"), h("th", {}, "QTY"))),
      h("tbody", {}, PLANT.map(p => h("tr", {}, h("td", { style: "padding:8px;text-align:center" }, p), h("td", { style: "width:86px" }, sel(numOpts(6), f.plant[p], v => f.plant[p] = v, "0")))),
        h("tr", {}, h("td", { class: "sub" }, "Equipment on site"), h("td", { class: "sub" }, "QTY")),
        EQUIPMENT.map(p => h("tr", {}, h("td", { style: "padding:8px;text-align:center" }, p), h("td", { style: "width:86px" }, sel(numOpts(6), f.equip[p], v => f.equip[p] = v, "0"))))))),
    rowsTable("wide", ["No", "Work area", "Daily activities - work done", "Unit", "Location unit no", "QTY"], f.acts,
      (r, i) => h("tr", {}, h("td", { class: "no" }, i + 1), ...areaFor(r), h("td", { style: "min-width:120px" }, inp("text", r.loc, v => r.loc = v, "e.g. ITS 13")), h("td", { style: "width:80px" }, inp("number", r.qty, v => r.qty = v, "0"))),
      "+ Add activity", () => ({ area: f.acts.length ? f.acts[f.acts.length - 1].area : "" })),
    h("p", { class: "hint" }, "Swipe the activity table sideways on a small phone. Units fill in from the Fibraco work activities list. Once the project quantities are loaded, a TOT % column shows progress against them."),
    f.combined ? projectBar("Project progress (fills itself)") : null,
    sheet("", h("div", { class: "band" }, "Schedule ", h("small", {}, "(On, Ahead or Behind and reason)")),
      seg([["On", "On"], ["Ahead", "Ahead"], ["Behind", "Behind"]], f.sched, v => f.sched = v), txt(f.schedWhy, v => f.schedWhy = v, "Reason")),
    sheet("", h("div", { class: "band" }, "Site instruction"), h("table", {}, h("tbody", {},
      h("tr", {}, h("th", {}, "Written ", h("small", {}, "(name, designation, time and details)"))), h("tr", {}, h("td", {}, txt(f.written, v => f.written = v, "None today"))),
      h("tr", {}, h("th", {}, "Verbal ", h("small", {}, "(name, designation, time and details)"))), h("tr", {}, h("td", {}, txt(f.verbal, v => f.verbal = v, "None today")))))),
    rowsTable("", ["No", "Material delivered to site"], f.mats, (r, i) => h("tr", {}, h("td", { class: "no" }, i + 1), h("td", {}, inp("text", r.m, v => r.m = v, "Material, qty and delivery note"))), "+ Add material", () => ({})),
    rowsTable("", ["No", "Delays (weather, strikes, access etc.)", "Time lost"], f.delays, (r, i) => h("tr", {}, h("td", { class: "no" }, i + 1), h("td", {}, inp("text", r.c, v => r.c = v, "Cause"),
      f.combined ? h("div", { style: "margin-top:4px" }, h("div", { class: "hint", style: "margin:2px 0" }, "Client sees it on the diary, or Internal (Fibraco only)?"),
        seg([["Client", "Client"], ["Internal", "Internal"]], (r.int !== undefined ? r.int : isInternal(r.c)) ? "Internal" : "Client", v => { r.int = v === "Internal"; })) : null),
      h("td", { style: "width:96px" }, inp("text", r.t, v => r.t = v, "Hrs"))), "+ Add delay", () => ({})),
    sheet("", h("div", { class: "band" }, "Photo diary"), photoBlock(f.photos)),
    f.combined ? h("p", { class: "hint" }, "No signature here. You sign once, in step 3 on the review page. The client signs on his own link the next morning.") : sheet("", h("div", { class: "band" }, "Representative"), h("table", {}, h("thead", {}, h("tr", {}, h("th", {}, ""), h("th", {}, "Fibraco rep"), h("th", {}, "Client rep"))), h("tbody", {},
      h("tr", {}, h("td", { class: "lab", style: "width:24%" }, "Name"), h("td", { class: "ro" }, f.user), h("td", {}, inp("text", f.clientRep, v => f.clientRep = v, "Client name"))),
      h("tr", {}, h("td", { class: "lab" }, "Signature"), h("td", {}, sigCell(() => f.sigF, v => f.sigF = v, "Fibraco rep signature", true)), h("td", {}, sigCell(() => f.sigC, v => f.sigC = v, "Client rep signature")))))),
    f.combined ? submitBtn(() => [], { label: "Save and back to review", onDone: () => { S.siteDone[dayKey()] = true; Store.put("site|" + dayKey(), formRecord(f)); clearDraft(); S.formDirty = false; S.hist.pop(); S.view = "review"; render(); window.scrollTo(0, 0); } }) : submitBtn(() => { const e = []; if (!f.team.some(r => r.name)) e.push("Add at least one person to the project team."); if (!f.acts.some(r => r.act)) e.push("Add at least one activity."); if (!f.sigF) e.push("The Fibraco rep must sign."); return e; })];
}

// Wind and weather on the DSTI (Wolf safety file FIB-PLN-001): check before work and every 2 hours.
// Stop work at height at 12.5 m/s, in rain, mist or lightning, or above 38 degrees.
const WX = ["Clear", "Cloudy", "Rain", "Mist", "Lightning", "Above 38 °C"], WX_STOP = ["Rain", "Mist", "Lightning", "Above 38 °C"];
const windStop = r => r && ((+r.ms >= 12.5) || WX_STOP.includes(r.cond));
const riskAssessor = p => p && p.appts ? Object.keys(p.appts).find(n => (p.team || {})[n] && p.appts[n].appts.some(a => /CR 9\(1\)/.test(a))) || null : null;
function windTable(f) {
  const banner = h("div", { class: "wx-stop", hidden: true, role: "alert" });
  const upd = () => { const bad = f.wind.filter(windStop); banner.hidden = !bad.length; banner.replaceChildren(h("b", {}, "STOP WORK AT HEIGHT"), h("small", {}, bad.map(r => `${r.t || "?"}: ${+r.ms >= 12.5 ? r.ms + " m/s" : ""}${+r.ms >= 12.5 && WX_STOP.includes(r.cond) ? ", " : ""}${WX_STOP.includes(r.cond) ? r.cond : ""}`).join("  |  ") + ". Come down and tell the site manager.")); };
  const t = rowsTable("", ["Time", "Wind m/s", "Weather"], f.wind, r => h("tr", {}, h("td", { style: "width:80px" }, inp("text", r.t, v => { r.t = v; upd(); }, "09h00")), h("td", { style: "width:90px" }, inp("number", r.ms, v => { r.ms = v; upd(); }, "m/s")), h("td", {}, sel(WX, r.cond, v => { r.cond = v; upd(); }, "Choose"))), "+ Add reading", () => ({ t: hhmm(new Date()) }));
  upd();
  return sheet("", h("div", { class: "band" }, "WIND AND WEATHER ", h("small", {}, "(before work, then every 2 hours)")), h("p", { class: "hint", style: "margin:6px 8px" }, "Stop work at height at 12.5 m/s or more, in rain, mist or lightning, or above 38 °C."), t, banner);
}
function vDsti() {
  const f = S.form;
  const tb = h("tbody");
  const drawHz = () => {
    tb.replaceChildren(...HAZARDS.flatMap((hz, i) => {
      const v = f.hz[hz] || (f.hz[hz] = {});
      const main = h("tr", {}, h("td", { class: "no" }, i + 1), h("td", { style: "padding:8px;font-weight:600" }, hz),
        h("td", { style: "width:150px" }, seg([["H", "H"], ["M", "M"], ["L", "L"]], v.r, r => { v.r = r; drawHz(); })));
      if (!v.r) return [main];
      return [main, h("tr", { class: "hz-extra" }, h("td", {}), h("td", { colspan: 2 },
        inp("text", v.risk, x => v.risk = x, "Associated risk"), txt(v.ctrl, x => v.ctrl = x, "Control measures")))];
    }));
  };
  drawHz();
  const ppe = h("div", { class: "chips" }, PPE.map(p => { const b = h("button", { type: "button", class: f.ppe.includes(p) ? "on" : "", "aria-pressed": f.ppe.includes(p) ? "true" : "false", onclick: () => { const on = f.ppe.includes(p); f.ppe = on ? f.ppe.filter(x => x !== p) : [...f.ppe, p]; b.classList.toggle("on", !on); b.setAttribute("aria-pressed", String(!on)); } }, p); return b; }));
  return [...formHead("DSTI", "Fibraco DSTI. Complete daily before any task starts and before starting a new task."),
    sheet("", h("div", { class: "band" }, "DSTI"), h("table", {}, h("tbody", {},
      h("tr", {}, h("td", { class: "lab" }, "Site name", h("span", { class: "auto" }, "auto")), h("td", { class: "ro" }, f.project ? f.project.name : "")),
      h("tr", {}, h("td", { class: "lab" }, "Date", h("span", { class: "auto" }, "auto")), h("td", { class: "ro" }, nice(f.date))),
      h("tr", {}, h("td", { class: "lab" }, "Work instructions for this task"), h("td", {}, sel(MS, f.ms, v => f.ms = v, "Choose method statement"))),
      h("tr", {}, h("td", { class: "lab" }, "Toolbox talk topic"), h("td", {}, inp("text", f.tbt, v => f.tbt = v, "Topic"))))),
      h("div", { class: "band" }, "What task is being performed today?"), txt(f.task, v => f.task = v, "Describe the task")),
    f.project && f.project.wind ? windTable(f) : null,
    sheet("", h("div", { class: "band" }, "Hazards and risks ", h("small", {}, "(tap H, M or L, then add risk and controls)")), h("table", {}, h("thead", {}, h("tr", {}, h("th", {}, "No"), h("th", { class: "l" }, "Hazard"), h("th", {}, "Rating"))), tb)),
    sheet("", h("div", { class: "band" }, "What PPE is required for this task?"), ppe),
    rowsTable("", ["Occupation", "Name", "Signature"], f.ack, r => h("tr", {}, h("td", { style: "padding:8px;font-weight:600;font-size:12.5px" }, r.occ), h("td", { style: "min-width:120px" }, sel(STAFF, r.name, v => r.name = v, "Name")), h("td", { style: "width:110px" }, sigCell(() => r.sig, v => r.sig = v, `${r.occ} signature`))), "+ Add person", () => ({ occ: "Crew", name: "", sig: "" })),
    h("p", { class: "hint" }, "Acknowledgement. I am conversant with the work instructions and the risks of this task, I will work according to them, and I will report any unsafe condition."),
    sheet("", h("table", {}, h("tbody", {},
      h("tr", {}, h("td", { class: "lab" }, "CR 9(1) risk assessor"), h("td", {}, sel(STAFF, f.assessor, v => f.assessor = v, "Name"))),
      h("tr", {}, h("td", { class: "lab" }, f.assessor && f.assessor !== S.user ? `Signature (${S.user}, completed by)` : "Signature"), h("td", {}, sigCell(() => f.sigA, v => f.sigA = v, "Risk assessor signature", true)))))),
    submitBtn(() => { const e = []; if (!f.task.trim()) e.push("Describe the task being performed today."); if (f.project && f.project.wind && !(f.wind || []).some(r => r.t && r.ms !== undefined && r.ms !== "" && r.cond)) e.push("Take the first wind reading: time, m/s and weather."); if (!Object.values(f.hz).some(x => x.r)) e.push("Rate at least one hazard."); if (!f.ack.some(a => a.name && a.sig)) e.push("At least one crew member must sign on."); if (!f.sigA) e.push("The risk assessor must sign."); return e; })];
}

function vInspection() {
  const f = S.form;
  const box = h("div");
  const drawActs = () => box.replaceChildren(...f.acts.map((a, i) => sheet("",
    h("div", { class: "band activity-head" }, h("span", {}, `Activity ${i + 1}`), f.acts.length > 1 ? h("button", { type: "button", onclick: () => { f.acts.splice(i, 1); drawActs(); } }, "Remove") : h("span")),
    h("table", {}, h("tbody", {},
      h("tr", {}, h("th", { class: "l" }, "SOW description ", h("small", {}, "(what the client wants us to do)"))),
      h("tr", {}, h("td", {}, txt(a.sow, v => a.sow = v, "e.g. Splicing of 24 patch panels, testing of fibre cables"))),
      h("tr", {}, h("th", { class: "l" }, "Location")), h("tr", {}, h("td", {}, gpsBlock(a, "gps"))),
      h("tr", {}, h("th", { class: "l" }, "Comments")), h("tr", {}, h("td", {}, txt(a.comments, v => a.comments = v, "Comments"))),
      h("tr", {}, h("th", { class: "l" }, "Site photos")), h("tr", {}, h("td", {}, photoBlock(a.photos))))))));
  drawActs();
  return [...formHead("Site inspection", "Site visit for scoping a job. Each activity gets its own description, location, comments and photos."),
    sheet("", h("div", { class: "band" }, "Client details"), h("table", {}, h("tbody", {},
      h("tr", {}, h("td", { class: "lab" }, "Company name"), h("td", {}, inp("text", f.company, v => f.company = v, "Client company"))),
      h("tr", {}, h("td", { class: "lab" }, "Contact person name"), h("td", {}, inp("text", f.contact, v => f.contact = v, "Name"))),
      h("tr", {}, h("td", { class: "lab" }, "Contact number"), h("td", {}, inp("tel", f.number, v => f.number = v, "Mobile or office"))),
      h("tr", {}, h("td", { class: "lab" }, "Email"), h("td", {}, inp("email", f.email, v => f.email = v, "Work email")))))),
    box,
    h("button", { class: "mbtn", style: "margin-bottom:16px", onclick: () => { f.acts.push({ sow: "", comments: "", photos: [] }); drawActs(); } }, "+ Add activity"),
    submitBtn(() => { const e = []; if (!f.company.trim()) e.push("Type the client company name."); if (!f.acts[0].sow.trim()) e.push("Describe the scope of work."); return e; })];
}

function submitBtn(check, opts) {
  opts = opts || {};
  const errBox = h("div", { class: "err", hidden: true, role: "alert" });
  return h("div", {}, errBox, h("button", { class: "submit", type: "button", onclick: () => {
    const e = check();
    if (e.length) { errBox.hidden = false; errBox.replaceChildren(...e.map(x => h("div", {}, x))); errBox.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    if (opts.onDone) return opts.onDone();
    const f = S.form; if (f.project) S.done[f.project.id + "|" + ymd(f.date)] = true;
    if (!canWrite(S.user)) { showInfo("View only", "You can look at this project but not submit on it."); return; }
    saveForm(f);
    go("done");
  } }, opts.label || "Submit"));
}
function vDone() {
  const f = S.form;
  const names = { diary: ["1. Daily Diaries", "Daily Diary", "xlsx", "x"], dsti: ["2. DSTI", "DSTI", "docx", "w"], inspection: ["3. Site Inspections", "Site Inspection", "docx", "w"],
    toolbox: ["5. Toolbox Talks", "Toolbox Talk", "docx", "w"], check: ["7. Inspection Checklists", f.key ? CHECKS[f.key].title : "Inspection", "docx", "w"],
    incident: ["8. Incidents", "Incident Report", "docx", "w"], nearmiss: ["8. Incidents", "Near-Miss Report", "docx", "w"], invest: ["8. Incidents", "Incident Investigation", "docx", "w"], jobobs: ["6. Behavioural Observations", "Behavioural Observation", "docx", "w"], si: ["9. Site Instructions", "Site Instruction SI-001", "docx", "w"], order: ["10. Orders", "Material Order OR-001", "docx", "w"] }[f.type];
  const proj = f.project ? f.project.name : "Site inspections (no project yet)";
  const short = f.project ? f.project.short : (f.company || "New site");
  const base = `FIBRACO - ${names[1]} - ${short} (${dmy(f.date)})`;
  const root = `Fibraco App \\ 2. Completed Forms \\ ${proj} \\ ${names[0]}`;
  return [topbar("Submitted", short, false), h("div", { class: "done" },
    h("div", { class: "tick", "aria-hidden": "true" }, "✓"),
    h("h1", { class: "big", style: "margin-bottom:6px" }, "Submitted"),
    h("p", { class: "note", style: "margin-top:0" }, Store.online() ? "Saved and sent to the office." : "Saved on this phone. It sends by itself as soon as the phone has signal."),
    h("div", { class: "files" }, h("b", {}, "Where it is kept"), h("div", { style: "font-size:13px;margin-top:4px" }, `Safely in the app, under ${short} on ${dmy(f.date)}. The office sees it straight away.`)),
    f.type === "diary" && f.project && S.final[f.project.id + "|" + ymd(f.date)] ? h("button", { class: "submit", type: "button", style: "margin-top:12px", onclick: () => sendDiary(f.project.id + "|" + ymd(f.date), f.project, f.date) }, "Send diary") : null,
    f.type === "order" ? h("div", { class: "err", style: "margin-top:12px;background:#fff4e0;border-color:#f29900;color:#8a4b00" }, "Not done yet. Send the order to Wanro now, or it is not ordered.") : null,
    f.type === "order" ? h("button", { class: "submit", type: "button", style: "margin-top:8px", onclick: () => sendOrder(f) }, "Send order to Wanro") : null,
    f.type === "order" ? h("p", { class: "note", style: "margin-top:6px" }, `Makes the PDF (${orderNo(f)}) and opens email and WhatsApp. Send it to wanro@fibraco.co.za.`) : null,
    f.type === "diary" && f.project && S.final[f.project.id + "|" + ymd(f.date)] ? h("p", { class: "note", style: "margin-top:6px" }, "The diary and DSTIs are emailed to the client by themselves. This button is only if you also want to share the diary yourself.") : null,
    f.type === "diary" && f.project ? reportStatus(f.project, ymd(f.date)) : null,
    h("div", { class: "stack" },
      f.type === "diary" && f.project && S.final[f.project.id + "|" + ymd(f.date)] ? h("button", { class: "mbtn", onclick: () => { S.hist = ["projects", "calendar", "menu"]; S.view = "review"; render(); window.scrollTo(0, 0); } }, "Back to diary review", h("small", {}, "Client sign-off and KPIs")) : null,
      f.project && APPT(f.project) ? h("button", { class: "mbtn", onclick: () => { const t = S.ckBack === "today"; S.hist = t ? ["projects"] : ["projects", "calendar", "menu"]; S.view = t ? "today" : "mychecks"; render(); window.scrollTo(0, 0); } }, "Back to my checks") : null,
      f.project ? h("button", { class: "mbtn", onclick: () => { S.hist = ["projects", "calendar"]; S.view = "menu"; render(); window.scrollTo(0, 0); } }, "Back to project") : null,
      h("button", { class: "mbtn ghost", onclick: () => { S.hist = []; S.view = "projects"; render(); window.scrollTo(0, 0); } }, "Back to projects")))];
}

const TALKS = [{"n": 1, "t": "Hardhats, Eye protection, Safety shoes", "s": [{"h": "Hardhats", "b": ["It prevents head injuries", "It must be worn at all times", "Ask attendees if their hardhats has ever prevented injuries"]}, {"h": "Eye protection", "b": ["Use at all times where instructed", "Use the right goggles when cutting, grinding, welding chipping, etc", "Side shields are available in windy areas"]}, {"h": "Safety shoes", "b": ["Wear at all times on any site", "Keep in a good condition", "Do not wear broken, damaged boots"]}]}, {"n": 2, "t": "Speed limits, Mobile equipment, Passengers", "s": [{"h": "Speed limits", "b": ["Observe all signposted speedlimits", "Report reckless driving to your supervisor", "Reduce your speed in bad weather, bad road conditions and dust"]}, {"h": "Mobile equipment", "b": ["Complete the daily pre-start checklist before you start work", "Do not operate unsafe machines", "In vehicles always wear seatbelts"]}, {"h": "Passengers", "b": ["Never give unauthorised passengers lifts", "Never take passengers on earthmoving equipment"]}]}, {"n": 3, "t": "Lock out procedures, Safety belts in vehicles, Handrails", "s": [{"h": "Lock out procedures", "b": ["Make sure power is isolated by supervisor before repairs begin", "Make sure locks has been fitted by the supervisor", "Test the start button before repairs begin"]}, {"h": "Safety belts in vehicles", "b": ["It is law to always wear safety belts", "If the safety belt is broken, report it to the supervisor", "Safety belts are there to protect you"]}, {"h": "Handrails", "b": ["Report broken handrails", "Always barricade broken handrails"]}]}, {"n": 4, "t": "Heat exhaustion, Housekeeping, Overhead powerlines", "s": [{"h": "Heat exhaustion", "b": ["Drink plenty of fluids in hot weather to protect your body", "Symptoms of heat exhaustion are : dizziness, nausea, feeling weak"]}, {"h": "Housekeeping", "b": ["Put all waste in proper bins", "Clean up after you have done any job", "Keep vehicle cabs free from litter"]}, {"h": "Overhead powerlines", "b": ["Keep away from overhead powerlines", "Do not attempt to reach upto or climb upto overhead powerlines", "Do not go near fallen or damaged powerlines"]}]}, {"n": 5, "t": "Health and safety representatives, Teamwork, Hearing protection", "s": [{"h": "Health and safety representatives", "b": ["Your representatives are there to help you", "Always report any danger to your representative", "You have a right to refuse to work in unsafe areas"]}, {"h": "Teamwork", "b": ["Teamwork prevents injuries", "Tell fellow workers if they work unsafely", "Help other workers should they require it"]}, {"h": "Hearing protection", "b": ["We  use hearing protection to protect our hearing", "If you cannot talk to some one in a normal voice, the area probably requires that hearing protection be worn"]}]}, {"n": 6, "t": "Attitude, Dust masks/respirators, Skin rashes", "s": [{"h": "Attitude", "b": ["Attitude is the feeling or moods you are experiencing", "Be very cautious when working during emotional times, like the death of a relative", "Be alert to surrounding conditions"]}, {"h": "Dust masks/respirators", "b": ["These are used to protect your lungs", "Always use them when the area is dusty", "Make sure they fit properly"]}, {"h": "Skin rashes", "b": ["Can occur in dusty or hot conditions", "Washing and clean clothes can prevent skin rashes", "If serious, report to your representative"]}]}, {"n": 7, "t": "Fall hazards, Unsafe acts, Short cuts", "s": [{"h": "Fall hazards", "b": ["Keep walkways clear – remove all objects lying on designated walkways", "Always use safety belts when working above groundlevel", "Make sure they safety belt is properly anchored"]}, {"h": "Unsafe acts", "b": ["It is the primary cause of all accidents", "People commit unsafe acts – not equipment", "Always report unsafe conditions"]}, {"h": "Short cuts", "b": ["Always use steps and ladders – do not climb up structures", "Use demarcated walkways – not short cuts", "Use demarcated roads – not short cuts"]}]}, {"n": 8, "t": "Flammable liquids, Fire extinguishers, Playing around", "s": [{"h": "Flammable liquids", "b": ["Flammable liquid vapours cause explosions", "Store flammable liquids in proper containers", "Observe no smoking signs"]}, {"h": "Fire extinguishers", "b": ["They are only designed for smaller fires", "Aim at base of fire and use a sweeping motion", "Never block your way of escape when fighting a fire"]}, {"h": "Playing around", "b": ["Playing practical jokes at work could be dangerous", "The job is important – be professional"]}]}, {"n": 9, "t": "Pry bars/tommy bars, Personal safety, Hand safety", "s": [{"h": "Pry bars/tommy bars", "b": ["Never use screwdrivers as pry bars or strike pry bars with a hammer", "Be prepared for pry bars to slip when using it a handle for a turfer (come-along)"]}, {"h": "Personal safety", "b": ["Long hair must be secured under a hardhat to prevent entanglement with moving machinery", "Personal items such as watches, rings, necklaces must not create opportunity for entanglement"]}, {"h": "Hand safety", "b": ["Wear gloves when handling wire rope, sharp or hot objects", "Watch where you place your hands – many fingers have been lost"]}]}, {"n": 10, "t": "Compressed airlines, Clothing, Personal protective equipment", "s": [{"h": "Compressed airlines", "b": ["Always bleed air from cylinders and tanks before repairs", "Never place your finger over a small hole in an airline – the air could puncture your skin", "Never direct compressed air at yourself or anybody"]}, {"h": "Clothing", "b": ["Never wear loose or torn clothing that could become entangled in machinery", "Wear proper ppe when cutting, welding, grinding and chipping", "Keep clothes free of oil and grease when cutting or welding as it may catch fire"]}, {"h": "Personal protective equipment", "b": ["Use earplugs/ear muffs in designated areas", "Clean earplugs before every use", "It protects your hearing"]}]}, {"n": 11, "t": "Oxygen / acetylene torch safety, Lifting, Report injuries", "s": [{"h": "Oxygen / acetylene torch safety", "b": ["Make sure torches are equipped with flashback arrestors", "Repair torches, guages and lines immediately when defective", "Always secure gas cylinders in upright position"]}, {"h": "Lifting", "b": ["Get help when lifting or moving heavy objects", "Look for an escape route, before you lift, should the object fall", "Watch your feet, should the object fall"]}, {"h": "Report injuries", "b": ["All injuries, no matter how small, must be reported", "Insist on immediate first aid assistance", "Rather get medical help for more serious injuries"]}]}, {"n": 12, "t": "Safety harnesses, Crane safety, Safety glasses", "s": [{"h": "Safety harnesses", "b": ["Safety harnesses must be worn whenever there is danger that you may fall", "Safety harnesses must be kept clean and in a good condition", "Safety harnesses must be properly achored and adjusted for your conditions"]}, {"h": "Crane safety", "b": ["Make sure the lift is within the crane capacity", "Make sure the outriggers are extended and on a firm base", "Always check the crane before use"]}, {"h": "Safety glasses", "b": ["Safety glasses must be worn in all designated areas", "It is better if safety glasses have side shields", "Only properly approved safety glasses may be worn", ""]}]}, {"n": 13, "t": "Removing bucket teeth, Personal conduct, Storage areas", "s": [{"h": "Removing bucket teeth", "b": ["Use hammer and chisel to remove teeth", "Watch your fingers/hands when removing teeth", "Always use safety glasses when removing teeth"]}, {"h": "Personal conduct", "b": ["Treat fellow employees with dignity and respect", "Pratice good housekeeping", "Report any unsafe issues you may find"]}, {"h": "Storage areas", "b": ["Keep storage areas free from litter, spillage and debris", "Clearly label all containers", "Keep shelves neat and organised"]}]}, {"n": 14, "t": "Operator fitness, Cleaning with water hoses, Safe access", "s": [{"h": "Operator fitness", "b": ["Never report to work under the influence of drugs or alcohol", "Try to leave personal problems at home", "Make sure you get enough rest between shifts"]}, {"h": "Cleaning with water hoses", "b": ["Grip hose firmly and turn on pressure gradually", "Never aim water at any electrical installation or apparatus", "Never aim water at people"]}, {"h": "Safe access", "b": ["Always use designated walkways", "Use a safety belt when working outside handrails", "Only use proper ladders and steps – don’t climb over equipment"]}]}, {"n": 15, "t": "Using a shovel, Pumps, Hydraulic systems", "s": [{"h": "Using a shovel", "b": ["Ensure that your footing is firm", "Grip the shovel firmly", "Do not use a shovel near pinch points"]}, {"h": "Pumps", "b": ["Ensure the pump is locked out before doing repairs", "Make sure pump lines are depressurised before disconnecting", "Never direct waterlines to electrical installations or equipment"]}, {"h": "Hydraulic systems", "b": ["Check flow diagram to ensure system is depressurised before commencing repairs", "Be aware of heat build-up in hydraulic systems", "Clean up any oil spills after repairs"]}]}, {"n": 16, "t": "Hand rails and walkways, Illegal drugs and alcohol, Label containers", "s": [{"h": "Hand rails and walkways", "b": ["Use handrails when climbing", "Keep walkways free of clutter and spillage", "Never climb over handrails"]}, {"h": "Illegal drugs and alcohol", "b": ["Is not allowed in workplaces", "Your, and your fellow employees lifes’ will be endangered", "Should you use drugs or alcohol on the job, you will be dismissed"]}, {"h": "Label containers", "b": ["Write contents on labels of containers", "Know emergency first aid procedure for spills", "Report spills to your supervisor"]}]}, {"n": 17, "t": "Good housekeeping, Reversing safely, Hand tools", "s": [{"h": "Good housekeeping", "b": ["Applies to all areas and mobile equipment", "Never let anything lie around after you worked in an area", "Clean up any spills immediately"]}, {"h": "Reversing safely", "b": ["Park so that reversing is avoided as far as possible", "Keep mirrors and windows clean, and look around", "Ensure that reverse alarms are always working"]}, {"h": "Hand tools", "b": ["Use the right tool for the job", "Keep tools in a safe place and in a good condition", "Use tools in the way they were intended to be used"]}]}, {"n": 18, "t": "Help reduce injury risks to others, Portable electric tools, Floor openings", "s": [{"h": "Help reduce injury risks to others", "b": ["Set an example by working safely", "Report any unsafe acts to your health and safety representative"]}, {"h": "Portable electric tools", "b": ["Do not use when damaged in any way – it will kill you", "Check that the plug and cable is 100% safe", "Take damaged electric tools to your supervisor"]}, {"h": "Floor openings", "b": ["Always keep floor openings covered", "If not covered install guardrails", "Keep properly marked"]}]}, {"n": 19, "t": "Report unsafe conditions, Welding, Chain hoist/chain blocks", "s": [{"h": "Report unsafe conditions", "b": ["It reduces the potential for injuries", "Report to your supervisor or representative", "It is your right not to work in unsafe conditions"]}, {"h": "Welding", "b": ["Use proper safety equipment", "Clear all flammable materials from the work area", "Is there proper ventilation?"]}, {"h": "Chain hoist/chain blocks", "b": ["Keep free from dirt and grease", "Do not use damaged chain blocks", "Do not exceed the maximum allowed tonnage"]}]}, {"n": 20, "t": "First aid, Falls, Moving items", "s": [{"h": "First aid", "b": ["Disinfect small cuts and abrasions and cover with bandage or plaster", "If there is foreign matter in the wound, get medical help", "Report all injuries, no matter how small they are"]}, {"h": "Falls", "b": ["Falls are the most frequent form of injuries", "Be careful in oily, greasy and muddy conditions", "Always hold onto something when climbing up or down"]}, {"h": "Moving items", "b": ["Check completely around you before moving something", "The bigger and heavier the items,the greater the risk of accidents", "Check your reverse alarm every day"]}]}, {"n": 21, "t": "Heat exhaustion, Heat stroke, Fractures", "s": [{"h": "Heat exhaustion", "b": ["Symptoms are weakness, nausea and dizziness", "It may be difficult to breathe", "Always take lots of fluids"]}, {"h": "Heat stroke", "b": ["The skin is hot and dry, face is red and the temperature is high", "Remove victim to cool place and remove as much as possible clothing", "Apply wet cloths and cool the person gradually", "Get medical help immediately"]}, {"h": "Fractures", "b": ["Immobilise the limb", "Call the first aider", "Get medical help immediately"]}]}, {"n": 22, "t": "First aid, Operating service pick-ups/bakkies, Fire prevention", "s": [{"h": "First aid", "b": ["Always know where the nearest first aid box is kept", "Always know who the first aiders are", "Never treat small injuries as insignificant"]}, {"h": "Operating service pick-ups/bakkies", "b": ["Never drive too close to earthmoving equipment", "Always drive on demarcated roads only", "Never leave a vehcile unattended with the engine running"]}, {"h": "Fire prevention", "b": ["Obey all “no smoking” signs strictly", "Do not place any items near fire extinguishers", "Check fire extinguishers regularly for damage"]}]}, {"n": 23, "t": "Lightning precautions, Crane operations, Mobile equipment", "s": [{"h": "Lightning precautions", "b": ["Stay inside buildings or vehicles during storms", "Stay away from metal structures that are not earthed", "Stay away from trees or high structures – seek low areas"]}, {"h": "Crane operations", "b": ["Respond to lifting signals from only one person – but “stop” signals from any person around", "Never leave a suspended load anattended", "Never swing a load over persons or equipment"]}, {"h": "Mobile equipment", "b": ["Never leave equipment unattended with bucket, boom or other attachments suspended in the air", "Block any suspended attachments before inspecting them", "Make sure you have the attention of the operator before mounting any mobile equipment"]}]}, {"n": 24, "t": "Containers, Personal safety, Eye protection", "s": [{"h": "Containers", "b": ["All containers must have their contents clearly marked", "Know how to dispose of used or unwanted containers", "Know the first aid procedure for chemicals"]}, {"h": "Personal safety", "b": ["Keep open flames away from any flammable goods", "Avoid overloading electrical plugs", "Do not drink and drive"]}, {"h": "Eye protection", "b": ["Do not look when somebody is cutting or welding", "Always use safety glasses when you are required to assist with cutting,welding or grinding", "Get medical help with foreign objects in your eyes"]}]}, {"n": 25, "t": "Working in hot weather, Electrical safety, General safety", "s": [{"h": "Working in hot weather", "b": ["Always drink plenty of water", "Aif you feel faint or light headed, sit down and drink water", "Do not overdress in hot weather"]}, {"h": "Electrical safety", "b": ["Always ensure any equipment is locked out before working on it", "Only qualified persons are allowed into substations", "Do not try to  reset any tripped equipment – call your supervisor"]}, {"h": "General safety", "b": ["Always be aware of your surroundings", "Never walk under a suspended load", "Report any hazards immediately"]}]}];
// ---------- daily inspections ----------
const OK3 = [["OK", "OK"], ["Defect", "DEF"], ["N/A", "N/A"]];
const INORDER = [["OK", "In order"], ["Defect", "Not in order"], ["N/A", "N/A"]];
// Fibraco checklists FIBRACO-HSE-CHECK-001 to 009 (Wolf safety file, Section 21), word for word. Legend: OK, DEF (defect) or N/A.
// Non-compliant equipment must not be used. Defective equipment is reported and returned to the store immediately.
const LEG = "Mark OK for compliance, DEF for non-compliance, N/A for not applicable. Non-compliant equipment must not be used. Defective equipment shall be reported and returned to the store immediately.";
const CHECKS = {
  ppe: { no: "FIBRACO-HSE-CHECK-007", title: "Daily PPE checklist", freq: "Daily before work", basis: "By signing you confirm all PPE is in good condition with no wear and tear. If defects are found on PPE, nobody may enter the work area or do any task until it is replaced.",
    details: [["Employee", "staff"], ["Designation", "text"]], ans: [["OK", "To standard"], ["Replace", "Not to standard"], ["N/A", "N/A"]],
    groups: [["PPE items", ["Gloves", "Ear plugs", "Goggles", "Safety shoes", "Overall", "Hard hat", "Reflector vest", "Harness"]]], addable: "+ Additional PPE" },
  vehicle: { no: "FIBRACO-HSE-CHECK-008", title: "Vehicle check", freq: "Daily before use", basis: "Weekly vehicle check sheet, one line per day. Done by the driver before use (CR 23).",
    details: [["Vehicle", "text", "e.g. Double Cab Pickup"], ["Registration no", "text"], ["Driver name", "staff"], ["Odometer reading (km)", "number"]], ans: INORDER,
    groups: [["Inspection checks", ["Vehicle and driver site authorization disk", "Check for validity of license disc", "Check engine oil level", "Check radiator fluid level", "Check fan belt condition", "Check brake fluid level", "Check for damaged water hoses", "Check windscreen washer container water level", "Check condition of spare wheel and tools", "Check if all windows are clean and free from damage", "Check vehicle bodywork for damage", "Check door locks and tail gate for proper operation", "Check the rear-view mirrors for damage", "Check condition of tires", "Check wheel rims and nuts for any visible damage", "Check the operation of head, brake and indicator lights", "Check the operation of the horn", "Check the operation of the windscreen wipers", "Check the condition and operation of the seat belts", "Check interior for damage", "Check condition of seating and adjusting mechanism", "Check strobe light operation (site only)", "Check jack and wheel changing tools", "Check emergency triangles", "Check steering for excessive play", "Check operation of foot and hand brake", "Check fuel level", "Check for any coolant and oil leaks", "Check the operation of the gauges and switches in general", "Check for excessive noise and emissions from the exhaust"]]] },
  mewp: { no: "FIBRACO-HSE-CHECK-009", title: "Cherry picker check", freq: "Daily before first use", basis: "Cherry picker (MEWP) pre-use check by the appointed operator (CR 53). JLG 450AJ, 15.5 m working height, SWL 227 kg. No work at height until this is done and fit for use.",
    details: [["Machine", "text", "e.g. JLG 450AJ"], ["Driver name", "staff"], ["Hour meter reading", "number"]], ans: INORDER,
    groups: [["Inspection checks", ["Check training certificate", "Check load test certificate", "SWL", "Working height 15.5 m", "Load chart visible and correct", "Emergency stops", "Strobe light", "Push buttons", "Switches (selector, key, limit)", "Cables, connections, batteries", "Control boards, joysticks, contactors", "Pulleys (wear, pins, runners)", "Tyres", "Runners (wear, pins, shafts)", "Wire ropes (anchor points, wear, lubrication)", "Platform (wear, pins, welding)", "Columns (wear, runners, pins, welding)", "Platform alignment", "Scissors (pins, bushes, wear)", "Boom (wear, play, straightness, cracks)", "Welding cracks (visual)", "Pump (leak, pressure, noise)", "Oil level", "Cylinders (leaks, mountings)", "Control valves (leaks, operation)", "Bypass valve (fitted, operation)", "Emergency valve", "Piping (leaks, condition)"]]] },
  // Hendrik from site, 26 Oct: cherry picker and harnesses checked together every morning, by Marcel (appointed operator)
  mewph: { no: "FIBRACO-HSE-CHECK-009 and 010", title: "Cherry picker and harness check", freq: "Daily before first use", basis: "Cherry picker (MEWP) pre-use check (FIBRACO-HSE-CHECK-009, CR 53) by the appointed operator, plus the harness and lanyard of every person going up in the basket (FIBRACO-HSE-CHECK-010, Construction Regulations 2014, regulation 10, and the site fall protection plan). JLG 450AJ, 15.5 m working height, SWL 227 kg. If anything is Not in order, nobody goes up.",
    details: [["Machine", "text", "e.g. JLG 450AJ"], ["Operator", "staff"], ["Hour meter reading", "number"], ["Person 1 in the basket", "staff"], ["Harness 1 serial no", "text"], ["Lanyard 1 serial no", "text"], ["Person 2 in the basket", "staff"], ["Harness 2 serial no", "text"], ["Lanyard 2 serial no", "text"]], ans: INORDER,
    groups: [["Cherry picker", ["Check training certificate", "Check load test certificate", "SWL", "Working height 15.5 m", "Load chart visible and correct", "Emergency stops", "Strobe light", "Push buttons", "Switches (selector, key, limit)", "Cables, connections, batteries", "Control boards, joysticks, contactors", "Pulleys (wear, pins, runners)", "Tyres", "Runners (wear, pins, shafts)", "Wire ropes (anchor points, wear, lubrication)", "Platform (wear, pins, welding)", "Columns (wear, runners, pins, welding)", "Platform alignment", "Scissors (pins, bushes, wear)", "Boom (wear, play, straightness, cracks)", "Welding cracks (visual)", "Pump (leak, pressure, noise)", "Oil level", "Cylinders (leaks, mountings)", "Control valves (leaks, operation)", "Bypass valve (fitted, operation)", "Emergency valve", "Piping (leaks, condition)", "Ground controls lower the basket (rescue)"]],
             ["Harness and lanyard, person 1 (FIBRACO-HSE-CHECK-010)", ["Webbing free of cuts, fraying, burns, holes or melted fibres", "No chemical damage, paint, stains or hardening of the webbing", "No excessive wear, UV fading or stretching", "Stitching intact, no pulled, cut or broken stitches", "Fall indicator not deployed (harness has not arrested a fall)", "Dorsal and sternal D-rings free of cracks, bends, corrosion and sharp edges", "Buckles and adjusters work and lock correctly", "Keepers and strap ends in place", "Label legible with serial number, date of manufacture and standard", "Inspection tag present and within the 6-monthly date", "Harness within the manufacturer's service life", "Lanyard webbing or rope free of cuts, fraying and damage", "Energy absorber pack intact, cover closed, not deployed", "Snap hooks and karabiners close and lock automatically", "Connectors free of cracks, deformation and corrosion", "Short restraint lanyard used in the cherry picker basket", "Harness put on correctly, all straps adjusted snug, leg straps fastened", "Buddy check done before going up in the basket", "Harness and lanyard stored clean and dry in the bag after use"]],
             ["Harness and lanyard, person 2 (N/A if only one goes up)", ["Webbing free of cuts, fraying, burns, holes or melted fibres", "No chemical damage, paint, stains or hardening of the webbing", "No excessive wear, UV fading or stretching", "Stitching intact, no pulled, cut or broken stitches", "Fall indicator not deployed (harness has not arrested a fall)", "Dorsal and sternal D-rings free of cracks, bends, corrosion and sharp edges", "Buckles and adjusters work and lock correctly", "Keepers and strap ends in place", "Label legible with serial number, date of manufacture and standard", "Inspection tag present and within the 6-monthly date", "Harness within the manufacturer's service life", "Lanyard webbing or rope free of cuts, fraying and damage", "Energy absorber pack intact, cover closed, not deployed", "Snap hooks and karabiners close and lock automatically", "Connectors free of cracks, deformation and corrosion", "Short restraint lanyard used in the cherry picker basket", "Harness put on correctly, all straps adjusted snug, leg straps fastened", "Buddy check done before going up in the basket", "Harness and lanyard stored clean and dry in the bag after use"]]] },
  ladder: { no: "FIBRACO-HSE-CHECK-001", title: "Ladder inspection", freq: "Before use, recorded monthly", basis: "General Safety Regulations 13A. " + LEG,
    details: [["Ladder number", "text"]], ans: OK3,
    groups: [["Inspection", ["Ladder number identified", "Safe load limit identified", "No damage, cracks or bends evident", "Ladder clean and free from splinters or exposed fibres", "Free of corrosion", "Spreader bars undamaged", "Non-skid devices fitted", "Extension locks not defective", "Rungs or steps not loose or missing", "No loose bolts or rivets"]],
             ["Permanently marked in a prominent position", ["A warning against standing any higher than second from the top step (stepladder not being a platform stepladder)", "A warning against standing any higher than the third from the top step (single or extension ladder)"]]] },
  extension: { no: "FIBRACO-HSE-CHECK-002", title: "Electrical extension inspection", freq: "Before use, recorded monthly", basis: "CR 24(e) portable electrical equipment. " + LEG,
    details: [["Extension number", "text"]], ans: OK3,
    groups: [["Inspection", ["Extension number identified", "Length identified", "Cable wires not exposed at connections", "Electrical cord without damage or joints", "Plug and weatherproof socket undamaged", "Unit colour coded"]]] },
  tools: { no: "FIBRACO-HSE-CHECK-003", title: "Hand tool checklist", freq: "Before use, recorded monthly", basis: "OHS Act section 8(2), hand tool inspector. " + LEG,
    details: [["Tool number", "text"], ["Tool type", "text", "e.g. side cutters, hammer"]], ans: OK3,
    groups: [["Inspection", ["No homemade tool", "Lanyard fitted for elevated work", "Tool not painted", "No cracks evident", "Tool not bent or damaged", "Ring not damaged and operational", "Flat face undamaged and operational", "Chisels, spades, picks, etc sharp and true", "Handles on spades, forks, picks, hammers, etc undamaged", "No mushroomed chisels, wedges, drifts, slogging spanners"]]] },
  drill: { no: "FIBRACO-HSE-CHECK-004", title: "Portable drill inspection", freq: "Before use, recorded monthly", basis: "CR 24(e) portable electrical equipment. " + LEG,
    details: [["Drill or tool number", "text"]], ans: OK3,
    groups: [["Inspection", ["Plug and weatherproof socket undamaged", "Cable without damage or joints", "Cable wires not exposed at connections", "Housing secure and in good condition", "Switches operational", "Handles in place and secure", "Spindle and bearing not loose", "Chuck and key in good working order", "Plant number identified", "Unit colour coded"]]] },
  generator: { no: "FIBRACO-HSE-CHECK-005", title: "Generator (petrol) inspection", freq: "Before use, recorded monthly", basis: "CR 24(e) portable electrical equipment. " + LEG,
    details: [["Generator number", "text"]], ans: OK3,
    groups: [["Inspection", ["Generator number identified", "Housing secure and good condition", "Start and stop devices fully functional", "Cover plates (guards) cover all moving parts (pulleys, fans)", "Cables without joints or damage", "Correct socket plug fitted and undamaged", "No exposed wires at connections", "Earth leakage switch fitted and working", "Fuel caps", "Fuel and oil leaks", "Drip tray", "Wheels, tyres, nuts", "Chassis", "Unit colour coded"]]] },
  firstaid: { no: "FIBRACO-HSE-CHECK-006", title: "First aid box register", freq: "Monthly and after use", basis: "General Safety Regulations 3(4), first aider. " + LEG,
    details: [["First aid box number", "text"], ["First aider", "staff"]], ans: OK3,
    groups: [["Inspection", ["First aid box identified", "Name of first aider identified on first aid box", "Material safety data sheets available", "Wound cleaner or antiseptic (100 ml)", "Swabs for cleaning wounds", "Cotton wool for padding (100 g)", "Sterile gauze (minimum of 10)", "Forceps (tweezers)", "Scissors (100 mm)", "Safety pins (minimum of 4)", "Triangular bandages (minimum 4)", "Roller bandages (4 x 75 mm x 5 m)", "Roller bandages (4 x 100 mm x 5 m)", "Elastic adhesive tape (25 mm x 3 m)", "Non-allergenic adhesive tape (25 mm x 3 m)", "Assorted adhesive dressing (plasters x 10)", "First aid dressings (4 x 75 mm x 100 mm)", "First aid dressings (4 x 150 mm x 200 mm)", "Straight splints (x 2)", "Disposable latex gloves (x 4)", "CPR mouth piece (x 2)", "Disposable sanitised eye wash water", "Eye patch", "Folding stretcher", "First aider certificate available", "First aid treatment register available", "Unit in good general condition", "Item number identified"]]] },
  // FIBRACO-HSE-CHECK-010 Rev 00 (26 Oct 2026), word for word. Every day before use.
  harness: { no: "FIBRACO-HSE-CHECK-010", title: "Harness and lanyard check", freq: "Daily before use", basis: "Construction Regulations 2014, regulation 10, and the site fall protection plan. SANS 50361 / 50355 / 50362. Any item Defect: remove the harness or lanyard from use at once, tag it DO NOT USE and hand it to the Site Manager. A harness that has arrested a fall is never used again.",
    details: [["Name of user", "staff"], ["Harness make and model", "text"], ["Harness serial number", "text"], ["Date of manufacture", "date"], ["Lanyard serial number", "text"], ["Last formal inspection (6-monthly)", "date"]], ans: OK3,
    groups: [["Harness webbing and stitching", ["Webbing free of cuts, fraying, burns, holes or melted fibres", "No chemical damage, paint, stains or hardening of the webbing", "No excessive wear, UV fading or stretching", "Stitching intact, no pulled, cut or broken stitches", "Fall indicator not deployed (harness has not arrested a fall)"]],
             ["Hardware", ["Dorsal and sternal D-rings free of cracks, bends, corrosion and sharp edges", "Buckles and adjusters work and lock correctly", "Keepers and strap ends in place"]],
             ["Labels and records", ["Label legible with serial number, date of manufacture and standard", "Inspection tag present and within the 6-monthly date", "Harness within the manufacturer's service life"]],
             ["Lanyard and connectors", ["Lanyard webbing or rope free of cuts, fraying and damage", "Energy absorber pack intact, cover closed, not deployed", "Snap hooks and karabiners close and lock automatically", "Connectors free of cracks, deformation and corrosion", "Short restraint lanyard used in the cherry picker basket"]],
             ["Fit and storage", ["Harness put on correctly, all straps adjusted snug, leg straps fastened", "Buddy check done before going up in the basket", "Harness and lanyard stored clean and dry in the bag after use"]]] },
  fire: { title: "Fire extinguishers", freq: "Before use, recorded monthly", basis: "Construction Regulations 2014, regulation 29(g) and (h), fire equipment inspector. Tagged with the client's monthly colour code. Yearly service by an accredited provider.",
    details: [["Colour code this month", "select", ["Red", "Yellow", "Blue", "Green", "White", "Orange"]]], ans: [["Pass", "Pass"], ["Fail", "Fail"], ["N/A", "N/A"]], addable: "+ Add extinguisher",
    groups: [["Extinguishers (gauge in green, pin and seal intact, hose clear, service in date, mounted and signed)", ["Vehicle 1", "Vehicle 2", "Cherry picker", "Work area"]]] },
  stacking: { title: "Stacking and storage", freq: "Monthly", basis: "Construction Regulations 2014, regulation 28 and General Safety Regulations, regulation 8.",
    details: [["Store or laydown area", "text"]], ans: OK3,
    groups: [["Storage area", ["Demarcated and signed", "Ground level and firm", "Walkways clear"]],
             ["Stacking", ["Stacks stable and upright", "Items taken from the top only", "Nobody climbs on stacks"]],
             ["Cable drums", ["Drums upright on flanges", "Drums chocked against rolling", "Cable ends sealed with end caps"]],
             ["Hazards", ["Fibre offcuts in a sealed container", "Fuel, solvents and gas stored apart", "Safety data sheets available"]]] },
  // daily construction manager inspection, weekly SHE rep inspection and the emergency drill (Wolf safety file FIB-PLN-001 and FIB-PLN-002)
  siteinsp: { title: "Construction manager daily inspection", freq: "Daily", basis: "CR 8(1). The construction manager inspects the work daily (site health and safety plan, section 14).",
    details: [["Work area or turbine", "text", "e.g. WEA 12"]], ans: OK3,
    groups: [["Paperwork", ["DSTI done and signed by every person before work", "Toolbox talk held and on the register", "Permit in place (Vestas pause or Red Rocket permit) where needed", "Daily checks done (vehicle, cherry picker, PPE)"]],
             ["Work at height", ["Wind checked and recorded, below 12.5 m/s", "Harnesses worn and clipped to the basket anchor", "Two persons in the basket within 227 kg", "Ground person at the base controls", "Tools tethered, area below barricaded"]],
             ["Site", ["Barricading and signs in place", "Housekeeping, no litter, waste taken off site", "Fire extinguisher and first aid kit at the work area", "Spill kit and drip tray where fuel is used", "Vehicles parked safe, speed limits kept"]],
             ["People", ["PPE worn correctly", "Water, shade and sun protection", "Nobody working alone"]]] },
  sherep: { title: "SHE representative weekly inspection", freq: "Weekly", basis: "OHS Act section 17. The SHE representative inspects the workplace weekly and reports to the construction manager (site health and safety plan, section 14).",
    details: [["Areas inspected", "text"]], ans: OK3,
    groups: [["Workplace", ["Work areas barricaded and signed", "Housekeeping and waste", "Access roads and parking", "Emergency numbers and assembly point known"]],
             ["Equipment", ["Cherry picker checked daily and certificates valid", "Ladders, tools and extensions tagged this month", "Fire extinguishers in date and tagged", "First aid box complete"]],
             ["People", ["PPE in good condition and worn", "DSTI and toolbox talks signed daily", "Unsafe acts or conditions reported and fixed", "Near misses reported"]]] },
  edrill: { title: "Emergency drill record", freq: "Before work at height starts", basis: "Emergency preparedness and response plan, section 4. A drill, including a cherry picker rescue, is held with the team before work at height starts.",
    details: [["Scenario", "select", ["Cherry picker rescue", "Person injured", "Fire", "Snake bite", "Vehicle accident"]], ["Time to bring the person down (minutes)", "number"], ["People who took part", "text"]], ans: [["OK", "Done"], ["Defect", "Not done"], ["N/A", "N/A"]],
    groups: [["Drill steps", ["Alarm raised and the team responded", "Ground person lowered the basket with the ground or emergency controls", "Person down within 15 minutes", "First aider responded with the first aid kit", "Emergency numbers called (GardMed and Red Rocket), or simulated", "Person sent to meet the ambulance at the gate", "Rescue equipment available and working"]]] }
};
const INSPECT_ORDER = ["toolbox", "ppe", "vehicle", "mewph", "mewp", "ladder", "extension", "tools", "drill", "generator", "harness", "firstaid", "fire", "stacking", "siteinsp", "sherep", "edrill"];

function vInspections() {
  return [topbar("Daily inspections", S.project.short, true), projCard(S.project),
    h("div", { class: "stack" }, INSPECT_ORDER.map(k => k === "toolbox"
      ? h("button", { class: "mbtn", onclick: () => startForm("toolbox") }, "Daily toolbox talk", h("small", {}, "Daily before work"))
      : h("button", { class: "mbtn", onclick: () => startForm("check", k) }, CHECKS[k].title, h("small", {}, CHECKS[k].freq + (CHECKS[k].no ? "  |  " + CHECKS[k].no : ""))))),
    h("p", { class: "note" }, "Each one files under the project in its own folder, ready for audits.")];
}

// ---------- My checks: each person's appointments from the safety file drive his own list of checks ----------
// Ring-fence rule: the organogram, the appointment register and the app checklists match, per person, per site.
const APPT = (p, who) => ((p && p.appts) || {})[who || S.user] || null;
const CK_EXTRA = { dsti: ["DSTI", "Lead the crew DSTI, wind readings on it"], jobobs: ["Job observation", "Watch one task, safe or unsafe"], invest: ["Incident investigation", "Each incident or near miss gets investigated"], flash: ["Flash report to the client", "Within 24 hours of an incident or near miss"] };
const ckName = k => CHECKS[k] ? CHECKS[k].title : (CK_EXTRA[k] || [k])[0];
const OFTEN = { daily: "Every day", weekly: "Every week", monthly: "Before use, record monthly", once: "Once, before work at height", event: "When it happens" };
function weekStart(ds) { const d = new Date(ds + "T12:00:00"), w = (d.getDay() + 6) % 7; d.setDate(d.getDate() - w); return ymd(d); }
function myForms(p, who, k) {
  const type = CHECKS[k] ? "check" : k;
  return Store.list(`form|${p.id}|`).map(([, o]) => o).filter(o => o && o.type === type && (type !== "check" || o.key === k) && (o.savedBy === who || o.user === who));
}
const incidentsOf = p => Store.list(`form|${p.id}|`).map(([id, o]) => o && Object.assign({ _id: id }, o)).filter(o => o && ["incident", "nearmiss"].includes(o.type)).sort((a, b) => (a.savedAt || "").localeCompare(b.savedAt || ""));
const investOf = (p, id) => Store.list(`form|${p.id}|`).map(([, o]) => o).find(o => o && o.type === "invest" && o.ref === id);
function myChecks(p, who, ds) {
  const a = APPT(p, who); if (!a) return [];
  const out = [];
  for (const [k, often] of a.checks) {
    if (k.startsWith("watch:")) {
      const [, key, person] = k.split(":"), first = person.split(" ")[0], done = myForms(p, person, key).some(o => o.date === ds);
      out.push({ k, often, watch: true, person, key, title: `${first}'s ${ckName(key).toLowerCase()}`, st: done ? "done" : "due", sub: done ? "Done today, filed under Inspections" : `${first} must do it before anyone goes up` });
      continue;
    }
    if (often === "event") {
      for (const r of incidentsOf(p)) {
        const what = `${r.type === "nearmiss" ? "Near miss" : "Incident"} ${dmy(new Date(r.date + "T12:00:00"))}${r.where ? ", " + r.where : ""}`;
        const age = (Date.now() - Date.parse(r.savedAt || 0)) / 36e5;
        if (k === "invest") { const inv = investOf(p, r._id); out.push({ k, often, ref: r, title: "Investigate: " + what, st: inv ? "done" : age > 72 ? "late" : "due", sub: inv ? `Investigated by ${inv.savedBy}` : "GAR 9(2). Find the cause and the corrective actions" }); }
        if (k === "flash") { const m = Store.get(`flash|${r._id}`), pend = mqGet().find(j => j.flash === r._id); out.push({ k, often, ref: r, title: "Flash report: " + what, st: m ? "done" : pend ? "wait" : age > 24 ? "late" : "due", sub: m ? `Sent ${m.at} to ${(m.to || []).join(", ")}` : pend ? "Waiting for signal, it goes by itself" : "Send to the client within 24 hours" }); }
      }
      continue;
    }
    // the DSTI is one per crew per day: done when any supervisor on the project has done it
    const forms = k === "dsti" ? Store.list(`form|${p.id}|`).map(([, o]) => o).filter(o => o && o.type === "dsti") : myForms(p, who, k);
    const list = forms.map(o => o.date).sort(), last = list[list.length - 1];
    let done, late = false;
    if (often === "daily") done = list.includes(ds);
    else if (often === "weekly") { done = list.some(x => weekStart(x) === weekStart(ds) && x <= ds); late = new Date(ds + "T12:00:00").getDay() >= 5 || new Date(ds + "T12:00:00").getDay() === 0; }
    // monthly: due in the first week of the month, or in the first 3 days on a new site
    else if (often === "monthly") { done = list.some(x => x.slice(0, 7) === ds.slice(0, 7) && x <= ds); const st = p.start && p.start.slice(0, 7) === ds.slice(0, 7) ? p.start : null, dl = new Date((st || ds.slice(0, 8) + "01") + "T12:00:00"); dl.setDate(dl.getDate() + (st ? 2 : 6)); late = ds > ymd(dl); }
    else if (often === "once") { done = list.some(x => x <= ds); late = p.start ? ds > p.start : false; }
    let next = "";
    if (done && often === "weekly") { const n = new Date(weekStart(ds) + "T12:00:00"); n.setDate(n.getDate() + 7); next = "  |  next due " + dmy(n); }
    if (done && often === "monthly") { const n = new Date(ds.slice(0, 8) + "01T12:00:00"); n.setMonth(n.getMonth() + 1); next = "  |  next due " + dmy(n); }
    const by = k === "dsti" && done ? (forms.find(o => o.date === ds) || {}).savedBy : "";
    out.push({ k, often, title: ckName(k), st: done ? "done" : late ? "late" : "due",
      sub: done ? `Done ${dmy(new Date(last + "T12:00:00"))}${by && by !== who ? " by " + by.split(" ")[0] : ""}${next}${CHECKS[k] && CHECKS[k].no ? "  |  " + CHECKS[k].no : ""}`
        : `${OFTEN[often]}${CHECKS[k] && CHECKS[k].no ? "  |  " + CHECKS[k].no : ""}${last ? "  |  last " + dmy(new Date(last + "T12:00:00")) : ""}` });
  }
  return out;
}
const checksOpen = (p, who, ds) => myChecks(p, who, ds).filter(x => !x.watch && x.st !== "done" && x.st !== "wait").length;
// Wanro 26 Oct: every check a man still has to do shows MUSTARD. Once he has submitted it, it turns GREEN.
const GROUPS = [["daily", "EVERY DAY"], ["weekly", "THIS WEEK"], ["monthly", "THIS MONTH (before use, record monthly)"], ["once", "ONCE"], ["event", "WHEN SOMETHING HAPPENS"]];
const dstiDue = (p, ds) => !!APPT(p) && myChecks(p, S.user, ds).some(x => x.k === "dsti" && x.st !== "done");
const dueToday = () => PROJECTS.filter(p => APPT(p) && projPhase(p) === "live");
function checkRows(p, who, ds) {
  const list = myChecks(p, who, ds), out = [];
  for (const [often, lab] of GROUPS) {
    const g = list.filter(x => x.often === often); if (!g.length) continue;
    out.push(h("div", { class: "ck-head" }, lab));
    for (const x of g) out.push(h("button", { type: "button", class: "mbtn ck-row " + (x.watch ? "watch " : "") + x.st, onclick: () => x.st === "wait" ? null : (S.project = p, S.ckBack = S.view, openCheck(x)) },
      h("span", { class: "ck-t" }, x.title, h("small", {}, x.sub)),
      x.st === "late" ? h("span", { class: "tst red" }, "LATE") : x.st === "wait" ? h("span", { class: "tst blue" }, "WAITING") : x.st === "done" ? h("span", { class: "ck-ok" }, "DONE \u2713") : x.watch ? h("span", { class: "tst blue" }, "NOT YET") : h("span", { class: "ck-todo" }, "TO DO")));
  }
  return out;
}
// The first time he opens the app each day he lands on today's checks.
function vToday() {
  const ds = ymd(today()), ps = dueToday(), left = ps.reduce((n, p) => n + checksOpen(p, S.user, ds), 0);
  return [topbar("Today's checks", nice(today()), true),
    h("div", { class: "today-sum " + (left ? "must" : "clear") }, left ? `${S.user.split(" ")[0]}, you have ${left} check${left === 1 ? "" : "s"} to do today. Clear every mustard one.` : `${S.user.split(" ")[0]}, all your checks are done for today.`),
    ...ps.map(p => h("div", { class: "stack" }, h("div", { class: "ck-proj" }, p.name), ...checkRows(p, S.user, ds))),
    h("button", { type: "button", class: "btn-w today-go", onclick: () => { S.view = "projects"; S.hist = []; render(); window.scrollTo(0, 0); } }, "Go to my projects"),
    h("p", { class: "note" }, "The list comes from your appointments in the safety file. If something is wrong here, tell Wanro.")];
}
function morningChecks() {
  if (!dueToday().length) return false;
  try { const k = "fib_today_" + S.user, ds = ymd(today()); if (localStorage.getItem(k) === ds) return false; localStorage.setItem(k, ds); } catch (e) { return false; }
  S.hist = ["projects"]; S.view = "today"; return true;
}
function openCheck(x) {
  if (x.watch) return showInfo(x.title, x.st === "done" ? `${x.person} did it today. It is filed under Inspections for the project.` : `${x.person} has not done it yet today. Nobody may go up in the cherry picker until he has. Phone him.`);
  if (x.k === "flash") return sendFlash(S.project, x.ref);
  if (x.k === "invest") { startForm("invest"); Object.assign(S.form, { ref: x.ref._id, refType: x.ref.type, refWhat: x.ref.what || "", refWhere: x.ref.where || "", refDate: x.ref.date }); render(); return; }
  if (CHECKS[x.k]) return startForm("check", x.k);
  startForm(x.k);
}
function vMyChecks() {
  const p = S.project, a = APPT(p), ds = ymd(S.date), list = myChecks(p, S.user, ds);
  return [topbar("My checks", `${p.short}  |  ${nice(S.date)}`, true),
    h("div", { class: "appt-card" }, h("b", {}, `${S.user}, your appointments on ${p.short}`), h("ul", {}, a.appts.map(x => h("li", {}, x)))),
    h("div", { class: "stack" }, list.length ? checkRows(p, S.user, ds) : h("p", { class: "note" }, "Nothing for you on this project.")),
    h("button", { type: "button", class: "mbtn", onclick: () => go("inspections") }, "All checklists", h("small", {}, "Any other check you must do today")),
    h("p", { class: "note" }, "This list comes from the appointment register in the safety file. If something is wrong here, tell Wanro.")];
}
// Incident investigation, GAR 9(2). Linked to the incident or near miss it investigates.
function vInvest() {
  const f = S.form, IMM = ["Unsafe act", "Unsafe condition", "Equipment failure", "Weather", "No or wrong PPE", "Procedure not followed", "No procedure"];
  const imm = h("div", { class: "chips" }, IMM.map(c => { const b = h("button", { type: "button", class: (f.imm || []).includes(c) ? "on" : "", onclick: () => { f.imm = (f.imm || []).includes(c) ? f.imm.filter(x => x !== c) : [...(f.imm || []), c]; b.classList.toggle("on"); } }, c); return b; }));
  return [...formHead("Incident investigation", "General Administrative Regulations 9(2). The appointed incident investigator investigates every incident and near miss and records the causes and corrective actions."),
    sheet("", h("div", { class: "band" }, "WHAT IS BEING INVESTIGATED"), h("table", {}, h("tbody", {},
      h("tr", {}, h("td", { class: "lab" }, "Report"), h("td", { class: "ro" }, `${f.refType === "nearmiss" ? "Near miss" : "Incident"} on ${f.refDate ? dmy(new Date(f.refDate + "T12:00:00")) : ""}`)),
      h("tr", {}, h("td", { class: "lab" }, "Where"), h("td", { class: "ro" }, f.refWhere || "-")),
      h("tr", {}, h("td", { class: "lab" }, "What happened"), h("td", { class: "ro" }, f.refWhat || "-"))))),
    sheet("", h("div", { class: "band" }, "IMMEDIATE CAUSES ", h("small", {}, "(tap all that apply)")), imm, txt(f.immTxt, v => f.immTxt = v, "Describe what directly caused it")),
    sheet("", h("div", { class: "band" }, "ROOT CAUSE"), txt(f.root, v => f.root = v, "Why did it really happen? Ask why five times")),
    rowsTable("", ["Corrective action", "Who", "By when"], f.acts, r => h("tr", {}, h("td", {}, inp("text", r.what, v => r.what = v, "What must be done")), h("td", { style: "min-width:110px" }, sel(STAFF, r.who, v => r.who = v, "Who")), h("td", { style: "width:130px" }, inp("date", r.by, v => r.by = v))), "+ Add action", () => ({})),
    sheet("", h("div", { class: "band" }, "LESSONS FOR THE TEAM"), txt(f.lessons, v => f.lessons = v, "What do we tell everyone at the next toolbox talk")),
    sheet("", h("table", {}, h("tbody", {}, h("tr", {}, h("td", { class: "lab" }, "Investigator signature"), h("td", {}, sigCell(() => f.sig, v => f.sig = v, "Investigator signature", true)))))),
    submitBtn(() => { const e = []; if (!(f.imm || []).length && !(f.immTxt || "").trim()) e.push("Give the immediate cause."); if (!(f.root || "").trim()) e.push("Give the root cause."); if (!f.acts.some(a => a.what && a.who)) e.push("Add at least one corrective action with who does it."); if (!f.sig) e.push("Sign the investigation."); return e; })];
}
function incidentDoc(p, r) {
  const esc = x => String(x == null ? "" : x).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const d = new Date(r.date + "T12:00:00"), nm = r.type === "nearmiss", row = (a, b) => b ? `<tr><th>${a}</th><td>${esc(Array.isArray(b) ? b.join(", ") : b)}</td></tr>` : "";
  const ppl = (r.people || []).filter(x => x && (x.name || x.n)).map(x => esc(x.name || x.n) + (x.inj ? ", " + esc(x.inj) : "")).join("<br>");
  const inv = investOf(p, r._id);
  return { html: `<div class="pd-head"><img src="${LOGO}" alt="Fibraco"><div><h1>FLASH REPORT, ${nm ? "NEAR MISS" : "INCIDENT"}</h1><div>${esc(p.name)}</div><div>${esc(nice(d))}${r.time ? ", " + esc(r.time) : ""}</div></div></div>
    <table class="kv">${row("Reported by", r.savedBy || r.user)}${row("Where", r.where)}${row("Task", r.task)}${row("Type", r.types)}${row("What happened", r.what)}${nm ? row("Could have caused", r.cons) + row("How likely", r.like) : ""}${row("Immediate actions", r.acts)}${row("Other", r.other)}${ppl ? `<tr><th>People involved</th><td>${ppl}</td></tr>` : ""}${row("Witnesses", r.wit)}</table>
    ${inv ? `<h2>Investigation</h2><table class="kv">${row("Investigator", inv.savedBy)}${row("Immediate causes", [...(inv.imm || []), inv.immTxt].filter(Boolean))}${row("Root cause", inv.root)}${row("Corrective actions", (inv.acts || []).filter(a => a.what).map(a => `${a.what} (${a.who || "?"}${a.by ? ", by " + a.by : ""})`))}</table>` : `<p>The investigation by the appointed incident investigator follows.</p>`}`,
    title: `FIBRACO - Flash Report - ${p.short} (${dmy(d)})` };
}
function sendFlash(p, r) {
  const to = [...repTo(p, "diary"), ...repTo(p, "dsti")];
  const ov = h("div", { class: "overlay", role: "dialog", "aria-label": "Flash report" }, h("div", { class: "modal" }, h("h2", {}, "Send flash report"),
    h("p", {}, `The ${r.type === "nearmiss" ? "near miss" : "incident"} report goes by email to ${to.length ? to.map(x => x.name).join(" and ") : "the office only (no client emails set up)"}, with a copy to Wanro. If there is no signal it goes as soon as there is.`),
    h("div", { class: "row" }, h("button", { class: "btn-g", type: "button", onclick: () => ov.remove() }, "Cancel"),
      h("button", { class: "btn-w", type: "button", onclick: () => { const q = mqGet().filter(j => j.flash !== r._id); q.push({ flash: r._id, pid: p.id, ds: r.date, by: S.user, at: new Date().toISOString(), tries: 0 }); mqSet(q); ov.remove(); setTimeout(processMailQ, 800); render(); } }, "Send"))));
  document.body.append(ov);
}

function detailRow(f, d) {
  const [lab, type, opt] = d;
  let ctl;
  if (type === "staff") ctl = sel(STAFF, f.d[lab], v => f.d[lab] = v, "Choose name");
  else if (type === "select") ctl = sel(opt, f.d[lab], v => f.d[lab] = v, "Choose");
  else ctl = inp(type, f.d[lab], v => f.d[lab] = v, opt || "");
  return h("tr", {}, h("td", { class: "lab" }, lab), h("td", {}, ctl));
}
function stdHeader(f, title, extra) {
  return sheet("", h("div", { class: "band" }, title.toUpperCase()), h("table", {}, h("tbody", {},
    h("tr", {}, h("td", { class: "lab" }, "Project", h("span", { class: "auto" }, "auto")), h("td", { class: "ro" }, f.project ? f.project.name : "")),
    h("tr", {}, h("td", { class: "lab" }, "Date", h("span", { class: "auto" }, "auto")), h("td", { class: "ro" }, nice(f.date))),
    h("tr", {}, h("td", { class: "lab" }, "Completed by", h("span", { class: "auto" }, "auto")), h("td", { class: "ro" }, f.user)),
    ...(extra || []))));
}
function vCheck() {
  const f = S.form, c = CHECKS[f.key];
  const blocks = c.groups.map((g, gi) => {
    const tb = h("tbody");
    const items = f.items[gi];
    const draw = () => tb.replaceChildren(...items.flatMap((it, i) => {
      const nameCell = c.addable && it.custom ? h("td", {}, inp("text", it.name, v => it.name = v, "Name or location")) : h("td", { style: "padding:8px;font-weight:600;font-size:12.5px" }, it.name);
      const row = h("tr", {}, nameCell, h("td", { style: "width:168px" }, seg(c.ans, it.a, v => { it.a = v; draw(); })));
      const bad = ["Defect", "Replace", "Short", "Fail"].includes(it.a);
      return bad ? [row, h("tr", { class: "hz-extra" }, h("td", { colspan: 2 }, inp("text", it.c, v => it.c = v, "What is wrong and what was done")))] : [row];
    }));
    draw();
    return sheet("", h("div", { class: "band" }, g[0]), h("table", {}, tb),
      c.addable ? h("button", { class: "addrow", type: "button", onclick: () => { items.push({ name: "", custom: true }); draw(); } }, c.addable) : null);
  });
  return [...formHead(c.title, (c.no ? c.no + ". " : "") + c.basis), stdHeader(f, c.no ? `${c.title} (${c.no})` : c.title, c.details.map(d => detailRow(f, d))), ...blocks,
    sheet("", h("div", { class: "band" }, "Outcome"), seg([["Fit", "Fit for use"], ["Not fit", "Not fit, taken out of use"]], f.outcome, v => f.outcome = v)),
    sheet("", h("table", {}, h("tbody", {}, h("tr", {}, h("td", { class: "lab" }, "Signature"), h("td", {}, sigCell(() => f.sig, v => f.sig = v, "Inspector signature", true)))))),
    submitBtn(() => { const e = []; const all = f.items.flat(); if (all.some(i => !i.a && i.name)) e.push("Mark every item."); if (all.some(i => ["Defect", "Replace", "Short", "Fail"].includes(i.a) && !(i.c || "").trim())) e.push("Write what is wrong for every item that failed."); if (!f.sig) e.push("Sign the inspection."); return e; })];
}

function vToolbox() {
  const f = S.form;
  const talkBox = h("div");
  const drawTalk = () => {
    const t = TALKS.find(x => String(x.n) === String(f.talk));
    talkBox.replaceChildren(t ? sheet("", h("div", { class: "band" }, `Talk ${t.n}. Read these points to the crew`),
      h("div", { style: "padding:10px 14px" }, t.s.map(s => h("div", { style: "margin-bottom:10px" }, h("b", {}, s.h), h("ul", { style: "margin:4px 0 0;padding-left:18px;line-height:1.5" }, s.b.map(b => h("li", {}, b))))))) : "");
  };
  drawTalk();
  return [...formHead("Daily toolbox talk", "Fibraco health and safety talk topics 1 to 25. Pick the topic, read the points, and every person signs."),
    stdHeader(f, "Toolbox talk", [h("tr", {}, h("td", { class: "lab" }, "Topic"), h("td", {}, sel(TALKS.map(t => `${t.n}. ${t.t}`), f.talkLabel, v => { f.talkLabel = v; f.talk = v.split(".")[0]; drawTalk(); }, "Choose topic")))]),
    talkBox,
    rowsTable("", ["No", "Attendee", "Signature"], f.att, (r, i) => h("tr", {}, h("td", { class: "no" }, i + 1), h("td", {}, sel(STAFF, r.name, v => r.name = v, "Name")), h("td", { style: "width:120px" }, sigCell(() => r.sig, v => r.sig = v, "Attendee signature"))), "+ Add person", () => ({})),
    sheet("", h("div", { class: "band" }, "Questions or concerns raised"), txt(f.q, v => f.q = v, "None")),
    submitBtn(() => { const e = []; if (!f.talk) e.push("Choose the topic."); if (!f.att.some(a => a.name && a.sig)) e.push("At least one person must sign the attendance."); return e; })];
}

function vIncident() {
  const f = S.form;
  const types = [...(TILES() ? [] : ["Near miss"]), "First aid case", "Medical treatment", "Lost time injury", "Property or equipment damage", "Vehicle incident", "Environmental", "Fire", "Member of the public"];
  const acts = ["Emergency care given", "Area barricaded", "Work stopped", "Evidence left in place", "Photos taken", "Equipment tagged out"];
  const chips = (list, key) => h("div", { class: "chips" }, list.map(p => { const b = h("button", { type: "button", class: f[key].includes(p) ? "on" : "", onclick: () => { const on = f[key].includes(p); f[key] = on ? f[key].filter(x => x !== p) : [...f[key], p]; b.classList.toggle("on", !on); } }, p); return b; }));
  return [...formHead("Incident report", TILES() ? "Someone got hurt, or something was damaged. Report it straight away. If nobody was hurt and nothing broke, use Near miss instead. Follows FIBRASE0010." : "Report every incident and near miss straight away, no matter how small. Follows FIBRASE0010."),
    stdHeader(f, "Incident and near-miss report", [h("tr", {}, h("td", { class: "lab" }, "Time of incident"), h("td", {}, sel(TIMES, f.time, v => f.time = v, "Time")))]),
    sheet("", h("div", { class: "band" }, "Type of incident (tick all that apply)"), chips(types, "types")),
    sheet("", h("div", { class: "band" }, "Where"), gpsBlock(f, "gps"), inp("text", f.where, v => f.where = v, "Exact location, tower or ITS no")),
    rowsTable("", ["Person involved", "Injury and body part"], f.people, r => h("tr", {}, h("td", { style: "min-width:130px" }, sel(STAFF.concat(["Other (name in notes)"]), r.name, v => r.name = v, "Name")), h("td", {}, inp("text", r.inj, v => r.inj = v, "None if no injury"))), "+ Add person", () => ({})),
    sheet("", h("div", { class: "band" }, "What happened"), txt(f.what, v => f.what = v, "Describe what happened, in order")),
    sheet("", h("div", { class: "band" }, "Immediate actions"), chips(acts, "acts")),
    sheet("", h("div", { class: "band" }, "Photos"), photoBlock(f.photos)),
    sheet("", h("table", {}, h("tbody", {}, h("tr", {}, h("td", { class: "lab" }, "Witness"), h("td", {}, inp("text", f.wit, v => f.wit = v, "Name and cell no"))), h("tr", {}, h("td", { class: "lab" }, "Reported by signature"), h("td", {}, sigCell(() => f.sig, v => f.sig = v, "Reporter signature", true)))))),
    h("p", { class: "hint" }, `Submitting sends this to ${adminName()} and the site manager straight away. The investigation part is done later by the office.`),
    submitBtn(() => { const e = []; if (!f.types.length) e.push("Tick the type of incident."); if (!f.what.trim()) e.push("Describe what happened."); if (!f.sig) e.push("Sign the report."); return e; })];
}

// Near miss: something that did not hurt anyone or break anything, but could have.
// From FIB-HSE-FOR-001 and the SHE Incident Management Procedure FIBRASE0010 Rev 2, sections 16 to 18.
const NM_CONS = [["Low", "First aid or a doctor visit"], ["Minor", "Off work under 14 days"], ["Moderate", "Off 14 days or more, or disabled"], ["Major", "One death or a serious incident"], ["Critical", "More than one death"]];

const NM_LIKE = [["Frequent", "Again within weeks"], ["Likely", "About once a month"], ["Possible", "Once in 1 to 2 years"], ["Unlikely", "Once in 2 to 5 years"], ["Rare", "Once in 10 years or more"]];

const NM_MATRIX = { Frequent: ["Moderate", "Moderate", "High", "Extreme", "Extreme"], Likely: ["Low", "Moderate", "High", "Extreme", "Extreme"], Possible: ["Low", "Moderate", "Moderate", "Extreme", "Extreme"], Unlikely: ["Low", "Low", "Moderate", "Extreme", "Extreme"], Rare: ["Low", "Low", "Moderate", "Extreme", "Extreme"] };
const NM_COL = { Low: "#1e8e3e", Moderate: "#f29900", High: "#e8590c", Extreme: "#c8102e" };
const nmPriority = f => f.cons && f.like ? NM_MATRIX[f.like][NM_CONS.findIndex(c => c[0] === f.cons)] : "";
function vNearMiss() {
  const f = S.form;
  const acts = ["Work stopped", "Area made safe and barricaded", "Hazard removed or fixed", "Equipment tagged out", "Photos taken", "Toolbox talk held"];
  const chips = (list, key) => h("div", { class: "chips" }, list.map(p => { const b = h("button", { type: "button", class: f[key].includes(p) ? "on" : "", onclick: () => { const on = f[key].includes(p); f[key] = on ? f[key].filter(x => x !== p) : [...f[key], p]; b.classList.toggle("on", !on); } }, p); return b; }));
  const pri = h("div");
  const drawPri = () => { const v = nmPriority(f); pri.replaceChildren(v ? h("div", { class: "nm-pri", style: `background:${NM_COL[v]}` }, `PRIORITY: ${v.toUpperCase()}`) : h("div", { class: "hint", style: "margin:6px 0" }, "Choose both and the priority works itself out (FIBRASE0010 section 18).")); };
  drawPri();
  const pick = (list, key, ph) => h("select", { "aria-label": ph, onchange: e => { f[key] = e.target.value; drawPri(); } }, h("option", { value: "" }, ph), ...list.map(([v, d]) => h("option", { value: v, selected: f[key] === v }, `${v}: ${d}`)));
  return [...formHead("Near-miss report", "Report every near miss straight away, no matter how small. Nobody was hurt and nothing broke, but it could have. Follows FIBRASE0010."),
    stdHeader(f, "Near-miss report", [h("tr", {}, h("td", { class: "lab" }, "Time it happened"), h("td", {}, sel(TIMES, f.time, v => f.time = v, "Time")))]),
    sheet("", h("div", { class: "band" }, "Where"), gpsBlock(f, "gps"), inp("text", f.where, v => f.where = v, "Exact location, e.g. RMU 4, battery 2, tower no")),
    sheet("", h("table", {}, h("tbody", {},
      h("tr", {}, h("td", { class: "lab" }, "Task being done"), h("td", {}, inp("text", f.task, v => f.task = v, "e.g. pulling CAT6a into battery 3"))),
      h("tr", {}, h("td", { class: "lab" }, "DSTI ref"), h("td", {}, inp("text", f.dsti, v => f.dsti = v, "If there is one")))))),
    sheet("", h("div", { class: "band" }, "What happened"), txt(f.what, v => f.what = v, "Describe what happened, in order. Stick to the facts.")),
    sheet("", h("div", { class: "band" }, "How bad could it have been"), h("div", { style: "padding:10px 12px;display:flex;flex-direction:column;gap:8px" },
      pick(NM_CONS, "cons", "What could it have caused?"), pick(NM_LIKE, "like", "How likely is it to happen again?"), pri)),
    rowsTable("", ["People involved", "Company"], f.people, r => h("tr", {}, h("td", { style: "min-width:130px" }, sel(STAFF.concat(["Other (name in notes)"]), r.name, v => r.name = v, "Name")), h("td", {}, inp("text", r.co, v => r.co = v, "Fibraco or other"))), "+ Add person", () => ({})),
    sheet("", h("table", {}, h("tbody", {}, h("tr", {}, h("td", { class: "lab" }, "Happened before?"), h("td", {}, seg([["Yes", "Yes"], ["No", "No"]], f.repeat, v => f.repeat = v)))))),
    sheet("", h("div", { class: "band" }, "What was done straight away"), chips(acts, "acts"), inp("text", f.other, v => f.other = v, "Anything else that was done")),
    sheet("", h("div", { class: "band" }, "Photos"), photoBlock(f.photos)),
    sheet("", h("table", {}, h("tbody", {}, h("tr", {}, h("td", { class: "lab" }, "Witness"), h("td", {}, inp("text", f.wit, v => f.wit = v, "Name and cell no"))), h("tr", {}, h("td", { class: "lab" }, "Reported by signature"), h("td", {}, sigCell(() => f.sig, v => f.sig = v, "Reporter signature", true)))))),
    h("p", { class: "hint" }, `Submitting sends this to ${adminName()} and the site manager straight away. There can only be one near-miss report per event, even if more people were involved.`),
    submitBtn(() => { const e = []; if (!f.what.trim()) e.push("Describe what happened."); if (!f.cons || !f.like) e.push("Choose how bad it could have been and how likely it is."); if (!f.where.trim()) e.push("Write where it happened."); if (!f.sig) e.push("Sign the report."); return e; })];
}

// Job observation: Fibraco Behavioural Observation checklist Rev 05 as a tap form. Filed under 6. Behavioural Observations.
const JO_ACTS = ["Cabling", "FOC prep work", "FOC routing", "FOC splicing", "FOC testing", "Commissioning", "Excavation", "Backfilling", "Lifting and rigging", "Loading and off-loading", "Transporting of material", "Opening crates", "Erecting", "Clamping", "Stringing", "Structure torqueing", "Earthing", "Earthmat installation", "Rebar setting", "Shuttering", "Concrete mixing", "Concreting", "Brickwork", "Spacing", "Punching and painting", "Ground assembly", "Bridge building", "Waste removal"];
const JO_UNSAFE = [["Personal protective equipment", ["Eyes and face", "Ears", "Head", "Hands and arms", "Feet and legs", "Respiratory system", "Trunk"]],
  ["Positions of people", ["Ergonomics (posture, repetition)", "Work area not barricaded", "Risk of getting caught in or by something", "Risk of striking against or being struck by something", "Extreme temperatures"]],
  ["Reactions of people", ["Adjusting PPE when seen", "Adjusting position when seen"]],
  ["Tools and equipment", ["Tools not right for the job", "Not in good, safe condition", "Not used correctly"]],
  ["Procedures", ["No procedure for the job", "Procedure not understood", "Procedure not followed", "Procedure not adequate or practical"]],
  ["Orderliness", ["Housekeeping standards not agreed", "Housekeeping standards not followed"]]];
const JO_WHY = ["Not available", "Uncomfortable", "Knowledge and training", "Time pressure", "Unclear responsibility", "Unaware of risk", "Cost", "Not practical"];
function vJobObs() {
  const f = S.form;
  const chips = (list, key) => h("div", { class: "chips" }, list.map(p => { const b = h("button", { type: "button", class: f[key].includes(p) ? "on" : "", onclick: () => { const on = f[key].includes(p); f[key] = on ? f[key].filter(x => x !== p) : [...f[key], p]; b.classList.toggle("on", !on); } }, p); return b; }));
  const unsafeBox = h("div");
  const drawUnsafe = () => unsafeBox.replaceChildren(...(f.state === "Some unsafe" ? [
    sheet("", h("div", { class: "band", style: "background:#c8102e" }, "UNSAFE ACTIONS SEEN"), ...JO_UNSAFE.flatMap(([g, list]) => [h("div", { style: "padding:8px 12px 0;font-weight:800;font-size:13px" }, g), chips(list, "unsafe")])),
    sheet("", h("div", { class: "band" }, "Reasons for the unsafe behaviour"), chips(JO_WHY, "why")),
    rowsTable("", ["What must be followed up", "Responsible", "By when"], f.follow, r => h("tr", {},
      h("td", { style: "min-width:150px" }, inp("text", r.c, v => r.c = v, "What was unsafe and what must change")),
      h("td", { style: "min-width:120px" }, sel(STAFF, r.who, v => r.who = v, "Who")),
      h("td", { style: "width:130px" }, inp("date", r.d, v => r.d = v, "Date"))), "+ Add follow-up", () => ({}))] : []));
  drawUnsafe();
  return [...formHead("Job observation", "Watch the team work for a while, then fill this in. Note the good and the unsafe. Fibraco Behavioural Observation checklist Rev 05."),
    stdHeader(f, "Behavioural observation checklist", [
      h("tr", {}, h("td", { class: "lab" }, "Time"), h("td", {}, sel(TIMES, f.time, v => f.time = v, "Time"))),
      h("tr", {}, h("td", { class: "lab" }, "How long you watched"), h("td", {}, sel(["15 minutes", "30 minutes", "45 minutes", "1 hour", "More than 1 hour"], f.dur, v => f.dur = v, "Duration"))),
      h("tr", {}, h("td", { class: "lab" }, "Area or team"), h("td", {}, inp("text", f.area, v => f.area = v, "e.g. RMU 4 splicing team")))]),
    sheet("", h("div", { class: "band" }, "People observed"), h("table", {}, h("tbody", {},
      h("tr", {}, h("td", { class: "lab" }, "Number of people observed"), h("td", {}, inp("number", f.seen, v => f.seen = v, "0"))),
      h("tr", {}, h("td", { class: "lab" }, "Number working safely"), h("td", {}, inp("number", f.safe, v => f.safe = v, "0"))))),
      h("div", { style: "padding:8px 12px 0;font-weight:800;font-size:13px" }, "Group observed"), chips(["Employee", "Principal contractor", "Sub-contractor"], "groups")),
    sheet("", h("div", { class: "band" }, "Type of activity observed"), chips(JO_ACTS, "acts"), inp("text", f.other, v => f.other = v, "Other activity, type it here")),
    sheet("", h("div", { class: "band" }, "Safe actions observed"), txt(f.good, v => f.good = v, "Commendable safety performance. Who did what well?")),
    sheet("", h("table", {}, h("tbody", {}, h("tr", {}, h("td", { class: "lab" }, "The activity is"), h("td", {}, seg([["All safe", "All safe"], ["Some unsafe", "Some unsafe"]], f.state, v => { f.state = v; drawUnsafe(); })))))),
    unsafeBox,
    sheet("", h("table", {}, h("tbody", {}, h("tr", {}, h("td", { class: "lab" }, "Observer signature"), h("td", {}, sigCell(() => f.sig, v => f.sig = v, "Observer signature", true)))))),
    h("p", { class: "hint" }, `Goes to ${adminName()} for review. If you choose All safe, nothing else is needed.`),
    submitBtn(() => { const e = [];
      if (!f.acts.length && !f.other.trim()) e.push("Tick the activity you watched.");
      if (!(+f.seen > 0)) e.push("Type how many people you watched.");
      if (f.safe === "" || +f.safe > +f.seen) e.push("Type how many were working safely (not more than you watched).");
      if (!f.state) e.push("Choose All safe or Some unsafe.");
      if (f.state === "Some unsafe") { if (!f.unsafe.length) e.push("Tick what was unsafe."); if (!f.follow.some(r => (r.c || "").trim() && r.who && r.d)) e.push("Add a follow-up with who and by when."); }
      if (!f.sig) e.push("Sign the observation."); return e; })];
}

function vSI() {
  const f = S.form;
  return [...formHead("Site instruction", "Record every instruction from the client or main contractor, written or verbal, the same day. Get it signed by the person who gave it."),
    stdHeader(f, "Site instruction record", [h("tr", {}, h("td", { class: "lab" }, "SI no", h("span", { class: "auto" }, "auto")), h("td", { class: "ro" }, "SI-001"))]),
    sheet("", h("table", {}, h("tbody", {},
      h("tr", {}, h("td", { class: "lab" }, "Given by"), h("td", {}, inp("text", f.by, v => f.by = v, "Name"))),
      h("tr", {}, h("td", { class: "lab" }, "Designation and company"), h("td", {}, inp("text", f.co, v => f.co = v, "e.g. Site manager, main contractor"))),
      h("tr", {}, h("td", { class: "lab" }, "Type"), h("td", {}, seg([["Written", "Written"], ["Verbal", "Verbal"]], f.kind, v => f.kind = v))),
      h("tr", {}, h("td", { class: "lab" }, "Drawing or document ref"), h("td", {}, inp("text", f.ref, v => f.ref = v, "If any")))))),
    sheet("", h("div", { class: "band" }, "The instruction, in the words used"), txt(f.text, v => f.text = v, "Write it in full")),
    sheet("", h("div", { class: "band" }, "Effect on Fibraco work"), h("table", {}, h("tbody", {},
      ...[["Changes the scope of work", "scope"], ["Extra labour or standing time", "labour"], ["Extra material or plant", "mat"], ["Affects the programme", "prog"]].map(([lab, k]) => h("tr", {}, h("td", { style: "padding:8px;font-weight:600;font-size:12.5px" }, lab), h("td", { style: "width:130px" }, seg([["Yes", "Yes"], ["No", "No"]], f[k], v => f[k] = v)))),
      h("tr", {}, h("td", { style: "padding:8px;font-weight:600;font-size:12.5px" }, "Cost"), h("td", {}, sel(["To be priced", "Day work", "No cost"], f.cost, v => f.cost = v, "Choose")))))),
    h("p", { class: "hint" }, "Fibraco confirms receipt of this instruction. Where it changes the scope, time or cost of Fibraco work, Fibraco reserves its right to claim the effect under the contract."),
    sheet("", h("div", { class: "band" }, "Photos"), photoBlock(f.photos)),
    sheet("", h("table", {}, h("tbody", {},
      h("tr", {}, h("td", { class: "lab" }, "Given by (client) signature"), h("td", {}, sigCell(() => f.sigC, v => f.sigC = v, "Client signature"))),
      h("tr", {}, h("td", { class: "lab" }, "Received by (Fibraco) signature"), h("td", {}, sigCell(() => f.sigF, v => f.sigF = v, "Fibraco signature", true)))))),
    submitBtn(() => { const e = []; if (!f.by.trim()) e.push("Who gave the instruction?"); if (!f.text.trim()) e.push("Write the instruction."); if (!f.sigF) e.push("Fibraco must sign."); return e; })];
}

function orderNo(f) {
  if (!f.no) { const d = new Date(), ini = String(f.user || S.user || "").split(" ").map(x => x[0] || "").join("").toUpperCase();
    f.no = `OR-${String(d.getDate()).padStart(2, "0")}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getFullYear()).slice(2)}-${ini}${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}`; }
  return f.no;
}
// The order goes to Wanro as a PDF the man shares from his phone (email or WhatsApp).
function orderDoc(f) {
  const esc = x => String(x == null ? "" : x).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const row = (a, b) => `<tr><th>${esc(a)}</th><td>${esc(b) || "-"}</td></tr>`, p = f.project || {};
  const items = (f.items || []).filter(r => r.d && r.q);
  const html = `
  <div class="pd-head"><img src="${LOGO}" alt="Fibraco"><div><h1>MATERIAL ORDER REQUEST</h1><div>${esc(p.name || "No project")}</div><div>${esc(orderNo(f))}</div></div></div>
  <table class="kv">${row("Order request no", orderNo(f))}${row("Project", p.name)}${row("Requested by", f.user)}${row("Date", nice(f.date))}${row("Needed on site by", f.need ? nice(new Date(f.need + "T12:00:00")) : "")}${row("Reason", f.reason)}</table>
  <h2>Items</h2><table class="g"><thead><tr><th>No</th><th>Description</th><th>Spec or part no</th><th>Unit</th><th>Qty</th></tr></thead><tbody>${items.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(r.d)}</td><td>${esc(r.s) || "-"}</td><td>${esc(r.u) || "-"}</td><td>${esc(r.q)}</td></tr>`).join("")}</tbody></table>
  <h2>Notes for the office</h2><p>${esc(f.notes) || "None"}</p>
  <div class="sigs"><div><h3>Requested by</h3><div class="sigline">${f.sig ? `<img src="${f.sig}" alt="Signature">` : ""}</div><div>${esc(f.user)}</div></div>
    <div><h3>Approved by (office)</h3><div class="sigline"></div><div>Name: ______________________</div><div>Date: ______________________</div></div></div>
  <p class="foot">Fibraco (Pty) Ltd. Material order from Fibraco Field, made ${esc(new Date().toLocaleString("en-ZA"))}. Nothing is ordered from a supplier until the project manager approves it.</p>`;
  return { html, title: `FIBRACO - Material Order ${orderNo(f)} - ${p.short || "No project"}` };
}
async function sendOrder(f) {
  if (sending) return; sending = true;
  const ov = h("div", { class: "overlay", role: "dialog", "aria-label": "Making the PDF" }, h("div", { class: "modal" }, h("h2", {}, "Making the PDF"), h("p", {}, "One moment.")));
  document.body.append(ov);
  try {
    await loadJs("./js/lib/html2canvas.min.js?v=1793021006"); await loadJs("./js/lib/jspdf.umd.min.js?v=1793021006"); await loadJs("./js/pdf.js?v=1793021006");
    const { html, title } = orderDoc(f);
    const file = await window.FibPdf.diaryPdf(html, title);
    const m = ov.querySelector(".modal"); m.innerHTML = "";
    m.append(h("h2", {}, "Order PDF ready"), h("p", {}, "Tap Share, then choose Gmail or Outlook and send it to wanro@fibraco.co.za, or WhatsApp it to Wanro."),
      h("div", { class: "row" }, h("button", { class: "btn-g", type: "button", onclick: () => ov.remove() }, "Close"),
        h("button", { class: "btn-w", type: "button", onclick: async () => { ov.remove(); const r = await window.FibPdf.shareFile(file, `Fibraco material order ${orderNo(f)}, ${(f.project || {}).short || ""}. To: wanro@fibraco.co.za`); if (r === "downloaded") showInfo("PDF saved", `${file.name} is in your downloads. Email it to wanro@fibraco.co.za.`); else if (r === "shared") { f.sent = new Date().toISOString(); try { saveForm(f); } catch (e) {} } } }, "Share")));
  } catch (e) { ov.remove(); showInfo("Could not make the PDF", "This phone could not make the PDF. The order is still saved in the app. Phone Wanro with the order number " + orderNo(f) + "."); }
  finally { sending = false; }
}
function frontOrder() {
  const start = p => { S.project = p; S.date = today(); S.hist = []; startForm("order"); };
  if (PROJECTS.length === 1) return start(PROJECTS[0]);
  const ov = h("div", { class: "overlay", role: "dialog", "aria-label": "Which project" }, h("div", { class: "modal" }, h("h2", {}, "Order for which project?"),
    ...PROJECTS.map(p => h("button", { class: "mbtn", type: "button", onclick: () => { ov.remove(); start(p); } }, p.name)),
    h("div", { class: "row" }, h("button", { class: "btn-g", type: "button", onclick: () => ov.remove() }, "Cancel"))));
  document.body.append(ov);
}
function vOrder() {
  const f = S.form; orderNo(f);
  return [...formHead("Material order", "Order material, consumables, PPE or tools from the office. Nothing is ordered from a supplier until the project manager approves it."),
    stdHeader(f, "Material and equipment order request", [
      h("tr", {}, h("td", { class: "lab" }, "Order request no", h("span", { class: "auto" }, "auto")), h("td", { class: "ro" }, orderNo(f))),
      h("tr", {}, h("td", { class: "lab" }, "Needed on site by"), h("td", {}, inp("date", f.need, v => f.need = v, "Date"))),
      h("tr", {}, h("td", { class: "lab" }, "Reason"), h("td", {}, sel(["Project material", "Consumables", "Replacement or repair", "PPE", "Tools"], f.reason, v => f.reason = v, "Choose")))]),
    rowsTable("wide", ["No", "Description", "Spec or part no", "Unit", "Qty"], f.items, (r, i) => h("tr", {}, h("td", { class: "no" }, i + 1), h("td", { style: "min-width:200px" }, inp("text", r.d, v => r.d = v, "What is needed")), h("td", { style: "min-width:140px" }, inp("text", r.s, v => r.s = v, "If known")), h("td", { style: "width:90px" }, sel(["m", "ea", "roll", "box", "set", "pack"], r.u, v => r.u = v, "Unit")), h("td", { style: "width:80px" }, inp("number", r.q, v => r.q = v, "0"))), "+ Add item", () => ({})),
    sheet("", h("div", { class: "band" }, "Notes for the office"), txt(f.notes, v => f.notes = v, "Supplier, urgency or anything else")),
    sheet("", h("table", {}, h("tbody", {}, h("tr", {}, h("td", { class: "lab" }, "Requested by signature"), h("td", {}, sigCell(() => f.sig, v => f.sig = v, "Requester signature", true)))))),
    submitBtn(() => { const e = []; if (!f.items.some(r => r.d && r.q)) e.push("Add at least one item with a quantity."); if (!f.sig) e.push("Sign the request."); return e; })];
}

const RAMS_T = {"001": "Fibre optic installation and testing", "002": "CAT6a shielded data cable termination and testing", "003": "CAN-BUS 2Pr 0.5 mm² shielded control cable termination and testing", "004": "4-core 1.5 mm² shielded control cable termination and testing", "005": "12c x 1 mm² XLPE-PVC EPO cable termination and testing", "006": "7c x 1 mm² PVC-PVC EPO cable termination and testing", "007": "4c x 4 mm² PVC-PVC power cable", "008": "Surge protection DEHN POE Type 2 SPD", "009": "DEHN Type D2 surge protection devices"};
let RAMS_D = {};

function projCard(p) {
  const row = (lab, val) => h("tr", {}, h("td", { class: "lab" }, lab), h("td", { class: val ? "ro" : "tbc" }, val || "To be confirmed"));
  return sheet("projcard", h("div", { class: "band" }, p.name.toUpperCase()), h("table", {}, h("tbody", {},
    row("Client", p.client), row("Client PM", p.pm), row("Client SM", p.sm), row("Client QC", p.qc), row("Client SHEQ", p.sheq))));
}
function vRams() {
  return [topbar("RAMS", S.project.short, true), projCard(S.project),
    h("p", { class: "form-sub" }, "Fibraco risk assessments and method statements. Read only on site. The project details above go on top of every document."),
    h("div", { class: "stack" }, Object.entries(RAMS_T).map(([n, t]) => sheet("", h("div", { style: "padding:12px 12px 4px;font-weight:800;font-size:14px" }, `${+n}. ${t}`),
      h("div", { style: "display:flex;gap:8px;padding:8px 12px 12px" },
        h("button", { class: "btn-w", type: "button", style: "flex:1;padding:11px;border-radius:6px;border:0;font-weight:800", onclick: () => { S.doc = "MS-FIB-" + n; go("ramsdoc"); } }, "Method statement"),
        h("button", { class: "btn-g", type: "button", style: "flex:1;padding:11px;border-radius:6px;font-weight:800", onclick: () => { S.doc = "RA-FIB-" + n; go("ramsdoc"); } }, "Risk assessment")))))];
}
function vRamsDoc() {
  const code = S.doc, n = code.slice(-3), kind = code.startsWith("MS") ? "Method statement" : "Risk assessment";
  const body = h("div", { class: "doc" }); body.innerHTML = RAMS_D[code] || "";
  // Wanro 24 Oct: show the whole page like a printed document, fitted to the screen. He zooms in with two fingers.
  const page = h("div", { class: "docpage" }, projCard(S.project), h("div", { class: "band" }, `${kind.toUpperCase()}  |  ${code}`), h("div", { style: "padding:10px 12px;font-weight:800" }, RAMS_T[n]), body);
  const fitBox = h("div", { class: "docfit" }, page);
  setTimeout(fitDocs);
  return [topbar(code, S.project.short, true), fitBox,
    h("p", { class: "hint", style: "margin-top:8px" }, "Pinch with two fingers to zoom in.")];
}
// documents laid out at A4 width and shrunk to fit the phone, so the whole page shows at once
const DOC_W = 794;
function fitDocs() { document.querySelectorAll(".docfit").forEach(b => { const pg = b.querySelector(".docpage"); if (pg) pg.style.zoom = String(Math.min(1, b.clientWidth / DOC_W)); }); }
addEventListener("resize", fitDocs);


// ---------- site drawings ----------
function vDrawings() {
  return [topbar("Site drawings", S.project.short, true), projCard(S.project),
    h("p", { class: "form-sub" }, (S.project.dwg || []).length ? "This project's drawings, latest revision only." : "No drawings loaded for this project yet. The office adds them."),
    ...(S.project.dwg || []).map(c => sheet("", h("div", { class: "band" }, `${c.name}  (${c.items.length})`),
      c.items.length ? h("table", {}, h("tbody", {}, c.items.map(d => h("tr", { style: "cursor:pointer", onclick: () => { S.dwg = d; S.zoom = 1; go("drawing"); } },
        h("td", { style: "width:92px;padding:6px" }, encImg(d.img, { alt: d.title, style: "width:80px;height:56px;object-fit:cover;border:1px solid #c9ced6;border-radius:4px;display:block;background:#e6e9ed" })),
        h("td", { style: "padding:8px" }, h("div", { style: "font-weight:800;font-size:13.5px" }, d.title), h("div", { style: "font-size:12px;color:#5b6470;margin-top:2px" }, `${d.no}${d.rev ? "  |  Rev " + d.rev : ""}`), h("div", { style: "font-size:11.5px;color:#1e8e3e;font-weight:700;margin-top:2px" }, d.status)),
        h("td", { style: "width:28px;text-align:center;color:#0069aa;font-weight:900" }, "›")))))
      : h("div", { style: "padding:12px;color:#9aa3ad;font-style:italic;font-size:13px" }, "Nothing uploaded yet")))];
}
function vDrawing() {
  const d = S.dwg;
  const img = encImg(d.img, { alt: d.title, draggable: "false", style: "display:block;max-width:none;user-select:none;-webkit-user-select:none" });
  const box = h("div", { class: "dwgbox" }, img);
  const zl = h("span", { class: "zl" }, "");
  const MAXZ = 12;
  let hiLoaded = false;
  const loadHi = () => { if (hiLoaded || !d.hi) return; hiLoaded = true; zl.title = "Loading full detail"; Store.fileURL(d.hi).then(u => { img.src = u; }).catch(() => {}); };
  const setZoom = (nz, fx, fy) => {
    // fx, fy: focal point inside the box (px). Keeps that spot under the fingers.
    nz = Math.min(MAXZ, Math.max(1, nz));
    const old = S.zoom; if (fx == null) { fx = box.clientWidth / 2; fy = box.clientHeight / 2; }
    const ax = box.scrollLeft + fx, ay = box.scrollTop + fy;
    S.zoom = nz; img.style.width = (nz * 100) + "%"; zl.textContent = Math.round(nz * 100) + "%"; if (nz > 1.6) loadHi();
    const r = nz / old; box.scrollLeft = ax * r - fx; box.scrollTop = ay * r - fy;
  };
  setTimeout(() => setZoom(S.zoom || 1));
  // two-finger pinch, one-finger drag, double tap
  const pts = new Map(); let pinch = null, lastTap = 0, drag = null;
  const local = e => { const r = box.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  box.addEventListener("pointerdown", e => {
    box.setPointerCapture(e.pointerId); pts.set(e.pointerId, local(e));
    if (pts.size === 2) { const [p1, p2] = [...pts.values()]; pinch = { dist: Math.hypot(p1[0] - p2[0], p1[1] - p2[1]), zoom: S.zoom }; drag = null; }
    else if (pts.size === 1) {
      const now = Date.now(); const [x, y] = local(e);
      if (now - lastTap < 300) { setZoom(S.zoom > 1.2 ? 1 : 2.5, x, y); lastTap = 0; } else lastTap = now;
      drag = { x, y, sl: box.scrollLeft, st: box.scrollTop };
    }
  });
  box.addEventListener("pointermove", e => {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, local(e));
    if (pinch && pts.size === 2) {
      const [p1, p2] = [...pts.values()];
      const dist = Math.hypot(p1[0] - p2[0], p1[1] - p2[1]);
      setZoom(pinch.zoom * dist / pinch.dist, (p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2);
    } else if (drag && pts.size === 1) {
      const [x, y] = local(e); box.scrollLeft = drag.sl - (x - drag.x); box.scrollTop = drag.st - (y - drag.y);
    }
  });
  const up = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; if (pts.size === 1) { const [x, y] = [...pts.values()][0]; drag = { x, y, sl: box.scrollLeft, st: box.scrollTop }; } if (!pts.size) drag = null; };
  ["pointerup", "pointercancel"].forEach(t => box.addEventListener(t, up));
  // trackpad pinch and ctrl + mouse wheel on a computer
  box.addEventListener("wheel", e => { if (!e.ctrlKey) return; e.preventDefault(); const [x, y] = local(e); setZoom(S.zoom * Math.exp(-e.deltaY / 200), x, y); }, { passive: false });
  return [topbar(d.no, S.project.short, true),
    sheet("", h("div", { class: "band" }, d.title.toUpperCase()), h("div", { style: "padding:8px 12px;font-size:12.5px;color:#444" }, `${d.no}${d.rev ? "  |  Rev " + d.rev : ""}  |  ${d.status}`)),
    h("div", { class: "zoombar" }, h("button", { type: "button", onclick: () => setZoom(S.zoom / 1.5), "aria-label": "Zoom out" }, "−"), zl, h("button", { type: "button", onclick: () => setZoom(S.zoom * 1.5), "aria-label": "Zoom in" }, "+"), h("button", { type: "button", onclick: () => { setZoom(1); box.scrollTo(0, 0); } }, "Fit")),
    box,
    h("p", { class: "hint", style: "margin-top:10px" }, "Pinch with two fingers to zoom up to 12 times, drag with one finger to move, double tap to jump in or out. Full detail loads as you zoom in.")];
}

// ---------- daily work allocation, crew sections and site manager review ----------
// Roles per project: sm signs the diary, worker fills in, observer is on site to learn (fills in his own diary and forms only, signs off no technical work), pm (office) sees all and the KPIs.
const isAdmin = u => !!(PEOPLE.find(x => x.name === u) || {}).admin;
const roleIn = (u, p = S.project) => (p && p.team && p.team[u]) || (isAdmin(u) ? "pm" : null);
const roleLabel = r => ({ sm: "Site manager", sup: "Supervisor (8.7) and QC", worker: "Fill in and sign", observer: "Observer, learning on site", viewer: "Observer, learning on site", pm: "Project manager" })[r] || "";
const isSM = u => roleIn(u) === "sm";
const isMgr = u => ["sm", "pm"].includes(roleIn(u));
const isPM = u => roleIn(u) === "pm";
const canWrite = u => !!roleIn(u);
const isObserver = u => ["observer", "viewer"].includes(roleIn(u));
// technical sign-offs (splice box, patch panel, tests, checklist) only by the people doing the work
const canSignWork = u => canWrite(u) && !isObserver(u) && !isPM(u);
S.siteDone = {};
const TEAM_OF = () => Object.keys(S.project.team || {}).filter(n => ["worker", "sm", "sup"].includes(S.project.team[n]));
// everyone on site can be given work for the day, observers included (for example assisting)
const CREW_OF = () => Object.keys(S.project.team || {}).filter(n => ["worker", "sm", "sup", "observer", "viewer"].includes(S.project.team[n]));
const smName = (p = S.project) => Object.keys(p.team || {}).find(n => p.team[n] === "sm") || "the site manager";
const dayKey = () => S.project.id + "|" + ymd(S.date);
S.alloc = {}; S.sections = {}; S.final = {}; S.client = {};
// Client causes go on the diary the client signs. Every cause marked (Fibraco) is internal: it never reaches the
// client, and it goes on the Internal delays board that the whole Fibraco team on that project sees.
const CLIENT_CAUSES = ["Client: no access or permit", "Client: instruction or change", "Client: drawings or info late", "Client: free-issue material late", "Other contractor in the way", "Weather", "Safety stop"];
const FIB_CAUSES = ["Material not on site (Fibraco)", "Tool or test equipment missing or broken (Fibraco)", "Vehicle or transport (Fibraco)", "Man late or absent (Fibraco)", "Waiting on a Fibraco colleague (Fibraco)", "Rework (Fibraco)", "Fibraco instruction unclear (Fibraco)"];
const OTHER_FIB = "Other (Fibraco), type the reason";
const DELAY_CAUSES = CLIENT_CAUSES.concat(FIB_CAUSES);
const INTERNAL = ["Material late (Fibraco)", "Plant or tool breakdown", "Rework"]; // names used before 21 Oct
const isInternal = c => !!c && (/\(Fibraco\)/.test(c) || INTERNAL.some(x => String(c).startsWith(x)));
function delayCauses(p) {
  const custom = p ? Store.list(`dcause|${p.id}|`).map(([, o]) => o && o.text).filter(c => c && !FIB_CAUSES.includes(c)) : [];
  return CLIENT_CAUSES.concat(FIB_CAUSES, [...new Set(custom)].sort(), [OTHER_FIB]);
}
// who must react, by cause: the site manager unless the man must name a colleague
const REACT_PICK = ["Waiting on a Fibraco colleague (Fibraco)", "Rework (Fibraco)"];
function reactDefault(cause, p) { return REACT_PICK.includes(cause) || cause === OTHER_FIB ? "" : smName(p) || "Office (Wanro)"; }
function reactPeople(p) { return Object.keys(p.team || {}).filter(n => p.team[n] !== "observer").concat(["Office (Wanro)"]); }
const delayText = sec => (sec.delays || []).filter(d => d.cause).map(d => `${d.cause}, ${d.hrs || 0} hrs${d.what ? " (" + d.what + ")" : ""}`).join("  |  ");
function workDaysBefore(d, n) { const out = []; const x = new Date(d); while (out.length < n) { x.setDate(x.getDate() - 1); if (x.getDay() !== 0 && x.getDay() !== 6) out.unshift(new Date(x)); } return out; }
function projActs() { const a = S.project.area; return (a ? ACT[a] : ACT["SOLAR MV"]).map(x => ({ unit: x[0], act: x[1], area: a || "SOLAR MV" })); }
const KEEP = { qc: "QC", pcs: "PCS", foc: "FOC", rmu: "RMU", db: "DB", cat6a: "CAT6a", rj45: "RJ45", otdr: "OTDR", odtr: "OTDR", olts: "OLTS", sfps: "SFPs", spd: "SPD", dit: "DIT", m20: "M20", "48f": "48F", "(m20)": "(M20)", "(bidirectional)": "(bidirectional)", hv: "HV", mv: "MV", lv: "LV", ups: "UPS", ip: "IP", scada: "SCADA", eskom: "Eskom", "(internal)": "(internal)", "(comms": "(comms", space: "space", "space)": "space)" };
function nice2(s) { const t = s.toLowerCase().split(" ").map(w => KEEP[w] || w).join(" "); return t.charAt(0).toUpperCase() + t.slice(1); }
// The week's work comes from the programme, so nobody has to type it on site.
// A day the site manager has changed and sent is used instead of the programme.
function planBase(p, ds) {
  const rows = p && p.plan && p.plan[ds]; if (!rows) return null;
  const acts = p.acts || [];
  return rows.map(r => ({ who: r.who, act: r.act, loc: r.loc, target: String(r.target), unit: (acts.find(a => a[1] === r.act) || [])[0] || "ea", crit: !!r.crit, area: p.area, key: r.key }));
}
// The programme runs itself: work a man did not finish on an earlier day comes back on his next day by itself,
// with only what is left, until it is done. A note saying it was done before or is not needed stops it.
const AUTO_FROM = "2026-10-23";
const NOCARRY = /done before|al+ready|al+redy|previous|not needed|not required|cancel|n\/a|nvt|klaar|reeds/i;
function prevDays(ds, n) { const out = [], x = new Date(ds + "T12:00:00"); while (out.length < n) { x.setDate(x.getDate() - 1); if (x.getDay() !== 0) out.push(ymd(x)); } return out; }
function carryFor(p, ds, today) {
  if (ds < AUTO_FROM) return [];
  const days = prevDays(ds, 5).filter(d => d >= "2026-10-19"), groups = {};
  for (const d of days) {
    const base = (Store.get(`alloc|${p.id}|${d}`) || planBase(p, d) || []);
    const secs = {}; for (const [id, o] of Store.list(`sec|${p.id}|${d}|`)) secs[id.slice(`sec|${p.id}|${d}|`.length)] = o;
    const seen = {};
    base.forEach(t => {
      const w = t.who, j = (seen[w] = (seen[w] || 0) + 1) - 1, sec = secs[w] || {}, rows = sec.rows || [];
      const r = rows.find(x => x && x.k === t.act + "|" + t.loc) || (rows.some(x => x && x.k) ? {} : rows[j] || {});
      const g = groups[w + "§" + keyOf(t)] || (groups[w + "§" + keyOf(t)] = { w, t, target: 0, crit: false, from: d, stop: false });
      g.target += +t.target || 0; g.crit = g.crit || !!t.crit; if (d < g.from) g.from = d; if (d >= g.from) g.t = t;
      if (NOCARRY.test(r.note || "")) g.stop = true;
    });
  }
  const out = [];
  for (const g of Object.values(groups)) {
    if (g.stop || today.some(t => t.who === g.w && keyOf(t) === keyOf(g.t))) continue;
    let booked = 0; for (const d of days) { if (d < g.from) continue; const pr = Store.get(`prog|${p.id}|${d}|${g.w}`); booked += +(((pr || {}).k || {})[keyOf(g.t)] || 0); }
    let left = g.target - booked;
    const gt = grandTotal(p, keyOf(g.t)); if (gt != null) left = Math.min(left, gt - doneToDate(p, keyOf(g.t), ds, "", 0));
    if (left <= 0) continue;
    out.push({ who: g.w, act: g.t.act, loc: `${g.t.loc.replace(/\s*\(carried over.*\)$/i, "")} (carried over from ${dmy(new Date(g.from + "T12:00:00")).slice(0, 5)})`, target: String(left), unit: g.t.unit, crit: g.crit, area: p.area, key: keyOf(g.t), carry: true });
  }
  return out;
}
function planFor(k) {
  const [pid, ds] = k.split("|"), p = PROJECTS.find(x => x.id === pid) || (S.project && S.project.id === pid ? S.project : null);
  const base = planBase(p, ds); if (!base) return null;
  let out = base; try { out = base.concat(carryFor(p, ds, base)); } catch (e) {}
  Object.defineProperty(out, "_plan", { value: true, writable: true, enumerable: false });
  return out;
}
// who on the project has nothing to do today (the site manager and office are told)
function idleMen(p, ds) {
  const d = new Date(ds + "T12:00:00"); if (d.getDay() === 0 || !(p.plan && Object.keys(p.plan).some(x => x <= ds)) || ds > Object.keys(p.plan).sort().slice(-1)[0]) return [];
  const list = Store.get(`alloc|${p.id}|${ds}`) || planFor(`${p.id}|${ds}`) || [];
  return Object.keys(p.team || {}).filter(n => ["worker", "sup"].includes(p.team[n]) && !list.some(t => t.who === n));
}
const allocOf = k => Store.get("alloc|" + k) || planFor(k);
// ---------- the four blocks: Today, To date, Remaining, G Total ----------
// G Total = work done before the programme started + everything the programme plans for that activity at that spot.
// To date = work done before + what everyone on the project has submitted, plus what he is typing today.
const keyOf = t => t.key || (t.act + "|Site");
const totCache = {};
function grandTotal(p, key) {
  if (!totCache[p.id]) { const m = {}; for (const rows of Object.values(p.plan || {})) for (const r of rows) if (!r.carry) m[r.key] = (m[r.key] || 0) + (+r.target || 0); for (const [kk, n] of Object.entries(p.before || {})) m[kk] = (m[kk] || 0) + n; totCache[p.id] = m; }
  return totCache[p.id][key];
}
function doneToDate(p, key, ds, me, live) {
  let n = ((p.before || {})[key] || 0) + ((p.adjust || {})[key] || 0);
  for (const [id, o] of Store.list(`prog|${p.id}|`)) { const x = id.split("|"); if (x[2] > ds || (x[2] === ds && x[3] === me)) continue; n += +((o.k || {})[key] || 0); }
  return Math.max(0, n + (+live || 0));
}
// Work done at one spot is counted per spot (RMU 4, RMU 5...), the rest for the whole site. Same rule as the programme.
const PER_NODE = ["SPLICE FOC IN SPLICE BOX", "FIT BOX IN DB (COMMS SPACE)", "PREP DIN RAIL OR WALL BOX", "PREP AND ROUTE FOC TO BOX", "GLANDING (M20)", "48F PATCH PANEL TERMINATIONS"];
function nodeOf(loc) { const m = /RMU \d/i.exec(loc || ""); if (m) return m[0].toUpperCase(); if (/Diesel Generator|DG panel/i.test(loc || "")) return "DG panel"; if (/Control Room/i.test(loc || "")) return "Control Room"; return "Site"; }
const otherKey = o => o.act + "|" + (PER_NODE.includes(o.act) ? nodeOf(o.loc) : "Site");
// A team job is booked once: the man who books it counts the quantity, the others only note that they helped.
const otherList = sec => ((sec || {}).other || []).filter(o => o.act && +o.qty > 0 && !o.by && !o.helped);
// what one man did today, per activity and spot, so the whole crew sees the running totals (other work included)
function progOf(tasks, rows, other) { const k = {}; tasks.forEach((t, i) => { const q = +((rows[i] || {}).done || 0); if (q) k[keyOf(t)] = (k[keyOf(t)] || 0) + q; }); (other || []).forEach(o => { if (o.act && +o.qty > 0 && !o.by && !o.helped) k[otherKey(o)] = (k[otherKey(o)] || 0) + +o.qty; }); return k; }
function putProg(pid, ds, who, tasks, rows, other) { Store.put(`prog|${pid}|${ds}|${who}`, { k: progOf(tasks, rows, other), at: new Date().toISOString() }); }
// A task counts at most its target for the day. Extra on one job never hides a job that was not done.
const capped = (t, r) => Math.min(+((r || {}).done) || 0, +t.target || 0);
function blocks(t, todayInput, live, who) {
  const p = S.project, key = keyOf(t), g = grandTotal(p, key), ds = ymd(S.date);
  const tile = (label, kid, cls) => h("div", { class: "blk-tile " + cls }, h("div", { class: "blk-t" }, label), kid);
  const nTd = h("div", { class: "blk-num" }), nRem = h("div", { class: "blk-num" }), bRem = tile("Remain", nRem, "rem"), warn = h("div", { class: "blk-warn", hidden: true });
  const update = v => {
    const td = doneToDate(p, key, ds, who || S.user, v), rem = g == null ? null : g - td;
    nTd.textContent = String(td); nRem.textContent = rem == null ? "-" : String(rem);
    bRem.classList.toggle("over", rem != null && rem < 0); bRem.classList.toggle("zero", rem === 0);
    warn.hidden = !(rem != null && rem < 0); warn.textContent = rem < 0 ? `That is ${-rem} more than the total. Check the number.` : "";
  };
  update(live);
  const el = h("div", { class: "blk" },
    h("div", { class: "blk-row" },
      tile("Today", todayInput, "today"), tile("To date", nTd, "td"), bRem,
      tile("G Total", h("div", { class: "blk-num" }, g == null ? "-" : String(g)), "tot")),
    warn);
  el.update = update; return el;
}
function ensureDay(k = dayKey()) {
  if (S.alloc[k]) return;
  S.alloc[k] = allocOf(k) || [];
  S.sections[k] = {};
  for (const [id, o] of Store.list("sec|" + k + "|")) S.sections[k][id.slice(("sec|" + k + "|").length)] = o;
  const f = Store.get("final|" + k); if (f) S.final[k] = f.at;
  if (Store.get("site|" + k)) S.siteDone[k] = true;
}
function myTasks(u) { return (S.alloc[dayKey()] || []).map((t, i) => ({ ...t, i })).filter(t => t.who === u); }
function sectionOf(u) {
  const k = dayKey(); const secs = S.sections[k];
  if (!secs[u]) secs[u] = { status: "draft", hrs: "", rows: myTasks(u).map(() => ({})), other: [], delays: [], sig: "" };
  return secs[u];
}
function statusPill(st) {
  const map = { draft: ["Not submitted", "#8a8f98"], submitted: ["Submitted", "#0069aa"], returned: ["Sent back", "#c8102e"], approved: ["Approved", "#1e8e3e"] };
  const [t, c] = map[st || "draft"];
  return h("span", { style: `display:inline-block;font-size:11px;font-weight:800;color:#fff;background:${c};border-radius:999px;padding:3px 9px;white-space:nowrap` }, t);
}

// ---------- schedule bars: ahead, on par or behind ----------
const C_AHEAD = "#1e8e3e", C_PAR = "#0069aa", C_LATE = "#c8102e";
function todayFor(p) {
  const tasks = myTasks(p), sec = (S.sections[dayKey()] || {})[p] || {};
  const target = tasks.reduce((a, t) => a + (+t.target || 0), 0);
  const filled = tasks.length && tasks.every((t, i) => ((sec.rows || [])[i] || {}).done !== undefined && ((sec.rows || [])[i] || {}).done !== "");
  const rows = tasks.map((t, i) => (sec.rows || [])[i] || {});
  const done = tasks.reduce((a, t, i) => a + capped(t, rows[i]), 0);
  const short = filled ? tasks.map((t, i) => ({ t, d: +rows[i].done || 0 })).filter(x => x.d < +x.t.target) : [];
  const extra = filled ? tasks.map((t, i) => ({ t, x: (+rows[i].done || 0) - (+t.target || 0) })).filter(x => x.x > 0) : [];
  return { d: S.date, target, done, filled, why: delayText(sec), short, extra, other: (sec.other || []).filter(o => o.act) };
}
function dayFor(p, d) {
  const k = S.project.id + "|" + ymd(d), alloc = allocOf(k) || [], sec = Store.get("sec|" + k + "|" + p) || {};
  const mine = alloc.filter(t => t.who === p); if (!mine.length) return null;
  const target = mine.reduce((a, t) => a + (+t.target || 0), 0);
  const done = mine.reduce((a, t, i) => a + capped(t, (sec.rows || [])[i]), 0);
  return { d, target, done, filled: ["submitted", "approved"].includes(sec.status), why: delayText(sec) };
}
function schedFor(p) {
  const t = todayFor(p);
  const past = workDaysBefore(S.date, 4).map(d => dayFor(p, d)).filter(Boolean);
  const days = [...past, t].filter(x => x.target > 0);
  if (!days.length) return null;
  let plan = 0, done = 0;
  const ids = new Map(Store.list("alloc|" + S.project.id + "|"));
  for (const ds of Object.keys(S.project.plan || {})) if (!ids.has(`alloc|${S.project.id}|${ds}`)) ids.set(`alloc|${S.project.id}|${ds}`, planFor(S.project.id + "|" + ds));
  for (const [id, alloc] of ids) {
    const ds = id.split("|")[2]; if (ds > ymd(S.date)) continue;
    if (ds === ymd(S.date)) { plan += t.target; done += t.done; continue; }
    const x = dayFor(p, new Date(ds + "T12:00:00")); if (x) { plan += x.target; done += x.filled ? x.done : 0; }
  }
  return { days, plan, done, scope: null, perDay: t.target || (past[0] || {}).target || 1, unit: (myTasks(p)[0] || {}).unit || "ea" };
}
function verdict(done, target, perDay) {
  const diff = done - target;
  if (diff > 0) return { c: C_AHEAD, t: `Ahead +${diff}${perDay ? "" : ""}` };
  if (diff === 0) return { c: C_PAR, t: "On par" };
  return { c: C_LATE, t: `Behind ${-diff}` };
}
function barColour(pct) {
  if (pct >= 100) return { bg: "#3a9d23", fg: "#fff" };
  const hue = Math.round(Math.max(0, Math.min(1, (pct - 60) / 40)) * 50);
  return { bg: `hsl(${hue}, 90%, ${hue > 30 ? 46 : 48}%)`, fg: hue > 30 ? "#15191e" : "#fff" };
}
const STRIPES = "repeating-linear-gradient(45deg, rgba(255,255,255,.22) 0 7px, transparent 7px 14px)";
function pill(pct, col, marker) {
  return h("div", { style: "position:relative;flex:1;height:22px;background:#e6e9ed;border-radius:11px;overflow:hidden;box-shadow:inset 0 1px 2px rgba(0,0,0,.08)" },
    h("div", { style: `position:absolute;left:0;top:0;bottom:0;width:${Math.max(0, Math.min(100, pct))}%;background:${col ? col.bg : "transparent"};background-image:${STRIPES};border-radius:11px` }),
    marker != null ? h("div", { style: `position:absolute;top:-2px;bottom:-2px;left:calc(${marker}% - 1px);width:2px;background:#15191e` }) : null,
    h("div", { style: "position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:11.5px;font-weight:800;color:#15191e;text-shadow:0 0 3px #fff" }, col ? `${Math.round(pct)}%` : ""));
}
function block(lines, col) {
  return h("div", { style: `width:88px;flex:none;border-radius:6px;padding:4px 4px;text-align:center;background:${col.bg};color:${col.fg};line-height:1.2` },
    h("div", { style: "font-size:10.5px;font-weight:900;letter-spacing:.04em" }, lines[0]),
    lines[1] ? h("div", { style: "font-size:12px;font-weight:800" }, lines[1]) : null,
    lines[2] ? h("div", { style: "font-size:10.5px;font-weight:700" }, lines[2]) : null);
}
function hbar(label, done, target, opts) {
  opts = opts || {};
  const unit = opts.unit || "ea";
  const head = h("div", { style: "display:flex;justify-content:space-between;align-items:baseline;gap:8px;font-size:12.5px;margin-bottom:5px" },
    h("b", {}, label), h("span", { style: "color:#5b6470;font-weight:700;white-space:nowrap" }, opts.empty ? "" : `${done} of ${target} ${unit}`));
  if (opts.empty) return h("div", { style: "padding:8px 12px;border-top:1px solid var(--line)" }, head,
    h("div", { style: "display:flex;gap:8px;align-items:center" }, pill(0, null), block(["NOT IN", "yet"], { bg: "#c4cad2", fg: "#15191e" })));
  const pct = target ? done / target * 100 : 100, col = barColour(pct), diff = done - target;
  const days = opts.perDay && diff ? `${+(Math.abs(diff) / opts.perDay).toFixed(1)} day${Math.abs(diff) / opts.perDay === 1 ? "" : "s"}` : "";
  const lines = diff > 0 ? ["AHEAD", `+${diff} ${unit}`, days] : diff === 0 ? ["ON TARGET", "✓"] : ["BEHIND", `${-diff} ${unit}`, days];
  return h("div", { style: "padding:8px 12px;border-top:1px solid var(--line)" }, head,
    h("div", { style: "display:flex;gap:8px;align-items:center" }, pill(pct, col), block(lines, col)),
    opts.why ? h("div", { style: "font-size:11.5px;color:#5b6470;margin-top:4px" }, "Delay: " + opts.why) : null);
}
const dayLab = d => new Date(d).toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" });
function schedPanel(p, title) {
  const sc = schedFor(p);
  if (!sc) return sheet("", h("div", { class: "band" }, title || "Am I on schedule?"), h("div", { style: "padding:10px 12px;font-size:13px;color:#5b6470" }, "Shows once the project schedule is loaded."));
  return sheet("", h("div", { class: "band" }, title || "Am I on schedule?"),
    ...sc.days.map((x, i) => hbar(i === sc.days.length - 1 ? `Today, ${dayLab(x.d)}` : dayLab(x.d), x.done, x.target, { unit: sc.unit, empty: x.filled === false, why: x.why })),
    h("div", { style: "border-top:2px solid #15191e;background:#f6f8fa" }, hbar("Total on this project to date", sc.done, sc.plan, { unit: sc.unit, perDay: sc.perDay })),
    h("div", { style: "padding:0 12px 10px;font-size:11.5px;color:#5b6470;background:#f6f8fa" }, `${sc.done} of ${sc.plan} ${sc.unit} done on this project so far, counting every day you were given work. The full project bar comes once the schedule is loaded.`));
}
function projectTotals() {
  let plan = 0, done = 0, scope = 0;
  [...new Set((S.alloc[dayKey()] || []).map(a => a.who))].forEach(p => { const sc = schedFor(p); if (sc && sc.scope) { plan += sc.plan; done += sc.done; scope += sc.scope; } });
  return scope ? { plan: Math.round(plan / scope * 100), done: Math.round(done / scope * 100) } : null;
}
function projectBar(title) {
  const t = projectTotals(); if (!t) return null;
  const col = barColour(t.plan ? t.done / t.plan * 100 : 100), diff = t.done - t.plan;
  return sheet("", h("div", { class: "band" }, title || "Project progress"),
    h("div", { style: "padding:10px 12px" },
      h("div", { style: "display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:5px" }, h("b", {}, `${t.done}% of the project done`), h("span", { style: "color:#5b6470;font-weight:700" }, `Plan: ${t.plan}%`)),
      h("div", { style: "display:flex;gap:8px;align-items:center" }, pill(t.done, col, t.plan), block(diff > 0 ? ["AHEAD", `+${diff}%`] : diff === 0 ? ["ON TARGET", "✓"] : ["BEHIND", `${-diff}%`], col)),
      h("div", { style: "font-size:11.5px;color:#5b6470;margin-top:5px" }, "The black line is where the programme says we should be today.")));
}

// ---------- cable test chain ----------
// Pass marks come from the project's fibre design plan.
const SPEC = { splMax: 0.1, splMean: 0.075, att1310: 0.36, att1550: 0.25 };
const sp = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const pulseFor = m => m < 2000 ? "100 ns" : m < 20000 ? "500 ns" : m < 50000 ? "1 000 ns" : "2 500 ns";
const TPL = {
  cores: [["wtg", "WTG splice box", "work", "Splice box"], ["ipp", "IPP patch panel", "work", "Patch panel"], ["control", "Control test", "test", "Control"], ["witness", "Client witness test", "test", "Witness"]],
  opgw: [["ptw", "Permit to work issued", "work", "Permit"], ["call", "Network owner called before opening", "work", "Call"], ["joint", "Steel joint box fitted", "work", "Joint box"], ["splice", "48 fibres re-spliced", "work", "Spliced"], ["control", "Bidirectional OTDR and OLTS", "test", "Tests"], ["witness", "Network owner acceptance", "test", "Accepted"]],
  full: [["drum", "Drum acceptance test", "test", "Drum"], ["dit", "Duct integrity test", "test", "DIT"], ["install", "Cable blown in", "work", "Blown in"], ["post", "After install test", "test", "After"], ["splice", "Spliced and terminated", "work", "Spliced"], ["control", "Control test", "test", "Control"], ["witness", "Client witness test", "test", "Witness"]]
};
const stagesOf = l => TPL[l.tpl];
const stageLab = (l, k) => (stagesOf(l).find(s => s[0] === k) || [k, k])[1];
const FAULT_TYPES = ["High splice loss", "High connector loss", "Break or no light", "High reflectance", "Wrong core or port", "Damaged pigtail or connector", "Bend or macrobend", "Other"];
const FIBRE_COL = ["Blue", "Orange", "Green", "Brown", "Slate", "White"];
const SWATCH = { Blue: "#1565c0", Orange: "#f57c00", Green: "#2e9e3e", Brown: "#8d5a3b", Slate: "#78828c", White: "#ffffff" };
let DESIGN = null; // turbine design data comes with the project in the setup file
const SYS = () => (S.project && S.project.sys) || "System";
const OEM = () => (S.project && S.project.oem) || "Turbine";
const adminName = () => (PEOPLE.find(x => x.admin) || {}).name || "the office";
function designTurbines() {
  const out = [];
  DESIGN.collectors.forEach(c => {
    let dist = 0; const wtgs = c.run.filter(r => r[0].startsWith("WTG")).map(r => r[0]);
    c.run.forEach(([name, sec]) => {
      dist += DESIGN.len[sec];
      if (!name.startsWith("WTG")) return;
      const i = wtgs.indexOf(name), bio = [7 + 2 * i, 8 + 2 * i], last = 6 + 2 * wtgs.length;
      const role = core => {
        if (core <= 2) return c.p12[i] === "V" ? `${OEM()} core ${core}` : "Splice straight";
        if (core <= 4) return c.p34[i] === "V" ? `${OEM()} core ${core}` : "Splice straight";
        if (core <= 6) return c.c56[name] === "OEM" ? `${OEM()} core ${core}` : "Splice straight";
        if (core === bio[0]) return `${SYS().toUpperCase()} to mid-coupler 7`;
        if (core === bio[1]) return `${SYS().toUpperCase()} to mid-coupler 8`;
        if (core < bio[0] || core > last) return "Spare at panel";
        return "Splice straight";
      };
      out.push({ name, coll: c.n, feeder: c.f, sec, dist, bio, role });
    });
  });
  return out;
}
S.links = {}; S.issues = {}; S.bio = {};
const rid = () => Math.random().toString(36).slice(2, 7).toUpperCase();
function overlayLink(pid, l) { const o = Store.get("link|" + pid + "|" + l.id); if (o) { l.steps = o.steps || {}; l.faults = o.faults || []; } return l; }
function seedLinks(force) {
  const p = S.project, pid = p.id;
  if (S.links[pid] && !force) return;
  let links = [];
  if (p.kind === "turbines" && p.design) { DESIGN = p.design; BIO_CHECK = (p.checklist || {}).sections || []; links = designTurbines().map(t => ({ id: t.name, name: `${t.name} ${SYS()} link`, tpl: "cores", wtg: t, cores: t.bio, lengthM: t.dist, steps: {}, faults: [] })); }
  else if (p.kind === "opgw") links = (p.links || []).map(x => Object.assign({ tpl: "opgw", manual: true, steps: {}, faults: [] }, x));
  for (const [id, o] of Store.list("link|" + pid + "|")) if (o.meta && !links.find(l => l.id === o.meta.id)) links.push(Object.assign({ steps: {}, faults: [] }, o.meta));
  S.links[pid] = links.map(l => overlayLink(pid, l));
  S.issues[pid] = Store.list("issue|" + pid + "|").map(([, o]) => o);
  S.bio[pid] = {}; for (const [id, o] of Store.list("bio|" + pid + "|")) S.bio[pid][id.split("|").slice(2).join("|")] = o;
}
function allFaults() {
  const pid = S.project.id;
  const a = (S.links[pid] || []).flatMap(l => l.faults.map(f => ({ id: f.id, title: `${l.wtg ? l.wtg.name : l.name}, core ${f.core}`, detail: `${f.type}, ${f.reading} at the ${f.where}. Found at the ${stageLab(l, f.stage).toLowerCase()}.`, found: f.found, foundOn: f.foundOn, resp: f.resp, status: f.status, ref: f })));
  const b = (S.issues[pid] || []).map(f => ({ ...f, ref: f }));
  return [...a, ...b];
}
const myRepairs = u => allFaults().filter(f => f.resp === u && f.status === "open");
function respFor(l, stage, where) {
  const by = k => (l.steps[k] || {}).by;
  if (stage === "drum") return "Supplier (damaged before delivery)";
  if (stage === "dit") return "Duct installer (civils contractor)";
  if (stage === "post") return by("install") || "Installation team";
  if (stage === "control") return l.tpl === "cores" ? (/IPP/.test(where || "") ? by("ipp") : by("wtg")) || "Splicing team" : by("splice") || "Splicing team";
  return `${smName()} (investigate)`;
}
function stepState(l, k) {
  const st = l.steps[k];
  if (!st) return "todo";
  if (l.faults.some(f => f.stage === k && f.status === "retest")) return "retest";
  return st.result === "fail" ? "fail" : "ok";
}
const CHIP = { ok: ["#3a9d23", "#fff", "✓"], fail: ["#c8102e", "#fff", "✕"], retest: ["#f2b400", "#15191e", "↻"], todo: ["#e6e9ed", "#5b6470", "·"] };
function chain(l, extra) {
  return h("div", { style: "display:flex;gap:3px;padding:8px 12px 10px" }, ...stagesOf(l).map(([k, , , short]) => {
    const [bg, fg, ic] = CHIP[stepState(l, k)];
    return h("div", { style: `flex:1;border-radius:5px;background:${bg};color:${fg};font-size:9.5px;font-weight:800;text-align:center;padding:5px 2px;line-height:1.15` }, h("div", { style: "font-size:12px" }, ic), short);
  }), extra || null);
}
function legend() {
  return sheet("", h("div", { style: "display:flex;flex-wrap:wrap;gap:10px;padding:10px 12px;font-size:11.5px;color:#5b6470" },
    ...[["ok", "Passed or done"], ["fail", "Failed, repair waiting"], ["retest", "Repaired, waiting for retest"], ["todo", "Not yet"]].map(([k, t]) => h("span", { style: "display:flex;align-items:center;gap:5px" }, h("i", { style: `display:inline-block;width:12px;height:12px;border-radius:3px;background:${CHIP[k][0]}` }), t))));
}
const BIO_TOTAL = () => BIO_CHECK.reduce((a, x) => a + x[1].length, 0);
function bioCount(n) { const b = (S.bio[S.project.id] || {})[n]; const items = b ? Object.values(b.items) : []; return { done: items.filter(x => x.v).length, fail: items.filter(x => x.v === "Fail").length }; }
function vTests() {
  seedLinks();
  const links = S.links[S.project.id], isBio = S.project.kind === "turbines";
  if (isBio) {
    return [topbar("Turbines", S.project.short, true),
      h("p", { class: "form-sub" }, `Every turbine with its ${SYS()} cores from the collector sheets. Tap a turbine for its splice box, patch panel, tests and the ${SYS()} checklist.`),
      legend(),
      ...DESIGN.collectors.map(c => sheet("", h("div", { class: "band" }, `Collector ${c.n} / ${c.f}`),
        ...links.filter(l => l.wtg.coll === c.n).map(l => { const bc = bioCount(l.wtg.name); return h("button", { type: "button", style: "display:block;width:100%;text-align:left;border:0;border-top:1px solid var(--line);background:var(--card);padding:8px 0 0;cursor:pointer", onclick: () => { S.link = l; go("link"); } },
          h("div", { style: "display:flex;justify-content:space-between;padding:0 12px;font-size:13px" }, h("b", {}, l.wtg.name), h("span", { style: "color:#5b6470;font-weight:700" }, `Cores ${l.cores[0]} and ${l.cores[1]}  |  ${(l.lengthM / 1000).toFixed(2)} km`)),
          chain(l, h("div", { style: `flex:1;border-radius:5px;background:${bc.fail ? "#c8102e" : bc.done === BIO_TOTAL() ? "#3a9d23" : bc.done ? "#f2b400" : "#e6e9ed"};color:${bc.fail || bc.done === BIO_TOTAL() ? "#fff" : "#15191e"};font-size:9.5px;font-weight:800;text-align:center;padding:5px 2px;line-height:1.15` }, h("div", { style: "font-size:12px" }, `${bc.done}/${BIO_TOTAL()}`), "Checklist"))); })))];
  }
  return [topbar("Cable tests", S.project.short, true),
    h("p", { class: "form-sub" }, S.project.kind === "opgw" ? "Every step of the repair is signed off with a name, a photo and the time. Nothing can be skipped." : "New cable goes through seven steps. When a test fails, the app knows who did the step before it, and the repair lands on that man's phone."),
    S.project.kind !== "opgw" && (isSM(S.user) || isPM(S.user)) ? h("button", { class: "mbtn ghost", onclick: addLink }, "+ Add cable link", h("small", {}, "From the cable schedule, for example RMU 1 to RMU 3")) : null,
    legend(),
    ...(links.length ? links : [null]).map(l => !l ? h("p", { class: "note" }, "No cable links loaded for this project yet. They load from the project's cable schedule.") : h("button", { class: "sheet", style: "display:block;width:100%;text-align:left;padding:0;border:1px solid var(--line);margin-bottom:12px;background:var(--card);cursor:pointer", onclick: () => { S.link = l; go("link"); } },
      h("div", { class: "band", style: "display:flex;justify-content:space-between" }, h("span", {}, l.name), h("span", {}, `${l.cores} cores`)), chain(l)))];
}
function addLink() {
  const L = { name: "", cores: "12", len: "" };
  const ov = h("div", { class: "overlay", role: "dialog", "aria-label": "Add cable link" }, h("div", { class: "modal" }, h("h2", {}, "Add cable link"),
    h("p", {}, "One link is one cable between two points."),
    inp("text", "", v => L.name = v, "From and to, e.g. RMU 1 to RMU 3"), h("div", { style: "height:8px" }),
    sel(["4", "6", "8", "12", "24", "48", "96"], L.cores, v => L.cores = v, "Cores"), h("div", { style: "height:8px" }),
    inp("number", "", v => L.len = v, "Length in metres"),
    h("div", { class: "row" }, h("button", { class: "btn-g", type: "button", onclick: () => ov.remove() }, "Cancel"),
      h("button", { class: "btn-w", type: "button", onclick: () => {
        if (!L.name.trim()) return;
        S.links[S.project.id].push({ id: "L" + Date.now().toString(36) + rid(), name: L.name.trim(), tpl: "full", cores: +L.cores || 12, lengthM: +L.len || 0, steps: {}, faults: [], custom: true });
        persist(); ov.remove(); render();
      } }, "Add"))));
  document.body.append(ov);
}
function coreTable(t) {
  return sheet("", h("div", { class: "band" }, `Fibre cores at ${t.name}`), h("table", {}, h("thead", {}, h("tr", {}, h("th", {}, "Core"), h("th", {}, "Tube / fibre"), h("th", { class: "l" }, "At this turbine"))),
    h("tbody", {}, Array.from({ length: 24 }, (_, i) => {
      const core = i + 1, tube = FIBRE_COL[Math.floor(i / 6)], fib = FIBRE_COL[i % 6], r = t.role(core), bio = r.includes("mid-coupler");
      const sw = c => h("i", { style: `display:inline-block;width:11px;height:11px;border-radius:2px;border:1px solid #9aa3ad;background:${SWATCH[c]};vertical-align:-1px` });
      return h("tr", { style: bio ? "background:#ffe9ec" : "" }, h("td", { style: "text-align:center;font-weight:800;width:44px" }, core),
        h("td", { style: "width:88px;text-align:center;font-size:11.5px" }, sw(tube), " ", sw(fib), h("div", { style: "color:#5b6470" }, `${tube.slice(0, 2)} / ${fib.slice(0, 2)}`)),
        h("td", { style: `padding:6px 8px;font-size:12.5px;${bio ? "font-weight:900;color:#c8102e" : r.startsWith(OEM()) ? "font-weight:800" : "color:#5b6470"}` }, r));
    }))),
    h("p", { class: "hint", style: "margin:6px 12px 10px" }, `From the collector sheet. The ${SYS()} pair always lands on mid-coupler 7 and 8 in the splice box.`));
}
function vLink() {
  seedLinks();
  const l = S.link, t = l.wtg, st = stagesOf(l);
  const next = st.find(([k]) => !l.steps[k] || stepState(l, k) === "fail" || stepState(l, k) === "retest");
  const rows = st.map(([k, lab, kind]) => {
    const s = l.steps[k], state = stepState(l, k), [bg, fg] = CHIP[state];
    return h("tr", {}, h("td", { style: "padding:8px;font-size:12.5px;font-weight:700" }, lab, h("div", { style: "font-weight:500;color:#5b6470" }, s ? `${s.by}, ${dayLab(s.on)}` : "Not yet")),
      h("td", { style: "width:92px;text-align:center" }, h("span", { style: `display:inline-block;border-radius:999px;padding:3px 9px;font-size:11px;font-weight:800;background:${bg};color:${fg}` }, state === "todo" ? "-" : state === "retest" ? "Retest" : kind === "work" ? "Done" : s.result === "fail" ? "Failed" : "Passed")));
  });
  const bc = t ? bioCount(t.name) : null;
  return [topbar(t ? t.name : l.name, t ? `Collector ${t.coll} / ${t.feeder}  |  ${SYS()} cores ${l.cores[0]} and ${l.cores[1]}` : `${S.project.short}  |  ${l.cores} cores`, true),
    t ? sheet("", h("table", {}, h("tbody", {},
      h("tr", {}, h("td", { class: "lab" }, "Control room end"), h("td", { class: "ro" }, `Collector ${t.coll} 24 way panel, ports ${l.cores[0]} and ${l.cores[1]}`)),
      h("tr", {}, h("td", { class: "lab" }, "Turbine end"), h("td", { class: "ro" }, `Splice box mid-coupler 7 and 8`)),
      h("tr", {}, h("td", { class: "lab" }, "Fibre length"), h("td", { class: "ro" }, `About ${sp(l.lengthM)} m (sections to ${t.sec})`)),
      h("tr", {}, h("td", { class: "lab" }, "OTDR pulse width"), h("td", { class: "ro" }, `${pulseFor(l.lengthM)} or less`))))) : null,
    chain(l),
    sheet("", h("div", { class: "band" }, "Fibre record"), h("table", {}, h("tbody", {}, rows))),
    ...l.faults.map(f => sheet("", h("div", { class: "band", style: `background:${f.status === "closed" ? "#3a9d23" : f.status === "retest" ? "#f2b400" : "#c8102e"};color:${f.status === "retest" ? "#15191e" : "#fff"}` }, `${f.id}  ${f.status === "closed" ? "Closed" : f.status === "retest" ? "Repaired, waiting for retest" : "Open fault"}`),
      h("table", {}, h("tbody", {}, ...[["Found at", stageLab(l, f.stage)], ["Core", f.core], ["Where", f.where], ["Fault", `${f.type}, ${f.reading}`], ["Found by", `${f.found}, ${dayLab(f.foundOn)}`], ["Repair by", f.resp], f.repairNote ? ["Repair done", f.repairNote] : null].filter(Boolean)
        .map(([a, b]) => h("tr", {}, h("td", { class: "lab" }, a), h("td", { class: "ro" }, b))))))),
    next && canSignWork(S.user) ? h("button", { class: "submit", type: "button", onclick: () => { S.testStage = next[0]; go("logtest"); } }, `${next[2] === "test" ? "Log" : "Sign off"} ${next[1].toLowerCase()}`) : null,
    t ? h("button", { class: "mbtn", style: "margin-top:12px", onclick: () => go("biocheck") }, `${(S.project.checklist || {}).name || "Installation checklist"}`, h("small", {}, `${bc.done} of ${BIO_TOTAL()} checked${bc.fail ? `, ${bc.fail} failed` : ""}`)) : null,
    t ? coreTable(t) : null,
    h("p", { class: "hint", style: "margin-top:14px" }, l.tpl === "opgw" ? "Every step is signed with a name, a photo and the time, in order. A fault found at the tests goes back to whoever re-spliced. A fault at acceptance after clean tests goes to the site manager to investigate." : l.tpl === "cores" ? "Who repairs: a control test fault at the turbine end goes back to whoever did the splice box. At the control room end it goes to whoever did the patch panel. A witness test fault after a clean control test goes to the site manager to investigate." : "Who repairs: drum test fault goes to the supplier. DIT fault goes to the duct installer. After install fault goes to whoever blew the cable in. Control test fault goes to whoever spliced it. Witness fault after a clean control test goes to the site manager to investigate.")];
}
const WORK_CHECKS = {
  wtg: l => [`Core ${l.cores[0]} spliced to mid-coupler 7`, `Core ${l.cores[1]} spliced to mid-coupler 8`, "Through cores spliced straight as per the collector sheet", `Connectors 7 and 8 labelled ${SYS().toUpperCase()}`, "FOC in and FOC out labelled below the splice box", "At least 4 m slack coiled", "Tray closed and box sealed"],
  ipp: l => [`Core ${l.cores[0]} on port ${l.cores[0]}, Collector ${l.wtg.coll} panel`, `Core ${l.cores[1]} on port ${l.cores[1]}, Collector ${l.wtg.coll} panel`, `Ports labelled ${SYS().toUpperCase()} ${l.wtg.name}`, "At least 4 m slack coiled in the cabinet"],
  install: () => ["Duct integrity test passed before blowing", "Cable paid off in a figure 8, no kinks", "Drum on a proper drum jack", "Cable ends sealed against water", "GPS logged at bends, road crossings and joints"],
  splice: l => l.tpl === "opgw" ? ["All 48 fibres fusion spliced", "Trays and fibres labelled", "Slack stored correctly in the box", "Joint box closed and sealed"] : ["All splices are fusion splices", "Trays and cores labelled", "At least 4 m slack coiled", "Joint closure sealed", "GPS logged at the joint"],
  ptw: () => ["Permit to work issued and signed", "Eskom authorised person on site", "Work stays inside the permit limits"],
  call: () => ["Network owner's telecoms contact called before the joint was opened", "Fibre interruption window confirmed"],
  joint: () => ["Damaged plastic dome removed and kept as evidence", "Bird nest and debris removed", "Steel joint box fitted and sealed", "Box fixed to the structure as per the concession"]
};
const WORK_NOTE = { ptw: "Permit number, authorised person, time issued", call: "Time of the call and who you spoke to", joint: "Concession number, if issued", wtg: "", ipp: "", install: "Drum number and length installed", splice: "" };
function vLogTest() {
  const l = S.link, key = S.testStage, [, lab, kind] = stagesOf(l).find(s => s[0] === key);
  const T = { photos: [], checks: {}, gps: null, cores: (Array.isArray(l.cores) ? l.cores : Array.from({ length: +l.cores || 1 }, (_, i) => i + 1)).map(c => ({ core: String(c) })), att1310: "", att1550: "", result: "", where: "", type: "", drum: "", cert: "" };
  const sub = `${l.wtg ? l.wtg.name : l.name}  |  ${dmy(S.date)}`;
  if (kind === "work") {
    const items = WORK_CHECKS[key](l), noteLab = WORK_NOTE[key];
    return [topbar(lab, sub, true),
      h("p", { class: "form-sub" }, "Tick every point. A photo of the finished work is required before you can sign it off."),
      sheet("", h("table", {}, h("tbody", {}, items.map((it, i) => h("tr", {}, h("td", { style: "padding:8px;font-size:12.5px;font-weight:700" }, it), h("td", { style: "width:120px" }, seg([["Yes", "Done"]], "", v => T.checks[i] = v))))))),
      noteLab ? sheet("", h("div", { class: "band" }, "Details"), h("div", { style: "padding:8px" }, inp("text", "", v => T.note = v, noteLab))) : null,
      sheet("", h("div", { class: "band" }, "Location"), gpsBlock(T, "gps")),
      sheet("", h("div", { class: "band" }, "Photo of the open box or panel"), photoBlock(T.photos)),
      submitBtn(() => { const e = []; if (items.some((_, i) => !T.checks[i])) e.push(`Tick every point. If one cannot be done, speak to ${smName()} first.`); if (noteLab && key === "ptw" && !(T.note || "").trim()) e.push("Fill in the permit details."); if (!T.photos.length) e.push("Take a photo of the finished work."); return e; },
        { label: "Sign off", onDone: () => { l.steps[key] = { by: S.user, on: ymd(S.date), note: T.note || "", gps: T.gps || null, photos: T.photos.map(p => ({ ph: p.ph, caption: p.caption })) }; saveLink(l); showInfo("Signed off", `Saved against ${l.wtg ? l.wtg.name : l.name} with your name, so any fault found later comes back to the right person.`); goBack(); } })];
  }
  const verdict = h("div");
  const limits = l.manual ? "Grade against the Eskom acceptance testing standard. Automatic grading comes once the limits are loaded." : `Limits from the design plan: splice at most ${SPEC.splMax} dB, average per fibre at most ${SPEC.splMean} dB, attenuation at most ${SPEC.att1310} dB/km at 1310 nm and ${SPEC.att1550} dB/km at 1550 nm.`;
  const check = () => {
    const bad = [];
    if (key === "control") T.cores.forEach(c => { if (c.max !== undefined && c.max !== "" && +c.max > SPEC.splMax) bad.push(`Core ${c.core} worst splice ${c.max} dB is over ${SPEC.splMax} dB`); if (c.mean !== undefined && c.mean !== "" && +c.mean > SPEC.splMean) bad.push(`Core ${c.core} average splice ${c.mean} dB is over ${SPEC.splMean} dB`); });
    if (["drum", "post", "control"].includes(key)) { if (T.att1310 !== "" && +T.att1310 > SPEC.att1310) bad.push(`1310 nm attenuation ${T.att1310} dB/km is over ${SPEC.att1310}`); if (T.att1550 !== "" && +T.att1550 > SPEC.att1550) bad.push(`1550 nm attenuation ${T.att1550} dB/km is over ${SPEC.att1550}`); }
    return bad;
  };
  const failBox = h("div", { hidden: true },
    sheet("", h("div", { class: "band" }, "Fault details"), h("table", {}, h("tbody", {},
      h("tr", {}, h("td", { class: "lab" }, "Where"), h("td", {}, l.tpl === "cores" ? sel(["WTG end (splice box)", "IPP end (patch panel)", "In the cable run"], "", v => { T.where = v; drawResp(); }, "Choose") : inp("text", "", v => T.where = v, "e.g. joint at manhole 3"))),
      h("tr", {}, h("td", { class: "lab" }, "Fault"), h("td", {}, sel(FAULT_TYPES, "", v => T.type = v, "Choose"))),
      h("tr", {}, h("td", { class: "lab" }, "Repair goes to", h("span", { class: "auto" }, "auto")), h("td", { class: "ro", style: "color:#c8102e;font-weight:800" }, h("span", { id: "respname" }, respFor(l, key, ""))))))),
    h("p", { class: "hint" }, "The app takes this from the fibre record. You do not have to know who did the work."));
  const drawResp = () => { const s = failBox.querySelector("#respname"); if (s) s.textContent = respFor(l, key, T.where); };
  const redraw = () => {
    const bad = check();
    const manual = key === "dit" || key === "witness" || l.manual;
    const isFail = manual ? T.result === "fail" || bad.length > 0 : bad.length > 0;
    const ready = manual ? !!T.result : key === "control" ? T.cores.every(c => c.max !== undefined && c.max !== "" && c.mean !== undefined && c.mean !== "") && T.att1550 !== "" : T.att1550 !== "";
    T.auto = isFail ? "fail" : ready ? "pass" : "";
    verdict.replaceChildren(!T.auto ? h("div", { style: "padding:12px;text-align:center;color:#5b6470;font-size:13px" }, l.manual ? "Record the readings and choose Pass or Fail." : "Fill in the readings. The app decides pass or fail.") :
      h("div", { style: `margin:0 0 12px;padding:12px;border-radius:8px;background:${T.auto === "pass" ? "#3a9d23" : "#c8102e"};color:#fff` }, h("div", { style: "font-weight:900;font-size:16px" }, T.auto === "pass" ? "PASS" : "FAIL"), ...bad.map(b => h("div", { style: "font-size:12.5px;margin-top:3px" }, b))));
    failBox.hidden = T.auto !== "fail";
  };
  const num = (v, set, ph) => inp("number", v, x => { set(x); redraw(); }, ph, { step: "0.01" });
  const readings = [];
  if (key === "drum") readings.push(sheet("", h("table", {}, h("tbody", {},
    h("tr", {}, h("td", { class: "lab" }, "Drum number"), h("td", {}, inp("text", "", v => T.drum = v, "From the drum"))),
    h("tr", {}, h("td", { class: "lab" }, "Factory test certificate"), h("td", {}, seg([["Yes", "Received"], ["No", "Missing"]], "", v => T.cert = v))),
    h("tr", {}, h("td", { class: "lab" }, "OTDR setting", h("span", { class: "auto" }, "auto")), h("td", { class: "ro" }, "1550 nm, 30 ns pulse, one direction"))))));
  if (key === "dit" || key === "witness" || l.manual) readings.push(sheet("", h("table", {}, h("tbody", {},
    h("tr", {}, h("td", { class: "lab" }, "Result"), h("td", {}, seg([["pass", "Pass"], ["fail", "Fail"]], "", v => { T.result = v; redraw(); })))))));
  if (key === "control") readings.push(sheet("", h("div", { class: "band" }, "OTDR, both directions"), h("table", {}, h("thead", {}, h("tr", {}, h("th", {}, "Core"), h("th", {}, "Worst splice dB"), h("th", {}, "Average dB"), h("th", {}, "Loss end to end dB"))),
    h("tbody", {}, T.cores.map(c => h("tr", {}, h("td", { style: "text-align:center;font-weight:800;width:50px" }, c.core), h("td", {}, num(c.max, v => c.max = v, "0.00")), h("td", {}, num(c.mean, v => c.mean = v, "0.00")), h("td", {}, num(c.loss, v => c.loss = v, "0.00"))))))));
  if (["drum", "post", "control"].includes(key)) readings.push(sheet("", h("div", { class: "band" }, "Worst attenuation on the link"), h("table", {}, h("tbody", {},
    h("tr", {}, h("td", { class: "lab" }, "1310 nm (dB/km)"), h("td", {}, num(T.att1310, v => T.att1310 = v, "0.00"))),
    h("tr", {}, h("td", { class: "lab" }, "1550 nm (dB/km)"), h("td", {}, num(T.att1550, v => T.att1550 = v, "0.00")))))));
  redraw();
  return [topbar(lab, sub, true),
    h("p", { class: "form-sub" }, key === "dit" || key === "witness" ? "Record the result and attach the proof." : `Type the readings from the OTDR and power meter. ${limits}`),
    sheet("", h("table", {}, h("tbody", {},
      h("tr", {}, h("td", { class: "lab" }, "Tested by", h("span", { class: "auto" }, "auto")), h("td", { class: "ro" }, S.user)),
      l.lengthM ? h("tr", {}, h("td", { class: "lab" }, "OTDR pulse width", h("span", { class: "auto" }, "auto")), h("td", { class: "ro" }, key === "drum" ? "30 ns" : `${pulseFor(l.lengthM)} or less (${sp(l.lengthM)} m)`)) : null))),
    ...readings, verdict, failBox,
    sheet("", h("div", { class: "band" }, "OTDR traces and photos"), photoBlock(T.photos)),
    submitBtn(() => { const e = []; if (!T.auto) e.push("Fill in all the readings first."); if (key === "drum" && T.cert !== "Yes") e.push("No drum may be accepted without its factory test certificate."); if (T.auto === "fail" && (!T.where || !T.type)) e.push("Say where the fault is and what it is."); if (!T.photos.length) e.push("Attach the OTDR trace or a photo of the meter."); return e; },
      { label: "Save test result", onDone: () => {
        const open = l.faults.filter(f => f.stage === key && f.status !== "closed"), resp = respFor(l, key, T.where);
        l.steps[key] = { by: S.user, on: ymd(S.date), result: T.auto, att1310: T.att1310, att1550: T.att1550, cores: key === "control" ? T.cores : undefined, photos: T.photos.map(p => ({ ph: p.ph, caption: p.caption })) };
        if (T.auto === "pass") open.forEach(f => f.status = "closed");
        else { open.forEach(f => f.status = "open"); const badCores = key === "control" ? T.cores.filter(c => +c.max > SPEC.splMax || +c.mean > SPEC.splMean) : [{ core: "all" }]; (badCores.length ? badCores : [{ core: "all" }]).forEach(c => l.faults.push({ id: "F-" + rid(), stage: key, core: c.core, where: T.where, type: T.type, reading: c.max ? `${c.max} dB (limit ${SPEC.splMax} dB)` : "-", found: S.user, foundOn: ymd(S.date), resp, status: "open" })); }
        saveLink(l);
        showInfo(T.auto === "pass" ? "Passed" : "Fault logged", T.auto === "pass" ? "Saved to the fibre record and the ITP." : `${resp} gets this as a repair on his phone. ${smName()} is told too.`);
        goBack(); } })];
}
// Installation checklist per turbine, content comes from the setup file
let BIO_CHECK = [];
function vBioCheck() {
  const l = S.link, n = l.wtg.name, pid = S.project.id;
  const B = S.bio[pid][n] || (S.bio[pid][n] = { items: {}, by: {}, ips: "", photos: [] });
  const viewOnly = !canSignWork(S.user);
  const openIssue = id => (S.issues[pid] || []).find(x => x.wtg === n && x.item === id && x.status !== "closed");
  const CK = S.project.checklist || {};
  return [topbar(CK.short || "Checklist", `${n}  |  ${CK.doc || ""}`, true),
    h("p", { class: "form-sub" }, "Pass, Fail or N/A on every point. A fail needs a note and a photo, and goes back to whoever did that section."),
    ...BIO_CHECK.map(([title, items], si) => sheet("", h("div", { class: "band" }, title),
      h("table", {}, h("tbody", {},
        h("tr", {}, h("td", { class: "lab" }, "Done by"), h("td", { colspan: 1 }, viewOnly ? h("div", { class: "ro" }, B.by[si + 1] || "-") : sel(TEAM_OF(), B.by[si + 1], v => B.by[si + 1] = v, "Who did this section"))),
        ...items.flatMap(([id, pt, req]) => {
          const it = B.items[id] || (B.items[id] = {}), iss = openIssue(id);
          const note = h("tr", { class: "hz-extra", hidden: it.v !== "Fail" }, h("td", { colspan: 2 }, inp("text", it.note, v => it.note = v, "What is wrong?")));
          return [h("tr", {}, h("td", { style: "padding:8px;font-size:12.5px" }, h("b", {}, `${id}  ${pt}`), h("div", { style: "color:#5b6470" }, req), iss ? h("div", { style: `font-weight:800;margin-top:3px;color:${iss.status === "retest" ? "#b07d00" : "#c8102e"}` }, iss.status === "retest" ? `Repaired by ${iss.resp}. Recheck it.` : `Repair waiting: ${iss.resp}`) : null),
            h("td", { style: "width:150px" }, viewOnly ? h("div", { class: "ro" }, it.v || "-") : seg([["Yes", "Pass"], ["No", "Fail"], ["N/A", "N/A"]], it.v === "Pass" ? "Yes" : it.v === "Fail" ? "No" : it.v, v => { it.v = v === "Yes" ? "Pass" : v === "No" ? "Fail" : v; note.hidden = it.v !== "Fail"; }))), note];
        }))),
      si === 4 ? h("div", { style: "padding:8px 12px" }, h("div", { style: "font-size:12px;font-weight:800;margin-bottom:4px" }, "Camera IP addresses (5.1)"), viewOnly ? h("div", {}, B.ips || "-") : inp("text", B.ips, v => B.ips = v, "e.g. 10.17.6.21, 10.17.6.22")) : null)),
    viewOnly ? null : sheet("", h("div", { class: "band" }, "Photos (1.4 no-drill photo required)"), photoBlock(B.photos)),
    viewOnly ? null : sheet("", h("div", { class: "band" }, "Sign-off"), h("table", {}, h("tbody", {},
      h("tr", {}, h("td", { class: "lab" }, CK.signA || "Responsible person"), h("td", {}, sigCell(() => B.sigB, v => B.sigB = v, "Responsible person signature"))),
      h("tr", {}, h("td", { class: "lab" }, "Client construction supervisor"), h("td", {}, sigCell(() => B.sigC, v => B.sigC = v, "Client signature")))))),
    viewOnly ? null : submitBtn(() => {
      const e = [], all = BIO_CHECK.flatMap(x => x[1]);
      const fails = all.filter(([id]) => (B.items[id] || {}).v === "Fail");
      if (fails.some(([id]) => !(B.items[id].note || "").trim())) e.push("Say what is wrong on every Fail.");
      if (fails.some(([id]) => !B.by[id.split(".")[0]])) e.push("Choose who did each section with a Fail, so the repair goes to the right man.");
      if ((B.items["1.4"] || {}).v && !B.photos.length) e.push("1.4 needs the no-drill photo.");
      if (fails.length && !B.photos.length) e.push("Add a photo of each fail.");
      if (all.every(([id]) => (B.items[id] || {}).v) && !fails.length && (!B.sigB || !B.sigC)) e.push("Fully passed. Both sign-offs are needed to close the turbine.");
      return e; },
      { label: "Save checklist", onDone: () => {
        BIO_CHECK.flatMap(x => x[1]).forEach(([id, pt]) => { const it = B.items[id] || {}, iss = openIssue(id);
          if (it.v === "Fail" && !iss) S.issues[pid].push({ id: "C-" + rid(), title: `${n} checklist ${id}, ${pt.toLowerCase()}`, detail: it.note || "", found: S.user, foundOn: ymd(S.date), resp: B.by[id.split(".")[0]], status: "open", wtg: n, item: id });
          if (it.v === "Pass" && iss) iss.status = "closed"; });
        persist();
        showInfo("Saved", "Fails are sent as repairs to whoever did that section. The filled checklist lands in the project folder as Word and PDF.");
        goBack(); } })];
}
function repairsBlock(u) {
  const list = myRepairs(u);
  if (!list.length) return null;
  return sheet("", h("div", { class: "band", style: "background:#c8102e" }, `REPAIRS WAITING FOR YOU (${list.length})`),
    ...list.map(f => h("div", { style: "padding:10px 12px;border-top:1px solid var(--line);font-size:13px" },
      h("b", {}, f.title),
      h("div", { style: "color:#5b6470;margin:2px 0 8px" }, `${f.detail} Found by ${f.found} on ${dayLab(f.foundOn)}.`),
      h("button", { class: "btn-w", type: "button", style: "width:100%;padding:11px;border-radius:6px;border:0;font-weight:800", onclick: () => { f.ref.status = "retest"; f.ref.repairAt = new Date().toISOString(); f.ref.repairNote = `Repaired by ${u}, ${dayLab(S.date)}`; persist(); showInfo("Sent for recheck", `${f.found} gets it back to retest or recheck. Log the time you spent under Delays as Rework.`); render(); } }, "Repaired, send for recheck"))));
}

function todayCard() {
  ensureDay(); seedLinks();
  const k = dayKey(), alloc = S.alloc[k];
  if (isMgr(S.user)) {
    const people = [...new Set(alloc.map(a => a.who))];
    const sub = people.filter(p => ["submitted", "approved"].includes((S.sections[k][p] || {}).status)).length;
    return sheet("", h("div", { class: "band" }, "TODAY'S WORK"),
      h("div", { style: "padding:10px 12px;font-size:13.5px" }, alloc.length ? `${alloc.length} tasks given to ${people.length} people. ${sub} of ${people.length} have submitted their diary section.` : "No work allocated for this day yet."),
      S.final[k] ? h("div", { style: "padding:0 12px 10px;color:#1e8e3e;font-weight:800;font-size:13px" }, `Diary signed and final at ${S.final[k]}`) : null,
      isSM(S.user) && !S.final[k] ? h("div", { style: "padding:0 12px 12px" },
        h("button", { class: "btn-w", type: "button", style: "width:100%;padding:12px;border-radius:6px;border:0;font-weight:800", onclick: () => go("allocate") }, alloc.length ? "Change today's work" : "Allocate today's work")) : null);
  }
  const tasks = myTasks(S.user), sec = sectionOf(S.user);
  return sheet("", h("div", { class: "band" }, "MY WORK TODAY"),
    tasks.length ? h("table", {}, h("tbody", {}, tasks.map(t => h("tr", {},
      h("td", { style: "padding:8px;font-weight:700;font-size:13px" }, nice2(t.act), h("div", { style: "font-weight:500;color:#5b6470;font-size:12px" }, t.loc)),
      h("td", { style: "width:92px;text-align:center;font-weight:800;color:#0069aa" }, `${t.target} ${t.unit}`)))))
      : h("div", { style: "padding:10px 12px;font-size:13.5px;color:#5b6470" }, "Nothing allocated to you yet. Check with the site manager."),
    (() => { const sc = schedFor(S.user); if (!sc || !["submitted", "approved"].includes(sec.status)) return null; return hbar("My total on this project", sc.done, sc.plan, { unit: sc.unit, perDay: sc.perDay }); })(),
    myRepairs(S.user).length ? h("div", { class: "err", style: "margin:8px 12px" }, `${myRepairs(S.user).length} repair waiting for you. It is at the top of your diary section.`) : null,
    sec.status === "returned" ? h("div", { class: "err", style: "margin:8px 12px" }, `Sent back by the site manager: ${sec.back}`) : null,
    h("div", { style: "padding:10px 12px 12px;display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:13px;color:#5b6470" },
      h("span", {}, "My diary section"), statusPill(sec.status)));
}

function vAllocate() {
  const k = dayKey(), list = S.alloc[k], acts = projActs();
  const box = h("div");
  const card = (r, i) => {
    const unit = h("span", { style: "font-weight:800;color:#0069aa;padding:0 8px" }, r.unit || "");
    return sheet("", h("div", { class: "band", style: "display:flex;justify-content:space-between;align-items:center" }, h("span", {}, `Task ${i + 1}`),
        h("button", { type: "button", style: "background:none;border:0;color:#fff;font-weight:800;font-size:12px", onclick: () => { list.splice(i, 1); draw(); } }, "Remove")),
      h("table", {}, h("tbody", {},
        r.crit ? h("tr", {}, h("td", { colspan: 2, style: "color:#c8102e;font-weight:800;font-size:12px;padding:6px 10px" }, "CRITICAL, must be finished today")) : null,
        h("tr", {}, h("td", { class: "lab" }, "Person"), h("td", {}, sel(CREW_OF(), r.who, v => r.who = v, "Who"))),
        h("tr", {}, h("td", { class: "lab" }, "Activity"), h("td", {}, sel(acts.map(a => a.act), r.act, v => { r.act = v; r.unit = (acts.find(a => a.act === v) || {}).unit || ""; unit.textContent = r.unit; }, "What"))),
        h("tr", {}, h("td", { class: "lab" }, "Where"), h("td", {}, inp("text", r.loc, v => r.loc = v, S.project.kind === "turbines" ? "e.g. WTG 07" : "e.g. RMU 4"))),
        h("tr", {}, h("td", { class: "lab" }, "Target"), h("td", {}, h("div", { style: "display:flex;align-items:center" }, inp("number", r.target, v => r.target = v, "0"), unit))))));
  };
  const draw = () => box.replaceChildren(...list.map(card), ...(list.length ? [] : [h("p", { class: "note" }, "No tasks yet. Tap Add task.")]));
  draw();
  return [topbar("Allocate work", `${S.project.short}  |  ${dmy(S.date)}`, true),
    h("p", { class: "form-sub" }, list._plan ? "Today's work is already loaded from the programme and every man already sees his tasks. Only change something if the site changed, then tap Send to crew." : "Give each person their tasks for the day. They see them on their phone, and it carries into their diary section."),
    box,
    h("button", { class: "mbtn ghost", style: "margin-bottom:12px", onclick: () => { list.push({}); draw(); } }, "+ Add task"),
    h("p", { class: "hint" }, "Two people on one task each get their own task with their own target."),
    h("button", { class: "submit", type: "button", onclick: () => {
      const bad = list.filter(r => !r.who || !r.act || !r.target);
      if (bad.length) return showInfo("Not finished", "Every task needs a person, an activity and a target.");
      list._plan = false; persist(); showInfo("Sent to the crew", Store.online() ? "Each person now sees their tasks under My work today." : "Saved. It goes to the crew as soon as your phone has signal."); goBack(); } }, "Send to crew")];
}

// Other work: anything he did that was not on his list. Picked from the activity list, so it counts in the totals.
// Other work: anything he did that was not on his list. He writes WHAT and WHERE only, no number.
// The site manager puts in the quantity when he reviews the diary, so nothing is ever counted twice.
function otherBox(sec, locked) {
  sec.other = sec.other || [];
  const acts = projActs(), box = h("div");
  const card = (o, i) => {
    if (locked) return h("div", { class: "other-card" }, h("div", { style: "font-weight:800" }, o.act ? nice2(o.act) : o.what || ""),
      h("div", { style: "font-size:12.5px;color:#5b6470" }, [o.loc, o.what && o.act ? o.what : "", o.qty !== undefined && o.qty !== "" ? `Quantity by site manager: ${o.qty} ${o.unit || ""}` : "Quantity: site manager fills in"].filter(Boolean).join("  |  ")));
    return h("div", { class: "other-card" },
      h("div", { style: "display:flex;justify-content:space-between;align-items:center;margin-bottom:6px" }, h("b", {}, `Other work ${i + 1}`),
        h("button", { type: "button", class: "btn-g", style: "padding:4px 10px;font-size:12px", onclick: () => { sec.other.splice(i, 1); draw(); } }, "Remove")),
      sel(acts.map(a => a.act), o.act, v => { o.act = v; o.unit = (acts.find(a => a.act === v) || {}).unit || ""; }, "What did you do?"),
      h("div", { style: "margin-top:6px" }, inp("text", o.loc, v => o.loc = v, "Where, e.g. Control Room to battery 3")),
      h("div", { style: "margin-top:6px" }, inp("text", o.what, v => o.what = v, "Who worked with you, or more detail (optional)")));
  };
  const draw = () => box.replaceChildren(...sec.other.map(card), ...(sec.other.length ? [] : [h("div", { style: "padding:4px 12px 8px;font-size:13px;color:#5b6470" }, locked ? "None" : "Did work that is not in your list above? Write what and where. No number, the site manager puts that in.")]));
  draw();
  return sheet("", h("div", { class: "band" }, "Other work (not on my list)"), box,
    locked ? null : h("button", { class: "addrow", type: "button", onclick: () => { sec.other.push({}); draw(); } }, "+ Add other work"));
}
// A man may open his own section again and fix it, the same day until the cut-off time, as long as the diary is not signed final.
const editUntil = () => (S.project.editUntil || "23:00").replace(":", "h");
function canReopen(sec) {
  if (!["submitted", "approved"].includes(sec.status) || S.final[dayKey()]) return false;
  const now = new Date(), [hh, mm] = (S.project.editUntil || "23:00").split(":").map(Number);
  return ymd(S.date) === ymd(now) && now.getHours() * 60 + now.getMinutes() < hh * 60 + mm;
}
// "Morne helped you with ...": so the man whose job it is remembers to put the quantity in
function helpReminders() {
  const list = Store.list(`help|${S.project.id}|${ymd(S.date)}|`).map(([, o]) => o).filter(o => o.to === S.user);
  if (!list.length) return null;
  return h("div", { class: "help-note" }, h("b", {}, "Others helped you today. Make sure the quantity is in YOUR diary:"),
    ...list.map(o => h("div", { style: "margin-top:4px" }, `${o.from} helped you with ${nice2(o.act)}${o.loc ? ", " + o.loc : ""}.`)));
}
// Each row remembers which task it belongs to. If the office changes the day's plan after a man started
// typing, his numbers follow their task (or are cleared when the task is gone), never slide onto another task.
function alignRows(sec, tasks) {
  const tk = t => t.act + "|" + t.loc, rows = sec.rows || [];
  const keyed = rows.some(r => r && r.k);
  let changed = false;
  if (keyed) {
    const by = {}; rows.forEach(r => { if (r && r.k) by[r.k] = r; });
    const next = tasks.map(t => by[tk(t)] || {});
    changed = rows.some(r => r && r.k && (r.done !== undefined && r.done !== "") && !tasks.some(t => tk(t) === r.k));
    sec.rows = next;
  } else if (rows.length && rows.length !== tasks.length && rows.some(r => r && r.done !== undefined && r.done !== "")) {
    sec.rows = tasks.map(() => ({})); changed = true;
  }
  tasks.forEach((t, i) => { (sec.rows[i] || (sec.rows[i] = {})).k = tk(t); });
  return changed;
}
function vMySection() {
  const k = dayKey(), tasks = myTasks(S.user), sec = sectionOf(S.user);
  if (!sec.delays) sec.delays = [];
  const locked = sec.status === "submitted" || sec.status === "approved";
  const planMoved = !locked && alignRows(sec, tasks);
  const hrsOpts = []; for (let x = 0.5; x <= 14; x += 0.5) hrsOpts.push(String(x));
  const lostOpts = []; for (let x = 0.5; x <= 10; x += 0.5) lostOpts.push(String(x));
  const schedBox = h("div");
  const drawSched = () => schedBox.replaceChildren(locked ? schedPanel(S.user) : sheet("", h("div", { class: "band" }, "Am I on schedule?"), h("div", { style: "padding:12px;font-size:13px;color:#5b6470;text-align:center" }, "Your progress bars show here once you have signed and submitted your section.")));
  const behind = () => tasks.some((t, i) => { const r = sec.rows[i] || {}; return r.done !== undefined && r.done !== "" && +r.done < +t.target; });
  const delayHint = h("div", { class: "err", hidden: true, style: "margin:0 0 10px" }, "You are behind the target today. Add the reason in Delays below. Pick the cause, and type more in the box if the list does not cover it.");
  const tb = h("div");
  const draw = () => {
    tb.replaceChildren(...tasks.map((t, i) => {
      const r = sec.rows[i] || (sec.rows[i] = {});
      let bl;
      const input = locked ? h("div", { class: "blk-num" }, r.done || "0")
        : h("input", { class: "blk-in", type: "number", inputmode: "numeric", min: "0", value: r.done ?? "", placeholder: "0", "aria-label": `Today, ${nice2(t.act)}`,
            oninput: e => { r.done = e.target.value; bl.update(r.done); delayHint.hidden = !(behind() && !sec.delays.some(d => d.cause)); } });
      bl = blocks(t, input, r.done);
      const holder = bl;
      // splicing: he picks the splice machine, the app shows its serial and calibration
      const eqBox = /SPLICE|DOME JOINT/.test(t.act) ? (() => {
        const box = h("div", { class: "task-eq" });
        const draw = () => { const e = eqById(r.eq), cs = calState(e);
          box.replaceChildren(...[h("div", { class: "task-eq-lab" }, "Splice machine used"),
            locked ? h("div", { style: "font-weight:800" }, e ? `${e.name}, S/N ${e.serial}` : "Not chosen")
              : h("select", { class: "ts-sel", onchange: ev => { r.eq = ev.target.value; draw(); } }, h("option", { value: "" }, "Choose the splice machine"), ...EQUIP().filter(x => x.type === "Splicer").map(x => h("option", { value: x.id, selected: r.eq === x.id }, `${x.name}, S/N ${x.serial}`))),
            e ? h("div", { style: `font-size:12.5px;font-weight:800;margin-top:4px;color:${cs.c}` }, `${e.cert ? "Cert " + e.cert + "  |  " : ""}${cs.t}`) : null].filter(Boolean)); };
        draw(); return box; })() : null;
      // his own note: where exactly, or anything the site manager must know
      const note = locked ? (r.note ? h("div", { class: "task-note-ro" }, `Note: ${r.note}`) : null)
        : h("textarea", { class: "task-note", rows: 2, placeholder: "Note: where exactly, if not as planned, or why. The site manager and client see this.", "aria-label": `Note, ${nice2(t.act)}`, oninput: e => { r.note = e.target.value; } }, r.note || "");
      return h("div", { class: "task-card" + (t.crit ? " crit" : "") },
        t.crit ? h("div", { class: "task-crit" }, "CRITICAL, MUST BE DONE TODAY") : null,
        h("div", { class: "task-name" }, nice2(t.act)),
        h("div", { class: "task-loc" }, `${t.loc}  |  Target today ${t.target} ${t.unit}`),
        eqBox, holder, note);
    }));
    drawSched();
  };
  draw();
  const back = sec.status === "returned" ? h("div", { class: "err" }, `Sent back by the site manager: ${sec.back}`) : null;
  const ro = (v, c) => h("div", { style: "padding:8px;font-size:12.5px" + (c ? ";text-align:center" : "") }, v || "");
  return [topbar("My diary section", `${S.project.short}  |  ${dmy(S.date)}`, true),
    h("p", { class: "form-sub" }, locked ? "Submitted. The site manager reviews it before the diary is signed." : "Fill in what you actually did against each task. Your section joins the project's daily diary."),
    back, repairsBlock(S.user),
    planMoved ? h("div", { class: "err", style: "margin:0 0 10px" }, "Today's plan was changed by the office after you started. Your numbers were cleared so nothing lands on the wrong task. Type what you did again. Work that is not on your list goes under Other work.") : null,
    stdHeader({ project: S.project, date: S.date, user: S.user }, "Daily diary  |  my section"),
    sheet("", h("div", { class: "band" }, "My tasks today"), tb),
    schedBox,
    otherBox(sec, locked),
    delayHint,
    rowsTable("", ["Delays (why you are behind)", "Hrs lost"], sec.delays, r => h("tr", {},
      h("td", {}, locked ? ro(r.cause + (r.what ? `. ${r.what}` : "") + (isInternal(r.cause) && r.react ? `. Must react: ${r.react}` : "")) : (() => {
        const other = inp("text", r.other, v => r.other = v, "Type the reason (it is added to the list)");
        const otherBox = h("div", { hidden: r.cause !== OTHER_FIB, style: "margin-top:4px" }, other);
        const reactSel = sel(reactPeople(S.project), r.react, v => r.react = v, "Who must react?");
        const reactBox = h("div", { hidden: !(isInternal(r.cause) || r.cause === OTHER_FIB), style: "margin-top:4px" }, h("div", { class: "hint", style: "margin:2px 0" }, "Internal delay. Only Fibraco sees it, on the Internal delays board."), reactSel);
        return h("div", {}, sel(delayCauses(S.project), r.cause, v => { r.cause = v; delayHint.hidden = true; const int = isInternal(v) || v === OTHER_FIB; otherBox.hidden = v !== OTHER_FIB; reactBox.hidden = !int;
            if (int && !r.react) { r.react = reactDefault(v, S.project); reactSel.value = r.react; } }, "Choose the cause"),
          otherBox, inp("text", r.what, v => r.what = v, "Short detail, e.g. which WTG, who said what"), reactBox); })()),
      h("td", { style: "width:86px" }, locked ? ro(r.hrs, 1) : sel(lostOpts, r.hrs, v => r.hrs = v, "Hrs"))), locked ? null : "+ Add delay", () => ({})),
    locked ? null : h("p", { class: "hint" }, "Client delays you log here go on the diary the client signs the next morning. That signature is our proof if time or standing time must be claimed."),
    sheet("", h("table", {}, h("tbody", {},
      h("tr", {}, h("td", { class: "lab" }, "Hours worked"), h("td", {}, locked ? h("div", { class: "ro" }, sec.hrs) : sel(hrsOpts, sec.hrs, v => sec.hrs = v, "Hrs")))))),
    locked ? null : sheet("", h("div", { class: "band" }, "Photos"), photoBlock(sec.photos || (sec.photos = []))),
    locked ? null : sheet("", h("table", {}, h("tbody", {}, h("tr", {}, h("td", { class: "lab" }, "My signature"), h("td", {}, sigCell(() => sec.sig, v => sec.sig = v, "Your signature", true)))))),
    locked ? h("div", { style: "text-align:center;margin:10px 0" }, statusPill(sec.status),
      canReopen(sec) ? h("div", { style: "margin-top:12px" },
        h("button", { class: "mbtn", type: "button", onclick: () => askYesNo("Change my section?", `You can change your section until ${editUntil()} today. Then sign and submit it again.${sec.status === "approved" ? " The site manager approves it again after." : ""}`, "Change it", () => { sec.status = "draft"; sec.sig = ""; delete sec.at; persist(); render(); window.scrollTo(0, 0); }) }, "Change my section", h("small", {}, `Open until ${editUntil()} today, then it locks`))) : null) :
      submitBtn(() => { const e = []; if (tasks.some((t, i) => (sec.rows[i] || {}).done === undefined || (sec.rows[i] || {}).done === "")) e.push("Fill in what you did for every task, even if it is 0."); if (tasks.some((t, i) => /SPLICE|DOME JOINT/.test(t.act) && +((sec.rows[i] || {}).done || 0) > 0 && !(sec.rows[i] || {}).eq)) e.push("Choose the splice machine you used."); if (behind() && !sec.delays.some(d => d.cause && d.hrs)) e.push("You are behind the target. Add the delay cause and the hours lost."); if ((sec.other || []).some(o => (o.act || o.loc || o.what) && (!o.act || !o.loc))) e.push("Other work: choose what you did and write where. Remove a line you do not need."); tasks.forEach((t, i) => { const r = sec.rows[i] || {}; if (r.done !== undefined && r.done !== "" && +r.done === 0 && !(r.note || "").trim()) e.push(`${nice2(t.act)} is 0. Write in its note why it was not done.`); });
        if (sec.delays.some(d => d.cause && !(+d.hrs > 0))) e.push("Every delay needs its hours lost.");
        if (sec.delays.some(d => d.cause === OTHER_FIB && !(d.other || "").trim())) e.push("Delay Other: type the reason.");
        if (sec.delays.some(d => (isInternal(d.cause) || d.cause === OTHER_FIB) && !d.react)) e.push("Internal delay: choose who must react.");
        if (!sec.hrs) e.push("Choose your hours worked."); if (!sec.sig) e.push("Sign your section."); return e; },
        { label: "Submit my section", onDone: () => { putProg(S.project.id, ymd(S.date), S.user, tasks, sec.rows, sec.other); postDelays(S.project, S.date, S.user, tasks, sec); sec.status = "submitted"; sec.at = new Date().toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" }).replace(":", "h"); showInfo("Submitted", "Your section is with the site manager for review."); goBack(); } })];
}

function vReview() {
  const k = dayKey(), alloc = S.alloc[k], secs = S.sections[k];
  const people = [...new Set(alloc.map(a => a.who))];
  const rows = alloc.map((t, i) => {
    const sec = secs[t.who] || {}; const idx = alloc.filter((a, j) => a.who === t.who && j < i).length;
    const r = (sec.rows || [])[idx] || {};
    return { t, sec, r };
  });
  const totalHrs = people.reduce((s, p) => s + (+(secs[p] || {}).hrs || 0), 0);
  const final = S.final[k], viewOnly = !isSM(S.user);
  const personBlock = p => {
    const sec = secs[p] || { status: "draft" };
    const mine = rows.filter(x => x.t.who === p);
    return sheet("", h("div", { class: "band activity-head" }, h("span", {}, p), statusPill(sec.status)),
      h("table", {}, h("tbody", {}, mine.map(({ t, r }) => h("tr", {},
        h("td", { style: "padding:8px;font-size:12.5px;font-weight:700" }, nice2(t.act), h("div", { style: "font-weight:500;color:#5b6470" }, t.loc + (r.note ? `. ${r.note}` : ""))),
        h("td", { style: "width:74px;text-align:center;font-size:12.5px" }, "Target", h("div", { style: "font-weight:800" }, `${t.target}`)),
        h("td", { style: "width:84px" }, sec.status === "draft" || final || viewOnly ? h("div", { style: "text-align:center;font-weight:800;padding:8px" }, r.done ?? "-") : inp("number", r.done, v => { r.done = v; r.edited = true; }, "Done")))),
        (sec.other || []).filter(o => o.act || o.what).map(o => h("tr", {}, h("td", { colspan: 2, style: "padding:8px;font-size:12.5px" }, h("b", {}, "Other work: "), o.act ? `${nice2(o.act)}, ${o.loc || "-"}${o.what ? ". " + o.what : ""}` : o.what),
          h("td", { style: "width:84px" }, sec.status === "draft" || final || viewOnly ? h("div", { style: "text-align:center;font-weight:800;padding:8px" }, o.qty !== undefined && o.qty !== "" ? `${o.qty} ${o.unit || ""}` : "-")
            : h("div", {}, inp("number", o.qty, v => { o.qty = v; o.smQty = true; }, "Qty"), h("div", { style: "font-size:10.5px;text-align:center;color:#5b6470" }, o.unit || ""))))),
        h("tr", {}, h("td", { colspan: 3, style: "padding:0" }, (() => { const sc = ["submitted", "approved"].includes(sec.status) && schedFor(p); return sc ? hbar("Total on project to date", sc.done, sc.plan, { unit: sc.unit, perDay: sc.perDay }) : ""; })())),
        h("tr", {}, h("td", { colspan: 3, style: "padding:8px;font-size:12.5px;color:#5b6470" }, `Hours ${sec.hrs || "-"}${delayText(sec) ? "  |  Delay: " + delayText(sec) : ""}${sec.at ? "  |  Submitted " + sec.at : ""}`)))),
      sec.status === "submitted" && !final && !viewOnly ? h("div", { style: "display:flex;gap:8px;padding:10px 12px" },
        h("button", { class: "btn-w", type: "button", style: "flex:1;padding:11px;border-radius:6px;border:0;font-weight:800;background:#1e8e3e", onclick: () => { sec.status = "approved"; render(); } }, "Approve"),
        h("button", { class: "btn-g", type: "button", style: "flex:1;padding:11px;border-radius:6px;font-weight:800", onclick: () => sendBack(p, sec) }, "Send back")) : null);
  };
  const pending = people.filter(p => (secs[p] || {}).status !== "approved");
  const step = (n, label, done, on) => h("div", { style: `flex:1;text-align:center;padding:8px 4px;border-radius:6px;font-size:12px;font-weight:800;${done ? "background:#1e8e3e;color:#fff" : on ? "background:#0069aa;color:#fff" : "background:#e7ebf0;color:#5b6470"}` }, done ? "✓ " : `${n}. `, label);
  const s1 = !pending.length, s2 = !!S.siteDone[k] || !!final;
  const steps = h("div", { style: "display:flex;gap:6px;margin:10px 0 4px" }, step(1, "Check crew", s1, !s1), step(2, "My part", s2, s1 && !s2), step(3, "Sign", !!final, s1 && s2 && !final));
  const totals = sheet("", h("div", { class: "band" }, "Totals for the day"), h("div", { style: "padding:10px 12px;font-size:13.5px;line-height:1.6" },
    h("div", {}, `People on site: ${people.length}`), h("div", {}, `Total hours: ${totalHrs}`),
    h("div", {}, `Tasks on target: ${rows.filter(x => x.r.done !== undefined && x.r.done !== "" && +x.r.done >= +x.t.target).length} of ${rows.length}`)));
  const after = h("div", { class: "stack" },
    final || viewOnly ? h("button", { class: "mbtn", onclick: () => go("client") }, S.client[k] ? "Client signed. View the client copy" : "What the client sees", h("small", {}, S.client[k] ? `Signed by ${S.client[k].name} at ${S.client[k].at}` : "The page the client gets with the diary")) : null,
    final ? h("button", { class: "mbtn", onclick: () => sendDiary(k, S.project, S.date) }, "Send diary", h("small", {}, "Makes the PDF and opens WhatsApp, email and the rest")) : null,
    isPM(S.user) ? h("button", { class: "mbtn", onclick: () => go("kpi") }, "KPIs for the day", h("small", {}, "Only you see this")) : null);
  if (viewOnly) {
    const sub = people.filter(p => ["submitted", "approved"].includes((secs[p] || {}).status)).length;
    return [topbar("Daily diary", `${S.project.short}  |  ${dmy(S.date)}`, true), projectBar(),
      sheet("", h("div", { class: "band" }, "Where the diary is"), h("div", { style: "padding:10px 12px;font-size:13.5px;line-height:1.7" },
        h("div", {}, `Crew sections in: ${sub} of ${people.length}`),
        h("div", {}, `Approved by ${smName()}: ${people.length - pending.length} of ${people.length}`),
        h("div", { style: `font-weight:800;color:${final ? "#1e8e3e" : "#5b6470"}` }, final ? `Signed by ${smName()} at ${final}` : `Waiting for ${smName()} to sign`),
        h("div", { style: "font-size:12px;color:#5b6470;margin-top:4px" }, "You only watch here. The site manager checks and signs the diary."))),
      after, ...people.map(personBlock), totals];
  }
  return [topbar("Review diary", `${S.project.short}  |  ${dmy(S.date)}`, true), steps,
    h("p", { class: "form-sub" }, final ? `Signed and final at ${final}. Changes now need a new revision.` : !s1 ? "Step 1. Check each person's section. Correct a quantity if needed. Approve it, or send it back with a note." : !s2 ? "Step 2. Everyone is approved. Now fill in your part of the diary below." : "Step 3. Sign the diary at the bottom. Then it is final."),
    projectBar(),
    ...people.map(personBlock), totals,
    final ? after : h("div", {},
      h("button", { class: "mbtn", style: `margin-bottom:12px;${s1 ? "" : "opacity:.45"}`, onclick: () => { if (s1) openCombined(); } }, s2 ? "✓ My part of the diary (open again)" : "2. My part of the diary", h("small", {}, "Weather, plant, site instructions and materials. Team and work fill in by themselves.")),
      h("button", { class: "submit", type: "button", style: s1 && s2 ? "" : "opacity:.45", onclick: () => { if (!(s1 && s2)) return;
        const noQty = people.flatMap(pn => (((S.sections[k] || {})[pn] || {}).other || []).filter(o => o.act && (o.qty === undefined || o.qty === "")).map(o => `${pn}: ${nice2(o.act)}, ${o.loc || ""}`));
        if (noQty.length) return showInfo("Quantities missing", "Put the quantity on every Other work line before you sign (0 if two men wrote the same job, so it counts once): " + noQty.join("  |  "));
        mySig(v => { if (!v) return; S.final[k] = new Date().toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" }).replace(":", "h"); S.done[k] = true; persist(); Store.put("final|" + k, { at: S.final[k], by: S.user, sig: v, date: ymd(S.date) }); people.forEach(pn => putProg(S.project.id, ymd(S.date), pn, myTasks(pn), ((S.sections[k] || {})[pn] || {}).rows || [], ((S.sections[k] || {})[pn] || {}).other || [])); Store.lock(["alloc|" + k, "site|" + k, "final|" + k, ...people.map(p => `sec|${k}|${p}`)]); queueReports(S.project, S.date); S.form = { type: "diary", project: S.project, date: S.date, user: S.user, photos: [] }; go("done"); }); } }, "3. Sign and make final"))];
}
// ---------- daily diary as PDF (made on the phone, then shared) ----------
function diaryDoc(k, project, date) {
  const site = Store.get("site|" + k) || {}, fin = Store.get("final|" + k) || {};
  const alloc = S.alloc[k] || [], secs = S.sections[k] || {};
  const people = [...new Set(alloc.map(a => a.who))];
  const esc = x => String(x == null ? "" : x).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const row = (a, b) => `<tr><th>${esc(a)}</th><td>${esc(b) || "-"}</td></tr>`;
  const w = site.w || {};
  const team = (site.team && site.team.some(r => r.name) ? site.team : people.map(p => ({ name: p, hrs: (secs[p] || {}).hrs })) ).filter(r => r.name);
  const acts = (site.acts && site.acts.some(r => r.act) ? site.acts : alloc.map((t, i) => { const idx = alloc.filter((a, j) => a.who === t.who && j < i).length; const r = ((secs[t.who] || {}).rows || [])[idx] || {}; return { area: project.area, act: t.act, unit: t.unit, loc: t.loc + (r.note ? ". " + r.note : ""), qty: r.done }; }).concat(people.flatMap(p => otherList(secs[p]).map(o => ({ area: project.area, act: o.act, unit: o.unit, loc: `${o.loc}${o.what ? ". " + o.what : ""}, not planned`, qty: o.qty }))))).filter(r => r.act);
  // client copy: Fibraco-side delays stay internal
  const delays = (site.delays || []).filter(d => d.c && !(d.int !== undefined ? d.int : isInternal(d.c)));
  const noName = x => String(x || "").replace(/\s*\([A-Z][a-z]+\)\s*$/, ""); // the client copy shows no names against work
  const nz = o => Object.entries(o || {}).filter(([, v]) => +v > 0);
  const tbl = (head, rows) => rows.length ? `<table class="g"><thead><tr>${head.map(x => `<th>${esc(x)}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>` : `<p class="none">None</p>`;
  const totHrs = team.reduce((x, r) => x + (+r.hrs || 0), 0);
  const html = `
  <div class="pd-head"><img src="${LOGO}" alt="Fibraco"><div><h1>DAILY DIARY</h1><div>${esc(project.name)}</div><div>${esc(nice(date))}</div></div></div>
  <table class="kv">${row("Client", project.client)}${row("Diary completed by", fin.by || smName())}${row("Applicable to", site.applicable || project.area)}${row("Time started", site.start)}${row("Time ended", site.end)}${row("Weather", [site.weather, w.tmin || w.tmax ? `${w.tmin || "?"} to ${w.tmax || "?"} °C` : "", w.wdmin || w.wdmax ? `wind ${w.wdmin || "?"} to ${w.wdmax || "?"} m/s` : "", w.rain ? `rain ${w.rain} mm` : ""].filter(Boolean).join(", "))}</table>
  <h2>Project team</h2>${tbl(["No", "Name", "Hrs"], team.map((r, i) => [i + 1, r.name, r.hrs || "-"]).concat(team.length ? [["", "Total hours", totHrs]] : []))}
  ${nz(site.desig).length ? `<h2>Designation</h2>${tbl(["Designation", "Qty"], nz(site.desig))}` : ""}
  ${nz(site.plant).length || nz(site.equip).length ? `<h2>Plant and equipment on site</h2>${tbl(["Item", "Qty"], nz(site.plant).concat(nz(site.equip)))}` : ""}
  <h2>Work done</h2>${tbl(["No", "Work area", "Activity", "Location", "Qty"], acts.map((r, i) => [i + 1, r.area || "", nice2(r.act), noName(r.loc), `${r.qty || 0} ${r.unit || ""}`]))}
  ${site.sched ? `<h2>Schedule</h2><p>${esc(site.sched)}. ${esc(site.schedWhy || "")}</p>` : ""}
  ${(() => { const used = new Set(); people.forEach(p => ((secs[p] || {}).rows || []).forEach(r => r && r.eq && used.add(r.eq))); const rows = [...used].map(eqById).filter(Boolean);
      return rows.length ? `<h2>Equipment used</h2>${tbl(["Make and model", "Serial", "Certificate", "Calibration"], rows.map(e => [e.name, e.serial, e.cert || "-", calState(e).t]))}` : ""; })()}
  <h2>Site instructions</h2><table class="kv">${row("Written", site.written || "None")}${row("Verbal", site.verbal || "None")}</table>
  <h2>Material delivered to site</h2>${tbl(["No", "Material"], (site.mats || []).filter(r => r.m).map((r, i) => [i + 1, r.m]))}
  <h2>Delays</h2>${tbl(["No", "Cause", "Time lost"], delays.map((d, i) => [i + 1, noName(d.c), d.t ? `${d.t} hrs` : ""]))}
  <div class="sigs">
    <div><h3>Fibraco site manager</h3><div class="sigline">${fin.sig ? `<img src="${fin.sig}" alt="Signature">` : ""}</div><div>${esc(fin.by || smName())}</div><div>Signed ${esc(fin.at || "")}</div></div>
    <div><h3>Client representative</h3><div class="sigline"></div><div>Name: ${project.sm ? esc(String(project.sm).split(",")[0]) : "______________________"}</div><div>Date: ______________________</div></div>
  </div>
  <p class="foot">Fibraco (Pty) Ltd. Daily diary from Fibraco Field, made ${esc(new Date().toLocaleString("en-ZA"))}. Photos are kept in the app.</p>`;
  return { html, title: `FIBRACO - Daily Diary - ${project.short} (${dmy(date)})` };
}
// Fallback when the PDF cannot be made on this device: the browser's own print or save as PDF.
function printDiary(k, project, date) {
  const { html, title } = diaryDoc(k, project, date);
  let root = document.getElementById("print-root"); if (!root) { root = h("div", { id: "print-root", class: "pdoc" }); document.body.append(root); }
  root.innerHTML = html;
  const t = document.title; document.title = title;
  const done = () => { document.title = t; root.innerHTML = ""; removeEventListener("afterprint", done); };
  addEventListener("afterprint", done);
  const imgs = [...root.querySelectorAll("img")];
  Promise.all(imgs.map(i => i.complete ? 1 : new Promise(r => { i.onload = i.onerror = r; }))).then(() => setTimeout(() => window.print(), 150));
}
const loadJs = src => new Promise((ok, bad) => { if (document.querySelector(`script[src="${src}"]`)) return ok(); const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = bad; document.head.append(s); });
let sending = false;
async function sendDiary(k, project, date) {
  if (sending) return; sending = true;
  const ov = h("div", { class: "overlay", role: "dialog", "aria-label": "Making the PDF" }, h("div", { class: "modal" }, h("h2", {}, "Making the PDF"), h("p", {}, "One moment. The share menu opens by itself.")));
  document.body.append(ov);
  try {
    await loadJs("./js/lib/html2canvas.min.js?v=1793021006"); await loadJs("./js/lib/jspdf.umd.min.js?v=1793021006"); await loadJs("./js/pdf.js?v=1793021006");
    const { html, title } = diaryDoc(k, project, date);
    const file = await window.FibPdf.diaryPdf(html, title);
    // Phones only open the share menu straight after a tap, so the last step is one tap on Share.
    const m = ov.querySelector(".modal"); m.innerHTML = "";
    m.append(h("h2", {}, "Diary PDF ready"), h("p", {}, file.name),
      h("div", { class: "row" }, h("button", { class: "btn-g", type: "button", onclick: () => ov.remove() }, "Close"),
        h("button", { class: "btn-w", type: "button", onclick: async () => { ov.remove(); const r = await window.FibPdf.shareFile(file, `Fibraco daily diary, ${project.short}, ${nice(date)}`); if (r === "downloaded") showInfo("PDF saved", `${file.name} is in your Downloads. Attach it to an email or WhatsApp to send it.`); } }, "Share")));
  } catch (e) {
    ov.remove();
    showInfo("Could not make the PDF", "This phone could not make the PDF. The print screen opens instead. Choose Save as PDF there, then share it.");
    printDiary(k, project, date);
  } finally { sending = false; }
}
// ---------- daily reports emailed to the client ----------
// When the site manager signs the diary final, the phone queues one job for that day. It makes the signed diary PDF and
// one PDF of all the day's DSTIs, and hands them to the server, which emails them from reports@fibraco.co.za:
// the diary to the client's site manager, the DSTIs to the client's safety officer, a copy of both to the office.
// No signal: the job waits on the phone and goes by itself the moment there is reception.
const MQ_KEY = "fib_mailq";
const mqGet = () => { try { return JSON.parse(localStorage.getItem(MQ_KEY) || "[]"); } catch (e) { return []; } };
const mqSet = q => { try { localStorage.setItem(MQ_KEY, JSON.stringify(q)); } catch (e) {} };
const repTo = (p, kind) => ((p.reports || {})[kind] || []).filter(x => x && /@/.test(x.email || ""));
function queueReports(p, d) {
  const ds = ymd(d), q = mqGet().filter(j => j.flash || !(j.pid === p.id && j.ds === ds));
  q.push({ pid: p.id, ds, by: S.user, at: new Date().toISOString(), tries: 0 }); mqSet(q);
  setTimeout(processMailQ, 1500);
}
function dstiDoc(p, ds) {
  const esc = x => String(x == null ? "" : x).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const list = Store.list(`form|${p.id}|${ds}|dsti|`).map(([, o]) => o).filter(Boolean).sort((a, b) => (a.savedAt || "").localeCompare(b.savedAt || ""));
  if (!list.length) return null;
  const d = new Date(ds + "T12:00:00");
  const one = (f, i) => {
    const hz = Object.entries(f.hz || {}).filter(([, v]) => v && v.r).map(([k, v]) => `<tr><td>${esc(k)}</td><td style="text-align:center;font-weight:700">${esc(v.r)}</td><td>${esc(v.risk)}</td><td>${esc(v.ctrl)}</td></tr>`).join("");
    const ack = (f.ack || []).filter(a => a.name).map(a => `<tr><td>${esc(a.occ)}</td><td>${esc(a.name)}</td><td>${a.sig ? `<img src="${a.sig}" style="height:30px">` : ""}</td></tr>`).join("");
    return `<h2>DSTI ${i + 1} of ${list.length}</h2><table class="kv"><tr><th>Task</th><td>${esc(f.task)}</td></tr><tr><th>Work instructions</th><td>${esc(f.ms)}</td></tr><tr><th>Toolbox talk topic</th><td>${esc(f.tbt)}</td></tr><tr><th>Completed by</th><td>${esc(f.savedBy || f.user)}${f.savedAt ? ", " + esc(new Date(f.savedAt).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })) : ""}</td></tr></table>
    <table class="g"><thead><tr><th>Hazard</th><th>Rating</th><th>Associated risk</th><th>Control measures</th></tr></thead><tbody>${hz || '<tr><td colspan="4">None rated</td></tr>'}</tbody></table>
    <table class="kv"><tr><th>PPE required</th><td>${esc((f.ppe || []).join(", ")) || "-"}</td></tr></table>
    <table class="g"><thead><tr><th>Occupation</th><th>Name</th><th>Signature</th></tr></thead><tbody>${ack}</tbody></table>
    ${(f.wind || []).some(r => r.ms !== undefined && r.ms !== "") ? `<table class="g"><thead><tr><th>Time</th><th>Wind m/s</th><th>Weather</th><th>Work at height</th></tr></thead><tbody>${f.wind.filter(r => r.ms !== undefined && r.ms !== "").map(r => `<tr><td>${esc(r.t)}</td><td style="text-align:center">${esc(r.ms)}</td><td>${esc(r.cond)}</td><td style="font-weight:700">${windStop(r) ? "STOP" : "OK"}</td></tr>`).join("")}</tbody></table>` : ""}
    <table class="kv"><tr><th>CR 9(1) risk assessor</th><td>${esc(f.assessor)}${f.assessor && f.assessor !== (f.savedBy || f.user) ? ` (signed by ${esc(f.savedBy || f.user)})` : ""} ${f.sigA ? `<img src="${f.sigA}" style="height:30px;vertical-align:middle">` : ""}</td></tr></table>`;
  };
  return { html: `<div class="pd-head"><img src="${LOGO}" alt="Fibraco"><div><h1>DAILY SAFETY TASK INSTRUCTIONS</h1><div>${esc(p.name)}</div><div>${esc(nice(d))}</div></div></div>` + list.map(one).join('<div style="height:22px"></div>'),
    title: `FIBRACO - DSTI - ${p.short} (${dmy(d)})`, n: list.length };
}
const fileB64 = f => new Promise((ok, bad) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(",")[1]); r.onerror = bad; r.readAsDataURL(f); });
let mqBusy = false;
async function processMailQ() {
  if (mqBusy || !Store.online() || !S.user) return;
  const q = mqGet(); if (!q.length) return;
  mqBusy = true;
  try {
    await loadJs("./js/lib/html2canvas.min.js?v=1793021006"); await loadJs("./js/lib/jspdf.umd.min.js?v=1793021006"); await loadJs("./js/pdf.js?v=1793021006");
    for (const j of q) {
      const p = CFG.projects.find(x => x.id === j.pid); if (!p) { j.done = true; continue; }
      if (j.flash) { // flash report of an incident or near miss
        const r = incidentsOf(p).find(x => x._id === j.flash); if (!r) { j.done = true; continue; }
        const doc = incidentDoc(p, r), file = await window.FibPdf.diaryPdf(doc.html, doc.title), to = [...repTo(p, "diary"), ...repTo(p, "dsti")], smP = PEOPLE.find(x => x.name === j.by) || {};
        const nm = r.type === "nearmiss" ? "near miss" : "incident";
        try {
          const res = ((await Store.sendReport({ project: p.id, day: r.date, mails: [{ kind: "flash", to: to.map(x => x.email), bcc: CFG.office ? [CFG.office] : [], replyTo: smP.email, subject: `Fibraco flash report, ${nm}, ${p.name}, ${nice(new Date(r.date + "T12:00:00"))}`,
            text: `Good day ${to.length ? to.map(x => x.name.split(" ")[0]).join(" and ") : "team"},\n\nAttached is Fibraco's flash report of a ${nm} on ${p.name} on ${nice(new Date(r.date + "T12:00:00"))}${r.where ? " at " + r.where : ""}. The investigation follows.\n\nReply to this email and it goes to ${j.by.split(" ")[0]}.\n\nRegards\nFibraco site team`,
            files: [{ name: file.name, b64: await fileB64(file) }] }] })) || {}).results || [];
          if (res.length && res.every(x => x.ok)) { j.done = true; Store.put(`flash|${r._id}`, { at: hhmm(new Date()) + " " + dmy(new Date()), by: S.user, to: to.map(x => x.name) }, "r", { tags: [`mgr:${p.id}`] }); }
          else { j.tries++; j.err = (res.find(x => !x.ok) || {}).error || "not sent"; }
        } catch (e) { j.tries++; j.err = e.message; if (e.status === 403) j.done = true; }
        continue;
      }
      const d = new Date(j.ds + "T12:00:00"), k = p.id + "|" + j.ds, fin = Store.get("final|" + k) || {};
      const sm = fin.by || j.by, smP = PEOPLE.find(x => x.name === sm) || {}, office = (CFG.office ? [CFG.office] : []);
      const first = x => (x.name || "").split(" ")[0] || "there";
      const mails = [];
      // the diary maker reads the open project and day, so borrow them for a moment
      const keep = [S.project, S.date]; S.project = p; S.date = d; let dd, sd;
      try { ensureDay(k); dd = diaryDoc(k, p, d); sd = dstiDoc(p, j.ds); } finally { [S.project, S.date] = keep; }
      const dFile = await window.FibPdf.diaryPdf(dd.html, dd.title);
      const dTo = repTo(p, "diary");
      mails.push({ kind: "diary", to: dTo.map(x => x.email), bcc: office, replyTo: smP.email, subject: `Fibraco daily diary, ${p.name}, ${nice(d)}`,
        text: `Good day ${dTo.length ? dTo.map(first).join(" and ") : "team"},\n\nAttached is Fibraco's signed daily diary for ${p.name} for ${nice(d)}. It was signed off on site by ${sm}${fin.at ? " at " + fin.at : ""}.\n\nIf you have any questions, reply to this email and it goes to ${sm.split(" ")[0]}.\n\nRegards\nFibraco site team`,
        files: [{ name: dFile.name, b64: await fileB64(dFile) }] });
      if (sd) { const sFile = await window.FibPdf.diaryPdf(sd.html, sd.title), sTo = repTo(p, "dsti");
        mails.push({ kind: "dsti", to: sTo.map(x => x.email), bcc: office, replyTo: smP.email, subject: `Fibraco DSTIs, ${p.name}, ${nice(d)}`,
          text: `Good day ${sTo.length ? sTo.map(first).join(" and ") : "team"},\n\nAttached ${sd.n === 1 ? "is the DSTI" : `are the ${sd.n} DSTIs`} Fibraco completed on ${p.name} on ${nice(d)}, signed by the crew before work started.\n\nIf you have any questions, reply to this email and it goes to ${sm.split(" ")[0]}.\n\nRegards\nFibraco site team`,
          files: [{ name: sFile.name, b64: await fileB64(sFile) }] }); }
      try {
        const r = await Store.sendReport({ project: p.id, day: j.ds, mails });
        const res = (r && r.results) || [];
        if (res.length && res.every(x => x.ok)) {
          j.done = true;
          Store.put(`mail|${k}`, { at: hhmm(new Date()), by: S.user, diary: dTo.map(x => x.name), dsti: sd ? repTo(p, "dsti").map(x => x.name) : [], nDsti: sd ? sd.n : 0, office: !!office.length }, "r", { tags: [`mgr:${p.id}`] });
        } else { j.tries++; j.err = (res.find(x => !x.ok) || {}).error || "not sent"; }
      } catch (e) { j.tries++; j.err = e.message; if (e.status === 403) j.done = true; }
    }
  } catch (e) { window.__mqErr = String(e && e.message || e); /* PDF tools not loaded yet; try again later */ }
  finally { const jk = x => x.flash || x.pid + "|" + x.ds; mqSet(mqGet().map(x => q.find(y => jk(y) === jk(x)) || x).filter(x => !x.done)); mqBusy = false; if (["done", "review", "menu", "mychecks", "today"].includes(S.view)) render(); }
}
addEventListener("online", () => setTimeout(processMailQ, 2000));
window.FibReports = { queue: (pid, ds) => queueReports(CFG.projects.find(x => x.id === pid), new Date(ds + "T12:00:00")), run: () => processMailQ(), pending: () => mqGet() };
setInterval(processMailQ, 120e3);
// what the site manager sees about it
function reportStatus(p, ds) {
  const m = Store.get(`mail|${p.id}|${ds}`), pend = mqGet().find(j => !j.flash && j.pid === p.id && j.ds === ds);
  if (m) return h("div", { class: "rep-st ok" }, `Emailed to the client at ${m.at}.`, h("small", {}, [m.diary && m.diary.length ? `Diary to ${m.diary.join(", ")}` : "Diary to the office only (no client email set up yet)", m.nDsti ? (m.dsti && m.dsti.length ? `. DSTIs to ${m.dsti.join(", ")}` : ". DSTIs to the office only") : ". No DSTI was done that day", "."].join("")));
  if (pend) return h("div", { class: "rep-st wait" }, Store.online() ? "Sending the diary and DSTIs to the client..." : "Waiting for signal. The diary and DSTIs go to the client by themselves as soon as the phone has reception.", pend.err ? h("small", {}, `Last try: ${pend.err}`) : null);
  return null;
}

function sendBack(p, sec) {
  const t = h("textarea", { id: "backnote", placeholder: "What must he fix?", style: "width:100%;min-height:90px;border-radius:6px;border:1px solid #c9ced6;padding:8px;color:#15191e" });
  const ov = h("div", { class: "overlay", role: "dialog", "aria-label": "Send back" }, h("div", { class: "modal" }, h("h2", {}, `Send back to ${p}`), h("p", {}, "He gets your note on his phone and must resubmit."), t,
    h("div", { class: "row" }, h("button", { class: "btn-g", type: "button", onclick: () => ov.remove() }, "Cancel"), h("button", { class: "btn-w", type: "button", onclick: () => { sec.status = "returned"; sec.back = t.value.trim() || "Please check your quantities."; ov.remove(); render(); } }, "Send back"))));
  document.body.append(ov);
}
function openCombined() {
  // Opens the full Fibraco diary layout with the team and activities already filled from the crew sections.
  const k = dayKey(), alloc = S.alloc[k], secs = S.sections[k];
  startForm("diary");
  const f = S.form;
  const people = [...new Set(alloc.map(a => a.who))];
  f.team = people.map(p => ({ name: p, hrs: (secs[p] || {}).hrs || "" }));
  f.acts = alloc.map((t, i) => { const idx = alloc.filter((a, j) => a.who === t.who && j < i).length; const r = ((secs[t.who] || {}).rows || [])[idx] || {}; return { area: S.project.area || "", act: t.act, unit: t.unit, loc: `${t.loc}${r.note ? ". " + r.note : ""} (${t.who.split(" ")[0]})`, qty: r.done || "" }; }).concat(people.flatMap(p => otherList(secs[p]).map(o => ({ area: S.project.area || "", act: o.act, unit: o.unit, loc: `${o.loc}${o.what ? ". " + o.what : ""}, not planned (${p.split(" ")[0]})`, qty: o.qty }))));
  f.delays = alloc.map(t => t.who).filter((p, i, a) => a.indexOf(p) === i).flatMap(p => ((secs[p] || {}).delays || []).filter(d => d.cause).map(d => ({ c: `${d.cause}${d.what ? ". " + d.what : ""} (${p.split(" ")[0]})`, t: d.hrs, int: isInternal(d.cause) }))); if (!f.delays.length) f.delays = [{}];
  const pt = projectTotals(); if (pt) { f.sched = pt.done === pt.plan ? "On" : pt.done > pt.plan ? "Ahead" : "Behind"; f.schedWhy = `Project ${pt.done}% done against ${pt.plan}% planned for today.` + (f.sched === "Behind" ? " See delays below." : ""); }
  f.combined = true;
  render();
}
function vKpi() {
  const k = dayKey(), alloc = S.alloc[k], secs = S.sections[k];
  const people = [...new Set(alloc.map(a => a.who))];
  const rows = people.map(p => {
    const mine = alloc.map((t, i) => ({ t, i })).filter(x => x.t.who === p);
    let tgt = 0, done = 0;
    mine.forEach((x, n) => { tgt += +x.t.target || 0; done += +(((secs[p] || {}).rows || [])[n] || {}).done || 0; });
    const pct = tgt ? Math.round(done / tgt * 100) : 0;
    return { p, tgt, done, pct, hrs: (secs[p] || {}).hrs || "-", delay: delayText(secs[p] || {}) };
  });
  const bar = pct => h("div", { style: "height:10px;background:#e6e9ed;border-radius:5px;overflow:hidden;margin-top:4px" }, h("div", { style: `height:100%;width:${Math.min(100, pct)}%;background:${barColour(pct).bg};background-image:${STRIPES}` }));
  return [topbar("KPIs", `${S.project.short}  |  ${dmy(S.date)}`, true),
    h("p", { class: "form-sub" }, "Only you see this page. Example from today's diary. Lost time from client and weather delays does not count against a person."),
    projectBar(),
    sheet("", h("div", { class: "band" }, "Each person against the schedule, project to date"), ...[...new Set(alloc.map(a => a.who))].map(p => { const sc = schedFor(p); return sc ? hbar(p, sc.done, sc.plan, { unit: sc.unit, perDay: sc.perDay }) : null; })),
    sheet("", h("div", { class: "band" }, "Output against target"), h("table", {}, h("thead", {}, h("tr", {}, h("th", { class: "l" }, "Person"), h("th", {}, "Done / target"), h("th", {}, "Hrs"))),
      h("tbody", {}, rows.map(r => h("tr", {},
        h("td", { style: "padding:8px;font-weight:700;font-size:13px" }, r.p, bar(r.pct), r.delay ? h("div", { style: "font-weight:500;font-size:11.5px;color:#5b6470;margin-top:3px" }, `Delay logged: ${r.delay}`) : null),
        h("td", { style: "text-align:center;font-weight:800;width:96px" }, `${r.done} / ${r.tgt}`, h("div", { style: "font-size:11.5px;color:#5b6470" }, `${r.pct}%`)),
        h("td", { style: "text-align:center;width:52px" }, r.hrs)))))),
    (() => { seedLinks(); const fs = allFaults(); const by = {}; fs.forEach(f => (by[f.resp] = by[f.resp] || []).push(f)); return sheet("", h("div", { class: "band" }, "Faults traced back from testing and checklists"), Object.keys(by).length ? h("table", {}, h("tbody", {}, Object.entries(by).map(([p, l]) => h("tr", {}, h("td", { style: "padding:8px;font-weight:700;font-size:13px" }, p, h("div", { style: "font-weight:500;font-size:11.5px;color:#5b6470" }, l.map(f => `${f.id} ${f.title} (${f.status === "retest" ? "repaired, recheck" : f.status})`).join("  |  "))), h("td", { style: "width:60px;text-align:center;font-weight:800;color:#c8102e" }, String(l.length)))))) : h("div", { style: "padding:10px 12px" }, "None")); })(),
    h("p", { class: "hint" }, "In the live app this builds up into weekly and monthly KPIs per person: output, rate against the rate you priced, first-time RFI pass rate, and safety (DSTI, inspections, diary on time).")];
}


// ---------- client sign-off (next morning, on the client's own link, no app needed) ----------
function vClient() {
  const k = dayKey(), alloc = S.alloc[k], secs = S.sections[k], signed = S.client[k];
  const people = [...new Set(alloc.map(a => a.who))];
  const work = alloc.map((t, i) => { const idx = alloc.filter((a, j) => a.who === t.who && j < i).length; const r = ((secs[t.who] || {}).rows || [])[idx] || {}; return { act: t.act, loc: t.loc.replace(/\s*\(.*\)$/, ""), unit: t.unit, qty: +r.done || 0 }; });
  const merged = []; work.forEach(w => { const m = merged.find(x => x.act === w.act && x.loc === w.loc); if (m) m.qty = Math.max(m.qty, w.qty); else merged.push({ ...w }); });
  const delays = people.flatMap(p => ((secs[p] || {}).delays || []).filter(d => d.cause && !isInternal(d.cause)));
  const st = { name: "", sig: "", comment: "", ok: "" };
  return [topbar("Client sign-off", `${S.project.short}  |  ${dmy(S.date)}`, true),
    h("p", { class: "form-sub" }, `This is what ${S.project.client}'s site manager sees when he opens his link the next morning. No app, no login, it opens in his phone's browser. He never sees targets, KPIs, names against output or any money.`),
    projCard(S.project),
    sheet("", h("div", { class: "band" }, "FIBRACO  |  DAILY DIARY"), h("table", {}, h("tbody", {},
      h("tr", {}, h("td", { class: "lab" }, "Date"), h("td", { class: "ro" }, nice(S.date))),
      h("tr", {}, h("td", { class: "lab" }, "Fibraco people on site"), h("td", { class: "ro" }, String(people.length))),
      h("tr", {}, h("td", { class: "lab" }, "Signed by Fibraco"), h("td", { class: "ro" }, S.final[k] ? `${smName()} (Site Manager) at ${S.final[k]}` : "Not yet. This is what he will see once it is signed."))))),
    projectBar("Project progress"),
    sheet("", h("div", { class: "band" }, "Work done today"), h("table", {}, h("thead", {}, h("tr", {}, h("th", { class: "l" }, "Activity"), h("th", {}, "Location"), h("th", {}, "Qty"))),
      h("tbody", {}, merged.map(w => h("tr", {}, h("td", { style: "padding:8px;font-size:12.5px;font-weight:700" }, nice2(w.act)), h("td", { style: "padding:8px;font-size:12.5px;text-align:center" }, w.loc), h("td", { style: "text-align:center;font-weight:800;width:64px" }, `${w.qty} ${w.unit}`)))))),
    sheet("", h("div", { class: "band" }, "Delays recorded"), delays.length ? h("table", {}, h("tbody", {}, delays.map(d => h("tr", {}, h("td", { style: "padding:8px;font-size:12.5px" }, h("b", {}, d.cause), d.what ? h("div", { style: "color:#5b6470" }, d.what) : null), h("td", { style: "width:70px;text-align:center;font-weight:800" }, `${d.hrs} hrs`))))) : h("div", { style: "padding:10px 12px;font-size:13px" }, "None")),
    h("div", { class: "files", style: "margin:12px 0" }, h("b", {}, "Client sign-off link"), h("div", { style: "font-size:13px;margin-top:4px" }, "In this first version the client signs the printed diary as before. His own sign-off link comes in a later update.")),
    h("p", { class: "hint", style: "margin-top:18px" }, "Fibraco-side delays (our own material, breakdowns, rework) stay on our internal copy. They still count in the progress bar, so the client copy is honest about where we stand.")];
}

// ---------- info + emergency ----------
function showInfo(title, text) {
  const ov = h("div", { class: "overlay", role: "dialog", "aria-label": title, onclick: e => { if (e.target === ov) ov.remove(); } },
    h("div", { class: "modal" }, h("h2", {}, title), h("p", {}, text), h("div", { class: "row" }, h("button", { class: "btn-w", type: "button", onclick: () => ov.remove() }, "OK"))));
  document.body.append(ov);
}
function openEmergency() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.setAttribute("viewBox", "0 0 100 100");
  const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  c.setAttribute("cx", 50); c.setAttribute("cy", 50); c.setAttribute("r", 46); c.setAttribute("stroke-dasharray", "289"); c.setAttribute("stroke-dashoffset", "289"); svg.append(c);
  const btn = h("button", { class: "hold", type: "button", "aria-label": "Press and hold for 3 seconds to send the emergency alert" }, svg, "HOLD");
  const body = h("div", { class: "em-wrap" },
    h("h2", {}, "EMERGENCY"),
    h("p", {}, "Press and hold the red button for 3 seconds. Let go to cancel. This stops pocket presses."),
    btn,
    h("button", { class: "btn-g", type: "button", style: "padding:12px 22px;border-radius:6px;color:#fff", onclick: () => ov.remove() }, "Cancel"));
  const ov = h("div", { class: "overlay", role: "dialog", "aria-label": "Emergency" }, body);
  document.body.append(ov);
  let t0 = 0, raf = 0, sentDone = false;
  const tick = () => { const p = Math.min(1, (performance.now() - t0) / 3000); c.setAttribute("stroke-dashoffset", String(289 * (1 - p))); if (p >= 1) return sent(); raf = requestAnimationFrame(tick); };
  const startHold = e => { e.preventDefault(); if (sentDone) return; t0 = performance.now(); btn.setPointerCapture && e.pointerId != null && btn.setPointerCapture(e.pointerId); raf = requestAnimationFrame(tick); };
  const stopHold = () => { if (sentDone) return; cancelAnimationFrame(raf); c.setAttribute("stroke-dashoffset", "289"); };
  btn.addEventListener("pointerdown", startHold); ["pointerup", "pointercancel", "pointerleave"].forEach(t => btn.addEventListener(t, stopHold));
  btn.addEventListener("keydown", e => { if ((e.key === " " || e.key === "Enter") && !t0) startHold(e); });
  btn.addEventListener("keyup", () => { stopHold(); t0 = 0; });
  function sent() {
    sentDone = true;
    const who = S.user || "Crew member", proj = S.project ? S.project.name : "No project selected";
    const sm = S.project ? smName() : null, smP = PEOPLE.find(x => x.name === sm) || {}, pm = PEOPLE.find(x => x.admin) || {};
    const gps = h("div", {}, h("b", {}, "GPS  "), "getting position...");
    const alert = { id: "alert|" + Date.now().toString(36) + rid(), who, project: S.project ? S.project.id : "", at: new Date().toISOString(), gps: null };
    const waText = g => `EMERGENCY from ${who} on ${proj}. ${g ? `Location: https://maps.google.com/?q=${g}` : "Location not available."} Sent from the Fibraco app.`;
    const intl = n => (n || "").replace(/\D/g, "").replace(/^0/, "27");
    const links = h("div", { class: "stack", style: "width:100%;max-width:340px" });
    // First call goes to the office (always reachable), then the site manager, then the emergency numbers.
    // a person can have his own first contact (Wanro: Francois); the office is skipped when the office is the one in trouble
    const meP = PEOPLE.find(x => x.name === who) || {}, ec = meP.emergency, ecP = ec ? PEOPLE.find(x => x.name === ec.name) || {} : {};
    const drawLinks = g => links.replaceChildren(...(ec ? [
      h("a", { class: "mbtn emergency", style: "text-decoration:none", href: `https://wa.me/${intl(ec.phone)}?text=${encodeURIComponent(waText(g))}` }, `WhatsApp ${ec.name}`, h("small", {}, "Sends him your location")),
      h("a", { class: "mbtn", style: "text-decoration:none", href: `tel:${ec.phone.replace(/\s/g, "")}` }, `Call ${ec.name}`, h("small", {}, ec.phone)),
      ecP.phone && ecP.phone !== ec.phone ? h("a", { class: "mbtn", style: "text-decoration:none", href: `tel:${ecP.phone.replace(/\s/g, "")}` }, `Call ${ec.name.split(" ")[0]} on his other number`, h("small", {}, ecP.phone)) : null,
      h("a", { class: "mbtn", style: "text-decoration:none", href: "tel:112" }, "Call 112", h("small", {}, "Cellphone emergency")),
      h("a", { class: "mbtn", style: "text-decoration:none", href: "tel:10177" }, "Call 10177", h("small", {}, "Ambulance"))] : [
      pm.phone ? h("a", { class: "mbtn emergency", style: "text-decoration:none", href: `https://wa.me/${intl(pm.phone)}?text=${encodeURIComponent(waText(g))}` }, `WhatsApp ${pm.name}`, h("small", {}, "Sends your location to the office")) : null,
      pm.phone ? h("a", { class: "mbtn", style: "text-decoration:none", href: `tel:${pm.phone.replace(/\s/g, "")}` }, `Call ${pm.name}`, h("small", {}, pm.phone)) : null,
      smP.phone && smP.name !== pm.name && smP.name !== who ? h("a", { class: "mbtn", style: "text-decoration:none", href: `tel:${smP.phone.replace(/\s/g, "")}` }, `Call ${sm}`, h("small", {}, "Site manager")) : null,
      h("a", { class: "mbtn", style: "text-decoration:none", href: "tel:112" }, "Call 112", h("small", {}, "Cellphone emergency")),
      h("a", { class: "mbtn", style: "text-decoration:none", href: "tel:10177" }, "Call 10177", h("small", {}, "Ambulance"))]).filter(Boolean));
    body.replaceChildren(h("h2", {}, "EMERGENCY"),
      h("p", {}, ec ? `Now WhatsApp or call ${ec.name} for help.` : "The office has been alerted. Now call or WhatsApp for help."),
      h("div", { class: "sent" }, h("div", {}, h("b", {}, "From  "), who), h("div", {}, h("b", {}, "Project  "), proj), gps),
      links,
      S.project && S.project.emergency ? h("details", { class: "em-list" }, h("summary", {}, `${S.project.short} emergency numbers`),
        S.project.location ? h("p", {}, S.project.location) : null,
        ...S.project.emergency.map(([n, ...nums]) => h("div", { class: "em-row" }, h("span", {}, n), h("span", {}, ...nums.map(x => h("a", { href: "tel:" + x.replace(/\s/g, "") }, x)))))) : null,
      h("button", { class: "btn-w", type: "button", style: "padding:13px 26px;border-radius:6px;border:0;font-weight:800;background:#fff;color:#15191e", onclick: () => ov.remove() }, "Close"));
    drawLinks(null);
    Store.put(alert.id, alert);
    if (navigator.geolocation) navigator.geolocation.getCurrentPosition(
      p => { const g = `${p.coords.latitude.toFixed(6)},${p.coords.longitude.toFixed(6)}`; gps.replaceChildren(h("b", {}, "GPS  "), g.replace(",", ", ")); alert.gps = g; Store.put(alert.id, alert); drawLinks(g); },
      () => gps.replaceChildren(h("b", {}, "GPS  "), "Location is switched off on this phone"), { timeout: 8000, enableHighAccuracy: true });
  }
}

// ---------- internal delays board (Fibraco only, per project) ----------
// When a man submits his section, each internal delay becomes a row on the board that every Fibraco man on the
// project sees. It stays open until the person who must react taps Sorted.
function postDelays(p, date, who, tasks, sec) {
  const d = ymd(date), pre = `idel|${p.id}|${d}|${who}|`;
  const crit = tasks.some((t, i) => t.crit && +(((sec.rows || [])[i] || {}).done || 0) < +t.target);
  const keep = new Set();
  (sec.delays || []).forEach((x, i) => {
    if (x.cause === OTHER_FIB && (x.other || "").trim()) {
      const text = `${x.other.trim().replace(/\s*\(Fibraco\)\s*$/i, "")} (Fibraco)`; x.cause = text; delete x.other;
      Store.put(`dcause|${p.id}|${text.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60)}`, { text, by: who, at: new Date().toISOString() });
    }
    if (!isInternal(x.cause)) return;
    const id = pre + i, old = Store.get(id) || {}; keep.add(id);
    Store.put(id, Object.assign({}, old, { pid: p.id, date: d, by: who, cause: x.cause, what: x.what || "", hrs: +x.hrs || 0, react: x.react || smName(p) || "", crit,
      status: old.status && old.status !== "withdrawn" ? old.status : "open", at: old.at || new Date().toISOString() }));
  });
  Store.list(pre).forEach(([id, o]) => { if (!keep.has(id) && o.status !== "withdrawn") Store.put(id, Object.assign({}, o, { status: "withdrawn" })); });
}
const DLV = [["#f5d000", "#15191e", "YELLOW"], ["#c9a227", "#15191e", "MUSTARD"], ["#f07c00", "#fff", "ORANGE"], ["#d0021b", "#fff", "RED"]];
function delayDays(o) { const end = o.status === "sorted" && o.sortedAt ? new Date(o.sortedAt) : new Date(); return Math.max(0, Math.floor((end - new Date(o.date + "T12:00:00")) / 864e5)); }
function delayLevel(o) {
  const hrs = +o.hrs || 0; let s = hrs < 1 ? 0 : hrs <= 4 ? 1 : 2;
  if (o.crit) s += 1;
  const days = delayDays(o); if (days >= 1) s += Math.min(2, days);
  return Math.min(3, s);
}
function myDelays() {
  const ids = new Set(PROJECTS.map(p => p.id));
  return Store.list("idel|").map(([id, o]) => Object.assign({ id }, o)).filter(o => o && ids.has(o.pid) && o.status !== "withdrawn");
}
function delaysButton() {
  const open = myDelays().filter(o => o.status !== "sorted"), top = open.reduce((m, o) => Math.max(m, delayLevel(o)), -1);
  return h("button", { class: "mbtn idel-btn", onclick: () => go("delays") },
    h("span", { class: "idel-btn-t" }, "INTERNAL DELAYS", h("small", {}, open.length ? `${open.length} open on your project${PROJECTS.length > 1 ? "s" : ""}. Fibraco only` : "None open. Fibraco only, the client never sees this")),
    h("span", { class: "idel-chip", style: top >= 0 ? `background:${DLV[top][0]};color:${DLV[top][1]}` : "background:#1e8e3e;color:#fff" }, String(open.length)));
}
function canSort(o) { const p = PROJECTS.find(x => x.id === o.pid); return isAdmin(S.user) || o.react === S.user || (p && smName(p) === S.user) || (o.react === "Office (Wanro)" && isAdmin(S.user)); }
function delayOpen(o) {
  const p = PROJECTS.find(x => x.id === o.pid) || {}, lv = delayLevel(o), days = delayDays(o);
  const note = h("textarea", { placeholder: "What was done to sort it?", style: "width:100%;min-height:70px;border-radius:6px;border:1px solid #c9ced6;padding:8px;color:#15191e" });
  const row = (a, b) => h("tr", {}, h("td", { class: "lab" }, a), h("td", { class: "ro" }, b || "-"));
  const ov = h("div", { class: "overlay", role: "dialog", "aria-label": "Internal delay" }, h("div", { class: "modal", style: "max-height:88vh;overflow:auto" },
    h("h2", {}, "Internal delay"),
    h("div", { class: "idel-lv", style: `background:${DLV[lv][0]};color:${DLV[lv][1]}` }, o.status === "sorted" ? `SORTED  |  was ${DLV[lv][2]}` : DLV[lv][2]),
    h("table", { class: "kvt" }, h("tbody", {},
      row("Project", p.name || o.pid), row("Date", dmy(new Date(o.date + "T12:00:00"))), row("What happened", o.cause.replace(/\s*\(Fibraco\)$/, "") + (o.what ? `. ${o.what}` : "")),
      row("Raised by", o.by), row("Must react", o.react), row("Hours lost", `${o.hrs || 0}`), row("Critical task hit", o.crit ? "Yes" : "No"),
      row(o.status === "sorted" ? "Took" : "Open for", `${days} day${days === 1 ? "" : "s"}`),
      o.status === "sorted" ? row("Sorted by", `${o.sortedBy || ""}${o.sortedNote ? ". " + o.sortedNote : ""}`) : null)),
    o.status !== "sorted" && canSort(o) ? h("div", {}, h("p", { class: "hint" }, "Only tap Sorted when it is really fixed. Everyone on the project sees it."), note) : null,
    h("div", { class: "row" }, h("button", { class: "btn-g", type: "button", onclick: () => ov.remove() }, "Close"),
      o.status !== "sorted" && canSort(o) ? h("button", { class: "btn-w", type: "button", onclick: () => {
        if (!note.value.trim()) { note.style.borderColor = "#d0021b"; note.placeholder = "Write what was done first"; return; }
        const cur = Store.get(o.id) || o; Store.put(o.id, Object.assign({}, cur, { status: "sorted", sortedBy: S.user, sortedAt: new Date().toISOString(), sortedNote: note.value.trim() })); ov.remove(); render(); toast("Marked sorted"); } }, "Sorted") : null)));
  document.body.append(ov);
}
function vDelays() {
  const all = myDelays(), cut = Date.now() - 14 * 864e5;
  const open = all.filter(o => o.status !== "sorted").sort((a, b) => delayLevel(b) - delayLevel(a) || (a.date < b.date ? -1 : 1));
  const done = all.filter(o => o.status === "sorted" && new Date(o.sortedAt || o.date).getTime() > cut).sort((a, b) => (a.sortedAt < b.sortedAt ? 1 : -1));
  const line = o => { const lv = delayLevel(o), p = PROJECTS.find(x => x.id === o.pid) || {};
    return h("button", { class: "idel-row" + (o.status === "sorted" ? " sorted" : ""), type: "button", onclick: () => delayOpen(o) },
      h("div", { class: "idel-txt" },
        h("div", { class: "idel-top" }, `${(p.short || o.pid).toUpperCase()}  |  ${dmy(new Date(o.date + "T12:00:00"))}`),
        h("div", { class: "idel-what" }, o.cause.replace(/\s*\(Fibraco\)$/, "") + (o.what ? `. ${o.what}` : "")),
        h("div", { class: "idel-who" }, `Raised by ${o.by}  |  Must react: ${o.react || "-"}  |  ${o.hrs || 0} h lost`)),
      h("div", { class: "idel-blk", style: o.status === "sorted" ? "background:#1e8e3e;color:#fff" : `background:${DLV[lv][0]};color:${DLV[lv][1]}` }, o.status === "sorted" ? "SORTED" : DLV[lv][2])); };
  return [topbar("Internal delays", "Fibraco only. The client never sees this", true),
    h("p", { class: "form-sub" }, "Every delay we caused ourselves, on your project. It stays here, getting more urgent, until the person who must react sorts it."),
    h("div", { class: "idel-key" }, ...DLV.map(([bg, fg, n]) => h("span", { style: `background:${bg};color:${fg}` }, n))),
    open.length ? h("div", { class: "idel-list" }, ...open.map(line)) : h("p", { class: "note" }, "No open internal delays. Keep it that way."),
    done.length ? h("h2", { class: "idel-h" }, "Sorted in the last 14 days") : null,
    done.length ? h("div", { class: "idel-list" }, ...done.map(line)) : null,
    h("p", { class: "hint", style: "margin-top:14px" }, "How the colour climbs, one step each: 1 to 4 hours lost (more than 4 hours is two steps), a critical task missed that day, and every day it stays open. No steps is yellow, then mustard, orange and red.")];
}

// ---------- render ----------
let render = function () {
  const v = S.view;
  const views = { users: vUsers, projects: vProjects, calendar: vCalendar, menu: vMenu, inspections: vInspections, client: vClient, tests: vTests, link: vLink, logtest: vLogTest, biocheck: vBioCheck, allocate: vAllocate, mysection: vMySection, review: vReview, kpi: vKpi, rams: vRams, ramsdoc: vRamsDoc, drawings: vDrawings, drawing: vDrawing, diary: vDiary, dsti: vDsti, inspection: vInspection, check: vCheck, toolbox: vToolbox, incident: vIncident, si: vSI, order: vOrder, done: vDone, feedback: vFeedback, devices: vDevices, dash: vDash, qc: vQc, qcspot: vQcSpot, tsheets: vTsheets, tsheet: vTsheet, treport: vTreport, attendance: vAttendance, claude: vClaude, delays: vDelays, nearmiss: vNearMiss, jobobs: vJobObs, adhoc: vAdhoc, adhocjob: vAdhocJob, mychecks: vMyChecks, invest: vInvest, today: vToday };
  app.replaceChildren(...[].concat((views[v] || vProjects)()).filter(Boolean));
  pageForm();
}
// ---------- page-by-page forms (tile layout): what fits on the screen, green NEXT and yellow BACK at the bottom ----------
const PAGED_VIEWS = ["nearmiss", "jobobs", "incident", "invest", "si", "order", "dsti", "inspection", "toolbox", "check", "adhocjob"];
let PG = { key: null, i: 0 };
function pageForm(step) {
  document.querySelectorAll(".pnav").forEach(x => x.remove()); document.body.classList.remove("paged");
  if (!TILES() || !PAGED_VIEWS.includes(S.view)) return;
  const key = S.view === "adhocjob" ? S.adj : S.form;
  if (PG.key !== key) PG = { key, i: 0 };
  const kids = [...app.children].filter(k => !k.classList.contains("fb-btn")), head = kids[0] && kids[0].classList.contains("bar") ? kids.shift() : null;
  kids.forEach(k => k.hidden = false);
  // the form's own Submit moves into the green button on the last page; its error list stays on the page
  const sub = kids.length && (kids[kids.length - 1].matches("button.submit") || kids[kids.length - 1].querySelector(":scope > button.submit")) ? kids.pop() : null;
  const subBtn = sub && (sub.matches("button.submit") ? sub : sub.querySelector(":scope > button.submit"));
  if (sub) sub.classList.add("psub");
  document.body.classList.add("paged");
  const nav = h("div", { class: "pnav" }); document.body.append(nav);
  const avail = innerHeight - (head ? head.getBoundingClientRect().height + 18 : 0) - 96;
  const pages = [[]]; let used = 0;
  kids.forEach((k, n) => { const r = k.getBoundingClientRect(), cs = getComputedStyle(k), hh = r.height + parseFloat(cs.marginTop || 0) + parseFloat(cs.marginBottom || 0) + 12;
    if (pages[pages.length - 1].length && used + hh > avail) { pages.push([]); used = 0; }
    pages[pages.length - 1].push(k); used += hh; });
  if (step) PG.i += step;
  PG.i = Math.max(0, Math.min(PG.i, pages.length - 1));
  pages.forEach((pg, n) => pg.forEach(k => k.hidden = n !== PG.i));
  const last = PG.i === pages.length - 1;
  if (sub) sub.hidden = !last;
  nav.append(
    PG.i ? h("button", { type: "button", class: "pback", onclick: () => { pageForm(-1); window.scrollTo(0, 0); } }, "‹  BACK") : h("span", { class: "pfill" }),
    h("span", { class: "pcount" }, `Page ${PG.i + 1} of ${pages.length}`),
    last ? (subBtn ? h("button", { type: "button", class: "pnext", onclick: () => subBtn.click() }, (subBtn.textContent || "Submit").toUpperCase()) : h("span", { class: "pfill" }))
      : h("button", { type: "button", class: "pnext", onclick: () => { pageForm(1); window.scrollTo(0, 0); } }, "NEXT  ›"));
}
addEventListener("resize", () => { if (document.body.classList.contains("paged")) pageForm(); });

// ---------- live layer: identity, PIN, saving, sync, feedback ----------
const CONF = { url: "https://ahbcixfknqgqvmauhnyo.supabase.co", anon: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoYmNpeGZrbnFncXZtYXVobnlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxNzI0NDMsImV4cCI6MjEwNzc0ODQ0M30.n58qy_PcGFoi9-JGzUecra9ggxUn_Yprsg9kO_2M02c" };
const PHOTO_CACHE = new Map();
const lastSaved = new Map();
const strip = (k, v) => k === "url" ? undefined : (k === "project" && v && typeof v === "object") ? v.id : v;
const J = o => JSON.stringify(o, strip);
function syncPill() {
  const n = Store.pending(), on = Store.online();
  const [t, c] = !on ? [n ? `OFFLINE  ${n}` : "OFFLINE", "#8a8f98"] : n ? [`SENDING ${n}`, "#f29900"] : ["SAVED", "#1e8e3e"];
  return h("span", { class: "pill", style: `background:${c};color:#fff;border-color:${c}`, title: on ? "Connected" : "No signal. Everything is kept on the phone and sent later." }, t);
}
function encImg(path, attrs) {
  const img = h("img", attrs);
  if (path) Store.fileURL(path).then(u => { img.src = u; }).catch(() => { img.alt = "Drawing not available offline yet"; });
  return img;
}
function photoImg(p, attrs) {
  const img = h("img", Object.assign({ style: "background:#e6e9ed;min-height:80px" }, attrs));
  const src = p.url && p.url.startsWith("data:") ? p.url : PHOTO_CACHE.get(p.ph);
  if (src) img.src = src;
  else if (p.ph) Store.photo(p.ph).then(d => { if (d) { PHOTO_CACHE.set(p.ph, d); img.src = d; } else img.alt = "Photo loads when there is signal"; });
  return img;
}
function shrinkPhoto(file) {
  return new Promise((res, rej) => {
    const u = URL.createObjectURL(file), im = new Image();
    im.onload = () => {
      const max = 1280, r = Math.min(1, max / Math.max(im.width, im.height));
      const c = document.createElement("canvas"); c.width = Math.round(im.width * r); c.height = Math.round(im.height * r);
      const x = c.getContext("2d"); x.drawImage(im, 0, 0, c.width, c.height);
      // stamp who, when and which project on the photo itself
      const stamp = `${S.user || ""}  |  ${S.project ? S.project.short : ""}  |  ${new Date().toLocaleString("en-ZA")}`;
      x.font = `${Math.max(14, Math.round(c.width / 45))}px sans-serif`; const th = Math.max(22, Math.round(c.width / 30));
      x.fillStyle = "rgba(0,0,0,.55)"; x.fillRect(0, c.height - th, c.width, th); x.fillStyle = "#fff"; x.fillText(stamp, 8, c.height - th / 3);
      URL.revokeObjectURL(u); res(c.toDataURL("image/jpeg", 0.62));
    };
    im.onerror = () => { URL.revokeObjectURL(u); rej(new Error("not an image")); };
    im.src = u;
  });
}
function formRecord(f) { return JSON.parse(J(Object.assign({}, f, { date: ymd(f.date), project: f.project ? f.project.id : null, savedBy: S.user, savedAt: new Date().toISOString() }))); }
function saveForm(f) {
  clearDraft(); S.formDirty = false;
  const id = `form|${f.project ? f.project.id : "none"}|${ymd(f.date)}|${f.type}|${Date.now().toString(36)}${rid()}`;
  Store.put(id, formRecord(f));
}
// Everything the crew changes on the day screens is saved by comparing with what was last saved.
function snapshot() {
  const out = [];
  // Each phone only saves what its owner may change: the site manager the allocation, each man his own section.
  const pOf = k => PROJECTS.find(p => p.id === k.split("|")[0]);
  for (const k in S.alloc) { const r = roleIn(S.user, pOf(k)); if (["sm", "pm"].includes(r) && !S.alloc[k]._plan && (S.alloc[k].length || lastSaved.has("alloc|" + k))) out.push(["alloc|" + k, S.alloc[k]]); }
  for (const k in S.sections) { const r = roleIn(S.user, pOf(k)); for (const who in S.sections[k]) if (who === S.user || r === "sm") out.push([`sec|${k}|${who}`, S.sections[k][who]]); }
  for (const pid in S.links) for (const l of S.links[pid]) {
    if (!Object.keys(l.steps || {}).length && !(l.faults || []).length && !l.custom) continue;
    out.push([`link|${pid}|${l.id}`, { steps: l.steps, faults: l.faults, meta: l.custom ? { id: l.id, name: l.name, tpl: l.tpl, cores: l.cores, lengthM: l.lengthM, custom: true } : undefined }]);
  }
  for (const pid in S.issues) for (const x of S.issues[pid]) out.push([`issue|${pid}|${x.id}`, x]);
  for (const pid in S.bio) for (const w in S.bio[pid]) out.push([`bio|${pid}|${w}`, S.bio[pid][w]]);
  return out;
}
function persist() {
  if (!Store.me() || !Store.me().write) return;
  for (const [id, obj] of snapshot()) {
    const j = J(obj);
    if (lastSaved.get(id) === j) continue;
    lastSaved.set(id, j);
    Store.put(id, JSON.parse(j));
  }
}
let persistT = 0;
function persistSoon() { clearTimeout(persistT); persistT = setTimeout(persist, 700); }
const saveLink = () => persist();
["input", "change", "click"].forEach(t => document.addEventListener(t, persistSoon, true));
// Changes from other phones
const SAFE_VIEWS = ["projects", "calendar", "menu", "adhoc", "mychecks", "today", "review", "kpi", "tests", "link", "client", "drawings", "rams"];
function hydrate(ids) {
  let touched = false;
  for (const id of ids) {
    const o = Store.get(id); if (o === undefined) continue;
    lastSaved.set(id, J(o));
    const parts = id.split("|"), kind = parts[0];
    if (kind === "alloc") { const k = parts[1] + "|" + parts[2]; if (S.alloc[k]) S.alloc[k] = o; }
    else if (kind === "sec") { const k = parts[1] + "|" + parts[2]; if (S.sections[k]) S.sections[k][parts.slice(3).join("|")] = o; if (["submitted", "approved"].includes(o.status)) S.done[k] = true; }
    else if (kind === "final") { const k = parts[1] + "|" + parts[2]; S.final[k] = o.at; S.done[k] = true; }
    else if (kind === "site") S.siteDone[parts[1] + "|" + parts[2]] = true;
    else if (kind === "form") S.done[parts[1] + "|" + parts[2]] = true;
    else if (kind === "link") { const pid = parts[1], L = S.links[pid]; if (L) { const l = L.find(x => x.id === parts.slice(2).join("|")); if (l) { l.steps = o.steps || {}; l.faults = o.faults || []; } else if (o.meta) L.push(Object.assign({ steps: o.steps || {}, faults: o.faults || [] }, o.meta)); } }
    else if (kind === "issue") { const L = S.issues[parts[1]]; if (L) { const i = L.findIndex(x => x.id === o.id); if (i >= 0) L[i] = o; else L.push(o); } }
    else if (kind === "bio") { const B = S.bio[parts[1]]; if (B) B[parts.slice(2).join("|")] = o; }
    touched = true;
  }
  if (touched && (SAFE_VIEWS.includes(S.view) || (S.view === "mysection" && ids.some(i => i.startsWith("sec|") && i.endsWith("|" + S.user))))) render();
}
// Need-to-know: every record says who may receive it. The tags are scrambled before they leave the phone.
// A man's section and forms go to him and his site manager. Allocations, tests, faults and checklists go to the project crew.
Store.metaFor = (id, obj) => {
  const x = id.split("|"), kind = x[0], pid = x[1], me = (Store.me() || {}).member;
  const idOf = name => (PEOPLE.find(p => p.name === name) || {}).id;
  if (kind === "sig") return { tags: [`user:${pid}`] };
  if (kind === "alloc" || kind === "prog") return { tags: [`proj:${pid}`] };
  if (kind === "sec") return { tags: [`user:${idOf(x.slice(3).join("|")) || me}`, `mgr:${pid}`] };
  if (kind === "help") return { tags: [`proj:${pid}`] };
  if (kind === "att") return { tags: [`user:${idOf(x.slice(3).join("|")) || me}`, `mgr:${pid}`] };
  if (kind === "final" || kind === "site" || kind === "qc") return { tags: [`mgr:${pid}`] };
  if (kind === "link" || kind === "issue" || kind === "bio" || kind === "idel" || kind === "dcause") return { shared: true, tags: [`proj:${pid}`] };
  if (kind === "form") return { tags: pid && pid !== "none" ? [`user:${me}`, `mgr:${pid}`] : [`user:${me}`] };
  if (kind === "alert") return { tags: obj && obj.project ? [`user:${me}`, `mgr:${obj.project}`] : [`user:${me}`] };
  if (kind === "ph") return { tags: S.project ? [`user:${me}`, `proj:${S.project.id}`] : [`user:${me}`] };
  return { tags: [`user:${me}`] };
};
let deniedAt = 0, refusedAt = 0;
Store.on((ids, state) => {
  if (state === "denied" && CFG && Date.now() - deniedAt > 60e3) { deniedAt = Date.now(); Store.whoami().then(me => { if (me.status !== "active") location.reload(); }).catch(e => { if (e.status) location.reload(); }); }
  if (state === "refused" && Date.now() - refusedAt > 30e3) { refusedAt = Date.now(); showInfo("Not saved", "That diary is already signed and locked, or it is not yours to change. The app has put back the signed version."); }
  if (ids.length) hydrate(ids);
  if (CFG && ids.includes(sigId()) && !savedSig() && S.view !== "signature") setupSignature(() => render()); const p = document.querySelector(".bar .pill"); if (p) p.replaceWith(syncPill()); });

// "Something wrong?" on every screen
function feedbackButton() {
  return h("button", { type: "button", class: "fb-btn", onclick: () => {
    const t = h("textarea", { placeholder: "What was wrong or difficult? Say what you tapped and what you expected.", style: "width:100%;min-height:120px;border-radius:6px;border:1px solid #c9ced6;padding:8px;color:#15191e" });
    const ov = h("div", { class: "overlay", role: "dialog", "aria-label": "Something wrong" }, h("div", { class: "modal" }, h("h2", {}, "Something wrong?"),
      h("p", {}, `Tell us what was broken or hard to use on this screen. ${adminName()} gets it with the screen name, so it can be fixed.`), t,
      h("div", { class: "row" }, h("button", { class: "btn-g", type: "button", onclick: () => ov.remove() }, "Cancel"),
        h("button", { class: "btn-w", type: "button", onclick: () => {
          if (!t.value.trim()) return;
          Store.put("fb|" + Date.now().toString(36) + rid(), { who: S.user, view: S.view, project: S.project ? S.project.short : "", date: S.date ? ymd(S.date) : "", text: t.value.trim(), at: new Date().toISOString(), ua: navigator.userAgent }, "fb");
          ov.remove(); showInfo("Thank you", `Sent to ${adminName()}. It goes as soon as the phone has signal.`);
        } }, "Send"))));
    document.body.append(ov); t.focus();
  } }, "Something wrong?");
}
function alertsBanner() {
  if (!isAdmin(S.user)) return null;
  const since = Date.now() - 24 * 3600e3;
  const list = Store.list("alert|").map(([, o]) => o).filter(a => Date.parse(a.at) > since);
  const fb = Store.list("fb|").length;
  return [list.length ? sheet("", h("div", { class: "band", style: "background:#c8102e" }, `EMERGENCY ALERTS, LAST 24 HOURS (${list.length})`),
    ...list.map(a => h("div", { style: "padding:10px 12px;border-top:1px solid var(--line);font-size:13px" }, h("b", {}, a.who), ` on ${(CFG.projects.find(p => p.id === a.project) || {}).short || "no project"} at ${new Date(a.at).toLocaleString("en-ZA")}`,
      a.gps ? h("div", {}, h("a", { href: `https://maps.google.com/?q=${a.gps}`, target: "_blank" }, "Open location on the map")) : null))) : null,
    fb ? h("button", { class: "mbtn", onclick: () => go("feedback") }, `Feedback from the team (${fb})`) : null,
    devicesButton()];
}
// ---------- office: devices and access ----------
let DEVS = null, devsAt = 0;
async function refreshDevices(force) {
  if (!Store.me() || !Store.me().admin || !Store.online()) return;
  if (!force && Date.now() - devsAt < 25e3) return;
  try {
    const before = DEVS ? DEVS.filter(d => d.status === "pending").length : -1;
    DEVS = await Store.listDevices(); devsAt = Date.now();
    const after = DEVS.filter(d => d.status === "pending").length;
    if ((S.view === "projects" && after !== before) || S.view === "devices") render();
  } catch (e) {}
}
function devicesButton() {
  const waiting = (DEVS || []).filter(d => d.status === "pending").length;
  return waiting
    ? h("button", { class: "mbtn", style: "background:#fff4e0;border-color:#f29900;color:#8a4b00", onclick: () => go("devices") }, `${waiting} new device${waiting > 1 ? "s" : ""} waiting for you`, h("small", {}, "Someone opened a link on a phone or laptop that is not approved yet. Tap to allow or block."))
    : h("button", { class: "mbtn", onclick: () => go("devices") }, "Devices and access", h("small", {}, "Who is signed in, on which phones and laptops"));
}
const when = t => t ? new Date(t).toLocaleString("en-ZA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";
function askYesNo(title, text, yes, onYes, danger) {
  const ov = h("div", { class: "overlay", role: "dialog", "aria-label": title }, h("div", { class: "modal" }, h("h2", {}, title), h("p", {}, text),
    h("div", { class: "row" }, h("button", { class: "btn-g", type: "button", onclick: () => ov.remove() }, "Cancel"),
      h("button", { class: "btn-w", type: "button", style: danger ? "background:#c8102e" : "", onclick: () => { ov.remove(); onYes(); } }, yes))));
  document.body.append(ov);
}
// Office phone register: the IMEI, cell number and asset number the office records when it hands out a phone.
// A web app cannot read a phone's IMEI by itself, so the office types it once (dial *#06# on the phone to see it).
function phoneReg(p, d) {
  const id = `phreg|${p.id}|${d.dev}`, o = Store.get(id) || {};
  const line = [o.imei && `IMEI ${o.imei}`, o.cell && `Cell ${o.cell}`, o.asset && `Asset ${o.asset}`, o.issued && `Issued ${o.issued}`].filter(Boolean).join("  |  ");
  return h("div", { style: "font-size:12px;margin-top:4px;display:flex;gap:8px;align-items:center;flex-wrap:wrap" },
    h("span", { style: line ? "font-weight:700" : "color:#c8102e;font-weight:700" }, line || "No IMEI recorded"),
    h("button", { type: "button", style: "background:none;border:0;color:#0069aa;font-weight:800;font-size:12px;padding:2px", onclick: () => {
      const f = { imei: o.imei || "", cell: o.cell || "", asset: o.asset || "", issued: o.issued || ymd(new Date()) };
      const row = (lab, k, ph, type) => h("label", { style: "display:block;margin:8px 0 2px;font-size:13px;font-weight:700" }, lab, h("input", { type: type || "text", value: f[k], placeholder: ph, oninput: e => f[k] = e.target.value.trim(), style: "display:block;width:100%;margin-top:4px;padding:10px;border:1px solid #c9ced6;border-radius:6px;font-size:15px" }));
      const ov = h("div", { class: "overlay", role: "dialog", "aria-label": "Phone register" }, h("div", { class: "modal" }, h("h2", {}, `${p.name.split(" ")[0]}'s phone`),
        h("p", { style: "font-size:13px" }, `${d.label || "Device"}. Dial *#06# on that phone to see its IMEI.`),
        row("IMEI", "imei", "15 digits", "tel"), row("Cell number in the phone", "cell", "e.g. 082 000 0000", "tel"), row("Fibraco asset number", "asset", "e.g. FIB-PH-03"), row("Date handed out", "issued", "", "date"),
        h("div", { class: "row", style: "margin-top:12px" }, h("button", { class: "btn-g", type: "button", onclick: () => ov.remove() }, "Cancel"),
          h("button", { class: "btn-w", type: "button", onclick: () => { if (f.imei && !/^\d{15}$/.test(f.imei.replace(/\s/g, ""))) return showInfo("Check the IMEI", "An IMEI is 15 digits. Dial *#06# on the phone to see it."); f.imei = f.imei.replace(/\s/g, ""); Store.put(id, { ...f, label: d.label, at: new Date().toISOString() }); ov.remove(); render(); } }, "Save"))));
      document.body.append(ov); } }, line ? "Edit" : "Add IMEI"));
}
function vDevices() {
  if (!DEVS) { refreshDevices(true); return [topbar("Devices and access", "Office only", true), h("p", { class: "note" }, Store.online() ? "Loading..." : "This page needs signal.")]; }
  const act = (fn, msg) => fn().then(() => refreshDevices(true)).catch(e => showInfo("Not changed", Store.online() ? String(e.message || e).replace(/^\w+ \d+: /, "") : "This needs signal. Try again when you are connected."));
  const chip = st => h("span", { class: "pill", style: `background:${st === "active" ? "#1e8e3e" : st === "pending" ? "#f29900" : "#8a8f98"}` }, st === "active" ? "ALLOWED" : st === "pending" ? "WAITING" : "BLOCKED");
  const people = PEOPLE.map(p => ({ p, rows: DEVS.filter(d => d.member_id === p.id) })).filter(x => x.rows.length);
  people.sort((a, b) => (b.rows.some(d => d.status === "pending") - a.rows.some(d => d.status === "pending")));
  const card = ({ p, rows }) => {
    const on = rows[0].member_active !== false, devs = rows.filter(d => d.dev);
    return sheet("", h("div", { class: "band", style: on ? "" : "background:#8a8f98" }, `${p.name.toUpperCase()}`, h("small", {}, `  |  ${p.role}${on ? "" : "  |  SWITCHED OFF"}`)),
      ...(devs.length ? devs.map(d => h("div", { "data-label": d.label || "", style: "position:relative;padding:10px 12px;border-top:1px solid var(--line);display:flex;gap:10px;align-items:center;flex-wrap:wrap" + (d.status === "pending" ? ";background:#fff8ec" : "") },
        d.status === "blocked" && !d.mine ? h("button", { class: "dev-x", type: "button", "aria-label": "Remove this device", title: "Remove this device", onclick: () => askYesNo("Remove this device?", `${d.label || "This device"} is taken off ${p.name}'s list for good. It is already blocked, so it cannot open anything.`, "Remove", () => act(() => Store.removeDevice(p.id, d.dev).catch(e => { throw /remove_device|function|404|PGRST/i.test(String(e.message || e)) ? new Error("The remove button is not switched on in the database yet. Ask Claude for the one-time setup line.") : e; })), true) }, "\u00d7") : null,
        h("div", { style: "flex:1 1 180px;min-width:0;padding-right:" + (d.status === "blocked" && !d.mine ? "34px" : "0") },
          h("div", { style: "font-weight:700;font-size:14px" }, d.label || "Unknown device", d.mine ? h("span", { style: "color:var(--muted);font-weight:500" }, "  (this device)") : null),
          h("div", { style: "font-size:12px;color:var(--muted)" }, `First opened ${when(d.first_seen)}  |  Last used ${when(d.last_seen)}`),
          phoneReg(p, d)),
        chip(d.status),
        d.mine ? null : h("div", { style: "display:flex;gap:6px" },
          d.status !== "active" ? h("button", { class: "btn-w", type: "button", style: "padding:8px 14px", onclick: () => {
            // one phone per person: allowing a new phone cuts off and wipes his other devices (the office is the exception)
            const others = p.admin ? [] : devs.filter(x => x.dev !== d.dev && x.status !== "blocked");
            askYesNo(others.length ? `Move ${p.name.split(" ")[0]} to this phone?` : "Allow this device?",
              others.length ? `${p.name} can only use one phone. ${d.label || "This phone"} gets his projects, and ${others.map(x => x.label || "his other device").join(" and ")} is cut off straight away and wiped next time it has signal.` : `${p.name} on ${d.label || "this device"} gets full access to his projects.`,
              others.length ? "Move" : "Allow", () => act(async () => { await Store.setDevice(p.id, d.dev, "active"); for (const x of others) await Store.setDevice(p.id, x.dev, "blocked"); })); } }, "Allow") : null,
          d.status !== "blocked" ? h("button", { class: "btn-g", type: "button", style: "padding:8px 14px", onclick: () => askYesNo("Block this device?", `${d.label || "This device"} stops working for ${p.name} straight away. Next time it has signal, everything the app kept on it is wiped.`, "Block", () => act(() => Store.setDevice(p.id, d.dev, "blocked")), true) }, "Block") : null)))
        : [h("div", { style: "padding:10px 12px;border-top:1px solid var(--line);font-size:13px;color:var(--muted)" }, "Link not opened yet.")]),
      h("div", { style: "padding:8px 12px;border-top:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap" },
        h("span", { style: "font-size:12.5px;color:var(--muted)" }, (() => { const o = Store.get(`sig|${p.id}`); return o && o.img && !o.reset ? `Signature locked in ${when(o.at)}` : o && o.reset ? "Signature reset, waiting for a new one" : "No signature yet"; })()),
        h("button", { class: "btn-g", type: "button", style: "padding:6px 12px;font-size:12px", onclick: () => askYesNo(`Reset ${p.name.split(" ")[0]}'s signature?`, "Next time he opens the app he draws a new one and locks it in. The old one stays on record.", "Reset", () => { const id = `sig|${p.id}`; Store.lock([id], "unlock"); Store.put(id, { reset: true, at: new Date().toISOString(), by: S.user }); showInfo("Signature reset", `${p.name} draws a new signature next time he opens the app.`); setTimeout(render, 300); }) }, "Reset signature")),
      p.admin ? null : h("div", { style: "padding:8px 12px;border-top:1px solid var(--line);text-align:right" },
        h("button", { class: "btn-g", type: "button", style: "padding:6px 12px;font-size:12px", onclick: () => on
          ? askYesNo(`Switch ${p.name} off?`, `All his devices stop working at once and are wiped when they next have signal. His work already sent stays. You can switch him on again later.`, "Switch off", () => act(() => Store.setMember(p.id, false)), true)
          : askYesNo(`Switch ${p.name} on again?`, "His link works again. Devices you blocked stay blocked.", "Switch on", () => act(() => Store.setMember(p.id, true))) }, on ? `Switch ${p.name.split(" ")[0]} off` : `Switch ${p.name.split(" ")[0]} on again`)));
  };
  return [topbar("Devices and access", "Office only", true),
    h("p", { class: "hint", style: "margin:4px 2px 12px" }, "Each person can use one phone only. His link works on the first phone that opens it. Any other phone or laptop waits here for you, with its make and model. Allow a new phone and his old one is cut off and wiped. Record each phone's IMEI so you can match it to the phone you handed out."),
    ...people.map(card),
    h("button", { class: "mbtn ghost", onclick: () => refreshDevices(true) }, "Refresh")];
}
// ---------- test sheets: OTDR both directions and OLTS, per section point A to point B ----------
// The testers only type the losses. Generate report averages the two OTDR directions per joint
// (the bidirectional result), checks OLTS against the link budget, and lists every problem.
const TS_DEF = { spliceGood: 0.10, spliceMax: 0.15, att: { 1310: 0.36, 1550: 0.25, 1625: 0.30 }, conn: 0.5, wls: [1310, 1550, 1625] };
// test and splice equipment from the register, with its calibration status
const EQUIP = () => (CFG && CFG.equip) || [];
function calState(e) {
  if (!e || !e.due) return { t: "No calibration date", c: "#5b6470" };
  const days = Math.round((new Date(e.due + "T12:00:00") - new Date()) / 864e5);
  if (days < 0) return { t: `Calibration overdue since ${dmy(new Date(e.due + "T12:00:00"))}`, c: "#ff3b3b", bad: true };
  if (days < 60) return { t: `Calibration due ${dmy(new Date(e.due + "T12:00:00"))}`, c: "#ffd60a" };
  return { t: `Calibrated, valid to ${dmy(new Date(e.due + "T12:00:00"))}`, c: "#39ff14" };
}
const eqById = id => EQUIP().find(e => e.id === id);
const tsLim = () => Object.assign({}, TS_DEF, S.project.testLimits || {});
function tsRoutes() {
  const pid = S.project.id, base = (S.project.routes || []).map(r => JSON.parse(JSON.stringify(r)));
  for (const [id, o] of Store.list(`tsr|${pid}|`)) { const i = base.findIndex(r => r.id === o.id); if (i >= 0) base[i] = o; else base.push(o); }
  return base.filter(r => !r.removed).sort((x, y) => (x.practice ? 1 : 0) - (y.practice ? 1 : 0));
}
const tsRoute = rid => tsRoutes().find(r => r.id === rid);
const tsMeta = pid => /^adhoc-/.test(pid) ? adhocMeta(pid) : { shared: true, tags: [`proj:${pid}`] };
const tsSaveRoute = r => Store.put(`tsr|${S.project.id}|${r.id}`, r, "r", tsMeta(S.project.id));
// typing keeps the numbers on the phone at once and sends them a moment later
const tsCache = {}, tsTimer = {};
const tsGet = (rid, part) => { const id = `tsd|${S.project.id}|${rid}|${part}`; return tsCache[id] || Store.get(id) || {}; };
function tsPut(id) { clearTimeout(tsTimer[id]); delete tsTimer[id]; const d = tsCache[id]; if (d) Store.put(id, Object.assign(d, { by: S.user, at: new Date().toISOString() }), "r", tsMeta(id.split("|")[1])); }
function tsSave(rid, part, data) { const id = `tsd|${S.project.id}|${rid}|${part}`; tsCache[id] = data; clearTimeout(tsTimer[id]); tsTimer[id] = setTimeout(() => tsPut(id), 600); }
const tsFlush = () => Object.keys(tsTimer).forEach(tsPut);
const num = v => v === "" || v == null || isNaN(+v) ? null : +v;
const f2 = v => v == null ? "-" : (+v).toFixed(2);
const f3 = v => v == null ? "-" : (+v).toFixed(3);

// one route, all the numbers worked out
function tsAnalyse(r, wl) {
  const L = tsLim(), ab = (tsGet(r.id, "ab")[wl]) || {}, ba = (tsGet(r.id, "ba")[wl]) || {}, ol = (tsGet(r.id, "olts")[wl]) || {};
  const nJ = (r.joints || []).length, km = (+r.m || 0) / 1000;
  const budget = km * (L.att[wl] || 0.3) + nJ * L.spliceMax + 2 * L.conn;
  const cores = [], issues = [];
  for (let c = 1; c <= (+r.cores || 12); c++) {
    const A = ab[c] || {}, B = ba[c] || {}, O = ol[c] || {};
    const joints = (r.joints || []).map((j, k) => {
      const a = num((A.j || [])[k]), b = num((B.j || [])[k]);
      const avg = a != null && b != null ? (a + b) / 2 : null;
      const st = avg == null ? (a != null || b != null ? "half" : "none") : avg <= L.spliceGood ? "good" : avg <= L.spliceMax ? "ok" : "bad";
      if (st === "bad") issues.push({ sev: "bad", core: c, joint: k, text: `Core ${c} at ${j.name}: ${f3(avg)} dB average (A to B ${f3(a)}, B to A ${f3(b)}). Over the ${L.spliceMax} dB limit. Re-splice and test again.` });
      return { a, b, avg, st };
    });
    const ta = num(A.t), tb = num(B.t), tAvg = ta != null && tb != null ? (ta + tb) / 2 : null;
    const oa = num(O.a), ob = num(O.b), oAvg = oa != null && ob != null ? (oa + ob) / 2 : null;
    const oSt = oAvg == null ? (oa != null || ob != null ? "half" : "none") : oAvg <= budget ? "good" : "bad";
    if (oSt === "bad") issues.push({ sev: "bad", core: c, text: `Core ${c}: OLTS ${f2(oAvg)} dB average, over the ${f2(budget)} dB link budget. Check the connectors and patch leads, clean and test again.` });
    if (oa != null && ob != null && Math.abs(oa - ob) > 0.5) issues.push({ sev: "warn", core: c, text: `Core ${c}: OLTS differs ${f2(Math.abs(oa - ob))} dB between directions. Clean both connectors and test again.` });
    const anyHalf = joints.some(j => j.st === "half") || oSt === "half";
    if (anyHalf) issues.push({ sev: "warn", core: c, text: `Core ${c}: only one direction tested so far. Test from the other end too.` });
    const worst = joints.reduce((m, j) => j.avg != null && (m == null || j.avg > m) ? j.avg : m, null);
    const done = joints.every(j => j.st !== "none" && j.st !== "half") && oSt !== "none" && oSt !== "half" && (nJ > 0 || (ta != null && tb != null));
    cores.push({ c, joints, ta, tb, tAvg, oa, ob, oAvg, oSt, worst, done, bad: joints.some(j => j.st === "bad") || oSt === "bad" });
  }
  const tested = cores.filter(x => x.done).length, bad = cores.filter(x => x.bad).length;
  const vals = cores.flatMap(x => x.joints.map(j => j.avg)).filter(v => v != null);
  return { cores, issues, budget, tested, bad, mean: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null, worst: vals.length ? Math.max(...vals) : null, wl, L };
}
// fibre colour code (TIA-598), used for tubes and for the fibres inside a tube
const FIB_COL = [["Blue", "#1f6fd1"], ["Orange", "#f28c28"], ["Green", "#2fa84f"], ["Brown", "#8b5a2b"], ["Slate", "#7a8590"], ["White", "#ffffff"], ["Red", "#e0262b"], ["Black", "#111111"], ["Yellow", "#f5d000"], ["Violet", "#8e44ad"], ["Rose", "#f4a6c0"], ["Aqua", "#21c7d9"]];
const tubeSize = r => Math.max(1, +r.tube || 12);
const tubeOf = (r, c) => Math.floor((c - 1) / tubeSize(r));
const fibCol = i => FIB_COL[i % 12];
const tubeLab = (r, t) => `Tube ${t + 1} ${fibCol(t)[0]}${t >= 12 ? " stripe" : ""}, cores ${t * tubeSize(r) + 1} to ${Math.min(+r.cores || 12, (t + 1) * tubeSize(r))}`;
const TS_COL = { good: "#39ff14", ok: "#ffd60a", bad: "#ff3b3b", half: "#5b6470", none: "#2c323c" };

// one section in a few numbers: cores fully tested, cores with a problem, colour
function tsSummary(r) {
  const L = tsLim();
  const used = L.wls.filter(w => ["ab", "ba", "olts"].some(p => Object.keys(tsGet(r.id, p)[w] || {}).length && JSON.stringify(tsGet(r.id, p)[w]).match(/\d/)));
  const ans = used.map(w => tsAnalyse(r, w));
  const tested = ans.length ? Math.min(...ans.map(a => a.tested)) : 0, bad = new Set(ans.flatMap(a => a.cores).filter(x => x.bad).map(x => x.c)).size, n = +r.cores || 12;
  const col = bad ? "#ff3b3b" : tested === n ? "#39ff14" : tested ? "#ffd60a" : "#5b6470";
  return { used, tested, bad, n, col };
}
// ---------- ad hoc test jobs: quick field tests on sites that are not a Fibraco project ----------
// The site and client details are filled in before testing starts. Each job then works like a project's test sheets.
const adhocJobs = () => Store.list("adj|").map(([, o]) => o).filter(o => o && !o.removed).sort((a, b) => (b.at || "").localeCompare(a.at || ""));
// last time anything happened on a job: made, or readings typed
const adhocLast = j => Store.list(`tsd|${j.id}|`).reduce((m, [, o]) => (o && o.at && o.at > m ? o.at : m), j.at || "");
const adhocSeenAt = () => { try { return localStorage.getItem("fib_adhoc_seen") || ""; } catch (e) { return ""; } };
const adhocNew = () => adhocJobs().filter(j => j.by !== S.user && adhocLast(j) > adhocSeenAt());
function adhocMeta(pid, job) {
  const j = job || Store.get(`adj|${pid}`) || {}, me = (Store.me() || {}).member;
  const ids = [...new Set([me, ...(j.crew || []).map(n => (PEOPLE.find(p => p.name === n) || {}).id)].filter(Boolean))];
  return { shared: true, tags: ids.map(i => `user:${i}`) };
}
function adhocProj(j) {
  const team = {}; (j.crew || []).forEach(n => team[n] = "worker"); team[j.lead || j.by] = "sm"; if (!team[S.user]) team[S.user] = "worker";
  return { id: j.id, adhoc: true, job: j, name: `Ad hoc test - ${j.site}`, short: j.site, kind: "cable", client: j.client, pm: [j.pm, j.pmc].filter(Boolean).join(", "), sm: [j.sm, j.smc].filter(Boolean).join(", "), sheq: [j.sheq, j.sheqc].filter(Boolean).join(", "), routes: [], team };
}
function adhocOpen(j) { S.project = adhocProj(j); S.date = today(); go("tsheets"); if (!tsRoutes().length) setTimeout(() => tsEditRoute(null), 300); }
function vAdhoc() {
  const jobs = adhocJobs(), seen = adhocSeenAt();
  try { localStorage.setItem("fib_adhoc_seen", new Date().toISOString()); } catch (e) {}
  return [topbar("Test sheets", "Ad hoc tests in the field", true),
    h("p", { class: "form-sub" }, "For quick tests on a site that is not one of our projects. Fill in the site and client first, then test. The report carries all of it."),
    h("button", { class: "submit", type: "button", style: "margin-bottom:14px", onclick: () => { S.adj = { id: "adhoc-" + Date.now().toString(36) + rid(), date: ymd(today()), crew: [S.user], by: S.user, lead: S.user }; go("adhocjob"); } }, "+ NEW TEST JOB"),
    jobs.length ? h("div", { class: "stack" }, ...jobs.map(j => h("div", { class: "adj-row" },
      h("button", { class: "mbtn", type: "button", style: "text-align:left;padding-right:56px", onclick: () => adhocOpen(j) },
        j.site, h("small", {}, `${j.client}  |  ${dmy(new Date(j.date + "T12:00:00"))}  |  ${(j.crew || []).map(n => n.split(" ")[0]).join(", ")}`),
        j.by !== S.user && adhocLast(j) > seen ? h("span", { class: "adj-new" }, "NEW READINGS") : null),
      // the man who made it, or the office, can remove a job (a practice one or a mistake)
      j.by === S.user || isAdmin(S.user) ? h("button", { type: "button", class: "adj-x", "aria-label": `Remove ${j.site}`, onclick: () => askYesNo(`Remove ${j.site}?`, "The test job and its sheets disappear from everyone's list. Only do this for a practice job or a mistake.", "Remove", () => {
        Store.put(`adj|${j.id}`, Object.assign({}, j, { removed: true, removedBy: S.user, removedAt: new Date().toISOString() }), "r", adhocMeta(j.id, j)); render(); toast("Removed"); }, true) }, "×") : null))) : h("p", { class: "note" }, "No ad hoc test jobs yet.")];
}
function vAdhocJob() {
  const j = S.adj; if (!j) { S.view = "adhoc"; return vAdhoc(); }
  const row = (lab, k, ph, req, type) => h("tr", {}, h("td", { class: "lab" }, lab, req ? h("span", { style: "color:#c8102e" }, " *") : null), h("td", {}, inp(type || "text", j[k], v => j[k] = v, ph)));
  const crewBox = h("div", { class: "chips" }, STAFF.map(n => { const b = h("button", { type: "button", class: j.crew.includes(n) ? "on" : "", onclick: () => { if (n === S.user) return; const on = j.crew.includes(n); j.crew = on ? j.crew.filter(x => x !== n) : [...j.crew, n]; b.classList.toggle("on", !on); } }, n); return b; }));
  return [topbar("New test job", `Ad hoc test  |  ${dmy(new Date(j.date + "T12:00:00"))}`, true), h("p", { class: "form-sub" }, "Fill this in before you start testing. Ask the client for the names on site. Everything with a red star must be filled in."),
    sheet("", h("div", { class: "band" }, "SITE"), h("table", {}, h("tbody", {},
      row("Site name", "site", "e.g. Kathu Solar Park substation", true),
      row("Address or farm", "addr", "Where the site is"),
      h("tr", {}, h("td", { class: "lab" }, "Date"), h("td", { class: "ro" }, dmy(new Date(j.date + "T12:00:00")))))),
      gpsBlock(j, "gps")),
    sheet("", h("div", { class: "band" }, "CLIENT"), h("table", {}, h("tbody", {},
      row("Client company", "client", "Who we are testing for", true),
      row("Order or reference no", "ref", "PO, job card or quote no"),
      row("Client project manager", "pm", "Name", true), row("PM cell no", "pmc", "Cell number", false, "tel"),
      row("Client site manager", "sm", "Name", true), row("SM cell no", "smc", "Cell number", false, "tel"),
      row("Client SHEQ officer", "sheq", "Name", true), row("SHEQ cell no", "sheqc", "Cell number", false, "tel")))),
    sheet("", h("div", { class: "band" }, "SCOPE"), txt(j.scope, v => j.scope = v, "What must be tested? e.g. 24 core SM fibre, substation to control room, OTDR both ways and OLTS")),
    sheet("", h("div", { class: "band" }, "FIBRACO TEAM ON SITE"), crewBox),
    h("p", { class: "hint" }, "The men you tick can see this job and fill in the readings from the other end."),
    h("button", { class: "submit", type: "button", onclick: () => {
      const miss = [["site", "the site name"], ["client", "the client company"], ["pm", "the client project manager"], ["sm", "the client site manager"], ["sheq", "the client SHEQ officer"], ["scope", "what must be tested"]].filter(([k]) => !(j[k] || "").trim()).map(x => x[1]);
      if (miss.length) return showInfo("Not finished", `Fill in ${miss.join(", ")}. If the client has no SHEQ officer on site, write None on site.`);
      j.at = new Date().toISOString(); Store.put(`adj|${j.id}`, j, "r", adhocMeta(j.id, j));
      S.adj = null; S.hist = S.hist.filter(v => v !== "adhocjob"); S.view = "adhoc"; adhocOpen(j); } }, "START TESTING")];
}

function vTsheets() {
  const routes = tsRoutes(), L = tsLim();
  const card = r => {
    const { tested, bad, n, col } = tsSummary(r);
    return h("button", { type: "button", class: "ts-route", onclick: () => { S.ts = { rid: r.id, wl: L.wls[0], tab: "ab" }; go("tsheet"); } },
      h("div", { style: `width:7px;align-self:stretch;background:${col};border-radius:4px;box-shadow:0 0 8px ${col}` }),
      h("div", { style: "flex:1;min-width:0;text-align:left" },
        h("div", { style: "font-weight:900;font-size:15.5px;color:#fff" }, r.practice ? "PRACTICE SECTION" : `${r.a}  to  ${r.b}`),
        r.practice ? h("div", { style: "font-size:12.5px;color:#00e5ff;font-weight:800" }, "For dry runs. It never goes on a report to the client.") : null,
        h("div", { style: "font-size:12.5px;color:#aeb6c1;margin-top:2px" }, `${n} cores  |  ${r.m ? (+r.m).toLocaleString("en-ZA") + " m" : "length not set"}  |  ${(r.joints || []).length} joint${(r.joints || []).length === 1 ? "" : "s"}`),
        h("div", { style: `font-size:13px;font-weight:800;margin-top:4px;color:${col}` }, bad ? `${bad} core${bad > 1 ? "s" : ""} with a problem` : tested === n ? "All cores tested and passed" : `${tested} of ${n} cores fully tested`)),
      h("div", { style: "color:#aeb6c1;font-size:22px;font-weight:900" }, "›"));
  };
  return [topbar("Test sheets", S.project.short, true),
    h("p", { class: "form-sub" }, "One sheet per section, point A to point B. Type the OTDR losses from both ends and the OLTS readings. Then tap Generate report."),
    h("div", { class: "ts-list" }, ...routes.map(card)),
    h("button", { class: "mbtn ghost", style: "margin-top:12px", onclick: () => tsEditRoute(null) }, "+ Add a section")];
}

function tsEditRoute(r) {
  const isNew = !r; r = r ? JSON.parse(JSON.stringify(r)) : { id: "R" + Date.now().toString(36), a: "", b: "", m: "", cores: 12, joints: [] };
  const jbox = h("div");
  const drawJ = () => jbox.replaceChildren(...r.joints.map((j, k) => h("div", { style: "display:flex;gap:6px;margin-top:6px" },
    h("input", { type: "text", value: j.name, placeholder: `Joint ${k + 1} name, e.g. RMU 4 or Camp`, style: "flex:1;padding:10px;border:1px solid #c9ced6;border-radius:6px;font-size:15px", oninput: e => j.name = e.target.value }),
    h("button", { type: "button", class: "btn-g", style: "padding:8px 10px", onclick: () => { r.joints.splice(k, 1); drawJ(); } }, "Remove"))),
    h("button", { type: "button", class: "btn-g", style: "margin-top:8px;padding:8px 12px", onclick: () => { r.joints.push({ name: "" }); drawJ(); } }, "+ Add a joint"));
  drawJ();
  // core count as tap blocks; the sheet is built for exactly that many cores
  const CORES = [4, 8, 12, 24, 48, 72, 96, 144, 192];
  const tubeIn = h("input", { type: "number", value: r.tube || Math.min(+r.cores || 12, 12), oninput: e => r.tube = +e.target.value || "", style: "display:block;width:100%;margin-top:4px;padding:10px;border:1px solid #c9ced6;border-radius:6px;font-size:15px" });
  const tubeFld = h("label", { style: "display:block;margin:8px 0 2px;font-size:13px;font-weight:700" }, "Cores per tube (set by itself, change only if the cable is different)", tubeIn);
  const coreGrid = h("div", { class: "core-pick" });
  const drawCores = () => coreGrid.replaceChildren(...CORES.map(c => h("button", { type: "button", class: +r.cores === c ? "on" : "", onclick: () => { r.cores = c; r.tube = Math.min(c, 12); tubeIn.value = r.tube; drawCores(); } }, String(c))));
  if (!r.tube) r.tube = Math.min(+r.cores || 12, 12);
  drawCores();
  const coreBox = h("div", { style: "margin:10px 0 2px" }, h("div", { style: "font-size:13px;font-weight:700;margin-bottom:6px" }, "Number of cores"), coreGrid);
  const fld = (lab, k, ph, type) => h("label", { style: "display:block;margin:8px 0 2px;font-size:13px;font-weight:700" }, lab, h("input", { type: type || "text", value: r[k] ?? "", placeholder: ph, oninput: e => r[k] = e.target.value.trim(), style: "display:block;width:100%;margin-top:4px;padding:10px;border:1px solid #c9ced6;border-radius:6px;font-size:15px" }));
  const ov = h("div", { class: "overlay", role: "dialog", "aria-label": "Section" }, h("div", { class: "modal", style: "max-height:86vh;overflow:auto" }, h("h2", {}, isNew ? "New section" : "Change this section"),
    fld("Point A", "a", "e.g. RMU 1"), fld("Point B", "b", "e.g. RMU 3"), fld("Length in metres", "m", "e.g. 845", "number"), coreBox, tubeFld,
    h("div", { style: "margin-top:10px;font-size:13px;font-weight:700" }, "Joints between A and B, in order from point A"), jbox,
    h("div", { class: "row", style: "margin-top:14px" }, h("button", { class: "btn-g", type: "button", onclick: () => ov.remove() }, "Cancel"),
      h("button", { class: "btn-w", type: "button", onclick: () => {
        if (!r.a || !r.b) return showInfo("Not finished", "Type point A and point B.");
        r.joints = r.joints.filter(j => (j.name || "").trim()); r.cores = +r.cores || 12; r.tube = +r.tube || 12; tsSaveRoute(r); ov.remove(); render(); } }, "Save"))));
  document.body.append(ov);
}

function vTsheet() {
  const r = tsRoute(S.ts.rid); if (!r) { S.view = "tsheets"; return vTsheets(); }
  const L = tsLim(), wl = S.ts.wl, tab = S.ts.tab, n = +r.cores || 12, J = r.joints || [];
  const part = tab === "olts" ? "olts" : tab, all = tsGet(r.id, part), data = all[wl] || (all[wl] = {});
  const cell = (val, onv, ph) => h("input", { class: "ts-in", type: "number", step: "any", inputmode: "decimal", value: val ?? "", placeholder: ph || "", oninput: e => { onv(e.target.value); tsSave(r.id, part, all); } });
  // B to A: the tester stands at point B, so the joints are listed from B's side
  const order = tab === "ba" ? J.map((_, k) => k).reverse() : J.map((_, k) => k);
  // 24, 48, 96 cores and up: one tube on the screen at a time, in the fibre colour code
  const TS = tubeSize(r), nT = Math.ceil(n / TS), multi = n > TS;
  if (!S.ts.tube || S.ts.tube >= nT) S.ts.tube = 0;
  const tb = S.ts.tube, coreList = Array.from({ length: multi ? Math.min(TS, n - tb * TS) : n }, (_, i) => (multi ? tb * TS : 0) + i + 1);
  const coreTh = c => { const [nm, hx] = fibCol((c - 1) % TS); return h("th", {}, h("span", { class: "fdot", style: `background:${hx}`, title: nm }), String(c)); };
  const tubeDone = t => { let f = 0, tot = 0; for (let c = t * TS + 1; c <= Math.min(n, (t + 1) * TS); c++) { tot++; const o = data[c] || {}; if (tab === "olts" ? (o.a !== undefined && o.a !== "") || (o.b !== undefined && o.b !== "") : (o.t !== undefined && o.t !== "") || (o.j || []).some(v => v !== undefined && v !== "")) f++; } return [f, tot]; };
  const tubeBar = multi ? h("div", { class: "ts-tubes" }, ...Array.from({ length: nT }, (_, t) => { const [f, tot] = tubeDone(t), [nm, hx] = fibCol(t);
    return h("button", { type: "button", class: "ts-tube" + (t === tb ? " on" : ""), onclick: () => { S.ts.tube = t; render(); } }, h("span", { class: "fdot", style: t >= 12 ? `background:linear-gradient(90deg,${hx} 38%,#000 38% 62%,${hx} 62%)` : `background:${hx}` }), `T${t + 1}`, h("small", {}, f === tot ? "done" : f ? `${f}/${tot}` : nm)); })) : null;
  let head, rows;
  if (tab === "olts") {
    head = h("tr", {}, h("th", {}, "Core"), h("th", {}, "Loss A to B (dB)"), h("th", {}, "Loss B to A (dB)"));
    rows = coreList.map(c => { const o = data[c] || (data[c] = {}); return h("tr", {}, coreTh(c), h("td", {}, cell(o.a, v => o.a = v)), h("td", {}, cell(o.b, v => o.b = v))); });
  } else {
    head = h("tr", {}, h("th", {}, "Core"), ...order.map(k => h("th", {}, J[k].name || `Joint ${k + 1}`)), h("th", {}, "Total loss"));
    rows = coreList.map(c => { const o = data[c] || (data[c] = { j: [] }); if (!o.j) o.j = [];
      return h("tr", {}, coreTh(c), ...order.map(k => h("td", {}, cell(o.j[k], v => o.j[k] = v))), h("td", {}, cell(o.t, v => o.t = v))); });
  }
  const tabBtn = (k, lab) => h("button", { type: "button", class: "ts-tab" + (tab === k ? " on" : ""), onclick: () => { S.ts.tab = k; render(); } }, lab);
  const wlBtn = w => h("button", { type: "button", class: "ts-tab" + (wl === w ? " on" : ""), onclick: () => { S.ts.wl = w; render(); } }, `${w} nm`);
  const meta = tsGet(r.id, "meta");
  const eqSel = (type, k, lab) => { const list = EQUIP().filter(e => e.type === type);
    const s2 = h("select", { class: "ts-sel", onchange: e => { meta[k] = e.target.value; tsSave(r.id, "meta", meta); render(); } }, h("option", { value: "" }, `Choose the ${lab}`), ...list.map(e => h("option", { value: e.id, selected: meta[k] === e.id }, `${e.name}, S/N ${e.serial}`)));
    const cs = calState(eqById(meta[k]));
    return h("div", { style: "margin:6px 0" }, h("div", { style: "font-size:12.5px;font-weight:800;color:#aeb6c1;margin-bottom:3px" }, lab), s2, meta[k] ? h("div", { style: `font-size:12.5px;font-weight:800;margin-top:3px;color:${cs.c}` }, cs.t) : null); };
  tsSetupDefaults(r, meta);
  const missing = tsSetupMissing(meta, tab, wl);
  const details = h("details", { class: "ts-details", open: !(meta.otdr && meta.olts && meta.splicer) || missing.length > 0 },
    h("summary", {}, missing.length ? `Test details: ${missing.length} setting${missing.length > 1 ? "s" : ""} still to fill in` : `Equipment: ${(eqById(meta.otdr) || {}).name || ""}  |  ${(eqById(meta.olts) || {}).name || ""}  |  IOR ${meta.ior || "-"}`),
    eqSel("OTDR", "otdr", "OTDR used"), eqSel("OLTS", "olts", "OLTS or power meter used"), eqSel("Splicer", "splicer", "Splice machine used on this section"),
    tsSetupBox(r, meta, L));
  return [topbar(`${r.a} to ${r.b}`, `${S.project.short}  |  ${n} cores`, true),
    details,
    h("div", { class: "ts-bar" }, ...L.wls.map(wlBtn)),
    h("div", { class: "ts-bar" }, tabBtn("ab", "OTDR A to B"), tabBtn("ba", "OTDR B to A"), tabBtn("olts", "OLTS")),
    h("p", { class: "form-sub", style: "margin-top:6px" }, tab === "ab" ? `Standing at ${r.a}, shooting to ${r.b}. Type the loss at each joint and the total loss.` : tab === "ba" ? `Standing at ${r.b}, shooting back to ${r.a}. The joints are listed from your side.` : "Type the OLTS loss in both directions for each core."),
    J.length || tab === "olts" ? null : h("p", { class: "hint" }, "No joints on this section. Only the total loss is needed."),
    tubeBar, multi ? h("div", { class: "ts-tube-h" }, tubeLab(r, tb)) : null,
    h("div", { class: "ts-grid-wrap" }, h("table", { class: "ts-grid" }, h("thead", {}, head), h("tbody", {}, ...rows))),
    multi && tb < nT - 1 ? h("button", { type: "button", class: "ts-nexttube", onclick: () => { S.ts.tube = tb + 1; render(); window.scrollTo(0, 0); } }, `NEXT TUBE  ›  ${tubeLab(r, tb + 1)}`) : null,
    (() => { const st = (all._stored || {})[wl]; return h("p", { class: "hint", style: "margin-top:10px" }, st ? `Stored by ${st.by.split(" ")[0]} at ${st.time}. Change a number and tap STORE RESULT again.` : `${multi ? `Type every tube (${n} cores), then tap STORE RESULT once.` : `Type all ${n} cores, then tap STORE RESULT.`} Leave a box empty if that core is not tested yet.`); })(),
    h("button", { class: "submit ts-store", type: "button", onclick: () => tsStore(r, wl, tab, all, meta) }, "STORE RESULT"),
    h("div", { style: "display:flex;gap:8px;flex-wrap:wrap;margin:10px 0" },
      h("button", { class: "submit", type: "button", style: "flex:2", onclick: () => { tsFlush(); go("treport"); } }, "Generate report"),
      h("button", { class: "mbtn ghost", type: "button", style: "flex:1;margin:0", onclick: () => tsEditRoute(r) }, "Change section"))];
}

// The values typed into the tester before a shot are kept with the section, so the report shows how it was tested.
// OTDR: EXFO OX1 settings. OLTS: light source and FPM-300 power meter (the meter keeps no results of its own).
const TS_SET = {
  mode: ["OTDR test mode", "sel", ["Flash Advisor", "Fault Xplorer", "Link Mapper"]],
  ior: ["IOR at 1550 nm (from the cable datasheet)", "num", "e.g. 1.4682"],
  cable: ["Fibre type", "txt", "e.g. 12F single mode G.652D"],
  cords: ["Launch and receive cords (Test cords)", "sel", ["On", "Off"]],
  launch: ["Launch cord length (m)", "num", "e.g. 20"],
  receive: ["Receive cord length (m)", "num", "e.g. 20"],
  thr: ["Pass and fail on the OTDR", "sel", ["Custom thresholds", "EXFO Advisor"]],
  thSplice: ["Splice loss threshold (dB)", "num", "0.15"],
  thConn: ["Connector loss threshold (dB)", "num", "0.50"],
  thRefl: ["Connector reflectance threshold (dB)", "num", "e.g. -35"],
  thLink: ["Link loss threshold (dB)", "num", "optional"],
  thOrl: ["ORL threshold (dB)", "num", "optional"],
  job: ["OTDR job name (as saved on the tester)", "txt", "e.g. BR RMU1-RMU3"],
  firstId: ["First test point on the tester", "txt", "e.g. F01"],
  refMethod: ["OLTS reference method", "sel", ["1 jumper", "2 jumpers", "3 jumpers"]],
  mod: ["Light source modulation", "sel", ["CW", "270 Hz", "1 kHz", "2 kHz", "Auto"]],
};
function tsSetupDefaults(r, meta) {
  if (meta._def) return;
  // start from the last section that was set up, so the man does not type the same tester settings again
  const others = tsRoutes().filter(x => x.id !== r.id).map(x => tsGet(x.id, "meta")).filter(m => m && m.ior).sort((a, b) => (a.at || "") < (b.at || "") ? 1 : -1);
  const src = others[0] || {};
  for (const k of Object.keys(TS_SET)) if (meta[k] == null && src[k] != null) meta[k] = src[k];
  if (meta.thSplice == null) meta.thSplice = String(tsLim().spliceMax);
  if (meta.thr == null) meta.thr = "Custom thresholds";
  if (meta.cords == null) meta.cords = "On";
  meta._def = 1;
}
function tsSetupMissing(meta, tab, wl) {
  const m = [];
  if (tab === "olts") { if (!meta.refMethod) m.push("OLTS reference method"); if (meta["ref" + wl] == null || meta["ref" + wl] === "") m.push(`Reference at ${wl} nm`); if (!meta.mod) m.push("Modulation"); }
  else { if (!meta.mode) m.push("OTDR test mode"); if (!meta.ior) m.push("IOR"); if (!meta.cords) m.push("Test cords");
    if (meta.cords === "On" && (!meta.launch || !meta.receive)) m.push("Cord lengths"); if (!meta.thr) m.push("Pass and fail"); if (meta.thr === "Custom thresholds" && !meta.thSplice) m.push("Splice threshold"); if (!meta.job) m.push("Job name"); }
  return m;
}
function tsSetupBox(r, meta, L) {
  const box = h("div", { class: "ts-setup" });
  const save = () => { meta.at = new Date().toISOString(); tsSave(r.id, "meta", meta); };
  const field = k => { const [lab, kind, opt] = TS_SET[k];
    const el = kind === "sel" ? h("select", { class: "ts-sel", onchange: e => { meta[k] = e.target.value; save(); draw(); } }, h("option", { value: "" }, "Choose"), ...opt.map(o => h("option", { value: o, selected: meta[k] === o }, o)))
      : h("input", { class: "ts-set-in", type: kind === "num" ? "number" : "text", step: "any", inputmode: kind === "num" ? "decimal" : "text", value: meta[k] ?? "", placeholder: opt, oninput: e => { meta[k] = e.target.value.trim(); save(); } });
    return h("label", { class: "ts-set" }, h("span", {}, lab), el); };
  const draw = () => box.replaceChildren(
    h("div", { class: "ts-set-h" }, "OTDR settings, as typed into the tester"),
    field("mode"), field("ior"), field("cable"), field("cords"),
    meta.cords === "On" ? field("launch") : null, meta.cords === "On" ? field("receive") : null,
    field("thr"),
    meta.thr === "Custom thresholds" ? h("div", {}, field("thSplice"), field("thConn"), field("thRefl"), field("thLink"), field("thOrl")) : null,
    +meta.thSplice && +meta.thSplice !== L.spliceMax ? h("div", { class: "tsp-note" }, `The app grades joints at ${L.spliceMax} dB maximum. Set the same splice threshold on the tester so both agree.`) : null,
    field("job"), field("firstId"),
    h("div", { class: "ts-set-h" }, "OLTS settings, light source and power meter"),
    field("refMethod"), field("mod"),
    ...L.wls.map(w => h("label", { class: "ts-set" }, h("span", {}, `Reference at ${w} nm (dBm, after pressing REF)`),
      h("input", { class: "ts-set-in", type: "number", step: "any", inputmode: "decimal", value: meta["ref" + w] ?? "", placeholder: "e.g. -5.20", oninput: e => { meta["ref" + w] = e.target.value.trim(); meta["refAt" + w] = new Date().toISOString(); save(); } }))));
  draw(); return box;
}

// STORE RESULT, like the tester's Save: one press stores the whole run (one direction, one wavelength, all cores),
// then a summary pops up. As soon as both OTDR directions are stored the joints are averaged and a failed joint
// goes to the splicer straight away.
const TS_STEPS = ["ab", "ba", "olts"], TS_NAMES = { ab: "OTDR A to B", ba: "OTDR B to A", olts: "OLTS" };
function tsStore(r, wl, tab, all, meta) {
  const part = tab, d = all[wl] || {}, n = +r.cores || 12;
  const filled = Object.values(d).filter(o => o && (o.t != null && o.t !== "" || o.a != null && o.a !== "" || o.b != null && o.b !== "" || (o.j || []).some(v => v != null && v !== ""))).length;
  if (!filled) return showInfo("Nothing to store", "Type the readings first, then tap STORE RESULT.");
  if (tab !== "olts" && !meta.otdr) return showInfo("Choose the OTDR first", "Open Test details at the top and choose the OTDR you used. Its serial and calibration go on the report.");
  if (tab === "olts" && !meta.olts) return showInfo("Choose the power meter first", "Open Test details at the top and choose the OLTS or power meter you used.");
  const miss = tsSetupMissing(meta, tab, wl);
  if (miss.length) return showInfo("Tester settings missing", `Fill in what you set on the tester first, under Test details at the top: ${miss.join(", ")}.`);
  const now = new Date();
  all._stored = all._stored || {}; all._stored[wl] = { by: S.user, at: now.toISOString(), time: hhmm(now), cores: filled };
  tsSave(r.id, part, all); tsFlush();
  const an = tsAnalyse(r, wl), st = p => !!((tsGet(r.id, p)._stored || {})[wl]);
  const both = tab === "olts" ? true : st("ab") && st("ba");
  const sent = !r.practice && both ? tsRouteFaults(r, wl, an) : [];
  tsSummaryPop(r, wl, tab, an, both, sent, filled, n, meta);
}
function tsSummaryPop(r, wl, tab, an, both, sent, filled, n, meta) {
  const L = an.L, gradeJ = v => v == null ? "none" : v <= L.spliceGood ? "good" : v <= L.spliceMax ? "ok" : "bad";
  // colour per core: final when both directions are in, else from this run alone
  const coreSt = c => {
    if (tab === "olts") return c.oSt === "half" ? ((c.oa ?? c.ob) == null ? "none" : (c.oa ?? c.ob) <= an.budget ? "good" : "bad") : c.oSt;
    const vals = c.joints.map(j => both ? j.avg : (tab === "ab" ? j.a : j.b)).filter(v => v != null);
    const tot = tab === "ab" ? c.ta : c.tb;
    if (!vals.length) return tot == null ? "none" : "good";
    const order = ["good", "ok", "bad"]; return vals.map(gradeJ).reduce((m, x) => order.indexOf(x) > order.indexOf(m) ? x : m, "good");
  };
  const blocks = an.cores.map(c => { const k = coreSt(c); return h("div", { class: "tsp-core " + k }, String(c.c)); });
  let worstTxt = "-";
  if (tab === "olts") { const v = an.cores.map(c => c.oAvg ?? c.oa ?? c.ob).filter(x => x != null); if (v.length) worstTxt = `${f2(Math.max(...v))} dB (budget ${f2(an.budget)} dB)`; }
  else { let w = null; an.cores.forEach(c => c.joints.forEach((j, k) => { const v = both ? j.avg : (tab === "ab" ? j.a : j.b); if (v != null && (!w || v > w.v)) w = { v, c: c.c, k }; }));
    if (w) worstTxt = `${f3(w.v)} dB, core ${w.c} at ${(r.joints[w.k] || {}).name || "joint " + (w.k + 1)}`; }
  const tots = an.cores.map(c => tab === "ab" ? c.ta : tab === "ba" ? c.tb : null).filter(v => v != null);
  const faults = an.issues.filter(i => i.sev === "bad" && (tab === "olts" ? i.joint == null : i.joint != null));
  const bad = an.cores.filter(c => coreSt(c) === "bad").length;
  const who = [...new Set(sent.filter(x => x.joint != null || tab === "olts").map(x => x.resp))];
  // next step, the way the tester leads you
  const i = TS_STEPS.indexOf(tab), wls = L.wls, wi = wls.indexOf(wl);
  const next = i < 2 ? { tab: TS_STEPS[i + 1], wl, lab: `Next: ${TS_NAMES[TS_STEPS[i + 1]]}` } : wi < wls.length - 1 ? { tab: "ab", wl: wls[wi + 1], lab: `Next: ${wls[wi + 1]} nm` } : null;
  const eq = eqById(tab === "olts" ? meta.olts : meta.otdr) || {};
  const ov = h("div", { class: "overlay", role: "dialog", "aria-label": "Stored" });
  const close = () => ov.remove();
  ov.append(h("div", { class: "modal tsp" },
    h("button", { class: "tsp-x", type: "button", "aria-label": "Close", onclick: close }, "×"),
    h("div", { class: "tsp-ok" }, "STORED"),
    h("div", { class: "tsp-h" }, `${r.a} to ${r.b}`),
    h("div", { class: "tsp-s" }, `${wl} nm  |  ${TS_NAMES[tab]}  |  ${filled} of ${n} cores`),
    h("div", { class: "tsp-s" }, `${eq.name || ""}${S.user ? "  |  " + S.user.split(" ")[0] + " " + hhmm(new Date()) : ""}`),
    h("div", { class: "tsp-s" }, tab === "olts" ? `Reference ${meta["ref" + wl]} dBm  |  ${meta.refMethod}  |  ${meta.mod}` : `IOR ${meta.ior}  |  ${meta.mode}  |  cords ${meta.cords === "On" ? `${meta.launch} m and ${meta.receive} m` : "off"}  |  job ${meta.job}`),
    h("div", { class: "tsp-grid" + (n > 24 ? " big" : "") }, ...blocks),
    h("div", { class: "tsp-line" }, h("b", {}, tab === "olts" ? "Highest loss " : both ? "Worst joint (average) " : "Worst joint "), worstTxt),
    tots.length ? h("div", { class: "tsp-line" }, h("b", {}, "Highest total "), `${f2(Math.max(...tots))} dB`) : null,
    h("div", { class: "tsp-line " + (bad ? "bad" : "good") }, bad ? `${bad} core${bad > 1 ? "s" : ""} over the limit` : "No core over the limit"),
    tab !== "olts" && !both ? h("div", { class: "tsp-note" }, `Only one direction so far. Store ${tab === "ab" ? "B to A" : "A to B"} too, then the joints are averaged and any failed joint goes to the splicer.`) : null,
    faults.length && both ? h("div", { class: "tsp-faults" }, ...faults.slice(0, 3).map(f => h("div", {}, f.text.split(". ")[0] + ".")), faults.length > 3 ? h("div", {}, `Plus ${faults.length - 3} more on the report.`) : null) : null,
    who.length && !r.practice ? h("div", { class: "tsp-sent" }, `SPLICE FAILED sent to ${who.join(" and ")}.`) : null,
    r.practice ? h("div", { class: "tsp-note" }, "Practice section. Nothing goes to the splicers or the report.") : null,
    h("div", { class: "row", style: "margin-top:10px" },
      next ? h("button", { class: "btn-w", type: "button", onclick: () => { close(); S.ts.tab = next.tab; S.ts.wl = next.wl; render(); window.scrollTo(0, 0); } }, next.lab)
        : h("button", { class: "btn-w", type: "button", onclick: () => { close(); tsFlush(); go("treport"); } }, "Generate report"))));
  document.body.append(ov);
}

function tsGridHtml(r, an, forPdf) {
  const J = r.joints || [];
  const sq = (st, txt) => forPdf ? `<td style="background:${st === "good" ? "#d9f99d" : st === "ok" ? "#fde68a" : st === "bad" ? "#fecaca" : "#f1f5f9"};text-align:center">${txt}</td>`
    : h("td", { class: "ts-sq", style: `background:${TS_COL[st]};color:${["good", "ok"].includes(st) ? "#10140f" : "#fff"};box-shadow:${["good", "ok", "bad"].includes(st) ? "0 0 6px " + TS_COL[st] : "none"}` }, txt);
  const row = x => {
    const jc = x.joints.map(j => sq(j.st, j.avg != null ? f3(j.avg) : j.st === "half" ? "1 side" : ""));
    const oc = sq(x.oSt, x.oAvg != null ? f2(x.oAvg) : x.oSt === "half" ? "1 side" : "");
    return forPdf ? `<tr><th>${x.c}</th>${jc.join("")}${J.length ? "" : `<td style="text-align:center">${f2(x.tAvg)}</td>`}${oc}</tr>` : h("tr", {}, h("th", {}, x.c), ...jc, J.length ? null : h("td", { class: "ts-sq", style: "background:#2c323c;color:#fff" }, f2(x.tAvg)), oc);
  };
  const multi = (+r.cores || 12) > tubeSize(r), span = J.length + 2;
  const tubeRow = x => multi && (x.c - 1) % tubeSize(r) === 0 ? (forPdf ? `<tr><th colspan="${span}" style="text-align:left;background:#e8eef5">${tubeLab(r, tubeOf(r, x.c))}</th></tr>` : h("tr", {}, h("th", { colspan: span, class: "ts-tube-row" }, tubeLab(r, tubeOf(r, x.c))))) : (forPdf ? "" : null);
  if (forPdf) return `<table class="g"><thead><tr><th>Core</th>${J.map(j => `<th>${j.name}</th>`).join("")}${J.length ? "" : "<th>OTDR total (avg)</th>"}<th>OLTS (avg)</th></tr></thead><tbody>${an.cores.map(x => tubeRow(x) + row(x)).join("")}</tbody></table>`;
  return h("div", { class: "ts-grid-wrap" }, h("table", { class: "ts-heat" }, h("thead", {}, h("tr", {}, h("th", {}, "Core"), ...J.map(j => h("th", {}, j.name)), J.length ? null : h("th", {}, "OTDR total"), h("th", {}, "OLTS"))), h("tbody", {}, ...an.cores.flatMap(x => [tubeRow(x), row(x)]).filter(Boolean))));
}

function vTreport() {
  seedLinks();
  const r = tsRoute(S.ts.rid); if (!r) { S.view = "tsheets"; return vTsheets(); }
  const L = tsLim(), wl = S.ts.wl, an = tsAnalyse(r, wl), n = +r.cores || 12;
  const tile = (lab, val, col) => h("div", { class: "ts-tile", style: `border-color:${col};box-shadow:0 0 10px ${col}` }, h("div", { class: "ts-tl", style: `color:${col}` }, lab), h("div", { class: "ts-tv", style: `color:${col}` }, val));
  const bad = an.issues.filter(i => i.sev === "bad"), warn = an.issues.filter(i => i.sev === "warn");
  const overall = bad.length ? "#ff3b3b" : an.tested === n ? "#39ff14" : "#ffd60a";
  const wlBtn = w => h("button", { type: "button", class: "ts-tab" + (wl === w ? " on" : ""), onclick: () => { S.ts.wl = w; render(); } }, `${w} nm`);
  // Every failed joint goes to the man who spliced it, by itself, as a red repair on his phone.
  // When a retest passes, the repair closes by itself.
  const sent = r.practice ? [] : tsRouteFaults(r, wl, an);
  return [topbar("Test report", `${r.a} to ${r.b}  |  ${wl} nm`, true),
    h("div", { class: "ts-bar" }, ...L.wls.map(wlBtn)),
    h("div", { class: "dash-block", style: "padding:12px" },
      h("div", { style: "display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap;margin-bottom:10px" },
        h("div", { style: "font-weight:900;font-size:16px;color:#fff;letter-spacing:.03em" }, `${r.a.toUpperCase()}  TO  ${r.b.toUpperCase()}`),
        h("span", { class: "dash-chip", style: `background:${overall};color:#10140f` }, bad.length ? "PROBLEMS FOUND" : an.tested === n ? "ALL PASSED" : "NOT FINISHED")),
      h("div", { class: "ts-tiles" }, tile("Cores done", `${an.tested}/${n}`, an.tested === n ? "#39ff14" : "#ffd60a"), tile("Problems", String(bad.length), bad.length ? "#ff3b3b" : "#39ff14"),
        tile("Worst joint", an.worst == null ? "-" : f3(an.worst), an.worst == null ? "#aeb6c1" : an.worst > L.spliceMax ? "#ff3b3b" : an.worst > L.spliceGood ? "#ffd60a" : "#39ff14"),
        tile("Link budget", f2(an.budget), "#00e5ff")),
      h("div", { style: "font-size:12px;color:#aeb6c1;margin:12px 0 6px" }, "Joint loss per core, average of both directions (dB). Last column OLTS average (dB)."),
      tsGridHtml(r, an, false),
      h("div", { style: "display:flex;gap:10px;flex-wrap:wrap;font-size:11.5px;color:#aeb6c1;margin-top:8px" },
        ...[["good", `up to ${L.spliceGood}`], ["ok", `up to ${L.spliceMax}`], ["bad", `over ${L.spliceMax}`], ["half", "one side only"]].map(([k, t]) => h("span", { style: "display:inline-flex;gap:5px;align-items:center" }, h("span", { style: `width:12px;height:12px;border-radius:3px;background:${TS_COL[k]};display:inline-block` }), t)))),
    sheet("", h("div", { class: "band", style: bad.length ? "background:#c8102e" : "" }, bad.length ? `FIX THESE (${bad.length})` : "NO PROBLEMS"),
      ...(bad.length ? bad.map(i => { const to = (sent.find(x => x.core === i.core && x.joint === i.joint) || {}).resp; return h("div", { style: "padding:10px 12px;border-top:1px solid var(--line);font-size:13.5px;font-weight:700;color:#c8102e" }, i.text, to ? h("div", { style: "color:#15191e;font-weight:800;font-size:12.5px;margin-top:3px" }, `Sent to ${to} as a repair.`) : null); }) : [h("div", { style: "padding:10px 12px;font-size:13.5px" }, "No joint or OLTS reading is over the limit.")]),
      r.practice && bad.length ? h("div", { style: "padding:8px 12px;font-size:12.5px;color:#5b6470" }, "Practice section: nothing is sent to anyone.") : null),
    warn.length ? sheet("", h("div", { class: "band", style: "background:#b07d00" }, `CHECK (${warn.length})`), ...warn.map(i => h("div", { style: "padding:9px 12px;border-top:1px solid var(--line);font-size:13px" }, i.text))) : null,
    (() => { const meta = tsGet(r.id, "meta"); const rows = [["OTDR", meta.otdr], ["OLTS", meta.olts], ["Splicer", meta.splicer]].filter(x => x[1]).map(([t, id]) => { const e = eqById(id) || {}, cs = calState(e);
        return h("div", { style: "padding:9px 12px;border-top:1px solid var(--line);font-size:13px" }, h("b", {}, `${t}: ${e.name || id}`), h("div", { style: "color:#5b6470" }, `S/N ${e.serial || "-"}${e.cert ? "  |  Cert " + e.cert : ""}  |  Owner ${e.owner || "-"}`), h("div", { style: `font-weight:800;color:${cs.bad ? "#c8102e" : "#15191e"}` }, cs.t)); });
      return sheet("", h("div", { class: "band" }, "EQUIPMENT USED"), ...(rows.length ? rows : [h("div", { style: "padding:10px 12px;font-size:13px;color:#c8102e;font-weight:700" }, "No equipment chosen yet. Open the section and choose the OTDR and OLTS.")])); })(),
    h("p", { class: "hint" }, `Pass marks used: joint ${L.spliceGood} dB good, ${L.spliceMax} dB maximum (average of both directions). Link budget = length x ${L.att[wl]} dB/km at ${wl} nm + ${L.spliceMax} dB per joint + ${L.conn} dB per connector at each end.`),
    h("div", { style: "display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 16px" },
      h("button", { class: "mbtn", type: "button", style: "flex:1;margin:0", onclick: () => tsSendPdf(r) }, "Send report", h("small", {}, "PDF, both wavelengths"))) ];
}

// who did the splicing at a joint: the man the programme gave splicing at that spot, else the main splicer, else the site manager
function tsSplicerFor(jointName) {
  const plan = S.project.plan || {}, at = {}, count = {};
  for (const rows of Object.values(plan)) for (const t of rows) if (/SPLICE|DOME JOINT/.test(t.act)) { const node = (t.key || "").split("|")[1] || "Site"; if (node !== "Site") at[node] = at[node] || t.who; count[t.who] = (count[t.who] || 0) + (/SPLICE/.test(t.act) ? 2 : 1); }
  for (const [node, w] of Object.entries(at)) if ((jointName || "").includes(node)) return w;
  const main = Object.entries(count).sort((a, b) => b[1] - a[1])[0];
  return main ? main[0] : smName();
}
const tsDataAt = rid => ["ab", "ba", "olts"].map(p => tsGet(rid, p).at || "").sort().pop() || "";
function tsRouteFaults(r, wl, an) {
  const pid = S.project.id; S.issues[pid] = S.issues[pid] || [];
  const list = S.issues[pid], out = []; let changed = false;
  const badNow = new Set();
  for (const i of an.issues.filter(x => x.sev === "bad")) {
    const id = `ts-${r.id}-${wl}-${i.core}-${i.joint ?? "o"}`; badNow.add(id);
    const jn = i.joint != null ? (r.joints[i.joint] || {}).name : null;
    const resp = i.joint != null ? tsSplicerFor(jn) : smName();
    const ex = list.find(x => x.id === id);
    if (!ex) { list.push({ id, title: `Splice failed: ${r.a} to ${r.b}, core ${i.core}${jn ? ", " + jn : ""}`, detail: i.text, found: S.user, foundOn: ymd(S.date), resp, status: "open" }); changed = true; }
    else if (ex.status === "closed" || (ex.status === "retest" && tsDataAt(r.id) > (ex.repairAt || ""))) { ex.status = "open"; ex.detail = i.text; ex.foundOn = ymd(S.date); changed = true; }
    out.push({ core: i.core, joint: i.joint, resp: (ex || {}).resp || resp });
  }
  // a joint that now passes closes its repair
  for (const x of list) if (x.id.startsWith(`ts-${r.id}-${wl}-`) && !badNow.has(x.id) && x.status !== "closed") { x.status = "closed"; x.closedOn = ymd(S.date); changed = true; }
  if (changed) persist();
  return out;
}
function tsPdfHtml(r) {
  const esc = x => String(x == null ? "" : x).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const L = tsLim(), J = r.joints || [];
  let html = `<div class="pd-head"><img src="${LOGO}" alt="Fibraco"><div><h1>FIBRE TEST REPORT</h1><div>${esc(S.project.name)}</div><div>${esc(r.a)} to ${esc(r.b)}  |  ${esc(r.cores)} cores  |  ${r.m ? esc(r.m) + " m" : "length not set"}</div></div></div>`;
  const meta = tsGet(r.id, "meta");
  if (S.project.adhoc) { const j = S.project.job, kv = (a, b) => b ? `<tr><th>${esc(a)}</th><td>${esc(b)}</td></tr>` : "", pc = (n, c) => [n, c].filter(Boolean).join(", ");
    html += `<h2>Site details</h2><table class="kv">${kv("Site", j.site)}${kv("Address", j.addr)}${j.gps ? kv("GPS", `${j.gps.lat.toFixed(6)}, ${j.gps.lng.toFixed(6)}`) : ""}${kv("Client", j.client)}${kv("Client order or reference", j.ref)}${kv("Client project manager", pc(j.pm, j.pmc))}${kv("Client site manager", pc(j.sm, j.smc))}${kv("Client SHEQ officer", pc(j.sheq, j.sheqc))}${kv("Scope of the test", j.scope)}${kv("Fibraco team", (j.crew || []).join(", "))}${kv("Date", j.date ? dmy(new Date(j.date + "T12:00:00")) : "")}</table>`; }
  html += `<h2>Test details</h2><table class="kv"><tr><th>Tested by</th><td>${esc(meta.by || S.user)}</td></tr><tr><th>${S.project.adhoc ? "Fibraco lead on site" : "Site manager"}</th><td>${esc(smName())}</td></tr></table>`;
  const setRows = Object.entries(TS_SET).filter(([k]) => meta[k] != null && meta[k] !== "" && !(meta.cords === "Off" && (k === "launch" || k === "receive")) && !(meta.thr !== "Custom thresholds" && /^th[A-Z]/.test(k))).map(([k, [lab]]) => `<tr><th>${esc(lab)}</th><td>${esc(meta[k])}</td></tr>`)
    .concat(L.wls.filter(w => meta["ref" + w]).map(w => `<tr><th>OLTS reference at ${w} nm</th><td>${esc(meta["ref" + w])} dBm${meta["refAt" + w] ? ", set " + esc(new Date(meta["refAt" + w]).toLocaleString("en-ZA")) : ""}</td></tr>`));
  if (setRows.length) html += `<h2>Tester settings</h2><table class="kv">${setRows.join("")}</table>`;
  html += `<h2>Equipment used</h2><table class="g"><thead><tr><th>Use</th><th>Make and model</th><th>Serial</th><th>Calibrated</th><th>Certificate</th><th>Status</th></tr></thead><tbody>` +
    [["OTDR", meta.otdr], ["OLTS", meta.olts], ["Splicer", meta.splicer]].filter(x => x[1]).map(([t, id]) => { const e = eqById(id) || {}; return `<tr><td>${t}</td><td>${esc(e.name)}</td><td>${esc(e.serial)}</td><td>${esc(e.cal)}</td><td>${esc(e.cert || "-")}</td><td>${esc(calState(e).t)}</td></tr>`; }).join("") + `</tbody></table>`;
  for (const wl of L.wls.filter(w => ["ab", "ba", "olts"].some(p => JSON.stringify(tsGet(r.id, p)[w] || {}).match(/\d/)))) {
    const an = tsAnalyse(r, wl), ab = (tsGet(r.id, "ab")[wl]) || {}, ba = (tsGet(r.id, "ba")[wl]) || {}, ol = (tsGet(r.id, "olts")[wl]) || {};
    html += `<h2>${wl} nm summary</h2><table class="kv"><tr><th>Cores fully tested</th><td>${an.tested} of ${r.cores}</td></tr><tr><th>Problems</th><td>${an.issues.filter(i => i.sev === "bad").length}</td></tr><tr><th>Mean joint loss (both directions)</th><td>${f3(an.mean)} dB</td></tr><tr><th>Worst joint</th><td>${f3(an.worst)} dB</td></tr><tr><th>Link budget</th><td>${f2(an.budget)} dB</td></tr></table>`;
    html += `<h2>${wl} nm bidirectional result</h2>` + tsGridHtml(r, an, true);
    html += `<h2>${wl} nm readings</h2><table class="g"><thead><tr><th>Core</th>${J.map(j => `<th>${esc(j.name)} A-B</th><th>${esc(j.name)} B-A</th>`).join("")}<th>Total A-B</th><th>Total B-A</th><th>OLTS A-B</th><th>OLTS B-A</th></tr></thead><tbody>` +
      an.cores.map(x => `<tr><th>${x.c}</th>${x.joints.map(j => `<td>${f3(j.a)}</td><td>${f3(j.b)}</td>`).join("")}<td>${f2(x.ta)}</td><td>${f2(x.tb)}</td><td>${f2(x.oa)}</td><td>${f2(x.ob)}</td></tr>`).join("") + `</tbody></table>`;
    const iss = an.issues; html += `<h2>${wl} nm problems and checks</h2>` + (iss.length ? `<table class="g"><tbody>${iss.map(i => `<tr><td>${i.sev === "bad" ? "FIX" : "CHECK"}</td><td>${esc(i.text)}</td></tr>`).join("")}</tbody></table>` : `<p class="none">None</p>`);
  }
  html += `<p class="foot">Pass marks: joint ${L.spliceGood} dB good, ${L.spliceMax} dB maximum, average of both OTDR directions. Link budget = length x attenuation per km + ${L.spliceMax} dB per joint + ${L.conn} dB per connector at each end. Fibraco (Pty) Ltd, Fibraco Field, made ${esc(new Date().toLocaleString("en-ZA"))}.</p>`;
  return { html, title: `FIBRACO - Test Report - ${S.project.short} - ${r.a} to ${r.b} (${dmy(S.date || new Date())})` };
}
async function tsSendPdf(r) {
  const ov = h("div", { class: "overlay", role: "dialog", "aria-label": "Making the PDF" }, h("div", { class: "modal" }, h("h2", {}, "Making the PDF"), h("p", {}, "One moment.")));
  document.body.append(ov);
  try {
    await loadJs("./js/lib/html2canvas.min.js?v=1793021006"); await loadJs("./js/lib/jspdf.umd.min.js?v=1793021006"); await loadJs("./js/pdf.js?v=1793021006");
    const { html, title } = tsPdfHtml(r); const file = await window.FibPdf.diaryPdf(html, title);
    const m = ov.querySelector(".modal"); m.innerHTML = "";
    m.append(h("h2", {}, "Report ready"), h("p", {}, file.name), h("div", { class: "row" }, h("button", { class: "btn-g", type: "button", onclick: () => ov.remove() }, "Close"),
      h("button", { class: "btn-w", type: "button", onclick: async () => { ov.remove(); const res = await window.FibPdf.shareFile(file, `Fibraco test report, ${r.a} to ${r.b}`); if (res === "downloaded") showInfo("PDF saved", `${file.name} is in your Downloads.`); } }, "Share")));
  } catch (e) { ov.remove(); showInfo("Could not make the PDF", "Try again with signal, or tell the office."); }
}

// ---------- QC check sheets: the site manager walks every spot and checks the work (site manager and office only) ----------
// Built from the FOA workmanship guidance (splicing, tray dressing, closures), TIA-568 practice for CAT6a,
// and our own method statements MS-FIB-001 (fibre) and MS-FIB-002 (CAT6a).
// Every item: Pass, Fail or N/A. A Fail needs a comment and goes as a repair to the man who did that work at that spot.
const QC_SHEETS = {
  fibre: { title: "Fibre", sections: [
    ["Manhole and sprague", ["SPRAGUE INSTALLATION (RUNS)"], [
      "Manhole level, lid fitted and closes properly",
      "Cable entries sealed, no soil or water getting in",
      "Sprague fitted from manhole to DB with no kinks or sharp bends",
      "Slack loop coiled neatly in the chamber, no tight bends"]],
    ["Glanding and cable entry", ["GLANDING (M20)"], [
      "M20 gland the right size, tight and sealed",
      "Armour and strength member terminated as per the box instructions",
      "Cable tied and supported inside the DB, no pull on the gland"]],
    ["Box preparation and routing", ["PREP DIN RAIL OR WALL BOX", "PREP AND ROUTE FOC TO BOX", "FIT BOX IN DB (COMMS SPACE)"], [
      "Box firmly mounted, inside the Fibraco 800 x 400 space in the DB",
      "Tubes routed into the box with no kinks, bend radius kept",
      "Gel cleaned off the fibres before splicing"]],
    ["Splicing and tray dressing", ["SPLICE FOC IN SPLICE BOX", "DOME JOINT SPLICING & CLOSURE"], [
      "Every splice has a heat-shrink sleeve, seated in the tray holder",
      "Fibres dressed in the tray, none outside the tray or pinched by the lid",
      "Splicer loss estimate checked on every fibre, high ones re-spliced",
      "Colour code followed, cores in order as per the splice plan",
      "Trays closed, lid fitted, all screws in"]],
    ["Dome joint closure", ["DOME JOINT SPLICING & CLOSURE"], [
      "Closure sealed as per the maker's instructions, cable clamps tight",
      "Closure fixed in place, slack stored neatly"]],
    ["Patch panel, patch leads and SFPs", ["48F PATCH PANEL TERMINATIONS", "PATCH LEADS AND SFPs"], [
      "Connectors cleaned and checked before plugging in",
      "Patch leads routed without tight bends, dust caps on unused ports",
      "SFPs seated, link lights on at the switch"]],
    ["Labelling", ["LABELLING"], [
      "Cable labelled at both ends and in every manhole (Brady)",
      "Splice box and ports labelled as per the label register"]],
    ["Testing", ["OTDR TESTING (BIDIRECTIONAL)", "OLTS FIBRE LINK TESTING"], [
      "OTDR done both directions on every core (see Test sheets)",
      "OLTS done on every core, all within the link budget"]],
    ["Housekeeping", ["CLEAN SITE"], [
      "Offcuts, fibre scraps and packaging removed, fibre scraps in the bin",
      "DB doors closed, area clean and safe"]]] },
  cat: { title: "CAT6a", sections: [
    ["Routing and containment", ["CAT6A CABLE INSTALLATION"], [
      "Cable in tray, trunking or sprague all the way, not loose on the ground",
      "Bend radius kept (at least 4 times the cable diameter), no kinks or crushing",
      "Kept apart from power cables, not tied to them",
      "Cable ties snug, not crushing the cable",
      "Jacket undamaged, no signs of over-pulling"]],
    ["Terminations", ["RJ45 TERMINATIONS"], [
      "Shielded RJ45 used, shield bonded to the connector",
      "Pairs untwisted as little as possible (13 mm maximum)",
      "Same wiring standard at both ends",
      "Strain relief on every connector"]],
    ["Surge protection (only where instructed)", ["DATA SPD INSTALLATION"], [
      "Data SPD fitted and earthed where the client asked for it"]],
    ["Labelling", ["LABELLING"], [
      "Every cable labelled at both ends, matching the cable schedule"]],
    ["Certification", ["CAT6A CERTIFICATION TESTING"], [
      "Every link certified Cat 6A, results saved with the link name",
      "Failed links re-terminated and certified again"]],
    ["Housekeeping", ["CLEAN SITE"], [
      "Offcuts and packaging removed, cabinets closed, area clean"]]] }
};
const qcSpots = sheet => ((S.project.qcSpots || {})[sheet]) || ["Site"];
const qcId = (sheet, spot) => `qc|${S.project.id}|${sheet}|${spot}`;
const qcGet = (sheet, spot) => Store.get(qcId(sheet, spot)) || { items: {} };
function qcCount(sheet, spot) {
  const o = qcGet(sheet, spot), all = QC_SHEETS[sheet].sections.flatMap((s, si) => s[2].map((_, ii) => `${si}.${ii}`));
  const v = all.map(k => (o.items[k] || {}).v), done = v.filter(x => x && x !== "Not yet").length;
  const legacy = o.signed && !all.some(k => (o.items[k] || {}).signedAt); // signed before Not yet existed: was complete
  const full = !!o.signed && (legacy || (done === all.length && all.every(k => (o.items[k] || {}).signedAt)));
  return { total: all.length, done, fail: v.filter(x => x === "Fail").length, later: v.filter(x => x === "Not yet").length, signed: full ? o.signed : null, part: o.signed && !full ? o.signed : null };
}
// who did that work at that spot: from the programme, else the site manager
function qcResp(acts, spot) {
  const plan = S.project.plan || {}; let any = null;
  for (const rows of Object.values(plan)) for (const t of rows) if (acts.includes(t.act)) { const node = (t.key || "").split("|")[1] || "Site"; if (node === spot || (t.loc || "").includes(spot)) return t.who; any = any || t.who; }
  return any || smName();
}
function vQc() {
  S.qc = S.qc || { sheet: "fibre", spot: null };
  const sh = S.qc.sheet, spots = qcSpots(sh);
  const tab = (k, lab) => h("button", { type: "button", class: "ts-tab" + (sh === k ? " on" : ""), onclick: () => { S.qc = { sheet: k, spot: null }; render(); } }, lab);
  const spotCard = sp => { const c = qcCount(sh, sp), col = c.signed ? (c.fail ? "#ff3b3b" : "#39ff14") : c.fail ? "#ff3b3b" : c.done ? "#ffd60a" : "#5b6470";
    return h("button", { type: "button", class: "ts-route", onclick: () => { S.qc.spot = sp; go("qcspot"); } },
      h("div", { style: `width:7px;align-self:stretch;background:${col};border-radius:4px;box-shadow:0 0 8px ${col}` }),
      h("div", { style: "flex:1;text-align:left" }, h("div", { style: "font-weight:900;font-size:15.5px;color:#fff" }, sp),
        h("div", { style: `font-size:13px;font-weight:800;margin-top:3px;color:${col}` }, c.signed ? `Signed ${c.signed.at}${c.fail ? `, ${c.fail} failed` : ", all passed"}` : c.part ? `Part signed ${c.part.at}, ${c.later} not built yet` : `${c.done} of ${c.total} checked${c.fail ? `, ${c.fail} failed` : ""}`)),
      h("div", { style: "color:#aeb6c1;font-size:22px;font-weight:900" }, "›")); };
  return [topbar("QC check sheets", `${S.project.short}  |  site manager`, true),
    h("p", { class: "form-sub" }, "Walk every spot and check the work yourself. Tick Pass, Fail or N/A. A Fail needs a comment and goes as a repair to the man who did that work. Only you and the office see these sheets."),
    h("div", { class: "ts-bar" }, tab("fibre", "Fibre"), tab("cat", "CAT6a")),
    h("div", { class: "ts-list" }, ...spots.map(spotCard))];
}
function vQcSpot() {
  const sh = S.qc.sheet, spot = S.qc.spot, def = QC_SHEETS[sh], id = qcId(sh, spot);
  const o = JSON.parse(JSON.stringify(qcGet(sh, spot))); o.items = o.items || {};
  const save = () => Store.put(id, o);
  // A point is locked once it was signed. Points marked "Not yet" (work not built yet) stay open and are signed later.
  if (o.signed && !Object.values(o.items).some(it => it && it.signedAt)) Object.values(o.items).forEach(it => { if (it && it.v && it.v !== "Not yet") it.signedAt = o.signed.at; });
  const unsigned = () => def.sections.some((s, si) => s[2].some((_, ii) => { const it = o.items[`${si}.${ii}`] || {}; return !it.signedAt; }));
  const locked = !!o.signed && !unsigned();
  const cnt = () => { const c = { total: 0, done: 0, fail: 0, later: 0, open: 0 }; def.sections.forEach((s, si) => s[2].forEach((_, ii) => { c.total++; const it = o.items[`${si}.${ii}`] || {}, v = it.v; if (v && v !== "Not yet") c.done++; if (v === "Not yet") c.later++; if (v === "Fail") c.fail++; if (!it.signedAt && (!v || v === "Not yet")) c.open++; })); return c; };
  const bar = h("div");
  const drawBar = () => { const c = cnt(); bar.replaceChildren(h("div", { style: "display:flex;justify-content:space-between;font-weight:800;font-size:13px;margin-bottom:4px" }, h("span", {}, `${c.done} of ${c.total} checked`), h("span", { style: `color:${c.fail ? "#c8102e" : "#1e8e3e"}` }, c.fail ? `${c.fail} failed` : "No fails")), pill(c.total ? c.done / c.total * 100 : 0, c.fail ? { bg: "#c8102e" } : barColour(c.done / c.total * 100))); };
  drawBar();
  const item = (si, ii, text) => {
    const k = `${si}.${ii}`, it = o.items[k] || (o.items[k] = {});
    const box = h("div", { class: "qc-item" + (it.v === "Fail" ? " fail" : it.v === "Pass" ? " pass" : "") });
    const draw = () => {
      box.className = "qc-item" + (it.v === "Fail" ? " fail" : it.v === "Pass" ? " pass" : it.v === "N/A" ? " na" : it.v === "Not yet" ? " later" : "");
      const btn = v => h("button", { type: "button", class: "qc-btn" + (it.v === v ? " on " + v.replace("/", "").replace(" ", "") : ""), disabled: locked || !!it.signedAt, onclick: () => { it.v = it.v === v ? "" : v; it.by = S.user; it.at = new Date().toISOString(); save(); draw(); drawBar(); } }, v);
      box.replaceChildren(...[h("div", { class: "qc-text" }, text),
        h("div", { class: "qc-btns" }, btn("Pass"), btn("Fail"), btn("N/A"), btn("Not yet")),
        it.v === "Fail" ? h("div", { style: "margin-top:8px" },
          locked || it.signedAt ? h("div", { style: "font-weight:700" }, it.note || "") : h("textarea", { class: "qc-note", placeholder: "What is wrong? The man who did the work gets this.", oninput: e => { it.note = e.target.value; save(); } }, it.note || ""),
          h("div", { style: "font-size:12px;color:#5b6470;margin-top:4px" }, `Goes to ${qcResp(def.sections[si][1], spot)} as a repair when you sign.`),
          locked || it.signedAt ? null : photoBlock(it.photos || (it.photos = []))) : null].filter(Boolean));
    };
    draw(); return box;
  };
  const sign = () => {
    const c = cnt();
    if (c.done + c.later < c.total) return showInfo("Not finished", "Tick every point before you sign. Work that is not built yet: tick Not yet. You sign those points later, when the work is done.");
    const fresh = def.sections.some((s, si) => s[2].some((_, ii) => { const it = o.items[`${si}.${ii}`] || {}; return !it.signedAt && it.v && it.v !== "Not yet"; }));
    if (!fresh) return showInfo("Nothing new to sign", "Only Not yet points are left. Check them when the work is done, then sign.");
    const noNote = def.sections.some((s, si) => s[2].some((_, ii) => { const it = o.items[`${si}.${ii}`] || {}; return it.v === "Fail" && !(it.note || "").trim(); }));
    if (noNote) return showInfo("Comment missing", "Every Fail needs a comment saying what is wrong.");
    mySig(v => { if (!v) return;
      o.signed = { by: S.user, at: new Date().toLocaleString("en-ZA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }), sig: v };
      Object.values(o.items).forEach(it => { if (it && it.v && it.v !== "Not yet" && !it.signedAt) it.signedAt = o.signed.at; });
      (o.signs = o.signs || []).push({ by: S.user, at: o.signed.at }); save();
      // fails go to the man who did the work
      const pid = S.project.id; S.issues[pid] = S.issues[pid] || []; let n = 0;
      def.sections.forEach((s, si) => s[2].forEach((txt, ii) => { const it = o.items[`${si}.${ii}`] || {}; if (it.v !== "Fail") return;
        const iid = `qc-${sh}-${spot}-${si}-${ii}`; if (S.issues[pid].some(x => x.id === iid && x.status === "open")) return;
        S.issues[pid].push({ id: iid, title: `QC failed at ${spot}: ${s[0]}`, detail: `${txt}. ${it.note}`, found: S.user, foundOn: ymd(S.date || new Date()), resp: qcResp(s[1], spot), status: "open" }); n++; }));
      const left = cnt().later; persist(); showInfo("Signed", (n ? `${n} fail${n > 1 ? "s" : ""} sent as repairs to the men who did the work.` : "Everything you checked passed.") + (left ? ` ${left} point${left > 1 ? "s" : ""} not built yet stay open. Come back and sign them when the work is done.` : "")); goBack(); });
  };
  return [topbar(`${def.title} QC: ${spot}`, `${S.project.short}  |  ${dmy(S.date || new Date())}`, true),
    h("div", { class: "sheet", style: "padding:10px 12px" }, bar),
    ...def.sections.map((s, si) => sheet("", h("div", { class: "band" }, s[0]), ...s[2].map((t, ii) => item(si, ii, t)))),
    o.signed && !locked ? h("div", { style: "text-align:center;font-weight:700;margin:12px 0 4px;color:#8a4b00" }, `Part signed by ${o.signed.by}, ${o.signed.at}. Points marked Not yet are still open.`) : null,
    locked ? h("div", { style: "text-align:center;font-weight:800;margin:12px 0;color:#1e8e3e" }, `Signed by ${o.signed.by}, ${o.signed.at}`) : h("button", { class: "submit", type: "button", onclick: sign }, o.signed ? "Sign the points done since" : "Sign what is checked")];
}

// ---------- Wanro's dashboard (office only) ----------
// One charcoal block per project, then the office block. Colour first, words second.
const CH = { bg: "#262a30", line: "rgba(255,255,255,.12)", soft: "#aeb6c1" };
function dashStatus(st) {
  const late = new Date().getHours() >= 17;
  const m = { approved: ["APPROVED", "#1e8e3e"], submitted: ["SUBMITTED", "#0069aa"], returned: ["SENT BACK", "#c8102e"], draft: [late ? "NOT IN" : "NOT IN YET", late ? "#c8102e" : "#f29900"] };
  const [t, c] = m[st] || m.draft; return { t, c };
}
function dashProject(p, d) {
  const saveP = S.project, saveD = S.date; S.project = p; S.date = d;
  try {
    const k = dayKey(); ensureDay(k);
    const alloc = S.alloc[k] || [], secs = S.sections[k] || {};
    const people = [...new Set(alloc.map(a => a.who))];
    const head = h("div", { style: "display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap;padding:14px 14px 10px" },
      h("div", { style: "font-weight:900;font-size:17px;letter-spacing:.04em;color:#fff" }, p.short.toUpperCase()), h("div", { style: `font-size:12.5px;color:${CH.soft};font-weight:700` }, dayLab ? dayLab(d) : dmy(d)));
    const testing = dashTesting(p);
    if (!people.length) return h("div", { class: "dash-block" }, head, h("div", { style: `padding:0 14px 14px;color:${CH.soft};font-size:13.5px` }, "No work loaded for today."), ...testing);
    const sub = people.filter(n => ["submitted", "approved"].includes((secs[n] || {}).status)).length;
    const signed = S.final[k];
    const pctAll = (() => { let t = 0, dn = 0; people.forEach(n => { const x = todayFor(n); if (x.filled) { t += x.target; dn += x.done; } }); return t ? Math.round(dn / t * 100) : null; })();
    const summary = h("div", { style: "display:flex;gap:8px;flex-wrap:wrap;padding:0 14px 12px" },
      h("span", { class: "dash-chip", style: `background:${sub === people.length ? "#1e8e3e" : new Date().getHours() >= 17 ? "#c8102e" : "#f29900"}` }, `${sub} of ${people.length} diaries in`),
      h("span", { class: "dash-chip", style: `background:${signed ? "#1e8e3e" : "#5b6470"}` }, signed ? `Signed ${signed}` : "Not signed yet"),
      (() => { const ppl = attPeople(p), n = ppl.filter(x => (attGet(p, d, x) || {}).in).length; return h("span", { class: "dash-chip", style: `background:${n === ppl.length ? "#1e8e3e" : n ? "#f29900" : "#c8102e"}` }, `Register ${n} of ${ppl.length}`); })(),
      pctAll != null ? h("span", { class: "dash-chip", style: `background:${barColour(pctAll).bg};color:${barColour(pctAll).fg}` }, `Output ${pctAll}%`) : null,
      p.qcSpots ? (() => { const all = Object.keys(QC_SHEETS).flatMap(k => qcSpots(k).map(sp => qcCount(k, sp))), sg = all.filter(c => c.signed).length, fl = all.filter(c => c.fail).length;
        return h("span", { class: "dash-chip", style: `background:${fl ? "#c8102e" : sg ? "#1e8e3e" : "#5b6470"}` }, `QC ${sg} of ${all.length} spots signed${fl ? `, ${fl} with fails` : ""}`); })() : null);
    const rows = people.map(n => {
      const sec = secs[n] || {}, t = todayFor(n), sc = schedFor(n);
      const st = (sec.status || "draft") === "draft" && t.filled ? { t: "FILLED, NOT SENT", c: "#f29900" } : dashStatus(sec.status || "draft");
      // to date counts today only once he has filled it in, so a man is not shown behind before his day is over
      const planTD = sc ? sc.plan - (t.filled ? 0 : t.target) : 0;
      const tp = t.filled && t.target ? t.done / t.target * 100 : null, wp = sc && planTD > 0 ? sc.done / planTD * 100 : null;
      const where = x => x.loc ? ` at ${x.loc.split(",")[0]}` : "";
      const lead = tp != null ? barColour(tp).bg : wp != null ? barColour(wp).bg : st.c;
      const bar = (lab, pct, txt) => h("div", { style: "display:flex;gap:8px;align-items:center;margin-top:6px" },
        h("div", { style: `width:44px;font-size:11px;font-weight:800;color:${CH.soft};letter-spacing:.04em` }, lab),
        pct == null ? h("div", { style: "flex:1;height:22px;border-radius:11px;background:#3a3f47;display:flex;align-items:center;justify-content:center;font-size:11.5px;color:#aeb6c1;font-weight:700" }, txt) : pill(pct, barColour(pct)));
      return h("div", { style: `display:flex;border-top:1px solid ${CH.line}` },
        h("div", { style: `width:7px;flex:none;background:${lead}` }),
        h("div", { style: "flex:1;min-width:0;padding:10px 12px" },
          h("div", { style: "display:flex;justify-content:space-between;gap:8px;align-items:center" },
            h("div", { style: "font-weight:800;font-size:15px;color:#fff" }, n),
            h("span", { class: "dash-chip", style: `background:${st.c}` }, st.t)),
          (() => { const a = attGet(p, d, n) || {}; return h("div", { style: `margin-top:4px;font-size:12px;font-weight:700;color:${a.in ? CH.soft : "#ff8a80"}` }, a.in ? `Register: in ${a.in}${a.out ? `, out ${a.out}` : ""}` : "Register: not signed in"); })(),
          bar("TODAY", tp, t.filled ? "No target" : "Not in yet"),
          bar("TO DATE", wp, "No history yet"),
          ...t.short.map(x => h("div", { style: `margin-top:6px;font-size:12.5px;font-weight:800;color:${x.t.crit ? "#ff5c5c" : "#ff8a80"}` }, `${x.t.crit ? "CRITICAL NOT DONE" : "Not done"}: ${nice2(x.t.act)}${where(x.t)}, ${x.d} of ${x.t.target} ${x.t.unit || ""}`)),
          t.extra.length ? h("div", { style: "margin-top:4px;font-size:12.5px;color:#9be59b;font-weight:700" }, `Extra: ${t.extra.map(x => `${nice2(x.t.act)} +${x.x}`).join(", ")}`) : null,
          t.other.length ? h("div", { style: `margin-top:4px;font-size:12.5px;color:${CH.soft};font-weight:700` }, `Other work: ${t.other.map(o => `${nice2(o.act)} at ${o.loc}, ${o.qty !== undefined && o.qty !== "" ? o.qty + " " + (o.unit || "") : "qty by site manager"}`).join(", ")}`) : null,
          t.why ? h("div", { style: `margin-top:4px;font-size:12px;color:${CH.soft}` }, `Reason given: ${t.why}`) : null));
    });
    return h("div", { class: "dash-block" }, head, summary, ...rows, ...testing);
  } finally { S.project = saveP; S.date = saveD; }
}
// Test sheets and open repairs for one project on the dashboard. Tap a section to open its sheet.
function dashTesting(p) {
  const out = [];
  const sub = (t) => h("div", { style: `padding:12px 14px 6px;border-top:1px solid ${CH.line};font-weight:900;font-size:13px;letter-spacing:.08em;color:${CH.soft}` }, t);
  const row = (col, title, txt, onclick) => h("div", { style: `display:flex;border-top:1px solid ${CH.line};cursor:pointer`, onclick },
    h("div", { style: `width:7px;flex:none;background:${col};box-shadow:0 0 8px ${col}` }),
    h("div", { style: "flex:1;min-width:0;padding:10px 12px" }, h("div", { style: "font-weight:800;font-size:14.5px;color:#fff" }, title), h("div", { style: `font-size:12.5px;font-weight:800;margin-top:2px;color:${col === "#5b6470" ? CH.soft : col}` }, txt)),
    h("div", { style: `align-self:center;padding-right:12px;color:${CH.soft};font-size:20px;font-weight:900` }, "›"));
  if (p.routes) {
    const routes = tsRoutes().filter(r => !r.practice), sums = routes.map(r => ({ r, s: tsSummary(r) }));
    const n = sums.reduce((a, x) => a + x.s.n, 0), t = sums.reduce((a, x) => a + x.s.tested, 0), b = sums.reduce((a, x) => a + x.s.bad, 0);
    out.push(sub(`TEST SHEETS  |  ${t} OF ${n} CORES TESTED${b ? `  |  ${b} WITH A PROBLEM` : ""}`));
    sums.forEach(({ r, s }) => out.push(row(s.col, `${r.a} to ${r.b}`, s.bad ? `${s.bad} core${s.bad > 1 ? "s" : ""} with a problem, ${s.tested} of ${s.n} tested` : s.tested === s.n ? "All cores tested and passed" : s.tested ? `${s.tested} of ${s.n} cores tested` : "Not tested yet",
      () => { S.project = p; S.ts = { rid: r.id, wl: tsLim().wls[0], tab: "ab" }; S.hist.push(S.view); S.hist.push("tsheets"); S.view = "tsheet"; render(); window.scrollTo(0, 0); })));
  }
  const byId = {}; Store.list(`issue|${p.id}|`).forEach(([, o]) => { byId[o.id] = o; }); (S.issues[p.id] || []).forEach(o => { byId[o.id] = o; });
  const open = Object.values(byId).filter(x => x.status === "open");
  if (open.length) {
    out.push(sub(`REPAIRS OPEN  |  ${open.length}`));
    open.forEach(x => out.push(row("#ff3b3b", x.title, `${x.resp || "Not given to anyone"}  |  found by ${x.found || "-"} on ${(x.foundOn || "-").split("-").reverse().join("-")}`, () => showInfo(x.title, `${x.detail || ""} Given to ${x.resp || "-"}. Found by ${x.found || "-"} on ${x.foundOn || "-"}.`))));
  } else if (p.routes || p.qcSpots) out.push(sub("REPAIRS OPEN  |  NONE"));
  return out;
}
function vDash() {
  const d = today();
  if (!DEVS) refreshDevices(true).then(() => { if (S.view === "dash") render(); });
  const notIn = [];
  for (const p of PROJECTS) {
    const k = p.id + "|" + ymd(d); ensureDay(k);
    const secs = S.sections[k] || {};
    [...new Set((S.alloc[k] || []).map(a => a.who))].forEach(n => { if (!["submitted", "approved"].includes((secs[n] || {}).status)) notIn.push(`${n} (${p.short})`); });
  }
  const waiting = DEVS ? DEVS.filter(x => x.status === "pending" && x.dev).length : null;
  const noImei = DEVS ? DEVS.filter(x => x.status === "active" && x.dev).filter(x => { const pr = PEOPLE.find(q => q.id === x.member_id) || {}; return !pr.admin && !(Store.get(`phreg|${x.member_id}|${x.dev}`) || {}).imei; }).length : null;
  const alerts = Store.list("alert|").map(([, o]) => o).filter(a => (a.at || "").slice(0, 10) === ymd(d)).length;
  const line = (col, big, txt, onclick) => h("div", { style: `display:flex;gap:12px;align-items:center;padding:12px 14px;border-top:1px solid ${CH.line}${onclick ? ";cursor:pointer" : ""}`, onclick },
    h("div", { style: `width:14px;height:14px;border-radius:7px;flex:none;background:${col}` }),
    h("div", { style: "font-weight:900;font-size:18px;color:#fff;min-width:28px" }, big),
    h("div", { style: "font-size:13.5px;color:#e8ebef;flex:1" }, txt));
  const office = h("div", { class: "dash-block" },
    h("div", { style: "padding:14px 14px 10px;font-weight:900;font-size:17px;letter-spacing:.04em;color:#fff" }, "OFFICE"),
    line(notIn.length ? (new Date().getHours() >= 17 ? "#c8102e" : "#f29900") : "#1e8e3e", String(notIn.length), notIn.length ? `Diaries not in yet: ${notIn.join(", ")}` : "Every diary for today is in."),
    line(alerts ? "#c8102e" : "#1e8e3e", String(alerts), alerts ? "Emergency alerts today. Open the alerts at the top of Projects." : "No emergency alerts today."),
    line(waiting == null ? "#5b6470" : waiting ? "#f29900" : "#1e8e3e", waiting == null ? "-" : String(waiting), waiting == null ? "Phones: needs signal to check." : waiting ? "Phones waiting for you to allow or block. Tap to open." : "No phones waiting.", waiting ? () => go("devices") : null),
    line(noImei == null ? "#5b6470" : noImei ? "#f29900" : "#1e8e3e", noImei == null ? "-" : String(noImei), noImei == null ? "IMEI register: needs signal to check." : noImei ? "Phones in use with no IMEI recorded. Tap to add." : "Every phone in use has its IMEI recorded.", noImei ? () => go("devices") : null));
  return [topbar("Dashboard", `Office only  |  ${dmy(d)}`, true),
    h("div", { style: "display:flex;gap:10px;flex-wrap:wrap;font-size:12px;color:#5b6470;margin:2px 2px 12px;align-items:center" },
      ...[["#c8102e", "Behind"], ["#f29900", "Slipping"], ["#e0c200", "Nearly"], ["#3a9d23", "On target or ahead"]].map(([c, t]) => h("span", { style: "display:inline-flex;gap:5px;align-items:center" }, h("span", { style: `width:12px;height:12px;border-radius:6px;background:${c};display:inline-block` }), t))),
    h("button", { class: "mbtn tz-btn", onclick: timeZone }, "TIME ZONE", h("small", {}, "Snapshot of everything right now, for Claude to review")),
    ...PROJECTS.map(p => dashProject(p, d)),
    office,
    h("button", { class: "mbtn ghost", style: "margin-top:4px", onclick: () => { Store.kick && Store.kick(); refreshDevices(true).finally(() => render()); } }, "Refresh")];
}
function vFeedback() {
  const list = Store.list("fb|").map(([, o]) => o).sort((a, b) => a.at < b.at ? 1 : -1);
  return [topbar("Feedback", "From the team", true),
    ...list.map(f => sheet("", h("div", { style: "padding:10px 12px;font-size:13px" }, h("b", {}, `${f.who}  |  ${f.project || "-"}  |  ${f.view}`), h("div", { style: "color:#5b6470;font-size:12px" }, new Date(f.at).toLocaleString("en-ZA")), h("div", { style: "margin-top:6px" }, f.text))))];
}

// ---------- boot ----------
let CFG = null;
const PIN_WARN = () => [h("b", { style: "color:#c8102e;font-weight:900;font-size:15px" }, "REMEMBER THIS PIN."), " You must type it every time you open the app. If you forget it, the office has to reset it for you."];
const screen = (...kids) => { app.replaceChildren(h("div", { class: "lock" }, h("img", { src: LOGO, alt: "Fibraco", style: "width:220px;max-width:70%;margin:30px auto 18px;display:block" }), ...kids)); };
function pinPad(title, sub, onDone, warn, extra) {
  let v = ""; const dots = h("div", { class: "pin-dots" }); const msg = h("p", { class: "pin-msg" }, sub || "");
  const draw = () => dots.replaceChildren(...[0, 1, 2, 3].map(i => h("i", { class: i < v.length ? "on" : "" })));
  const press = d => { if (d === "del") v = v.slice(0, -1); else if (v.length < 4) v += d; draw(); if (v.length === 4) { const x = v; v = ""; setTimeout(() => { draw(); onDone(x, m => { msg.textContent = m; }); }, 120); } };
  draw();
  screen(h("h1", { class: "big", style: "text-align:center" }, title), msg, dots,
    warn ? h("div", { class: "pin-warn", role: "note" }, ...[].concat(typeof warn === "function" ? warn() : warn)) : null,
    h("div", { class: "pin-pad" }, ...["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"].map(d => d ? h("button", { type: "button", onclick: () => press(d), "aria-label": d === "del" ? "Delete" : d }, d === "del" ? "⌫" : d) : h("span"))), extra || null);
}

// ---------- fingerprint ----------
function FP_ICON() {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg"); s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("width", "44"); s.setAttribute("height", "44"); s.setAttribute("aria-hidden", "true");
  s.innerHTML = '<g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M6.5 4.8A9 9 0 0 1 20.6 9"/><path d="M3.6 9.4A9 9 0 0 1 4.9 6.5"/><path d="M5 13.5c0-4 3.1-7 7-7s7 3 7 7v.5"/><path d="M8 20c-1-1.8-1.5-3.8-1.5-6.3 0-3.1 2.4-5.4 5.5-5.4s5.5 2.3 5.5 5.4"/><path d="M12 11.3c1.7 0 3 1.2 3 3 0 2.8.7 4.8 1.6 6.2"/><path d="M9.2 14.3c0-1.6 1.2-3 2.8-3"/><path d="M11.1 21c-1.1-2-1.6-4.3-1.6-6.7"/><path d="M12 14.3c0 3 .6 5.4 2 7.2"/><path d="M18.9 17.4c-.2-.9-.3-1.9-.3-3"/></g>';
  return s;
}
async function offerBio() {
  try {
    if (!savedSig() || await Store.hasBio() || !(await Store.bioAvailable())) return;
    if (await Store.readLocal("bioNo")) return;
    askYesNo("Open with your fingerprint?", "Next time you can open Fibraco with your fingerprint instead of typing your PIN. If the fingerprint does not work, you type your PIN as always.", "Yes, use fingerprint", bioSetup);
  } catch (e) {}
}
async function bioSetup() {
  try { await Store.bioEnroll(S.user || "Fibraco"); await Store.keepLocal("bioNo", null); showInfo("Fingerprint is on", "Next time Fibraco asks for your fingerprint first. Your PIN still works."); }
  catch (e) {
    if (e && e.noprf) { await Store.keepLocal("bioNo", 1); return showInfo("Not on this phone", "This phone cannot use the fingerprint for Fibraco. Keep using your PIN."); }
    showInfo("Fingerprint not set up", "It did not finish. You can try again at the bottom of the Projects screen.");
  }
}
const centre = t => h("p", { style: "text-align:center;padding:0 20px" }, t);
async function removed(title, text) {
  await Store.wipe();
  screen(h("h1", { class: "big", style: "text-align:center" }, title), centre(text), centre("Everything the app kept on this device has been cleared."));
}
let waitT = 0;
function waiting() {
  clearTimeout(waitT);
  screen(h("h1", { class: "big", style: "text-align:center" }, "Waiting for approval"),
    centre("This link is already in use on another device. The office must approve this phone or laptop before it can open anything."),
    centre("Ask the office to approve it. This screen checks again by itself."),
    h("div", { style: "text-align:center;margin-top:16px" }, h("button", { class: "btn-w", type: "button", style: "padding:12px 22px", onclick: () => startApp() }, "Check again")));
  waitT = setTimeout(startApp, 20000);
}
async function startApp() {
  clearTimeout(waitT); guardBack();
  Store.config(CONF);
  screen(centre("Opening..."));
  let me = Store.me();
  try { me = await Store.whoami(); }
  catch (e) {
    if (e.status) return screen(h("h1", { class: "big", style: "text-align:center" }, "Link not active"), centre("This link is not recognised. Ask the office for a new one."));
    if (!me || me.status !== "active" || !Store.hasFiles()) return screen(centre("Connect to signal once so the app can check your link."), h("div", { style: "text-align:center;margin-top:16px" }, h("button", { class: "btn-w", type: "button", style: "padding:12px 22px", onclick: () => startApp() }, "Try again")));
  }
  if (me.status === "pending") return waiting();
  if (me.status === "blocked") return removed("Device removed", "The office has removed this device from Fibraco Field.");
  if (me.status === "off") return removed("Access switched off", "The office has switched off this link.");
  try { CFG = await Store.loadSetup("setup.bin"); }
  catch (e) { return screen(centre("The app could not open its project setup. Connect to signal once and try again.")); }
  PEOPLE = CFG.people; RAMS_D = CFG.rams || {};
  const person = PEOPLE.find(p => p.id === me.member);
  if (!person) return screen(h("p", { style: "text-align:center" }, "Your name is not set up yet. Ask the office."));
  CREW = PEOPLE.map(p => [p.name, p.role]); USERS = CREW.map(c => c[0]); ROLE = Object.fromEntries(CREW); STAFF = USERS;
  S.user = person.name;
  PROJECTS = CFG.projects.filter(p => p.active !== false && (p.team[S.user] || person.admin));
  for (const p of PROJECTS) if (p.acts) { ACT[p.area] = p.acts; }
  AREAS = Object.keys(ACT);
  for (const [id] of Store.list("form|")) { const x = id.split("|"); S.done[x[1] + "|" + x[2]] = true; }
  for (const [id, o] of Store.list("final|")) { const x = id.split("|"); S.done[x[1] + "|" + x[2]] = true; }
  for (const [id, o] of Store.list("sec|")) { const x = id.split("|"); if (["submitted", "approved"].includes(o.status)) S.done[x[1] + "|" + x[2]] = true; }
  for (const [id, o] of Store.list("")) lastSaved.set(id, J(o));
  S.view = "projects"; S.hist = [];
  // every person has one saved signature. On a new phone, fetch it first before asking for a new one.
  if (!savedSig() && Store.online()) { screen(centre("Opening...")); await Store.sync(); }
  morningChecks();
  if (!savedSig()) setupSignature(() => { render(); });
  else render();
  Store.sync();
  setInterval(() => Store.sync(), 30000);
  if (me.admin) { refreshDevices(true); setInterval(() => refreshDevices(), 30000); }
  setTimeout(offerDraft, 600); setTimeout(processMailQ, 5000);
}
// Ask the phone to keep the app's data for good, so Chrome never clears it to free up space.
try { if (navigator.storage && navigator.storage.persist) navigator.storage.persisted().then(p => { if (!p) navigator.storage.persist(); }); } catch (e) {}
// The Samsung browser keeps losing the app's data, so each time the link is opened it counts as a new phone.
// A personal link is only set up in Chrome.
function useChrome() {
  const link = location.href, box = h("textarea", { readonly: true, style: "width:100%;height:84px;font-size:13px;margin-top:8px" }, link);
  const copy = h("button", { class: "btn-w", type: "button", style: "padding:12px 22px", onclick: () => {
    const done = () => { copy.textContent = "Copied. Now open Chrome"; };
    try { navigator.clipboard.writeText(link).then(done, () => { box.select(); document.execCommand("copy"); done(); }); } catch (e) { box.select(); document.execCommand("copy"); done(); }
  } }, "Copy my link");
  screen(h("h1", { class: "big", style: "text-align:center" }, "Open this in Chrome"),
    centre("The Samsung browser does not keep the app, so it asks for approval again every time. Fibraco Field must be set up in Google Chrome."),
    h("div", { style: "text-align:center;margin-top:12px" }, copy),
    h("ol", { style: "padding:0 22px 0 40px;line-height:1.6" },
      h("li", {}, "Tap Copy my link."), h("li", {}, "Open Google Chrome."), h("li", {}, "Paste the link at the top and tap Go."),
      h("li", {}, "Choose your PIN and tap Put Fibraco on my phone."), h("li", {}, "From then on, only open the app from the Fibraco icon.")),
    box);
}
async function boot() {
  if (Store.hasLink() && /SamsungBrowser/i.test(navigator.userAgent)) return useChrome();
  if (Store.hasLink()) {
    let first = null;
    const ask = (t, s) => pinPad(t, s, (pin, say) => {
      if (!first) { first = pin; return ask("Type it again", "To make sure you remember it."); }
      if (pin !== first) { first = null; return ask("Choose a 4 digit PIN", "The two PINs did not match. Try again."); }
      Store.setupFromLink(pin).then(startApp).then(offerBio);
    }, PIN_WARN);
    return ask("Choose a 4 digit PIN", "Welcome to Fibraco Field.");
  }
  if (await Store.hasSaved()) {
    const bio = await Store.hasBio();
    let busy = false;
    const useBio = async () => { if (busy) return; busy = true;
      try { if (await Store.bioUnlock()) { busy = false; return startApp(); } } catch (e) { if (e && e.name !== "NotAllowedError") toast("Fingerprint did not work. Type your PIN."); }
      busy = false; };
    const fp = bio ? h("button", { class: "bio-btn", type: "button", "aria-label": "Use fingerprint", onclick: useBio }, FP_ICON(), h("span", {}, "Use fingerprint")) : null;
    if (bio) setTimeout(useBio, 350);
    return pinPad("Type your PIN", bio ? "Or touch the fingerprint below." : "", (pin, say) => Store.unlock(pin).then(async ok => {
      if (ok === true) { await startApp(); return offerBio(); }
      const left = 10 - ok;
      if (left <= 0) { await Store.wipe(true); return screen(h("h1", { class: "big", style: "text-align:center" }, "App cleared"), centre("The PIN was wrong 10 times, so the app cleared itself on this phone."), centre("Ask the office to set it up again on this phone.")); }
      say(left <= 3 ? `Wrong PIN. ${left} ${left === 1 ? "try" : "tries"} left before the app clears itself on this phone.` : ok >= 3 ? "Wrong PIN. Forgot it? Ask the office to reset it." : "Wrong PIN. Try again.");
    }), null, fp);
  }
  screen(h("h1", { class: "big", style: "text-align:center" }, "Fibraco Field"), h("p", { style: "text-align:center;padding:0 20px" }, "Open the app with your personal link from WhatsApp. It only works for you."));
}
let hiddenAt = 0;
document.addEventListener("visibilitychange", () => {
  if (document.hidden) hiddenAt = Date.now();
  else { if (hiddenAt && Date.now() - hiddenAt > 10 * 60e3 && CFG) location.reload(); else Store.kick(); }
});
const _render = render;
render = function () { _render(); if (S.view === "claude") return;
  // on the tile screens the button sits under EMERGENCY instead of floating over it
  const fb = feedbackButton(); if (TILES() && ["projects", "menu"].includes(S.view)) fb.classList.add("fb-inline"); app.append(fb); };
const splash = document.getElementById("splash");
const leave = () => { splash.hidden = true; };
splash.addEventListener("click", leave);
splash.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") leave(); });
setTimeout(leave, 1500);
// Updates: when a new version of the app arrives, the phone switches to it by itself.
// It never reloads in the middle of a form, only on the main screen or the PIN screen.
let updateReady = false;
// Only switch when nobody is looking (app in the background) or before he has typed his PIN, so nobody gets kicked out.
function applyUpdate() { if (!updateReady) return; const busy = FORM_VIEWS.includes(S.view) && S.formDirty; if (!CFG || (document.visibilityState === "hidden" && !busy)) { updateReady = false; location.reload(); } else if (document.visibilityState !== "hidden") updateBar(); }
// While he is busy in the app, a green bar at the top offers the new version. He taps it when it suits him.
function updateBar() {
  if (document.getElementById("updbar")) return;
  document.body.append(h("button", { id: "updbar", type: "button", class: "updbar", onclick: () => { try { tsFlush(); } catch (e) {} setTimeout(() => location.reload(), 400); } }, "New version of the app is ready. Tap here to update.", h("small", {}, "Finish what you are typing first. You type your PIN again after.")));
}
document.addEventListener("visibilitychange", applyUpdate);

// Pull down on a page to fetch the latest from the server. This never reloads the app, so nobody is sent back to the PIN screen.
(() => {
  let y0 = null, armed = false;
  addEventListener("touchstart", e => { y0 = CFG && window.scrollY <= 0 && !document.querySelector(".overlay") ? e.touches[0].clientY : null; armed = false; }, { passive: true });
  addEventListener("touchmove", e => { if (y0 != null && !armed && e.touches[0].clientY - y0 > 110) { armed = true; toast("Getting the latest..."); } }, { passive: true });
  addEventListener("touchend", () => {
    if (!armed) { y0 = null; return; }
    armed = false; y0 = null;
    try { Store.kick(); } catch (e) {}
    const done = () => { render(); toast(Store.online() ? "Up to date" : "No signal. Showing what is on the phone."); };
    if (["dash", "devices"].includes(S.view)) refreshDevices(true).finally(() => setTimeout(done, 800)); else setTimeout(done, 1500);
  }, { passive: true });
})();
if ("serviceWorker" in navigator && location.protocol === "https:") {
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).then(reg => {
    const check = () => reg.update().catch(() => {});
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") check(); });
    setInterval(check, 30 * 60e3);
  }).catch(() => {});
  navigator.serviceWorker.addEventListener("controllerchange", () => { if (!hadController) return; updateReady = true; applyUpdate(); });
  setInterval(applyUpdate, 5000);
}
boot();
})();
