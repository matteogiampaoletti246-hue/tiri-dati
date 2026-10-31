import { lruGet, lruSet } from '@/lib/lru';
// Archivio storico (FotMob): classifiche, calendari, statistiche stagionali e dettaglio partite dal 2010.
// I file stanno nel repository dati (arch/ e partite/) e si scaricano solo quando servono.
import { BASE, RAW, WORKER } from './load';
import { LEAGUES, leagueById } from './leagues';
import { isWomenComp, isWomenName, womenName } from './teamMatch';

// file scaricati una volta sola; quelli grandi (partite della stagione .gz, statistiche) con capienza fissa: la memoria non cresce all'infinito
const cache = new Map();
const cap = (key) => (/\.gz$/.test(key) ? 10 : /_s\.json$|^(sfm|tps)\//.test(key) ? 30 : 0);
const BIG = new Map();
const once = (key, fn) => {
  const c = cap(key);
  if (c) { const hit = lruGet(BIG, key); if (hit) return hit; const p = fn().catch(() => null); lruSet(BIG, key, p, c); return p; }
  if (!cache.has(key)) cache.set(key, fn().catch(() => null));
  return cache.get(key);
};
const json = (path) => once(path, () => fetch(`${BASE}${path}`).then((r) => (r.ok ? r.json() : null)));
const gz = (path) => once(path, async () => {
  const r = await fetch(`${BASE}${path}`);
  if (!r.ok || !r.body || typeof DecompressionStream === 'undefined') return null;
  return new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).json();
});

// id dell'app → id FotMob
export const FM_ID = { 'serie-a': 55, 'premier-league': 47, 'la-liga': 87, bundesliga: 54, 'ligue-1': 53, 'champions-league': 42, 'europa-league': 73, 'conference-league': 10216, eredivisie: 57, 'super-lig': 71, 'liga-portugal': 61, 'pro-league': 40, 'scottish-premiership': 64, 'aut-bundesliga': 38, 'nor-eliteserien': 59, 'gre-super-league-1': 135, 'championship': 48, 'serie-b': 86, 'bundesliga-2': 146, 'laliga-2': 140, 'ligue-2': 110, 'liga-portugal-2': 185, 'eerste-divisie': 111, 'turchia-1-lig': 165, 'brasileirao': 268, 'arg-liga-profesional': 112, 'mls': 130, 'liga-mx': 230, 'coppa-italia': 141, 'dfb-pokal': 209, 'coupe-de-france': 134, 'taca-de-portugal': 186, 'efl-cup': 133, 'belgian-cup': 149, 'austrian-cup': 278, 'scottish-league-cup': 180, 'copa-do-brasil': 9067 };

