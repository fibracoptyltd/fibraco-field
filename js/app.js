
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

// ---------- signature ----------
function sigCell(get, set, label) {
  const b = h("button", { type: "button", class: "sigbox", "aria-label": label || "Sign" });
  const draw = () => { const v = get(); b.replaceChildren(v ? h("img", { src: v, alt: "Signature" }) : "Tap to sign"); };
  b.onclick = () => openSig(label || "Signature", v => { set(v); draw(); });
  draw(); return b;
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
function vProjects() {
  return [topbar("Fibraco", S.user, false), h("div", { class: "who" }, h("span", {}, "Signed in as ", h("b", {}, S.user), ` (${ROLE[S.user]})`), null),
    ...(alertsBanner() || []),
    h("h1", { class: "big" }, "Projects"),
    h("div", { class: "stack" },
      h("button", { class: "mbtn red-text", onclick: () => { S.project = null; startForm("inspection"); } }, "Site inspection", h("small", {}, "For new work and client site visits")),
      PROJECTS.map(p => h("button", { class: "mbtn", onclick: () => { S.project = p; S.month = today(); go("calendar"); } }, p.name, h("small", {}, roleLabel(roleIn(S.user, p)))))),
    h("p", { class: "note" }, "Only your active projects show here. When a project closes, the office removes it."),
    h("div", { style: "text-align:center;margin-top:14px" }, h("button", { class: "btn-g", type: "button", style: "padding:8px 14px;font-size:13px", onclick: changePin }, "Change my PIN"))];
}
function changePin() {
  let oldPin = null, first = null;
  const back = () => { render(); };
  const cancel = h("div", { style: "text-align:center;margin-top:10px" }, h("button", { class: "btn-g", type: "button", style: "padding:8px 14px", onclick: back }, "Cancel"));
  const step = (t, s, fn) => { pinPad(t, s, fn); document.querySelector(".lock").append(cancel); };
  const askOld = s => step("Type your current PIN", s, pin => { oldPin = pin; askNew(""); });
  const askNew = s => step("Choose a new PIN", s, pin => { first = pin; step("Type it again", "To make sure.", pin2 => {
    if (pin2 !== first) return askNew("The two PINs did not match. Try again.");
    Store.changePin(oldPin, first).then(ok => { if (!ok) return askOld("Wrong PIN. Try again."); back(); showInfo("PIN changed", "Use the new PIN from now on."); });
  }); });
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
function vMenu() {
  const d = S.date;
  const later = (name, what) => h("button", { class: "mbtn later", onclick: () => showInfo(name, what) }, name);
  return [topbar(S.project.short, nice(d), true), projCard(S.project), todayCard(),
    h("div", { class: "stack" },
      h("button", { class: "mbtn", onclick: () => isMgr(S.user) ? go("review") : go("mysection") }, "Daily diaries", h("small", {}, isSM(S.user) ? "Check the crew, add your part, sign" : isMgr(S.user) ? "See how the day is going" : "Fill in my section for today")),
      h("button", { class: "mbtn", onclick: () => startForm("dsti") }, "DSTI"),
      h("button", { class: "mbtn", onclick: () => go("inspections") }, "Daily inspections", h("small", {}, "Toolbox talk, PPE, vehicle, ladder, harness, first aid and more")),
      h("button", { class: "mbtn", onclick: () => go("tests") }, S.project.kind === "turbines" ? "Turbines" : S.project.kind === "opgw" ? "Joint repair and tests" : "Cable tests", h("small", {}, S.project.kind === "turbines" ? "Splice box, patch panel, tests and checklist per turbine" : S.project.kind === "opgw" ? "Permit, joint box, re-splice, OTDR and OLTS" : "Drum, DIT, after install, control and witness tests")),
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
  if (type === "incident") Object.assign(base, { time: "", types: [], acts: [], where: "", people: [{}], what: "", wit: "", sig: "" });
  if (type === "si") Object.assign(base, { by: "", co: "", kind: "", ref: "", text: "", cost: "", sigC: "", sigF: "" });
  if (type === "order") Object.assign(base, { need: "", reason: "", items: [{}, {}, {}], notes: "", sig: "" });
  if (type === "diary") Object.assign(base, {
    applicable: S.project && S.project.area ? S.project.area : "", start: "07h00", end: "17h00", weather: "", w: {},
    team: [{ name: S.user, hrs: "" }, {}, {}, {}, {}, {}],
    desig: Object.fromEntries(DESIGNATIONS.map(d => [d, ""])),
    plant: Object.fromEntries(PLANT.map(p => [p, ""])), equip: Object.fromEntries(EQUIPMENT.map(p => [p, ""])),
    acts: Array.from({ length: 4 }, () => ({ area: S.project && S.project.area || "" })),
    sched: "", schedWhy: "", written: "", verbal: "", mats: [{}, {}, {}], delays: [{}, {}, {}], clientRep: "", sigF: "", sigC: "" });
  if (type === "dsti") Object.assign(base, { task: "", ms: "", tbt: "", hz: {}, ppe: [], ack: OCCUPATIONS.map(o => ({ occ: o, name: "", sig: "" })), assessor: S.user, sigA: "" });
  if (type === "inspection") Object.assign(base, { company: "", contact: "", number: "", email: "", acts: [{ sow: "", comments: "", photos: [] }] });
  S.form = base; go(type);
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
    rowsTable("", ["No", "Delays (weather, strikes, access etc.)", "Time lost"], f.delays, (r, i) => h("tr", {}, h("td", { class: "no" }, i + 1), h("td", {}, inp("text", r.c, v => r.c = v, "Cause")), h("td", { style: "width:96px" }, inp("text", r.t, v => r.t = v, "Hrs"))), "+ Add delay", () => ({})),
    sheet("", h("div", { class: "band" }, "Photo diary"), photoBlock(f.photos)),
    f.combined ? h("p", { class: "hint" }, "No signature here. You sign once, in step 3 on the review page. The client signs on his own link the next morning.") : sheet("", h("div", { class: "band" }, "Representative"), h("table", {}, h("thead", {}, h("tr", {}, h("th", {}, ""), h("th", {}, "Fibraco rep"), h("th", {}, "Client rep"))), h("tbody", {},
      h("tr", {}, h("td", { class: "lab", style: "width:24%" }, "Name"), h("td", { class: "ro" }, f.user), h("td", {}, inp("text", f.clientRep, v => f.clientRep = v, "Client name"))),
      h("tr", {}, h("td", { class: "lab" }, "Signature"), h("td", {}, sigCell(() => f.sigF, v => f.sigF = v, "Fibraco rep signature")), h("td", {}, sigCell(() => f.sigC, v => f.sigC = v, "Client rep signature")))))),
    f.combined ? submitBtn(() => [], { label: "Save and back to review", onDone: () => { S.siteDone[dayKey()] = true; Store.put("site|" + dayKey(), formRecord(f)); S.hist.pop(); S.view = "review"; render(); window.scrollTo(0, 0); } }) : submitBtn(() => { const e = []; if (!f.team.some(r => r.name)) e.push("Add at least one person to the project team."); if (!f.acts.some(r => r.act)) e.push("Add at least one activity."); if (!f.sigF) e.push("The Fibraco rep must sign."); return e; })];
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
    sheet("", h("div", { class: "band" }, "Hazards and risks ", h("small", {}, "(tap H, M or L, then add risk and controls)")), h("table", {}, h("thead", {}, h("tr", {}, h("th", {}, "No"), h("th", { class: "l" }, "Hazard"), h("th", {}, "Rating"))), tb)),
    sheet("", h("div", { class: "band" }, "What PPE is required for this task?"), ppe),
    rowsTable("", ["Occupation", "Name", "Signature"], f.ack, r => h("tr", {}, h("td", { style: "padding:8px;font-weight:600;font-size:12.5px" }, r.occ), h("td", { style: "min-width:120px" }, sel(STAFF, r.name, v => r.name = v, "Name")), h("td", { style: "width:110px" }, sigCell(() => r.sig, v => r.sig = v, `${r.occ} signature`))), "+ Add person", () => ({ occ: "Crew", name: "", sig: "" })),
    h("p", { class: "hint" }, "Acknowledgement. I am conversant with the work instructions and the risks of this task, I will work according to them, and I will report any unsafe condition."),
    sheet("", h("table", {}, h("tbody", {},
      h("tr", {}, h("td", { class: "lab" }, "CR 9(1) risk assessor"), h("td", {}, sel(STAFF, f.assessor, v => f.assessor = v, "Name"))),
      h("tr", {}, h("td", { class: "lab" }, "Signature"), h("td", {}, sigCell(() => f.sigA, v => f.sigA = v, "Risk assessor signature")))))),
    submitBtn(() => { const e = []; if (!f.task.trim()) e.push("Describe the task being performed today."); if (!Object.values(f.hz).some(x => x.r)) e.push("Rate at least one hazard."); if (!f.ack.some(a => a.name && a.sig)) e.push("At least one crew member must sign on."); if (!f.sigA) e.push("The risk assessor must sign."); return e; })];
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
    incident: ["8. Incidents", "Incident Report", "docx", "w"], si: ["9. Site Instructions", "Site Instruction SI-001", "docx", "w"], order: ["10. Orders", "Material Order OR-001", "docx", "w"] }[f.type];
  const proj = f.project ? f.project.name : "Site inspections (no project yet)";
  const short = f.project ? f.project.short : (f.company || "New site");
  const base = `FIBRACO - ${names[1]} - ${short} (${dmy(f.date)})`;
  const root = `Fibraco App \\ 2. Completed Forms \\ ${proj} \\ ${names[0]}`;
  return [topbar("Submitted", short, false), h("div", { class: "done" },
    h("div", { class: "tick", "aria-hidden": "true" }, "✓"),
    h("h1", { class: "big", style: "margin-bottom:6px" }, "Submitted"),
    h("p", { class: "note", style: "margin-top:0" }, Store.online() ? "Saved and sent to the office." : "Saved on this phone. It sends by itself as soon as the phone has signal."),
    h("div", { class: "files" }, h("b", {}, "What lands on your computer"),
      h("div", { class: "f" }, h("span", { class: "tag " + names[3] }, names[2].toUpperCase()), h("div", {}, `${base}.${names[2]}`, h("div", { class: "path" }, root + " \\ Word and Excel"))),
      h("div", { class: "f" }, h("span", { class: "tag p" }, "PDF"), h("div", {}, `${base}.pdf`, h("div", { class: "path" }, root + " \\ PDF"))),
      f.type !== "inspection" && f.photos.length ? h("div", { class: "f" }, h("span", { class: "tag x", style: "background:#555" }, "IMG"), h("div", {}, `${f.photos.length} photo(s)`, h("div", { class: "path" }, `Fibraco App \\ 2. Completed Forms \\ ${proj} \\ 12. Site Photos`))) : null),
    h("div", { class: "stack" },
      f.type === "diary" && f.project && S.final[f.project.id + "|" + ymd(f.date)] ? h("button", { class: "mbtn", onclick: () => { S.hist = ["projects", "calendar", "menu"]; S.view = "review"; render(); window.scrollTo(0, 0); } }, "Back to diary review", h("small", {}, "Client sign-off and KPIs")) : null,
      f.project ? h("button", { class: "mbtn", onclick: () => { S.hist = ["projects", "calendar"]; S.view = "menu"; render(); window.scrollTo(0, 0); } }, "Back to project") : null,
      h("button", { class: "mbtn ghost", onclick: () => { S.hist = []; S.view = "projects"; render(); window.scrollTo(0, 0); } }, "Back to projects")))];
}

const TALKS = [{"n": 1, "t": "Hardhats, Eye protection, Safety shoes", "s": [{"h": "Hardhats", "b": ["It prevents head injuries", "It must be worn at all times", "Ask attendees if their hardhats has ever prevented injuries"]}, {"h": "Eye protection", "b": ["Use at all times where instructed", "Use the right goggles when cutting, grinding, welding chipping, etc", "Side shields are available in windy areas"]}, {"h": "Safety shoes", "b": ["Wear at all times on any site", "Keep in a good condition", "Do not wear broken, damaged boots"]}]}, {"n": 2, "t": "Speed limits, Mobile equipment, Passengers", "s": [{"h": "Speed limits", "b": ["Observe all signposted speedlimits", "Report reckless driving to your supervisor", "Reduce your speed in bad weather, bad road conditions and dust"]}, {"h": "Mobile equipment", "b": ["Complete the daily pre-start checklist before you start work", "Do not operate unsafe machines", "In vehicles always wear seatbelts"]}, {"h": "Passengers", "b": ["Never give unauthorised passengers lifts", "Never take passengers on earthmoving equipment"]}]}, {"n": 3, "t": "Lock out procedures, Safety belts in vehicles, Handrails", "s": [{"h": "Lock out procedures", "b": ["Make sure power is isolated by supervisor before repairs begin", "Make sure locks has been fitted by the supervisor", "Test the start button before repairs begin"]}, {"h": "Safety belts in vehicles", "b": ["It is law to always wear safety belts", "If the safety belt is broken, report it to the supervisor", "Safety belts are there to protect you"]}, {"h": "Handrails", "b": ["Report broken handrails", "Always barricade broken handrails"]}]}, {"n": 4, "t": "Heat exhaustion, Housekeeping, Overhead powerlines", "s": [{"h": "Heat exhaustion", "b": ["Drink plenty of fluids in hot weather to protect your body", "Symptoms of heat exhaustion are : dizziness, nausea, feeling weak"]}, {"h": "Housekeeping", "b": ["Put all waste in proper bins", "Clean up after you have done any job", "Keep vehicle cabs free from litter"]}, {"h": "Overhead powerlines", "b": ["Keep away from overhead powerlines", "Do not attempt to reach upto or climb upto overhead powerlines", "Do not go near fallen or damaged powerlines"]}]}, {"n": 5, "t": "Health and safety representatives, Teamwork, Hearing protection", "s": [{"h": "Health and safety representatives", "b": ["Your representatives are there to help you", "Always report any danger to your representative", "You have a right to refuse to work in unsafe areas"]}, {"h": "Teamwork", "b": ["Teamwork prevents injuries", "Tell fellow workers if they work unsafely", "Help other workers should they require it"]}, {"h": "Hearing protection", "b": ["We  use hearing protection to protect our hearing", "If you cannot talk to some one in a normal voice, the area probably requires that hearing protection be worn"]}]}, {"n": 6, "t": "Attitude, Dust masks/respirators, Skin rashes", "s": [{"h": "Attitude", "b": ["Attitude is the feeling or moods you are experiencing", "Be very cautious when working during emotional times, like the death of a relative", "Be alert to surrounding conditions"]}, {"h": "Dust masks/respirators", "b": ["These are used to protect your lungs", "Always use them when the area is dusty", "Make sure they fit properly"]}, {"h": "Skin rashes", "b": ["Can occur in dusty or hot conditions", "Washing and clean clothes can prevent skin rashes", "If serious, report to your representative"]}]}, {"n": 7, "t": "Fall hazards, Unsafe acts, Short cuts", "s": [{"h": "Fall hazards", "b": ["Keep walkways clear – remove all objects lying on designated walkways", "Always use safety belts when working above groundlevel", "Make sure they safety belt is properly anchored"]}, {"h": "Unsafe acts", "b": ["It is the primary cause of all accidents", "People commit unsafe acts – not equipment", "Always report unsafe conditions"]}, {"h": "Short cuts", "b": ["Always use steps and ladders – do not climb up structures", "Use demarcated walkways – not short cuts", "Use demarcated roads – not short cuts"]}]}, {"n": 8, "t": "Flammable liquids, Fire extinguishers, Playing around", "s": [{"h": "Flammable liquids", "b": ["Flammable liquid vapours cause explosions", "Store flammable liquids in proper containers", "Observe no smoking signs"]}, {"h": "Fire extinguishers", "b": ["They are only designed for smaller fires", "Aim at base of fire and use a sweeping motion", "Never block your way of escape when fighting a fire"]}, {"h": "Playing around", "b": ["Playing practical jokes at work could be dangerous", "The job is important – be professional"]}]}, {"n": 9, "t": "Pry bars/tommy bars, Personal safety, Hand safety", "s": [{"h": "Pry bars/tommy bars", "b": ["Never use screwdrivers as pry bars or strike pry bars with a hammer", "Be prepared for pry bars to slip when using it a handle for a turfer (come-along)"]}, {"h": "Personal safety", "b": ["Long hair must be secured under a hardhat to prevent entanglement with moving machinery", "Personal items such as watches, rings, necklaces must not create opportunity for entanglement"]}, {"h": "Hand safety", "b": ["Wear gloves when handling wire rope, sharp or hot objects", "Watch where you place your hands – many fingers have been lost"]}]}, {"n": 10, "t": "Compressed airlines, Clothing, Personal protective equipment", "s": [{"h": "Compressed airlines", "b": ["Always bleed air from cylinders and tanks before repairs", "Never place your finger over a small hole in an airline – the air could puncture your skin", "Never direct compressed air at yourself or anybody"]}, {"h": "Clothing", "b": ["Never wear loose or torn clothing that could become entangled in machinery", "Wear proper ppe when cutting, welding, grinding and chipping", "Keep clothes free of oil and grease when cutting or welding as it may catch fire"]}, {"h": "Personal protective equipment", "b": ["Use earplugs/ear muffs in designated areas", "Clean earplugs before every use", "It protects your hearing"]}]}, {"n": 11, "t": "Oxygen / acetylene torch safety, Lifting, Report injuries", "s": [{"h": "Oxygen / acetylene torch safety", "b": ["Make sure torches are equipped with flashback arrestors", "Repair torches, guages and lines immediately when defective", "Always secure gas cylinders in upright position"]}, {"h": "Lifting", "b": ["Get help when lifting or moving heavy objects", "Look for an escape route, before you lift, should the object fall", "Watch your feet, should the object fall"]}, {"h": "Report injuries", "b": ["All injuries, no matter how small, must be reported", "Insist on immediate first aid assistance", "Rather get medical help for more serious injuries"]}]}, {"n": 12, "t": "Safety harnesses, Crane safety, Safety glasses", "s": [{"h": "Safety harnesses", "b": ["Safety harnesses must be worn whenever there is danger that you may fall", "Safety harnesses must be kept clean and in a good condition", "Safety harnesses must be properly achored and adjusted for your conditions"]}, {"h": "Crane safety", "b": ["Make sure the lift is within the crane capacity", "Make sure the outriggers are extended and on a firm base", "Always check the crane before use"]}, {"h": "Safety glasses", "b": ["Safety glasses must be worn in all designated areas", "It is better if safety glasses have side shields", "Only properly approved safety glasses may be worn", ""]}]}, {"n": 13, "t": "Removing bucket teeth, Personal conduct, Storage areas", "s": [{"h": "Removing bucket teeth", "b": ["Use hammer and chisel to remove teeth", "Watch your fingers/hands when removing teeth", "Always use safety glasses when removing teeth"]}, {"h": "Personal conduct", "b": ["Treat fellow employees with dignity and respect", "Pratice good housekeeping", "Report any unsafe issues you may find"]}, {"h": "Storage areas", "b": ["Keep storage areas free from litter, spillage and debris", "Clearly label all containers", "Keep shelves neat and organised"]}]}, {"n": 14, "t": "Operator fitness, Cleaning with water hoses, Safe access", "s": [{"h": "Operator fitness", "b": ["Never report to work under the influence of drugs or alcohol", "Try to leave personal problems at home", "Make sure you get enough rest between shifts"]}, {"h": "Cleaning with water hoses", "b": ["Grip hose firmly and turn on pressure gradually", "Never aim water at any electrical installation or apparatus", "Never aim water at people"]}, {"h": "Safe access", "b": ["Always use designated walkways", "Use a safety belt when working outside handrails", "Only use proper ladders and steps – don’t climb over equipment"]}]}, {"n": 15, "t": "Using a shovel, Pumps, Hydraulic systems", "s": [{"h": "Using a shovel", "b": ["Ensure that your footing is firm", "Grip the shovel firmly", "Do not use a shovel near pinch points"]}, {"h": "Pumps", "b": ["Ensure the pump is locked out before doing repairs", "Make sure pump lines are depressurised before disconnecting", "Never direct waterlines to electrical installations or equipment"]}, {"h": "Hydraulic systems", "b": ["Check flow diagram to ensure system is depressurised before commencing repairs", "Be aware of heat build-up in hydraulic systems", "Clean up any oil spills after repairs"]}]}, {"n": 16, "t": "Hand rails and walkways, Illegal drugs and alcohol, Label containers", "s": [{"h": "Hand rails and walkways", "b": ["Use handrails when climbing", "Keep walkways free of clutter and spillage", "Never climb over handrails"]}, {"h": "Illegal drugs and alcohol", "b": ["Is not allowed in workplaces", "Your, and your fellow employees lifes’ will be endangered", "Should you use drugs or alcohol on the job, you will be dismissed"]}, {"h": "Label containers", "b": ["Write contents on labels of containers", "Know emergency first aid procedure for spills", "Report spills to your supervisor"]}]}, {"n": 17, "t": "Good housekeeping, Reversing safely, Hand tools", "s": [{"h": "Good housekeeping", "b": ["Applies to all areas and mobile equipment", "Never let anything lie around after you worked in an area", "Clean up any spills immediately"]}, {"h": "Reversing safely", "b": ["Park so that reversing is avoided as far as possible", "Keep mirrors and windows clean, and look around", "Ensure that reverse alarms are always working"]}, {"h": "Hand tools", "b": ["Use the right tool for the job", "Keep tools in a safe place and in a good condition", "Use tools in the way they were intended to be used"]}]}, {"n": 18, "t": "Help reduce injury risks to others, Portable electric tools, Floor openings", "s": [{"h": "Help reduce injury risks to others", "b": ["Set an example by working safely", "Report any unsafe acts to your health and safety representative"]}, {"h": "Portable electric tools", "b": ["Do not use when damaged in any way – it will kill you", "Check that the plug and cable is 100% safe", "Take damaged electric tools to your supervisor"]}, {"h": "Floor openings", "b": ["Always keep floor openings covered", "If not covered install guardrails", "Keep properly marked"]}]}, {"n": 19, "t": "Report unsafe conditions, Welding, Chain hoist/chain blocks", "s": [{"h": "Report unsafe conditions", "b": ["It reduces the potential for injuries", "Report to your supervisor or representative", "It is your right not to work in unsafe conditions"]}, {"h": "Welding", "b": ["Use proper safety equipment", "Clear all flammable materials from the work area", "Is there proper ventilation?"]}, {"h": "Chain hoist/chain blocks", "b": ["Keep free from dirt and grease", "Do not use damaged chain blocks", "Do not exceed the maximum allowed tonnage"]}]}, {"n": 20, "t": "First aid, Falls, Moving items", "s": [{"h": "First aid", "b": ["Disinfect small cuts and abrasions and cover with bandage or plaster", "If there is foreign matter in the wound, get medical help", "Report all injuries, no matter how small they are"]}, {"h": "Falls", "b": ["Falls are the most frequent form of injuries", "Be careful in oily, greasy and muddy conditions", "Always hold onto something when climbing up or down"]}, {"h": "Moving items", "b": ["Check completely around you before moving something", "The bigger and heavier the items,the greater the risk of accidents", "Check your reverse alarm every day"]}]}, {"n": 21, "t": "Heat exhaustion, Heat stroke, Fractures", "s": [{"h": "Heat exhaustion", "b": ["Symptoms are weakness, nausea and dizziness", "It may be difficult to breathe", "Always take lots of fluids"]}, {"h": "Heat stroke", "b": ["The skin is hot and dry, face is red and the temperature is high", "Remove victim to cool place and remove as much as possible clothing", "Apply wet cloths and cool the person gradually", "Get medical help immediately"]}, {"h": "Fractures", "b": ["Immobilise the limb", "Call the first aider", "Get medical help immediately"]}]}, {"n": 22, "t": "First aid, Operating service pick-ups/bakkies, Fire prevention", "s": [{"h": "First aid", "b": ["Always know where the nearest first aid box is kept", "Always know who the first aiders are", "Never treat small injuries as insignificant"]}, {"h": "Operating service pick-ups/bakkies", "b": ["Never drive too close to earthmoving equipment", "Always drive on demarcated roads only", "Never leave a vehcile unattended with the engine running"]}, {"h": "Fire prevention", "b": ["Obey all “no smoking” signs strictly", "Do not place any items near fire extinguishers", "Check fire extinguishers regularly for damage"]}]}, {"n": 23, "t": "Lightning precautions, Crane operations, Mobile equipment", "s": [{"h": "Lightning precautions", "b": ["Stay inside buildings or vehicles during storms", "Stay away from metal structures that are not earthed", "Stay away from trees or high structures – seek low areas"]}, {"h": "Crane operations", "b": ["Respond to lifting signals from only one person – but “stop” signals from any person around", "Never leave a suspended load anattended", "Never swing a load over persons or equipment"]}, {"h": "Mobile equipment", "b": ["Never leave equipment unattended with bucket, boom or other attachments suspended in the air", "Block any suspended attachments before inspecting them", "Make sure you have the attention of the operator before mounting any mobile equipment"]}]}, {"n": 24, "t": "Containers, Personal safety, Eye protection", "s": [{"h": "Containers", "b": ["All containers must have their contents clearly marked", "Know how to dispose of used or unwanted containers", "Know the first aid procedure for chemicals"]}, {"h": "Personal safety", "b": ["Keep open flames away from any flammable goods", "Avoid overloading electrical plugs", "Do not drink and drive"]}, {"h": "Eye protection", "b": ["Do not look when somebody is cutting or welding", "Always use safety glasses when you are required to assist with cutting,welding or grinding", "Get medical help with foreign objects in your eyes"]}]}, {"n": 25, "t": "Working in hot weather, Electrical safety, General safety", "s": [{"h": "Working in hot weather", "b": ["Always drink plenty of water", "Aif you feel faint or light headed, sit down and drink water", "Do not overdress in hot weather"]}, {"h": "Electrical safety", "b": ["Always ensure any equipment is locked out before working on it", "Only qualified persons are allowed into substations", "Do not try to  reset any tripped equipment – call your supervisor"]}, {"h": "General safety", "b": ["Always be aware of your surroundings", "Never walk under a suspended load", "Report any hazards immediately"]}]}];
// ---------- daily inspections ----------
const OK3 = [["OK", "OK"], ["Defect", "Defect"], ["N/A", "N/A"]];
const CHECKS = {
  ppe: { title: "PPE inspection", freq: "Daily before work", basis: "Fibraco PPE policy. Check each person's PPE before work starts.",
    details: [["Person checked", "staff"]], ans: [["OK", "OK"], ["Replace", "Replace"], ["N/A", "N/A"]],
    groups: [["Head, eyes and ears", ["Hard hat, no cracks and within date", "Safety glasses clean and not scratched", "Ear plugs or ear muffs available"]],
             ["Body", ["Overall or long sleeve shirt and long pants in good condition", "Reflective vest worn and visible", "Dust mask or respirator available where needed"]],
             ["Hands and feet", ["Gloves suitable for the task", "Safety boots in good condition, soles not worn through", "Gum boots or rainsuit when wet"]],
             ["Work at height", ["Full body harness and lanyard issued and checked"]]] },
  vehicle: { title: "Vehicle inspection", freq: "Daily before use", basis: "Construction Regulations 2014, regulation 23(1)(k). Done by the driver before use.",
    details: [["Vehicle", "text", "e.g. Double Cab Pickup"], ["Registration no", "text"], ["Odometer (km)", "number"]], ans: OK3,
    groups: [["Documents", ["Licence disc valid", "Driver licence and PrDP carried", "Vehicle inspection register in the vehicle"]],
             ["Outside", ["Tyres, tread and pressure", "Spare wheel, jack and spanner", "Windscreen and mirrors", "Wipers and washers", "Lights, indicators and hazards", "Reverse alarm", "Beacon or site flag where required", "No new body damage", "Load bin, canopy and tow hitch secure"]],
             ["Under the bonnet", ["Engine oil", "Coolant", "Brake fluid", "No leaks under the vehicle"]],
             ["Cab", ["Seatbelts", "Foot brake and hand brake", "Steering", "Hooter", "No dashboard warning lights", "First aid kit on board", "Fire extinguisher in date", "Warning triangles"]],
             ["Load", ["Ladders, drums and tools tied down", "Fibre offcut container closed"]]] },
  ladder: { title: "Ladder inspection", freq: "Before use, recorded monthly", basis: "General Safety Regulations, regulation 13A.",
    details: [["Ladder ID or no", "text"], ["Type", "select", ["Step", "Extension", "Straight"]], ["Material", "select", ["Aluminium", "Fibreglass", "Wood"]]], ans: OK3,
    groups: [["Stiles and rungs", ["Stiles straight, no cracks, splits or bends", "No rungs missing, loose or damaged", "No sharp edges or burrs"]],
             ["Feet and top", ["Non-skid feet in good condition", "Top hooks or a way to tie off"]],
             ["Step and extension ladders", ["Spreader bars lock", "Extension locks, guides and rope"]],
             ["Condition", ["Clean, no oil, grease or mud", "Labels and load rating legible", "Fibreglass ladder used near electrical work"]]] },
  harness: { title: "Harness inspection", freq: "Before use, recorded monthly", basis: "Construction Regulations 2014, regulation 10 and the site fall protection plan.",
    details: [["Harness serial no", "text"], ["Issued to", "staff"]], ans: OK3,
    groups: [["Webbing", ["No cuts, tears or fraying", "No burns or melted fibres", "No chemical or paint damage", "Not faded or brittle from sun", "Stitching complete"]],
             ["Metal parts", ["D rings, no cracks, bends or rust", "Buckles adjust and hold"]],
             ["Lanyard", ["Lanyard in good condition", "Shock absorber sealed, not deployed", "Hooks close and lock by themselves"]],
             ["Label", ["Label legible, within service life"]]] },
  firstaid: { title: "First aid kit inspection", freq: "Monthly and after use", basis: "General Safety Regulations, regulation 3 and its Annexure (minimum contents).",
    details: [["Kit location", "text", "e.g. Container, Hilux"], ["First aider on site", "staff"]], ans: [["OK", "OK"], ["Short", "Short"], ["N/A", "N/A"]],
    groups: [["Minimum contents", ["Wound cleaner 500 ml", "Swabs for cleaning wounds", "Cotton wool 250 g", "Sterile gauze swabs, 1 packet", "Forceps", "Scissors 100 mm", "Safety pins, 1 card", "Triangular bandages x 12", "Roller bandages 80 mm x 6", "Roller bandages 100 mm x 6", "Elastic adhesive 25 mm, 1 roll", "Anti-allergenic adhesive strip", "Adhesive dressing strips, 1 packet", "Large dressings 75 x 100 mm x 6", "Shell dressings 150 x 200 mm x 6", "Straight splints x 2"]],
             ["Fibraco extra", ["Disposable gloves", "CPR mouthpiece", "Eye wash", "Burn dressing", "Foil blanket"]],
             ["General", ["Box clean and closed", "First aider name and number at the box", "Nothing past expiry date"]]] },
  tools: { title: "Hand and power tools", freq: "Monthly", basis: "OHS Act section 8(2) and the hand tool inspector appointment. Electrical Machinery Regulations 2011, regulation 10.",
    details: [["Colour code this month", "select", ["Red", "Yellow", "Blue", "Green", "White", "Orange"]]], ans: [["Pass", "Pass"], ["Fail", "Fail"], ["N/A", "N/A"]], addable: "+ Add tool",
    groups: [["Tools on site", ["Ingco cordless drill and charger 18 V", "Ingco cordless grinder and charger 18 V", "Power lead 15 m", "Ingco cordless floodlight 18 V", "Magneto power station (UPS)", "Splicing hand tool set", "Tool box hand tools"]]] },
  fire: { title: "Fire extinguishers", freq: "Monthly", basis: "Construction Regulations 2014, regulation 29(g) and (h). Yearly service by an accredited provider.",
    details: [], ans: [["Pass", "Pass"], ["Fail", "Fail"], ["N/A", "N/A"]], addable: "+ Add extinguisher",
    groups: [["Extinguishers (gauge in green, pin and seal intact, hose clear, service in date, mounted and signed)", ["Site container", "Vehicle 1", "Work area"]]] },
  stacking: { title: "Stacking and storage", freq: "Monthly", basis: "Construction Regulations 2014, regulation 28 and General Safety Regulations, regulation 8.",
    details: [["Store or laydown area", "text"]], ans: OK3,
    groups: [["Storage area", ["Demarcated and signed", "Ground level and firm", "Walkways clear"]],
             ["Stacking", ["Stacks stable and upright", "Items taken from the top only", "Nobody climbs on stacks"]],
             ["Cable drums", ["Drums upright on flanges", "Drums chocked against rolling", "Cable ends sealed with end caps"]],
             ["Hazards", ["Fibre offcuts in a sealed container", "Fuel, solvents and gas stored apart", "Safety data sheets available"]]] }
};
const INSPECT_ORDER = ["toolbox", "ppe", "vehicle", "ladder", "harness", "firstaid", "tools", "fire", "stacking"];

function vInspections() {
  return [topbar("Daily inspections", S.project.short, true), projCard(S.project),
    h("div", { class: "stack" }, INSPECT_ORDER.map(k => k === "toolbox"
      ? h("button", { class: "mbtn", onclick: () => startForm("toolbox") }, "Daily toolbox talk", h("small", {}, "Daily before work"))
      : h("button", { class: "mbtn", onclick: () => startForm("check", k) }, CHECKS[k].title, h("small", {}, CHECKS[k].freq)))),
    h("p", { class: "note" }, "Each one files under the project in its own folder, ready for audits.")];
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
  return [...formHead(c.title, c.basis), stdHeader(f, c.title, c.details.map(d => detailRow(f, d))), ...blocks,
    sheet("", h("div", { class: "band" }, "Outcome"), seg([["Fit", "Fit for use"], ["Not fit", "Not fit, taken out of use"]], f.outcome, v => f.outcome = v)),
    sheet("", h("table", {}, h("tbody", {}, h("tr", {}, h("td", { class: "lab" }, "Signature"), h("td", {}, sigCell(() => f.sig, v => f.sig = v, "Inspector signature")))))),
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
  const types = ["Near miss", "First aid case", "Medical treatment", "Lost time injury", "Property or equipment damage", "Vehicle incident", "Environmental", "Fire", "Member of the public"];
  const acts = ["Emergency care given", "Area barricaded", "Work stopped", "Evidence left in place", "Photos taken", "Equipment tagged out"];
  const chips = (list, key) => h("div", { class: "chips" }, list.map(p => { const b = h("button", { type: "button", class: f[key].includes(p) ? "on" : "", onclick: () => { const on = f[key].includes(p); f[key] = on ? f[key].filter(x => x !== p) : [...f[key], p]; b.classList.toggle("on", !on); } }, p); return b; }));
  return [...formHead("Incident report", "Report every incident and near miss straight away, no matter how small. Follows FIBRASE0010."),
    stdHeader(f, "Incident and near-miss report", [h("tr", {}, h("td", { class: "lab" }, "Time of incident"), h("td", {}, sel(TIMES, f.time, v => f.time = v, "Time")))]),
    sheet("", h("div", { class: "band" }, "Type of incident (tick all that apply)"), chips(types, "types")),
    sheet("", h("div", { class: "band" }, "Where"), gpsBlock(f, "gps"), inp("text", f.where, v => f.where = v, "Exact location, tower or ITS no")),
    rowsTable("", ["Person involved", "Injury and body part"], f.people, r => h("tr", {}, h("td", { style: "min-width:130px" }, sel(STAFF.concat(["Other (name in notes)"]), r.name, v => r.name = v, "Name")), h("td", {}, inp("text", r.inj, v => r.inj = v, "None if no injury"))), "+ Add person", () => ({})),
    sheet("", h("div", { class: "band" }, "What happened"), txt(f.what, v => f.what = v, "Describe what happened, in order")),
    sheet("", h("div", { class: "band" }, "Immediate actions"), chips(acts, "acts")),
    sheet("", h("div", { class: "band" }, "Photos"), photoBlock(f.photos)),
    sheet("", h("table", {}, h("tbody", {}, h("tr", {}, h("td", { class: "lab" }, "Witness"), h("td", {}, inp("text", f.wit, v => f.wit = v, "Name and cell no"))), h("tr", {}, h("td", { class: "lab" }, "Reported by signature"), h("td", {}, sigCell(() => f.sig, v => f.sig = v, "Reporter signature")))))),
    h("p", { class: "hint" }, `Submitting sends this to ${adminName()} and the site manager straight away. The investigation part is done later by the office.`),
    submitBtn(() => { const e = []; if (!f.types.length) e.push("Tick the type of incident."); if (!f.what.trim()) e.push("Describe what happened."); if (!f.sig) e.push("Sign the report."); return e; })];
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
      h("tr", {}, h("td", { class: "lab" }, "Received by (Fibraco) signature"), h("td", {}, sigCell(() => f.sigF, v => f.sigF = v, "Fibraco signature")))))),
    submitBtn(() => { const e = []; if (!f.by.trim()) e.push("Who gave the instruction?"); if (!f.text.trim()) e.push("Write the instruction."); if (!f.sigF) e.push("Fibraco must sign."); return e; })];
}

