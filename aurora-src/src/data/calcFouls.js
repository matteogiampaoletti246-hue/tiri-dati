// Falli nel Calcolatore: medie di squadra e di giocatore dalle partite della stagione in corso (partite/<fm>/<stagione>.json.gz).
// Squadra: `s.fouls` = [casa, ospite]. Giocatore: `p[id].fouls` (commessi) e `p[id].was_fouled` (subiti), con `minutes_played`.
// Cache a capienza fissa (lib/lru.js).
import { useEffect, useState } from 'react';
import { FM_ID, currentSeason, loadSeason, loadSeasonMatches, teamIdByName } from './archive';
import { CUPS, NATIONS_KEYS, domesticKey } from './calcData';
import { lruGet, lruSet } from '@/lib/lru';
import { comma } from '@/lib/format';

const LG = new Map();
// Duello avversario sulle stesse partite della tabella "Ruoli avversari" (regola dell'utente, 12/11/2026): con una competizione di club tutte le competizioni
// di club della stagione in corso (campionato, coppe europee, coppe nazionali); con la nazionale stagione in corso e scorsa di tutte le competizioni
// delle nazionali (Nations League A-D, qualificazioni europee ai Mondiali, Mondiali), mai amichevoli. `chiave@stagione` = stagione precedente.
export const CLUB_EXTRA_KEYS = ['coppa-italia', 'dfb-pokal', 'coupe-de-france', 'efl-cup', 'fm-132', 'fm-138', 'eredivisie', 'liga-portugal'];
export const NATION_ALL_KEYS = ['fm-9806', 'fm-9807', 'fm-9808', 'fm-9809', 'fm-77', 'fm-10195', 'fm-9806@2024-2025', 'fm-9807@2024-2025', 'fm-9808@2024-2025', 'fm-9809@2024-2025'];
const baseKey = (k) => String(k).split('@')[0];
export const fmOfKey = (k) => FM_ID[baseKey(k)] || Number((/^fm-(\d+)$/.exec(baseKey(k)) || [])[1]) || 0;
const isNationKey = (k) => NATION_ALL_KEYS.includes(k);
// giocatori di una squadra uniti tra le competizioni del gruppo (nazionali o club) presenti nei dati
// memorizzato per dati/competizione/squadra: ogni giocatore delle formazioni lo rifaceva da capo (e i risultati si leggono soltanto)
const GP_MEMO = new WeakMap();
function groupPlayers(data, key, fmTeam) {
  if (!data || typeof data !== 'object') return groupPlayers0(data, key, fmTeam);
  let m = GP_MEMO.get(data);
  if (!m) { m = new Map(); GP_MEMO.set(data, m); }
  const mk = `${key}|${fmTeam == null ? '' : fmTeam}`;
  if (!m.has(mk)) m.set(mk, groupPlayers0(data, key, fmTeam));
  return m.get(mk);
}
function groupPlayers0(data, key, fmTeam) {
  const keys = Object.keys(data || {}).filter((k) => (NATIONS_KEYS.includes(key) ? isNationKey(k) : !isNationKey(k)));
  if (!keys.includes(key) && data && data[key]) keys.push(key);
  const out = new Map();
  keys.forEach((k) => Object.values(data[k].players).forEach((p) => {
    if (fmTeam && String(p.team) !== String(fmTeam)) return;
    const e = out.get(p.id) || { id: p.id, n: p.n, gk: p.gk, g: [] };
    e.g.push(...p.g);
    e.gk = e.gk && p.gk;
    out.set(p.id, e);
  }));
  return [...out.values()];
}
const mean = (a, f) => (a.length ? a.reduce((s, x) => s + f(x), 0) / a.length : null);

