// Migliori giocatori del giorno: stessa formula dell'app originale (Poisson sulla media tiri attesa).
import { FALLI_KEYS, autoDuel, falliKeysFor, loadFalli } from './calcRoles';
import { RAW } from './load';
import { PLAYERS } from './players';
import { teamById, teamByName } from './teams';
import { blendTeam, domesticKey, pickLeagueKey, CUPS, DOMESTIC_KEYS, NATIONS_KEYS } from './calcData';
import { romeDay } from './util';
import { calcReliability, fillFrom, hitFromValues, hitRows, initialForm, resultFromFouls } from './calcPlayer';
import { fmTeamIn, foulKeys, loadFouls, playerFouls, teamFoulStats } from './calcFouls';
import { resolvePid } from './playerIndex';
import { comma } from '@/lib/format';
import { parseDash } from '@/lib/calc';
import { isOutOn } from './injuries';
import { lruGet, lruSet } from '@/lib/lru';

export const THRESHOLDS = [
  { key: '0.5', label: 'Over 0,5' },
  { key: '1.5', label: 'Over 1,5' },
  { key: '2.5', label: 'Over 2,5' },
];

// Statistiche della classifica (tendina in alto): tiri e tiri in porta col calcolo dei tiri, falli col calcolo dei falli del Calcolatore
export const TOP_STATS = [
  { key: 'tiri', label: 'Tiri', short: 'Tiri', icon: 'shots' },
  { key: 'porta', label: 'Tiri in porta', short: 'In porta', icon: 'sot' },
  { key: 'fc', label: 'Falli commessi', short: 'Commessi', icon: 'fc' },
  { key: 'fs', label: 'Falli subiti', short: 'Subiti', icon: 'fs' },
];
export const isFoulStat = (s) => s === 'fc' || s === 'fs';
// stato della pagina: resta tornando da un giocatore o dal calcolatore aperti da una riga
export const TOP_KEEP = { day: null, thr: '0.5', stat: 'tiri', stamp: '', child: 0 };

const MIN_VOTE = 7.75;
const MAX_PER_DAY = 80;
const DOMESTIC = [...DOMESTIC_KEYS, ...CUPS]; // top 5 + campionati aggiunti con Affidabilita' + Champions ed Europa League
// Falli commessi/subiti: solo top 5 campionati, coppe europee, coppe nazionali e competizioni delle nazionali (= le competizioni coi dati dei falli, `FALLI_KEYS`);
// niente campionati minori (Eredivisie, Pro League, Super Lig...). Le coppe e le nazionali entrano quando le loro partite sono nelle prossime partite (`fix` di giocatori.json).
const FOUL_COMPS = FALLI_KEYS;

const pois = (k, l) => {
  let s = 0;
  let t = Math.exp(-l);
  for (let i = 0; i <= k; i++) {
    s += t;
    t = (t * l) / (i + 1);
  }
  return s;
};

const pickKey = pickLeagueKey;

// stesse partite dell'Hit Rate del Calcolatore (almeno 50', stagione in corso poi passata)
const lastRows = (p) => hitRows(p);

