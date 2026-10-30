// Indice dei giocatori (pidx/<id%100>.json, giocatori_indice.py): per ogni id FotMob tutte le competizioni e stagioni giocate.
import { BASE } from './load';
import useAsync from '@/hooks/useAsync';
import { carriereOf, loadCarriere } from './carriere';
import { loadRose, roseOf, rosePlayer } from './rose';
import { loadPlayerStats, loadPlayerStatsFor, playerSeasonLine, currentSeason, sortSeasons, FM_ID, LID_BY_FM } from './archive';
import { playerById } from './players';
import { teamById } from './teams';
import { archivePercentiles } from '@/components/player/playerCalc';
import { leagueById } from './leagues';

const SH = {};
const shard = (n) => {
  if (!SH[n]) SH[n] = fetch(`${BASE}pidx/${n}.json`).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
  return SH[n];
};
// righe [fm, stagione, idSquadra, presenze, minuti] dalla piu' recente
export const loadPidx = async (pid) => {
  if (!pid) return [];
  const e = (await shard(Number(pid) % 100))[String(pid)];
  return e ? e.slice(1) : [];
};

const nm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

// id FotMob del giocatore: carriere.json, poi id dell'archivio, poi rosa della squadra, poi statistiche della stagione in corso
const PID = {};
export const resolvePid = (player) => {
  if (!player) return Promise.resolve(null);
  if (!PID[player.id]) {
    PID[player.id] = (async () => {
      await Promise.all([loadCarriere(), loadRose()]);
      const c = carriereOf(player.id);
      if (c && c.fm) return String(c.fm);
      const m = /^fm~\d+~[^~]+~(\d+)$/.exec(player.id || '');
      if (m) return m[1];
      const team = teamById(player.teamId);
      const n = nm(player.name);
      const ro = team ? roseOf(team) : null;
      const hit = ro && (ro.p || []).find((r) => nm(r[1]) === n);
      if (hit) return String(hit[0]);
      const fm = FM_ID[(team && team.leagueId) || player.leagueId];
      if (fm) {
        const sk = await currentSeason(fm);
        const st = sk ? await loadPlayerStats(fm, sk) : null;
        const L = (st && st.players) || {};
        for (const k of Object.keys(L)) {
          if (k.startsWith('_')) continue;
          const r = (L[k] || []).find((x) => nm(x[1]) === n);
          if (r) return String(r[0]);
        }
      }
      return null;
    })();
  }
  return PID[player.id];
};

// pid + competizioni giocate (id app, dalla piu' recente) + stagioni per competizione
export function usePlayerCareer(player) {
  const { data } = useAsync(async () => {
    const pid = await resolvePid(player);
    const rows = pid ? await loadPidx(pid) : [];
    const cur = {};
    await Promise.all([...new Set(rows.map((r) => r[0]))].map(async (fm) => { cur[fm] = await currentSeason(fm); }));
    const bySeason = {};
    const order = [];
    rows.forEach((r) => {
      const lid = LID_BY_FM[r[0]];
      if (!lid || !leagueById(lid)) return;
      if (!bySeason[lid]) { bySeason[lid] = []; order.push(lid); }
      bySeason[lid].push(r[1]);
    });
    return { pid, rows, order, bySeason, cur };
  }, [player && player.id]);
  return data || { pid: null, rows: [], order: [], bySeason: {}, cur: {}, loading: true };
}
export { sortSeasons };

// percentili calcolati dalle statistiche dell'archivio (stagione in corso del campionato, o quella dell'id archivio)
export function useArchivePct(player, enabled) {
  const { data } = useAsync(async () => {
    if (!enabled) return null;
    const pid = await resolvePid(player);
    if (!pid) return null;
    const lid = player.archive ? player.leagueId : (teamById(player.teamId) || {}).leagueId;
    const fm = FM_ID[lid];
    if (!fm) return null;
    const sk = player.archive && player.sk ? player.sk : await currentSeason(fm);
    const st = sk ? await loadPlayerStatsFor(fm, sk, pid) : null;
    return archivePercentiles(st, pid);
  }, [player && player.id, enabled]);
  return data || null;
}

// Numeri del Profilo: gli stessi della scheda Statistiche e dell'elenco Partite (archivio, campionato della stagione in corso, o stagione dell'id archivio).
// Se l'archivio non ha il giocatore restano quelli dell'app.
export function usePlayerSeason(player) {
  const { data } = useAsync(async () => {
    const pid = await resolvePid(player);
    if (!pid) return null;
    const lid = player.archive ? player.leagueId : (teamById(player.teamId) || {}).leagueId || player.leagueId;
    const fm = FM_ID[lid];
    if (!fm) return null;
    const sk = player.archive && player.sk ? player.sk : await currentSeason(fm);
    return sk ? playerSeasonLine(fm, sk, pid) : null;
  }, [player && player.id]);
  return data ? { ...player, ...data, rating: data.rating || player.rating } : player;
}

export function useBioPid(player) {
  const { data } = useAsync(() => resolvePid(player), [player && player.id]);
  return data || null;
}
