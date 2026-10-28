/* ============================================================
   ميزانيتي | MIZANIYATI — جلب أيقونات Solar Line Duotone
   المصدر: 480-Design/Solar-Icon-Set (GitHub) — نفس مجموعة SVG Repo
   https://www.svgrepo.com/collection/solar-line-duotone-icons/
   يُنتج: assets/js/icons.js  (يعمل بدون إنترنت داخل PWA)
   التشغيل: node finance/tools/fetch-icons.js
   ============================================================ */
const fs = require('fs');
const path = require('path');

const BASE = 'https://raw.githubusercontent.com/480-Design/Solar-Icon-Set/main/icons/SVG/Line%20Duotone/';

/* key → مسار الملف داخل المجموعة */
const MAP = {
  /* --- التنقل (الشريط الجانبي) --- */
  dashboard: 'Essentional, UI/Home Smile',
  tx: 'Money/Bill List',
  accounts: 'Money/Wallet',
  budget: 'Essentional, UI/Target',
  recurring: 'Time/Clock Circle',
  advisor: 'Essentional, UI/Magic Stick 2',
  reports: 'Business, Statistic/Chart Square',
  settings: 'Settings, Fine Tuning/Settings Minimalistic',

  /* --- الشريط العلوي --- */
  menu: 'Essentional, UI/Hamburger Menu',
  search: 'Search/Magnifer',
  bell: 'Notifications/Bell',
  palette: 'Design, Tools/Palette',
  refresh: 'Arrows/Refresh Circle',
  lock: 'Security/Lock Password',
  unlock: 'Security/Lock Password Unlocked',
  logout: 'Arrows Action/Logout 2',
  globe: 'Map & Location/Globus',
  user: 'Users/User Rounded',
  language: 'School/Book',

  /* --- بطاقات الملخص (KPI) --- */
  wallet: 'Money/Wallet Money',
  income: 'Business, Statistic/Graph Up',
  expense: 'Business, Statistic/Graph Down',
  savings: 'Essentional, UI/Waterdrop',

  /* --- أعمدة لوحة التحكم --- */
  activity: 'Time/Calendar Mark',
  stats: 'Business, Statistic/Chart 2',
  pie: 'Business, Statistic/Pie Chart',
  trend: 'Business, Statistic/Graph New Up',

  /* --- تصنيفات الدخل --- */
  salary: 'School/Case',
  freelance: 'Electronic, Devices/Laptop',
  business: 'Shopping, Ecommerce/Shop',
  investment: 'Business, Statistic/Course Up',
  rent_in: 'Essentional, UI/Home Smile Angle',
  gift_in: 'Essentional, UI/Gift',
  other_in: 'Essentional, UI/Add Circle',

  /* --- تصنيفات المصروف --- */
  food: 'Shopping, Ecommerce/Cart',
  housing: 'Essentional, UI/Home',
  utilities: 'Essentional, UI/Bolt',
  transport: 'Essentional, UI/Fuel',
  health: 'Like/Heart',
  education: 'School/Book',
  family: 'Users/Users Group Rounded',
  charity: 'Users/User Hands',
  restaurants: 'Essentional, UI/Plate',
  shopping: 'Shopping, Ecommerce/Bag',
  entertainment: 'Video, Audio, Sound/Play Circle',
  gifts: 'Essentional, UI/Confetti',
  tech: 'Call/Phone',
  travel: 'Nature, Travel/Suitcase',
  debt: 'Money/Card Send',
  other_out: 'Essentional, UI/Box',

  /* --- أنواع الحسابات --- */
  cash: 'Money/Banknote',
  bank: 'Money/Safe Square',
  wallet2: 'Money/Wallet 2',
  piggy: 'Money/Money Bag',
  credit: 'Money/Card 2',
  box: 'Essentional, UI/Box Minimalistic',

  /* --- مؤشرات المستشار --- */
  drop: 'Essentional, UI/Waterdrop',
  umbrella: 'Essentional, UI/Umbrella',
  calendar: 'Time/Calendar',
  chain: 'Money/Tag',
  basket: 'Shopping, Ecommerce/Bag Smile',
  gauge: 'Essentional, UI/Target',

  /* --- إجراءات --- */
  plus: 'Essentional, UI/Add Circle',
  add: 'Essentional, UI/Add Square',
  pen: 'Messages, Conversation/Pen 2',
  trash: 'Essentional, UI/Trash Bin Minimalistic',
  close: 'Essentional, UI/Close Circle',
  check: 'Essentional, UI/Check Circle',
  download: 'Arrows Action/Download',
  upload: 'Arrows Action/Upload',
  printer: 'Electronic, Devices/Printer',
  filter: 'Essentional, UI/Filter',
  info: 'Essentional, UI/Info Circle',
  danger: 'Essentional, UI/Danger Triangle',
  shield: 'Security/Shield Check',
  inbox: 'Messages, Conversation/Inbox',
  bolt: 'Essentional, UI/Bolt',
  send: 'Arrows Action/Send Square',
  copy: 'Essentional, UI/Copy',
  eye: 'Security/Eye',
  star: 'Astronomy/Star Circle',
  arrowUR: 'Arrows Action/Arrow To Top Right',
  arrowR: 'Arrows/Alt Arrow Right',
  arrowL: 'Arrows/Alt Arrow Left',
  arrowUp: 'Arrows/Alt Arrow Up',
  arrowDown: 'Arrows/Alt Arrow Down',
  doc: 'Notes/Document',
  cloud: 'Weather/Cloud',
  lightning: 'Electronic, Devices/Lightning',
  crown: 'Essentional, UI/Crown Line',
  moon: 'Weather/Moon',
  sun: 'Weather/Sun',
};

