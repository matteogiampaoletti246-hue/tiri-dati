import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import LeagueBadge from './LeagueBadge';
import LeagueLink from './LeagueLink';
import MatchRow from './MatchRow';
import { tintGrad } from '@/lib/tint';
import { leagueTint, TOP5 } from '@/data/leagues';

// Campionati sempre aperti: i top 5 e le coppe europee. Tutti gli altri si aprono a tendina e partono chiusi.
const ALWAYS_OPEN = new Set([...TOP5, 'champions-league', 'europa-league', 'conference-league']);
// tendine aperte a mano: restano aperte finche' l'app non viene riaperta
const OPEN = new Set();

/* Tre transizioni di apertura (concept A, B, C) */
function Collapse({ open, concept, children }) {
  // mounted: contenuto presente; shown: stato "aperto" della transizione
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(open);
  const inner = useRef(null);
  const [h, setH] = useState(open ? 'auto' : 0);
  const timer = useRef(0);

  const first = useRef(true);
  useLayoutEffect(() => {
    // al primo disegno lo stato e' gia' quello giusto: nessuna animazione
    if (first.current) { first.current = false; return undefined; }
    clearTimeout(timer.current);
    if (open) {
      setMounted(true);
      if (concept === 'c') {
        // altezza misurata: da 0 al valore reale, poi libera
        setH(0);
        requestAnimationFrame(() => requestAnimationFrame(() => {
          const el = inner.current;
          setShown(true);
          setH(el ? el.scrollHeight : 'auto');
          timer.current = setTimeout(() => setH('auto'), 420);
        }));
      } else {
        requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      }
    } else {
      if (concept === 'c') {
        const el = inner.current;
        setH(el ? el.scrollHeight : 0);
        requestAnimationFrame(() => requestAnimationFrame(() => { setShown(false); setH(0); }));
      } else setShown(false);
      timer.current = setTimeout(() => setMounted(false), concept === 'b' ? 320 : 380);
    }
    return () => clearTimeout(timer.current);
  }, [open, concept]);

  if (!mounted) return null;

  if (concept === 'c') {
    return (
      <div style={{ height: h, overflow: 'hidden', opacity: shown ? 1 : 0, transform: shown ? 'scaleY(1)' : 'scaleY(.94)', transformOrigin: 'top', transition: 'height .4s cubic-bezier(.34,1.25,.64,1), opacity .28s ease, transform .4s cubic-bezier(.34,1.25,.64,1)' }}>
        <div ref={inner}>{children}</div>
      </div>
    );
  }
  return (
    <div style={{ display: 'grid', gridTemplateRows: shown ? '1fr' : '0fr', opacity: shown ? 1 : 0, transition: concept === 'b' ? 'grid-template-rows .3s cubic-bezier(.22,1,.36,1), opacity .2s ease' : 'grid-template-rows .36s cubic-bezier(.45,.05,.2,1), opacity .36s ease' }}>
      <div ref={inner} style={{ overflow: 'hidden', minHeight: 0 }} data-stagger={concept === 'b' && shown ? '1' : '0'}>
        {concept === 'b' ? (
          <div>{Array.isArray(children) ? children.map((c, i) => <div key={c.key || i} style={{ opacity: shown ? 1 : 0, transform: shown ? 'none' : 'translateY(-8px)', transition: `opacity .26s ease ${shown ? 40 + i * 45 : 0}ms, transform .3s cubic-bezier(.22,1,.36,1) ${shown ? 40 + i * 45 : 0}ms` }}>{c}</div>) : children}</div>
        ) : children}
      </div>
    </div>
  );
}

export default function LeagueGroup({ league, matches, concept = 'a', forceOpen = false }) {
  const fixed = ALWAYS_OPEN.has(league.id);
  const [open, setOpen] = useState(() => fixed || forceOpen || OPEN.has(league.id));
  const isOpen = fixed || forceOpen || open;
  const toggle = () => {
    const nx = !open;
    setOpen(nx);
    if (nx) OPEN.add(league.id); else OPEN.delete(league.id);
  };
  // se cambia lo stato forzato (filtro Live) la tendina segue
  useEffect(() => { if (forceOpen) setOpen(OPEN.has(league.id)); }, [forceOpen, league.id]);

  const rows = matches.map((m, i) => (
    <div key={m.id} style={{ borderTop: '1px solid var(--hair-2)' }}>
      <MatchRow match={m} />
    </div>
  ));

  const head = (
    <>
      <LeagueBadge league={league} size={22} />
      <span className="flex-1 truncate text-[12.5px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink)' }}>
        {league.name}
      </span>
      <span className="tnum text-[11px] font-medium" style={{ color: 'var(--ink-3)' }}>
        {matches.length}
      </span>
    </>
  );

  return (
    <section className="mx-4 mt-4 overflow-hidden rounded-[26px] glass" style={{ background: tintGrad(leagueTint(league.id), 0x45), contentVisibility: fixed ? 'auto' : undefined, containIntrinsicSize: fixed ? 'auto 330px' : undefined }}>
      {fixed ? (
        <LeagueLink league={league} className="press flex items-center gap-3 px-4 pb-3 pt-3.5">
          {head}
          <ChevronRight size={16} strokeWidth={1.8} style={{ color: 'var(--ink-3)' }} />
        </LeagueLink>
      ) : (
        <div className="flex items-center">
          <LeagueLink league={league} className="press py-3.5 pl-4 pr-3"><LeagueBadge league={league} size={22} /></LeagueLink>
          <button type="button" onClick={toggle} aria-expanded={isOpen} className="press flex min-w-0 flex-1 items-center gap-3 py-3.5 pl-0 pr-4 text-left">
            <span className="flex-1 truncate text-[12.5px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink)' }}>{league.name}</span>
            <span className="tnum text-[11px] font-medium" style={{ color: 'var(--ink-3)' }}>{matches.length}</span>
            <ChevronDown size={17} strokeWidth={1.9} style={{ color: 'var(--ink-3)', transition: 'transform .34s cubic-bezier(.22,1,.36,1)', transform: isOpen ? 'rotate(180deg)' : 'none' }} />
          </button>
        </div>
      )}
      {fixed ? <div className="border-t" style={{ borderColor: 'var(--hair-2)' }}>{matches.map((m, i) => (
        <div key={m.id} style={{ borderTop: i ? '1px solid var(--hair-2)' : 'none' }}>
          <MatchRow match={m} />
        </div>
      ))}</div> : <Collapse open={isOpen} concept={concept}>{rows}</Collapse>}
    </section>
  );
}
