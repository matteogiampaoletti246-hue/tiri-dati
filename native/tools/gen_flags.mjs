// Bandiere rotonde per le finestre dei paesi: PNG 96 px dalla raccolta flag-icons (quadrate), pubblicate in native-link/flags/,
// e colore dominante di ogni bandiera (per la tinta della finestra) aggiunto a meta.json come "tints".
// Uso: node gen_flags.mjs <meta.json> <cartella PNG>   (serve il pacchetto sharp)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const sharp = require('sharp');
const META = path.resolve(process.argv[2]);
const OUT = path.resolve(process.argv[3]);
fs.mkdirSync(OUT, { recursive: true });
const meta = JSON.parse(fs.readFileSync(META, 'utf8'));
const codes = [...new Set(Object.values(meta.comps).map((c) => c.fc).filter(Boolean))];
import { execFileSync } from 'node:child_process';
const get = async (u) => {
  for (let i = 0; i < 3; i++) {
    try { const r = await fetch(u); if (r.ok) return Buffer.from(await r.arrayBuffer()); } catch (e) { /* riprova */ }
    try { const b = execFileSync('curl', ['-sSfL', '-m', '25', u], { maxBuffer: 20e6 }); if (b.length) return b; } catch (e) { /* riprova */ }
    await new Promise((r) => setTimeout(r, 600));
  }
  return null;
};
const hex = (r, g, b) => `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
// colore dominante: vince il gruppo di colori che pesa di piu' contando soprattutto la saturazione (bianco e grigi contano poco)
function dominant(raw) {
  const B = new Map();
  for (let i = 0; i < raw.length; i += 4) {
    const r = raw[i], g = raw[i + 1], b = raw[i + 2];
    const w = Math.max(r, g, b) - Math.min(r, g, b) + 6;
    const k = (r >> 6) * 16 + (g >> 6) * 4 + (b >> 6);
    const e = B.get(k) || { w: 0, r: 0, g: 0, b: 0 };
    e.w += w; e.r += r * w; e.g += g * w; e.b += b * w; B.set(k, e);
  }
  let best = null;
  B.forEach((e) => { if (!best || e.w > best.w) best = e; });
  let [r, g, b] = [best.r / best.w, best.g / best.w, best.b / best.w];
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  if (lum < 0.22) { r += (255 - r) * 0.3; g += (255 - g) * 0.3; b += (255 - b) * 0.3; }
  return hex(r, g, b);
}
meta.tints = {};
let ok = 0;
for (const code of codes) {
  const svg = await get(`https://raw.githubusercontent.com/lipis/flag-icons/main/flags/1x1/${code}.svg`);
  if (!svg) { console.log('bandiera mancante', code); continue; }
  try {
    const png = await sharp(svg, { density: 300 }).resize(96, 96).png({ compressionLevel: 9 }).toBuffer();
    fs.writeFileSync(path.join(OUT, `${code}.png`), png);
    const raw = await sharp(png).resize(32, 32).ensureAlpha().raw().toBuffer();
    meta.tints[code] = dominant(raw);
    ok++;
  } catch (e) { console.log('errore', code, e.message); }
}
fs.writeFileSync(META, JSON.stringify(meta));
console.log('bandiere', ok, 'su', codes.length);
