// Indice squadre (tidx/<id%100>.json, squadre_indice.py): per ogni id FotMob tutte le competizioni e stagioni giocate dal 2010.
import { BASE } from './load';
import { FM_ID, LID_BY_FM } from './archive';
import { leagueById } from './leagues';

const SH = {};
const shard = (n) => {
  if (!SH[n]) SH[n] = fetch(`${BASE}tidx/${n}.json`).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
  return SH[n];
};

// id FotMob della squadra: quello noto, altrimenti dallo stemma (teamlogo/<id>.png)
export const teamFmId = (team) => (team && (team.fmId || (/teamlogo\/(\d+)\.png/.exec(String(team.crest || '')) || [])[1])) || null;

// { lid -> [stagioni dalla piu' recente] } per le competizioni dell'app; null se la squadra non e' nell'indice
const MEM = {};
export const teamHistory = (team) => {
  const fid = teamFmId(team);
  if (!fid) return Promise.resolve(null);
  if (!MEM[fid]) {
    MEM[fid] = shard(Number(fid) % 100).then((d) => {
      const e = d && d[String(fid)];
      if (!e) return null;
      const out = {};
      e.slice(1).forEach(([fm, sks]) => { const lid = LID_BY_FM[fm]; if (lid && leagueById(lid)) out[lid] = sks; });
      return out;
    });
  }
  return MEM[fid];
};
