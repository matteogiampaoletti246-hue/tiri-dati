// Indice dei giocatori (pidx/<id%100>.json, giocatori_indice.py): per ogni id FotMob tutte le competizioni e stagioni giocate.
import { BASE } from './load';
import useAsync from '@/hooks/useAsync';
import { carriereOf, loadCarriere } from './carriere';
import { loadRose, roseOf, rosePlayer, rosaOf } from './rose';
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

import { resolvePid, nm } from './playerPid';
export { resolvePid };

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
    const fm = (!player.archive && player.domFm) || FM_ID[lid];
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
  const { data, loading } = useAsync(async () => {
    const pid = await resolvePid(player);
    if (!pid) return null;
    const lid = player.archive ? player.leagueId : (teamById(player.teamId) || {}).leagueId || player.leagueId;
    // campionato nazionale della squadra (profili.py) prima della coppa in cui la squadra compare nell'app
    const fm = (!player.archive && player.domFm) || FM_ID[lid];
    if (!fm) return null;
    const sk = player.archive && player.sk ? player.sk : await currentSeason(fm);
    return sk ? playerSeasonLine(fm, sk, pid) : null;
  }, [player && player.id]);
  if (data) return { ...player, ...data, rating: data.rating || player.rating };
  // finche' non arriva, chi non e' in stats.json non ha gol e assist veri: spazio vuoto, mai uno "0" che poi cambia
  return loading && !player.hasStats && !player.archive ? { ...player, goals: ' ', assists: ' ', appearances: ' ', minutes: ' ' } : player;
}

export function useBioPid(player) {
  const { data } = useAsync(() => resolvePid(player), [player && player.id]);
  return data || null;
}
