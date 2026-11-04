// Precarico al tocco: appena il dito tocca un link (pointerdown, ~100 ms prima del click) partono i file della pagina che si aprira'.
// I caricatori tengono le promesse in memoria (`once`, `shard`): l'apertura vera le ritrova in corso o gia' pronte, niente richieste doppie.
// Le partite hanno gia' il loro precarico (`prepareMatch` al tocco di MatchRow / ArchRow).
import { lruGet, lruSet } from './lru';
import { loadSeason, loadSeasonStats } from '@/data/archive';
import { teamFromIndex } from '@/data/teamIndex';
import { teamById } from '@/data/teams';
import { playerById } from '@/data/players';
import { parseArchiveId } from '@/data/archivePlayer';
import { loadCarriere } from '@/data/carriere';
import { loadRose } from '@/data/rose';

const SEEN = new Map(); // rotte gia' precaricate (capienza fissa)
const routeOf = (el) => {
  const a = el && el.closest && el.closest('a[href]');
  const h = a ? a.getAttribute('href') || '' : '';
  const i = h.indexOf('#');
  return i >= 0 ? h.slice(i + 1).split('?')[0] : '';
};

function warm(r) {
  let m = /^\/storico\/([^/]+)\/([^/]+)\/(squadra|giocatore)\//.exec(r);
  if (m) { const fm = decodeURIComponent(m[1]); const sk = decodeURIComponent(m[2]); loadSeason(fm, sk); loadSeasonStats(fm, sk); return; }
  m = /^\/squadra\/fm-(\d+)$/.exec(r);
  if (m) { if (!teamById(`fm-${m[1]}`)) teamFromIndex(m[1]); return; }
  m = /^\/giocatore\/([^/]+)$/.exec(r);
  if (m) {
    const id = decodeURIComponent(m[1]);
    const p = playerById(id);
    const arc = (!p || p.lite) && parseArchiveId(id);
    if (arc) { loadCarriere(); loadRose(); loadSeason(arc.fm, arc.sk); }
  }
}

export function installPrefetch() {
  if (typeof document === 'undefined') return;
  document.addEventListener('pointerdown', (e) => {
    const r = routeOf(e.target);
    if (!r || lruGet(SEEN, r)) return;
    lruSet(SEEN, r, 1, 80);
    try { warm(r); } catch (err) { /* il precarico non deve mai disturbare il tocco */ }
  }, { capture: true, passive: true });
}
