// Migliori giocatori del giorno: stessa formula dell'app originale (Poisson sulla media tiri attesa).
import { RAW } from './load';
import { PLAYERS } from './players';
import { teamById, teamByName } from './teams';
import { blendTeam, domesticKey, pickLeagueKey, CUPS, DOMESTIC_KEYS } from './calcData';
import { romeDay } from './util';
import { calcReliability } from './calcPlayer';
import { isOutOn } from './injuries';

export const THRESHOLDS = [
  { key: '0.5', label: 'Over 0,5' },
  { key: '1.5', label: 'Over 1,5' },
  { key: '2.5', label: 'Over 2,5' },
];

const MIN_VOTE = 7.75;
const MAX_PER_DAY = 80;
const DOMESTIC = DOMESTIC_KEYS; // top 5 + campionati aggiunti con Affidabilita'

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

const lastRows = (p) => (p.h && p.h.length >= 5 ? p.h : p.r || []);

// media di tiri attesa del giocatore in quella partita; idx 0 = tiri totali, 1 = tiri in porta
function lambdaOf(p, f, idx) {
  const g = p.l[0] + p.c[0];
  const mi = p.l[3] + p.c[3];
  if (g < 3 || mi <= 0) return null;
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

const CACHE = {};
export function bestPlayers(day, threshold) {
  const line = parseFloat(threshold);
  const ck = `${day}|${line}`;
  if (CACHE[ck]) return CACHE[ck];
  const bd = fixturesByDay().byDay[day] || {};
  const out = [];
  PLAYERS.forEach((p) => {
    const f = bd[p.teamName];
    if (!f) return;
    if (!DOMESTIC.includes(f[3])) return;
    if (isOutOn(p.id, romeDay(new Date(f[0]).getTime()))) return; // infortunato fino al rientro
    const t = lambdaOf(p, f, 0);
    if (!t) return;
    const rr = calcReliability(p, { ts: new Date(f[0]).getTime(), opp: f[1], home: f[2] === 1, comp: f[3], cup: CUPS.includes(f[3]) }, line, 'over', 'totali');
    const voto = rr ? Math.max(0, Math.min(10, rr.voto)) : 0;
    if (voto < MIN_VOTE) return;
    const opp = teamByName(f[1]);
    const own = teamById(p.teamId);
    out.push({
      player: p,
      voto,
      mediaAttesa: t.lam,
      minutiMedi: t.mn,
      ultime5: t.l5,
      stagione90: t.sea,
      match: { ts: new Date(f[0]).getTime(), homeId: f[2] === 1 ? own?.id : opp?.id, awayId: f[2] === 1 ? opp?.id : own?.id, oppName: f[1], home: f[2] === 1, comp: f[3] },
    });
  });
  out.sort((a, b) => b.voto - a.voto || b.mediaAttesa - a.mediaAttesa);
  return (CACHE[ck] = out.slice(0, MAX_PER_DAY));
}

export { domesticKey };

// Affidabilità di un giocatore in una partita (tiri totali, soglia over): stesso calcolo del Calcolatore.
export function playerReliability(p, dateIso, line = 0.5, keepInjured = false) {
  if (!p) return null;
  if (!keepInjured && isOutOn(p.id, dateIso)) return null;
  const list = ((RAW.giocatori && RAW.giocatori.fix) || {})[p.teamName] || [];
  const f = list.find((x) => romeDay(new Date(x[0]).getTime()) === dateIso);
  if (!f) return null;
  const opp = teamByName(f[1]);
  const r = calcReliability(p, { ts: new Date(f[0]).getTime(), opp: f[1], home: f[2] === 1, comp: f[3], cup: CUPS.includes(f[3]) }, line, 'over', 'totali');
  if (!r) return null;
  const t = lambdaOf(p, f, 0);
  return { voto: Math.max(0, Math.min(10, r.voto)), lam: r.lam, minuti: t ? t.mn : null, opp };
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