function vOrder() {
  const f = S.form;
  return [...formHead("Material order", "Order material, consumables, PPE or tools from the office. Nothing is ordered from a supplier until the project manager approves it."),
    stdHeader(f, "Material and equipment order request", [
      h("tr", {}, h("td", { class: "lab" }, "Order request no", h("span", { class: "auto" }, "auto")), h("td", { class: "ro" }, "OR-001")),
      h("tr", {}, h("td", { class: "lab" }, "Needed on site by"), h("td", {}, inp("date", f.need, v => f.need = v, "Date"))),
      h("tr", {}, h("td", { class: "lab" }, "Reason"), h("td", {}, sel(["Project material", "Consumables", "Replacement or repair", "PPE", "Tools"], f.reason, v => f.reason = v, "Choose")))]),
    rowsTable("wide", ["No", "Description", "Spec or part no", "Unit", "Qty"], f.items, (r, i) => h("tr", {}, h("td", { class: "no" }, i + 1), h("td", { style: "min-width:200px" }, inp("text", r.d, v => r.d = v, "What is needed")), h("td", { style: "min-width:140px" }, inp("text", r.s, v => r.s = v, "If known")), h("td", { style: "width:90px" }, sel(["m", "ea", "roll", "box", "set", "pack"], r.u, v => r.u = v, "Unit")), h("td", { style: "width:80px" }, inp("number", r.q, v => r.q = v, "0"))), "+ Add item", () => ({})),
    sheet("", h("div", { class: "band" }, "Notes for the office"), txt(f.notes, v => f.notes = v, "Supplier, urgency or anything else")),
    sheet("", h("table", {}, h("tbody", {}, h("tr", {}, h("td", { class: "lab" }, "Requested by signature"), h("td", {}, sigCell(() => f.sig, v => f.sig = v, "Requester signature")))))),
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
  return [topbar(code, S.project.short, true), projCard(S.project),
    sheet("", h("div", { class: "band" }, `${kind.toUpperCase()}  |  ${code}`), h("div", { style: "padding:10px 12px;font-weight:800" }, RAMS_T[n]), body)];
}


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
const roleLabel = r => ({ sm: "Site manager", worker: "Fill in and sign", observer: "Observer, learning on site", viewer: "Observer, learning on site", pm: "Project manager" })[r] || "";
const isSM = u => roleIn(u) === "sm";
const isMgr = u => ["sm", "pm"].includes(roleIn(u));
const isPM = u => roleIn(u) === "pm";
const canWrite = u => !!roleIn(u);
const isObserver = u => ["observer", "viewer"].includes(roleIn(u));
// technical sign-offs (splice box, patch panel, tests, checklist) only by the people doing the work
const canSignWork = u => canWrite(u) && !isObserver(u) && !isPM(u);
S.siteDone = {};
const TEAM_OF = () => Object.keys(S.project.team || {}).filter(n => ["worker", "sm"].includes(S.project.team[n]));
// everyone on site can be given work for the day, observers included (for example assisting)
const CREW_OF = () => Object.keys(S.project.team || {}).filter(n => ["worker", "sm", "observer", "viewer"].includes(S.project.team[n]));
const smName = (p = S.project) => Object.keys(p.team || {}).find(n => p.team[n] === "sm") || "the site manager";
const dayKey = () => S.project.id + "|" + ymd(S.date);
S.alloc = {}; S.sections = {}; S.final = {}; S.client = {};
const DELAY_CAUSES = ["Client: no access or permit", "Client: instruction or change", "Client: drawings or info late", "Client: free-issue material late", "Other contractor in the way", "Weather", "Safety stop", "Material late (Fibraco)", "Plant or tool breakdown", "Rework"];
const INTERNAL = ["Material late (Fibraco)", "Plant or tool breakdown", "Rework"];
const delayText = sec => (sec.delays || []).filter(d => d.cause).map(d => `${d.cause}, ${d.hrs || 0} hrs${d.what ? " (" + d.what + ")" : ""}`).join("  |  ");
function workDaysBefore(d, n) { const out = []; const x = new Date(d); while (out.length < n) { x.setDate(x.getDate() - 1); if (x.getDay() !== 0 && x.getDay() !== 6) out.unshift(new Date(x)); } return out; }
function projActs() { const a = S.project.area; return (a ? ACT[a] : ACT["SOLAR MV"]).map(x => ({ unit: x[0], act: x[1], area: a || "SOLAR MV" })); }
const KEEP = { foc: "FOC", rmu: "RMU", db: "DB", cat6a: "CAT6a", rj45: "RJ45", otdr: "OTDR", odtr: "OTDR", olts: "OLTS", sfps: "SFPs", spd: "SPD", dit: "DIT", m20: "M20", "48f": "48F", "(m20)": "(M20)", "(bidirectional)": "(bidirectional)", hv: "HV", mv: "MV", lv: "LV", ups: "UPS", ip: "IP", scada: "SCADA", eskom: "Eskom", "(internal)": "(internal)", "(comms": "(comms", space: "space", "space)": "space)" };
function nice2(s) { const t = s.toLowerCase().split(" ").map(w => KEEP[w] || w).join(" "); return t.charAt(0).toUpperCase() + t.slice(1); }
function ensureDay(k = dayKey()) {
  if (S.alloc[k]) return;
  S.alloc[k] = Store.get("alloc|" + k) || [];
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
  const done = tasks.reduce((a, t, i) => a + (+(((sec.rows || [])[i] || {}).done) || 0), 0);
  return { d: S.date, target, done, filled, why: delayText(sec) };
}
function dayFor(p, d) {
  const k = S.project.id + "|" + ymd(d), alloc = Store.get("alloc|" + k) || [], sec = Store.get("sec|" + k + "|" + p) || {};
  const mine = alloc.filter(t => t.who === p); if (!mine.length) return null;
  const target = mine.reduce((a, t) => a + (+t.target || 0), 0);
  const done = mine.reduce((a, t, i) => a + (+(((sec.rows || [])[i] || {}).done) || 0), 0);
  return { d, target, done, filled: ["submitted", "approved"].includes(sec.status), why: delayText(sec) };
}
function schedFor(p) {
  const t = todayFor(p);
  const past = workDaysBefore(S.date, 4).map(d => dayFor(p, d)).filter(Boolean);
  const days = [...past, t].filter(x => x.target > 0);
  if (!days.length) return null;
  let plan = 0, done = 0;
  for (const [id, alloc] of Store.list("alloc|" + S.project.id + "|")) {
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
      h("button", { class: "btn-w", type: "button", style: "width:100%;padding:11px;border-radius:6px;border:0;font-weight:800", onclick: () => { f.ref.status = "retest"; f.ref.repairNote = `Repaired by ${u}, ${dayLab(S.date)}`; persist(); showInfo("Sent for recheck", `${f.found} gets it back to retest or recheck. Log the time you spent under Delays as Rework.`); render(); } }, "Repaired, send for recheck"))));
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
        h("tr", {}, h("td", { class: "lab" }, "Person"), h("td", {}, sel(CREW_OF(), r.who, v => r.who = v, "Who"))),
        h("tr", {}, h("td", { class: "lab" }, "Activity"), h("td", {}, sel(acts.map(a => a.act), r.act, v => { r.act = v; r.unit = (acts.find(a => a.act === v) || {}).unit || ""; unit.textContent = r.unit; }, "What"))),
        h("tr", {}, h("td", { class: "lab" }, "Where"), h("td", {}, inp("text", r.loc, v => r.loc = v, S.project.kind === "turbines" ? "e.g. WTG 07" : "e.g. RMU 4"))),
        h("tr", {}, h("td", { class: "lab" }, "Target"), h("td", {}, h("div", { style: "display:flex;align-items:center" }, inp("number", r.target, v => r.target = v, "0"), unit))))));
  };
  const draw = () => box.replaceChildren(...list.map(card), ...(list.length ? [] : [h("p", { class: "note" }, "No tasks yet. Tap Add task.")]));
  draw();
  return [topbar("Allocate work", `${S.project.short}  |  ${dmy(S.date)}`, true),
    h("p", { class: "form-sub" }, "Give each person their tasks for the day. They see them on their phone, and it carries into their diary section."),
    box,
    h("button", { class: "mbtn ghost", style: "margin-bottom:12px", onclick: () => { list.push({}); draw(); } }, "+ Add task"),
    h("p", { class: "hint" }, "Two people on one task each get their own task with their own target."),
    h("button", { class: "submit", type: "button", onclick: () => {
      const bad = list.filter(r => !r.who || !r.act || !r.target);
      if (bad.length) return showInfo("Not finished", "Every task needs a person, an activity and a target.");
      persist(); showInfo("Sent to the crew", Store.online() ? "Each person now sees their tasks under My work today." : "Saved. It goes to the crew as soon as your phone has signal."); goBack(); } }, "Send to crew")];
}

