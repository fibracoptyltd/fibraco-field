// Fibraco: the Bioseco live board. Used by the Bioseco portal page and by the "Bioseco live" tile in the app,
// so the office sees exactly what Bioseco sees. Read only. Plain DOM, no app code.
"use strict";
const LiveUI = (() => {
  const h = (t, a, ...kids) => { const e = document.createElement(t); for (const [k, v] of Object.entries(a || {})) { if (v == null || v === false) continue; if (k.startsWith("on")) e.addEventListener(k.slice(2), v); else if (k === "class") e.className = v; else e.setAttribute(k, v); }
    for (const c of kids.flat()) if (c != null && c !== false) e.append(c.nodeType ? c : String(c)); return e; };
  const SA = "Africa/Johannesburg";
  const tm = (iso, tz) => { try { return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: tz }).replace(":", "h"); } catch (e) { return ""; } };
  const dt = (iso, tz) => { try { return new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: tz }); } catch (e) { return ""; } };
  const both = iso => { const a = tm(iso, SA), mine = Intl.DateTimeFormat().resolvedOptions().timeZone, b = tm(iso, mine); return a === b || mine === SA ? `${a} SA time` : `${a} SA time (${b} your time)`; };
  const dayOf = (iso, tz = SA) => { try { return new Date(iso).toLocaleDateString("en-CA", { timeZone: tz }); } catch (e) { return ""; } };
  const ST = { todo: ["Not started", "#e6e9ed", "#4a525c"], busy: ["Team working", "#fff3c4", "#6b4e00"], check: ["Please check now", "#0069aa", "#fff"], ok: ["Chain confirmed", "#d6f5e2", "#1e6b34"], done: ["Both parts done", "#34e27c", "#08311a"], hold: ["On hold", "#e4defa", "#4b3f85"], vpn: ["VPN check needed", "#ffd8a8", "#7a3d00"], nok: ["Not OK, team on it", "#c8102e", "#fff"] };
  // Piotr's status table (Bioseco_Wolf_Fibraco_status.xlsx): his row labels and order, his column headings, row numbers in his sheet
  const PIOTR = [[3, "WEA03", "WTG 03"], [4, "WEA04", "WTG 04"], [5, "WEA05", "WTG 05"], [6, "WEA06", "WTG 06"], [7, "WEA07", "WTG 07"], [8, "WEA08", "WTG 08"], [9, "WEA09", "WTG 09"], [10, "WEA10", "WTG 10"],
    [11, "O&M building / substation", "SUBSTATION"], [12, "WEA17", "WTG 17"], [13, "WEA19", "WTG 19"], [14, "WEA21", "WTG 21"], [15, "WEA22", "WTG 22"], [16, "WEA23", "WTG 23"], [17, "WEA24", "WTG 24"], [18, "WEA25", "WTG 25"], [19, "WEA27", "WTG 27"], [20, "WEA28", "WTG 28"]];
  const PCOLS = [["en", "energized [Y/N]"], ["fo", "Fiber optics"], ["mod", "modules check"], ["jb", "Junction box check"], ["bps", "BPS box check"], ["risk", "risk"], ["xw", "extra works"], ["d", "Description"]];
  // rowOf(w) gives { en, fo, mod, jb, bps, risk, xw, d }. cell(w, key, value) can return an element in place of a value (the office's extra works button).
  // Wanro 31 Oct: never sideways. One card per turbine, in Piotr's order, the answers in a grid that fits the phone, the description underneath.
  const PSHORT = { en: "Energized", fo: "Fiber optics", mod: "Modules check", jb: "Junction box check", bps: "BPS box check", risk: "Risk", xw: "Extra works" };
  function ptable(rowOf, o = {}) {
    const val = (k, v) => h("b", { class: "pt-v " + (v === "Y" ? (k === "risk" || k === "xw" ? "pt-n" : "pt-y") : v === "N" ? (k === "risk" || k === "xw" ? "pt-y" : "pt-n") : "pt-na") }, v || "-");
    return h("div", { class: "lv-pt" }, ...PIOTR.map(([, lab, w]) => { const r = rowOf(w) || {};
      return h("div", { class: "pt-card", onclick: o.open ? () => o.open(w) : null },
        h("div", { class: "pt-h" }, h("b", {}, lab), r.risk === "Y" ? h("span", { class: "pt-flag" }, "RISK") : null),
        ...[["en", "fo", "mod", "jb", "bps"], ["risk", "xw"]].map(ks => h("div", { class: "pt-g pt-g" + ks.length }, ...ks.map(k => { const c = o.cell && o.cell(w, k, r[k]);
          return h("div", { class: "pt-c" }, h("small", {}, PSHORT[k]), c || val(k, r[k])); }))),
        r.d ? h("p", { class: "pt-d" }, r.d) : null); }));
  }
  function boards(recs) { return Object.values(recs).filter(o => o && o.t === "board" && o.v === 2).sort((a, b) => (a.order || 0) - (b.order || 0)); }
  function detOf(recs, w) { return Object.values(recs).find(o => o && o.t === "det" && o.v === 2 && o.w === w); }
  // the conversation with Bioseco: their messages and Fibraco's answers, oldest first
  function msgs(recs, w) { return Object.entries(recs).filter(([, o]) => o && o.t === "msg" && o.v === 2 && (w === undefined || o.w === w)).map(([id, o]) => Object.assign({ id }, o)).sort((a, b) => String(a.at).localeCompare(String(b.at))); }
  // the whole board
  function render(root, recs, opts = {}) {
    const bs = boards(recs), now = Date.now();
    if (opts.sel) { const d = detOf(recs, opts.sel), b = bs.find(x => x.w === opts.sel); root.replaceChildren(detail(b, d, opts)); return; }
    const asks = bs.filter(b => b.st === "check"), tdy = dayOf(new Date().toISOString());
    // where the team is now: the sheet with the latest work today, within the last three hours
    const here = bs.filter(b => b.last && dayOf(b.last) === tdy && now - new Date(b.last).getTime() < 3 * 3600e3 && b.st !== "done").sort((a, b) => String(b.last).localeCompare(String(a.last)))[0];
    bs.forEach(b => { b.here = !!here && b.w === here.w; });
    const vpn = bs.filter(b => b.st === "vpn");
    const evs = Object.values(recs).filter(o => o && o.t === "ev" && o.v === 2 && o.at).sort((a, b) => String(b.at).localeCompare(String(a.at)));
    const done = bs.filter(b => b.st === "done").length, upd = Object.values(recs).map(o => o && o.at).filter(Boolean).sort().pop();
    root.replaceChildren(...[
      h("div", { class: "lv-head" }, h("div", {}, h("b", {}, opts.title || "Bioseco live"), h("small", {}, opts.sub || "")), h("div", { class: "lv-upd" }, upd ? `Last change ${both(upd)}` : "Nothing yet")),
      asks.length ? h("div", { class: "lv-ask" }, h("b", {}, asks.length === 1 ? "The team asks you to check:" : "The team asks you to check these now:"),
        ...asks.map(b => h("button", { type: "button", class: "lv-askrow", onclick: () => opts.open && opts.open(b.w) }, h("span", {}, b.w === "SUBSTATION" ? "Substation" : b.w), h("small", {}, b.ask || "Full chain: BPS box, WTG FO panel, substation FO panel, server, every module online"), h("em", {}, `Asked ${both(b.askAt)}`)))) : null,
      vpn.length ? h("div", { class: "lv-vpn" }, h("b", {}, "Still to check in your system through the VPN:"), h("div", {}, ...vpn.map(b => h("button", { type: "button", onclick: () => opts.open && opts.open(b.w) }, b.w === "SUBSTATION" ? "Substation" : b.w)))) : null,
      opts.top ? opts.top() : null,
      here ? h("div", { class: "lv-here" }, `Team now at ${here.w === "SUBSTATION" ? "the substation" : here.w}, since ${tm(here.first, SA)} SA time`) : h("div", { class: "lv-here off" }, "No work on the BPS recorded yet today"),
      h("div", { class: "lv-sum" }, `${done} of ${bs.length} complete`),
      h("div", { class: "lv-grid" }, ...bs.map((b, i) => { const [lab, bg, fg] = ST[b.st] || ST.todo;
        return h("button", { type: "button", class: "lv-t" + (b.here ? " here" : "") + (b.w === "SUBSTATION" ? " sub" : ""), style: `background:${bg};color:${fg}`, onclick: () => opts.open && opts.open(b.w) },
          b.w === "SUBSTATION" ? null : h("i", {}, String(i)), b.here ? h("span", { class: "lv-now", title: "Team working here now" }, "\u2692 NOW") : null,
          h("b", {}, b.w === "SUBSTATION" ? "Substation" : b.w), h("small", {}, lab)); })),
      h("p", { class: "lv-note" }, "Numbers show the working order. The team works one turbine at a time, from the lowest number to the highest."),
      h("div", { class: "lv-key" }, ...Object.values(ST).map(([lab, bg, fg]) => h("span", { style: `background:${bg};color:${fg}` }, lab))),
      h("h3", { class: "lv-h" }, "Status table (Y or N per turbine)"),
      ptable(w => { const b = bs.find(x => x.w === w); return b && b.y; }, { open: opts.open }),
      h("p", { class: "lv-note" }, "Filled in by itself from the commissioning sheets as the team submits. Tap a row for the results and photos."),
      h("h3", { class: "lv-h" }, "As it happens"),
      evs.length ? h("div", { class: "lv-feed" }, ...evs.slice(0, 200).flatMap((e, i) => { const d = dayOf(e.at), prev = i ? dayOf(evs[i - 1].at) : null;
        return [d !== prev ? h("div", { class: "lv-day" }, dt(e.at, SA)) : null, h("button", { type: "button", class: "lv-ev", onclick: () => opts.open && opts.open(e.w) }, h("time", {}, tm(e.at, SA)), h("span", {}, e.txt))]; })) : h("p", { class: "lv-wait" }, "Nothing yet."),
      h("p", { class: "lv-note" }, "All times are South African time. Tap a turbine or a line to see its results and photos.")].filter(Boolean));
  }
  function kv(rows) { return h("table", { class: "lv-kv" }, h("tbody", {}, ...rows.filter(r => r && r[1] != null && r[1] !== "").map(([k, v, cls]) => h("tr", {}, h("th", {}, k), h("td", { class: cls || "" }, String(v)))))); }
  function detail(b, d, opts) {
    const w = (b && b.w) || opts.sel, nm = w === "SUBSTATION" ? "Substation" : w;
    const back = h("button", { type: "button", class: "lv-back", onclick: () => opts.open && opts.open(null) }, "‹ All turbines");
    const [lab, bg, fg] = ST[(b && b.st) || "todo"] || ST.todo;
    const out = [back, h("div", { class: "lv-dh" }, h("b", {}, nm), h("span", { style: `background:${bg};color:${fg}` }, lab)), b && b.line ? h("p", { class: "lv-line" }, b.line) : null];
    if (b && b.st === "check") out.push(h("div", { class: "lv-ask" }, h("b", {}, "The team asks you to check now"), h("small", {}, b.ask || ""), h("em", {}, `Asked ${both(b.askAt)}`)));
    if (opts.detTop) out.push(opts.detTop(w));
    if (!d || (!d.el && !d.tc)) { out.push(h("p", { class: "lv-wait" }, "Results show here as soon as the team submits this sheet.")); return h("div", {}, ...out); }
    if (d.el) {
      const e = d.el;
      out.push(h("h3", {}, "Power, modules and mounting"), h("p", { class: "lv-sub" }, `Submitted ${both(e.at)}`));
      if (e.post) out.push(kv(e.post));
      if (e.mods && e.mods.rows.length) out.push(h("div", { class: "lv-mx" }, h("table", {}, h("thead", {}, h("tr", {}, h("th", {}, "PRC-SRV-03"), ...e.mods.n.map(i => h("th", {}, "M" + i)))),
        h("tbody", {}, ...e.mods.rows.map(r => h("tr", {}, h("th", {}, r.no + " " + r.lab), ...r.v.map(v => h("td", { class: "c-" + (v ? (/NOK|Water|High/.test(v) ? "bad" : v === "Corrected" ? "fix" : v === "N/A" ? "na" : "ok") : "") }, v ? ({ "No water": "OK", "Water": "WET", "Corrected": "FIX", "High": "HUM" }[v] || v) : "-"))))))));
      if (e.read && e.read.length) out.push(kv(e.read));
    }
    if (d.tc) {
      const t = d.tc;
      out.push(h("h3", {}, "Fibre and network"), h("p", { class: "lv-sub" }, `Submitted ${both(t.at)}`));
      if (t.fibre) out.push(kv(t.fibre));
      if (t.read && t.read.length) out.push(kv(t.read));
    }
    if (d.find && d.find.length) out.push(h("h3", {}, "Findings"), ...d.find.map(f => h("div", { class: "lv-find" }, h("b", {}, f.head), f.sn ? h("div", {}, "Module serial number: " + f.sn) : null, f.txt ? h("div", {}, f.txt) : null)));
    if (d.rep && d.rep.length) out.push(h("h3", {}, "Replaced components"), kv(d.rep.map(r => [`${r.item || "Part"}${r.pos ? ", " + r.pos : ""}`, `Removed SN ${r.out || "-"}, fitted SN ${r.in || "-"}`])));
    if (d.photos && d.photos.length) {
      out.push(h("h3", {}, "Photos"));
      const g = h("div", { class: "lv-ph" });
      for (const p of d.photos) { const img = h("img", { alt: p.cap }); const f = h("figure", {}, img, h("figcaption", {}, p.cap)); g.append(f);
        if (opts.photo) opts.photo(p.id).then(u => { if (u) { img.src = u; img.onclick = () => opts.zoom && opts.zoom(u, p.cap); } else img.alt = "Photo loads when there is signal"; }).catch(() => {}); }
      out.push(g);
    }
    return h("div", {}, ...out);
  }
  // messages between Bioseco and Fibraco. side: who is reading ("bioseco" or "fibraco"). send(txt) when a box is wanted.
  function thread(list, o = {}) {
    const box = h("div", { class: "lv-thr" }, h("b", { class: "lv-thr-h" }, o.title || "Messages"));
    if (!list.length) box.append(h("p", { class: "lv-thr-none" }, o.empty || "No messages yet."));
    for (const m of list.slice(-(o.max || 30))) {
      const mine = m.from === o.side;
      box.append(h("div", { class: "lv-msg " + (m.from === "bioseco" ? "bio" : "fib") + (mine ? " mine" : "") },
        h("div", { class: "lv-msg-h" }, `${m.who || (m.from === "bioseco" ? "Bioseco" : "Fibraco")}${m.from === "bioseco" ? " (Bioseco)" : " (Fibraco)"}${m.w && m.w !== "GENERAL" && !o.w ? ", " + (m.w === "SUBSTATION" ? "Substation" : m.w) : ""}  |  ${dt(m.at, SA)} ${tm(m.at, SA)}`),
        h("div", { class: "lv-msg-t" }, m.txt || ""), o.extra ? o.extra(m) : null));
    }
    if (o.send) {
      const ta = h("textarea", { rows: "2", placeholder: o.ph || "Type a message" }), err = h("div", { class: "lv-err" });
      const b = h("button", { type: "button", class: "lv-send", onclick: async () => { const t = ta.value.trim(); if (!t) return; b.disabled = true; b.textContent = "Sending..."; err.textContent = "";
        try { await o.send(t); ta.value = ""; } catch (e) { err.textContent = "Not sent. Check the signal and try again."; } b.disabled = false; b.textContent = "SEND"; } }, "SEND");
      box.append(h("div", { class: "lv-comp" }, ta, b), err);
    }
    return box;
  }
  return { render, both, dayOf, tm, msgs, thread, h, ptable, PIOTR, PCOLS };
})();
if (typeof module !== "undefined") module.exports = LiveUI;
