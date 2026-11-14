// Ruoli degli avversari nei falli (Calcolatore, Migliori Giocatori, scheda giocatore).
// Dati: `falli/<campionato>/<stagione>.json.gz` (falli_coppie.py): per partita `p` = coppie [chi commette, chi subisce] e `r` = ruolo e lato di ogni giocatore.
// Ruolo con la % piu' alta (e il secondo se dista al massimo 5 punti) -> duello avversario automatico: i 2 avversari con la media piu' alta in quei ruoli.
import { useEffect, useState } from 'react';
import { currentSeason, loadFalliFile } from './archive';
import { CLUB_EXTRA_KEYS, NATION_ALL_KEYS, fmOfKey, leaguePlayerAvg, rosterFouls } from './calcFouls';
import { lruGet, lruSet } from '@/lib/lru';

const FL = new Map();
export const GAP = 5; // punti percentuali: entro questa distanza anche il secondo ruolo conta
export const DUEL_N = 2;
// competizioni con le coppie di falli: top 5 campionati, coppe europee e coppe nazionali dei top 5
export const NATION_FALLI_KEYS = ['fm-9806', 'fm-9807', 'fm-9808', 'fm-9809'];
export const CLUB_FALLI_KEYS = ['serie-a', 'premier-league', 'la-liga', 'bundesliga', 'ligue-1', 'champions-league', 'europa-league', 'conference-league', 'coppa-italia', 'dfb-pokal', 'coupe-de-france', 'efl-cup'];
// Tabella "Ruoli avversari" e duello (regola dell'utente, 12/11/2026): con una competizione di club contano TUTTE le competizioni di club della stagione
// (campionato, coppa europea, coppe nazionali...), con le nazionali TUTTE le partite con la nazionale; mai amichevoli (non sono tra le chiavi).
// Dove ESPN non ha i falli (`falli_coppie.py`) la competizione non ha dati e non pesa.
export const CLUB_ROLE_KEYS = [...new Set([...CLUB_FALLI_KEYS, ...CLUB_EXTRA_KEYS])];
export const NATION_ROLE_KEYS = NATION_ALL_KEYS; // Nations League, qualificazioni e Mondiali: stagione in corso e scorsa (`chiave@stagione`)
// Ruolo della scheda giocatore (stessa fonte del riquadro "Ruolo": posizione dell'app, poi posizione FotMob, poi rosa), con le sigle dei falli.
// Si usa solo per chi non ha il ruolo nei dati dei falli (es. portieri, campionati senza coppie di falli).
const PS_SIGLA = { GK: 'POR', CB: 'DC', LB: 'TS', RB: 'TD', LWB: 'ES', RWB: 'ED', DM: 'CC', CDM: 'CC', CM: 'CC', AM: 'CO', CAM: 'CO', LM: 'ES', RM: 'ED', LW: 'AS', RW: 'AD', ST: 'ATT', CF: 'ATT' };
const PS_GEN = { GK: 'GK', CB: 'DEF', LB: 'DEF', RB: 'DEF', LWB: 'DEF', RWB: 'DEF', DM: 'MID', CDM: 'MID', CM: 'MID', AM: 'MID', CAM: 'MID', LM: 'MID', RM: 'MID', LW: 'WNG', RW: 'WNG', ST: 'ATT', CF: 'ATT' };
const GEN_SIGLA = { GK: 'POR', DEF: 'DIF', MID: 'CC', WNG: 'ALA', ATT: 'ATT' };
export function cardRole(position, ps, rosterPos) {
  const gen = position || PS_GEN[ps] || rosterPos || null;
  if (ps && PS_SIGLA[ps] && (!position || PS_GEN[ps] === position || (position === 'ATT' && PS_GEN[ps] === 'WNG'))) return PS_SIGLA[ps];
  return GEN_SIGLA[gen] || null;
}
export const FALLI_KEYS = [...CLUB_FALLI_KEYS, ...NATION_FALLI_KEYS]; // competizioni per Migliori Giocatori (FOUL_COMPS)
export const ROLE_KEYS = [...CLUB_ROLE_KEYS, ...NATION_ROLE_KEYS]; // archivi da caricare per ruoli e duello
// ruoli e duello: con le nazionali (Nations League) solo le loro partite, con i club solo le partite di club (un giocatore puo' avere un ruolo diverso)
export const falliKeysFor = (nation) => (nation ? NATION_ROLE_KEYS : CLUB_ROLE_KEYS);

export const loadFalli = (key) => {
  const fm = fmOfKey(key);
  if (!key || !fm) return Promise.resolve(null);
  const hit = lruGet(FL, key);
  if (hit) return hit;
  const p = (async () => {
    const sk = String(key).split('@')[1] || (await currentSeason(fm));
    const d = sk ? await loadFalliFile(fm, sk) : null;
    return d ? { key, m: d } : null;
  })().catch(() => null);
  lruSet(FL, key, p, 16);
  return p;
};

