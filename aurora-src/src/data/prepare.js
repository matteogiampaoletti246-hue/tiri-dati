import { lruSet } from '@/lib/lru';
// Prepara una partita PRIMA di mostrarla: calendario della stagione (archivio), dettaglio, FotMob, riserve.
// Una sola promessa per partita: la Home la avvia appena si tocca la riga, la pagina la riusa (niente caricamento a due tempi).
import { matchById, ensureDetail } from './matches';
import { parseArchiveId, buildArchiveMatch, completeExtraMatch, applyArchiveFallback } from './archiveMatch';
import { loadFm, fmDay } from './fotmob';
import { playerLookup } from './players';
import { perfLog, perfTime } from '@/lib/perfMon';
import { isPureCup, loadBracket } from './bracket';
import { loadWeather } from './weather';
import { archIndex, FM_ID } from './archive';
import { refTwoSeasons } from './referees';
import { loadRose } from './rose';
import { designatedReferee } from './arbitriDesignati';

const P = new Map();

const fresh = (id, e) => {
  const m = matchById(id);
  const ttl = m && (m.status === 'live' || (m.status === 'scheduled' && m.ts - Date.now() < 3 * 3600000)) ? 4000 : 300000;
  return Date.now() - e.at < ttl;
};

// pronta = gia' preparata una volta (anche se da aggiornare): riaprendola si mostra subito e prepareMatch la rinfresca dietro,
// prima dopo 5 minuti (15 s se live) tornava lo spinner intero
export const isReady = (id) => {
  const e = P.get(id);
  return !!(e && (e.done || e.was));
};

// solo i dati principali (dettaglio + FotMob): dopo questi la pagina nativa e' gia' utilizzabile
export function prepareMatchCore(id) {
  const p = prepareMatch(id);
  const e = P.get(id);
  return e && e.core && !e.done ? e.core : p;
}

export function prepareMatch(id, force = false) {
  const e = P.get(id);
  if (!force && e && (!e.done || fresh(id, e))) return e.p;
  let resolveCore = () => {};
  const entry = { at: Date.now(), done: false, p: null, was: !!(e && (e.done || e.was)), core: new Promise((r) => { resolveCore = r; }) };
  const t0 = performance.now();
  perfLog(`partita: preparo ${String(id).slice(0, 18)}`);
  entry.p = (async () => {
    try {
      const arch = parseArchiveId(id);
      const raw0 = matchById(id);
      if (raw0 && raw0.date && !raw0.fmId) fmDay(raw0.date).catch(() => null); // elenco FotMob del giorno in parallelo al dettaglio: prima partiva dopo (0,5-1 s in meno)
      const needPrep = arch ? !(raw0 && raw0.archReady) : !!(raw0 && raw0.archive && !raw0.archReady);
      if (needPrep) await (arch ? buildArchiveMatch(arch.fm, arch.sk, arch.mid) : completeExtraMatch(matchById(id))).catch(() => null);
      await ensureDetail(id, playerLookup);
      await loadFm(matchById(id), playerLookup, force);
      const mm = matchById(id);
      if (mm && mm.archive && !mm.detail) applyArchiveFallback(mm);
      resolveCore(); // dati principali pronti: la pagina nativa si mostra subito, meteo/arbitro/rose arrivano dopo
      // arbitro designato dalla UEFA o da altre fonti (arbitri_uefa.py, arbitri_extra.py) se FotMob non lo da' ancora
      if (mm && !mm.refereeName && mm.fmId) {
        const n = await Promise.race([designatedReferee(mm.fmId), new Promise((r) => setTimeout(() => r(null), 1500))]);
        if (n) mm.refereeName = n;
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
          cap(refTwoSeasons((mm.archive && mm.archive.fm) || FM_ID[mm.leagueId], mm.refereeName).then((t) => { mm.refTwo = t; }), 1500),
        ]);
      }
    } catch { /* si mostra comunque cio' che c'e' */ }
    perfTime('partita pronta in', t0);
    resolveCore();
    entry.done = true;
    entry.at = Date.now();
    return matchById(id);
  })();
  // al massimo 30 partite pronte in memoria: le piu' vecchie lasciano i dati pesanti (partite della stagione) e si ricostruiscono se riaperte
  lruSet(P, id, entry, 30, (oldId) => { const om = matchById(oldId); if (om && om.archive && oldId !== id) { om.det = null; om.moreDet = null; om.archReady = false; om._km = null; } });
  return entry.p;
}