// media di tiri attesa del giocatore in quella partita; idx 0 = tiri totali, 1 = tiri in porta
const MIN_SEASON_MIN = 180;
function lambdaOf(p, f, idx) {
  const g = p.l[0] + p.c[0];
  const mi = p.l[3] + p.c[3];
  // stesso limite delle classifiche giocatori (docs/regole/giocatori-dati.md): almeno 180 minuti in stagione
  if (g < 3 || mi < MIN_SEASON_MIN) return null;
  const lr = lastRows(p).slice(0, 5);
  if (lr.length < 3) return null;
  let sh = 0;
  let mn = 0;
  lr.forEach((x) => {
    sh += x[idx];
    mn += x[2];
  });
  if (mn / lr.length < 35 || mn <= 0) return null;
  const season = ((p.l[1 + idx] + p.c[1 + idx]) / mi) * 90;
  const l5 = (sh / mn) * 90;
  const rate = (season + l5) / 2;
  const comp = f[3];
  const cup = CUPS.includes(comp);
  const fo = idx ? 'sotFor' : 'totalFor';
  const ag = idx ? 'sotAgainst' : 'totalAgainst';
  const ownKey = pickKey(p.teamName, cup ? comp : null);
  const oppKey = pickKey(f[1], cup ? comp : null);
  const own = ownKey && blendTeam(ownKey, p.teamName, fo);
  const opp = oppKey && blendTeam(oppKey, f[1], ag);
  if (!own || !opp) return null;
  let ro = opp.v > 0 && opp.avg > 0 ? opp.v / opp.avg : 1;
  if (opp.str > 0 && opp.str < 1) ro = 1 + (ro - 1) * opp.str;
  let rc = own.v > 0 && own.avg > 0 ? own.v / own.avg : 1;
  if (own.str > 0 && own.str < 1) rc = 1 + (rc - 1) * own.str;
  const lam = rate * Math.pow(ro, 0.85) * Math.pow(rc, 0.35) * (f[2] === 1 ? 1.06 : 0.94);
  return lam > 0 ? { lam, sea: season, l5, mn: mn / lr.length } : null;
}

let INDEX = null;
export function fixturesByDay() {
  if (INDEX) return INDEX;
  const today = romeDay(Date.now());
  const lim = romeDay(Date.now() + 7 * 864e5);
  const set = {};
  const byDay = {};
  const fix = (RAW.giocatori && RAW.giocatori.fix) || {};
  Object.entries(fix).forEach(([team, list]) => {
    list.forEach((f) => {
      const d = romeDay(new Date(f[0]).getTime());
      if (d < today || d > lim) return;
      set[d] = 1;
      (byDay[d] = byDay[d] || {})[team] = f;
    });
  });
  INDEX = { keys: Object.keys(set).sort(), byDay };
  return INDEX;
}

export const bestDays = () => fixturesByDay().keys;

// giocatori per squadra: ogni giorno si guardano solo quelli delle squadre che giocano, non tutti i ~6000
let BY_TEAM = null;
let BY_TEAM_N = -1;
const playersOf = (team) => {
  if (BY_TEAM_N !== PLAYERS.length) {
    BY_TEAM = new Map();
    BY_TEAM_N = PLAYERS.length;
    PLAYERS.forEach((p) => { const l = BY_TEAM.get(p.teamName); if (l) l.push(p); else BY_TEAM.set(p.teamName, [p]); });
  }
  return BY_TEAM.get(team) || [];
};
let ORDER = null;
let ORDER_N = -1;
const playerOrder = () => { if (ORDER_N !== PLAYERS.length) { ORDER = new Map(PLAYERS.map((p, i) => [p, i])); ORDER_N = PLAYERS.length; } return ORDER; };
const CACHE = new Map();
const fxOf = (f) => ({ ts: new Date(f[0]).getTime(), opp: f[1], home: f[2] === 1, comp: f[3], cup: CUPS.includes(f[3]) });
const rowOf = (p, f, voto, lam, t) => {
  const opp = teamByName(f[1]);
  const own = teamById(p.teamId);
  return {
    player: p,
    voto,
    mediaAttesa: lam,
    minutiMedi: t ? t.mn : null,
    ultime5: t ? t.l5 : null,
    stagione90: t ? t.sea : null,
    match: { ts: new Date(f[0]).getTime(), homeId: f[2] === 1 ? own?.id : opp?.id, awayId: f[2] === 1 ? opp?.id : own?.id, oppName: f[1], home: f[2] === 1, comp: f[3] },
  };
};
// giocatori del giorno che possono entrare in classifica (stesse regole di sempre: presenze, minuti, dati delle squadre)
const candidates = (day, fouls = false) => {
  const bd = fixturesByDay().byDay[day] || {};
  const out = [];
  Object.keys(bd).forEach((teamName) => playersOf(teamName).forEach((p) => {
    const f = bd[p.teamName];
    if (!(fouls ? FOUL_COMPS : DOMESTIC).includes(f[3])) return;
    if (isOutOn(p.id, day)) return; // infortunato fino al rientro
    out.push([p, f]);
  }));
  return out;
};
const finish = (out) => {
  // a parita' di voto e media vale l'ordine dell'elenco giocatori (come quando si scorrevano tutti)
  const pos = playerOrder();
  out.sort((a, b) => b.voto - a.voto || (b.mediaAttesa || 0) - (a.mediaAttesa || 0) || pos.get(a.player) - pos.get(b.player));
  return out.slice(0, MAX_PER_DAY);
};

