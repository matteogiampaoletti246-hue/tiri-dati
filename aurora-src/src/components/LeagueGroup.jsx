import { useLayoutEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import LeagueBadge from './LeagueBadge';
import LeagueLink from './LeagueLink';
import MatchRow from './MatchRow';
import { tintGrad } from '@/lib/tint';
import { leagueTint, TOP5 } from '@/data/leagues';
import { flagEmoji } from '@/data/countries';
import { useSel } from '@/components/past/PastBits';

// Partono aperti i top 5 campionati e le coppe europee; tutti gli altri (e le finestre dei paesi) partono chiusi.
// Ogni campionato ha la sua tendina: lo stato vale solo per il giorno mostrato (cambiando giorno si riparte dal predefinito).
const OPEN_AT_START = new Set([...TOP5, 'champions-league', 'europa-league', 'conference-league']);

// Apertura / chiusura con transizione morbida (altezza + dissolvenza).
function Collapse({ open, children }) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(open);
  const timer = useRef(0);
  const first = useRef(true);

  useLayoutEffect(() => {
    // al primo disegno lo stato e' gia' quello giusto: nessuna animazione
    if (first.current) { first.current = false; return undefined; }
    clearTimeout(timer.current);
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
    } else {
      setShown(false);
      timer.current = setTimeout(() => setMounted(false), 380);
    }
    return () => clearTimeout(timer.current);
  }, [open]);

  if (!mounted) return null;
  return (
    <div style={{ display: 'grid', gridTemplateRows: shown ? '1fr' : '0fr', opacity: shown ? 1 : 0, transition: 'grid-template-rows .36s cubic-bezier(.45,.05,.2,1), opacity .36s ease' }}>
      <div style={{ overflow: 'hidden', minHeight: 0 }}>{children}</div>
    </div>
  );
}

export default function LeagueGroup({ league, matches, iso = '', forceOpen = false }) {
  // la tendina resta com'e' finche' si resta nel giro della Home (apro una partita e torno indietro); cambiando sezione si riparte da zero
  const [open, setOpen] = useSel('home', `${iso}|${league.id}`, () => OPEN_AT_START.has(league.id));
  const isOpen = forceOpen || open;
  const toggle = () => setOpen(!open);

  return (
    <section className="mx-4 mt-4 overflow-hidden rounded-[26px] glass" style={{ background: tintGrad(leagueTint(league.id), 0x45) }}>
      <div className="flex items-center">
        {/* logo e nome: aprono la scheda del campionato */}
        <LeagueLink league={league} className="press flex min-w-0 shrink items-center gap-3 py-3.5 pl-4 pr-3">
          <LeagueBadge league={league} size={22} />
          <span className="truncate text-[12.5px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink)' }}>{league.name}</span>
        </LeagueLink>
        {/* tutto il resto della riga (spazio vuoto, numero e freccia) apre e chiude la tendina */}
        <button type="button" onClick={toggle} aria-expanded={isOpen} aria-label={isOpen ? 'Chiudi partite' : 'Apri partite'} className="press flex min-w-[56px] flex-1 items-center justify-end gap-2 self-stretch pl-3 pr-4">
          <span className="tnum text-[11px] font-medium" style={{ color: 'var(--ink-3)' }}>{matches.length}</span>
          <ChevronDown size={17} strokeWidth={1.9} style={{ color: 'var(--ink-3)', transition: 'transform .34s cubic-bezier(.22,1,.36,1)', transform: isOpen ? 'rotate(180deg)' : 'none' }} />
        </button>
      </div>
      <Collapse open={isOpen}>
        <div className="border-t" style={{ borderColor: 'var(--hair-2)' }}>
          {matches.map((m, i) => (
            <div key={m.id} style={{ borderTop: i ? '1px solid var(--hair-2)' : 'none' }}>
              <MatchRow match={m} />
            </div>
          ))}
        </div>
      </Collapse>
    </section>
  );
}

// Bandiera tonda del paese (globo se il paese non ha una bandiera)
export const CountryFlag = ({ cc, size = 22 }) => (
  <span className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full" style={{ width: size, height: size, fontSize: size * 0.78, lineHeight: 1, background: 'rgba(255,255,255,.08)' }} aria-hidden="true">
    {flagEmoji(cc) || '\u{1F30D}'}
  </span>
);

// Finestra di un paese (concept Sofascore): bandiera + nome aprono e chiudono; dentro, in ordine di importanza, ogni competizione
// con la sua intestazione (logo e nome portano alla scheda competizione) e le sue partite. Chiusa non monta nulla.
export function CountryGroup({ cc, name, comps, iso = '', forceOpen = false }) {
  const [open, setOpen] = useSel('home', `${iso}|paese:${cc}`, false);
  const isOpen = forceOpen || open;
  const total = comps.reduce((n, c) => n + c.matches.length, 0);
  return (
    // chiusa ha un'altezza fissa nota: fuori schermo il browser la salta (stile, layout e disegno) senza cambiare l'altezza della pagina
    <section data-country={cc} className="mx-4 mt-4 overflow-hidden rounded-[26px] glass" style={isOpen ? undefined : { contentVisibility: 'auto', containIntrinsicSize: 'auto 52px' }}>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={isOpen} aria-label={`${name}: ${isOpen ? 'chiudi' : 'apri'} competizioni`} className="press flex w-full items-center gap-3 py-3.5 pl-4 pr-4 text-left">
        <CountryFlag cc={cc} />
        <span className="min-w-0 flex-1 truncate text-[12.5px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink)' }}>{name}</span>
        <span className="tnum text-[11px] font-medium" style={{ color: 'var(--ink-3)' }}>{total}</span>
        <ChevronDown size={17} strokeWidth={1.9} style={{ color: 'var(--ink-3)', transition: 'transform .34s cubic-bezier(.22,1,.36,1)', transform: isOpen ? 'rotate(180deg)' : 'none' }} />
      </button>
      <Collapse open={isOpen}>
        {comps.map(({ league, matches }) => (
          <div key={league.id} className="border-t" style={{ borderColor: 'var(--hair-2)', background: tintGrad(leagueTint(league.id), 0x22) }}>
            <LeagueLink league={league} className="press flex min-w-0 items-center gap-3 py-3 pl-4 pr-4">
              <LeagueBadge league={league} size={20} />
              <span className="truncate text-[12px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink)' }}>{league.name}</span>
            </LeagueLink>
            {matches.map((m) => (
              <div key={m.id} style={{ borderTop: '1px solid var(--hair-2)' }}>
                <MatchRow match={m} />
              </div>
            ))}
          </div>
        ))}
      </Collapse>
    </section>
  );
}