async function main() {
  const out = {};
  const missing = [];
  let i = 0;
  const entries = Object.entries(MAP);
  for (const [key, file] of entries) {
    i++;
    process.stdout.write(`[${i}/${entries.length}] ${key} … `);
    try {
      const url = BASE + encodeURIComponent(file + '.svg');
      const res = await fetch(url, { headers: { 'User-Agent': 'mizaniyati-icons' } });
      if (!res.ok) { console.log('HTTP ' + res.status); missing.push(`${key} (${file})`); continue; }
      const svg = await res.text();
      /* استخراج المحتوى الداخلي وتحويل الألوان إلى currentColor */
      const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>[\s\S]*$/, '').trim()
        .replace(/stroke="black"/g, 'stroke="currentColor"')
        .replace(/fill="black"/g, 'fill="currentColor"');
      if (!inner) { console.log('EMPTY'); missing.push(`${key} (${file})`); continue; }
      out[key] = inner.replace(/\s+/g, ' ');
      console.log('ok');
    } catch (e) { console.log('ERR ' + e.message); missing.push(`${key} (${file})`); }
  }

  const header = `/* ============================================================
   ميزانيتي | MIZANIYATI — أيقونات Solar Line Duotone (محفوظة محلياً)
   المصدر: Solar Icon Set — 480-Design/Solar-Icon-Set على GitHub
   https://www.svgrepo.com/collection/solar-line-duotone-icons/
   الرخصة: مجانية للاستخدام الشخصي والتجاري — الإسناد مُقدَّر.
   الألوان تتبع currentColor ← تتحكّم بها CSS.
   أُنشئت بواسطة tools/fetch-icons.js — لا تعدّلها يدوياً.
   ============================================================ */
const Icons = ${JSON.stringify(out, null, 2)};

/* عنصر SVG جاهز */
function ic(name, cls, size) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', 'ic' + (cls ? ' ' + cls : ''));
  svg.setAttribute('aria-hidden', 'true');
  if (size) { svg.style.width = size + 'px'; svg.style.height = size + 'px'; }
  svg.innerHTML = Icons[name] || Icons.box || '';
  return svg;
}
/* نص HTML جايز للقوالب النصية */
function icHTML(name, cls, size) {
  const s = size ? 'width:' + size + 'px;height:' + size + 'px;' : '';
  return '<svg class="ic' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true" style="' + s + '">' + (Icons[name] || Icons.box || '') + '</svg>';
}
`;
  const file = path.join(__dirname, '..', 'assets', 'js', 'icons.js');
  fs.writeFileSync(file, header + '\nconsole.debug("[mizaniyati] icons loaded:", Object.keys(Icons).length);\n', 'utf8');
  console.log(`\n✓ ${Object.keys(out).length} icon → ${path.relative(process.cwd(), file)}`);
  if (missing.length) console.log('⚠️ لم تُعثر على:\n  ' + missing.join('\n  '));
}

main().catch(e => { console.error(e); process.exit(1); });
