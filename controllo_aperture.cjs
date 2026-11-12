// Controllo "ogni scheda si apre": usa il livello dati VERO dell'app (aurora-src/src/data, lo stesso del sito e dell'app nativa) in Node,
// con i file del repository al posto della rete, e prova ad aprire come fa l'app:
//  - ogni competizione (app + archivio): scheda Campionato (`leagueById`, `firstSeasonWithData`);
//  - ogni partita di giorni/<data>.json (la Home): `buildArchiveMatch` con la stagione in corso (come `openMatch` nativo);
//  - ogni squadra dei calendari in corso e del feed: `teamByFm`/`teamFromIndex` + storia competizioni (`teamHistory`).
// Scrive report/controllo_aperture.json e stampa il riepilogo. Uso: node controllo_aperture.cjs   (dalla radice; servono npx esbuild e fflate)
const { execSync } = require('child_process');
const fs = require('fs'), path = require('path');
const ROOT = __dirname + '/';
const TMP = '/tmp/aperture';
fs.mkdirSync(TMP, { recursive: true });
if (!fs.existsSync(TMP + '/node_modules/fflate')) execSync('npm install fflate --no-audit --no-fund --silent --prefix ' + TMP, { stdio: 'inherit' });
fs.writeFileSync(TMP + '/entry.js', `
import '${ROOT}native/shared/shim';
import { bootShared } from '${ROOT}native/shared/boot';
import * as archive from '@/data/archive';
import * as leagues from '@/data/leagues';
import * as teams from '@/data/teams';
import * as archiveMatch from '@/data/archiveMatch';
import * as teamIndex from '@/data/teamIndex';
export { bootShared, archive, leagues, teams, archiveMatch, teamIndex };
`);
execSync(`npx --yes esbuild ${TMP}/entry.js --bundle --platform=node --format=cjs --outfile=${TMP}/app.cjs --alias:@=${ROOT}aurora-src/src --loader:.js=jsx --loader:.json=json --define:__DEV__=false --external:fflate --log-level=error`, { stdio: 'inherit' });
const SITE = 'https://matteogiampaoletti246-hue.github.io/tiri-dati/';
const missing = new Set();
global.window = global;
global.CustomEvent = global.CustomEvent || class { constructor(t, o) { this.type = t; Object.assign(this, o); } };
global.Image = class { decode() { return Promise.resolve(); } };
global.fetch = async (u) => {
  u = String(u);
  if (u.startsWith(SITE)) {
    const p = path.join(ROOT, decodeURIComponent(u.slice(SITE.length).split('?')[0]));
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return new Response(fs.readFileSync(p), { status: 200 });
    missing.add(u.slice(SITE.length));
  }
  return new Response('', { status: 404 }); // niente rete: solo cio' che e' nel repository
};
module.paths.push(TMP + '/node_modules');
const A = require(TMP + '/app.cjs');
(async () => {
  const out = { quando: new Date().toISOString(), riepilogo: {}, competizioni: [], partite: [], squadre: [] };
  await A.bootShared();
  const idx = await A.archive.archIndex();
  let rm = new Set();
  try { rm = new Set(JSON.parse(fs.readFileSync(ROOT + 'competizioni_rimosse.json')).ids.map(String)); } catch (e) { /* nessuna */ }
  const ids = new Set(A.leagues.LEAGUES.map((l) => l.id));
  Object.keys(idx).forEach((fm) => { if (!rm.has(fm) && !idx[fm].skip) ids.add(A.archive.LID_BY_FM[fm] || `fm-${fm}`); });
  let okC = 0;
  for (const id of ids) {
    const isArch = /^fm-\d+$/.test(id);
    const league = A.leagues.leagueById(id);
    if (!league) { out.competizioni.push([id, '', 'nessuna scheda']); continue; }
    const fm = A.archive.FM_ID[id] || (isArch ? league.fm : null);
    const archS = (fm && idx[String(fm)] && idx[String(fm)].s) || [];
    try {
      const fsd = isArch && archS.length ? await A.archive.firstSeasonWithData(fm, A.archive.sortSeasons(archS)) : null;
      if (isArch && (!fsd || !fsd.sk)) { out.competizioni.push([id, league.name, 'nessuna stagione con dati']); continue; }
      okC += 1;
    } catch (e) { out.competizioni.push([id, league.name, 'errore: ' + e.message]); }
  }
  out.riepilogo.competizioni = { aperte: okC, totale: ids.size };
  let okM = 0, totM = 0;
  const teamIds = new Map();
  const lidOf = (fm) => A.archive.LID_BY_FM[fm] || `fm-${fm}`;
  for (const f of fs.readdirSync(ROOT + 'giorni').sort()) {
    let d; try { d = JSON.parse(fs.readFileSync(ROOT + 'giorni/' + f)); } catch (e) { continue; }
    for (const r of d.m || []) {
      const fm = String(r[1]);
      if (r[8] === 'c' || !idx[fm] || rm.has(fm) || !A.leagues.leagueById(lidOf(fm))) continue;
      totM += 1;
      let m = null, err = '';
      try { m = await A.archiveMatch.buildArchiveMatch(fm, A.archive.curSeasonSync(fm), String(r[0])); } catch (e) { err = 'errore: ' + e.message; }
      if (m && A.teams.teamById(m.homeId) && A.teams.teamById(m.awayId)) okM += 1;
      else out.partite.push([f.slice(0, 10), fm, idx[fm].n, String(r[0]), r[5], r[6], err || 'non si apre']);
      [[r[3], r[5]], [r[4], r[6]]].forEach(([tid, n]) => { if (tid) teamIds.set(String(tid), [n, fm]); });
    }
  }
  out.riepilogo.partite_home = { aperte: okM, totale: totM };
  for (const fm of Object.keys(idx)) {
    if (rm.has(fm)) continue;
    const sk = A.archive.curSeasonSync(fm);
    const p = ROOT + `arch/${fm}/${sk}.json`;
    if (!sk || !fs.existsSync(p)) continue;
    try { Object.entries(JSON.parse(fs.readFileSync(p)).teams || {}).forEach(([tid, n]) => { if (!teamIds.has(String(tid))) teamIds.set(String(tid), [n, fm]); }); } catch (e) { /* ignora */ }
  }
  let okT = 0;
  for (const [tid, [n, fm]] of teamIds) {
    let t = null, err = '';
    try { t = A.teams.teamByFm(tid) || await A.teamIndex.teamFromIndex(tid); } catch (e) { err = 'errore: ' + e.message; }
    if (!t) { out.squadre.push([tid, n, fm, idx[fm].n, err || 'non nell\'indice squadre (tidx)']); continue; }
    let h = null; try { h = await A.teamIndex.teamHistory(t); } catch (e) { /* ignora */ }
    if (!h || !Object.keys(h).length) { out.squadre.push([tid, n, fm, idx[fm].n, 'senza storia competizioni']); continue; }
    okT += 1;
  }
  out.riepilogo.squadre = { aperte: okT, totale: teamIds.size };
  out.file_mancanti = [...missing].sort();
  fs.mkdirSync(ROOT + 'report', { recursive: true });
  fs.writeFileSync(ROOT + 'report/controllo_aperture.json', JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out.riepilogo));
  console.log('partite che non si aprono:', out.partite.length, '| squadre:', out.squadre.length, '| competizioni:', out.competizioni.length);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