function vMySection() {
  const k = dayKey(), tasks = myTasks(S.user), sec = sectionOf(S.user);
  if (!sec.delays) sec.delays = [];
  const locked = sec.status === "submitted" || sec.status === "approved";
  const hrsOpts = []; for (let x = 0.5; x <= 14; x += 0.5) hrsOpts.push(String(x));
  const lostOpts = []; for (let x = 0.5; x <= 10; x += 0.5) lostOpts.push(String(x));
  const schedBox = h("div");
  const drawSched = () => schedBox.replaceChildren(locked ? schedPanel(S.user) : sheet("", h("div", { class: "band" }, "Am I on schedule?"), h("div", { style: "padding:12px;font-size:13px;color:#5b6470;text-align:center" }, "Your progress bars show here once you have signed and submitted your section.")));
  const behind = () => tasks.some((t, i) => { const r = sec.rows[i] || {}; return r.done !== undefined && r.done !== "" && +r.done < +t.target; });
  const delayHint = h("div", { class: "err", hidden: true, style: "margin:0 0 10px" }, "You are behind the target today. Add the reason in Delays below.");
  const tb = h("tbody");
  const draw = () => {
    tb.replaceChildren(...tasks.map((t, i) => {
      const r = sec.rows[i] || (sec.rows[i] = {});
      return h("tr", {},
        h("td", { style: "padding:8px;font-weight:700;font-size:12.5px" }, nice2(t.act), h("div", { style: "font-weight:500;color:#5b6470" }, t.loc)),
        h("td", { style: "width:70px;text-align:center;font-weight:800;color:#0069aa" }, `${t.target} ${t.unit}`),
        h("td", { style: "width:84px" }, locked ? h("div", { style: "text-align:center;font-weight:800;padding:8px" }, r.done || "0") : inp("number", r.done, v => { r.done = v; drawSched(); delayHint.hidden = !(behind() && !sec.delays.some(d => d.cause)); }, "Done")));
    }));
    drawSched();
  };
  draw();
  const back = sec.status === "returned" ? h("div", { class: "err" }, `Sent back by the site manager: ${sec.back}`) : null;
  const ro = (v, c) => h("div", { style: "padding:8px;font-size:12.5px" + (c ? ";text-align:center" : "") }, v || "");
  return [topbar("My diary section", `${S.project.short}  |  ${dmy(S.date)}`, true),
    h("p", { class: "form-sub" }, locked ? "Submitted. The site manager reviews it before the diary is signed." : "Fill in what you actually did against each task. Your section joins the project's daily diary."),
    back, repairsBlock(S.user),
    stdHeader({ project: S.project, date: S.date, user: S.user }, "Daily diary  |  my section"),
    sheet("", h("div", { class: "band" }, "My tasks today"), h("table", {}, h("thead", {}, h("tr", {}, h("th", { class: "l" }, "Task"), h("th", {}, "Target"), h("th", {}, "Done"))), tb)),
    schedBox,
    rowsTable("", ["Other work (not planned)", "Qty"], sec.other, r => h("tr", {}, h("td", {}, locked ? ro(r.what) : inp("text", r.what, v => r.what = v, "What and why")), h("td", { style: "width:80px" }, locked ? ro(r.qty, 1) : inp("number", r.qty, v => r.qty = v, "0"))), locked ? null : "+ Add other work", () => ({})),
    delayHint,
    rowsTable("", ["Delays (why you are behind)", "Hrs lost"], sec.delays, r => h("tr", {},
      h("td", {}, locked ? ro(r.cause + (r.what ? `. ${r.what}` : "")) : h("div", {}, sel(DELAY_CAUSES, r.cause, v => { r.cause = v; delayHint.hidden = true; }, "Choose the cause"), inp("text", r.what, v => r.what = v, "Short detail, e.g. which WTG, who said what"))),
      h("td", { style: "width:86px" }, locked ? ro(r.hrs, 1) : sel(lostOpts, r.hrs, v => r.hrs = v, "Hrs"))), locked ? null : "+ Add delay", () => ({})),
    locked ? null : h("p", { class: "hint" }, "Client delays you log here go on the diary the client signs the next morning. That signature is our proof if time or standing time must be claimed."),
    sheet("", h("table", {}, h("tbody", {},
      h("tr", {}, h("td", { class: "lab" }, "Hours worked"), h("td", {}, locked ? h("div", { class: "ro" }, sec.hrs) : sel(hrsOpts, sec.hrs, v => sec.hrs = v, "Hrs")))))),
    locked ? null : sheet("", h("div", { class: "band" }, "Photos"), photoBlock(sec.photos || (sec.photos = []))),
    locked ? null : sheet("", h("table", {}, h("tbody", {}, h("tr", {}, h("td", { class: "lab" }, "My signature"), h("td", {}, sigCell(() => sec.sig, v => sec.sig = v, "Your signature")))))),
    locked ? h("div", { style: "text-align:center;margin:10px 0" }, statusPill(sec.status)) :
      submitBtn(() => { const e = []; if (tasks.some((t, i) => (sec.rows[i] || {}).done === undefined || (sec.rows[i] || {}).done === "")) e.push("Fill in what you did for every task, even if it is 0."); if (behind() && !sec.delays.some(d => d.cause && d.hrs)) e.push("You are behind the target. Add the delay cause and the hours lost."); if (!sec.hrs) e.push("Choose your hours worked."); if (!sec.sig) e.push("Sign your section."); return e; },
        { label: "Submit my section", onDone: () => { sec.status = "submitted"; sec.at = new Date().toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" }).replace(":", "h"); showInfo("Submitted", "Your section is with the site manager for review."); goBack(); } })];
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
        (sec.other || []).filter(o => o.what).map(o => h("tr", {}, h("td", { colspan: 3, style: "padding:8px;font-size:12.5px" }, `Other work: ${o.what} (${o.qty || 0})`))),
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
      h("button", { class: "submit", type: "button", style: s1 && s2 ? "" : "opacity:.45", onclick: () => { if (!(s1 && s2)) return; openSig("Site manager signature", v => { if (!v) return; S.final[k] = new Date().toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" }).replace(":", "h"); S.done[k] = true; persist(); Store.put("final|" + k, { at: S.final[k], by: S.user, sig: v, date: ymd(S.date) }); S.form = { type: "diary", project: S.project, date: S.date, user: S.user, photos: [] }; go("done"); }); } }, "3. Sign and make final"))];
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
  f.acts = alloc.map((t, i) => { const idx = alloc.filter((a, j) => a.who === t.who && j < i).length; const r = ((secs[t.who] || {}).rows || [])[idx] || {}; return { area: S.project.area || "", act: t.act, unit: t.unit, loc: `${t.loc} (${t.who.split(" ")[0]})`, qty: r.done || "" }; });
  f.delays = alloc.map(t => t.who).filter((p, i, a) => a.indexOf(p) === i).flatMap(p => ((secs[p] || {}).delays || []).filter(d => d.cause).map(d => ({ c: `${d.cause}${d.what ? ". " + d.what : ""} (${p.split(" ")[0]})`, t: d.hrs }))); if (!f.delays.length) f.delays = [{}];
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
  const delays = people.flatMap(p => ((secs[p] || {}).delays || []).filter(d => d.cause && !INTERNAL.includes(d.cause)));
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
    const drawLinks = g => links.replaceChildren(...[
      pm.phone ? h("a", { class: "mbtn emergency", style: "text-decoration:none", href: `https://wa.me/${intl(pm.phone)}?text=${encodeURIComponent(waText(g))}` }, `WhatsApp ${pm.name}`, h("small", {}, "Sends your location to the office")) : null,
      pm.phone ? h("a", { class: "mbtn", style: "text-decoration:none", href: `tel:${pm.phone.replace(/\s/g, "")}` }, `Call ${pm.name}`, h("small", {}, pm.phone)) : null,
      smP.phone && smP.name !== pm.name ? h("a", { class: "mbtn", style: "text-decoration:none", href: `tel:${smP.phone.replace(/\s/g, "")}` }, `Call ${sm}`, h("small", {}, "Site manager")) : null,
      h("a", { class: "mbtn", style: "text-decoration:none", href: "tel:112" }, "Call 112", h("small", {}, "Cellphone emergency")),
      h("a", { class: "mbtn", style: "text-decoration:none", href: "tel:10177" }, "Call 10177", h("small", {}, "Ambulance"))].filter(Boolean));
    body.replaceChildren(h("h2", {}, "EMERGENCY"),
      h("p", {}, "The office has been alerted. Now call or WhatsApp for help."),
      h("div", { class: "sent" }, h("div", {}, h("b", {}, "From  "), who), h("div", {}, h("b", {}, "Project  "), proj), gps),
      links,
      h("button", { class: "btn-w", type: "button", style: "padding:13px 26px;border-radius:6px;border:0;font-weight:800;background:#fff;color:#15191e", onclick: () => ov.remove() }, "Close"));
    drawLinks(null);
    Store.put(alert.id, alert);
    if (navigator.geolocation) navigator.geolocation.getCurrentPosition(
      p => { const g = `${p.coords.latitude.toFixed(6)},${p.coords.longitude.toFixed(6)}`; gps.replaceChildren(h("b", {}, "GPS  "), g.replace(",", ", ")); alert.gps = g; Store.put(alert.id, alert); drawLinks(g); },
      () => gps.replaceChildren(h("b", {}, "GPS  "), "Location is switched off on this phone"), { timeout: 8000, enableHighAccuracy: true });
  }
}

// ---------- render ----------
let render = function () {
  const v = S.view;
  const views = { users: vUsers, projects: vProjects, calendar: vCalendar, menu: vMenu, inspections: vInspections, client: vClient, tests: vTests, link: vLink, logtest: vLogTest, biocheck: vBioCheck, allocate: vAllocate, mysection: vMySection, review: vReview, kpi: vKpi, rams: vRams, ramsdoc: vRamsDoc, drawings: vDrawings, drawing: vDrawing, diary: vDiary, dsti: vDsti, inspection: vInspection, check: vCheck, toolbox: vToolbox, incident: vIncident, si: vSI, order: vOrder, done: vDone, feedback: vFeedback, devices: vDevices };
  app.replaceChildren(...[].concat((views[v] || vProjects)()).filter(Boolean));
}

// ---------- live layer: identity, PIN, saving, sync, feedback ----------
const CONF = { url: "https://ahbcixfknqgqvmauhnyo.supabase.co", anon: "testanon" };
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
      const max = 1600, r = Math.min(1, max / Math.max(im.width, im.height));
      const c = document.createElement("canvas"); c.width = Math.round(im.width * r); c.height = Math.round(im.height * r);
      const x = c.getContext("2d"); x.drawImage(im, 0, 0, c.width, c.height);
      // stamp who, when and which project on the photo itself
      const stamp = `${S.user || ""}  |  ${S.project ? S.project.short : ""}  |  ${new Date().toLocaleString("en-ZA")}`;
      x.font = `${Math.max(14, Math.round(c.width / 45))}px sans-serif`; const th = Math.max(22, Math.round(c.width / 30));
      x.fillStyle = "rgba(0,0,0,.55)"; x.fillRect(0, c.height - th, c.width, th); x.fillStyle = "#fff"; x.fillText(stamp, 8, c.height - th / 3);
      URL.revokeObjectURL(u); res(c.toDataURL("image/jpeg", 0.72));
    };
    im.onerror = () => { URL.revokeObjectURL(u); rej(new Error("not an image")); };
    im.src = u;
  });
}
function formRecord(f) { return JSON.parse(J(Object.assign({}, f, { date: ymd(f.date), project: f.project ? f.project.id : null, savedBy: S.user, savedAt: new Date().toISOString() }))); }
function saveForm(f) {
  const id = `form|${f.project ? f.project.id : "none"}|${ymd(f.date)}|${f.type}|${Date.now().toString(36)}${rid()}`;
  Store.put(id, formRecord(f));
}
// Everything the crew changes on the day screens is saved by comparing with what was last saved.
function snapshot() {
  const out = [];
  // Each phone only saves what its owner may change: the site manager the allocation, each man his own section.
  const pOf = k => PROJECTS.find(p => p.id === k.split("|")[0]);
  for (const k in S.alloc) { const r = roleIn(S.user, pOf(k)); if (["sm", "pm"].includes(r) && (S.alloc[k].length || lastSaved.has("alloc|" + k))) out.push(["alloc|" + k, S.alloc[k]]); }
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
const SAFE_VIEWS = ["projects", "calendar", "menu", "review", "kpi", "tests", "link", "client", "drawings", "rams"];
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
let deniedAt = 0;
Store.on((ids, state) => {
  if (state === "denied" && CFG && Date.now() - deniedAt > 60e3) { deniedAt = Date.now(); Store.whoami().then(me => { if (me.status !== "active") location.reload(); }).catch(e => { if (e.status) location.reload(); }); }
  if (ids.length) hydrate(ids); const p = document.querySelector(".bar .pill"); if (p) p.replaceWith(syncPill()); });

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
function vDevices() {
  if (!DEVS) { refreshDevices(true); return [topbar("Devices and access", "Office only", true), h("p", { class: "note" }, Store.online() ? "Loading..." : "This page needs signal.")]; }
  const act = (fn, msg) => fn().then(() => refreshDevices(true)).catch(e => showInfo("Not changed", Store.online() ? String(e.message || e).replace(/^\w+ \d+: /, "") : "This needs signal. Try again when you are connected."));
  const chip = st => h("span", { class: "pill", style: `background:${st === "active" ? "#1e8e3e" : st === "pending" ? "#f29900" : "#8a8f98"}` }, st === "active" ? "ALLOWED" : st === "pending" ? "WAITING" : "BLOCKED");
  const people = PEOPLE.map(p => ({ p, rows: DEVS.filter(d => d.member_id === p.id) })).filter(x => x.rows.length);
  people.sort((a, b) => (b.rows.some(d => d.status === "pending") - a.rows.some(d => d.status === "pending")));
  const card = ({ p, rows }) => {
    const on = rows[0].member_active !== false, devs = rows.filter(d => d.dev);
    return sheet("", h("div", { class: "band", style: on ? "" : "background:#8a8f98" }, `${p.name.toUpperCase()}`, h("small", {}, `  |  ${p.role}${on ? "" : "  |  SWITCHED OFF"}`)),
      ...(devs.length ? devs.map(d => h("div", { "data-label": d.label || "", style: "padding:10px 12px;border-top:1px solid var(--line);display:flex;gap:10px;align-items:center;flex-wrap:wrap" + (d.status === "pending" ? ";background:#fff8ec" : "") },
        h("div", { style: "flex:1 1 180px;min-width:0" },
          h("div", { style: "font-weight:700;font-size:14px" }, d.label || "Unknown device", d.mine ? h("span", { style: "color:var(--muted);font-weight:500" }, "  (this device)") : null),
          h("div", { style: "font-size:12px;color:var(--muted)" }, `First opened ${when(d.first_seen)}  |  Last used ${when(d.last_seen)}`)),
        chip(d.status),
        d.mine ? null : h("div", { style: "display:flex;gap:6px" },
          d.status !== "active" ? h("button", { class: "btn-w", type: "button", style: "padding:8px 14px", onclick: () => askYesNo("Allow this device?", `${p.name} on ${d.label || "this device"} gets full access to his projects.`, "Allow", () => act(() => Store.setDevice(p.id, d.dev, "active"))) }, "Allow") : null,
          d.status !== "blocked" ? h("button", { class: "btn-g", type: "button", style: "padding:8px 14px", onclick: () => askYesNo("Block this device?", `${d.label || "This device"} stops working for ${p.name} straight away. Next time it has signal, everything the app kept on it is wiped.`, "Block", () => act(() => Store.setDevice(p.id, d.dev, "blocked")), true) }, "Block") : null)))
        : [h("div", { style: "padding:10px 12px;border-top:1px solid var(--line);font-size:13px;color:var(--muted)" }, "Link not opened yet.")]),
      p.admin ? null : h("div", { style: "padding:8px 12px;border-top:1px solid var(--line);text-align:right" },
        h("button", { class: "btn-g", type: "button", style: "padding:6px 12px;font-size:12px", onclick: () => on
          ? askYesNo(`Switch ${p.name} off?`, `All his devices stop working at once and are wiped when they next have signal. His work already sent stays. You can switch him on again later.`, "Switch off", () => act(() => Store.setMember(p.id, false)), true)
          : askYesNo(`Switch ${p.name} on again?`, "His link works again. Devices you blocked stay blocked.", "Switch on", () => act(() => Store.setMember(p.id, true))) }, on ? `Switch ${p.name.split(" ")[0]} off` : `Switch ${p.name.split(" ")[0]} on again`)));
  };
  return [topbar("Devices and access", "Office only", true),
    h("p", { class: "hint", style: "margin:4px 2px 12px" }, "Each personal link works on the first device that opens it. Any other phone or laptop waits here for you. Block a device and it is cut off and wiped. Switch a person off when he leaves."),
    ...people.map(card),
    h("button", { class: "mbtn ghost", onclick: () => refreshDevices(true) }, "Refresh")];
}
function vFeedback() {
  const list = Store.list("fb|").map(([, o]) => o).sort((a, b) => a.at < b.at ? 1 : -1);
  return [topbar("Feedback", "From the team", true),
    ...list.map(f => sheet("", h("div", { style: "padding:10px 12px;font-size:13px" }, h("b", {}, `${f.who}  |  ${f.project || "-"}  |  ${f.view}`), h("div", { style: "color:#5b6470;font-size:12px" }, new Date(f.at).toLocaleString("en-ZA")), h("div", { style: "margin-top:6px" }, f.text))))];
}

// ---------- boot ----------
let CFG = null;
const screen = (...kids) => { app.replaceChildren(h("div", { class: "lock" }, h("img", { src: LOGO, alt: "Fibraco", style: "width:220px;max-width:70%;margin:30px auto 18px;display:block" }), ...kids)); };
function pinPad(title, sub, onDone) {
  let v = ""; const dots = h("div", { class: "pin-dots" }); const msg = h("p", { class: "pin-msg" }, sub || "");
  const draw = () => dots.replaceChildren(...[0, 1, 2, 3].map(i => h("i", { class: i < v.length ? "on" : "" })));
  const press = d => { if (d === "del") v = v.slice(0, -1); else if (v.length < 4) v += d; draw(); if (v.length === 4) { const x = v; v = ""; setTimeout(() => { draw(); onDone(x, m => { msg.textContent = m; }); }, 120); } };
  draw();
  screen(h("h1", { class: "big", style: "text-align:center" }, title), msg, dots,
    h("div", { class: "pin-pad" }, ...["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"].map(d => d ? h("button", { type: "button", onclick: () => press(d), "aria-label": d === "del" ? "Delete" : d }, d === "del" ? "⌫" : d) : h("span"))));
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
  clearTimeout(waitT);
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
  render();
  Store.sync();
  setInterval(() => Store.sync(), 30000);
  if (me.admin) { refreshDevices(true); setInterval(() => refreshDevices(), 30000); }
}
async function boot() {
  if (Store.hasLink()) {
    let first = null;
    const ask = (t, s) => pinPad(t, s, (pin, say) => {
      if (!first) { first = pin; return ask("Type it again", "To make sure."); }
      if (pin !== first) { first = null; return ask("Choose a 4 digit PIN", "The two PINs did not match. Try again."); }
      Store.setupFromLink(pin).then(startApp);
    });
    return ask("Choose a 4 digit PIN", `Welcome. You will type this PIN every time the app opens.`);
  }
  if (await Store.hasSaved()) {
    let tries = 0;
    return pinPad("Type your PIN", "", (pin, say) => Store.unlock(pin).then(ok => {
      if (ok) return startApp();
      tries++; say(tries >= 5 ? "Forgot your PIN? Open your personal link from WhatsApp again to set a new one." : "Wrong PIN. Try again.");
    }));
  }
  screen(h("h1", { class: "big", style: "text-align:center" }, "Fibraco Field"), h("p", { style: "text-align:center;padding:0 20px" }, "Open the app with your personal link from WhatsApp. It only works for you."));
}
let hiddenAt = 0;
document.addEventListener("visibilitychange", () => {
  if (document.hidden) hiddenAt = Date.now();
  else { if (hiddenAt && Date.now() - hiddenAt > 10 * 60e3 && CFG) location.reload(); else Store.kick(); }
});
const _render = render;
render = function () { _render(); app.append(feedbackButton()); };
const splash = document.getElementById("splash");
const leave = () => { splash.hidden = true; };
splash.addEventListener("click", leave);
splash.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") leave(); });
setTimeout(leave, 1500);
if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
boot();
})();
