// Partite dei campionati aggiunti e dell'archivio: costruite nello stesso formato delle partite dei top campionati,
// così la pagina partita è identica (Riepilogo, statistiche, mappa tiri, formazioni, classifica).
// Il dettaglio completo arriva dal Worker (FotMob, vale per qualsiasi partita); quello salvato nell'archivio è la riserva.
import { loadSeason, loadSeasonMatches, loadSeasonStats, FM_ID, archIndex, teamLogo, seasonLabel, STAT_IT, STAT_GROUPS, prettyKey, currentSeason, teamIdByName } from './archive';
import { isPureCup } from './bracket';
import { MATCH_BY_ID } from './matches';
import { ensureTeam, teamById } from './teams';
import { leagueById, LEAGUES, CUP_IDS } from './leagues';
import { romeDay, romeTime, slug, norm } from './util';

export const archiveId = (fm, sk, mid) => `a-${fm}-${sk}-${mid}`;
export const parseArchiveId = (id) => {
  // stagione anche con suffisso: "a-230-2026-2027 - Apertura-123"
  let s = String(id);
  try { s = decodeURIComponent(s); } catch (e) { /* gia' in chiaro */ }
  const m = /^a-(\d+)-(\d{4}(?:-\d{4})?(?: - [^-]+?)?)-(\d+)$/.exec(s);
  return m ? { fm: m[1], sk: m[2], mid: m[3] } : null;
};

const pseudo = {};
export async function leagueForFm(fm) {
  const lid = Object.keys(FM_ID).find((k) => String(FM_ID[k]) === String(fm));
  const known = lid ? leagueById(lid) : null;
  if (known) return known;
  if (pseudo[fm]) return pseudo[fm];
  const idx = await archIndex();
  const e = (idx && idx[String(fm)]) || {};
  pseudo[fm] = { id: `fm-${fm}`, name: e.n || 'Campionato', country: e.cn || '', colors: [], logo: `https://images.fotmob.com/image_resources/logo/leaguelogo/${fm}.png`, logoDark: null, noPage: true };
  return pseudo[fm];
}

// squadre della stagione come squadre dell'app (stemma e colori).
// Una squadra gia' presente nell'app (stesso nome, stesso campionato o coppa) viene riusata; le altre sono nuove e
// portano alla loro pagina d'archivio. Cosi' squadre con lo stesso nome in paesi diversi non si scambiano lo stemma.
function teamsOf(season, fm, sk, leagueId) {
  const map = {};
  const cup = !leagueId || /champions|europa|conference/.test(leagueId);
  Object.entries(season.teams || {}).forEach(([tid, name]) => {
    const uid = `fm-${tid}`;
    let t = teamById(uid);
    if (!t) {
      const known = teamById(slug(name));
      if (known && (cup ? known.leagueId : known.leagueId === leagueId)) t = known;
    }
    if (!t) {
      t = ensureTeam(name, leagueId, teamLogo(tid), tid, uid);
      t.href = `/storico/${fm}/${sk}/squadra/${tid}`;
    }
    map[tid] = t;
  });
  return map;
}

const scoreOf = (s) => {
  const p = String(s || '').split(' - ').map(Number);
  return p.length === 2 && p.every(Number.isFinite) ? p : null;
};

// ultime partite finite della squadra prima di una certa data (per "Forma recente")
function recentFn(fm, sk, season, tmap) {
  const fin = (season.fix || []).filter((x) => x[6] && !x[8] && scoreOf(x[5]));
  return (tid, beforeTs, n = 5) => fin
    .filter((x) => (String(x[2]) === String(tid) || String(x[3]) === String(tid)) && new Date(x[4]).getTime() < beforeTs)
    .sort((a, b) => String(b[4]).localeCompare(String(a[4])))
    .slice(0, n)
    .map((x) => {
      const ts = new Date(x[4]).getTime();
      return { id: archiveId(fm, sk, x[0]), date: romeDay(ts), ts, status: 'finished', score: scoreOf(x[5]), homeId: tmap[x[2]] && tmap[x[2]].id, awayId: tmap[x[3]] && tmap[x[3]].id };
    });
}