export function useFalli(keys) {
  const sig = keys.join('|');
  const [data, setData] = useState(null);
  useEffect(() => {
    let live = true;
    Promise.all(keys.map(loadFalli)).then((arr) => {
      if (!live) return;
      const o = {};
      arr.forEach((x, i) => { if (x) o[keys[i]] = x; });
      setData(Object.keys(o).length ? o : null);
    });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);
  return data;
}

// Ripartizione per ruolo avversario dei falli di un giocatore. stat 'fs' = falli subiti (ruoli di chi gli ha fatto fallo),
// 'fc' = falli commessi (ruoli di chi li ha subiti da lui). `pct` = quota sui falli del giocatore, `rolePct` = quota sui falli totali di quel ruolo nelle sue partite.
// Partite dei giocatori delle formazioni, lette una sola volta per archivio (`indexRoles`): prima ogni giocatore rileggeva TUTTE le partite degli archivi
// (decine di ms ciascuno). Si indicizzano solo i giocatori richiesti (la memoria resta quella di prima); gli altri si leggono come sempre.
const PM_MEMO = new WeakMap();
export function indexRoles(fl, keys, pids) {
  if (!fl || !pids || !pids.length) return;
  let memo = PM_MEMO.get(fl);
  if (!memo) { memo = {}; PM_MEMO.set(fl, memo); }
  const id = keys.join('|');
  const ix = memo[id] || (memo[id] = { idx: new Map(), has: new Set() });
  const want = new Set(pids.map(String).filter((x) => !ix.has.has(x)));
  if (!want.size) return;
  keys.forEach((k) => {
    const L = fl[k];
    if (!L) return;
    Object.values(L.m).forEach((m) => {
      if (!m || !m.r) return;
      Object.keys(m.r).forEach((pid) => { if (!want.has(pid)) return; const l = ix.idx.get(pid); if (l) l.push(m); else ix.idx.set(pid, [m]); });
    });
  });
  want.forEach((x) => ix.has.add(x));
}
function matchesOfPlayer(fl, keys, pid) {
  const memo = PM_MEMO.get(fl);
  const ix = memo && memo[keys.join('|')];
  if (ix && ix.has.has(pid)) return ix.idx.get(pid) || [];
  const out = [];
  keys.forEach((k) => {
    const L = fl[k];
    if (!L) return;
    Object.values(L.m).forEach((m) => { if (m && m.r && m.r[pid]) out.push(m); });
  });
  return out;
}

export function roleBreakdown(fl, keys, fmPid, stat) {
  if (!fl || !fmPid) return null;
  const pid = String(fmPid);
  const cnt = {};
  const den = {};
  let tot = 0;
  let games = 0;
  matchesOfPlayer(fl, keys, pid).forEach((m) => {
    const me = m.r[pid];
    games += 1;
    const opp = 1 - me[1];
    (m.p || []).forEach(([a, b]) => {
      const ra = m.r[a];
      const rb = m.r[b];
      if (!ra || !rb) return;
      const other = stat === 'fs' ? ra : rb;
      if (other[1] !== opp) return;
      den[other[0]] = (den[other[0]] || 0) + 1;
      if (String(stat === 'fs' ? b : a) === pid) { cnt[other[0]] = (cnt[other[0]] || 0) + 1; tot += 1; }
    });
  });
  if (!tot) return null;
  const rows = Object.keys(cnt).map((role) => ({ role, n: cnt[role], pct: (cnt[role] / tot) * 100, rolePct: den[role] ? (cnt[role] / den[role]) * 100 : 0 }))
    .sort((x, y) => y.n - x.n || y.pct - x.pct);
  const main = [rows[0].role];
  if (rows[1] && rows[0].pct - rows[1].pct <= GAP) main.push(rows[1].role);
  return { rows, tot, games, main };
}

// ruolo piu' frequente di ogni giocatore (id FotMob) nelle partite caricate
const ROLE_MEMO = new WeakMap();
export function playerRoles(fl, keys) {
  if (!fl) return {};
  const id = keys.map((k) => k).join('|');
  let memo = ROLE_MEMO.get(fl);
  if (!memo) { memo = {}; ROLE_MEMO.set(fl, memo); }
  if (memo[id]) return memo[id];
  const c = {};
  keys.forEach((k) => {
    const L = fl[k];
    if (!L) return;
    Object.values(L.m).forEach((m) => {
      Object.entries((m && m.r) || {}).forEach(([pid, v]) => { const o = (c[pid] = c[pid] || {}); o[v[0]] = (o[v[0]] || 0) + 1; });
    });
  });
  const out = {};
  Object.entries(c).forEach(([pid, o]) => { out[pid] = Object.entries(o).sort((a, b) => b[1] - a[1])[0][0]; });
  memo[id] = out;
  return out;
}

// i 2 avversari con la media piu' alta (stessa statistica del roster) nei ruoli principali, solo tra chi ha il minimo di minuti (`ok`)
export function autoDuelIds(rb, roster, roles) {
  if (!rb || !roster || !roster.length) return [];
  return roster.filter((r) => r.ok && rb.main.includes(roles[r.id])).sort((a, b) => b.avg90 - a.avg90).slice(0, DUEL_N).map((r) => r.id);
}

// Duello automatico per un giocatore (usato anche da Migliori Giocatori e scheda giocatore): media dei 2 scelti e media del campionato.
export function autoDuel(fd, fl, keys, fmPid, stat, oppDom, oppFm) {
  const rb = roleBreakdown(fl, keys, fmPid, stat);
  if (!rb || !oppDom || !oppFm) return null;
  const oppStat = stat === 'fc' ? 'fs' : 'fc';
  const roster = rosterFouls(fd, oppDom, oppFm, oppStat);
  const ids = autoDuelIds(rb, roster, playerRoles(fl, keys));
  if (!ids.length) return null;
  const sel = roster.filter((r) => ids.includes(r.id));
  return { ids, avg: sel.reduce((s, r) => s + r.avg90, 0) / sel.length, leagueAvg: leaguePlayerAvg(fd, oppDom, oppStat), rb };
}
