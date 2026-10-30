// Dati del Calcolatore di Affidabilità: medie tiri per squadra e per campionato (data.json),
// con le stesse regole dell'app originale (handicap dei campionati minori, coppe = media
// tra campionato e coppa) e riquadri casa / trasferta da squadre.json.
import { RAW } from './load';
import { comma } from '@/lib/format';
import { teamById } from './teams';
import { romeDay } from './util';

// Campionati disponibili nel calcolatore, nell'ordine in cui compaiono nei menu.
// Campionati aggiunti (dall'archivio FotMob, calc_extra.py): hanno Affidabilita' in partita, Migliori giocatori e Calcolatore come i top 5
export const EXTRA_KEYS = ['eredivisie', 'pro-league', 'fm-46', 'gre-super-league-1', 'liga-portugal', 'super-lig'];
export const CALC_KEYS = ['serie-a', 'premier-league', 'bundesliga', 'la-liga', 'ligue-1', ...EXTRA_KEYS, 'champions-league', 'europa-league'];
export const CUPS = ['champions-league', 'europa-league'];
export const DOMESTIC_KEYS = CALC_KEYS.filter((k) => !CUPS.includes(k));
const LABELS = { 'serie-a': 'Serie A', 'premier-league': 'Premier League', bundesliga: 'Bundesliga', 'la-liga': 'LaLiga', 'ligue-1': 'Ligue 1', 'champions-league': 'Champions League', 'europa-league': 'Europa League', eredivisie: 'Eredivisie', 'pro-league': 'Pro League', 'fm-46': 'Superliga Danimarca', 'gre-super-league-1': 'Super League Grecia', 'liga-portugal': 'Primeira Liga', 'super-lig': 'Süper Lig' };

const LD = {};
export const calcLeagues = () => CALC_KEYS.filter((k) => LD[k]).map((k) => ({ id: k, name: LABELS[k] || LD[k].label, cup: CUPS.includes(k) }));
export const leagueName = (leagueId) => (LD[leagueId] ? LABELS[leagueId] || LD[leagueId].label : LABELS[leagueId] || '');
export const calcTeamsOf = (leagueId) => (LD[leagueId] ? Object.keys(LD[leagueId].teams) : []);

export function buildCalcData() {
  Object.keys(LD).forEach((k) => delete LD[k]);
  const L = (RAW.data && RAW.data.leagues) || {};
  Object.entries(L).forEach(([k, src]) => {
    // le medie restano quelle vere (stesse del pannello statistiche squadra): l'handicap dei campionati minori vale SOLO nelle coppe europee
    // (squadre di campionati diversi, peso diverso) e si applica in blend(); scegliendo il campionato non c'e' mai
    const h = src.handicap || null;
    const teams = {};
    Object.entries(src.teams || {}).forEach(([n, t]) => {
      teams[n] = { totalFor: t.totalFor, totalAgainst: t.totalAgainst, sotFor: t.sotFor, sotAgainst: t.sotAgainst };
    });
    LD[k] = { label: src.label || src.name || k, teams, avg: h ? src.league_avg : null, strength: 1, hcap: h, cup: CUPS.includes(k) };
  });
}

const lgAvg = (k, field) => {
  const L = LD[k];
  if (!L) return null;
  if (L.avg) return L.avg[field];
  const v = Object.values(L.teams).map((t) => t[field]);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};
const adj = (v, avg, s) => (s < 1 && avg > 0 ? avg + (v - avg) * s : v);

// campionato nazionale della squadra (tra quelli del menu, esclusa la coppa)
const domesticKey = (name) => CALC_KEYS.find((k) => !CUPS.includes(k) && LD[k] && LD[k].teams[name]) || null;

// valore squadra per un campo: in coppa è la media tra campionato (corretto per la forza del
// campionato) e coppa, come nell'app originale.
function blend(key, name, field) {
  const L = LD[key];
  if (!L || !L.teams[name]) return null;
  const t = L.teams[name];
  const avg = lgAvg(key, field);
  if (!L.cup) return { v: t[field], avg, str: L.strength || 1, cup: false };
  const dk = domesticKey(name);
  if (!dk) return { v: t[field], avg, str: 1, cup: true, domKey: null, cupVal: t[field] };
  const hc = LD[dk].hcap;
  const dv0 = LD[dk].teams[name][field];
  // handicap in coppa: campionato minore = tiri fatti ridotti, subiti aumentati (stessa regola di prima, ora solo qui)
  const dv = hc ? (/Against$/.test(field) ? dv0 / hc : dv0 * hc) : dv0;
  const da = lgAvg(dk, field);
  const domAdj = adj(dv, da, LD[dk].strength || 1);
  return { v: (domAdj + t[field]) / 2, avg: (da + avg) / 2, str: 1, cup: true, domKey: dk, domVal: dv, cupVal: t[field] };
}

const dec = (v) => Math.round(v * 100) / 100;

const ranks = (key, field) => {
  const entries = Object.entries(LD[key].teams).map(([name, t]) => ({ name, val: t[field] }));
  entries.sort((a, b) => b.val - a.val);
  const out = {};
  let rank = 0;
  let prev = null;
  entries.forEach((e, i) => {
    if (e.val !== prev) {
      rank = i + 1;
      prev = e.val;
    }
    out[e.name] = rank;
  });
  return out;
};

// split casa / trasferta dalla pagina squadre (squadre.json): [[totale,partite],[casa],[trasferta]]
const split = (team, leagueKey, field, side) => {
  const e = RAW.squadre && RAW.squadre.lg && RAW.squadre.lg[leagueKey] && RAW.squadre.lg[leagueKey][team] && RAW.squadre.lg[leagueKey][team][field];
  if (!e || !e[side]) return null;
  return { casa: e[side][1] ? e[side][1][0] : null, trasferta: e[side][2] ? e[side][2][0] : null };
};