// stadio più usato dalla squadra in casa in quella stagione (dalle partite archiviate)
function stadiumOf(season, det, tid) {
  const cnt = {};
  (season.fix || []).forEach((x) => {
    if (String(x[2]) !== String(tid)) return;
    const d = det && det.m && det.m[String(x[0])];
    const st = d && d.i && d.i.st;
    if (st) cnt[st] = (cnt[st] || 0) + 1;
  });
  const best = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0];
  return best ? best[0] : null;
}

// arbitri della stagione: cartellini e falli a partita
const refCache = new WeakMap();
function refTable(det) {
  if (!det || !det.m) return null;
  if (refCache.has(det)) return refCache.get(det);
  const by = {};
  Object.values(det.m).forEach((x) => {
    const name = x && x.i && x.i.ref;
    if (!name) return;
    const r = (by[name] = by[name] || { name, n: 0, y: 0, fo: 0 });
    r.n += 1;
    (x.e || []).forEach((e) => { if (e.type === 'Card' && /Yellow/i.test(e.card || '')) r.y += 1; });
    const f = x.s && x.s.fouls;
    if (f) r.fo += (Number(f[0]) || 0) + (Number(f[1]) || 0);
  });
  const list = Object.values(by).map((r) => ({ ...r, y: r.y / r.n, fo: r.fo / r.n }));
  const tot = list.reduce((a, r) => a + r.n, 0);
  const t = tot ? {
    by: Object.fromEntries(list.map((r) => [norm(r.name), r])),
    lg: {
      n: list.length,
      y: list.reduce((a, r) => a + r.y * r.n, 0) / tot,
      fo: list.reduce((a, r) => a + r.fo * r.n, 0) / tot,
      ys: list.map((r) => r.y).sort((a, b) => a - b),
      fos: list.map((r) => r.fo).sort((a, b) => a - b),
    },
  } : null;
  refCache.set(det, t);
  return t;
}

// pillola dell'arbitro: stessa scheda dei top campionati (ammonizioni e falli a partita contro la media del campionato)
export function applyRefExtra(m) {
  if (!m.det || !m.refereeName) return;
  const t = refTable(m.det);
  if (t) m.refLg = t.lg;
  const r = t && t.by[norm(m.refereeName)];
  if (r) m.refExtra = { name: m.refereeName, n: r.n, y: r.y, fo: r.fo, lg: t.lg };
}


// Coppe nazionali: poche partite, statistiche poco affidabili. Per le prestazioni "pre-partita" si usa la media tra la coppa e il campionato
// (della stessa stagione) delle due squadre: qui si caricano i campionati del paese in cui una delle due gioca.
async function domesticFor(fm, hid, aid) {
  if (!isPureCup(fm)) return null;
  const cup = await leagueForFm(fm);
  if (!cup || !cup.country) return null;
  const lgs = LEAGUES.filter((l) => !l.arch && l.country === cup.country && !CUP_IDS.has(l.id) && FM_ID[l.id] && l.id !== cup.id);
  const out = await Promise.all(lgs.map(async (l) => {
    try {
      const fmD = FM_ID[l.id];
      const sk = await currentSeason(fmD);
      if (!sk) return null;
      const [season, det] = await Promise.all([loadSeason(fmD, sk), loadSeasonMatches(fmD, sk)]);
      if (!season || !det || !season.teams) return null;
      const has = (t) => t != null && Object.prototype.hasOwnProperty.call(season.teams, String(t));
      return has(hid) || has(aid) ? { season, det } : null;
    } catch (e) { return null; }
  }));
  return out.filter(Boolean);
}

function enrich(m, fm, sk, season, det, tmap, cur) {
  m.season = season;
  m.det = det;
  if (!m.seasonLabel && !cur) m.seasonLabel = seasonLabel(sk);
  const fx = (season.fix || []).find((x) => String(x[0]) === String(m.archive.mid));
  if (fx) {
    m.round = fx[1];
    m.archive.hid = fx[2];
    m.archive.aid = fx[3];
  }
  const rec = recentFn(fm, sk, season, tmap);
  m.recentOf = (teamId) => {
    const tid = Object.keys(tmap).find((k) => tmap[k] && tmap[k].id === teamId);
    return tid ? rec(tid, m.ts) : [];
  };
  m.formOf = (teamId) => m.recentOf(teamId).slice().reverse().map((x) => {
    const home = x.homeId === teamId;
    const gf = home ? x.score[0] : x.score[1];
    const ga = home ? x.score[1] : x.score[0];
    return gf > ga ? 'V' : gf === ga ? 'S' : 'P';
  });
  const d = det && det.m && det.m[String(m.archive.mid)];
  if (d && d.i) {
    if (d.i.ref) { m.refereeName = m.refereeName || d.i.ref; }
    if (d.i.st) m.stadium = m.stadium || d.i.st;
  }
  if (!m.stadium && fx) m.stadium = stadiumOf(season, det, fx[2]);
  applyRefExtra(m);
  m.archReady = true;
  return m;
}

