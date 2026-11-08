// Falli nel Calcolatore: medie di squadra e di giocatore dalle partite della stagione in corso (partite/<fm>/<stagione>.json.gz).
// Squadra: `s.fouls` = [casa, ospite]. Giocatore: `p[id].fouls` (commessi) e `p[id].was_fouled` (subiti), con `minutes_played`.
// Cache a capienza fissa (lib/lru.js).
import { useEffect, useState } from 'react';
import { FM_ID, currentSeason, loadSeason, loadSeasonMatches, teamIdByName } from './archive';
import { CUPS, domesticKey } from './calcData';
import { lruGet, lruSet } from '@/lib/lru';

const LG = new Map();
const mean = (a, f) => (a.length ? a.reduce((s, x) => s + f(x), 0) / a.length : null);

async function build(key) {
  const fm = FM_ID[key];
  const sk = fm ? await currentSeason(fm) : null;
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
  if (!key || !FM_ID[key]) return Promise.resolve(null);
  const hit = lruGet(LG, key);
  if (hit) return hit;
  const p = build(key).catch(() => null);
  lruSet(LG, key, p, 16); // Migliori Giocatori (falli) legge tutti i campionati del giorno insieme
  return p;
};

// archivi da leggere per una giocata: campionato nazionale della squadra del giocatore, della squadra avversaria e le coppe europee
export const foulKeys = (names, leagueIds) => {
  const out = new Set();
  names.forEach((n) => { const k = n && domesticKey(n); if (k) out.add(k); });
  (leagueIds || []).forEach((k) => { if (k && FM_ID[k]) out.add(k); });
  CUPS.forEach((k) => out.add(k));
  return [...out].filter((k) => FM_ID[k]);
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
export function leaguePlayerAvg(data, key, stat) {
  const L = data && data[key];
  if (!L) return null;
  let s = 0;
  let m = 0;
  Object.values(L.players).forEach((p) => {
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
export function rosterFouls(data, key, fmTeam, stat) {
  const L = data && data[key];
  if (!L || !fmTeam) return [];
  return Object.values(L.players)
    .filter((p) => String(p.team) === String(fmTeam) && !p.gk)
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
export function playerFouls(data, fmPid, domKey, stat, hit = null) {
  if (!data || !fmPid) return null;
  const pid = String(fmPid);
  const camp = domKey && data[domKey] && data[domKey].players[pid];
  const cups = CUPS.map((k) => data[k] && data[k].players[pid]).filter(Boolean);
  const sum = (list) => {
    const g = list.flatMap((p) => p.g);
    if (!g.length) return null;
    return { v: g.reduce((a, x) => a + x[stat], 0) / g.length, min: g.reduce((a, x) => a + x.min, 0) / g.length, n: g.length };
  };
  const res = { campionato: camp ? sum([camp]) : null, coppa: cups.length ? sum(cups) : null };
  const ki = stat === 'fs' ? 4 : 3;
  if (hit && hit.length && hit.every((x) => x[ki] !== null && x[ki] !== undefined)) return { ...res, last5: hit.map((x) => x[ki]), min5: hit.map((x) => x[2]) };
  const all = [camp, ...cups].filter(Boolean).flatMap((p) => p.g).filter((x) => x.min >= 50).sort((a, b) => b.ts - a.ts);
  const last5 = all.slice(0, 5);
  return { ...res, last5: last5.map((x) => x[stat]), min5: last5.map((x) => x.min) };
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