let IDX = null; // indice gia' caricato (per le letture sincrone)
export const archIndex = () => once('index', async () => {
  const [a, b] = await Promise.all([json('arch/index.json'), json('arch/index_top.json')]);
  const out = { ...(a || {}) };
  Object.entries(b || {}).forEach(([k, v]) => {
    const o = out[k];
    out[k] = o ? { ...o, ...v, s: [...new Set([...(o.s || []), ...(v.s || [])])] } : v;
  });
  IDX = out;
  addArchiveLeagues(out);
  return out;
});
// id FotMob -> id app (anche per le competizioni aggiunte dall'archivio)
export const LID_BY_FM = {};
Object.keys(FM_ID).forEach((k) => { LID_BY_FM[FM_ID[k]] = k; });
// Tutte le competizioni scaricate in arch/ sono raggiungibili: quelle che non sono gia' nell'app diventano campionati "dell'archivio"
// (id fm-<id FotMob>): scheda campionato, tendine di squadra e giocatore, ricerca. In Home nei giorni in cui giocano (data/dayFeed.js).
// paesi dell'indice (inglese) -> italiano, come nel resto dell'app
const PAESE = { Algeria: 'Algeria', Azerbaijan: 'Azerbaigian', Belarus: 'Bielorussia', Belgium: 'Belgio', Bosnia: 'Bosnia', 'Bosnia-Herzegovina': 'Bosnia ed Erzegovina', Brazil: 'Brasile', Chile: 'Cile', China: 'Cina', Croatia: 'Croazia', Cyprus: 'Cipro', Czechia: 'Repubblica Ceca', Denmark: 'Danimarca', Ecuador: 'Ecuador', Egypt: 'Egitto', England: 'Inghilterra', Estonia: 'Estonia', 'Faroe Islands': 'Isole Faroe', Finland: 'Finlandia', France: 'Francia', Germany: 'Germania', Greece: 'Grecia', Hungary: 'Ungheria', Iceland: 'Islanda', Ireland: 'Irlanda', Israel: 'Israele', Italy: 'Italia', Japan: 'Giappone', Kazakhstan: 'Kazakistan', Latvia: 'Lettonia', Lithuania: 'Lituania', Luxembourg: 'Lussemburgo', Moldova: 'Moldavia', Mexico: 'Messico', Morocco: 'Marocco', Netherlands: 'Paesi Bassi', 'North Macedonia': 'Macedonia del Nord', 'Northern Ireland': 'Irlanda del Nord', Norway: 'Norvegia', Peru: 'Perù', Poland: 'Polonia', Portugal: 'Portogallo', Romania: 'Romania', Russia: 'Russia', 'Saudi Arabia': 'Arabia Saudita', Scotland: 'Scozia', Serbia: 'Serbia', Slovakia: 'Slovacchia', Slovenia: 'Slovenia', 'South Africa': 'Sudafrica', 'South Korea': 'Corea del Sud', Spain: 'Spagna', Sweden: 'Svezia', Switzerland: 'Svizzera', Tunisia: 'Tunisia', Turkiye: 'Turchia', Ukraine: 'Ucraina', 'United Arab Emirates': 'Emirati Arabi Uniti', 'United States': 'Stati Uniti', Wales: 'Galles' };
// nomi uguali tra paesi diversi ("Premier League" d'Egitto, "Ligue 1" d'Algeria, "Super League"...): il paese tra parentesi,
// cosi' in Home, ricerca e tendine non si confondono con i top campionati
const uniqueName = (idx) => {
  const norm = (x) => String(x || '').trim().toLowerCase();
  const app = new Set(LEAGUES.filter((l) => !l.arch).map((l) => norm(l.name)));
  const cnt = {};
  Object.entries(idx || {}).forEach(([k, e]) => { if (e && e.n && !LID_BY_FM[Number(k)]) cnt[norm(e.n)] = (cnt[norm(e.n)] || 0) + 1; });
  return (e, country) => {
    const n = e.n || '';
    return n && country && e.c !== 'INT' && (app.has(norm(n)) || cnt[norm(n)] > 1) ? `${n} (${country})` : n;
  };
};
function addArchiveLeagues(idx) {
  const nameOf = uniqueName(idx);
  Object.entries(idx || {}).forEach(([k, e]) => {
    const fm = Number(k);
    if (!e || !e.s || !e.s.length || LID_BY_FM[fm] || e.skip) return;
    const id = `fm-${fm}`;
    if (!leagueById(id)) {
      const col = /^#[0-9a-f]{6}$/i.test(e.color || '') ? e.color : '#38A2FF';
      const country = PAESE[e.cn] || e.cn || '';
      LEAGUES.push({ id, fm, extra: true, arch: true, cc: e.c || '', name: nameOf(e, country) || `Competizione ${fm}`, country, countryUpper: country.toUpperCase(), colors: ['#0E1626', col], tint: col,
        logo: `https://images.fotmob.com/image_resources/logo/leaguelogo/${fm}.png`, logoDark: `https://images.fotmob.com/image_resources/logo/leaguelogo/dark/${fm}.png`, season: '' });
    }
    FM_ID[id] = fm;
    LID_BY_FM[fm] = id;
  });
}
// stagione in corso senza attese (null se l'indice non e' ancora arrivato)
export const curSeasonSync = (fm) => {
  const e = IDX && IDX[String(fm)];
  return e && e.s && e.s.length ? [...e.s].sort((a, b) => String(b).localeCompare(String(a)))[0] : null;
};
export const loadColors = () => json('arch/colors.json');
// Classifica ricostruita dalle partite giocate, per le stagioni in cui FotMob non ha la tabella (solo campionati nazionali).
const CUPS = new Set([42, 73, 10216]);
function tableFromFix(season, lid) {
  const fix = (season && season.fix) || [];
  if (CUPS.has(Number(lid)) || !fix.length) return null;
  const names = season.teams || {};
  const mk = () => ({});
  const T = { all: mk(), home: mk(), away: mk() };
  let played = 0;
  const add = (tab, id, gf, ga) => {
    const r = tab[id] || (tab[id] = { id, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, pts: 0 });
    r.played += 1; r.gf += gf; r.ga += ga;
    if (gf > ga) { r.wins += 1; r.pts += 3; } else if (gf === ga) { r.draws += 1; r.pts += 1; } else r.losses += 1;
  };
  fix.forEach((m) => {
    if (!m[6] || m[8]) return;
    const sc = String(m[5] || '').split(' - ').map(Number);
    if (sc.length !== 2 || sc.some(Number.isNaN)) return;
    played += 1;
    add(T.all, m[2], sc[0], sc[1]); add(T.all, m[3], sc[1], sc[0]);
    add(T.home, m[2], sc[0], sc[1]); add(T.away, m[3], sc[1], sc[0]);
  });
  const n = Object.keys(T.all).length;
  if (!played || n < 8 || n > 30) return null;
  const out = {};
  Object.keys(T).forEach((k) => {
    out[k] = Object.values(T[k])
      .sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf || String(names[a.id]).localeCompare(String(names[b.id])))
      .map((r, i) => ({ name: names[r.id] || '', shortName: names[r.id] || '', id: r.id, played: r.played, wins: r.wins, draws: r.draws, losses: r.losses, scoresStr: `${r.gf}-${r.ga}`, goalConDiff: r.gf - r.ga, pts: r.pts, idx: i + 1 }));
  });
  return out;
}
// campionati con gironi/conference o punti dimezzati dopo la prima fase (MLS, Argentina, Austria, Belgio, Grecia) e coppe
const ZONES_NOT_BY_POINTS = new Set([130, 112, 38, 40, 135, 42, 73, 10216]);
// competizione femminile: i nomi diventano "Nome F" appena arriva il file, cosi' abbinamenti (mai con la maschile), liste e classifiche usano tutti la stessa forma
const womenRows = (o, depth = 0) => {
  if (!o || depth > 4) return;
  if (Array.isArray(o)) { o.forEach((r) => { if (r && typeof r === 'object' && !Array.isArray(r) && r.name) { r.name = womenName(r.name); if (r.shortName) r.shortName = womenName(r.shortName); } else womenRows(r, depth + 1); }); return; }
  if (typeof o === 'object') Object.values(o).forEach((v) => womenRows(v, depth + 1));
};
const womenSeason = (lid, d) => {
  if (!d || d.__w !== undefined) return d;
  const e = IDX && IDX[String(lid)];
  const names = Object.values(d.teams || {});
  d.__w = isWomenComp(lid, e && e.n) || (names.length > 0 && names.filter(isWomenName).length * 2 >= names.length);
  if (!d.__w) return d;
  Object.keys(d.teams || {}).forEach((k) => { d.teams[k] = womenName(d.teams[k]); });
  womenRows(d.table);
  womenRows(d.groups);
  return d;
};
// le righe del feed (giorni/) con i nomi come nel resto dell'app; risultati.py li scrive gia' cosi', qui per i file ancora vecchi
export const womenFeedRow = (r) => {
  const e = IDX && IDX[String(r[1])];
  if (!isWomenComp(r[1], e && e.n) && !isWomenName(r[5]) && !isWomenName(r[6])) return r;
  const n = r.slice(); n[5] = womenName(r[5]); n[6] = womenName(r[6]); return n;
};
export const loadSeason = (lid, sk) => archIndex().then(() => json(`arch/${lid}/${sk}.json`)).then((d) => womenSeason(lid, d)).then(firstFresh(lid, sk)).then((d) => {
  if (d && !d.table && !d.__tc) {
    d.__tc = true;
    const t = tableFromFix(d, lid);
    if (t) {
      d.table = t; d.legend = d.legend || []; d.tableComputed = true;
      // le zone (Champions, retrocessione...) della fonte hanno le posizioni: si colorano le righe solo dove la classifica finale e' quella a punti
      // (non nei campionati a gironi/conference, ne' dove i punti si dimezzano dopo la prima fase: li' le posizioni non coincidono e non si inventa nulla)
      if (!ZONES_NOT_BY_POINTS.has(Number(lid)) && Array.isArray(d.legend)) {
        const zoned = {};
        d.legend.forEach((z) => (z.indices || []).forEach((i) => { if (!zoned[i]) zoned[i] = z.color; }));
        Object.keys(t).forEach((k) => t[k].forEach((r, i) => { if (zoned[i]) r.qualColor = zoned[i]; }));
      }
    }
  }
  return d;
});