// Statistiche di una squadra per il calcolo, nel campionato scelto.
export function teamShots(teamId, leagueId) {
  const team = teamById(teamId);
  if (!team || !leagueId || !LD[leagueId]) return null;
  const name = team.name;
  const fTot = blend(leagueId, name, 'totalFor');
  if (!fTot) return null;
  const fSot = blend(leagueId, name, 'sotFor');
  const aTot = blend(leagueId, name, 'totalAgainst');
  const aSot = blend(leagueId, name, 'sotAgainst');
  const dom = domesticKey(name);
  const own = LD[leagueId].cup ? dom : leagueId;
  const sTot = own ? split(name, own, 'sh', 0) : null;
  const sSot = own ? split(name, own, 'st', 0) : null;
  const aSplitTot = own ? split(name, own, 'sh', 1) : null;
  const aSplitSot = own ? split(name, own, 'st', 1) : null;
  const cup = LD[leagueId].cup;
  const size = Object.keys(LD[leagueId].teams).length;

  return {
    leagueId,
    cup,
    strength: fTot.str,
    size,
    for: { totali: fTot.v, inPorta: fSot.v, casa: { totali: sTot && sTot.casa, inPorta: sSot && sSot.casa }, trasferta: { totali: sTot && sTot.trasferta, inPorta: sSot && sSot.trasferta } },
    against: { totali: aTot.v, inPorta: aSot.v, casa: { totali: aSplitTot && aSplitTot.casa, inPorta: aSplitSot && aSplitSot.casa }, trasferta: { totali: aSplitTot && aSplitTot.trasferta, inPorta: aSplitSot && aSplitSot.trasferta } },
    avg: { for: { totali: fTot.avg, inPorta: fSot.avg }, against: { totali: aTot.avg, inPorta: aSot.avg } },
    rankFor: cup ? null : ranks(leagueId, 'totalFor')[name],
    rankAgainst: cup ? null : ranks(leagueId, 'totalAgainst')[name],
    rankSotFor: cup ? null : ranks(leagueId, 'sotFor')[name],
    rankSotAgainst: cup ? null : ranks(leagueId, 'sotAgainst')[name],
    breakdown: cup ? { for: fTot, against: aTot } : null,
    raw: { for: LD[leagueId].teams[name], against: LD[leagueId].teams[name] },
  };
}

export const rankNote = (stats, mode) => {
  if (!stats) return '';
  if (stats.cup) {
    const b = stats.breakdown[mode];
    if (!b.domKey) return `Campionato non presente nel database: uso la sola media di coppa (${comma(b.cupVal, 2)})`;
    return `Media tra campionato (${comma(b.domVal, 2)}) e coppa (${comma(b.cupVal, 2)})`;
  }
  const rank = mode === 'against' ? stats.rankAgainst : stats.rankFor;
  const metric = mode === 'against' ? 'tiri subiti' : 'tiri fatti';
  return `${rank}° su ${stats.size} in ${leagueName(stats.leagueId)} per ${metric} a partita`;
};

export const prefillShots = (stats, mode) =>
  stats ? { totali: comma(dec(stats[mode].totali), 2), inPorta: comma(dec(stats[mode].inPorta), 2) } : { totali: '', inPorta: '' };

export const splitBoxes = (stats, mode, family) => {
  if (!stats) return [];
  const s = stats[mode];
  const out = [];
  if (s.casa[family] !== null && s.casa[family] !== undefined) out.push({ label: 'Casa', value: comma(s.casa[family], 1) });
  if (s.trasferta[family] !== null && s.trasferta[family] !== undefined) out.push({ label: 'Trasferta', value: comma(s.trasferta[family], 1) });
  return out;
};

// valore corretto per la forza del campionato (campionati minori pesano meno)
export const adjustedValue = (value, avg, strength) => (value > 0 && strength < 1 && avg > 0 ? adj(value, avg, strength) : value);

// campionato in cui cercare una squadra (prima quello indicato, poi i nazionali, poi le coppe)
export function pickLeagueKey(name, prefer) {
  const order = [];
  if (prefer) order.push(prefer);
  CALC_KEYS.forEach((k) => {
    if (!order.includes(k) && !CUPS.includes(k)) order.push(k);
  });
  CALC_KEYS.forEach((k) => {
    if (!order.includes(k)) order.push(k);
  });
  return order.find((k) => LD[k] && LD[k].teams[name]) || null;
}

// prossima partita di una squadra (da giocatori.json → fix): [data ISO, avversario, 1 se in casa, competizione]
export function nextFixture(teamName) {
  const list = (RAW.giocatori && RAW.giocatori.fix && RAW.giocatori.fix[teamName]) || [];
  const today = romeDay(Date.now());
  const f = list.find((x) => romeDay(new Date(x[0]).getTime()) >= today);
  if (!f) return null;
  return { ts: new Date(f[0]).getTime(), opp: f[1], home: f[2] === 1, comp: f[3], cup: CUPS.includes(f[3]) };
}

// partita di una squadra a un certo istante (per aprire il Calcolatore dalla lista dei migliori giocatori)
export function fixtureAt(teamName, ts) {
  const list = (RAW.giocatori && RAW.giocatori.fix && RAW.giocatori.fix[teamName]) || [];
  const f = list.find((x) => new Date(x[0]).getTime() === ts);
  if (!f) return null;
  return { ts: new Date(f[0]).getTime(), opp: f[1], home: f[2] === 1, comp: f[3], cup: CUPS.includes(f[3]) };
}

// per le liste di giocatori (stessa logica dell'app originale)
export { lgAvg as leagueAvgOf, domesticKey, blend as blendTeam, LD as CALC_DATA };
