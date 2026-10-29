import { useSyncExternalStore } from 'react';
import { MATCH_BY_ID } from './matches';
import { teamById, } from './teams';
import { playersByTeam } from './players';
import { norm } from './util';
import { FM_ID, curSeasonSync } from './archive';
import { archiveId } from './archivePlayer';
import { roseOf } from './rose';
import { RAW } from './load';

// Stato condiviso della tendina giocatore (si apre da formazioni, riassunto, tiri…).
let state = null;
const subs = new Set();
const emit = () => subs.forEach((f) => f());
export const openPlayer = (p) => { state = p; emit(); };
export const closePlayer = () => { state = null; emit(); };
export const usePlayerSheet = () => useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => state);

// Trova il giocatore dentro la partita (per id FotMob o per nome).
export function findInMatch(match, name, fmId) {
  if (!match) return null;
  const n = norm(name);
  for (const side of ['home', 'away']) {
    const lu = match.lineup && match.lineup[side];
    if (!lu) continue;
    const all = [...(lu.xi || []), ...(lu.bench || [])];
    const hit = all.find((p) => (fmId && String(p.fmId) === String(fmId)) || norm(p.name) === n) || all.find((p) => n && norm(p.name).split(' ').slice(-1)[0] === n.split(' ').slice(-1)[0] && norm(p.name)[0] === n[0]);
    if (hit) return { side, entry: hit, team: teamById(side === 'home' ? match.homeId : match.awayId), fmId: hit.fmId || fmId || null };
  }
  return null;
}

// id nel nostro archivio giocatori (per la scheda completa)
export function ourPlayerId(match, name, fmId) {
  const f = findInMatch(match, name, fmId);
  if (f && f.entry.linkable) return f.entry.playerId;
  const teams = f ? [f.team] : [teamById(match && match.homeId), teamById(match && match.awayId)].filter(Boolean);
  const n = norm(name);
  for (const t of teams) {
    const p = playersByTeam(t.id).find((x) => norm(x.name) === n);
    if (p) return p.id;
  }
  // campionati e coppe aggiunti (e chiunque non sia nell'elenco principale): scheda costruita dall'archivio, id fm~<lega>~<stagione>~<id FotMob>
  const e = f && f.entry;
  let pid = (f && f.fmId) || fmId || (e && !e.linkable && /^\d+$/.test(String(e.playerId)) ? String(e.playerId) : null);
  if (!pid) {
    for (const t of teams) {
      const ro = roseOf(t);
      const r = ro && (ro.p || []).find((x) => norm(x[1]) === n);
      if (r) { pid = String(r[0]); break; }
    }
  }
  if (!pid) return null;
  // prima il campionato della squadra (banner e statistiche di campionato), poi la competizione della partita
  const team = (f && f.team) || teams[0];
  const cands = [team && team.leagueId, match && match.leagueId].filter(Boolean);
  for (const lid of cands) {
    const fm = FM_ID[lid];
    const sk = fm && ((RAW.extra && RAW.extra.sk && RAW.extra.sk[String(fm)]) || curSeasonSync(fm));
    if (fm && sk) return archiveId(fm, sk, pid);
  }
  if (match && match.archive && match.archive.sk) return archiveId(match.archive.fm, match.archive.sk, pid);
  return null;
}

export const matchOf = (id) => MATCH_BY_ID[id] || null;