async function build(key) {
  const fm = fmOfKey(key);
  const sk = fm ? (String(key).split('@')[1] || (await currentSeason(fm))) : null;
  if (!sk) return null;
  const [d, season] = await Promise.all([loadSeasonMatches(fm, sk), loadSeason(fm, sk).catch(() => null)]);
  if (!d || !d.m) return null;
  const when = {};
  const fxTeams = {};
  ((season && season.fix) || []).forEach((r) => { when[String(r[0])] = Date.parse(r[4]) || 0; fxTeams[String(r[0])] = [r[2], r[3]]; });
  const teams = {};
  const players = {};
  Object.entries(d.m).forEach(([mid, m]) => {
    if (!m) return;
    const ts = when[mid] || 0;
    const f = m.s && m.s.fouls;
    // partite arrivate solo da PitchAPI (KV) non hanno `h`/`a`: le squadre si leggono dal calendario
    const hid = (m.h && m.h.id) || (fxTeams[mid] && fxTeams[mid][0]);
    const aid = (m.a && m.a.id) || (fxTeams[mid] && fxTeams[mid][1]);
    if (Array.isArray(f) && hid && aid && Number.isFinite(Number(f[0])) && Number.isFinite(Number(f[1]))) {
      (teams[hid] = teams[hid] || []).push({ ts, home: true, fc: Number(f[0]), fs: Number(f[1]) });
      (teams[aid] = teams[aid] || []).push({ ts, home: false, fc: Number(f[1]), fs: Number(f[0]) });
    }
    const side = {};
    [[m.h, 'h'], [m.a, 'a']].forEach(([s, k]) => {
      if (!s || !s.id) return;
      Object.values(s).forEach((list) => { if (Array.isArray(list)) list.forEach((r) => { if (Array.isArray(r) && r[0] != null) side[String(r[0])] = [k, String(s.id), r[1] || '', r[3]]; }); });
    });
    // partite PitchAPI senza formazioni FotMob: nome, lato e squadra dei giocatori in `pn` (id -> [nome, lato, squadra]); senza questo le partite spariscono dalle medie
    Object.entries(m.pn || {}).forEach(([pid, r]) => { if (!side[pid] && Array.isArray(r)) side[pid] = [r[1], String(r[2]), r[0] || '', undefined]; });
    Object.entries(m.p || {}).forEach(([pid, v]) => {
      const min = Number(v.minutes_played) || 0;
      const w = side[pid];
      if (!min || !w) return;
      const e = (players[pid] = players[pid] || { id: pid, n: w[2], team: w[1], g: [], gk: true });
      e.team = w[1];
      // portiere: ruolo 11 delle formazioni; senza formazioni, chi ha parate nelle statistiche della partita
      if (w[3] === undefined ? !Object.keys(v).some((k) => /save/i.test(k)) : w[3] !== 11) e.gk = false;
      e.g.push({ ts, min, fc: Number(v.fouls) || 0, fs: Number(v.was_fouled) || 0, home: w[0] === 'h' });
    });
  });
  return { key, fm, sk, teams, players, names: (season && season.teams) || {} };
}

export const loadFouls = (key) => {
  if (!key || !fmOfKey(key)) return Promise.resolve(null);
  const hit = lruGet(LG, key);
  if (hit) return hit;
  const p = build(key).catch(() => null);
  lruSet(LG, key, p, 40); // Migliori Giocatori (falli) legge tutti i campionati del giorno insieme
  return p;
};

// archivi da leggere per una giocata: campionato nazionale della squadra del giocatore, della squadra avversaria e le coppe europee
export const foulKeys = (names, leagueIds) => {
  const out = new Set();
  names.forEach((n) => { const k = n && domesticKey(n); if (k) out.add(k); });
  (leagueIds || []).forEach((k) => { if (k && fmOfKey(k)) out.add(k); });
  CUPS.forEach((k) => out.add(k));
  // duello: con la nazionale tutte le partite delle nazionali, con un club tutte le competizioni di club
  (leagueIds || []).some((k) => NATIONS_KEYS.includes(k)) ? NATION_ALL_KEYS.forEach((k) => out.add(k)) : CLUB_EXTRA_KEYS.forEach((k) => out.add(k));
  return [...out].filter((k) => fmOfKey(k));
};

