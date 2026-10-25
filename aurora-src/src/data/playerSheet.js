import { useSyncExternalStore } from 'react';
import { MATCH_BY_ID } from './matches';
import { teamById, } from './teams';
import { playersByTeam } from './players';
import { norm } from './util';

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
  return null;
}

export const matchOf = (id) => MATCH_BY_ID[id] || null;
