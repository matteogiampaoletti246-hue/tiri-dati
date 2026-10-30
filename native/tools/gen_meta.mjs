// Genera meta.json: le stesse regole della Home vera (campionati, paesi, colori, ordine, importanza) per l'app nativa.
// Usa direttamente data/leagues.js e data/countries.js dell'app web: una competizione aggiunta nel web arriva da sola.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';

const SRC = path.resolve(process.argv[2] || 'aurora-src/src');
const OUT = path.resolve(process.argv[3] || 'native/meta.json');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'meta-'));
fs.writeFileSync(path.join(tmp, 'package.json'), '{"type":"module"}');
fs.writeFileSync(path.join(tmp, 'load.js'), 'export const RAW = {};');
fs.writeFileSync(path.join(tmp, 'leagues.js'), fs.readFileSync(path.join(SRC, 'data/leagues.js'), 'utf8').replace("from './load'", "from './load.js'"));
fs.writeFileSync(path.join(tmp, 'countries.js'), fs.readFileSync(path.join(SRC, 'data/countries.js'), 'utf8'));
const { LEAGUES, leagueTint } = await import(pathToFileURL(path.join(tmp, 'leagues.js')));
const { countryCode, importance, flagEmoji } = await import(pathToFileURL(path.join(tmp, 'countries.js')));

// archive.js: FM_ID, PAESE e addArchiveLeagues (stesse regole)
const arch = fs.readFileSync(path.join(SRC, 'data/archive.js'), 'utf8');
const FM_ID = eval('(' + /export const FM_ID = (\{[^}]*\})/.exec(arch)[1] + ')');
const PAESE = eval('(' + /const PAESE = (\{[^}]*\})/.exec(arch)[1] + ')');
const idx = JSON.parse(fs.readFileSync(path.resolve(SRC, '../../arch/index.json'), 'utf8'));
const LID_BY_FM = {}; Object.keys(FM_ID).forEach((k) => { LID_BY_FM[FM_ID[k]] = k; });
const norm = (x) => String(x || '').trim().toLowerCase();
const appNames = new Set(LEAGUES.map((l) => norm(l.name)));
const cnt = {};
Object.entries(idx).forEach(([k, e]) => { if (e && e.n && !LID_BY_FM[Number(k)]) cnt[norm(e.n)] = (cnt[norm(e.n)] || 0) + 1; });
const nameOf = (e, country) => { const n = e.n || ''; return n && country && e.c !== 'INT' && (appNames.has(norm(n)) || cnt[norm(n)] > 1) ? `${n} (${country})` : n; };
Object.entries(idx).forEach(([k, e]) => {
  const fm = Number(k);
  if (!e || !e.s || !e.s.length || LID_BY_FM[fm] || e.skip) return;
  const id = `fm-${fm}`;
  const col = /^#[0-9a-f]{6}$/i.test(e.color || '') ? e.color : '#38A2FF';
  const country = PAESE[e.cn] || e.cn || '';
  LEAGUES.push({ id, fm, extra: true, arch: true, cc: e.c || '', name: nameOf(e, country) || `Competizione ${fm}`, country, countryUpper: country.toUpperCase(), colors: ['#0E1626', col], tint: col, logo: `https://images.fotmob.com/image_resources/logo/leaguelogo/${fm}.png`, logoDark: `https://images.fotmob.com/image_resources/logo/leaguelogo/dark/${fm}.png` });
});
const TOP_SOLO = ['serie-a', 'premier-league', 'la-liga', 'bundesliga', 'ligue-1', 'pro-league', 'eredivisie', 'liga-portugal', 'super-lig', 'champions-league', 'europa-league', 'conference-league'];
const OPEN = new Set(['serie-a', 'premier-league', 'la-liga', 'bundesliga', 'ligue-1', 'champions-league', 'europa-league', 'conference-league']);
const FMLOGO = (fm) => `https://images.fotmob.com/image_resources/logo/leaguelogo/${fm}.png`;
const solo = new Map(TOP_SOLO.map((id, k) => [id, k]));
const pos = new Map(LEAGUES.map((L, i) => [L.id, i]));
LEAGUES.forEach((L) => { if (!solo.has(L.id) && !countryCode(L)) solo.set(L.id, TOP_SOLO.length + pos.get(L.id)); });
const byFm = {};
LEAGUES.forEach((L) => {
  const fm = L.fm || FM_ID[L.id];
  if (!fm) return;
  const cc = countryCode(L);
  byFm[fm] = { id: L.id, name: L.name, country: L.country || '', cc: cc || '', flag: flagEmoji(cc) || '', tint: leagueTint(L.id), solo: solo.has(L.id) ? solo.get(L.id) : -1, rank: importance(L) * 1e5 + pos.get(L.id), open: OPEN.has(L.id), logo: FMLOGO(fm) };
});
// conferenza: nell'app e' un campionato d'archivio senza riga propria
if (!byFm[10216]) byFm[10216] = { id: 'conference-league', name: 'Conference League', country: 'Europa', cc: '', flag: '', tint: '#2FBF71', solo: TOP_SOLO.indexOf('conference-league'), rank: 0, open: true, logo: FMLOGO(10216) };
// stagione in corso di ogni competizione (per aprire la partita dall'archivio)
const cur = {};
Object.entries(idx).forEach(([k, e]) => { if (e && e.s && e.s.length) cur[k] = [...e.s].sort((a, b) => String(b).localeCompare(String(a)))[0]; });
fs.writeFileSync(OUT, JSON.stringify({ comps: byFm, cur }));
console.log('competizioni', Object.keys(byFm).length, 'bytes', fs.statSync(OUT).size);
