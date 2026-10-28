// Prepara una partita PRIMA di mostrarla: calendario della stagione (archivio), dettaglio, FotMob, riserve.
// Una sola promessa per partita: la Home la avvia appena si tocca la riga, la pagina la riusa (niente caricamento a due tempi).
import { matchById, ensureDetail } from './matches';
import { parseArchiveId, buildArchiveMatch, completeExtraMatch, applyArchiveFallback } from './archiveMatch';
import { loadFm } from './fotmob';
import { playerLookup } from './players';
import { perfLog, perfTime } from '@/lib/perfMon';

const P = new Map();

const fresh = (id, e) => {
  const m = matchById(id);
  const ttl = m && (m.status === 'live' || (m.status === 'scheduled' && m.ts - Date.now() < 3 * 3600000)) ? 15000 : 300000;
  return Date.now() - e.at < ttl;
};

export const isReady = (id) => {
  const e = P.get(id);
  return !!(e && e.done && fresh(id, e));
};

export function prepareMatch(id, force = false) {
  const e = P.get(id);
  if (!force && e && (!e.done || fresh(id, e))) return e.p;
  const entry = { at: Date.now(), done: false, p: null };
  const t0 = performance.now();
  perfLog(`partita: preparo ${String(id).slice(0, 18)}`);
  entry.p = (async () => {
    try {
      const arch = parseArchiveId(id);
      const raw0 = matchById(id);
      const needPrep = arch ? !(raw0 && raw0.archReady) : !!(raw0 && raw0.archive && !raw0.archReady);
      if (needPrep) await (arch ? buildArchiveMatch(arch.fm, arch.sk, arch.mid) : completeExtraMatch(matchById(id))).catch(() => null);
      await ensureDetail(id, playerLookup);
      await loadFm(matchById(id), playerLookup, force);
      const mm = matchById(id);
      if (mm && mm.archive && !mm.detail) applyArchiveFallback(mm);
    } catch { /* si mostra comunque cio' che c'e' */ }
    perfTime('partita pronta in', t0);
    entry.done = true;
    entry.at = Date.now();
    return matchById(id);
  })();
  P.set(id, entry);
  return entry.p;
}
