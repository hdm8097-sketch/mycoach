/* ============================================================
   ميزانيتي | MIZANIYATI — توليد أيقونات Multicolor من SVG Repo
   المصدر: https://www.svgrepo.com/collections/multicolor/
   المُدخل: ملف JSON صادر عن جلب داخل المتصفح (خطوة الجلب في الأداة)
   المخرج: assets/js/icons-mc.js — كائن IconsMC.
   التطبيع: 1) تحويل <style> إلى سمات fill صريحة وإزالته (يمنع تسرب CSS)
             2) ضمان fill/stroke صريح لكل شكل (يمنع اختفائه مع fill:none)
             3) استبدال الألوان المحايدة (داكن/أبيض) بـ currentColor كي تتكيف
                مع كل الثيمات، وإبقاء الألوان المشبعة الثابتة (هوية ملوّنة)
             4) إزالة xmlns و噪声 بَنية.
   لا تعدّل المخرج يدوياً؛ أعد تشغيل الجلب ثم هذه الأداة.
   الاستخدام: node finance/tools/build-mc-icons.js <path/to/mc-icons.json>
   ============================================================ */
const fs = require('fs');
const path = require('path');

const src = process.argv[2];
if (!src) { console.error('Usage: node build-mc-icons.js <mc-icons.json>'); process.exit(1); }

const data = JSON.parse(fs.readFileSync(src, 'utf8'));

/* --- 1) تحويل قواعد <style> إلى سمات على العناصر --- */
function inlineStyles(s) {
  const styles = [...s.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)];
  if (!styles.length) return { s, rules: 0 };
  let rules = 0;
  const decls = new Map(); // className -> {fill, stroke, clip-path}
  for (const st of styles) {
    const css = st[1];
    for (const m of css.matchAll(/\.([A-Za-z_][\w-]*)\s*\{([^}]*)\}/g)) {
      const cls = m[1]; const body = m[2];
      const d = decls.get(cls) || {};
      for (const p of body.split(';')) {
        const mm = p.match(/^\s*(fill|stroke|clip-path)\s*:\s*([^;]+)$/);
        if (mm) d[mm[1]] = mm[2].trim();
      }
      decls.set(cls, d); rules++;
    }
  }
  // إزالة كتل style
  let out = s.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  // تطبيق القواعد على العناصر حسب class
  out = out.replace(/<(path|circle|ellipse|rect|polygon|polyline|line|use)\b([^>]*)>/g, (m, tag, attrs) => {
    const cm = attrs.match(/class="([^"]+)"/);
    if (!cm) return m;
    let a = attrs;
    for (const cls of cm[1].split(/\s+/)) {
      const d = decls.get(cls);
      if (!d) continue;
      for (const [k, v] of Object.entries(d)) {
        const re = new RegExp('\\b' + k + '="[^"]*"');
        if (re.test(a)) a = a.replace(re, k + '="' + v + '"');
        else a = a + ' ' + k + '="' + v + '"';
      }
    }
    return '<' + tag + a + '>';
  });
  return { s: out, rules };
}

/* --- 3) كشف الألوان المحايدة واستبدالها بـ currentColor --- */
function parseHex(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  if (h.length === 8) h = h.slice(0, 6); // تجاهل القناع
  if (h.length !== 6) return null;
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
/* معيار اللمعان (وليس التشبّع): أي لون أغمق من 90 يختفي على الثيم الداكن،
   وأي لون أفتح من 215 يختفي على الثيم الفاتح. ما تبقّى (90–215) يظهر على
   الخلفيتين معاً فيُبقى لونه الثابت ← هوية ملوّنة آمنة في كل الثيمات. */
function isNeutral(hex) {
  const p = parseHex(hex);
  if (!p) return false;
  const [r, g, b] = p;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  if (lum < 90) return true;   // غامق جداً → يتبع نص الثيم
  if (lum > 215) return true;  // فاتح جداً → يتبع نص الثيم
  return false;
}
function remapColors(s) {
  let replaced = 0;
  const res = s.replace(/#[0-9a-fA-F]{6,8}\b/g, m => {
    if (isNeutral(m)) { replaced++; return 'currentColor'; }
    return m;
  });
  return { s: res, replaced };
}

/* --- 2) ضمان fill/stroke صريح لكل شكل --- */
function ensureExplicit(s) {
  let added = 0;
  const out = s.replace(/<(path|circle|ellipse|rect|polygon|polyline|line)\b([^>]*?)(\/?)>/g, (m, tag, attrs, slash) => {
    if (/\bfill=/.test(attrs) || /\bstroke=/.test(attrs)) return m;
    added++;
    return '<' + tag + attrs + ' fill="currentColor"' + slash + '>';
  });
  return { s: out, added };
}

const out = {};
const stats = { total: 0, skipped: 0, styledIcons: 0, rules: 0, neutralReplaced: 0, explicitAdded: 0, monoOnly: 0 };
const monoKeys = [];

for (const key of Object.keys(data).sort()) {
  const e = data[key];
  if (!e || e.miss || e.err || !e.s) { stats.skipped++; continue; }
  stats.total++;
  let s = e.s;

  const inl = inlineStyles(s);
  if (inl.rules) { stats.styledIcons++; stats.rules += inl.rules; }
  s = inl.s;

  const exp = ensureExplicit(s);
  s = exp.s;
  stats.explicitAdded += exp.added;

  const rem = remapColors(s);
  s = rem.s;
  stats.neutralReplaced += rem.replaced;

  // إزالة xmlns و噪声
  s = s.replace(/\s+xmlns="[^"]*"/g, '').replace(/<title[^>]*\/?>/g, '').replace(/\s+data-name="[^"]*"/g, '');
  s = s.replace(/\s{2,}/g, ' ').trim();

  // تقرير: هل بقيت الأيقونة بلا أي لون مشبع (أصبحت أحادية currentColor)؟
  const kept = [...s.matchAll(/#[0-9a-fA-F]{6}\b/g)].filter(m => !isNeutral(m[0]));
  if (kept.length === 0) { stats.monoOnly++; monoKeys.push(key); }

  out[key] = { vb: e.vb || '0 0 24 24', s };
}

const banner = `/* ============================================================
   ميزانيتي | MIZANIYATI — أيقونات Multicolor (SVG Repo)
   المصدر: https://www.svgrepo.com/collections/multicolor/
   الألوان المشبعة ثابتة، والمحايدة currentColor ← تتكيف مع الثيمات.
   وُلِّدت بواسطة tools/build-mc-icons.js — لا تعدّلها يدوياً.
   تُستخدم عبر ic()/icHTML() مع اعتماد Solar كاحتياط.
   ============================================================ */
const IconsMC = `;
const code = banner + JSON.stringify(out, null, 1) + ';\n\nconsole.debug("[mizaniyati] multicolor icons loaded:", Object.keys(IconsMC).length);\n';

const dest = path.join(__dirname, '..', 'assets', 'js', 'icons-mc.js');
fs.writeFileSync(dest, code, 'utf8');

console.log('Wrote', dest);
console.log('icons:', stats.total, 'skipped:', stats.skipped);
console.log('style-blocks converted:', stats.styledIcons, '(' + stats.rules + ' rules)');
console.log('explicit fills added:', stats.explicitAdded);
console.log('neutral colors → currentColor:', stats.neutralReplaced);
console.log('now mono (all-neutral):', stats.monoOnly, '→', monoKeys.join(','));
console.log('file bytes:', code.length);