// ───── Stagione in corso sempre aggiornata ─────
// Le righe con l'orario d'inizio passato e senza risultato (anche se il file arch/ in cache e' vecchio) si correggono da:
// partite_extra.json (campionati/coppe aggiunti, ogni ora), giorni/<data>.json (feed FotMob del giorno di tutte le competizioni,
// risultati.py ogni 10 minuti) e /fx per quelle iniziate da meno di 5 ore. Il file in memoria riceve un nuovo array `fix`
// (stesso oggetto stagione) e chi lo mostra si ridisegna con l'evento 'sl-arch' (useArchFresh): Partite, Tabellone, squadra, giocatore.
const DAY_MS = 864e5;
const isCurrent = (lid, sk) => {
  const x = RAW.extra && RAW.extra.sk && RAW.extra.sk[String(lid)];
  return x === sk || curSeasonSync(lid) === sk;
};
const stale = (m, now) => !m[6] && !m[8] && Date.parse(m[4]) < now && now - Date.parse(m[4]) < 10 * DAY_MS;
const romeDay = (iso) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Rome' }).format(new Date(iso));
const DAYF = new Map();
export const dayFile = (iso) => {
  const hit = lruGet(DAYF, iso);
  if (hit && Date.now() - hit.at < 120000) return hit.p;
  const p = fetch(`${BASE}giorni/${iso}.json`, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  lruSet(DAYF, iso, { at: Date.now(), p }, 8);
  return p;
};
const FRESH = new Map(); // `${lid}/${sk}` -> {at, p}
const LIVE_KEYS = new Map(); // stagioni in corso aperte di recente (ricontrollate ogni minuto)
export const archVersion = new Map();
const patch = (m, st, sc, out) => {
  const n = m.slice(0, 9);
  if (st === 'f' && sc) { n[5] = sc; n[6] = 1; n[7] = 1; n[8] = 0; } else if (st === 'c') { n[8] = 1; } else if (st === 'l') { n[7] = 1; } else return null;
  if (out != null) n[9] = out;
  return n;
};
async function freshen(lid, sk, d) {
  const now = Date.now();
  const sus = (d.fix || []).filter((m) => stale(m, now));
  if (!sus.length) return false;
  const P = {};
  const left = () => sus.filter((m) => !P[m[0]] || P[m[0]][6] !== 1);
  // 1) partite_extra.json
  const ex = RAW.extra && RAW.extra.m;
  if (ex) {
    const by = {};
    ex.forEach((x) => { if (String(x[1]) === String(lid)) by[String(x[0])] = x; });
    sus.forEach((m) => { const x = by[String(m[0])]; if (x && x[9] === 'f' && x[7] != null) P[m[0]] = patch(m, 'f', `${x[7]} - ${x[8]}`); });
  }
  // 2) giorni/<data>.json
  let rest = left();
  if (rest.length) {
    const days = [...new Set(rest.map((m) => romeDay(m[4])))].slice(-4);
    const files = await Promise.all(days.map(dayFile));
    const by = {};
    files.forEach((f) => ((f && f.m) || []).forEach((x) => { by[String(x[0])] = x; }));
    rest.forEach((m) => { const x = by[String(m[0])]; if (x) { const n = patch(m, x[8], x[7], x[9]); if (n) P[m[0]] = n; } });
  }
  // 3) /fx per le partite iniziate da meno di 5 ore ancora senza risultato (poche richieste)
  rest = left().filter((m) => now - Date.parse(m[4]) < 5 * 3600e3).slice(0, 8);
  await Promise.all(rest.map((m) => fetch(`${WORKER}/fx?id=${m[0]}`).then((r) => (r.ok ? r.json() : null)).then((x) => {
    if (!x) return;
    const sc = x.sc && x.sc[0] != null ? `${x.sc[0]} - ${x.sc[1]}` : null;
    const n = patch(m, x.fin ? 'f' : x.st ? 'l' : 'n', sc);
    if (n) P[m[0]] = n;
  }).catch(() => null)));
  const ids = Object.keys(P).filter((k) => P[k] && JSON.stringify(P[k]) !== JSON.stringify((d.fix.find((m) => String(m[0]) === k) || [])));
  if (!ids.length) return false;
  d.fix = d.fix.map((m) => P[m[0]] || m);
  const key = `${lid}/${sk}`;
  archVersion.set(key, (archVersion.get(key) || 0) + 1);
  try { window.dispatchEvent(new CustomEvent('sl-arch', { detail: { fm: String(lid), sk } })); } catch (e) { /* ignora */ }
  return true;
}
export const freshSeason = (lid, sk, d) => {
  const key = `${lid}/${sk}`;
  const hit = FRESH.get(key);
  if (hit && Date.now() - hit.at < 60000) return hit.p;
  const p = freshen(lid, sk, d).catch(() => false);
  lruSet(FRESH, key, { at: Date.now(), p }, 20);
  lruSet(LIVE_KEYS, key, { lid, sk, d }, 6);
  return p;
};
// al primo arrivo la stagione in corso aspetta l'aggiornamento (al massimo 1,2 s): la lista nasce gia' con i risultati veri
const firstFresh = (lid, sk) => (d) => {
  if (!d || !d.fix || !isCurrent(lid, sk)) return d;
  return Promise.race([freshSeason(lid, sk, d), new Promise((r) => { setTimeout(r, 1200); })]).then(() => d);
};
if (typeof window !== 'undefined') {
  const tick = () => {
    if (document.visibilityState === 'hidden') return;
    LIVE_KEYS.forEach(({ lid, sk, d }) => { freshSeason(lid, sk, d); });
  };
  setInterval(tick, 60000);
  document.addEventListener('visibilitychange', tick);
}
// le statistiche vecchie (v1) erano della stagione sbagliata: si usano solo quelle riscaricate (v2)
// statistiche nascoste ovunque (significato poco chiaro)
const HIDDEN_STAT = /^poss_?won_?att_?3rd/i;
const strip = (o) => { if (o) for (const k of Object.keys(o)) if (HIDDEN_STAT.test(k)) delete o[k]; return o; };
export const loadSeasonStats = (lid, sk) => archIndex().then(() => json(`arch/${lid}/${sk}_s.json`)).then((d) => {
  if (!d || d.v !== 2) return null;
  strip(d.players); strip(d.teams);
  const e = IDX && IDX[String(lid)];
  if (!d.__w && isWomenComp(lid, e && e.n)) { d.__w = true; Object.values(d.teams || {}).forEach((l) => (l || []).forEach((r) => { if (r && r[1]) r[1] = womenName(r[1]); })); }
  return d;
});
// Statistiche di PitchAPI/LiveScore: dati di terzi, mai nel repository (e' pubblico) ma su Cloudflare KV (`kvstats.py`, worker `/r?k=idx:ps/...`).
// Si uniscono alle partite dove FotMob non ha `p` (indice `idx:ps/index` = elenco delle stagioni che ce l'hanno: nessuna richiesta inutile).
const kvSlug = (sk) => String(sk).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const kvIndex = () => { if (!cache.has('kv-ps-index')) cache.set('kv-ps-index', fetch(`${WORKER}/r?k=idx:ps/index`).then((r) => (r.ok ? r.json() : Promise.reject(new Error('kv')))).then((a) => new Set(a)).catch(() => { cache.delete('kv-ps-index'); return new Set(); })); return cache.get('kv-ps-index'); };
export const loadSeasonMatches = (lid, sk) => once(`ps/${lid}/${sk}.gz`, async () => {
  const [d, idx] = await Promise.all([gz(`partite/${lid}/${sk}.json.gz`), kvIndex()]);
  const k = `${lid}/${kvSlug(sk)}`;
  if (!d || !d.m || !idx.has(k)) return d;
  try {
    const r = await fetch(`${WORKER}/r?k=idx:ps/${k}`);
    const ov = r.ok ? await r.json() : null;
    Object.entries(ov || {}).forEach(([mid, v]) => { const m = d.m[mid] || (d.m[mid] = {}); if (!m.p) Object.assign(m, v); });
  } catch (e) { /* senza KV restano i dati di FotMob */ }
  return d;
});

export const teamLogo = (id) => `https://images.fotmob.com/image_resources/logo/teamlogo/${id}.png`;
export const playerFace = (id) => `https://images.fotmob.com/image_resources/playerimages/${id}.png`;

// "2025-2026" → "2025/26"; "2025-2026 - Clausura" → "2025/26 Clausura"; "2026 - Apertura" → "2026 Apertura"
export const seasonLabel = (sk) => {
  const m = /^(\d{4})-(\d{4})(?: - (.+))?$/.exec(sk || '');
  if (m) return `${m[1]}/${m[2].slice(2)}${m[3] ? ` ${m[3]}` : ''}`;
  const y = /^(\d{4}) - (.+)$/.exec(sk || '');
  return y ? `${y[1]} ${y[2]}` : String(sk || '').replace('-', '/');
};
export const sortSeasons = (list) => [...list].sort((a, b) => String(b).localeCompare(String(a)));

export const STAT_IT = {
  BallPossesion: 'Possesso palla', expected_goals: 'Gol attesi (xG)', total_shots: 'Tiri totali', ShotsOnTarget: 'Tiri in porta', ShotsOffTarget: 'Tiri fuori',
  blocked_shots: 'Tiri bloccati', shots_woodwork: 'Legni', shots_inside_box: 'Tiri in area', shots_outside_box: 'Tiri da fuori area', big_chance: 'Palle gol',
  big_chance_missed_title: 'Palle gol sbagliate', touches_opp_box: 'Tocchi in area avversaria', corners: 'Calci d\'angolo', accurate_passes: 'Passaggi riusciti',
  passes: 'Passaggi', own_half_passes: 'Nella propria metà', opposition_half_passes: 'Nella metà avversaria', long_balls_accurate: 'Lanci lunghi riusciti',
  accurate_crosses: 'Cross riusciti', player_throws: 'Rimesse laterali', Offsides: 'Fuorigioco', 'matchstats.headers.tackles': 'Contrasti', interceptions: 'Intercetti',
  shot_blocks: 'Tiri murati', clearances: 'Respinte', keeper_saves: 'Parate', duel_won: 'Duelli vinti', ground_duels_won: 'Duelli a terra vinti', aerials_won: 'Duelli aerei vinti',
  dribbles_succeeded: 'Dribbling riusciti', yellow_cards: 'Cartellini gialli', red_cards: 'Cartellini rossi', fouls: 'Falli commessi', shots: 'Tiri', defense: 'Difesa', duels: 'Duelli', discipline: 'Disciplina',
};
// gruppi di statistiche di squadra, nell'ordine di lettura
export const STAT_GROUPS = [
  ['Principali', ['BallPossesion', 'expected_goals', 'total_shots', 'ShotsOnTarget', 'big_chance', 'big_chance_missed_title', 'corners', 'Offsides', 'fouls', 'yellow_cards', 'red_cards']],
  ['Tiri', ['ShotsOffTarget', 'blocked_shots', 'shots_woodwork', 'shots_inside_box', 'shots_outside_box']],
  ['Passaggi', ['accurate_passes', 'passes', 'own_half_passes', 'opposition_half_passes', 'long_balls_accurate', 'accurate_crosses', 'touches_opp_box', 'player_throws']],
  ['Difesa', ['matchstats.headers.tackles', 'interceptions', 'shot_blocks', 'clearances', 'keeper_saves']],
  ['Duelli', ['duel_won', 'ground_duels_won', 'aerials_won', 'dribbles_succeeded']],
];

// classifiche stagionali (giocatori / squadre)
export const SEASON_STAT_IT = {
  goals: 'Gol', goal_assist: 'Assist', _goals_and_goal_assist: 'Gol + assist', rating: 'Voto medio', mins_played: 'Minuti giocati', expected_goals: 'Gol attesi (xG)',
  expected_assists: 'Assist attesi (xA)', ontarget_scoring_att: 'Tiri in porta', total_scoring_att: 'Tiri', accurate_pass: 'Passaggi riusciti', big_chance_created: 'Palle gol create',
  total_att_assist: 'Passaggi chiave', accurate_long_balls: 'Lanci lunghi riusciti', won_contest: 'Dribbling riusciti', big_chance_missed: 'Palle gol sbagliate', penalty_won: 'Rigori procurati',
  total_tackle: 'Contrasti', interception: 'Intercetti', effective_clearance: 'Respinte', outfielder_block: 'Tiri murati', ball_recovery: 'Recuperi', penalty_conceded: 'Rigori concessi',
  clean_sheet: 'Porta inviolata', saves: 'Parate', goals_conceded: 'Gol subiti', fouls: 'Falli commessi', yellow_card: 'Cartellini gialli', red_card: 'Cartellini rossi', goals_per_90: 'Gol ogni 90\'',
  expected_goals_per_90: 'xG ogni 90\'', rating_team: 'Voto medio', goals_team_match: 'Gol a partita', goals_conceded_team_match: 'Gol subiti a partita', possession_percentage_team: 'Possesso palla',
  clean_sheet_team: 'Porta inviolata', expected_goals_team: 'Gol attesi (xG)', ontarget_scoring_att_team: 'Tiri in porta', big_chance_team: 'Palle gol', accurate_pass_team: 'Passaggi riusciti',
  accurate_cross_team: 'Cross riusciti', corner_taken_team: 'Calci d\'angolo', total_yel_card_team: 'Cartellini gialli', total_red_card_team: 'Cartellini rossi', fk_foul_lost_team: 'Falli subiti',
  saves_team: 'Parate', total_tackle_team: 'Contrasti', interception_team: 'Intercetti', penalty_won_team: 'Rigori procurati', penalty_conceded_team: 'Rigori concessi',
  touches_in_opp_box_team: 'Tocchi in area', expected_goals_conceded_team: 'xG subiti', effective_clearance_team: 'Respinte', accurate_long_balls_team: 'Lanci lunghi riusciti',
};
export const PLAYER_STAT_IT = {
  rating_title: 'Voto', minutes_played: 'Minuti', goals: 'Gol', assists: 'Assist', total_shots: 'Tiri', ShotsOnTarget: 'Tiri in porta', ShotsOffTarget: 'Tiri fuori', blocked_shots: 'Tiri bloccati',
  accurate_passes: 'Passaggi riusciti', chances_created: 'Occasioni create', touches: 'Tocchi', fouls: 'Falli commessi', was_fouled: 'Falli subiti', interceptions: 'Intercetti',
  'matchstats.headers.tackles': 'Contrasti', clearances: 'Respinte', recoveries: 'Recuperi', duel_won: 'Duelli vinti', duel_lost: 'Duelli persi', aerials_won: 'Duelli aerei vinti',
  dribbles_succeeded: 'Dribbling riusciti', saves: 'Parate', goals_conceded: 'Gol subiti', dispossessed: 'Palle perse', crosses: 'Cross', passes_into_final_third: 'Passaggi nell\'ultimo terzo',
  shot_blocks: 'Tiri murati', defensive_actions: 'Azioni difensive', touches_opp_box: 'Tocchi in area',
  expected_goals_on_target_faced: 'Gol attesi subiti (xGOT)', errors_led_to_goal: 'Errori che portano a gol', conceded_penalties: 'Rigori concessi', last_man_tackle: 'Ultimo uomo', penalties_won: 'Rigori procurati',
  clearance_off_the_line: 'Salvataggi sulla linea', owngoal: 'Autogol', missed_penalty: 'Rigori sbagliati', saved_penalties: 'Rigori parati', keeper_diving_save: 'Parate in tuffo', saves_inside_box: 'Parate in area',
  keeper_high_claim: 'Uscite alte', keeper_sweeper: 'Uscite basse', expected_assists: 'Assist attesi (xA)', expected_goals: 'Gol attesi (xG)', expected_goals_non_penalty: 'xG senza rigori', ground_duels_won: 'Duelli a terra vinti',
  long_balls_accurate: 'Lanci lunghi riusciti', line_breaking_passes: 'Passaggi che rompono la linea', headed_clearance: 'Respinte di testa', dribbled_past: 'Dribblato', corners: 'Calci d\'angolo', Offsides: 'Fuorigioco',
  big_chance_missed_title: 'Palle gol sbagliate', accurate_crosses: 'Cross riusciti', shots_woodwork: 'Legni colpiti', rating_title: 'Voto medio',
};
export const prettyKey = (k) => String(k).replace(/_t$/, '').replace(/^matchstats\.headers\./, '').replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

// stagioni passate di un campionato (la piu' recente dell'indice e' quella in corso, mostrata dai dati live)
export const pastSeasons = async (fm) => {
  const idx = await archIndex();
  const e = idx && idx[String(fm)];
  return sortSeasons((e && e.s) || []).slice(1);
};
// Statistiche dei giocatori ricavate dalle partite della stagione (quando le statistiche stagionali ufficiali non ci sono ancora).
// Stessa forma delle statistiche v2: chiave -> [[id, nome, squadra, valore, minuti, partite, ruoli]] in ordine di classifica.
const SKIP_KEY = /_t$|^physical_|^minutes_played$|^goals_prevented$|^xg_and_xa$|^shot_accuracy$|variant$|_team_title$|^player_throws$|^punches$/;
// part: 'tot' | 'home' | 'away' (solo le partite giocate in casa o in trasferta: lato ricavato dalla formazione)
export const statsFromMatches = (lid, sk, part = 'tot') => once(`sfm/${lid}/${sk}/${part}`, async () => {
  const d = await loadSeasonMatches(lid, sk);
  if (!d || !d.m) return null;
  const tot = {};
  const acc = {};
  const who = {}; // id giocatore -> [squadra, nome] dalle formazioni della partita (titolari e panchina)
  Object.values(d.m).forEach((m) => {
    const homeIds = new Set();
    const awayIds = new Set();
    [[m && m.h, homeIds], [m && m.a, awayIds]].forEach(([side, ids]) => {
      if (!side || !side.id) return;
      Object.values(side).forEach((list) => { if (Array.isArray(list)) list.forEach((r) => { if (Array.isArray(r) && r[0] != null) { who[String(r[0])] = [String(side.id), r[1] || '']; ids.add(String(r[0])); } }); });
    });
    // partite PitchAPI senza formazioni FotMob: nome e squadra dei giocatori in `pn` (id -> [nome, lato, squadra])
    Object.entries((m && m.pn) || {}).forEach(([pid, r]) => { who[pid] = [String(r[2]), r[0] || '']; (r[1] === 'h' ? homeIds : awayIds).add(pid); });
    Object.entries((m && m.p) || {}).forEach(([pid, v]) => {
      const mins = Number(v.minutes_played) || 0;
      if (!mins) return;
      if ((part === 'home' && !homeIds.has(pid)) || (part === 'away' && !awayIds.has(pid))) return;
      const t = (tot[pid] = tot[pid] || { min: 0, n: 0 });
      t.min += mins;
      t.n += 1;
      Object.entries(v).forEach(([k, val]) => {
        if (typeof val !== 'number' || SKIP_KEY.test(k) || HIDDEN_STAT.test(k)) return;
        const a = ((acc[k] = acc[k] || {})[pid] = acc[k][pid] || { s: 0, n: 0 });
        a.s += val;
        a.n += 1;
      });
    });
  });
  const players = {};
  Object.entries(acc).forEach(([k, per]) => {
    const isRating = k === 'rating_title';
    const rows = Object.entries(per)
      .map(([pid, a]) => [pid, (who[pid] || [])[1] || '', (who[pid] || [])[0] || null, isRating ? a.s / a.n : a.s, tot[pid].min, tot[pid].n, null])
      .filter((r) => (isRating ? r[4] >= 90 : r[3] > 0));
    if (rows.length < 3) return;
    rows.sort((x, y) => y[3] - x[3]);
    players[k] = rows;
  });
  // minuti di chiunque abbia giocato (stessa voce delle classifiche ufficiali): anche chi ha tutti i valori a zero ha le sue statistiche
  const mins = Object.entries(tot).map(([pid, t]) => [pid, (who[pid] || [])[1] || '', (who[pid] || [])[0] || null, t.min, t.min, t.n, null]);
  if (mins.length >= 3 && !players.mins_played) players.mins_played = mins.sort((x, y) => y[3] - x[3]);
  return Object.keys(players).length ? { v: 2, players, teams: {}, fromMatches: true } : null;
});
// statistiche squadre di una stagione: quelle ufficiali se ci sono, altrimenti le medie a partita dalle partite archiviate
// (stagione in corso dei campionati aggiunti: il file ufficiale esiste ma e' ancora vuoto)
export const loadTeamStats = async (lid, sk) => {
  const st = await loadSeasonStats(lid, sk);
  if (st && st.teams && Object.keys(st.teams).length) return st;
  return teamPartStats(lid, sk, 'tot');
};
// stesse statistiche ma per un giocatore preciso: se non e' nelle classifiche ufficiali (hanno solo i primi di ogni voce) si usano quelle calcolate dalle partite
const MERGED = new Map();
// nomi delle voci nelle partite -> nomi delle classifiche stagionali (le due fonti FotMob usano chiavi diverse)
const MATCH_TO_SEASON = { total_shots: 'total_scoring_att', ShotsOnTarget: 'ontarget_scoring_att', assists: 'goal_assist', chances_created: 'total_att_assist', accurate_passes: 'accurate_pass', interceptions: 'interception', recoveries: 'ball_recovery' };
export const loadPlayerStatsFor = async (lid, sk, pid) => {
  const st = await loadPlayerStats(lid, sk);
  const rowOf = (s, k) => ((s && s.players && s.players[k]) || []).find((r) => String(r[0]) === String(pid)) || null;
  const has = (s) => !!(s && s.players && Object.keys(s.players).some((k) => !k.startsWith('_') && rowOf(s, k)));
  const official = !!(st && !st.fromMatches);
  if (has(st) && !(official && !rowOf(st, 'total_scoring_att') && rowOf(st, 'mins_played'))) return st;
  const fm = await statsFromMatches(lid, sk);
  if (!has(fm)) return st;
  if (!has(st)) return fm;
  // Gerarchia dei dati (regola fissa): 1) classifiche ufficiali FotMob; 2) quando la classifica ufficiale non ha il giocatore su una voce (le classifiche hanno
  // solo chi supera una soglia: es. Diarra in Champions con 56' non era nei tiri) la voce si completa con la somma delle sue partite FotMob; 3) fonti esterne (vedi CLAUDE.md)
  const ck = `${lid}|${sk}|${pid}`;
  const hit = lruGet(MERGED, ck);
  if (hit) return hit;
  const players = { ...st.players };
  Object.keys(fm.players).forEach((mk) => {
    const k = MATCH_TO_SEASON[mk] || mk;
    if (k.startsWith('_') || !st.players[k] || rowOf(st, k)) return;
    const mine = rowOf(fm, mk);
    if (!mine) return;
    const list = [...players[k]];
    let i = list.findIndex((r) => r[3] < mine[3]);
    if (i < 0) i = list.length;
    list.splice(i, 0, mine);
    players[k] = list;
  });
  const out = { ...st, players, filled: true };
  lruSet(MERGED, ck, out, 40);
  return out;
};
// presenze, minuti, gol, assist e voto di un giocatore in una stagione e competizione: un solo calcolo per Profilo e Statistiche
export const playerSeasonLine = async (lid, sk, pid) => {
  const st = await loadPlayerStatsFor(lid, sk, pid);
  const P = st && st.players;
  if (!P) return null;
  const mine = (k) => (P[k] || []).find((r) => String(r[0]) === String(pid)) || null;
  const anyKey = Object.keys(P).find((k) => !k.startsWith('_') && mine(k));
  if (!anyKey) return null;
  const me = mine('mins_played') || mine(anyKey);
  const val = (...ks) => { for (const k of ks) { const r = mine(k); if (r) return r[3]; } return null; };
  return { appearances: me[5] || 0, minutes: me[4] || 0, goals: val('goals') || 0, assists: val('goal_assist', 'assists') || 0, rating: val('rating', 'rating_title') };
};
// statistiche giocatori di una stagione: quelle ufficiali se ci sono, altrimenti quelle calcolate dalle partite
export const loadPlayerStats = async (lid, sk) => {
  const st = await loadSeasonStats(lid, sk);
  if (st && st.players && Object.keys(st.players).length) return st;
  return statsFromMatches(lid, sk);
};
// statistiche giocatori per il pannello di una squadra: le classifiche ufficiali hanno solo i primi di ogni voce (una squadra piccola puo' non esserci
// o avere pochi nomi), quindi sotto 11 giocatori si guardano anche quelle calcolate dalle partite e vale la fonte con piu' giocatori della squadra
export const loadTeamPlayerStats = async (lid, sk, tid) => {
  const count = (s) => { const ids = new Set(); Object.entries((s && s.players) || {}).forEach(([k, l]) => { if (!k.startsWith('_')) (l || []).forEach((r) => { if (String(r[2]) === String(tid)) ids.add(String(r[0])); }); }); return ids.size; };
  const st = await loadSeasonStats(lid, sk).catch(() => null);
  const n = count(st);
  if (n >= 11) return st;
  const fm = await statsFromMatches(lid, sk).catch(() => null);
  return count(fm) > n ? fm : st;
};
// campionati con storico completo; gli altri hanno statistiche solo dal 2020
const TOP20 = new Set([47, 87, 55, 54, 53, 57, 61, 48, 86, 146, 71, 40, 64, 268, 112, 130, 230, 38, 59, 135, 42, 73, 10216]);
export const noStats = (fm, sk) => !TOP20.has(Number(fm)) && Number(String(sk).slice(0, 4)) < 2020;
// Arbitri di un campionato: per tutte le stagioni solo top 5 e coppe europee; per gli altri solo la stagione in corso
const REFS_ALL = new Set([55, 47, 87, 54, 53, 42, 73, 10216]);
export const refsAllSeasons = (fm) => REFS_ALL.has(Number(fm));
// La scheda Arbitri del campionato c'e' solo per i top campionati (i 9 in alto nella Home), le coppe europee e le competizioni
// internazionali (paese "INT" nell'indice); per tutte le altre niente scheda. Nome e medie dell'arbitro in partita restano ovunque.
const REFS_TAB = new Set([55, 47, 87, 54, 53, 40, 57, 61, 71, 42, 73, 10216]);
export const refsAllowed = (fm) => REFS_TAB.has(Number(fm)) || !!(IDX && IDX[String(fm)] && IDX[String(fm)].c === 'INT');
// stagione piu' recente dell'indice (quella in corso)
export const currentSeason = async (fm) => {
  const idx = await archIndex();
  const e = idx && idx[String(fm)];
  return e && e.s && e.s.length ? sortSeasons(e.s)[0] : null;
};
// una stagione con calendario o classifica (le stagioni vuote non si mostrano: regola "niente non disponibile")
export const hasSeasonData = (d) => !!(d && ((d.fix && d.fix.length) || d.table || (d.groups && d.groups.length)));
// competizione dell'archivio: la scheda parte dalla stagione piu' recente CON dati; {sk, empty: stagioni vuote da togliere dalla tendina}
export const firstSeasonWithData = async (fm, list) => {
  const empty = [];
  for (const sk of list.slice(0, 4)) {
    const d = await loadSeason(fm, sk).catch(() => null);
    if (hasSeasonData(d)) return { sk, empty };
    empty.push(sk);
  }
  return { sk: null, empty };
};
// stagioni passate in cui la squadra ha davvero giocato quella competizione
export const teamSeasons = async (fm, name) => {
  const list = await pastSeasons(fm);
  const hit = await Promise.all(list.map((sk) => loadSeason(fm, sk).then((s) => (s && s.teams && teamIdByName(s.teams, name) ? sk : null)).catch(() => null)));
  return hit.filter(Boolean);
};
// stagioni passate in cui il giocatore (id FotMob) ha giocato quella competizione: dall'indice giocatori (pidx), che comprende anche
// chi non e' nelle classifiche ufficiali (si ricava dalle partite archiviate)
const PSH = {};
const pshard = (n) => { if (!PSH[n]) PSH[n] = fetch(`${BASE}pidx/${n}.json`).then((r) => (r.ok ? r.json() : {})).catch(() => ({})); return PSH[n]; };
export const playerSeasons = async (fm, pid) => {
  const [d, past] = await Promise.all([pshard(Number(pid) % 100), pastSeasons(fm)]);
  const e = d[String(pid)];
  const mine = new Set(e ? e.slice(1).filter((r) => String(r[0]) === String(fm)).map((r) => r[1]) : []);
  return sortSeasons(past.filter((s) => mine.has(s)));
};
import { norm, acr, sameSquad } from './teamMatch';
import { teamByName } from './teams';
const fmOfTeam = (t) => { if (!t) return null; if (t.fmId) return String(t.fmId); const m = /teamlogo\/(\d+)\.png/.exec(String(t.crest || '')); return m ? m[1] : null; };
// id FotMob di una squadra dentro i dati di una stagione, dal nome: prima uguale, poi sigla, poi nome contenuto (mai due squadre diverse che si somigliano)
export const teamIdByName = (teams, name) => {
  const n = norm(name);
  if (!n || !teams) return null;
  // prima l'id FotMob della squadra dell'app (nomi diversi tra fonti: "Sheffield United" e "Sheff Utd")
  const f = fmOfTeam(teamByName(name));
  if (f && teams[f] && sameSquad(teams[f], name)) return f;
  const ent = Object.entries(teams).filter(([, v]) => sameSquad(v, name)); // mai la prima squadra al posto della B (o viceversa)
  let hit = ent.find(([, v]) => norm(v) === n);
  if (!hit) { const a = acr(name); hit = ent.find(([, v]) => { const m = norm(v); return m === a || (a.length >= 3 && acr(v) === n); }); }
  if (!hit) {
    const cand = ent.filter(([, v]) => { const m = norm(v); return m && m.length >= 4 && n.length >= 4 && (m.includes(n) || n.includes(m)); });
    if (cand.length === 1) hit = cand[0];
  }
  return hit ? hit[0] : null;
};

// Statistiche di squadra di una stagione calcolate partita per partita (media a partita, in casa o in trasferta):
// stessa forma delle statistiche stagionali: chiave -> [[null, nome, id squadra, valore, 0, partite]] in ordine di classifica.
const NUMV = (v) => { const n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) ? n : null; };
const TEAM_PART_KEYS = ['BallPossesion', 'expected_goals', 'total_shots', 'ShotsOnTarget', 'ShotsOffTarget', 'blocked_shots', 'shots_woodwork', 'shots_inside_box', 'shots_outside_box', 'big_chance', 'big_chance_missed_title',
  'touches_opp_box', 'corners', 'passes', 'accurate_passes', 'own_half_passes', 'opposition_half_passes', 'long_balls_accurate', 'accurate_crosses', 'player_throws', 'Offsides', 'matchstats.headers.tackles', 'interceptions',
  'shot_blocks', 'clearances', 'keeper_saves', 'duel_won', 'ground_duels_won', 'aerials_won', 'dribbles_succeeded', 'yellow_cards', 'red_cards', 'fouls'];