// partita dell'archivio (id a-…): si costruisce dal calendario della stagione
export async function buildArchiveMatch(fm, sk, mid) {
  const id = archiveId(fm, sk, mid);
  if (MATCH_BY_ID[id] && MATCH_BY_ID[id].archReady) return MATCH_BY_ID[id];
  const [season, det] = await Promise.all([loadSeason(fm, sk), loadSeasonMatches(fm, sk)]);
  if (!season) return null;
  const fx = (season.fix || []).find((x) => String(x[0]) === String(mid));
  if (!fx) return null;
  const league = await leagueForFm(fm);
  const tmap = teamsOf(season, fm, sk, league && !league.noPage ? league.id : null);
  const home = tmap[fx[2]];
  const away = tmap[fx[3]];
  if (!home || !away) return null;
  const ts = new Date(fx[4]).getTime();
  const sc = scoreOf(fx[5]);
  const status = fx[6] && !fx[8] ? 'finished' : fx[7] && !fx[8] ? 'live' : 'scheduled';
  const m = MATCH_BY_ID[id] || {
    id, leagueId: league.id, homeId: home.id, awayId: away.id,
    date: romeDay(ts), offset: 0, kickoff: romeTime(ts), ts, timeKnown: true, status,
    minute: status === 'finished' ? 90 : null, score: status === 'finished' ? sc : null, liveScore: status === 'live' ? sc : null,
    stadium: null, weather: null, refereeId: null, stats: null, statGroups: null, events: [], momentum: [], shots: [], lineup: null, detail: false,
    fmId: mid, archive: { fm, sk, mid }, extra: true, cancelled: !!fx[8], leagueObj: league,
  };
  MATCH_BY_ID[id] = m;
  m.leagueObj = league;
  // stagione in corso di un campionato aggiunto: niente etichetta; stagioni passate: "· 2019/20"
  if (isPureCup(fm)) m.moreDet = await domesticFor(fm, fx[2], fx[3]);
  try { const st = await loadSeasonStats(fm, sk); m.sTeams = (st && st.teams) || null; } catch (e) { /* ignora */ }
  return enrich(m, fm, sk, season, det, tmap, false);
}

// partita di un campionato aggiunto già presente nell'app (id x-…): si completa con calendario e dettagli archiviati
export async function completeExtraMatch(m) {
  if (!m || !m.archive || m.archReady) return m;
  const { fm, sk } = m.archive;
  const [season, det] = await Promise.all([loadSeason(fm, sk), loadSeasonMatches(fm, sk)]);
  if (!season) return m;
  const league = await leagueForFm(fm);
  m.leagueObj = league;
  const tmap = teamsOf(season, fm, sk, league && !league.noPage ? league.id : null);
  // le due squadre della partita sono quelle gia' usate dall'app (anche se il nome nel calendario e' scritto in modo diverso)
  if (m.archive.hid != null && teamById(m.homeId)) tmap[m.archive.hid] = teamById(m.homeId);
  if (m.archive.aid != null && teamById(m.awayId)) tmap[m.archive.aid] = teamById(m.awayId);
  if (isPureCup(fm)) m.moreDet = await domesticFor(fm, m.archive.hid, m.archive.aid);
  try { const st = await loadSeasonStats(fm, sk); m.sTeams = (st && st.teams) || null; } catch (e) { /* ignora */ }
  enrich(m, fm, sk, season, det, tmap, true);
  await addLeagueForm(m, fm);
  return m;
}

