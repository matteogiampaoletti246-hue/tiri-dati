// Indice squadre (tidx/<id%100>.json, squadre_indice.py): per ogni id FotMob tutte le competizioni e stagioni giocate dal 2010.
import { BASE } from './load';
import { FM_ID, LID_BY_FM, archIndex, teamLogo } from './archive';
import { ensureTeam, teamByFm } from './teams';
import { leagueById } from './leagues';
import { isWomenComp, isWomenName, womenName } from './teamMatch';

const SH = {};
const shard = (n) => {
  if (!SH[n]) SH[n] = fetch(`${BASE}tidx/${n}.json`).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
  return SH[n];
};

// id FotMob della squadra: quello noto, altrimenti dallo stemma (teamlogo/<id>.png)
export const teamFmId = (team) => (team && (team.fmId || (/teamlogo\/(\d+)\.png/.exec(String(team.crest || '')) || [])[1])) || null;

// Scheda unica per qualunque squadra dell'indice (/squadra/fm-<id FotMob>): se e' gia' nell'app si usa quella, altrimenti
// si crea dalla riga di tidx: nome, campionato = la competizione nazionale a punti giocata piu' di recente, stemma FotMob e colori
// ricavati dallo stemma (ensureTeam -> crestColor), mai a caso.
export const teamFromIndex = async (fid) => {
  const hit = teamByFm(fid);
  if (hit) return hit;
  const [idx, d] = await Promise.all([archIndex(), shard(Number(fid) % 100)]);
  const e = d && d[String(fid)];
  if (!e) return null;
  const [name, ...comps] = e;
  const kind = (fm) => { const x = idx && idx[String(fm)]; return x ? (x.c === 'INT' ? 2 : x.type === 'cup' ? 1 : 0) : 3; };
  const best = comps.filter(([fm]) => LID_BY_FM[fm] && leagueById(LID_BY_FM[fm]))
    .sort((a, b) => kind(a[0]) - kind(b[0]) || String(b[1][0] || '').localeCompare(String(a[1][0] || '')))[0];
  // squadra che gioca solo competizioni femminili: stesso nome delle schede ("Barcelona F"), anche con un indice ancora vecchio
  const women = comps.length > 0 && comps.every(([fm]) => isWomenComp(fm, idx && idx[String(fm)] && idx[String(fm)].n));
  const t = ensureTeam(women || isWomenName(name) ? womenName(name) : name, best ? LID_BY_FM[best[0]] : null, teamLogo(fid), String(fid), `fm-${fid}`);
  if (t && !t.fmId) t.fmId = String(fid);
  return t;
};

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