export const teamPartStats = (lid, sk, part) => once(`tps/${lid}/${sk}/${part}`, async () => {
  const d = await loadSeasonMatches(lid, sk);
  if (!d || !d.m) return null;
  const season = await loadSeason(lid, sk);
  const names = (season && season.teams) || {};
  const acc = {};
  Object.values(d.m).forEach((m) => {
    if (!m || !m.s || !m.h || !m.a) return;
    [[0, m.h.id, 'home'], [1, m.a.id, 'away']].forEach(([side, tid, where]) => {
      if (part === 'home' && where !== 'home') return;
      if (part === 'away' && where !== 'away') return;
      TEAM_PART_KEYS.forEach((k) => {
        const arr = m.s[k];
        const v = arr ? NUMV(arr[side]) : null;
        if (v === null) return;
        const a = ((acc[k] = acc[k] || {})[tid] = acc[k][tid] || { s: 0, n: 0 });
        a.s += v; a.n += 1;
      });
    });
  });
  const teams = {};
  Object.entries(acc).forEach(([k, per]) => {
    const rows = Object.entries(per).filter(([, a]) => a.n > 0).map(([tid, a]) => [null, names[tid] || '', Number(tid), a.s / a.n, 0, a.n]);
    if (rows.length < 3) return;
    rows.sort((x, y) => y[3] - x[3]);
    teams[k] = rows;
  });
  return Object.keys(teams).length ? { v: 2, teams, players: {}, fromMatches: true } : null;
});
