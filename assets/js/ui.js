/* =========================================================
   MyCoach — أدوات الواجهة (Toast / Modal / Drawer / Charts / Print)
   ========================================================= */
const UI = (() => {

  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g,
    c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- Toast ---------- */
  function toast(msg, type = "ok") {
    const el = document.createElement("div");
    el.className = "toast " + (type === "ok" ? "" : type);
    el.textContent = msg;
    $("#toasts").appendChild(el);
    setTimeout(() => { el.style.opacity = "0"; el.style.transform = "translateX(-20px)"; }, 2600);
    setTimeout(() => el.remove(), 3000);
  }

  /* ---------- Modal ---------- */
  let onSave = null;
  function modal({ title, body, saveText = "حفظ", cancelText = "إلغاء", onSave: cb, wide = false, hideSave = false }) {
    $("#modalTitle").textContent = title;
    $("#modalBody").innerHTML = body;
    $("#modalFoot").innerHTML = hideSave
      ? `<button class="btn btn-soft" data-x>إغلاق</button>`
      : `<button class="btn btn-soft" data-x>${esc(cancelText)}</button>
         <button class="btn btn-primary" data-save>${esc(saveText)}</button>`;
    $("#modal").style.width = wide ? "min(980px,100%)" : "";
    onSave = cb || null;
    window.__modalSave = onSave;
    $("#modalBackdrop").hidden = false;
    document.body.style.overflow = "hidden";
    const first = $("#modalBody input, #modalBody select, #modalBody textarea");
    if (first) setTimeout(() => first.focus(), 60);
  }
  function closeModal() {
    $("#modalBackdrop").hidden = true;
    document.body.style.overflow = "";
    onSave = null;
  }

  /* ---------- Drawer ---------- */
  function drawer(title, body) {
    $("#drawerTitle").innerHTML = title;
    $("#drawerBody").innerHTML = body;
    $("#drawerBackdrop").hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeDrawer() {
    $("#drawerBackdrop").hidden = true;
    document.body.style.overflow = "";
  }

  /* ---------- Confirm ---------- */
  function confirm(msg, onYes, danger = true) {
    modal({
      title: "تأكيد",
      body: `<p style="font-size:14.5px;line-height:1.7">${msg}</p>`,
      saveText: "نعم، متابعة",
      onSave: () => { closeModal(); onYes && onYes(); }
    });
    if (danger) $("#modalFoot [data-save]").className = "btn btn-danger";
  }

  /* ---------- Small renderers ---------- */
  const tag = (txt, cls = "") => `<span class="tag ${cls}">${esc(txt)}</span>`;
  const initials = n => (n || "?").trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("");
  const grad = id => "g" + (Math.abs(hash(id)) % 5 + 1);
  function hash(s) { let h = 0; s = String(s); for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i); return h; }
  const fmtDate = t => new Date(t).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });
  const today = () => new Date().toISOString().slice(0, 10);
  const kg = n => (Math.round(n * 10) / 10) + " كجم";
  const kcal = n => Math.round(n).toLocaleString("en-US") + " سعرة";

  function empty(icon, title, sub, btn) {
    return `<div class="empty"><div class="e-ico">${icon}</div><h4>${esc(title)}</h4>
      <p>${esc(sub)}</p>${btn || ""}</div>`;
  }

  /* ---------- Charts (SVG, offline) ---------- */
  function lineChart(values, opts = {}) {
    const w = 520, h = 200, pad = 32;
    if (!values.length) return `<p class="muted">لا توجد بيانات كافية بعد.</p>`;
    const min = Math.min(...values), max = Math.max(...values);
    const span = (max - min) || 1;
    const xs = i => pad + i * ((w - pad * 2) / Math.max(values.length - 1, 1));
    const ys = v => h - pad - ((v - min) / span) * (h - pad * 2);
    const pts = values.map((v, i) => `${xs(i)},${ys(v)}`).join(" ");
    let grid = "", labels = "";
    for (let g = 0; g <= 3; g++) {
      const y = pad + g * ((h - pad * 2) / 3);
      grid += `<line class="gl" x1="${pad}" y1="${y}" x2="${w - pad}" y2="${y}"/>`;
      const val = (max - g * (span / 3)).toFixed(1);
      labels += `<text x="4" y="${y + 3}">${val}</text>`;
    }
    const dots = values.map((v, i) => `<circle class="pt" cx="${xs(i)}" cy="${ys(v)}" r="4"><title>${v}</title></circle>`).join("");
    const xlab = (opts.labels || []).map((l, i) =>
      `<text x="${xs(i)}" y="${h - 8}" text-anchor="middle">${esc(String(l).slice(0, 7))}</text>`).join("");
    return `<svg class="chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
      ${grid}${labels}<polyline class="ln" points="${pts}"/>${dots}${xlab}
      ${opts.unit ? `<text x="${w - pad}" y="14" text-anchor="end">${esc(opts.unit)}</text>` : ""}
    </svg>`;
  }

  function barChart(items) {
    if (!items.length) return `<p class="muted">لا توجد بيانات.</p>`;
    const w = 520, h = 200, pad = 34;
    const max = Math.max(...items.map(i => i.v)) || 1;
    const bw = (w - pad * 2) / items.length;
    let bars = "", labels = "";
    items.forEach((it, i) => {
      const bh = (it.v / max) * (h - pad * 2);
      const x = pad + i * bw + bw * 0.18;
      bars += `<rect x="${x}" y="${h - pad - bh}" width="${bw * 0.64}" height="${bh}" rx="4"
                 fill="url(#g1)"><title>${esc(it.l)}: ${it.v}</title></rect>`;
      labels += `<text x="${x + bw * 0.32}" y="${h - pad + 14}" text-anchor="middle">${esc(it.l)}</text>`;
      labels += `<text x="${x + bw * 0.32}" y="${h - pad - bh - 5}" text-anchor="middle" style="fill:var(--brand2)">${it.v}</text>`;
    });
    let gl = "";
    for (let g = 0; g <= 3; g++) {
      const y = pad + g * ((h - pad * 2) / 3);
      gl += `<line class="gl" x1="${pad}" y1="${y}" x2="${w - pad}" y2="${y}"/>
             <text x="4" y="${y + 3}">${Math.round(max - g * (max / 3))}</text>`;
    }
    return `<svg class="chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
      <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" style="stop-color:var(--brand)"/><stop offset="100%" style="stop-color:var(--brand-deep2)"/>
      </linearGradient></defs>${gl}${bars}${labels}</svg>`;
  }

  function ring(pct, color = "var(--brand)") {
    const r = 42, c = 2 * Math.PI * r;
    const off = c - (Math.max(0, Math.min(100, pct)) / 100) * c;
    return `<svg width="104" height="104" viewBox="0 0 104 104">
      <circle cx="52" cy="52" r="${r}" fill="none" style="stroke:var(--line)" stroke-width="11"/>
      <circle cx="52" cy="52" r="${r}" fill="none" stroke="${color}" stroke-width="11"
        stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}"
        transform="rotate(-90 52 52)"/>
      <text x="52" y="57" text-anchor="middle" style="fill:var(--txt)" font-size="20" font-weight="800">${Math.round(pct)}%</text>
    </svg>`;
  }

  /* ---------- Print ---------- */
  function print(html) {
    $("#printArea").innerHTML = html;
    setTimeout(() => window.print(), 60);
  }
  const printFooter = () => {
    const s = Store.get().settings;
    return `<div class="p-ft">${esc(s.trainer || "مدرب")} ${s.gym ? "· " + esc(s.gym) : ""}
      ${s.phone ? "· " + esc(s.phone) : ""} · صدر بواسطة MyCoach — ${new Date().toLocaleDateString("ar-EG")}</div>`;
  };

  return { esc, $, $$, toast, modal, closeModal, drawer, closeDrawer, confirm, tag,
           initials, grad, fmtDate, today, kg, kcal, empty, lineChart, barChart, ring,
           print, printFooter, hash };
})();
