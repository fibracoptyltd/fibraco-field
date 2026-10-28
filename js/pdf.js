// Fibraco Field: turns the signed daily diary into an A4 PDF file on the phone and opens the share menu.
// Loaded only when someone taps "Send diary". Works offline, the libraries are kept on the phone.
(function () {
  const MM = 96 / 25.4;                       // CSS pixels per millimetre
  const PAGE = { w: 210, h: 297, mx: 12, my: 14 };
  const CW = Math.round((PAGE.w - 2 * PAGE.mx) * MM);   // content width in CSS px
  const CH = Math.floor((PAGE.h - 2 * PAGE.my) * MM);   // content height per page in CSS px

  // Where a page may end: at the top of a block, never through a table row or signature block.
  function cutPoints(root) {
    const top0 = root.getBoundingClientRect().top;
    const pts = new Set([0]);
    root.querySelectorAll(".pd-head, h1, h2, h3, p, tr, .sigs, .none, table, .ppep, .dst-hd, .dst-band, .dst-desc, .pgrid figure:not(.f1)").forEach(el => {
      pts.add(Math.floor(el.getBoundingClientRect().top - top0));
    });
    return [...pts].sort((a, b) => a - b);
  }
  function pages(total, pts, forced) {
    const out = []; let start = 0;
    while (start < total - 2) {
      const lim = start + CH;
      const f = (forced || []).find(p => p > start + 40 && p <= lim); // a new page must start here
      if (f) { out.push([start, f]); start = f; continue; }
      if (lim >= total) { out.push([start, total]); break; }
      const ok = pts.filter(p => p > start + 40 && p <= lim);
      const end = ok.length ? ok[ok.length - 1] : lim;
      out.push([start, end]); start = end;
    }
    return out;
  }

  // opts: scale and quality for a smaller file, maxBytes to split a long report into parts that fit in an email
  async function diaryPdf(html, title, opts) {
    opts = opts || {};
    let root = document.getElementById("pdf-root");
    if (!root) { root = document.createElement("div"); root.id = "pdf-root"; root.className = "pdoc"; document.body.append(root); }
    root.style.width = CW + "px";
    root.innerHTML = `<div class="pdf-in">${html}</div>`; root.style.height = ""; root.style.overflow = "";
    try {
      await Promise.all([...root.querySelectorAll("img")].map(i => i.complete ? 1 : new Promise(r => { i.onload = i.onerror = r; })));
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      const total = Math.ceil(root.scrollHeight);
      const pts = cutPoints(root), top0 = root.getBoundingClientRect().top;
      const forced = [...root.querySelectorAll(".pbreak")].map(el => Math.floor(el.getBoundingClientRect().top - top0));
      const scale = opts.scale || 2;
      const list = pages(total, pts, forced);
      // long reports: draw a few pages at a time, a phone cannot hold one huge picture of 50 pages
      const inner = root.firstElementChild, MAXH = Math.floor(9000 / scale);
      const chunks = []; for (const pg of list) { const c = chunks[chunks.length - 1]; if (c && pg[1] - c.a <= MAXH) { c.b = pg[1]; c.pages.push(pg); } else chunks.push({ a: pg[0], b: pg[1], pages: [pg] }); }
      const mk = () => new window.jspdf.jsPDF({ unit: "mm", format: "a4", compress: true });
      const docs = [{ pdf: mk(), n: 0, bytes: 0 }]; let n = 0;
      for (const ch of chunks) {
        // show only this stretch of the document: move the content up and clip the rest
        inner.style.marginTop = -ch.a + "px"; root.style.height = (ch.b - ch.a) + "px"; root.style.overflow = "hidden";
        const canvas = await window.html2canvas(root, { scale, backgroundColor: "#ffffff", useCORS: true, logging: false, windowWidth: CW, width: CW, height: ch.b - ch.a });
        for (const [a, b] of ch.pages) {
          const slice = document.createElement("canvas");
          slice.width = canvas.width; slice.height = Math.max(1, Math.round((b - a) * scale));
          const g = slice.getContext("2d");
          g.fillStyle = "#fff"; g.fillRect(0, 0, slice.width, slice.height);
          g.drawImage(canvas, 0, Math.round((a - ch.a) * scale), canvas.width, slice.height, 0, 0, canvas.width, slice.height);
          const jpg = slice.toDataURL("image/jpeg", opts.quality || 0.86), sz = jpg.length * 0.75;
          let d = docs[docs.length - 1];
          if (opts.maxBytes && d.n && d.bytes + sz > opts.maxBytes) { d = { pdf: mk(), n: 0, bytes: 0 }; docs.push(d); }
          if (d.n) d.pdf.addPage("a4");
          const wmm = PAGE.w - 2 * PAGE.mx, hmm = (b - a) / MM;
          d.pdf.addImage(jpg, "JPEG", PAGE.mx, PAGE.my, wmm, hmm, undefined, "FAST");
          d.pdf.setFontSize(7.5); d.pdf.setTextColor(110);
          d.pdf.text(`Page ${n + 1} of ${list.length}`, PAGE.w - PAGE.mx, PAGE.h - 7, { align: "right" });
          d.n++; d.bytes += sz; n++;
        }
        canvas.width = canvas.height = 0;
      }
      const safe = title.replace(/[\\/:*?"<>|]+/g, "-");
      const files = docs.map((d, i) => { d.pdf.setProperties({ title, author: "Fibraco (Pty) Ltd", creator: "Fibraco Field" });
        return new File([d.pdf.output("blob")], safe + (docs.length > 1 ? ` (part ${i + 1} of ${docs.length})` : "") + ".pdf", { type: "application/pdf" }); });
      return opts.maxBytes ? files : files[0];
    } finally { root.innerHTML = ""; root.style.height = ""; root.style.overflow = ""; }
  }

  // Opens the phone's share menu (WhatsApp, Gmail, Outlook and so on) with the PDF attached.
  // If the device cannot share files (some laptops), the PDF is downloaded instead.
  async function shareFile(file, text) {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: file.name.replace(/\.pdf$/, ""), text }); return "shared"; }
      catch (e) { if (e && e.name === "AbortError") return "cancelled"; }
    }
    const a = document.createElement("a"); a.href = URL.createObjectURL(file); a.download = file.name;
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 30000);
    return "downloaded";
  }
  window.FibPdf = { diaryPdf, shareFile };
})();
