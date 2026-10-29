import { lruSet } from '@/lib/lru';
// Prepara una partita PRIMA di mostrarla: calendario della stagione (archivio), dettaglio, FotMob, riserve.
// Una sola promessa per partita: la Home la avvia appena si tocca la riga, la pagina la riusa (niente caricamento a due tempi).
import { matchById, ensureDetail } from './matches';
import { parseArchiveId, buildArchiveMatch, completeExtraMatch, applyArchiveFallback } from './archiveMatch';
import { loadFm } from './fotmob';
import { playerLookup } from './players';
import { perfLog, perfTime } from '@/lib/perfMon';
import { isPureCup, loadBracket } from './bracket';
import { loadWeather } from './weather';
import { archIndex } from './archive';
import { loadRose } from './rose';
import { BASE } from './load';

const P = new Map();
let AR = null;
const arbitriExtra = () => { if (!AR) AR = fetch(`${BASE}arbitri_extra.json`, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : {})).catch(() => ({})); return AR; };

const fresh = (id, e) => {
  const m = matchById(id);
  const ttl = m && (m.status === 'live' || (m.status === 'scheduled' && m.ts - Date.now() < 3 * 3600000)) ? 15000 : 300000;
  return Date.now() - e.at < ttl;
};

// pronta = gia' preparata una volta (anche se da aggiornare): riaprendola si mostra subito e prepareMatch la rinfresca dietro,
// prima dopo 5 minuti (15 s se live) tornava lo spinner intero
export const isReady = (id) => {
  const e = P.get(id);
  return !!(e && (e.done || e.was));
};

export function prepareMatch(id, force = false) {
  const e = P.get(id);
  if (!force && e && (!e.done || fresh(id, e))) return e.p;
  const entry = { at: Date.now(), done: false, p: null, was: !!(e && (e.done || e.was)) };
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
      // arbitro designato da altre fonti (arbitri_extra.py) se FotMob non lo da' ancora
      if (mm && mm.extra && !mm.refereeName && mm.fmId) {
        const ar = await Promise.race([arbitriExtra(), new Promise((r) => setTimeout(() => r(null), 1500))]);
        const hit = ar && ar[String(mm.fmId)];
        if (hit && hit.n) mm.refereeName = hit.n;
      }
      // tabellone (coppe) e meteo pronti prima di mostrare la partita: si sa subito quali schede/voci hanno dati e niente arriva dopo
      if (mm) {
        const cap = (p, ms) => Promise.race([p.catch(() => null), new Promise((r) => setTimeout(r, ms))]);
        await Promise.all([
          mm.archive && isPureCup(mm.archive.fm) && mm.archive.sk ? cap(loadBracket(mm.archive.fm, mm.archive.sk), 2500) : null,
          cap(loadWeather(mm), 1500),
          // per aprire la scheda di qualunque giocatore (anche dei campionati aggiunti) senza attese
          cap(archIndex(), 1500),
          cap(loadRose(), 1500),
        ]);
      }
    } catch { /* si mostra comunque cio' che c'e' */ }
    perfTime('partita pronta in', t0);
    entry.done = true;
    entry.at = Date.now();
    return matchById(id);
  })();
  // al massimo 30 partite pronte in memoria: le piu' vecchie lasciano i dati pesanti (partite della stagione) e si ricostruiscono se riaperte
  lruSet(P, id, entry, 30, (oldId) => { const om = matchById(oldId); if (om && om.archive && oldId !== id) { om.det = null; om.moreDet = null; om.archReady = false; om._km = null; } });
  return entry.p;
}