export function useFouls(keys) {
  const sig = keys.join('|');
  const [data, setData] = useState(null);
  useEffect(() => {
    let live = true;
    Promise.all(keys.map(loadFouls)).then((arr) => {
      if (!live) return;
      const o = {};
      arr.forEach((x, i) => { if (x) o[keys[i]] = x; });
      setData({ sig, o });
    });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);
  // solo i dati degli archivi chiesti ora: cambiando giocatore/squadre non si calcola con quelli di prima (medie vuote)
  return data && data.sig === sig ? data.o : null;
}

// media a partita di una squadra in un archivio: 'fc' falli commessi, 'fs' falli subiti
const teamAvgIn = (L, fmTeam, stat) => {
  const g = L && L.teams[fmTeam];
  if (!g || !g.length) return null;
  return {
    v: mean(g, (x) => x[stat]),
    casa: mean(g.filter((x) => x.home), (x) => x[stat]),
    trasferta: mean(g.filter((x) => !x.home), (x) => x[stat]),
    n: g.length,
  };
};
const leagueAvgIn = (L, stat) => {
  const a = Object.values((L && L.teams) || {}).map((g) => mean(g, (x) => x[stat])).filter((v) => v !== null);
  return a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;
};
const rankIn = (L, fmTeam, stat) => {
  const rows = Object.entries((L && L.teams) || {}).map(([id, g]) => [id, mean(g, (x) => x[stat])]).filter((r) => r[1] !== null);
  const mine = rows.find((r) => String(r[0]) === String(fmTeam));
  if (!mine) return null;
  return { r: 1 + rows.filter((r) => r[1] > mine[1]).length, size: rows.length };
};

// Squadra per il calcolo: `leagueId` e' il campionato scelto nel blocco (in coppa europea: media tra campionato nazionale e coppa, senza handicap).
export function teamFoulStats(data, fmTeam, leagueId, name, stat) {
  if (!data || !fmTeam || !leagueId) return null;
  const cup = CUPS.includes(leagueId);
  const dk = cup ? domesticKey(name) : leagueId;
  const parts = [dk, cup ? leagueId : null].filter(Boolean).map((k) => ({ k, a: teamAvgIn(data[k], fmTeam, stat), avg: leagueAvgIn(data[k], stat) })).filter((x) => x.a && x.a.v !== null && x.avg !== null);
  if (!parts.length) return null;
  const v = mean(parts, (x) => x.a.v);
  const avg = mean(parts, (x) => x.avg);
  const own = parts.find((x) => x.k === dk) || parts[0];
  const rk = cup ? null : rankIn(data[leagueId], fmTeam, stat);
  return { v, avg, casa: own.a.casa, trasferta: own.a.trasferta, rank: rk, cup, mix: parts.length > 1 ? parts.map((x) => ({ k: x.k, v: x.a.v })) : null };
}

// media a 90' del campionato per giocatori di movimento con almeno 450' (serve a pesare i duelli)
const LA_MEMO = new WeakMap();
export function leaguePlayerAvg(data, key, stat) {
  const L = data && data[key];
  if (!L) return null;
  let m = LA_MEMO.get(data);
  if (!m) { m = new Map(); LA_MEMO.set(data, m); }
  const mk = `${key}|${stat}`;
  if (!m.has(mk)) m.set(mk, leaguePlayerAvg0(data, key, stat, L));
  return m.get(mk);
}
function leaguePlayerAvg0(data, key, stat, L) {
  let s = 0;
  let m = 0;
  (NATIONS_KEYS.includes(key) ? groupPlayers(data, key) : Object.values(L.players)).forEach((p) => {
    const min = p.g.reduce((a, x) => a + x.min, 0);
    if (min < 450 || p.gk) return;
    s += p.g.reduce((a, x) => a + x[stat], 0);
    m += min;
  });
  return m > 0 ? (s / m) * 90 : null;
}

// rosa di una squadra con la media a 90' della statistica: tutti tranne i portieri (anche con pochi minuti, per inserirli a mano
// dopo le formazioni ufficiali); `ok` = almeno DUEL_MIN_MIN minuti, gli unici che il duello automatico puo' scegliere
export const DUEL_MIN_MIN = 180;
const RF_MEMO = new WeakMap();
export function rosterFouls(data, key, fmTeam, stat) {
  const L = data && data[key];
  if (!L || !fmTeam) return [];
  let m = RF_MEMO.get(data);
  if (!m) { m = new Map(); RF_MEMO.set(data, m); }
  const mk = `${key}|${fmTeam}|${stat}`;
  if (!m.has(mk)) m.set(mk, rosterFouls0(data, key, fmTeam, stat));
  return m.get(mk);
}
function rosterFouls0(data, key, fmTeam, stat) {
  return groupPlayers(data, key, fmTeam)
    .filter((p) => !p.gk)
    .map((p) => {
      const min = p.g.reduce((a, x) => a + x.min, 0);
      const tot = p.g.reduce((a, x) => a + x[stat], 0);
      return { id: p.id, name: p.n, min, n: p.g.length, avg90: min > 0 ? (tot / min) * 90 : 0, ok: min >= DUEL_MIN_MIN };
    })
    .filter((p) => p.min > 0)
    .sort((a, b) => b.min - a.min);
}

// giocatore: medie stagionali (campionato e coppa europea) e partite per l'Hit Rate in tutte le competizioni (regola fissa: almeno 50',
// dalla piu' recente). `hit` = righe dell'Hit Rate del giocatore (profili.py: stagione in corso poi passata, con i falli di ogni partita):
// se tutte hanno i falli si usano quelle, altrimenti le partite della stagione in corso con almeno 50'
export function playerFouls(data, fmPid, domKey, stat, hit = null, natKey = null) {
  if (!data || !fmPid) return null;
  const pid = String(fmPid);
  const camp = domKey && data[domKey] && data[domKey].players[pid];
  const naz = natKey && data[natKey] && data[natKey].players[pid];
  const cups = CUPS.map((k) => data[k] && data[k].players[pid]).filter(Boolean);
  const sum = (list) => {
    const g = list.flatMap((p) => p.g);
    if (!g.length) return null;
    return { v: g.reduce((a, x) => a + x[stat], 0) / g.length, min: g.reduce((a, x) => a + x.min, 0) / g.length, n: g.length };
  };
  // nazionale: media della Nations League e partite con almeno 50' di questa stagione (Hit Rate con la nazionale), dalla piu' recente
  const natG = naz ? naz.g.filter((x) => x.min >= 50).sort((a, b) => b.ts - a.ts) : [];
  const res = { campionato: camp ? sum([camp]) : null, coppa: cups.length ? sum(cups) : null, nations: naz ? sum([naz]) : null, natVals: natG.map((x) => x[stat]) };
  const ki = stat === 'fs' ? 4 : 3;
  if (hit && hit.length && hit.every((x) => x[ki] !== null && x[ki] !== undefined)) return { ...res, last5: hit.map((x) => x[ki]), min5: hit.map((x) => x[2]) };
  // senza profilo di club (solo nazionale) valgono le partite con la nazionale
  const all = (camp || cups.length ? [camp, ...cups] : [naz]).filter(Boolean).flatMap((p) => p.g).filter((x) => x.min >= 50).sort((a, b) => b.ts - a.ts);
  const last5 = all.slice(0, 5);
  return { ...res, last5: last5.map((x) => x[stat]), min5: last5.map((x) => x.min) };
}

// Profili di un giocatore: quello di club e quello della nazionale (Nations League), qualunque dei due sia scelto nel Calcolatore.
export const foulProfiles = (p) => ({ club: p && p.nat ? p.club || null : p || null, nat: p && p.nat ? p : (p && p.natView) || null });
const natKeyOf = (nat) => (nat && NATIONS_KEYS.includes(nat.leagueId) ? nat.leagueId : null);
// archivi da leggere: oltre a quelli delle due squadre, sempre il campionato del club e la Nations League della nazionale del giocatore
export const foulKeysFor = (p, names, leagueIds) => {
  const { club, nat } = foulProfiles(p);
  return foulKeys([...names, club && club.teamName], [...(leagueIds || []), natKeyOf(nat)]);
};
// Falli del giocatore, uguali ovunque (Calcolatore, Migliori Giocatori, scheda giocatore): campionato = quello del CLUB (mai la nazionale:
// prima, con Nations League scelta, le medie della nazionale finivano nella riga del campionato e la riga Nations League restava vuota),
// coppa europea, Nations League dalla nazionale; Hit Rate dalle partite di club (`hitOf` = hitRows di calcPlayer).
export function playerFoulsOf(data, fmPid, p, stat, hitOf) {
  const { club, nat } = foulProfiles(p);
  const domKey = club ? domesticKey(club.teamName) : null;
  const hit = club && club.hn != null && hitOf ? hitOf(club) : null;
  return playerFouls(data, fmPid, domKey, stat, hit, natKeyOf(nat));
}
// medie stagione dei falli per il modulo del Calcolatore
export function foulSeasonOf(pf, cupOk = true) {
  const season = { campionato: { tiri: '', minuti: '' }, coppa: { tiri: '', minuti: '' }, nations: { tiri: '', minuti: '' }, qualificazioni: { tiri: '', minuti: '' } };
  ['campionato', 'coppa', 'nations'].forEach((k) => {
    if (k === 'coppa' && !cupOk) return;
    if (pf && pf[k]) season[k] = { tiri: comma(Math.round(pf[k].v * 100) / 100, 2), minuti: String(Math.round(pf[k].min)) };
  });
  return season;
}

// id FotMob di una squadra dell'app: prima quello noto o dello stemma, poi il nome tra le squadre degli archivi caricati (lo stemma dei top campionati non sempre ha l'id)
export function fmTeamIn(data, t) {
  if (!t) return '';
  const direct = t.fmId || (/teamlogo\/(\d+)\.png/.exec(String(t.crest || '')) || [])[1];
  if (direct) return String(direct);
  for (const L of Object.values(data || {})) {
    const id = L && L.names ? teamIdByName(L.names, t.name) : null;
    if (id) return String(id);
  }
  return '';
}