// Forma recente in tutte le competizioni: se la partita e' di una coppa (o di un'altra competizione) si aggiungono le partite
// della stagione in corso del campionato di ciascuna squadra (calendario archiviato), unite a quelle della competizione della partita.
async function addLeagueForm(m, fm) {
  const base = m.recentOf;
  const extra = {};
  await Promise.all([m.homeId, m.awayId].map(async (id) => {
    try {
      const t = teamById(id);
      const lfm = t && FM_ID[t.leagueId];
      if (!lfm || Number(lfm) === Number(fm)) return;
      const sk = await currentSeason(lfm);
      const season = sk && await loadSeason(lfm, sk);
      if (!season || !season.teams) return;
      const tid = teamIdByName(season.teams, t.name) || (t.fmId && season.teams[String(t.fmId)] ? String(t.fmId) : null);
      if (!tid) return;
      const tmap = teamsOf(season, lfm, sk, t.leagueId);
      tmap[tid] = t;
      extra[id] = { rec: recentFn(lfm, sk, season, tmap), tid };
    } catch (e) { /* solo la competizione della partita */ }
  }));
  if (!Object.keys(extra).length) return;
  m.recentOf = (teamId) => {
    const a = base ? base(teamId) : [];
    const x = extra[teamId];
    if (!x) return a;
    const seen = new Set();
    return [...a, ...x.rec(x.tid, m.ts)].filter((r) => { const k = `${r.date}|${r.homeId}|${r.awayId}`; if (seen.has(k)) return false; seen.add(k); return true; })
      .sort((p, q) => q.ts - p.ts).slice(0, 5);
  };
}

/* ── riserva: dettaglio salvato nell'archivio, usata solo se il Worker non risponde ── */
const num = (v) => { const n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) ? n : 0; };

export function applyArchiveFallback(m) {
  const d = m.det && m.det.m && m.det.m[String(m.archive.mid)];
  if (!d || m.detail) return m;
  const events = [];
  (d.e || []).forEach((e) => {
    const team = e.isHome ? 'home' : 'away';
    const minute = e.overloadTime ? `${e.time}+${e.overloadTime}` : e.time;
    if (e.type === 'Goal') {
      events.push({ minute, type: 'goal', team, name: e.nameStr || (e.p && e.p[1]), assist: e.assistStr ? String(e.assistStr).replace(/^assist by\s*/i, '') : null, pen: /penalty/i.test(e.goalDescription || ''), og: /own/i.test(e.goalDescription || '') });
    } else if (e.type === 'Card') {
      events.push({ minute, type: /red/i.test(e.card || '') ? 'red' : 'yellow', team, name: e.nameStr || (e.p && e.p[1]) });
    } else if (e.type === 'Substitution') {
      const sw = e.swap || [];
      events.push({ minute, type: 'sub', team, name: sw[1] && sw[1].name, inName: sw[0] && sw[0].name });
    }
  });
  let gh = 0;
  let ga = 0;
  events.forEach((e) => { if (e.type === 'goal') { if (e.team === 'home') gh += 1; else ga += 1; e.score = [gh, ga]; } });
  m.events = events;
  const s = d.s || {};
  const used = new Set();
  const groups = STAT_GROUPS.map(([title, keys]) => ({
    key: title, title,
    rows: keys.filter((k) => s[k]).map((k) => { used.add(k); const [a, b] = s[k]; return { key: k, label: STAT_IT[k] || prettyKey(k), home: num(a), away: num(b), homeText: k === 'BallPossesion' ? `${a}%` : String(a), awayText: k === 'BallPossesion' ? `${b}%` : String(b) }; }),
  })).filter((g) => g.rows.length);
  if (groups.length) {
    m.statPeriods = { all: groups, first: null, second: null };
    m.statGroups = groups.map((g) => ({ title: g.title, rows: g.rows }));
    const f = {};
    groups.forEach((g) => g.rows.forEach((r) => { f[r.key] = [r.home, r.away]; }));
    m.stats = { possesso: f.BallPossesion, xg: f.expected_goals, tiri: f.total_shots, tiriInPorta: f.ShotsOnTarget, occasioni: f.big_chance, corner: f.corners, falli: f.fouls, cartellini: f.yellow_cards, passaggi: f.passes, fuorigioco: f.Offsides };
    Object.keys(m.stats).forEach((k) => !m.stats[k] && delete m.stats[k]);
  }
  if (events.length || groups.length) m.detail = true;
  return m;
}
