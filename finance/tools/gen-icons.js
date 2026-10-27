/* أدوات توليد أيقونات التطبيق (PNG) بدون أي مكتبات خارجية
   التشغيل: node finance/tools/gen-icons.js
   تُنتج: assets/img/icon-192.png , icon-512.png , favicon.png
*/
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

/* ---------- CRC32 ---------- */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function writePNG(file, w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  fs.writeFileSync(file, png);
  console.log('✓', path.relative(process.cwd(), file), png.length, 'bytes');
}

/* ---------- رسم الأيقونة ---------- */
function lerp(a, b, t) { return a + (b - a) * t; }
function roundedRect(px, py, pw, ph, r, size, cb) {
  for (let y = Math.floor(py); y < py + ph; y++) {
    for (let x = Math.floor(px); x < px + pw; x++) {
      const dx = Math.max(px + r - x, x - (px + pw - r), 0);
      const dy = Math.max(py + r - y, y - (py + ph - r), 0);
      if (dx * dx + dy * dy <= r * r) cb(x, y);
    }
  }
}
function gen(size, file) {
  const img = Buffer.alloc(size * size * 4);
  const set = (x, y, r, g, b, a = 255) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    const na = a / 255, oa = img[i + 3] / 255, out = na + oa * (1 - na);
    if (out <= 0) return;
    img[i] = Math.round((r * na + img[i] * oa * (1 - na)) / out);
    img[i + 1] = Math.round((g * na + img[i + 1] * oa * (1 - na)) / out);
    img[i + 2] = Math.round((b * na + img[i + 2] * oa * (1 - na)) / out);
    img[i + 3] = Math.round(out * 255);
  };
  const S = size;
  const R = S * 0.215; // نصف قطر زوايا الأيقونة
  // خلفية متدرجة (كحلي → أخضر مزرق)
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const cx = Math.min(Math.max(x, R), S - R);
      const cy = Math.min(Math.max(y, R), S - R);
      if ((x - cx) ** 2 + (y - cy) ** 2 > R * R) continue;
      const t = (x / S + y / S) / 2;
      set(x, y, Math.round(lerp(15, 5, t)), Math.round(lerp(30, 82, t)), Math.round(lerp(48, 66, t)), 255);
    }
  }
  // أعمدة بيانية صاعدة
  const bars = [
    { x: 0.20, h: 0.24, c: [96, 165, 250] },
    { x: 0.42, h: 0.40, c: [251, 191, 36] },
    { x: 0.64, h: 0.32, c: [110, 231, 183] },
    { x: 0.845, h: 0.56, c: [52, 211, 153] },
  ];
  const baseY = 0.815 * S, bw = 0.145 * S, rr = 0.05 * S;
  bars.forEach(b => {
    const bh = b.h * S, bx = b.x * S - bw / 2, by = baseY - bh;
    roundedRect(bx, by, bw, bh, rr, S, (x, y) => set(x, y, b.c[0], b.c[1], b.c[2], 255));
  });
  // سهم صاعد فوق الأعمدة
  const pts = [[0.155, 0.50], [0.38, 0.365], [0.53, 0.435], [0.83, 0.155]].map(p => [p[0] * S, p[1] * S]);
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
    for (let s = 0; s <= steps; s++) {
      const x = Math.round(lerp(x0, x1, s / steps)), y = Math.round(lerp(y0, y1, s / steps));
      for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++)
        set(x + ox, y + oy, 255, 255, 255, 240);
    }
  }
  // رأس السهم (مثلث ممتلئ)
  const [hx, hy] = pts[pts.length - 1], [tx, ty] = pts[pts.length - 2];
  const ang = Math.atan2(hy - ty, hx - tx), headLen = S * 0.115, halfW = S * 0.058;
  const bx0 = hx - Math.cos(ang) * headLen, by0 = hy - Math.sin(ang) * headLen;
  const px1 = bx0 - Math.sin(ang) * -halfW, py1 = by0 + Math.cos(ang) * -halfW;
  const px2 = bx0 + Math.sin(ang) * -halfW, py2 = by0 - Math.cos(ang) * -halfW;
  const minX = Math.min(hx, px1, px2), maxX = Math.max(hx, px1, px2);
  const minY = Math.min(hy, py1, py2), maxY = Math.max(hy, py1, py2);
  const edge = (ax, ay, bx2, by2, cx2, cy2) => (bx2 - ax) * (cy2 - ay) - (by2 - ay) * (cx2 - ax);
  for (let y = Math.floor(minY); y <= maxY; y++) {
    for (let x = Math.floor(minX); x <= maxX; x++) {
      const w1 = edge(px1, py1, px2, py2, x, y);
      const w2 = edge(px2, py2, hx, hy, x, y);
      const w3 = edge(hx, hy, px1, py1, x, y);
      if ((w1 >= 0 && w2 >= 0 && w3 >= 0) || (w1 <= 0 && w2 <= 0 && w3 <= 0))
        set(x, y, 255, 255, 255, 255);
    }
  }
  writePNG(file, size, size, img);
}

const outDir = path.join(__dirname, '..', 'assets', 'img');
fs.mkdirSync(outDir, { recursive: true });
gen(512, path.join(outDir, 'icon-512.png'));
gen(192, path.join(outDir, 'icon-192.png'));
gen(64, path.join(outDir, 'favicon.png'));