// Tiri (totali) e tiri in porta: sincrono, stesso voto del Calcolatore
export function bestPlayers(day, threshold, stat = 'tiri') {
  if (isFoulStat(stat)) return lruGet(CACHE, `${day}|${parseFloat(threshold)}|${stat}`) || null;
  const line = parseFloat(threshold);
  const ck = `${day}|${line}|${stat}`;
  const hit = lruGet(CACHE, ck);
  if (hit) return hit;
  const porta = stat === 'porta';
  const out = [];
  candidates(day).forEach(([p, f]) => {
    const t = lambdaOf(p, f, porta ? 1 : 0);
    if (!t) return;
    const rr = calcReliability(p, fxOf(f), line, 'over', porta ? 'inPorta' : 'totali');
    const voto = rr ? Math.max(0, Math.min(10, rr.voto)) : 0;
    if (voto < MIN_VOTE) return;
    out.push(rowOf(p, f, voto, t.lam, t));
  });
  const top = finish(out);
  lruSet(CACHE, ck, top, 40);
  return top;
}

// Falli commessi / subiti: stesso calcolo del Calcolatore (PlayerTab) con il duello avversario automatico (data/calcRoles.js).
// I dati arrivano dalle partite della stagione (calcFouls), quindi la classifica si prepara a parte e si ricorda (LRU).
const PENDING = new Map();
const pause = () => new Promise((r) => setTimeout(r, 0));
export function loadBestFouls(day, threshold, stat) {
  const line = parseFloat(threshold);
  const ck = `${day}|${line}|${stat}`;
  const hit = lruGet(CACHE, ck);
  if (hit) return Promise.resolve(hit);
  const run = lruGet(PENDING, ck);
  if (run) return run;
  const job = (async () => {
    const lineStr = String(line).replace('.', ',');
    const oppStat = stat === 'fc' ? 'fs' : 'fc';
    // stessi filtri dei tiri: almeno 3 presenze e minuti medi sufficienti
    const list = candidates(day, true).filter(([p, f]) => lambdaOf(p, f, 0)).map(([p, f]) => {
      const base = fillFrom({ ...initialForm(), line: lineStr, lineType: 'over' }, p, 'totali', fxOf(f));
      const team = teamById(base.team.id);
      const opp = teamById(base.opp.id);
      return { p, f, base, team, opp, keys: foulKeys([team && team.name, opp && opp.name], [base.team.leagueId, base.opp.leagueId]) };
    });
    const all = [...new Set(list.flatMap((x) => x.keys))];
    const loaded = await Promise.all(all.map(loadFouls));
    const DATA = {};
    all.forEach((k, i) => { if (loaded[i]) DATA[k] = loaded[i]; });
    const loadedFl = await Promise.all(FALLI_KEYS.map(loadFalli));
    const FLD = {};
    FALLI_KEYS.forEach((k, i) => { if (loadedFl[i]) FLD[k] = loadedFl[i]; });
    const out = [];
    for (let i = 0; i < list.length; i += 1) {
      if (i % 25 === 24) await pause(); // la pagina resta reattiva mentre si calcola
      const { p, f, base, team, opp, keys } = list[i];
      const fd = {};
      keys.forEach((k) => { if (DATA[k]) fd[k] = DATA[k]; });
      const fmPid = await resolvePid(p).catch(() => null);
      if (!fmPid) continue;
      const pf = playerFouls(fd, fmPid, team && domesticKey(team.name), stat, p.hn != null ? hitRows(p) : null);
      if (!pf || !pf.last5.length) continue;
      const ownStats = teamFoulStats(fd, fmTeamIn(fd, team), base.team.leagueId, team && team.name, stat);
      const oppStats = teamFoulStats(fd, fmTeamIn(fd, opp), base.opp.leagueId, opp && opp.name, oppStat);
      if (!ownStats || !oppStats) continue;
      const season = { campionato: { tiri: '', minuti: '' }, coppa: { tiri: '', minuti: '' }, nations: { tiri: '', minuti: '' }, qualificazioni: { tiri: '', minuti: '' } };
      ['campionato', 'coppa'].forEach((k) => { if (pf[k]) season[k] = { tiri: comma(Math.round(pf[k].v * 100) / 100, 2), minuti: String(Math.round(pf[k].min)) }; });
      const last5 = pf.last5.join('-');
      const fo = {
        last5, min5: pf.min5.join('-'), season, duel: [],
        team: comma(ownStats.v, 2), opp: comma(oppStats.v, 2),
        hitRate: hitFromValues(parseDash(last5), line, 'over'),
      };
      // duello automatico: i 2 avversari con la media piu' alta nei ruoli con la % piu' alta
      const du = autoDuel(fd, FLD, falliKeysFor(NATIONS_KEYS.includes(f[3])), fmPid, stat, opp && domesticKey(opp.name), fmTeamIn(fd, opp));
      const r = resultFromFouls({ ...base, stat, f: fo }, du ? du.avg : null, du ? du.leagueAvg : null, ownStats.avg, oppStats.avg);
      if (r.score === null || r.score === undefined) continue;
      const voto = Math.max(0, Math.min(10, r.score));
      if (voto < MIN_VOTE) continue;
      out.push(rowOf(p, f, voto, r.lambda, null));
    }
    const top = finish(out);
    lruSet(CACHE, ck, top, 40);
    PENDING.delete(ck);
    return top;
  })().catch(() => { PENDING.delete(ck); return []; });
  lruSet(PENDING, ck, job, 12);
  return job;
}

