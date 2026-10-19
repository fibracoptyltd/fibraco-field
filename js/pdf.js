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
    root.querySelectorAll(".pd-head, h1, h2, h3, p, tr, .sigs, .none, table").forEach(el => {
      pts.add(Math.floor(el.getBoundingClientRect().top - top0));
    });
    return [...pts].sort((a, b) => a - b);
  }
  function pages(total, pts) {
    const out = []; let start = 0;
    while (start < total - 2) {
      const lim = start + CH;
      if (lim >= total) { out.push([start, total]); break; }
      const ok = pts.filter(p => p > start + 40 && p <= lim);
      const end = ok.length ? ok[ok.length - 1] : lim;
      out.push([start, end]); start = end;
    }
    return out;
  }

  async function diaryPdf(html, title) {
    let root = document.getElementById("pdf-root");
    if (!root) { root = document.createElement("div"); root.id = "pdf-root"; root.className = "pdoc"; document.body.append(root); }
    root.style.width = CW + "px";
    root.innerHTML = html;
    try {
      await Promise.all([...root.querySelectorAll("img")].map(i => i.complete ? 1 : new Promise(r => { i.onload = i.onerror = r; })));
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      const total = Math.ceil(root.scrollHeight);
      const pts = cutPoints(root);
      const scale = 2;
      const canvas = await window.html2canvas(root, { scale, backgroundColor: "#ffffff", useCORS: true, logging: false, windowWidth: CW, width: CW, height: total });
      const pdf = new window.jspdf.jsPDF({ unit: "mm", format: "a4", compress: true });
      const list = pages(total, pts);
      list.forEach(([a, b], n) => {
        const slice = document.createElement("canvas");
        slice.width = canvas.width; slice.height = Math.max(1, Math.round((b - a) * scale));
        const g = slice.getContext("2d");
        g.fillStyle = "#fff"; g.fillRect(0, 0, slice.width, slice.height);
        g.drawImage(canvas, 0, Math.round(a * scale), canvas.width, slice.height, 0, 0, canvas.width, slice.height);
        if (n) pdf.addPage("a4");
        const wmm = PAGE.w - 2 * PAGE.mx, hmm = (b - a) / MM;
        pdf.addImage(slice.toDataURL("image/jpeg", 0.86), "JPEG", PAGE.mx, PAGE.my, wmm, hmm, undefined, "FAST");
        pdf.setFontSize(7.5); pdf.setTextColor(110);
        pdf.text(`Page ${n + 1} of ${list.length}`, PAGE.w - PAGE.mx, PAGE.h - 7, { align: "right" });
      });
      pdf.setProperties({ title, author: "Fibraco (Pty) Ltd", creator: "Fibraco Field" });
      const safe = title.replace(/[\\/:*?"<>|]+/g, "-");
      return new File([pdf.output("blob")], safe + ".pdf", { type: "application/pdf" });
    } finally { root.innerHTML = ""; }
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
