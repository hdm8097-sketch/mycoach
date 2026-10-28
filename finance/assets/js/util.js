/* ============================================================
   ميزانيتي | MIZANIYATI — أدوات عامة (DOM، تنسيق، تنبيهات، رسوم بيانية)
   ============================================================ */
const U = (() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  /* --- DOM --- */
  /* أيقونات SVG ضمن نصوص — تُحلَّل وتُنقّى من أي وسم غير آمن */
  const SVG_TAGS = new Set(['svg', 'g', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse']);
  const SVG_ATTRS = new Set([
    'class', 'viewbox', 'width', 'height', 'style', 'aria-hidden', 'xmlns',
    'd', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin',
    'opacity', 'transform', 'fill-rule', 'clip-rule', 'points',
    'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry',
  ]);
  function svgFragment(html) {
    const tpl = document.createElement('template');
    tpl.innerHTML = html;
    const rootSrc = tpl.content.firstElementChild;
    if (!rootSrc || rootSrc.tagName.toLowerCase() !== 'svg') return document.createTextNode(html);
    const root = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const copy = (src, dst) => {
      for (const a of src.attributes || []) {
        const nm = a.name.toLowerCase();
        if (nm.startsWith('on') || !SVG_ATTRS.has(nm)) continue;
        dst.setAttribute(a.name, a.value);
      }
      for (const ch of src.children) {
        if (!SVG_TAGS.has(ch.tagName.toLowerCase())) continue;
        const c = document.createElementNS('http://www.w3.org/2000/svg', ch.tagName.toLowerCase());
        copy(ch, c);
        dst.append(c);
      }
    };
    copy(rootSrc, root);
    root.setAttribute('aria-hidden', 'true');
    return root;
  }
  const SVG_RE = /<svg[\s\S]*?<\/svg>/gi;
  function strChild(s) {
    if (!s.includes('<svg')) return document.createTextNode(s);
    const frag = document.createDocumentFragment();
    let last = 0, m;
    SVG_RE.lastIndex = 0;
    while ((m = SVG_RE.exec(s))) {
      if (m.index > last) frag.append(document.createTextNode(s.slice(last, m.index)));
      frag.append(svgFragment(m[0]));
      last = m.index + m[0].length;
    }
    if (last < s.length) frag.append(document.createTextNode(s.slice(last)));
    return frag;
  }
  function el(tag, attrs = {}, ...children) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k === 'html') n.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
      else if (k === 'dataset') Object.assign(n.dataset, v);
      else n.setAttribute(k, v === true ? '' : v);
    }
    for (const c of children.flat()) {
      if (c == null || c === false) continue;
      n.append(c.nodeType ? c : strChild(String(c)));
    }
    return n;
  }
  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  let seq = 0;
  const uid = p => `${p || 'id'}_${Date.now().toString(36)}${(seq++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

  /* --- تنسيق الأرقام والتواريخ --- */
  const loc = () => (I18n.lang() === 'ar' ? 'ar' : 'en');
  function fmtNum(n, dec = 2) {
    const v = Number(n) || 0;
    return new Intl.NumberFormat(loc(), { numberingSystem: 'latn', minimumFractionDigits: 0, maximumFractionDigits: dec }).format(v);
  }
  /* العملة الحالية من الخزنة (بدون رفع استثناء إن كانت مقفلة) */
  function activeCurrency() {
    try {
      const d = typeof App !== 'undefined' && App.data && App.data();
      return d?.profile?.currency || 'USD';
    } catch { return 'USD'; }
  }
  function fmtMoney(n, currency) {
    const cur = currency || activeCurrency();
    const sym = Data.CURRENCIES[cur]?.sym || cur;
    const v = Number(n) || 0;
    const s = fmtNum(Math.abs(v), Math.abs(v) % 1 === 0 ? 0 : 2);
    return `${v < 0 ? '-' : ''}${s} ${sym}`;
  }
  function fmtCompact(n) {
    const v = Number(n) || 0;
    const cur = activeCurrency();
    const sym = Data.CURRENCIES[cur]?.sym || cur;
    if (Math.abs(v) >= 1e9) return `${fmtNum(v / 1e9, 1)}B ${sym}`;
    if (Math.abs(v) >= 1e6) return `${fmtNum(v / 1e6, 1)}M ${sym}`;
    if (Math.abs(v) >= 1e3) return `${fmtNum(v / 1e3, 1)}K ${sym}`;
    return fmtMoney(v, cur);
  }
  const pad2 = n => String(n).padStart(2, '0');
  const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; };
  const monthKey = (d = new Date()) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
  const monthOf = iso => String(iso || '').slice(0, 7);
  function monthLabel(mk, short = false) {
    const [y, m] = String(mk).split('-').map(Number);
    if (!y || !m) return mk;
    return new Intl.DateTimeFormat(loc(), { month: short ? 'short' : 'long', year: short ? undefined : 'numeric' }).format(new Date(y, m - 1, 1));
  }
  function fmtDate(iso, style = 'med') {
    if (!iso) return '';
    const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
    if (isNaN(d)) return iso;
    const opts = style === 'short' ? { day: 'numeric', month: 'short' } : style === 'time' ? { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' } : { day: 'numeric', month: 'short', year: 'numeric' };
    return new Intl.DateTimeFormat(loc(), opts).format(d);
  }
  function relTime(ts) {
    const diff = Date.now() - ts, m = Math.round(diff / 60000);
    if (m < 1) return I18n.t('justNow');
    if (m < 60) return I18n.t('minsAgo', { n: m });
    const h = Math.round(m / 60);
    if (h < 24) return I18n.t('hoursAgo', { n: h });
    return I18n.t('daysAgo', { n: Math.round(h / 24) });
  }
  const addMonths = (mk, n) => { const [y, m] = mk.split('-').map(Number); const d = new Date(y, m - 1 + n, 1); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`; };
  const daysInMonth = mk => { const [y, m] = mk.split('-').map(Number); return new Date(y, m, 0).getDate(); };

  /* --- تنبيهات Toast --- */
  function toast(msg, type = 'ok', ms = 3200) {
    const root = $('#toasts');
    const icons = { ok: 'check', err: 'close', warn: 'danger', info: 'info' };
    const n = el('div', { class: `toast toast-${type}` },
      el('span', { class: 'toast-ic' }, typeof ic === 'function' ? ic(icons[type] || 'info') : '•'),
      el('span', {}, msg));
    root.append(n);
    requestAnimationFrame(() => n.classList.add('show'));
    setTimeout(() => { n.classList.remove('show'); setTimeout(() => n.remove(), 300); }, ms);
  }

  /* --- نوافذ منبثقة --- */
  function modal({ title, body, actions = [], wide = false, onClose } = {}) {
    const overlay = el('div', { class: 'overlay' });
    const box = el('div', { class: `modal ${wide ? 'modal-wide' : ''}`, role: 'dialog', 'aria-modal': 'true' });
    const close = () => { overlay.classList.remove('show'); setTimeout(() => overlay.remove(), 200); onClose && onClose(); };
    box.append(el('div', { class: 'modal-head' },
      el('h3', {}, title),
      el('button', { class: 'icon-btn', 'aria-label': 'close', onclick: close }, typeof ic === 'function' ? ic('close') : '✕')));
    const bodyWrap = el('div', { class: 'modal-body' });
    if (body) bodyWrap.append(body.nodeType ? body : el('div', { html: body }));
    box.append(bodyWrap);
    if (actions.length) {
      box.append(el('div', { class: 'modal-foot' },
        actions.map(a => el('button', { class: `btn ${a.class || 'btn-ghost'}`, onclick: () => a.onClick ? a.onClick(close) : close() }, a.label))));
    }
    overlay.append(box);
    overlay.addEventListener('mousedown', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function onEsc(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onEsc); }
    });
    $('#modals').append(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));
    const f = box.querySelector('input,select,textarea');
    if (f) setTimeout(() => f.focus(), 60);
    return { el: box, close };
  }
  function confirmBox(msg, { danger = false, okLabel, cancelLabel, detail } = {}) {
    return new Promise(res => {
      modal({
        title: danger ? (typeof icHTML === 'function' ? icHTML('danger') + ' ' : '⚠️ ') + t('confirm') : t('confirm'),
        body: el('div', { class: 'confirm-body' }, el('p', {}, msg), detail ? el('p', { class: 'muted small' }, detail) : null),
        actions: [
          { label: cancelLabel || t('cancel'), class: 'btn-ghost', onClick: c => { c(); res(false); } },
          { label: okLabel || t('ok'), class: danger ? 'btn-danger' : 'btn-primary', onClick: c => { c(); res(true); } },
        ],
      });
    });
  }

  /* --- ملفات --- */
  function download(filename, content, mime = 'application/json') {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mime + ';charset=utf-8' });
    const a = el('a', { href: URL.createObjectURL(blob), download: filename });
    document.body.append(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
  }
  function pickFile(accept = '.json') {
    return new Promise(res => {
      const inp = el('input', { type: 'file', accept, style: 'display:none' });
      inp.addEventListener('change', () => res(inp.files[0] || null));
      document.body.append(inp); inp.click();
      setTimeout(() => inp.remove(), 60000);
    });
  }
  const readFileText = file => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsText(file); });
  function toCSV(rows) {
    return rows.map(r => r.map(c => {
      const s = String(c ?? '');
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(',')).join('\n');
  }

  /* ============================================================
     رسوم بيانية خفيفة (SVG) — بدون أي مكتبات خارجية
     ============================================================ */
  function chartTheme() {
    const cs = getComputedStyle(document.documentElement);
    return {
      grid: cs.getPropertyValue('--chart-grid').trim() || 'rgba(255,255,255,.08)',
      text: cs.getPropertyValue('--text-2').trim() || '#9aa4b2',
      income: cs.getPropertyValue('--c-income').trim() || '#34d399',
      expense: cs.getPropertyValue('--c-expense').trim() || '#f87171',
    };
  }
  /* أعمدة مزدوجة (دخل/مصروف) عبر الأشهر */
  function barLine(container, { labels, series, height = 200 }) {
    const th = chartTheme();
    const W = 640, H = height, padL = 8, padB = 26, padT = 18;
    const max = Math.max(1, ...series.flatMap(s => s.values));
    const groups = labels.length, gw = (W - padL * 2) / groups;
    const bw = Math.min(26, (gw - 10) / series.length);
    let svg = `<svg viewBox="0 0 ${W} ${H}" class="chart" preserveAspectRatio="none">`;
    for (let i = 0; i <= 3; i++) {
      const y = padT + (H - padT - padB) * (i / 3);
      svg += `<line x1="${padL}" y1="${y}" x2="${W - padL}" y2="${y}" stroke="${th.grid}" stroke-width="1"/>`;
    }
    labels.forEach((lb, i) => {
      const gx = padL + gw * i + gw / 2;
      series.forEach((s, j) => {
        const v = s.values[i] || 0;
        const h = (H - padT - padB) * (v / max);
        const x = gx - (series.length * bw) / 2 + j * bw;
        svg += `<rect x="${x}" y="${H - padB - h}" width="${bw - 3}" height="${Math.max(h, v > 0 ? 2 : 0)}" rx="3" fill="${s.color}"><title>${esc(s.name)}: ${fmtNum(v, 0)}</title></rect>`;
      });
      svg += `<text x="${gx}" y="${H - 8}" text-anchor="middle" font-size="11" fill="${th.text}">${esc(lb)}</text>`;
    });
    svg += `</svg>`;
    container.innerHTML = `<div class="chart-wrap">${svg}</div>`;
  }
  /* دائري (Donut) */
  function donut(container, items, { centerLabel, centerValue, height = 180 } = {}) {
    const total = items.reduce((s, i) => s + i.value, 0);
    if (!total) { container.innerHTML = `<div class="empty-mini">${esc(I18n.t('noData'))}</div>`; return; }
    const R = 60, C = 2 * Math.PI * R, cx = 90, cy = 90;
    let off = 0, arcs = '';
    items.forEach(it => {
      const frac = it.value / total, len = frac * C;
      arcs += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${it.color}" stroke-width="26"
        stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-off}" transform="rotate(-90 ${cx} ${cy})">
        <title>${esc(it.label)}: ${frac * 100 < 0.1 ? '<0.1' : (frac * 100).toFixed(1)}%</title></circle>`;
      off += len;
    });
    const legend = items.slice(0, 8).map(it => `
      <div class="legend-row"><span class="dot" style="background:${it.color}"></span>
      <span class="legend-label">${esc(it.label)}</span>
      <span class="legend-val">${U.fmtMoney(it.value)}</span>
      <span class="legend-pct">${total ? (it.value / total * 100).toFixed(1) : 0}%</span></div>`).join('');
    container.innerHTML = `
      <div class="donut-box" style="min-height:${height}px">
        <svg viewBox="0 0 180 180" class="donut">${arcs}
          <text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="15" fill="var(--text-1)" font-weight="700">${esc(centerValue || '')}</text>
          <text x="${cx}" y="${cy + 16}" text-anchor="middle" font-size="10.5" fill="var(--text-2)">${esc(centerLabel || '')}</text>
        </svg>
        <div class="legend">${legend}</div>
      </div>`;
  }
  /* عدّاد الدرجة (نصف دائرة) */
  function gauge(container, score, label) {
    score = Math.max(0, Math.min(100, Math.round(score)));
    const col = score >= 80 ? 'var(--c-income)' : score >= 60 ? 'var(--c-warn)' : score >= 40 ? 'var(--c-orange)' : 'var(--c-expense)';
    const R = 62, C = Math.PI * R;
    const len = (score / 100) * C;
    container.innerHTML = `
      <div class="gauge-box">
        <svg viewBox="0 0 160 92">
          <path d="M 18 82 A ${R} ${R} 0 0 1 142 82" fill="none" stroke="var(--chart-grid)" stroke-width="14" stroke-linecap="round"/>
          <path d="M 18 82 A ${R} ${R} 0 0 1 142 82" fill="none" stroke="${col}" stroke-width="14" stroke-linecap="round"
            stroke-dasharray="${len} ${C}" class="gauge-arc"/>
          <text x="80" y="72" text-anchor="middle" font-size="30" font-weight="800" fill="${col}">${score}</text>
        </svg>
        <div class="gauge-label">${esc(label || '')}</div>
      </div>`;
  }

  /* --- تشفير/فك تشفير بسيط للنسخ الاحتياطي غير المحمي بالمفتاح (AES-GCM) --- */
  const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
  const unb64 = str => Uint8Array.from(atob(str), c => c.charCodeAt(0));
  async function deriveKey(pin, salt, iter) {
    const km = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, km, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  async function encJSON(key, obj) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(obj)));
    return { iv: b64(iv), ct: b64(ct) };
  }
  async function decJSON(key, pack) {
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(pack.iv) }, key, unb64(pack.ct));
    return JSON.parse(new TextDecoder().decode(pt));
  }

  return {
    $, $$, el, esc, uid, debounce, fmtNum, fmtMoney, fmtCompact, fmtDate, relTime, monthLabel, monthKey, monthOf,
    todayISO, pad2, addMonths, daysInMonth, toast, modal, confirmBox, download, pickFile, readFileText, toCSV,
    Charts: { barLine, donut, gauge }, Crypto: { b64, unb64, deriveKey, encJSON, decJSON },
  };
})();