export { domesticKey };

// Affidabilità di un giocatore in una partita (tiri totali, soglia over): stesso calcolo del Calcolatore.
export function playerReliability(p, dateIso, line = 0.5, keepInjured = false, family = 'totali') {
  if (!p) return null;
  if (!keepInjured && isOutOn(p.id, dateIso)) return null;
  const list = ((RAW.giocatori && RAW.giocatori.fix) || {})[p.teamName] || [];
  const f = list.find((x) => romeDay(new Date(x[0]).getTime()) === dateIso);
  if (!f) return null;
  const opp = teamByName(f[1]);
  const r = calcReliability(p, { ts: new Date(f[0]).getTime(), opp: f[1], home: f[2] === 1, comp: f[3], cup: CUPS.includes(f[3]) }, line, 'over', family);
  if (!r) return null;
  const t = lambdaOf(p, f, family === 'inPorta' ? 1 : 0);
  return { voto: Math.max(0, Math.min(10, r.voto)), lam: r.lam, minuti: t ? t.mn : null, opp };
}

// Scheda giocatore (Statistiche): voti Over di un giocatore per la sua prossima partita, per falli commessi / subiti.
// Stesso calcolo di `loadBestFouls` e del Calcolatore (con duello automatico); ricordato in LRU. Restituisce un voto (0-10) per linea, null se mancano i dati.
const PFOULS = new Map();
export function loadPlayerFouls(p, dateIso, lines, stat) {
  const ck = `${p && p.id}|${dateIso}|${stat}|${lines.join(',')}`;
  const hit = lruGet(PFOULS, ck);
  if (hit) return hit;
  const job = (async () => {
    const list = ((RAW.giocatori && RAW.giocatori.fix) || {})[p.teamName] || [];
    const f = list.find((x) => romeDay(new Date(x[0]).getTime()) === dateIso);
    if (!f) return lines.map(() => null);
    const base = fillFrom({ ...initialForm(), line: '0,5', lineType: 'over' }, p, 'totali', fxOf(f));
    const team = teamById(base.team.id);
    const opp = teamById(base.opp.id);
    const keys = foulKeys([team && team.name, opp && opp.name], [base.team.leagueId, base.opp.leagueId]);
    const loaded = await Promise.all(keys.map(loadFouls));
    const fd = {};
    keys.forEach((k, i) => { if (loaded[i]) fd[k] = loaded[i]; });
    const loadedFl = await Promise.all(FALLI_KEYS.map(loadFalli));
    const fl = {};
    FALLI_KEYS.forEach((k, i) => { if (loadedFl[i]) fl[k] = loadedFl[i]; });
    const fmPid = await resolvePid(p).catch(() => null);
    if (!fmPid) return lines.map(() => null);
    const pf = playerFouls(fd, fmPid, team && domesticKey(team.name), stat, p.hn != null ? hitRows(p) : null);
    if (!pf || !pf.last5.length) return lines.map(() => null);
    const ownStats = teamFoulStats(fd, fmTeamIn(fd, team), base.team.leagueId, team && team.name, stat);
    const oppStats = teamFoulStats(fd, fmTeamIn(fd, opp), base.opp.leagueId, opp && opp.name, stat === 'fc' ? 'fs' : 'fc');
    if (!ownStats || !oppStats) return lines.map(() => null);
    const season = { campionato: { tiri: '', minuti: '' }, coppa: { tiri: '', minuti: '' }, nations: { tiri: '', minuti: '' }, qualificazioni: { tiri: '', minuti: '' } };
    ['campionato', 'coppa'].forEach((k) => { if (pf[k]) season[k] = { tiri: comma(Math.round(pf[k].v * 100) / 100, 2), minuti: String(Math.round(pf[k].min)) }; });
    const last5 = pf.last5.join('-');
    const du = autoDuel(fd, fl, falliKeysFor(NATIONS_KEYS.includes(f[3])), fmPid, stat, opp && domesticKey(opp.name), fmTeamIn(fd, opp));
    return lines.map((line) => {
      const fo = { last5, min5: pf.min5.join('-'), season, duel: [], team: comma(ownStats.v, 2), opp: comma(oppStats.v, 2), hitRate: hitFromValues(parseDash(last5), line, 'over') };
      const r = resultFromFouls({ ...base, line: String(line).replace('.', ','), stat, f: fo }, du ? du.avg : null, du ? du.leagueAvg : null, ownStats.avg, oppStats.avg);
      return r.score === null || r.score === undefined ? null : Math.max(0, Math.min(10, r.score));
    });
  })().catch(() => lines.map(() => null));
  lruSet(PFOULS, ck, job, 30);
  return job;
}

// Affidabilita' partite non iniziate: solo i giocatori con voto >= 7,00
export const MIN_VOTO = 7;
export const okVoto = (v) => v != null && Math.round(v * 100) / 100 >= MIN_VOTO;

export function matchReliability(match, line = 0.5) {
  const out = [];
  PLAYERS.forEach((p) => {
    if (p.teamId !== match.homeId && p.teamId !== match.awayId) return;
    if ((p.l ? p.l[0] : 0) + (p.c ? p.c[0] : 0) < 3) return; // almeno 3 presenze
    const r = playerReliability(p, match.date, line);
    if (r && okVoto(r.voto)) out.push({ player: p, side: p.teamId === match.homeId ? 'home' : 'away', ...r });
  });
  return out.sort((a, b) => b.voto - a.voto);
}
